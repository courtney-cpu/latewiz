import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/late-api";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const late = getServerClient();
    const { data, error } = await late.media.getMediaPresignedUrl({ body });
    if (error) return NextResponse.json({ error }, { status: 500 });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Failed to get upload URL" }, { status: 500 });
  }
}
