import { Elysia, t } from "elysia";
import { authMiddleware } from "../middleware/auth.js";
import { db } from "../db/index.js";
import { getFeed, getPostById, deletePost, isEnrolled } from "../services/saved-posts.service.js";

export const postsRoutes = new Elysia({ prefix: "/api/courses" })
  .use(authMiddleware)

  // GET /api/courses/:courseId/posts — paginated feed
  .get(
    "/:courseId/posts",
    async ({ user, params, query, set }) => {
      const { courseId } = params;
      const page = Number(query.page ?? 1);
      const limit = Number(query.limit ?? 10);

      // Moderators can see any course; students must be enrolled
      if (user.role !== "moderator") {
        const enrolled = await isEnrolled(db, user.userId, courseId);
        if (!enrolled) {
          set.status = 403;
          return { error: "Not enrolled in this course" };
        }
      }

      const result = await getFeed(db, courseId, user.userId, page, limit);
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
      params: t.Object({ courseId: t.String() }),
      query: t.Object({
        page: t.Optional(t.String()),
        limit: t.Optional(t.String()),
      }),
    }
  )

  // DELETE /api/courses/:courseId/posts/:postId — moderator only
  .delete(
    "/:courseId/posts/:postId",
    async ({ user, params, set }) => {
      if (user.role !== "moderator") {
        set.status = 403;
        return { error: "Only moderators can delete posts" };
      }

      const post = await getPostById(db, params.postId);
      if (!post || post.deletedAt) {
        set.status = 404;
        return { error: "Post not found" };
      }

      await deletePost(db, params.postId);
      return { success: true };
    },
    {
      params: t.Object({ courseId: t.String(), postId: t.String() }),
    }
  );
