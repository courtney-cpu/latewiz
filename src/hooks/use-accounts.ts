import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCurrentProfileId } from "./use-profiles";
import type { Platform } from "@/lib/late-api";

export const accountKeys = {
  all: ["accounts"] as const,
  list: (profileId: string) => ["accounts", "list", profileId] as const,
  health: (profileId: string) => ["accounts", "health", profileId] as const,
  detail: (accountId: string) => ["accounts", "detail", accountId] as const,
};

export interface Account {
  _id: string;
  platform: Platform;
  username: string;
  displayName?: string;
  isActive: boolean;
  profilePicture?: string;
  profileId: string;
  createdAt: string;
  updatedAt: string;
}

export interface AccountHealth {
  accountId: string;
  isHealthy: boolean;
  error?: string;
}

export function useAccounts(profileId?: string) {
  const currentProfileId = useCurrentProfileId();
  const targetProfileId = profileId || currentProfileId;

  return useQuery({
    queryKey: accountKeys.list(targetProfileId || ""),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (targetProfileId) params.set("profileId", targetProfileId);
      const res = await fetch(`/api/zernio/accounts?${params}`);
      if (!res.ok) throw new Error("Failed to fetch accounts");
      return res.json();
    },
    enabled: !!targetProfileId,
  });
}

export function useAccountsHealth(profileId?: string) {
  const currentProfileId = useCurrentProfileId();
  const targetProfileId = profileId || currentProfileId;

  return useQuery({
    queryKey: accountKeys.health(targetProfileId || ""),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (targetProfileId) params.set("profileId", targetProfileId);
      const res = await fetch(`/api/zernio/accounts/health?${params}`);
      if (!res.ok) throw new Error("Failed to fetch account health");
      return res.json();
    },
    enabled: !!targetProfileId,
  });
}

export function useDeleteAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (accountId: string) => {
      const res = await fetch(`/api/zernio/accounts/${accountId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to disconnect account");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accountKeys.all });
    },
  });
}

export function useAccountsByPlatform(profileId?: string) {
  const { data, ...rest } = useAccounts(profileId);

  const accountsByPlatform = data?.accounts?.reduce(
    (acc: Record<Platform, Account[]>, account: Account) => {
      const platform = account.platform as Platform;
      if (!acc[platform]) acc[platform] = [];
      acc[platform].push(account);
      return acc;
    },
    {} as Record<Platform, Account[]>
  );

  return { data: accountsByPlatform, accounts: data?.accounts, ...rest };
}
