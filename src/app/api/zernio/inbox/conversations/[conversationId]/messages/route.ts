import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/late-api";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const { conversationId } = await params;
  const { searchParams } = request.nextUrl;
  const accountId = searchParams.get("accountId")!;

  try {
    const late = getServerClient();
    const { data, error } = await late.messages.getInboxConversationMessages({
      path: { conversationId },
      query: { accountId },
    });
    if (error) return NextResponse.json({ error }, { status: 500 });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const { conversationId } = await params;
  try {
    const body = await request.json();
    const late = getServerClient();
    const { data, error } = await late.messages.sendInboxMessage({
      path: { conversationId },
      body,
    });
    if (error) return NextResponse.json({ error }, { status: 500 });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
