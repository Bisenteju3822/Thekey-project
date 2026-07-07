import { Elysia } from "elysia";

export interface AuthUser {
  userId: string;
  role: "student" | "moderator";
}

/**
 * Auth middleware — reads stubbed identity from request headers.
 * Headers: x-user-id, x-user-role
 * Returns 401 if missing.
 */
export const authMiddleware = new Elysia({ name: "auth" }).derive(
  { as: "scoped" },
  ({ headers }): { user: AuthUser } => {
    const userId = headers["x-user-id"];
    const role = headers["x-user-role"] as "student" | "moderator" | undefined;

    if (!userId || !role) {
      throw new Response(JSON.stringify({ error: "Unauthenticated" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (role !== "student" && role !== "moderator") {
      throw new Response(JSON.stringify({ error: "Invalid role" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    return { user: { userId, role } };
  }
);
