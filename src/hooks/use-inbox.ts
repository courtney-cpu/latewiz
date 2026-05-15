import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCurrentProfileId } from "./use-profiles";

export const inboxKeys = {
  all: ["inbox"] as const,
  conversations: (profileId: string, platform?: string) =>
    ["inbox", "conversations", profileId, platform] as const,
  messages: (conversationId: string) => ["inbox", "messages", conversationId] as const,
};

export interface Conversation {
  id: string;
  platform: string;
  accountId: string;
  accountUsername?: string;
  participantId?: string;
  participantName?: string;
  participantPicture?: string;
  lastMessage?: { text?: string; createdTime?: string; direction?: string };
  updatedTime?: string;
  status?: string;
  unreadCount?: number;
  url?: string;
}

export interface Message {
  id?: string;
  text?: string;
  createdTime?: string;
  direction?: "incoming" | "outgoing";
  from?: { id?: string; name?: string; picture?: string };
  attachments?: Array<{ type: string; url?: string }>;
}

export function useConversations(platform?: string) {
  const profileId = useCurrentProfileId();

  return useQuery({
    queryKey: inboxKeys.conversations(profileId || "", platform),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (profileId) params.set("profileId", profileId);
      if (platform) params.set("platform", platform);
      params.set("sortOrder", "desc");
      params.set("limit", "50");
      const res = await fetch(`/api/zernio/inbox/conversations?${params}`);
      if (!res.ok) throw new Error("Failed to fetch conversations");
      return res.json() as Promise<{
        data?: Conversation[];
        pagination?: { hasMore?: boolean; nextCursor?: string };
        meta?: { accountsQueried?: number; accountsFailed?: number };
      }>;
    },
    enabled: !!profileId,
  });
}

export function useConversationMessages(conversationId: string, accountId: string) {
  return useQuery({
    queryKey: inboxKeys.messages(conversationId),
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("accountId", accountId);
      const res = await fetch(
        `/api/zernio/inbox/conversations/${conversationId}/messages?${params}`
      );
      if (!res.ok) throw new Error("Failed to fetch messages");
      return res.json() as Promise<{ messages?: Message[] }>;
    },
    enabled: !!conversationId && !!accountId,
    refetchInterval: 15000,
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      conversationId,
      accountId,
      message,
    }: {
      conversationId: string;
      accountId: string;
      message: string;
    }) => {
      const res = await fetch(`/api/zernio/inbox/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId, message }),
      });
      if (!res.ok) throw new Error("Failed to send message");
      return res.json();
    },
    onSuccess: (_, { conversationId }) => {
      queryClient.invalidateQueries({ queryKey: inboxKeys.messages(conversationId) });
      queryClient.invalidateQueries({ queryKey: inboxKeys.all });
    },
  });
}
