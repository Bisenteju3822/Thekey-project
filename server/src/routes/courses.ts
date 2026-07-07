import { Elysia } from "elysia";
import { authMiddleware } from "../middleware/auth.js";
import { db } from "../db/index.js";
import { courses, enrollments } from "../db/schema.js";
import { eq } from "drizzle-orm";

export const coursesRoutes = new Elysia({ prefix: "/api/courses" })
  .use(authMiddleware)

  // GET /api/courses — list courses for current user
  .get("/", async ({ user }) => {
    if (user.role === "moderator") {
      // Moderators see all courses
      return { data: db.select().from(courses).all() };
    }

    // Students see only enrolled courses
    const enrolled = db
      .select({ course: courses })
      .from(enrollments)
      .innerJoin(courses, eq(courses.id, enrollments.courseId))
      .where(eq(enrollments.userId, user.userId))
      .all();

    return { data: enrolled.map((e) => e.course) };
  });
