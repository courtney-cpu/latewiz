import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/late-api";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const accountIds = searchParams.get("accountIds") ?? undefined;
  const fromDate = searchParams.get("fromDate") ?? undefined;
  const toDate = searchParams.get("toDate") ?? undefined;

  try {
    const late = getServerClient();
    const { data, error } = await late.accounts.getFollowerStats({
      query: { accountIds, fromDate, toDate },
    });
    if (error) return NextResponse.json({ error }, { status: 500 });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Failed to fetch follower stats" }, { status: 500 });
  }
}
