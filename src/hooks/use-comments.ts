import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCurrentProfileId } from "./use-profiles";

export const commentKeys = {
  all: ["comments"] as const,
  list: (profileId: string, platform?: string) =>
    ["comments", "list", profileId, platform] as const,
  postComments: (postId: string) => ["comments", "post", postId] as const,
};

export interface CommentPost {
  id: string;
  platform: string;
  accountId: string;
  accountUsername?: string;
  content?: string;
  picture?: string;
  permalink?: string;
  createdTime?: string;
  commentCount?: number;
  likeCount?: number;
  cid?: string;
  subreddit?: string;
}

export interface Comment {
  id: string;
  message?: string;
  createdTime?: string;
  from?: { id?: string; name?: string; picture?: string };
  likeCount?: number;
  replyCount?: number;
  platform?: string;
  url?: string;
  canReply?: boolean;
  canDelete?: boolean;
  canHide?: boolean;
  canLike?: boolean;
  isHidden?: boolean;
  isLiked?: boolean;
  replies?: Comment[];
}

export function useCommentPosts(platform?: string) {
  const profileId = useCurrentProfileId();

  return useQuery({
    queryKey: commentKeys.list(profileId || "", platform),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (profileId) params.set("profileId", profileId);
      if (platform) params.set("platform", platform);
      params.set("sortBy", "date");
      params.set("sortOrder", "desc");
      params.set("limit", "30");
      const res = await fetch(`/api/zernio/comments?${params}`);
      if (!res.ok) throw new Error("Failed to fetch comments");
      return res.json() as Promise<{
        data?: CommentPost[];
        pagination?: { hasMore?: boolean; nextCursor?: string };
        meta?: { accountsQueried?: number; accountsFailed?: number };
      }>;
    },
    enabled: !!profileId,
  });
}

export function usePostComments(postId: string, accountId: string) {
  return useQuery({
    queryKey: commentKeys.postComments(postId),
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("accountId", accountId);
      params.set("limit", "50");
      const res = await fetch(`/api/zernio/comments/${postId}?${params}`);
      if (!res.ok) throw new Error("Failed to fetch post comments");
      return res.json() as Promise<{ comments?: Comment[] }>;
    },
    enabled: !!postId && !!accountId,
  });
}

export function useReplyToComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      postId,
      accountId,
      message,
      commentId,
    }: {
      postId: string;
      accountId: string;
      message: string;
      commentId?: string;
    }) => {
      const res = await fetch(`/api/zernio/comments/${postId}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId, message, commentId }),
      });
      if (!res.ok) throw new Error("Failed to post reply");
      return res.json();
    },
    onSuccess: (_, { postId }) => {
      queryClient.invalidateQueries({ queryKey: commentKeys.postComments(postId) });
    },
  });
}
