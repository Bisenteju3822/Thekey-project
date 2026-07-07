import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import { store } from "@/lib/store";

export async function GET(req: NextRequest) {
  const auth = getAuth(req);
  if ("error" in auth) return auth.error;

  const page = Number(req.nextUrl.searchParams.get("page") ?? 1);
  const limit = Number(req.nextUrl.searchParams.get("limit") ?? 10);

  return NextResponse.json(store.getSavedList(auth.user.userId, page, limit));
}
