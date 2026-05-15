import { useQuery } from "@tanstack/react-query";
import { useCurrentProfileId } from "./use-profiles";

export const analyticsKeys = {
  all: ["analytics"] as const,
  list: (profileId: string, fromDate: string, toDate: string, platform?: string, sortBy?: string) =>
    ["analytics", "list", profileId, fromDate, toDate, platform, sortBy] as const,
  followerStats: (accountIds?: string, fromDate?: string) =>
    ["analytics", "follower-stats", accountIds, fromDate] as const,
};

export interface AnalyticsFilters {
  fromDate: string;
  toDate: string;
  platform?: string;
  sortBy?: "date" | "engagement";
  order?: "asc" | "desc";
  limit?: number;
}

export function useAnalytics(filters: AnalyticsFilters) {
  const profileId = useCurrentProfileId();

  return useQuery({
    queryKey: analyticsKeys.list(
      profileId || "",
      filters.fromDate,
      filters.toDate,
      filters.platform,
      filters.sortBy
    ),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (profileId) params.set("profileId", profileId);
      params.set("fromDate", filters.fromDate);
      params.set("toDate", filters.toDate);
      if (filters.platform) params.set("platform", filters.platform);
      if (filters.sortBy) params.set("sortBy", filters.sortBy);
      if (filters.order) params.set("order", filters.order);
      params.set("limit", String(filters.limit ?? 100));
      const res = await fetch(`/api/zernio/analytics?${params}`);
      if (!res.ok) throw new Error("Failed to fetch analytics");
      return res.json();
    },
    enabled: !!profileId && !!filters.fromDate && !!filters.toDate,
  });
}

export function useFollowerStats(accountIds?: string, fromDate?: string, toDate?: string) {
  return useQuery({
    queryKey: analyticsKeys.followerStats(accountIds, fromDate),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (accountIds) params.set("accountIds", accountIds);
      if (fromDate) params.set("fromDate", fromDate);
      if (toDate) params.set("toDate", toDate);
      const res = await fetch(`/api/zernio/analytics/follower-stats?${params}`);
      if (!res.ok) throw new Error("Failed to fetch follower stats");
      return res.json();
    },
    enabled: true,
  });
}
