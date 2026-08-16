"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Bell, BellOff, Pin, Search, Users, Sparkles, Plus } from "lucide-react";
import type { Conversation } from "./types";
import { isVerifiedUser } from "./types";
import { formatConversationTime } from "./format";
import { cn } from "@/lib/utils";

interface ConversationListProps {
  conversations: Conversation[];
  activeId: string | null;
  currentUserId: string | null;
  search: string;
  unreadOnly: boolean;
  loading: boolean;
  error: boolean;
  connected: boolean;
  onlineIds: Set<string>;
  typingMap: Record<string, Record<string, string>>;
  onSearch: (q: string) => void;
  onToggleUnread: () => void;
  onSelect: (id: string) => void;
  onNewChat: () => void;
  onRetry: () => void;
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function ConversationRow({
  conv,
  active,
  currentUserId,
  online,
  typingName,
  onSelect,
}: {
  conv: Conversation;
  active: boolean;
  currentUserId: string | null;
  online: boolean;
  typingName?: string;
  onSelect: () => void;
}) {
  const other = conv.participants.find((p) => p.userId !== currentUserId)?.user;
  const verified = conv.type === "DIRECT" ? isVerifiedUser(other) : false;
  const unread = conv.unreadCount > 0;

  return (
    <motion.button
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      onClick={onSelect}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200 group",
        active ? "bg-primary/12 ring-1 ring-primary/30" : "hover:bg-surface/70"
      )}
    >
      <div className="relative shrink-0">
        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-bold text-white", conv.avatar ? "bg-transparent" : "bg-gradient-primary")}>
          {conv.avatar ? (
            <img src={conv.avatar} alt="" className="w-full h-full rounded-2xl object-cover" />
          ) : (
            initials(conv.name)
          )}
        </div>
        {online && (
          <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-background" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-semibold text-foreground truncate flex items-center gap-1">
            {conv.name}
            {verified && <span className="w-4 h-4 shrink-0 rounded-full bg-accent text-white flex items-center justify-center text-[9px] font-bold">✓</span>}
          </span>
          <span className="text-[11px] text-muted-foreground shrink-0">{formatConversationTime(conv.lastMessageAt)}</span>
        </div>
        <div className="flex items-center justify-between gap-2 mt-0.5">
          {typingName ? (
            <span className="text-xs text-primary font-medium truncate flex items-center gap-1">
              <span className="inline-flex gap-0.5">
                <span className="w-1 h-1 rounded-full bg-primary animate-bounce [animation-delay:0ms]" />
                <span className="w-1 h-1 rounded-full bg-primary animate-bounce [animation-delay:120ms]" />
                <span className="w-1 h-1 rounded-full bg-primary animate-bounce [animation-delay:240ms]" />
              </span>
              {typingName} is typing...
            </span>
          ) : (
            <span className={cn("text-xs truncate", unread ? "text-foreground font-medium" : "text-muted-foreground")}>
              {conv.lastMessage || "No messages yet"}
            </span>
          )}
          <div className="flex items-center gap-1.5 shrink-0">
            {conv.isPinned && <Pin className="w-3 h-3 text-muted-foreground" />}
            {conv.isMuted && <BellOff className="w-3 h-3 text-muted-foreground" />}
            {unread && (
              <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center">
                {conv.unreadCount > 99 ? "99+" : conv.unreadCount}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.button>
  );
}

export default function ConversationList({
  conversations,
  activeId,
  currentUserId,
  search,
  unreadOnly,
  loading,
  error,
  connected,
  onlineIds,
  typingMap,
  onSearch,
  onToggleUnread,
  onSelect,
  onNewChat,
  onRetry,
}: ConversationListProps) {
  const query = search.trim().toLowerCase();
  const filtered = conversations.filter((c) => {
    if (unreadOnly && c.unreadCount === 0) return false;
    if (!query) return true;
    return (
      c.name.toLowerCase().includes(query) ||
      (c.lastMessage || "").toLowerCase().includes(query)
    );
  });

  const pinned = filtered.filter((c) => c.isPinned);
  const rest = filtered.filter((c) => !c.isPinned);

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-foreground">Messages</h2>
            <span
              className={cn(
                "w-2 h-2 rounded-full",
                connected ? "bg-emerald-500" : "bg-amber-500 animate-pulse"
              )}
              title={connected ? "Connected" : "Reconnecting"}
            />
          </div>
          <button
            onClick={onNewChat}
            aria-label="New chat"
            className="w-9 h-9 rounded-xl bg-primary/12 flex items-center justify-center text-primary hover:bg-primary/20 hover:scale-105 transition-all"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className="relative mb-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search conversations..."
            aria-label="Search conversations"
            className="w-full h-10 rounded-xl bg-muted/60 border border-border pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onToggleUnread}
            className={cn(
              "h-7 px-3 rounded-full text-xs font-medium transition-all flex items-center gap-1",
              unreadOnly ? "bg-primary/15 text-primary ring-1 ring-primary/40" : "bg-muted/60 text-muted-foreground hover:bg-muted"
            )}
          >
            <Bell className="w-3 h-3" /> Unread
          </button>
          <button
            onClick={() => onSelect("__ai__")}
            className="h-7 px-3 rounded-full text-xs font-medium transition-all flex items-center gap-1 bg-accent/12 text-accent hover:bg-accent/20"
            aria-label="Open AI Assistant"
          >
            <Sparkles className="w-3 h-3" /> AI Assistant
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-2 py-2 space-y-0.5">
        {loading && (
          <div className="space-y-2 px-1">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="w-12 h-12 rounded-2xl bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-2/3 rounded bg-muted" />
                  <div className="h-2.5 w-1/2 rounded bg-muted/70" />
                </div>
              </div>
            ))}
          </div>
        )}

        {error && !loading && (
          <div className="px-4 py-10 text-center">
            <p className="text-sm text-muted-foreground mb-3">Couldn&apos;t load conversations.</p>
            <button
              onClick={onRetry}
              className="h-8 px-4 rounded-xl bg-gradient-primary text-white text-xs font-medium hover:shadow-lg hover:shadow-primary/25 transition-all"
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && (
          <AnimatePresence mode="popLayout">
            {pinned.length > 0 && (
              <div key="pinned-group">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground px-2 py-1.5">Pinned</p>
                {pinned.map((c) => (
                  <ConversationRow
                    key={c.id}
                    conv={c}
                    active={activeId === c.id}
                    currentUserId={currentUserId}
                    online={onlineIds.has(c.participants.find((p) => p.userId !== currentUserId)?.userId || "")}
typingName={Object.values(typingMap[c.id] || {}).join(" and ") || undefined}
                    onSelect={() => onSelect(c.id)}
                  />
                ))}
              </div>
            )}
            <div key="recent-group">
              {pinned.length > 0 && rest.length > 0 && (
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground px-2 py-1.5">Recent</p>
              )}
              {rest.map((c) => (
                <ConversationRow
                  key={c.id}
                  conv={c}
                  active={activeId === c.id}
                  currentUserId={currentUserId}
                  online={onlineIds.has(c.participants.find((p) => p.userId !== currentUserId)?.userId || "")}
                  typingName={Object.values(typingMap[c.id] || {}).join(" and ") || undefined}
                  onSelect={() => onSelect(c.id)}
                />
              ))}
            </div>

            {filtered.length === 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-4 py-12 text-center">
                <div className="w-14 h-14 rounded-2xl bg-muted/60 flex items-center justify-center mx-auto mb-3">
                  <Users className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground">
                  {search ? "No conversations found" : "No conversations yet"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {search ? "Try a different search" : "Start a new chat to begin"}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
