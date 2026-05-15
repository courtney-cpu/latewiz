import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/late-api";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  const { postId } = await params;
  try {
    const body = await request.json();
    const late = getServerClient();
    const { data, error } = await late.comments.replyToInboxPost({
      path: { postId },
      body,
    });
    if (error) return NextResponse.json({ error }, { status: 500 });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Failed to post reply" }, { status: 500 });
  }
}
