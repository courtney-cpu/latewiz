"use client";

import { useState } from "react";
import { useCommentPosts, usePostComments, useReplyToComment } from "@/hooks/use-comments";
import { useAccounts } from "@/hooks";
import { PlatformIcon } from "@/components/shared/platform-icon";
import { PLATFORM_NAMES, type Platform } from "@/lib/late-api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { MessageSquare, ChevronDown, ChevronUp, Send, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

type StatusFilter = "all" | "unanswered" | "answered";

const COMMENT_PLATFORMS = [
  "facebook", "instagram", "youtube", "linkedin", "reddit", "bluesky", "tiktok"
] as const;

function formatTime(ts?: string) {
  if (!ts) return "";
  try {
    return formatDistanceToNow(new Date(ts), { addSuffix: true });
  } catch {
    return "";
  }
}

function PostComments({
  postId,
  accountId,
  platform,
  statusFilter,
}: {
  postId: string;
  accountId: string;
  platform: string;
  statusFilter: StatusFilter;
}) {
  const { data, isLoading } = usePostComments(postId, accountId);
  const replyMutation = useReplyToComment();
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  const comments = data?.comments || [];
  const filtered = comments.filter((c) => {
    if (statusFilter === "unanswered") return (c.replyCount ?? 0) === 0;
    if (statusFilter === "answered") return (c.replyCount ?? 0) > 0;
    return true;
  });

  const handleReply = async (commentId: string) => {
    if (!replyText.trim()) return;
    try {
      await replyMutation.mutateAsync({ postId, accountId, message: replyText.trim(), commentId });
      setReplyText("");
      setReplyingTo(null);
      toast.success("Reply posted.");
    } catch {
      toast.error("Failed to post reply.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-3 pl-4 text-xs text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" />
        Loading comments…
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <p className="py-3 pl-4 text-xs text-muted-foreground">
        {statusFilter !== "all" ? `No ${statusFilter} comments.` : "No comments found."}
      </p>
    );
  }

  return (
    <div className="divide-y divide-border">
      {filtered.map((comment) => (
        <div key={comment.id} className="px-4 py-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2 min-w-0">
              <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                {comment.from?.name?.[0]?.toUpperCase() || "?"}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium">{comment.from?.name || "Unknown"}</span>
                  <span className="text-[10px] text-muted-foreground">{formatTime(comment.createdTime)}</span>
                  {(comment.replyCount ?? 0) > 0 && (
                    <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
                      {comment.replyCount} repl{comment.replyCount === 1 ? "y" : "ies"}
                    </Badge>
                  )}
                </div>
                <p className="mt-0.5 text-sm text-foreground break-words">{comment.message}</p>
              </div>
            </div>
            {comment.canReply !== false && (
              <Button
                variant="ghost"
                size="sm"
                className="flex-shrink-0 h-7 px-2 text-xs"
                onClick={() => {
                  setReplyingTo(replyingTo === comment.id ? null : comment.id);
                  setReplyText("");
                }}
              >
                {replyingTo === comment.id ? "Cancel" : "Reply"}
              </Button>
            )}
          </div>

          {replyingTo === comment.id && (
            <div className="ml-9 mt-2 flex items-end gap-2">
              <Textarea
                placeholder="Write a reply…"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="min-h-[64px] text-sm resize-none"
                disabled={replyMutation.isPending}
              />
              <Button
                size="icon"
                className="h-8 w-8 flex-shrink-0"
                onClick={() => handleReply(comment.id)}
                disabled={!replyText.trim() || replyMutation.isPending}
              >
                {replyMutation.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
              </Button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function PostCard({
  post,
  statusFilter,
}: {
  post: any;
  statusFilter: StatusFilter;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-lg border border-border bg-card">
      <button
        className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/30"
        onClick={() => setExpanded(!expanded)}
      >
        {post.picture && (
          <img
            src={post.picture}
            alt=""
            className="h-10 w-10 flex-shrink-0 rounded object-cover"
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <PlatformIcon platform={post.platform as Platform} size="sm" showColor />
            <span className="text-xs text-muted-foreground">
              {PLATFORM_NAMES[post.platform as Platform] || post.platform}
            </span>
            <span className="text-xs text-muted-foreground">·</span>
            <span className="text-xs text-muted-foreground">{formatTime(post.createdTime)}</span>
          </div>
          <p className="mt-0.5 truncate text-sm">{post.content?.slice(0, 80) || "—"}</p>
          <div className="mt-1 flex items-center gap-3">
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <MessageSquare className="h-3 w-3" />
              {post.commentCount ?? 0} comment{post.commentCount === 1 ? "" : "s"}
            </span>
          </div>
        </div>
        <div className="flex-shrink-0 text-muted-foreground">
          {expanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border">
          <PostComments
            postId={post.id}
            accountId={post.accountId}
            platform={post.platform}
            statusFilter={statusFilter}
          />
        </div>
      )}
    </div>
  );
}

export default function CommentsPage() {
  const [platformFilter, setPlatformFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const { data, isLoading, isError } = useCommentPosts(
    platformFilter === "all" ? undefined : platformFilter
  );
  const { data: accountsData } = useAccounts();

  const posts = data?.data || [];
  const connectedPlatforms = new Set(
    (accountsData?.accounts || []).map((a: any) => a.platform as string)
  );
  const availablePlatforms = COMMENT_PLATFORMS.filter((p) => connectedPlatforms.has(p));

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold">Comments</h1>
        <p className="text-muted-foreground text-sm">View and reply to comments across all your posts.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        {/* Platform filter */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1">
          <button
            onClick={() => setPlatformFilter("all")}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap",
              platformFilter === "all"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            )}
          >
            All
          </button>
          {availablePlatforms.map((p) => (
            <button
              key={p}
              onClick={() => setPlatformFilter(p)}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap",
                platformFilter === p
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              <PlatformIcon platform={p as Platform} size="sm" showColor={platformFilter !== p} />
              {PLATFORM_NAMES[p as Platform]}
            </button>
          ))}
        </div>

        {/* Status filter */}
        <div className="flex items-center gap-1 sm:ml-auto">
          {(["all", "unanswered", "answered"] as StatusFilter[]).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors",
                statusFilter === s
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Posts with comments */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-lg border border-border bg-card" />
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-lg border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          Failed to load comments. Please try again.
        </div>
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-border bg-card p-8 text-center">
          <MessageSquare className="h-8 w-8 text-muted-foreground opacity-30" />
          <p className="text-sm text-muted-foreground">No posts with comments found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post: any) => (
            <PostCard key={post.id} post={post} statusFilter={statusFilter} />
          ))}
          {data?.pagination?.hasMore && (
            <p className="text-center text-xs text-muted-foreground py-2">
              Showing first 30 posts. Scroll pagination coming soon.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
