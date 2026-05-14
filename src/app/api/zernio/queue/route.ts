import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/late-api";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const profileId = searchParams.get("profileId")!;
  const queueId = searchParams.get("queueId") ?? undefined;
  const all = searchParams.get("all") ?? undefined;

  try {
    const late = getServerClient();
    const { data, error } = await late.queue.listQueueSlots({
      query: { profileId, queueId, all: all as any },
    });
    if (error) return NextResponse.json({ error }, { status: 500 });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Failed to fetch queue" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const late = getServerClient();
    const { data, error } = await late.queue.createQueueSlot({ body });
    if (error) return NextResponse.json({ error }, { status: 500 });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Failed to create queue" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const late = getServerClient();
    const { data, error } = await late.queue.updateQueueSlot({ body });
    if (error) return NextResponse.json({ error }, { status: 500 });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Failed to update queue" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const profileId = searchParams.get("profileId")!;
  const queueId = searchParams.get("queueId")!;

  try {
    const late = getServerClient();
    const { data, error } = await late.queue.deleteQueueSlot({ query: { profileId, queueId } });
    if (error) return NextResponse.json({ error }, { status: 500 });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Failed to delete queue" }, { status: 500 });
  }
}
