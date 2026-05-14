import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/late-api";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const profileId = searchParams.get("profileId")!;
  const queueId = searchParams.get("queueId") ?? undefined;

  try {
    const late = getServerClient();
    const { data, error } = await late.queue.getNextQueueSlot({ query: { profileId, queueId } });
    if (error) return NextResponse.json({ error }, { status: 500 });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Failed to get next queue slot" }, { status: 500 });
  }
}
