"use client";

import { useState } from "react";
import { Heart, MessageCircle, Bookmark, BookmarkCheck, Share2, Trash2, Send, Loader2, Play } from "lucide-react";
import api from "@/lib/api";
import { timeAgo, parseTags } from "./data";
import { cn } from "@/lib/utils";
import type { PostData } from "./types";

interface PostCardItemProps {
  post: PostData;
  isOwner?: boolean;
  isSaved?: boolean;
  onToggleBookmark: (id: string) => void;
  onDelete: (id: string) => void;
  notify: (msg: string, type?: "success" | "error" | "info") => void;
}

export default function PostCardItem({ post, isOwner, isSaved, onToggleBookmark, onDelete, notify }: PostCardItemProps) {
  const [liked, setLiked] = useState(!!post.isLiked);
  const [likeCount, setLikeCount] = useState(post.likeCount ?? post.reactionsCount ?? 0);
  const [bookmarked, setBookmarked] = useState(!!post.isBookmarked);
  const [comments, setComments] = useState<PostData[]>([]);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentInput, setCommentInput] = useState("");
  const [commenting, setCommenting] = useState(false);
  const [commentCount, setCommentCount] = useState(post.commentCount ?? post.commentsCount ?? 0);

  const author = (post.author || {}) as { id?: string; username?: string; displayName?: string; firstName?: string; lastName?: string; avatar?: string | null };
  const authorName = author.displayName || [author.firstName, author.lastName].filter(Boolean).join(" ") || author.username || "Unknown";
  const tags = parseTags(post.tags);

  const toggleLike = async () => {
    const next = !liked;
    setLiked(next);
    setLikeCount((c) => c + (next ? 1 : -1));
    try {
      await api.reactToPost(post.id);
    } catch {
      setLiked(!next);
      setLikeCount((c) => c + (next ? -1 : 1));
    }
  };

  const toggleComments = async () => {
    setCommentsOpen((o) => !o);
    if (!commentsOpen && comments.length === 0) {
      setCommentsLoading(true);
      try {
        const res = await api.getPostComments(post.id);
        const items = Array.isArray(res.data) ? res.data : res.data?.comments || [];
        setComments(items);
      } catch {
      } finally {
        setCommentsLoading(false);
      }
    }
  };

  const submitComment = async () => {
    const content = commentInput.trim();
    if (!content || commenting) return;
    setCommenting(true);
    try {
      await api.commentOnPost(post.id, content);
      setCommentInput("");
      setCommentCount((c) => c + 1);
      const res = await api.getPostComments(post.id);
      const items = Array.isArray(res.data) ? res.data : res.data?.comments || [];
      setComments(items);
      notify("Comment added");
    } catch {
      notify("Failed to comment", "error");
    } finally {
      setCommenting(false);
    }
  };

  const bookmark = () => {
    const next = !bookmarked;
    setBookmarked(next);
    try {
      api.toggleBookmark(post.id);
      if (isSaved && !next) onToggleBookmark(post.id);
    } catch {}
  };

  const share = () => {
    try {
      api.sharePost(post.id);
      notify("Post shared");
    } catch {}
  };

  const media = Array.isArray(post.media) ? post.media : [];
  const isVideo = post.type === "VIDEO" || media.some((m) => m.type === "VIDEO" || /\.(mp4|webm|mov)$/i.test(m.url));

  return (
    <div className="glass rounded-2xl overflow-hidden">
      {media.length > 0 && (
        <div className={cn(isVideo ? "aspect-[9/12]" : "aspect-square", "bg-muted overflow-hidden relative")}>
          {media.map((m, i) =>
            m.type === "VIDEO" || /\.(mp4|webm|mov)$/i.test(m.url) ? (
              <video key={i} src={m.url} className="w-full h-full object-cover" controls playsInline />
            ) : (
              <img key={i} src={m.url} alt="" className="w-full h-full object-cover" />
            )
          )}
          {isVideo && media.length === 0 && (
            <span className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
              <span className="w-12 h-12 rounded-full bg-black/50 flex items-center justify-center"><Play className="w-6 h-6 text-white" /></span>
            </span>
          )}
        </div>
      )}
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center text-white text-xs font-bold shrink-0 overflow-hidden">
            {author.avatar ? <img src={author.avatar} alt="" className="w-full h-full object-cover" /> : (authorName[0] || "U").toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-foreground truncate">{authorName}</span>
              {author.username && <span className="text-xs text-muted-foreground">@{author.username}</span>}
              <span className="text-[11px] text-muted-foreground ml-auto shrink-0">{timeAgo(post.createdAt)}</span>
              {isOwner && (
                <button onClick={() => onDelete(post.id)} aria-label="Delete post" className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-all">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            {post.content && <p className="text-sm text-foreground mt-2 whitespace-pre-wrap">{post.content}</p>}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {tags.map((tag) => (
                  <span key={tag} className="px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[11px]">#{tag}</span>
                ))}
              </div>
            )}
            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border">
              <button onClick={toggleLike} aria-label={liked ? "Unlike" : "Like"} className={cn("flex items-center gap-1.5 text-xs transition-all", liked ? "text-red-500" : "text-muted-foreground hover:text-red-500")}>
                <Heart className={cn("w-4 h-4", liked && "fill-red-500")} /> {likeCount}
              </button>
              <button onClick={toggleComments} aria-label="Comments" className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-all">
                <MessageCircle className="w-4 h-4" /> {commentCount}
              </button>
              <button onClick={bookmark} aria-label="Bookmark" className={cn("flex items-center gap-1.5 text-xs transition-all", bookmarked ? "text-amber-500" : "text-muted-foreground hover:text-amber-500")}>
                {bookmarked ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
              </button>
              <button onClick={share} aria-label="Share" className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-all">
                <Share2 className="w-4 h-4" />
              </button>
            </div>

            {commentsOpen && (
              <div className="mt-3 pt-3 border-t border-border space-y-3">
                {commentsLoading ? (
                  <div className="flex justify-center py-2"><Loader2 className="w-4 h-4 text-primary animate-spin" /></div>
                ) : comments.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-1">No comments yet</p>
                ) : (
                  comments.map((comment) => {
                    const cAuthor = (comment.author || {}) as { id?: string; username?: string; displayName?: string; firstName?: string; lastName?: string; avatar?: string | null };
                    const cName = cAuthor.displayName || [cAuthor.firstName, cAuthor.lastName].filter(Boolean).join(" ") || cAuthor.username || "Unknown";
                    return (
                      <div key={comment.id} className="flex items-start gap-2">
                        <div className="w-6 h-6 rounded-md bg-gradient-primary flex items-center justify-center text-white text-[8px] font-bold shrink-0 mt-0.5 overflow-hidden">
                          {cAuthor.avatar ? <img src={cAuthor.avatar} alt="" className="w-full h-full object-cover" /> : (cName[0] || "U").toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-medium text-foreground">{cName}</span>
                            <span className="text-[10px] text-muted-foreground">{timeAgo(comment.createdAt)}</span>
                          </div>
                          <p className="text-xs text-foreground mt-0.5">{comment.content}</p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div className="flex items-center gap-2">
                  <input
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") submitComment(); }}
                    placeholder="Write a comment..."
                    aria-label="Comment"
                    className="flex-1 h-8 rounded-lg bg-muted border border-border px-3 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/50"
                  />
                  <button onClick={submitComment} disabled={!commentInput.trim() || commenting} aria-label="Send comment" className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary disabled:opacity-30">
                    {commenting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
