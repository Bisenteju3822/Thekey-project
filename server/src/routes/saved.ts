import { Elysia, t } from "elysia";
import { authMiddleware } from "../middleware/auth.js";
import { db } from "../db/index.js";
import {
  savePost,
  unsavePost,
  getSavedList,
  getPostById,
  isEnrolled,
} from "../services/saved-posts.service.js";

export const savedRoutes = new Elysia({ prefix: "/api" })
  .use(authMiddleware)

  // POST /api/posts/:postId/save — save (bookmark) a post
  .post(
    "/posts/:postId/save",
    async ({ user, params, set }) => {
      const post = await getPostById(db, params.postId);
      if (!post || post.deletedAt) {
        set.status = 404;
        return { error: "Post not found" };
      }

      // Students must be enrolled in the post's course
      if (user.role !== "moderator") {
        const enrolled = await isEnrolled(db, user.userId, post.courseId);
        if (!enrolled) {
          set.status = 403;
          return { error: "Not enrolled in this course" };
        }
      }

      const result = await savePost(db, user.userId, params.postId);
      return { success: true, action: result };
    },
    {
      params: t.Object({ postId: t.String() }),
    }
  )

  // DELETE /api/posts/:postId/save — unsave a post
  .delete(
    "/posts/:postId/save",
    async ({ user, params, set }) => {
      const post = await getPostById(db, params.postId);
      if (!post || post.deletedAt) {
        set.status = 404;
        return { error: "Post not found" };
      }

      if (user.role !== "moderator") {
        const enrolled = await isEnrolled(db, user.userId, post.courseId);
        if (!enrolled) {
          set.status = 403;
          return { error: "Not enrolled in this course" };
        }
      }

      const result = await unsavePost(db, user.userId, params.postId);
      return { success: true, action: result };
    },
    {
      params: t.Object({ postId: t.String() }),
    }
  )

  // GET /api/saved — current user's saved posts
  .get(
    "/saved",
    async ({ user, query }) => {
      const page = Number(query.page ?? 1);
      const limit = Number(query.limit ?? 10);

      const result = await getSavedList(db, user.userId, page, limit);
      return {
        data: result.posts,
        pagination: {
          page,
          limit,
          total: result.total,
          totalPages: Math.ceil(result.total / limit),
        },
      };
    },
    {
      query: t.Object({
        page: t.Optional(t.String()),
        limit: t.Optional(t.String()),
      }),
    }
  );
