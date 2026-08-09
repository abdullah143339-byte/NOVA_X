"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { X, Send, Heart, Trash2, MessageCircle, Loader2, Smile } from "lucide-react";
import api from "@/lib/api";
import type { ReelComment } from "./types";

const EMOJIS = ["🔥", "❤️", "😂", "😍", "👍", "👏", "💯", "🤯", "😢", "🙌"];

function extractComments(raw: unknown): ReelComment[] {
  if (Array.isArray(raw)) return raw as ReelComment[];
  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    if (Array.isArray(obj.comments)) return obj.comments as ReelComment[];
    if (Array.isArray(obj.items)) return obj.items as ReelComment[];
    if (Array.isArray(obj.data)) return obj.data as ReelComment[];
  }
  return [];
}

function authorName(c: ReelComment): string {
  if (!c.author) return "Unknown";
  return c.author.displayName || [c.author.firstName, c.author.lastName].filter(Boolean).join(" ") || c.author.username;
}

interface ReelCommentsProps {
  reelId: string;
  currentUserId?: string;
  onClose: () => void;
  onCommented?: () => void;
}

export default function ReelComments({ reelId, currentUserId, onClose, onCommented }: ReelCommentsProps) {
  const [comments, setComments] = useState<ReelComment[]>([]);
  const [replies, setReplies] = useState<Record<string, ReelComment[]>>({});
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [posting, setPosting] = useState(false);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [postingReply, setPostingReply] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [likedComments, setLikedComments] = useState<Set<string>>(new Set());
  const [closing, setClosing] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef(1);

  const close = () => {
    setClosing(true);
    window.setTimeout(() => { setClosing(false); onClose(); }, 200);
  };

  const load = useCallback((p: number) => {
    return api.getPostComments(reelId, p)
      .then((res) => {
        const list = extractComments(res.data);
        setComments((prev) => (p === 1 ? list : [...prev, ...list]));
        setHasMore(list.length >= 20);
      })
      .catch(() => { if (p === 1) setComments([]); })
      .finally(() => { setLoading(false); setLoadingMore(false); });
  }, [reelId]);

  useEffect(() => {
    load(1);
  }, [load]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver((entries) => {
      const entry = entries[0];
      if (entry.isIntersecting && hasMore && !loading && !loadingMore) {
        setLoadingMore(true);
        const next = pageRef.current + 1;
        pageRef.current = next;
        load(next);
      }
    }, { root: scrollRef.current, rootMargin: "80px" });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore, load]);

  const submitComment = async () => {
    const text = newComment.trim();
    if (!text || posting) return;
    setPosting(true);
    try {
      await api.commentOnPost(reelId, text);
      setNewComment("");
      onCommented?.();
      load(1);
    } catch { /* keep input for retry */ } finally { setPosting(false); }
  };

  const submitReply = async (parentId: string) => {
    const text = replyText.trim();
    if (!text || postingReply) return;
    setPostingReply(true);
    try {
      await api.commentOnPost(reelId, text, parentId);
      const fresh: ReelComment = {
        id: `local-${Date.now()}`,
        postId: reelId,
        parentId,
        content: text,
        createdAt: new Date().toISOString(),
        author: undefined,
      };
      setReplies((prev) => ({ ...prev, [parentId]: [...(prev[parentId] || []), fresh] }));
      setReplyText("");
      setReplyTo(null);
      onCommented?.();
    } catch { /* keep input for retry */ } finally { setPostingReply(false); }
  };

  const toggleLikeComment = (id: string) => {
    setLikedComments((prev) => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
    // TODO(backend): comment reactions endpoint is missing. Wire the real call when added.
    api.reactToComment(id).catch(() => {});
  };

  const deleteComment = (id: string) => {
    setComments((prev) => prev.filter((c) => c.id !== id));
    setReplies((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    // TODO(backend): comment deletion endpoint is missing. Wire the real call when added.
    api.deleteComment(reelId, id).catch(() => {});
  };

  const insertEmoji = (emoji: string) => {
    if (replyTo) setReplyText((t) => t + emoji);
    else setNewComment((t) => t + emoji);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: closing ? 0 : 1 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end justify-center"
      onClick={close}
      role="dialog"
      aria-modal="true"
      aria-label="Comments"
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: closing ? "100%" : 0 }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg glass-strong rounded-t-3xl flex flex-col max-h-[78dvh] overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-border">
          <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-primary" /> Comments
          </h2>
          <button onClick={close} aria-label="Close comments" className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-3 space-y-4 no-scrollbar">
          {loading && (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>
          )}

          {!loading && comments.length === 0 && (
            <div className="text-center py-10">
              <MessageCircle className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm font-medium text-foreground">No comments yet</p>
              <p className="text-xs text-muted-foreground mt-1">Be the first to start the conversation.</p>
            </div>
          )}

          {!loading && comments.map((c) => (
            <div key={c.id} className="space-y-2">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center text-white text-[10px] font-bold shrink-0 overflow-hidden">
                  {c.author?.avatar ? <img src={c.author.avatar} alt="" className="w-full h-full object-cover" /> : authorName(c)[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs font-semibold text-foreground">@{c.author?.username || "unknown"}</span>
                    <span className="text-[10px] text-muted-foreground">{new Date(c.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm text-foreground/90 break-words">{c.content}</p>
                  <div className="flex items-center gap-4 mt-1">
                    <button
                      onClick={() => toggleLikeComment(c.id)}
                      aria-label="Like comment"
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-red-500 transition-colors"
                    >
                      <Heart className={`w-3.5 h-3.5 ${likedComments.has(c.id) ? "fill-red-500 text-red-500" : ""}`} />
                      {c.reactionsCount ?? 0}
                    </button>
                    <button onClick={() => setReplyTo(c.id)} className="text-xs text-muted-foreground hover:text-primary transition-colors">
                      Reply
                    </button>
                    {c.repliesCount && c.repliesCount > 0 ? (
                      <span className="text-xs text-muted-foreground">{c.repliesCount} replies</span>
                    ) : null}
                    {currentUserId && c.author?.id === currentUserId && (
                      <button onClick={() => deleteComment(c.id)} aria-label="Delete comment" className="text-xs text-muted-foreground hover:text-red-500 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {(replies[c.id] || []).map((r) => (
                    <div key={r.id} className="flex gap-2 mt-2 pl-4">
                      <div className="w-6 h-6 rounded-full bg-gradient-primary flex items-center justify-center text-white text-[9px] font-bold shrink-0 overflow-hidden">
                        {r.author?.avatar ? <img src={r.author.avatar} alt="" className="w-full h-full object-cover" /> : "R"}
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-semibold text-foreground">@{r.author?.username || "you"}</span>
                        <p className="text-sm text-foreground/90 break-words">{r.content}</p>
                      </div>
                    </div>
                  ))}

                  {replyTo === c.id && (
                    <div className="flex items-center gap-2 mt-2">
                      <input
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") submitReply(c.id); }}
                        placeholder={`Reply to @${c.author?.username || "..."}`}
                        aria-label="Reply to comment"
                        className="flex-1 h-9 rounded-full bg-muted/70 border border-border px-3.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                      <button
                        onClick={() => submitReply(c.id)}
                        disabled={!replyText.trim() || postingReply}
                        aria-label="Post reply"
                        className="w-9 h-9 rounded-full bg-gradient-primary flex items-center justify-center text-white disabled:opacity-40 transition-all"
                      >
                        {postingReply ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          <div ref={sentinelRef} className="h-2" />
          {loadingMore && <div className="flex justify-center py-2"><Loader2 className="w-5 h-5 text-primary animate-spin" /></div>}
        </div>

        <div className="border-t border-border p-3">
          {emojiOpen && (
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-2">
              {EMOJIS.map((e) => (
                <button key={e} onClick={() => insertEmoji(e)} className="w-8 h-8 shrink-0 rounded-lg hover:bg-muted flex items-center justify-center text-lg transition-colors" aria-label={`Add ${e}`}>
                  {e}
                </button>
              ))}
            </div>
          )}
          <div className="flex items-center gap-2">
            <button onClick={() => setEmojiOpen((v) => !v)} aria-label="Emoji" className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${emojiOpen ? "bg-primary/15 text-primary" : "hover:bg-muted text-muted-foreground"}`}>
              <Smile className="w-4 h-4" />
            </button>
            <input
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") submitComment(); }}
              placeholder="Add a comment..."
              aria-label="Add a comment"
              className="flex-1 h-10 rounded-full bg-muted/70 border border-border px-4 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <button
              onClick={submitComment}
              disabled={!newComment.trim() || posting}
              aria-label="Post comment"
              className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center text-white disabled:opacity-40 transition-all"
            >
              {posting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
