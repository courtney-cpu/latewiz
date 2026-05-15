import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/late-api";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const profileId = searchParams.get("profileId") ?? undefined;
  const platform = searchParams.get("platform") ?? undefined;
  const accountId = searchParams.get("accountId") ?? undefined;
  const status = (searchParams.get("status") ?? undefined) as "active" | "archived" | undefined;
  const sortOrder = (searchParams.get("sortOrder") ?? undefined) as "asc" | "desc" | undefined;
  const limit = searchParams.get("limit") ? Number(searchParams.get("limit")) : undefined;
  const cursor = searchParams.get("cursor") ?? undefined;

  try {
    const late = getServerClient();
    const { data, error } = await late.messages.listInboxConversations({
      query: { profileId, platform: platform as any, accountId, status, sortOrder, limit, cursor },
    });
    if (error) return NextResponse.json({ error }, { status: 500 });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Failed to fetch conversations" }, { status: 500 });
  }
}
