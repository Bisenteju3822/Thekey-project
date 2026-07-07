import { describe, it, expect, beforeAll } from "bun:test";
import { Elysia } from "elysia";
import { postsRoutes } from "../src/routes/posts.js";
import { savedRoutes } from "../src/routes/saved.js";
import { coursesRoutes } from "../src/routes/courses.js";

// Build a test app instance
const app = new Elysia()
  .use(coursesRoutes)
  .use(postsRoutes)
  .use(savedRoutes)
  .onError(({ error, set }) => {
    if (error instanceof Response) {
      set.status = error.status as number;
      return error.json();
    }
    set.status = 500;
    return { error: "Internal server error" };
  });

function req(path: string, options: RequestInit = {}) {
  return app.handle(new Request(`http://localhost${path}`, options));
}

function authHeaders(userId: string, role: string): Record<string, string> {
  return {
    "x-user-id": userId,
    "x-user-role": role,
    "Content-Type": "application/json",
  };
}

describe("Authorization boundaries", () => {
  it("returns 401 when no auth headers", async () => {
    const res = await req("/api/courses");
    expect(res.status).toBe(401);
  });

  it("returns 403 when student accesses a course they are not enrolled in", async () => {
    // user-1 (Alice) is NOT enrolled in course-2
    const res = await req("/api/courses/course-2/posts", {
      headers: authHeaders("user-1", "student"),
    });
    expect(res.status).toBe(403);
  });

  it("allows moderator to access any course", async () => {
    const res = await req("/api/courses/course-2/posts", {
      headers: authHeaders("user-5", "moderator"),
    });
    expect(res.status).toBe(200);
  });

  it("returns 404 for a non-existent post save", async () => {
    const res = await req("/api/posts/nonexistent/save", {
      method: "POST",
      headers: authHeaders("user-1", "student"),
    });
    expect(res.status).toBe(404);
  });
});

describe("Happy path — save/unsave flow", () => {
  it("fetches feed for an enrolled student", async () => {
    // user-1 (Alice) is enrolled in course-1
    const res = await req("/api/courses/course-1/posts", {
      headers: authHeaders("user-1", "student"),
    });
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.data).toBeDefined();
    expect(body.data.length).toBeGreaterThan(0);
    // Each post should have hasSaved and savesCount
    expect(body.data[0]).toHaveProperty("hasSaved");
    expect(body.data[0]).toHaveProperty("savesCount");
  });

  it("saves a post and verifies idempotency", async () => {
    // user-4 (Diana) saves post-1 in course-1
    const res1 = await req("/api/posts/post-1/save", {
      method: "POST",
      headers: authHeaders("user-4", "student"),
    });
    expect(res1.status).toBe(200);

    // Saving again should be a noop (idempotent)
    const res2 = await req("/api/posts/post-1/save", {
      method: "POST",
      headers: authHeaders("user-4", "student"),
    });
    expect(res2.status).toBe(200);
    const body2 = await res2.json() as any;
    expect(body2.action).toBe("noop");
  });

  it("unsaves a post and preserves history (soft delete)", async () => {
    // Unsave the post we just saved
    const res = await req("/api/posts/post-1/save", {
      method: "DELETE",
      headers: authHeaders("user-4", "student"),
    });
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.action).toBe("deactivate");

    // Re-save should reactivate (not create duplicate)
    const res2 = await req("/api/posts/post-1/save", {
      method: "POST",
      headers: authHeaders("user-4", "student"),
    });
    expect(res2.status).toBe(200);
    const body2 = await res2.json() as any;
    expect(body2.action).toBe("activate");
  });

  it("returns saved posts list for current user only", async () => {
    const res = await req("/api/saved", {
      headers: authHeaders("user-1", "student"),
    });
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.data).toBeDefined();
    expect(Array.isArray(body.data)).toBe(true);
  });
});
