import { eq, and, desc, sql, inArray } from "drizzle-orm";
import { savedPosts, posts, enrollments } from "../db/schema.js";
import type { DB } from "../db/index.js";
import { randomUUID } from "crypto";

// ── Pure helpers (testable without DB) ──────────────────────

/** Determine the next state of a saved-post record */
export function resolveToggle(
  existing: { active: boolean } | undefined,
  action: "save" | "unsave"
): "create" | "activate" | "deactivate" | "noop" {
  if (action === "save") {
    if (!existing) return "create";
    if (!existing.active) return "activate";
    return "noop"; // already saved → idempotent
  }
  // action === "unsave"
  if (!existing || !existing.active) return "noop"; // nothing to unsave
  return "deactivate";
}

/** Count active saves from a list of records */
export function countActiveSaves(records: { active: boolean }[]): number {
  return records.filter((r) => r.active).length;
}

// ── Database-backed operations ──────────────────────────────

export async function isEnrolled(db: DB, userId: string, courseId: string): Promise<boolean> {
  const row = db
    .select()
    .from(enrollments)
    .where(and(eq(enrollments.userId, userId), eq(enrollments.courseId, courseId)))
    .get();
  return !!row;
}

export async function getPostById(db: DB, postId: string) {
  return db.select().from(posts).where(eq(posts.id, postId)).get();
}

export async function savePost(db: DB, userId: string, postId: string) {
  const existing = db
    .select()
    .from(savedPosts)
    .where(and(eq(savedPosts.userId, userId), eq(savedPosts.postId, postId)))
    .get();

  const action = resolveToggle(existing ? { active: existing.active } : undefined, "save");

  switch (action) {
    case "create":
      db.insert(savedPosts)
        .values({ id: randomUUID(), userId, postId, active: true })
        .run();
      break;
    case "activate":
      db.update(savedPosts)
        .set({ active: true, updatedAt: new Date().toISOString() })
        .where(and(eq(savedPosts.userId, userId), eq(savedPosts.postId, postId)))
        .run();
      break;
    case "noop":
      break;
  }

  return action;
}

export async function unsavePost(db: DB, userId: string, postId: string) {
  const existing = db
    .select()
    .from(savedPosts)
    .where(and(eq(savedPosts.userId, userId), eq(savedPosts.postId, postId)))
    .get();

  const action = resolveToggle(existing ? { active: existing.active } : undefined, "unsave");

  switch (action) {
    case "deactivate":
      db.update(savedPosts)
        .set({ active: false, updatedAt: new Date().toISOString() })
        .where(and(eq(savedPosts.userId, userId), eq(savedPosts.postId, postId)))
        .run();
      break;
    case "noop":
      break;
  }

  return action;
}

export interface FeedPost {
  id: string;
  courseId: string;
  authorId: string;
  authorName: string;
  title: string;
  body: string;
  createdAt: string;
  hasSaved: boolean;
  savesCount: number;
}

export async function getFeed(
  db: DB,
  courseId: string,
  userId: string,
  page: number,
  limit: number
): Promise<{ posts: FeedPost[]; total: number }> {
  const offset = (page - 1) * limit;

  // Get posts for this course (not deleted), newest first
  const feedPosts = db
    .select()
    .from(posts)
    .where(and(eq(posts.courseId, courseId), sql`${posts.deletedAt} IS NULL`))
    .orderBy(desc(posts.createdAt))
    .limit(limit)
    .offset(offset)
    .all();

  const totalResult = db
    .select({ count: sql<number>`count(*)` })
    .from(posts)
    .where(and(eq(posts.courseId, courseId), sql`${posts.deletedAt} IS NULL`))
    .get();

  const total = totalResult?.count ?? 0;

  if (feedPosts.length === 0) return { posts: [], total };

  const hydrated = await hydratePostFlags(db, feedPosts, userId);

  return { posts: hydrated, total };
}

export async function getSavedList(
  db: DB,
  userId: string,
  page: number,
  limit: number
): Promise<{ posts: FeedPost[]; total: number }> {
  const offset = (page - 1) * limit;

  // Get the user's active saved posts, most-recently-saved first
  const savedRows = db
    .select({
      postId: savedPosts.postId,
      savedUpdatedAt: savedPosts.updatedAt,
    })
    .from(savedPosts)
    .where(and(eq(savedPosts.userId, userId), eq(savedPosts.active, true)))
    .orderBy(desc(savedPosts.updatedAt))
    .limit(limit)
    .offset(offset)
    .all();

  const totalResult = db
    .select({ count: sql<number>`count(*)` })
    .from(savedPosts)
    .where(and(eq(savedPosts.userId, userId), eq(savedPosts.active, true)))
    .get();

  const total = totalResult?.count ?? 0;

  if (savedRows.length === 0) return { posts: [], total };

  const postIds = savedRows.map((r) => r.postId);
  const postRows = db
    .select()
    .from(posts)
    .where(and(inArray(posts.id, postIds), sql`${posts.deletedAt} IS NULL`))
    .all();

  // Maintain the saved-order
  const postMap = new Map(postRows.map((p) => [p.id, p]));
  const orderedPosts = savedRows
    .map((r) => postMap.get(r.postId))
    .filter((p): p is NonNullable<typeof p> => !!p);

  const hydrated = await hydratePostFlags(db, orderedPosts, userId);
  return { posts: hydrated, total };
}

async function hydratePostFlags(
  db: DB,
  postRows: { id: string; courseId: string; authorId: string; title: string; body: string; createdAt: string }[],
  currentUserId: string
): Promise<FeedPost[]> {
  if (postRows.length === 0) return [];

  const postIds = postRows.map((p) => p.id);

  // Batch: get all save records for these posts
  const allSaves = db
    .select()
    .from(savedPosts)
    .where(and(inArray(savedPosts.postId, postIds), eq(savedPosts.active, true)))
    .all();

  // Build counts map and hasSaved map
  const countsMap = new Map<string, number>();
  const hasSavedMap = new Map<string, boolean>();

  for (const postId of postIds) {
    countsMap.set(postId, 0);
    hasSavedMap.set(postId, false);
  }

  for (const save of allSaves) {
    countsMap.set(save.postId, (countsMap.get(save.postId) ?? 0) + 1);
    if (save.userId === currentUserId) {
      hasSavedMap.set(save.postId, true);
    }
  }

  // Get author names
  const { users } = await import("../db/schema.js");
  const authorIds = [...new Set(postRows.map((p) => p.authorId))];
  const authorRows = db
    .select({ id: users.id, name: users.name })
    .from(users)
    .where(inArray(users.id, authorIds))
    .all();
  const authorMap = new Map(authorRows.map((a) => [a.id, a.name]));

  return postRows.map((p) => ({
    id: p.id,
    courseId: p.courseId,
    authorId: p.authorId,
    authorName: authorMap.get(p.authorId) ?? "Unknown",
    title: p.title,
    body: p.body,
    createdAt: p.createdAt,
    hasSaved: hasSavedMap.get(p.id) ?? false,
    savesCount: countsMap.get(p.id) ?? 0,
  }));
}

export async function deletePost(db: DB, postId: string) {
  db.update(posts)
    .set({ deletedAt: new Date().toISOString() })
    .where(eq(posts.id, postId))
    .run();
}
