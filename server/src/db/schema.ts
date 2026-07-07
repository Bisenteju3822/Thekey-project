import { sqliteTable, text, integer, uniqueIndex } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  role: text("role", { enum: ["student", "moderator"] }).notNull().default("student"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

export const courses = sqliteTable("courses", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

export const enrollments = sqliteTable(
  "enrollments",
  {
    userId: text("user_id").notNull().references(() => users.id),
    courseId: text("course_id").notNull().references(() => courses.id),
  },
  (table) => [
    uniqueIndex("enrollment_unique").on(table.userId, table.courseId),
  ]
);

export const posts = sqliteTable("posts", {
  id: text("id").primaryKey(),
  courseId: text("course_id").notNull().references(() => courses.id),
  authorId: text("author_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  body: text("body").notNull(),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  deletedAt: text("deleted_at"),
});

// Saved posts — the core bookmark table
// unique constraint on (userId, postId) prevents duplicate rows
// `active` column enables soft delete: unsave sets active=0, re-save sets active=1
export const savedPosts = sqliteTable(
  "saved_posts",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => users.id),
    postId: text("post_id").notNull().references(() => posts.id),
    active: integer("active", { mode: "boolean" }).notNull().default(true),
    createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
    updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
  },
  (table) => [
    uniqueIndex("saved_post_unique").on(table.userId, table.postId),
  ]
);

// Type exports
export type User = typeof users.$inferSelect;
export type Course = typeof courses.$inferSelect;
export type Post = typeof posts.$inferSelect;
export type SavedPost = typeof savedPosts.$inferSelect;
