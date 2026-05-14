import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/late-api";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const profileId = searchParams.get("profileId")!;
  const count = searchParams.get("count") ? Number(searchParams.get("count")) : 10;

  try {
    const late = getServerClient();
    const { data, error } = await late.queue.previewQueue({ query: { profileId, count } });
    if (error) return NextResponse.json({ error }, { status: 500 });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Failed to preview queue" }, { status: 500 });
  }
}
