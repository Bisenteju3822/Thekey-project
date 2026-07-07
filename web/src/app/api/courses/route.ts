import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import { store } from "@/lib/store";

export async function GET(req: NextRequest) {
  const auth = getAuth(req);
  if ("error" in auth) return auth.error;

  const data = store.getCourses(auth.user.userId, auth.user.role);
  return NextResponse.json({ data });
}
