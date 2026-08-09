"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Send,
  Loader2,
  MessageSquare,
  ArrowLeft,
  RefreshCw,
  Package,
  Store,
} from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/providers/AuthProvider";
import { cn } from "@/lib/utils";

interface Msg {
  id: string;
  senderId: string;
  content: string;
  type: string;
  media?: { url?: string }[] | null;
  createdAt: string;
}

interface Conv {
  id: string;
  name: string;
  lastMessage: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
}

function extractList<T>(raw: unknown): T[] {
  if (Array.isArray(raw)) return raw as T[];
  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    if (Array.isArray(obj.items)) return obj.items as T[];
    if (Array.isArray(obj.conversations)) return obj.conversations as T[];
    if (Array.isArray(obj.messages)) return obj.messages as T[];
  }
  return [];
}

function timeAgo(iso: string | null | undefined): string {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

export default function MarketplaceMessagesPage() {
  const { user } = useAuth();
  const params = useSearchParams();

  const [convs, setConvs] = useState<Conv[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [mobileChat, setMobileChat] = useState(false);
  const [productTitle, setProductTitle] = useState<string | null>(null);

  const activeRef = useRef<string | null>(null);
  activeRef.current = activeId;
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadConvs = useCallback(async () => {
    setLoadingConvs(true);
    try {
      const res = await api.getConversations();
      setConvs(extractList<Conv>(res.data));
    } catch {
      // ignore
    } finally {
      setLoadingConvs(false);
    }
  }, []);

  const loadMessages = useCallback(async (convId: string) => {
    setLoadingMsgs(true);
    try {
      const res = await api.getMessages(convId);
      const list = extractList<Msg>(res.data);
      setMessages([...list].reverse());
    } catch {
      setMessages([]);
    } finally {
      setLoadingMsgs(false);
    }
  }, []);

  const select = useCallback(
    (convId: string) => {
      if (convId === activeRef.current) return;
      activeRef.current = convId;
      setActiveId(convId);
      setMobileChat(true);
      setProductTitle(null);
      loadMessages(convId);
    },
    [loadMessages]
  );

  const openWithSeller = useCallback(
    async (sellerId: string) => {
      if (!sellerId || sellerId === user?.id) {
        setMobileChat(true);
        return;
      }
      try {
        const res = await api.createConversation({ participantId: sellerId, type: "DIRECT" });
        const conv = res?.data as Conv;
        if (conv?.id) {
          activeRef.current = conv.id;
          setActiveId(conv.id);
          setMobileChat(true);
          setLoadingConvs(true);
          loadConvs().finally(() => setLoadingConvs(false));
          loadMessages(conv.id);
        }
      } catch {
        setMobileChat(true);
      }
    },
    [user, loadConvs, loadMessages]
  );

  useEffect(() => {
    const seller = params.get("seller");
    const title = params.get("title");
    if (title) setProductTitle(title);
    if (seller) openWithSeller(seller);
    else loadConvs();
  }, [params, openWithSeller, loadConvs]);

  // Light polling so new replies from buyers/sellers show up without a refresh.
  useEffect(() => {
    if (!activeId) return;
    const t = window.setInterval(() => loadMessages(activeId), 8000);
    return () => window.clearInterval(t);
  }, [activeId, loadMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    const content = draft.trim();
    if (!activeId || !content || sending) return;
    const optimistic: Msg = {
      id: `local-${Date.now()}`,
      senderId: user?.id ?? "",
      content,
      type: "TEXT",
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    setDraft("");
    setSending(true);
    api
      .sendMessage(activeId, content)
      .then((res: { data: Msg }) => {
        const server = res.data;
        setMessages((prev) => prev.map((m) => (m.id === optimistic.id ? server : m)));
        loadConvs();
      })
      .catch(() => {
        setMessages((prev) => prev.map((m) => (m.id === optimistic.id ? { ...m, content: `${m.content} (failed)` } : m)));
      })
      .finally(() => setSending(false));
  };

  const activeConv = convs.find((c) => c.id === activeId) || null;

  return (
    <div className="h-[calc(100dvh-13rem)] lg:h-[calc(100dvh-8rem)]">
      <div className="flex h-full overflow-hidden glass rounded-2xl border border-border">
        {/* Conversation list */}
        <aside
          className={cn(
            "flex flex-col w-full sm:w-80 lg:w-96 border-r border-border shrink-0",
            mobileChat && "hidden sm:flex"
          )}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-primary" /> Inbox
            </h2>
            <button
              onClick={loadConvs}
              aria-label="Refresh inbox"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar p-2">
            {loadingConvs && convs.length === 0 ? (
              <div className="flex items-center justify-center h-40">
                <Loader2 className="w-5 h-5 text-primary animate-spin" />
              </div>
            ) : convs.length === 0 ? (
              <div className="text-center px-6 py-10">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <MessageSquare className="w-6 h-6 text-primary" />
                </div>
                <p className="text-sm font-medium text-foreground">No conversations yet</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Open any product and tap <span className="text-primary font-medium">Message Seller</span> to start a chat.
                </p>
                <Link
                  href="/dashboard/marketplace"
                  className="mt-4 inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-primary text-white text-xs font-medium hover:bg-primary/90 transition-all"
                >
                  <Store className="w-3.5 h-3.5" /> Browse Products
                </Link>
              </div>
            ) : (
              convs.map((c) => (
                <button
                  key={c.id}
                  onClick={() => select(c.id)}
                  className={cn(
                    "w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-all",
                    activeId === c.id ? "bg-primary/10" : "hover:bg-muted/60"
                  )}
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {c.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-foreground truncate">{c.name}</p>
                      <span className="text-[10px] text-muted-foreground shrink-0">{timeAgo(c.lastMessageAt)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{c.lastMessage || "Start chatting"}</p>
                  </div>
                  {c.unreadCount > 0 && (
                    <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                      {c.unreadCount}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </aside>

        {/* Chat window */}
        <section className={cn("flex flex-col flex-1 min-w-0", !mobileChat && "hidden sm:flex")}>
          {activeConv ? (
            <>
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
                <button
                  onClick={() => setMobileChat(false)}
                  aria-label="Back to conversations"
                  className="sm:hidden w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div className="w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {activeConv.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-foreground truncate">{activeConv.name}</p>
                  {productTitle && (
                    <p className="text-[11px] text-primary truncate flex items-center gap-1">
                      <Package className="w-3 h-3" /> {productTitle}
                    </p>
                  )}
                </div>
              </div>

              {productTitle && (
                <div className="px-4 py-2 bg-primary/5 border-b border-primary/10">
                  <p className="text-xs text-muted-foreground">
                    You&apos;re chatting with the seller about{" "}
                    <span className="text-foreground font-medium">{productTitle}</span>
                  </p>
                </div>
              )}

              <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-2">
                {loadingMsgs && messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="w-5 h-5 text-primary animate-spin" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <MessageSquare className="w-8 h-8 text-muted-foreground/40 mb-2" />
                    <p className="text-sm text-muted-foreground">Send a message to get started</p>
                  </div>
                ) : (
                  messages.map((m) => {
                    const mine = m.senderId === user?.id;
                    return (
                      <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                        <div
                          className={cn(
                            "max-w-[75%] rounded-2xl px-3.5 py-2 text-sm break-words",
                            mine ? "bg-primary text-white rounded-br-md" : "bg-muted text-foreground rounded-bl-md"
                          )}
                        >
                          {m.media?.[0]?.url && (
                            <img src={m.media[0].url} alt="" className="rounded-xl max-h-56 mb-1.5 object-cover" />
                          )}
                          {m.content && <p className="whitespace-pre-wrap">{m.content}</p>}
                          <span className={cn("block mt-0.5 text-[10px]", mine ? "text-white/70" : "text-muted-foreground")}>
                            {timeAgo(m.createdAt)}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={bottomRef} />
              </div>

              <form onSubmit={send} className="flex items-end gap-2 p-3 border-t border-border">
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      send(e);
                    }
                  }}
                  rows={1}
                  placeholder="Type a message..."
                  aria-label="Message"
                  className="flex-1 h-10 max-h-32 min-h-10 rounded-xl bg-muted border border-border px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none"
                />
                <button
                  type="submit"
                  disabled={!draft.trim() || sending || !activeId}
                  aria-label="Send message"
                  className="h-10 w-11 rounded-xl bg-primary text-white flex items-center justify-center hover:bg-primary/90 transition-all disabled:opacity-40"
                >
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
                <MessageSquare className="w-7 h-7 text-primary" />
              </div>
              <p className="text-base font-semibold text-foreground">Marketplace Inbox</p>
              <p className="text-sm text-muted-foreground mt-1">Talk to sellers and buyers about your products</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
