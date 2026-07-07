import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import { store } from "@/lib/store";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  const auth = getAuth(req);
  if ("error" in auth) return auth.error;

  const { postId } = await params;
  const { userId, role } = auth.user;

  const post = store.getPost(postId);
  if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });

  if (role !== "moderator" && !store.isEnrolled(userId, post.courseId)) {
    return NextResponse.json({ error: "Not enrolled in this course" }, { status: 403 });
  }

  const action = store.savePost(userId, postId);
  return NextResponse.json({ success: true, action });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  const auth = getAuth(req);
  if ("error" in auth) return auth.error;

  const { postId } = await params;
  const { userId, role } = auth.user;

  const post = store.getPost(postId);
  if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });

  if (role !== "moderator" && !store.isEnrolled(userId, post.courseId)) {
    return NextResponse.json({ error: "Not enrolled in this course" }, { status: 403 });
  }

  const action = store.unsavePost(userId, postId);
  return NextResponse.json({ success: true, action });
}
