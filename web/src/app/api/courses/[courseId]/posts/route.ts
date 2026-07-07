import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import { store } from "@/lib/store";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const auth = getAuth(req);
  if ("error" in auth) return auth.error;

  const { courseId } = await params;
  const { userId, role } = auth.user;

  if (role !== "moderator" && !store.isEnrolled(userId, courseId)) {
    return NextResponse.json({ error: "Not enrolled in this course" }, { status: 403 });
  }

  const page = Number(req.nextUrl.searchParams.get("page") ?? 1);
  const limit = Number(req.nextUrl.searchParams.get("limit") ?? 10);

  return NextResponse.json(store.getFeed(courseId, userId, page, limit));
}
