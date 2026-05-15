import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/late-api";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  const { postId } = await params;
  const { searchParams } = request.nextUrl;
  const accountId = searchParams.get("accountId")!;
  const limit = searchParams.get("limit") ? Number(searchParams.get("limit")) : undefined;
  const cursor = searchParams.get("cursor") ?? undefined;

  try {
    const late = getServerClient();
    const { data, error } = await late.comments.getInboxPostComments({
      path: { postId },
      query: { accountId, limit, cursor },
    });
    if (error) return NextResponse.json({ error }, { status: 500 });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Failed to fetch post comments" }, { status: 500 });
  }
}
