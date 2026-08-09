"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Loader2, ArrowDown } from "lucide-react";
import type { ChatMessage } from "./types";
import MessageBubble from "./MessageBubble";
import { formatDateLabel, isSameDay } from "./format";

interface MessageListProps {
  messages: ChatMessage[];
  currentUserId: string | null;
  typingName?: string;
  loadingOlder: boolean;
  hasMore: boolean;
  onLoadOlder: () => void;
  onReply: (m: ChatMessage) => void;
  onForward: (m: ChatMessage) => void;
  onOpenMedia: (m: ChatMessage) => void;
  onRetry: (m: ChatMessage) => void;
  onDelete: (m: ChatMessage) => void;
}

export default function MessageList({
  messages,
  currentUserId,
  typingName,
  loadingOlder,
  hasMore,
  onLoadOlder,
  onReply,
  onForward,
  onOpenMedia,
  onRetry,
  onDelete,
}: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const topSentinelRef = useRef<HTMLDivElement>(null);
  const stickRef = useRef(true);
  const [showJump, setShowJump] = useState(false);

  const isNearBottom = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < 160;
  }, []);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior });
  }, []);

  // Reset on conversation change
  useEffect(() => {
    stickRef.current = true;
    requestAnimationFrame(() => {
      setShowJump(false);
      scrollToBottom("auto");
    });
  }, [currentUserId, scrollToBottom]);

  // Keep pinned to bottom when near it
  useEffect(() => {
    if (stickRef.current) scrollToBottom("auto");
    else setShowJump(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    stickRef.current = isNearBottom();
    setShowJump(!stickRef.current);
  }, [isNearBottom]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  // Infinite scroll up
  useEffect(() => {
    const sentinel = topSentinelRef.current;
    const el = scrollRef.current;
    if (!sentinel || !el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingOlder) onLoadOlder();
      },
      { root: el, rootMargin: "120px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadingOlder, onLoadOlder]);

  const rendered: React.ReactNode[] = [];
  let prevDate: string | null = null;

  messages.forEach((m) => {
    const day = m.createdAt;
    if (prevDate === null || !isSameDay(prevDate, day)) {
      rendered.push(
        <div key={"date-" + day + "-" + m.id} className="flex justify-center my-4">
          <span className="text-[11px] font-medium text-muted-foreground bg-surface/80 border border-border rounded-full px-3 py-1">
            {formatDateLabel(day)}
          </span>
        </div>
      );
      prevDate = day;
    }
    rendered.push(
      <MessageBubble
        key={m.id}
        message={m}
        isMe={m.senderId === currentUserId}
        currentUserId={currentUserId}
        onReply={onReply}
        onForward={onForward}
        onOpenMedia={onOpenMedia}
        onRetry={onRetry}
        onDelete={onDelete}
      />
    );
  });

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto no-scrollbar px-4 sm:px-6 py-4">
      <div ref={topSentinelRef} className="h-px" />
      {loadingOlder && (
        <div className="flex justify-center py-2">
          <Loader2 className="w-4 h-4 text-primary animate-spin" />
        </div>
      )}

      {messages.length === 0 && !loadingOlder && (
        <div className="flex flex-col items-center justify-center h-full text-center">
          <div className="w-14 h-14 rounded-2xl bg-muted/60 flex items-center justify-center mb-3">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="text-muted-foreground">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-foreground">No messages yet</p>
          <p className="text-xs text-muted-foreground mt-1">Say hello and start the conversation</p>
        </div>
      )}

      <div className="space-y-1.5">
        {rendered}
        {typingName && (
          <div className="flex items-end gap-2">
            <div className="glass rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:0ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:140ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:280ms]" />
              </div>
            </div>
            <span className="text-[11px] text-muted-foreground">{typingName} is typing...</span>
          </div>
        )}
      </div>

      {showJump && (
        <button
          onClick={() => scrollToBottom()}
          aria-label="Jump to latest"
          className="fixed lg:absolute bottom-24 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full glass-strong border border-border flex items-center justify-center shadow-premium hover:scale-105 transition-transform z-10"
        >
          <ArrowDown className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
