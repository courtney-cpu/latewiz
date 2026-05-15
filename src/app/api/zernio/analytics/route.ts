import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/late-api";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const profileId = searchParams.get("profileId") ?? undefined;
  const fromDate = searchParams.get("fromDate") ?? undefined;
  const toDate = searchParams.get("toDate") ?? undefined;
  const platform = searchParams.get("platform") ?? undefined;
  const sortBy = (searchParams.get("sortBy") ?? undefined) as "date" | "engagement" | undefined;
  const order = (searchParams.get("order") ?? undefined) as "asc" | "desc" | undefined;
  const page = searchParams.get("page") ? Number(searchParams.get("page")) : undefined;
  const limit = searchParams.get("limit") ? Number(searchParams.get("limit")) : 50;

  try {
    const late = getServerClient();
    const { data, error } = await late.analytics.getAnalytics({
      query: { profileId, fromDate, toDate, platform, sortBy, order, page, limit },
    });
    if (error) return NextResponse.json({ error }, { status: 500 });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
