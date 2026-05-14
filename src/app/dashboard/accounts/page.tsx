"use client";

import { useMemo } from "react";
import { useAccounts, useAccountsHealth } from "@/hooks";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AccountAvatar } from "@/components/accounts";
import { PLATFORM_NAMES, type Platform } from "@/lib/late-api";
import { Users, AlertCircle } from "lucide-react";

export default function AccountsPage() {
  const { data: accountsData, isLoading } = useAccounts();
  const { data: healthData } = useAccountsHealth();

  const accounts = (accountsData?.accounts || []) as any[];
  const healthMap = useMemo(
    () =>
      new Map<string, any>(
        healthData?.accounts?.map((a: any) => [a.accountId, a] as [string, any]) || []
      ),
    [healthData]
  );

  return (
    <div className="mx-auto max-w-2xl space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold">Accounts</h1>
        <p className="text-muted-foreground">Your connected social media accounts.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4" />
            Connected Accounts
          </CardTitle>
          <CardDescription>
            {accounts.length} {accounts.length === 1 ? "account" : "accounts"} connected
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            <AccountsLoadingSkeleton />
          ) : accounts.length === 0 ? (
            <div className="rounded-lg bg-muted p-6 text-center text-sm text-muted-foreground">
              No accounts connected yet.
            </div>
          ) : (
            accounts.map((account: any) => {
              const health = healthMap.get(account._id);
              const needsReconnect = health?.status === "needs_reconnect";

              return (
                <div
                  key={account._id}
                  className="flex items-center justify-between rounded-lg bg-muted p-3"
                >
                  <div className="flex items-center gap-3">
                    <AccountAvatar account={account} size="sm" />
                    <div>
                      <p className="text-sm font-medium">
                        {account.displayName || account.username}
                      </p>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {PLATFORM_NAMES[account.platform as Platform]}
                        </Badge>
                        {needsReconnect && (
                          <span className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                            <AlertCircle className="h-3 w-3" /> Needs reconnect
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function AccountsLoadingSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-lg bg-muted p-3 animate-pulse">
          <div className="h-10 w-10 rounded-full bg-background" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-32 rounded bg-background" />
            <div className="h-2 w-20 rounded bg-background" />
          </div>
        </div>
      ))}
    </div>
  );
}
