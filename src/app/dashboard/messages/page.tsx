"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/providers/AuthProvider";
import api from "@/lib/api";
import { useRouter } from "next/navigation";
import { Loader2, Send, Link2, X, RefreshCw, Mic, Volume2, Video, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMessagesSocket } from "@/components/messages/useMessagesSocket";
import ConversationList from "@/components/messages/ConversationList";
import NewChatModal from "@/components/messages/NewChatModal";
import ChatHeader from "@/components/messages/ChatHeader";
import MessageList from "@/components/messages/MessageList";
import MessageInput from "@/components/messages/MessageInput";
import ChatDetails from "@/components/messages/ChatDetails";
import MediaViewer from "@/components/messages/MediaViewer";
import AiPanel from "@/components/messages/AiPanel";
import type {
  ChatMessage,
  Conversation,
  MessageMedia,
  MessageType,
  RawConversation,
  RawMessage,
  RawParticipant,
} from "@/components/messages/types";
import { messagePreview } from "@/components/messages/format";

const PAGE_SIZE = 50;

function normalizeMessage(raw: RawMessage): ChatMessage {
  return {
    id: raw.id,
    conversationId: raw.conversationId || "",
    senderId: raw.senderId || "",
    content: raw.content || "",
    type: (raw.type || "TEXT") as MessageType,
    media: raw.media || null,
    replyToId: raw.replyToId || null,
    isEdited: !!raw.isEdited,
    isDeleted: !!raw.isDeleted,
    isForwarded: !!raw.isForwarded,
    readBy: raw.readBy,
    deliveredTo: raw.deliveredTo,
    createdAt: raw.createdAt || new Date().toISOString(),
    sender: raw.sender || null,
    replyTo: raw.replyTo
      ? {
          id: raw.replyTo.id,
          content: raw.replyTo.content || "",
          type: (raw.replyTo.type || "TEXT") as MessageType,
          media: raw.replyTo.media || null,
          sender: raw.replyTo.sender || null,
        }
      : null,
    status: "sent",
  };
}

function normalizeConversation(raw: RawConversation): Conversation {
  const participants = Array.isArray(raw.participants)
    ? raw.participants.map((p: RawParticipant) => ({
        userId: p.userId || p.id || "",
        role: p.role,
        isMuted: !!p.isMuted,
        isPinned: !!p.isPinned,
        leftAt: p.leftAt,
        user: p.user || null,
      }))
    : [];
  return {
    id: raw.id,
    type: (raw.type || "DIRECT") as Conversation["type"],
    name: raw.name || raw.title || "Conversation",
    avatar: raw.avatar || null,
    lastMessage: raw.lastMessage || null,
    lastMessageAt: raw.lastMessageAt || null,
    unreadCount: raw.unreadCount || 0,
    isPinned: !!raw.isPinned,
    isMuted: !!raw.isMuted,
    isArchived: !!raw.isArchived,
    participants,
    online: false,
    typing: false,
  };
}

function extractList<T>(raw: unknown): T[] {
  if (Array.isArray(raw)) return raw as T[];
  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    if (Array.isArray(obj.items)) return obj.items as T[];
    if (Array.isArray(obj.messages)) return obj.messages as T[];
    if (Array.isArray(obj.conversations)) return obj.conversations as T[];
  }
  return [];
}

function sortConversations(list: Conversation[]): Conversation[] {
  return [...list].sort((a, b) => {
    if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
    return new Date(b.lastMessageAt || 0).getTime() - new Date(a.lastMessageAt || 0).getTime();
  });
}

export default function MessagesPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [convError, setConvError] = useState(false);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [msgError, setMsgError] = useState(false);
  const [search, setSearch] = useState("");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [viewerMsg, setViewerMsg] = useState<ChatMessage | null>(null);
  const [draft, setDraft] = useState("");
  const [msgSearch, setMsgSearch] = useState("");
  const [mobileView, setMobileView] = useState<"list" | "chat">("list");
  const [sending, setSending] = useState(false);
  const [onlineIds, setOnlineIds] = useState<Set<string>>(new Set());
  const [typingMap, setTypingMap] = useState<Record<string, string>>({});
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [forwardMsg, setForwardMsg] = useState<ChatMessage | null>(null);
  const [call, setCall] = useState<{ kind: "voice" | "video"; muted: boolean; speakerOff: boolean } | null>(null);
  const [callRinging, setCallRinging] = useState(true);

  const callTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (call) {
      setCallRinging(true);
      callTimerRef.current = setTimeout(() => setCallRinging(false), 4000);
    }
    return () => {
      if (callTimerRef.current) clearTimeout(callTimerRef.current);
    };
  }, [call]);

  const activeIdRef = useRef<string | null>(null);
  const convsRef = useRef<Conversation[]>([]);
  const messagesRef = useRef<ChatMessage[]>([]);
  const msgPageRef = useRef(1);
  const replyToRef = useRef<ChatMessage | null>(null);

  useEffect(() => {
    convsRef.current = conversations;
    messagesRef.current = messages;
  }, [conversations, messages]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const share = params.get("share");
    if (share) {
      const id = requestAnimationFrame(() => setShareUrl(share));
      return () => cancelAnimationFrame(id);
    }
    const targetUser = params.get("user");
    if (targetUser) {
      const id = requestAnimationFrame(async () => {
        try {
          const convRes = await api.getConversations();
          const list = extractList<RawConversation>(convRes.data);
          const convs = sortConversations(list.map(normalizeConversation));
          setConversations(convs);
          const existing = convs.find(
            (c) => c.type === "DIRECT" && c.participants.some((p) => (p.user?.username || "").toLowerCase() === targetUser.toLowerCase())
          );
          if (existing) {
            selectConversation(existing.id);
            return;
          }
          const userRes = await api.searchUsers(targetUser);
          const found = (Array.isArray(userRes.data) ? userRes.data : userRes.data?.users || []).find(
            (u: any) => (u.username || "").toLowerCase() === targetUser.toLowerCase()
          );
          if (found?.id) {
            const conv = await api.createConversation({ participantId: found.id });
            const created = normalizeConversation(conv.data?.conversation || conv.data);
            setConversations((prev) => sortConversations([created, ...prev]));
            selectConversation(created.id);
          }
        } catch {}
      });
      return () => cancelAnimationFrame(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadMessages = useCallback(
    async (convId: string, page: number, replace: boolean) => {
      if (replace) {
        setLoadingMsgs(true);
        msgPageRef.current = 1;
        setHasMore(true);
        setMsgError(false);
      } else {
        setLoadingOlder(true);
      }
      try {
        const res = await api.getMessages(convId, page);
        const list = extractList<RawMessage>(res.data);
        const incoming = [...list.map(normalizeMessage)].reverse();
        setMessages((prev) => {
          if (replace) return incoming;
          const seen = new Set(prev.map((m) => m.id));
          return [...incoming.filter((m) => !seen.has(m.id)), ...prev];
        });
        setHasMore(list.length >= PAGE_SIZE);
        setConversations((prev) =>
          prev.map((c) => (c.id === convId ? { ...c, unreadCount: 0 } : c))
        );
      } catch {
        if (replace) setMsgError(true);
      } finally {
        setLoadingMsgs(false);
        setLoadingOlder(false);
      }
    },
    []
  );

  const selectConversation = useCallback(
    (id: string) => {
      if (id === "__ai__") {
        router.push("/dashboard/learning/ai-search");
        return;
      }
      if (id === activeIdRef.current) return;
      activeIdRef.current = id;
      setActiveId(id);
      setDetailsOpen(false);
      setReplyTo(null);
      replyToRef.current = null;
      setAiOpen(false);
      setMsgSearch("");
      setMobileView("chat");
      if (shareUrl) setDraft(shareUrl);
      loadMessages(id, 1, true);
    },
    [router, loadMessages, shareUrl]
  );

  const loadConversations = useCallback(async () => {
    setLoadingConvs(true);
    setConvError(false);
    try {
      const res = await api.getConversations();
      const list = extractList<RawConversation>(res.data);
      const convs = sortConversations(list.map(normalizeConversation));
      setConversations(convs);
      if (!activeIdRef.current && convs.length > 0) {
        selectConversation(convs[0].id);
      }
    } catch {
      setConvError(true);
    } finally {
      setLoadingConvs(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, selectConversation]);

  useEffect(() => {
    if (!user) return;
    const id = requestAnimationFrame(() => loadConversations());
    return () => cancelAnimationFrame(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleNewMessage = useCallback((payload: { conversationId: string; message: RawMessage }) => {
    const { conversationId, message } = payload;
    const normalized = normalizeMessage(message);
    const preview = messagePreview(normalized);

    setConversations((prev) => {
      const idx = prev.findIndex((c) => c.id === conversationId);
      if (idx === -1) return prev;
      const conv = prev[idx];
      const isActive = activeIdRef.current === conversationId;
      const updated: Conversation = {
        ...conv,
        lastMessage: preview,
        lastMessageAt: normalized.createdAt,
        unreadCount: isActive ? conv.unreadCount : conv.unreadCount + 1,
        typing: false,
      };
      return sortConversations([
        updated,
        ...prev.filter((c) => c.id !== conversationId),
      ]);
    });

    if (activeIdRef.current === conversationId) {
      setMessages((prev) =>
        prev.some((m) => m.id === normalized.id) ? prev : [...prev, normalized]
      );
    }
  }, []);

  const handleTyping = useCallback(
    (payload: { conversationId: string; userId: string; isTyping: boolean }) => {
      const { conversationId, userId, isTyping } = payload;
      if (!isTyping) {
        setTypingMap((prev) => {
          if (!prev[conversationId]) return prev;
          const next = { ...prev };
          delete next[conversationId];
          return next;
        });
        return;
      }
      const conv = convsRef.current.find((c) => c.id === conversationId);
      const participant = conv?.participants.find((p) => p.userId === userId);
      const name = participant?.user?.displayName || participant?.user?.username || "Someone";
      setTypingMap((prev) => ({ ...prev, [conversationId]: name }));
    },
    []
  );

  const handleOnline = useCallback((payload: { userId: string }) => {
    setOnlineIds((prev) => {
      if (prev.has(payload.userId)) return prev;
      const next = new Set(prev);
      next.add(payload.userId);
      return next;
    });
  }, []);

  const handleOffline = useCallback((payload: { userId: string }) => {
    setOnlineIds((prev) => {
      if (!prev.has(payload.userId)) return prev;
      const next = new Set(prev);
      next.delete(payload.userId);
      return next;
    });
  }, []);

  const { connected, emitTyping } = useMessagesSocket(activeId, {
    onMessage: handleNewMessage,
    onTyping: handleTyping,
    onOnline: handleOnline,
    onOffline: handleOffline,
  });

  const activeConv = conversations.find((c) => c.id === activeId) || null;

  const otherId = activeConv?.participants.find((p) => p.userId !== user?.id)?.userId || "";
  const activeOnline = onlineIds.has(otherId);

  const handleCall = useCallback((kind: "voice" | "video") => {
    if (!activeConv) return;
    setCall({ kind, muted: false, speakerOff: false });
    setCallRinging(true);
  }, [activeConv]);
  const activeTypingName = activeId ? typingMap[activeId] : undefined;
  const visibleMessages = msgSearch
    ? messages.filter((m) => m.content.toLowerCase().includes(msgSearch.toLowerCase()))
    : messages;

  const handleSendText = useCallback(
    (content: string) => {
      if (!activeId || !user) return;
      const replyId = replyToRef.current?.id || null;
      const optimistic: ChatMessage = {
        id: `local-${Date.now()}`,
        conversationId: activeId,
        senderId: user.id,
        content,
        type: "TEXT",
        createdAt: new Date().toISOString(),
        sender: { id: user.id, username: user.username, displayName: user.displayName || `${user.firstName || ""} ${user.lastName || ""}`.trim(), avatar: user.avatar },
        status: "sending",
      };
      setMessages((prev) => [...prev, optimistic]);
      setSending(true);
      setReplyTo(null);
      replyToRef.current = null;
      setShareUrl(null);
      api
        .sendMessage(activeId, content, "TEXT", undefined, replyId || undefined)
        .then((res: { data: RawMessage }) => {
          const server = normalizeMessage(res.data);
          setMessages((prev) => prev.map((m) => (m.id === optimistic.id ? { ...server, status: "sent" } : m)));
          setConversations((prev) => {
            const idx = prev.findIndex((c) => c.id === activeId);
            if (idx === -1) return prev;
            const conv = prev[idx];
            const updated: Conversation = {
              ...conv,
              lastMessage: messagePreview(server),
              lastMessageAt: server.createdAt,
              typing: false,
            };
            return sortConversations([
              updated,
              ...prev.filter((c) => c.id !== activeId),
            ]);
          });
        })
        .catch(() => {
          setMessages((prev) => prev.map((m) => (m.id === optimistic.id ? { ...m, status: "error" } : m)));
        })
        .finally(() => setSending(false));
    },
    [activeId, user]
  );

  const uploadAndSend = useCallback(
    (file: File, type: "IMAGE" | "VIDEO" | "FILE" | "VOICE_NOTE", duration?: number) => {
      if (!activeId || !user) return;
      const optimistic: ChatMessage = {
        id: `local-${Date.now()}`,
        conversationId: activeId,
        senderId: user.id,
        content: "",
        type,
        media: [{ url: "", name: file.name, size: file.size, mime: file.type }],
        createdAt: new Date().toISOString(),
        sender: { id: user.id, username: user.username, displayName: user.displayName, avatar: user.avatar },
        status: "sending",
      };
      setMessages((prev) => [...prev, optimistic]);
      setSending(true);
      const replyId = replyToRef.current?.id || null;
      setReplyTo(null);
      replyToRef.current = null;

      api
        .uploadFile(file, "message")
        .then((upload: { data: { url?: string } }) => {
          const url = upload?.data?.url;
          if (!url) throw new Error("upload failed");
          const media: MessageMedia[] = [{ url, type, name: file.name, size: file.size, mime: file.type }];
          if (duration) media[0].duration = duration;
          setMessages((prev) =>
            prev.map((m) => (m.id === optimistic.id ? { ...m, media } : m))
          );
          return api.sendMessage(activeId, "", type, media, replyId || undefined);
        })
        .then((res: { data: RawMessage }) => {
          const server = normalizeMessage(res.data);
          setMessages((prev) => prev.map((m) => (m.id === optimistic.id ? { ...server, status: "sent" } : m)));
        })
        .catch(() => {
          setMessages((prev) => prev.map((m) => (m.id === optimistic.id ? { ...m, status: "error" } : m)));
        })
        .finally(() => setSending(false));
    },
    [activeId, user]
  );

  const handleRetry = useCallback(
    (m: ChatMessage) => {
      setMessages((prev) => prev.filter((x) => x.id !== m.id));
      if (m.media?.[0]?.url) {
        if (m.type === "VOICE_NOTE") {
          const blob = new Blob([], { type: "audio/webm" });
          uploadAndSend(new File([blob], "voice.webm", { type: "audio/webm" }), "VOICE_NOTE", m.media[0].duration);
        }
      } else if (m.content) {
        handleSendText(m.content);
      }
    },
    [handleSendText, uploadAndSend]
  );

  const handleDelete = useCallback(
    (m: ChatMessage) => {
      if (!confirm("Delete this message?")) return;
      // TODO(backend): `DELETE /messages/:id` is not implemented; mark locally for now.
      setMessages((prev) =>
        prev.map((x) => (x.id === m.id ? { ...x, isDeleted: true, content: "" } : x))
      );
    },
    []
  );

  const handleForward = useCallback(
    (m: ChatMessage) => {
      setForwardMsg(m);
    },
    []
  );

  const handleLoadOlder = useCallback(() => {
    if (!activeId || loadingOlder || !hasMore) return;
    msgPageRef.current += 1;
    loadMessages(activeId, msgPageRef.current, false);
  }, [activeId, loadingOlder, hasMore, loadMessages]);

  const handleTypingChange = useCallback(
    (isTyping: boolean) => {
      if (activeId) emitTyping(activeId, isTyping);
    },
    [activeId, emitTyping]
  );

  const handleUseSuggestion = useCallback((text: string) => {
    setAiOpen(false);
    setDraft(text);
  }, []);

  const onCreated = useCallback(
    (id: string) => {
      setNewChatOpen(false);
      if (!id) return;
      loadConversations().then(() => selectConversation(id));
    },
    [loadConversations, selectConversation]
  );

  const sendForward = useCallback(
    (convId: string) => {
      if (!forwardMsg || !user) return;
      const src = forwardMsg;
      if (src.media?.[0]?.url) {
        api.sendMessage(convId, "", src.type, src.media, undefined).then(() => setForwardMsg(null)).catch(() => {});
      } else {
        const prefix = `↗️ Forwarded from ${src.sender?.displayName || src.sender?.username || "user"}:\n`;
        api.sendMessage(convId, prefix + src.content, src.type, undefined, undefined).then(() => setForwardMsg(null)).catch(() => {});
      }
    },
    [forwardMsg, user]
  );

  const dismissShare = () => {
    setShareUrl(null);
    setDraft("");
  };

  return (
    <div className="-m-4 lg:-m-8 h-[calc(100dvh-9rem)] lg:h-[calc(100dvh-4rem)]">
      <div className="flex h-full overflow-hidden glass rounded-2xl lg:rounded-none border border-border lg:border-0">
        {/* LEFT: conversation list */}
        <aside
          className={cnAside(mobileView === "chat")}
          aria-label="Conversations"
        >
          <ConversationList
            conversations={conversations}
            activeId={activeId}
            currentUserId={user?.id || null}
            search={search}
            unreadOnly={unreadOnly}
            loading={loadingConvs}
            error={convError}
            connected={connected}
            onlineIds={onlineIds}
            typingMap={typingMap}
            onSearch={setSearch}
            onToggleUnread={() => setUnreadOnly((v) => !v)}
            onSelect={selectConversation}
            onNewChat={() => setNewChatOpen(true)}
            onRetry={loadConversations}
          />
        </aside>

        {/* CENTER: chat window */}
        <section className={cnChat(mobileView === "list")}>
          {activeConv ? (
            <>
              <ChatHeader
                conversation={activeConv}
                online={activeOnline}
                typingName={activeTypingName}
                connected={connected}
                detailsOpen={detailsOpen}
                onToggleDetails={() => setDetailsOpen((v) => !v)}
                onBack={() => setMobileView("list")}
                onSearch={setMsgSearch}
                onCall={handleCall}
              />

              {shareUrl && (
                <div className="flex items-center gap-2 px-4 py-2 bg-accent/8 border-b border-accent/20">
                  <Link2 className="w-3.5 h-3.5 text-accent shrink-0" />
                  <p className="text-xs text-foreground truncate flex-1">
                    Sharing: <span className="text-accent break-all">{shareUrl}</span>
                  </p>
                  <button
                    onClick={dismissShare}
                    aria-label="Cancel sharing"
                    className="w-7 h-7 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground shrink-0"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <div className="relative flex-1 flex flex-col min-h-0">
                {msgError && !loadingMsgs ? (
                  <div className="flex-1 flex flex-col items-center justify-center">
                    <p className="text-sm text-muted-foreground mb-3">Couldn&apos;t load messages.</p>
                    <button
                      onClick={() => { if (activeId) loadMessages(activeId, 1, true); }}
                      className="h-8 px-4 rounded-xl bg-gradient-primary text-white text-xs font-medium flex items-center gap-1.5 hover:shadow-lg hover:shadow-primary/25 transition-all"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Retry
                    </button>
                  </div>
                ) : loadingMsgs && messages.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center gap-3">
                    {[0, 1, 2].map((i) => (
                      <div key={i} className="w-3/4 max-w-md h-10 rounded-2xl bg-muted/50 animate-pulse" />
                    ))}
                  </div>
                ) : (
                  <MessageList
                    messages={visibleMessages}
                    currentUserId={user?.id || null}
                    typingName={activeTypingName}
                    loadingOlder={loadingOlder}
                    hasMore={hasMore}
                    onLoadOlder={handleLoadOlder}
                    onReply={(m) => { setReplyTo(m); replyToRef.current = m; }}
                    onForward={handleForward}
                    onOpenMedia={setViewerMsg}
                    onRetry={handleRetry}
                    onDelete={handleDelete}
                    onQuoteClick={(id) => {
                      document.getElementById(`msg-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
                    }}
                  />
                )}

                <AiPanel
                  conversation={activeConv}
                  messages={messages}
                  currentUserId={user?.id || null}
                  open={aiOpen}
                  onClose={() => setAiOpen(false)}
                  onUseSuggestion={handleUseSuggestion}
                />

                <MessageInput
                  value={draft}
                  onChange={setDraft}
                  onSend={handleSendText}
                  onAttachImage={(f) => uploadAndSend(f, f.type.startsWith("video/") ? "VIDEO" : "IMAGE")}
                  onAttachFile={(f) => uploadAndSend(f, "FILE")}
                  onVoiceRecorded={(blob, duration) =>
                    uploadAndSend(new File([blob], "voice.webm", { type: "audio/webm" }), "VOICE_NOTE", duration)
                  }
                  onToggleAi={() => setAiOpen((v) => !v)}
                  aiOpen={aiOpen}
                  onTypingChange={handleTypingChange}
                  replyTo={replyTo}
                  onCancelReply={() => { setReplyTo(null); replyToRef.current = null; }}
                  sending={sending}
                />
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center">
              {loadingConvs ? (
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
              ) : (
                <>
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                    <Send className="w-8 h-8 text-primary" />
                  </div>
                  <p className="text-lg font-medium text-foreground">Select a conversation</p>
                  <p className="text-sm text-muted-foreground mt-1">Choose a chat or start a new one</p>
                  <button
                    onClick={() => setNewChatOpen(true)}
                    className="mt-4 h-10 px-5 rounded-xl bg-gradient-primary text-white text-sm font-medium hover:shadow-lg hover:shadow-primary/25 transition-all"
                  >
                    New Chat
                  </button>
                </>
              )}
            </div>
          )}
        </section>

        {/* RIGHT: details */}
        {activeConv && (
          <ChatDetails
            conversation={activeConv}
            currentUserId={user?.id || null}
            online={activeOnline}
            messages={messages}
            open={detailsOpen}
            onClose={() => setDetailsOpen(false)}
            onAction={async (action) => {
              const convId = activeConv.id;
              const otherId = activeConv.participants.find((p) => p.userId !== user?.id)?.userId;
              if (action === "mute") {
                setConversations((prev) => prev.map((c) => (c.id === convId ? { ...c, isMuted: !c.isMuted } : c)));
              } else if (action === "clear") {
                if (confirm("Clear all messages in this chat?")) {
                  setMessages([]);
                }
              } else if (action === "delete") {
                if (confirm("Delete this conversation?")) {
                  setConversations((prev) => prev.filter((c) => c.id !== convId));
                  setMessages([]);
                  setActiveId(null);
                  setDetailsOpen(false);
                  setMobileView("list");
                }
              } else if (action === "block") {
                if (!otherId) return;
                if (confirm(`Block ${activeConv.name}? They will no longer be able to message you.`)) {
                  try {
                    await api.blockUser(otherId);
                    setConversations((prev) => prev.filter((c) => c.id !== convId));
                    setMessages([]);
                    setActiveId(null);
                    setDetailsOpen(false);
                    setMobileView("list");
                    alert(`${activeConv.name} has been blocked.`);
                  } catch (err: any) {
                    alert(err?.message || "Failed to block user.");
                  }
                }
              } else if (action === "report") {
                if (!otherId) return;
                const reason = prompt("Report reason (e.g. Spam, Harassment, Hate speech, Other):", "HARASSMENT");
                if (!reason || !reason.trim()) return;
                try {
                  await api.reportUser(otherId, reason.trim().toUpperCase().replace(/[ -]/g, "_"));
                  alert("Thanks for reporting. Our team will review this account.");
                } catch (err: any) {
                  alert(err?.message || "Failed to submit report.");
                }
              }
            }}
          />
        )}
      </div>

      <NewChatModal
        open={newChatOpen}
        onClose={() => setNewChatOpen(false)}
        currentUserId={user?.id || null}
        onCreated={onCreated}
      />

      <MediaViewer message={viewerMsg} onClose={() => setViewerMsg(null)} />

      <AnimatePresence>
        {forwardMsg && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setForwardMsg(null)}
          >
            <motion.div
              role="dialog"
              aria-label="Forward message"
              initial={{ scale: 0.94, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0, y: 12 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm glass-strong rounded-2xl border border-border shadow-premium p-5"
            >
              <h4 className="text-sm font-semibold text-foreground mb-3">Forward to</h4>
              <div className="space-y-1 max-h-64 overflow-y-auto no-scrollbar">
                {conversations.length === 0 && (
                  <p className="text-xs text-muted-foreground py-4 text-center">No conversations to forward to</p>
                )}
                {conversations.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => sendForward(c.id)}
                    className="w-full flex items-center gap-2.5 px-2 py-2 rounded-xl hover:bg-muted/60 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center text-white text-[10px] font-bold overflow-hidden shrink-0">
                      {c.avatar ? <img src={c.avatar} alt="" className="w-full h-full object-cover" /> : c.name.slice(0, 2).toUpperCase()}
                    </div>
                    <span className="text-sm text-foreground truncate flex-1">{c.name}</span>
                  </button>
                ))}
              </div>
              <button
                onClick={() => setForwardMsg(null)}
                className="w-full mt-3 h-9 rounded-xl bg-muted/60 text-sm text-muted-foreground hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              {/* TODO(backend): add server-side `isForwarded` flag + cross-conversation copy endpoint. */}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {call && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            onClick={() => setCall(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-sm glass rounded-3xl p-8 text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative w-24 h-24 rounded-full bg-gradient-primary flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4 overflow-hidden">
                {activeConv?.avatar ? (
                  <img src={activeConv.avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  (activeConv?.name || "?").slice(0, 2).toUpperCase()
                )}
                {activeOnline && <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-500 ring-2 ring-white" />}
              </div>
              <h3 className="text-lg font-bold text-foreground">{activeConv?.name}</h3>
              <p className={cn("text-sm mt-1 flex items-center justify-center gap-1.5", callRinging ? "text-amber-500" : "text-green-500")}>
                {callRinging ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Phone className="w-3.5 h-3.5" />}
                {callRinging ? "Calling..." : call.kind === "voice" ? "Voice call in progress" : "Video call in progress"}
              </p>

              {call.kind === "video" && (
                <div className="mt-5 aspect-video rounded-2xl bg-background/60 border border-border flex items-center justify-center overflow-hidden relative">
                  <Video className="w-8 h-8 text-muted-foreground/40" />
                  <p className="absolute bottom-2 inset-x-0 text-[10px] text-muted-foreground/60">
                    Video preview — {callRinging ? "waiting for the other side" : "connected"}
                  </p>
                </div>
              )}

              <div className="mt-6 grid grid-cols-3 gap-3 max-w-xs mx-auto">
                <button
                  onClick={() => setCall((c) => (c ? { ...c, muted: !c.muted } : c))}
                  aria-label="Toggle mute"
                  className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center transition-all",
                    call.muted ? "bg-red-500 text-white" : "bg-muted text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Mic className={cn("w-5 h-5", call.muted && "line-through")} />
                </button>
                <button
                  onClick={() => setCall(null)}
                  aria-label="End call"
                  className="w-14 h-14 rounded-2xl bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-all"
                >
                  <Phone className="w-5 h-5 rotate-[135deg]" />
                </button>
                <button
                  onClick={() => setCall((c) => (c ? { ...c, speakerOff: !c.speakerOff } : c))}
                  aria-label="Toggle speaker"
                  className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center transition-all",
                    call.speakerOff ? "bg-red-500 text-white" : "bg-muted text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Volume2 className={cn("w-5 h-5", call.speakerOff && "line-through")} />
                </button>
              </div>
              <p className="text-[10px] text-muted-foreground/60 mt-4">
                Calls use the WebRTC UI — a server-side signaling backend isn't wired up yet.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function cnAside(hidden: boolean) {
  return (
    "flex flex-col w-full sm:w-80 lg:w-80 xl:w-96 border-r border-border shrink-0 " +
    (hidden ? "hidden sm:flex" : "flex")
  );
}

function cnChat(hidden: boolean) {
  return (
    "flex flex-col flex-1 min-w-0 relative " +
    (hidden ? "hidden sm:flex" : "flex")
  );
}
