"use client";

import { useState, useRef, useEffect } from "react";
import { useConversations, useConversationMessages, useSendMessage } from "@/hooks/use-inbox";
import { useAccounts } from "@/hooks";
import { PlatformIcon } from "@/components/shared/platform-icon";
import { PLATFORM_NAMES, type Platform } from "@/lib/late-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Send, MessageCircle, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

const INBOX_PLATFORMS = ["facebook", "instagram", "bluesky", "reddit", "telegram"] as const;

function formatTime(ts?: string) {
  if (!ts) return "";
  try {
    return formatDistanceToNow(new Date(ts), { addSuffix: true });
  } catch {
    return "";
  }
}

export default function InboxPage() {
  const [platformFilter, setPlatformFilter] = useState<string>("all");
  const [selectedConv, setSelectedConv] = useState<any | null>(null);
  const [replyText, setReplyText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: convData, isLoading: convLoading } = useConversations(
    platformFilter === "all" ? undefined : platformFilter
  );
  const { data: accountsData } = useAccounts();

  const conversations = convData?.data || [];
  const connectedPlatforms = new Set(
    (accountsData?.accounts || []).map((a: any) => a.platform as string)
  );
  const availablePlatforms = INBOX_PLATFORMS.filter((p) => connectedPlatforms.has(p));

  const { data: messagesData, isLoading: msgLoading } = useConversationMessages(
    selectedConv?.id || "",
    selectedConv?.accountId || ""
  );
  const sendMutation = useSendMessage();
  const messages = messagesData?.messages || [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!replyText.trim() || !selectedConv) return;
    try {
      await sendMutation.mutateAsync({
        conversationId: selectedConv.id,
        accountId: selectedConv.accountId,
        message: replyText.trim(),
      });
      setReplyText("");
    } catch {
      toast.error("Failed to send message. Please try again.");
    }
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col gap-0 overflow-hidden rounded-lg border border-border">
      {/* Platform tabs */}
      <div className="flex items-center gap-1 border-b border-border bg-card px-3 py-2 overflow-x-auto">
        <button
          onClick={() => setPlatformFilter("all")}
          className={cn(
            "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap",
            platformFilter === "all"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <MessageCircle className="h-3 w-3" />
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
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <PlatformIcon platform={p as Platform} size="sm" showColor={platformFilter !== p} />
            {PLATFORM_NAMES[p as Platform]}
          </button>
        ))}
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Conversation list */}
        <div className="flex w-full flex-col border-r border-border sm:w-80 lg:w-96">
          <ScrollArea className="flex-1">
            {convLoading ? (
              <ConversationSkeleton />
            ) : conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 p-8 text-center">
                <MessageCircle className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No conversations yet.</p>
              </div>
            ) : (
              conversations.map((conv: any) => (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConv(conv)}
                  className={cn(
                    "flex w-full items-start gap-3 border-b border-border px-4 py-3 text-left transition-colors hover:bg-muted/50",
                    selectedConv?.id === conv.id && "bg-muted"
                  )}
                >
                  <div className="relative mt-0.5 flex-shrink-0">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-sm font-medium">
                      {conv.participantName?.[0]?.toUpperCase() || "?"}
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5">
                      <PlatformIcon platform={conv.platform as Platform} size="sm" showColor />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="truncate text-sm font-medium">
                        {conv.participantName || conv.participantId || "Unknown"}
                      </span>
                      <span className="flex-shrink-0 text-[10px] text-muted-foreground">
                        {formatTime(conv.updatedTime)}
                      </span>
                    </div>
                    <p className="truncate text-xs text-muted-foreground mt-0.5">
                      {conv.lastMessage?.text?.slice(0, 60) || "No messages yet"}
                    </p>
                  </div>
                  {conv.unreadCount > 0 && (
                    <Badge className="ml-1 flex-shrink-0 h-4 min-w-4 px-1 text-[10px]">
                      {conv.unreadCount}
                    </Badge>
                  )}
                </button>
              ))
            )}
          </ScrollArea>
        </div>

        {/* Message thread */}
        {selectedConv ? (
          <div className="hidden flex-1 flex-col sm:flex">
            {/* Thread header */}
            <div className="flex items-center gap-3 border-b border-border px-4 py-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-medium">
                {selectedConv.participantName?.[0]?.toUpperCase() || "?"}
              </div>
              <div>
                <p className="text-sm font-medium">
                  {selectedConv.participantName || selectedConv.participantId}
                </p>
                <p className="text-xs text-muted-foreground">
                  {PLATFORM_NAMES[selectedConv.platform as Platform]} ·{" "}
                  {selectedConv.accountUsername}
                </p>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 px-4 py-3">
              {msgLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : messages.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">No messages yet.</p>
              ) : (
                <div className="space-y-3">
                  {messages.map((msg: any, i: number) => {
                    const isOutgoing = msg.direction === "outgoing";
                    return (
                      <div
                        key={msg.id || i}
                        className={cn("flex", isOutgoing ? "justify-end" : "justify-start")}
                      >
                        <div
                          className={cn(
                            "max-w-[75%] rounded-2xl px-3.5 py-2 text-sm",
                            isOutgoing
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-foreground"
                          )}
                        >
                          <p>{msg.text}</p>
                          {msg.createdTime && (
                            <p
                              className={cn(
                                "mt-1 text-[10px]",
                                isOutgoing ? "text-primary-foreground/70" : "text-muted-foreground"
                              )}
                            >
                              {formatTime(msg.createdTime)}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>

            {/* Reply input */}
            <div className="flex items-center gap-2 border-t border-border px-4 py-3">
              <Input
                placeholder="Type a message…"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                className="flex-1"
                disabled={sendMutation.isPending}
              />
              <Button
                size="icon"
                onClick={handleSend}
                disabled={!replyText.trim() || sendMutation.isPending}
              >
                {sendMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="hidden flex-1 items-center justify-center sm:flex">
            <div className="text-center text-muted-foreground">
              <MessageCircle className="mx-auto h-10 w-10 mb-3 opacity-30" />
              <p className="text-sm">Select a conversation to view messages</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ConversationSkeleton() {
  return (
    <div className="space-y-0">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 border-b border-border px-4 py-3 animate-pulse">
          <div className="h-9 w-9 rounded-full bg-muted flex-shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 w-28 rounded bg-muted" />
            <div className="h-2.5 w-40 rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}
