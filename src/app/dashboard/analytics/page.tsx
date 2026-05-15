"use client";

import { useState, useMemo } from "react";
import { useAnalytics, useFollowerStats } from "@/hooks/use-analytics";
import { useAccounts } from "@/hooks";
import { PlatformIcon } from "@/components/shared/platform-icon";
import { PLATFORM_NAMES, type Platform } from "@/lib/late-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart2,
  TrendingUp,
  Heart,
  MessageCircle,
  Share2,
  Eye,
  Users,
  MousePointerClick,
  Play,
  FileText,
  Trophy,
} from "lucide-react";
import { format, subDays } from "date-fns";

type DateRange = "7d" | "30d" | "90d";
type SortField = "date" | "engagement";

const DATE_RANGES: Record<DateRange, { label: string; days: number }> = {
  "7d": { label: "Last 7 days", days: 7 },
  "30d": { label: "Last 30 days", days: 30 },
  "90d": { label: "Last 90 days", days: 90 },
};

function formatNum(n?: number | null) {
  if (n == null) return "—";
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toLocaleString();
}

function engagementScore(a: any) {
  return (a.likes || 0) + (a.comments || 0) + (a.shares || 0) + (a.clicks || 0);
}

export default function AnalyticsPage() {
  const [range, setRange] = useState<DateRange>("30d");
  const [sortBy, setSortBy] = useState<SortField>("date");
  const [platformFilter, setPlatformFilter] = useState<string>("all");

  const toDate = format(new Date(), "yyyy-MM-dd");
  const fromDate = format(subDays(new Date(), DATE_RANGES[range].days), "yyyy-MM-dd");

  const { data, isLoading, isError } = useAnalytics({
    fromDate,
    toDate,
    sortBy,
    order: "desc",
    limit: 100,
  });

  const { data: accountsData } = useAccounts();
  const accounts = accountsData?.accounts || [];

  const accountIds = accounts.map((a: any) => a._id).join(",");
  const { data: followerData, isLoading: followerLoading } = useFollowerStats(
    accountIds || undefined,
    fromDate,
    toDate
  );
  const followerAccounts: any[] = (followerData as any)?.accounts || [];
  const followerMap = useMemo(() => {
    const m: Record<string, { currentFollowers?: number; growth?: number }> = {};
    followerAccounts.forEach((a) => { m[a._id] = a; });
    return m;
  }, [followerAccounts]);
  const totalFollowers = useMemo(
    () => followerAccounts.reduce((sum, a) => sum + (a.currentFollowers || 0), 0),
    [followerAccounts]
  );
  const totalGrowth = useMemo(
    () => followerAccounts.reduce((sum, a) => sum + (a.growth || 0), 0),
    [followerAccounts]
  );

  const allPosts = (data as any)?.posts || [];
  const overview = (data as any)?.overview || {};

  const posts = useMemo(() => {
    if (platformFilter === "all") return allPosts;
    return allPosts.filter((p: any) =>
      p.platforms?.some((pl: any) => pl.platform === platformFilter) ||
      p.platform === platformFilter
    );
  }, [allPosts, platformFilter]);

  const summary = useMemo(() => {
    return allPosts.reduce(
      (acc: any, post: any) => {
        const a = post.analytics || {};
        return {
          likes: acc.likes + (a.likes || 0),
          comments: acc.comments + (a.comments || 0),
          shares: acc.shares + (a.shares || 0),
          impressions: acc.impressions + (a.impressions || 0),
          reach: acc.reach + (a.reach || 0),
          clicks: acc.clicks + (a.clicks || 0),
          views: acc.views + (a.views || 0),
        };
      },
      { likes: 0, comments: 0, shares: 0, impressions: 0, reach: 0, clicks: 0, views: 0 }
    );
  }, [allPosts]);

  const topPost = useMemo(() => {
    if (!allPosts.length) return null;
    return [...allPosts].sort(
      (a, b) => engagementScore(b.analytics || {}) - engagementScore(a.analytics || {})
    )[0];
  }, [allPosts]);

  const platforms = useMemo(() => {
    const set = new Set<string>();
    allPosts.forEach((p: any) => {
      if (p.platform) set.add(p.platform);
      p.platforms?.forEach((pl: any) => pl.platform && set.add(pl.platform));
    });
    return Array.from(set);
  }, [allPosts]);

  const publishedCount = overview.publishedPosts ?? allPosts.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Analytics</h1>
          <p className="text-muted-foreground text-sm">Performance across your connected accounts.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {(["7d", "30d", "90d"] as DateRange[]).map((r) => (
            <Button
              key={r}
              variant={range === r ? "default" : "outline"}
              size="sm"
              onClick={() => setRange(r)}
            >
              {DATE_RANGES[r].label}
            </Button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {[
          { label: "Posts", value: publishedCount, icon: FileText, loading: isLoading, growth: null },
          { label: "Likes", value: summary.likes, icon: Heart, loading: isLoading, growth: null },
          { label: "Comments", value: summary.comments, icon: MessageCircle, loading: isLoading, growth: null },
          { label: "Shares", value: summary.shares, icon: Share2, loading: isLoading, growth: null },
          { label: "Clicks", value: summary.clicks, icon: MousePointerClick, loading: isLoading, growth: null },
          { label: "Views", value: summary.views, icon: Play, loading: isLoading, growth: null },
          { label: "Followers", value: totalFollowers, icon: Users, loading: followerLoading, growth: totalGrowth },
        ].map(({ label, value, icon: Icon, loading, growth }) => (
          <Card key={label}>
            <CardHeader className="p-3 pb-1">
              <CardTitle className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Icon className="h-3 w-3" />
                {label}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              {loading ? (
                <div className="h-7 w-16 animate-pulse rounded bg-muted" />
              ) : (
                <>
                  <span className="text-2xl font-bold">{formatNum(value)}</span>
                  {growth !== null && growth !== 0 && (
                    <p className={`text-[10px] mt-0.5 ${growth > 0 ? "text-emerald-600" : "text-red-500"}`}>
                      {growth > 0 ? "+" : ""}{formatNum(growth)} this period
                    </p>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Top performing post */}
      {!isLoading && topPost && (
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Trophy className="h-4 w-4 text-amber-500" />
              Top Performing Post
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="flex gap-4">
              {topPost.thumbnailUrl && (
                <img
                  src={topPost.thumbnailUrl}
                  alt=""
                  className="h-16 w-16 flex-shrink-0 rounded-lg object-cover"
                />
              )}
              <div className="min-w-0 flex-1">
                <div className="mb-2 flex items-center gap-2">
                  {(topPost.platform || topPost.platforms?.[0]?.platform) && (
                    <PlatformIcon
                      platform={(topPost.platform || topPost.platforms?.[0]?.platform) as Platform}
                      size="sm"
                      showColor
                    />
                  )}
                  <span className="text-[11px] text-muted-foreground">
                    {topPost.publishedAt
                      ? format(new Date(topPost.publishedAt), "MMM d, yyyy")
                      : "—"}
                  </span>
                </div>
                <p className="mb-3 line-clamp-2 text-sm">
                  {topPost.content || "—"}
                </p>
                <div className="flex flex-wrap gap-4 text-xs">
                  {[
                    { label: "Likes", value: topPost.analytics?.likes },
                    { label: "Comments", value: topPost.analytics?.comments },
                    { label: "Shares", value: topPost.analytics?.shares },
                    { label: "Clicks", value: topPost.analytics?.clicks },
                    { label: "Views", value: topPost.analytics?.views },
                    { label: "Reach", value: topPost.analytics?.reach },
                  ]
                    .filter(({ value }) => value != null && value > 0)
                    .map(({ label, value }) => (
                      <div key={label} className="text-center">
                        <p className="font-semibold">{formatNum(value)}</p>
                        <p className="text-muted-foreground">{label}</p>
                      </div>
                    ))}
                  {topPost.analytics?.engagementRate != null && (
                    <div className="text-center">
                      <p className="font-semibold">
                        {(topPost.analytics.engagementRate * 100).toFixed(2)}%
                      </p>
                      <p className="text-muted-foreground">Eng. Rate</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Connected accounts / follower counts */}
      {accounts.length > 0 && (
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-medium">Connected Accounts</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="flex flex-wrap gap-3">
              {accounts.map((acc: any) => {
                const fs = followerMap[acc._id];
                return (
                  <div key={acc._id} className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2">
                    <PlatformIcon platform={acc.platform as Platform} size="sm" showColor />
                    <div>
                      <p className="text-xs font-medium">{acc.displayName || acc.username}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {PLATFORM_NAMES[acc.platform as Platform]}
                      </p>
                      {fs?.currentFollowers != null && (
                        <p className="text-[10px] font-medium">
                          {formatNum(fs.currentFollowers)} followers
                          {fs.growth != null && fs.growth !== 0 && (
                            <span className={fs.growth > 0 ? " text-emerald-600" : " text-red-500"}>
                              {" "}{fs.growth > 0 ? "+" : ""}{formatNum(fs.growth)}
                            </span>
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Post breakdown */}
      <Card>
        <CardHeader className="p-4 pb-2">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart2 className="h-4 w-4" />
              Post Performance
            </CardTitle>
            <div className="flex items-center gap-2">
              {platforms.length > 1 && (
                <Select value={platformFilter} onValueChange={setPlatformFilter}>
                  <SelectTrigger className="h-8 w-36 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All platforms</SelectItem>
                    {platforms.map((p) => (
                      <SelectItem key={p} value={p}>
                        {PLATFORM_NAMES[p as Platform] || p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortField)}>
                <SelectTrigger className="h-8 w-36 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Sort by date</SelectItem>
                  <SelectItem value="engagement">Sort by engagement</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <PostsSkeleton />
          ) : isError ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              Failed to load analytics. Please try again.
            </div>
          ) : posts.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              No published posts found in this period.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Post</th>
                    <th className="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground">Platform</th>
                    <th className="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground">Date</th>
                    <th className="px-3 py-2.5 text-right text-xs font-medium text-muted-foreground">Likes</th>
                    <th className="px-3 py-2.5 text-right text-xs font-medium text-muted-foreground">Comments</th>
                    <th className="px-3 py-2.5 text-right text-xs font-medium text-muted-foreground">Shares</th>
                    <th className="px-3 py-2.5 text-right text-xs font-medium text-muted-foreground">Clicks</th>
                    <th className="px-3 py-2.5 text-right text-xs font-medium text-muted-foreground">Views</th>
                    <th className="px-3 py-2.5 text-right text-xs font-medium text-muted-foreground">Reach</th>
                    <th className="px-3 py-2.5 text-right text-xs font-medium text-muted-foreground pr-4">Eng. Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {posts.map((post: any, i: number) => {
                    const a = post.analytics || {};
                    const platform = post.platform || post.platforms?.[0]?.platform;
                    const date = post.publishedAt
                      ? format(new Date(post.publishedAt), "MMM d, yyyy")
                      : "—";
                    return (
                      <tr
                        key={post._id || i}
                        className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-4 py-3 max-w-[200px]">
                          <div className="flex items-center gap-2">
                            {post.thumbnailUrl && (
                              <img
                                src={post.thumbnailUrl}
                                alt=""
                                className="h-8 w-8 rounded object-cover flex-shrink-0"
                              />
                            )}
                            <span className="truncate text-xs text-muted-foreground">
                              {post.content?.slice(0, 60) || "—"}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          {platform && (
                            <div className="flex items-center gap-1.5">
                              <PlatformIcon platform={platform as Platform} size="sm" showColor />
                              <span className="text-xs hidden sm:inline">
                                {PLATFORM_NAMES[platform as Platform] || platform}
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-3 text-xs text-muted-foreground whitespace-nowrap">{date}</td>
                        <td className="px-3 py-3 text-right text-xs">{formatNum(a.likes)}</td>
                        <td className="px-3 py-3 text-right text-xs">{formatNum(a.comments)}</td>
                        <td className="px-3 py-3 text-right text-xs">{formatNum(a.shares)}</td>
                        <td className="px-3 py-3 text-right text-xs">{formatNum(a.clicks)}</td>
                        <td className="px-3 py-3 text-right text-xs">{formatNum(a.views)}</td>
                        <td className="px-3 py-3 text-right text-xs">{formatNum(a.reach)}</td>
                        <td className="px-3 py-3 text-right text-xs pr-4">
                          {a.engagementRate != null
                            ? `${(a.engagementRate * 100).toFixed(2)}%`
                            : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function PostsSkeleton() {
  return (
    <div className="space-y-0">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 border-b border-border px-4 py-3 animate-pulse">
          <div className="h-8 w-8 rounded bg-muted flex-shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-2.5 w-48 rounded bg-muted" />
          </div>
          <div className="h-2.5 w-10 rounded bg-muted" />
          <div className="h-2.5 w-10 rounded bg-muted" />
          <div className="h-2.5 w-10 rounded bg-muted" />
          <div className="h-2.5 w-10 rounded bg-muted" />
          <div className="h-2.5 w-10 rounded bg-muted" />
          <div className="h-2.5 w-10 rounded bg-muted" />
        </div>
      ))}
    </div>
  );
}
