import { NextRequest, NextResponse } from "next/server";

export function getAuth(req: NextRequest) {
  const userId = req.headers.get("x-user-id");
  const role = req.headers.get("x-user-role") as "student" | "moderator" | null;

  if (!userId || !role || (role !== "student" && role !== "moderator")) {
    return { error: NextResponse.json({ error: "Unauthenticated" }, { status: 401 }) };
  }

  return { user: { userId, role } };
}
