"use client";

import { useState } from "react";
import { Heart, Send, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProjectCommentRow } from "./types";
import { ProjectAvatar } from "./ProjectShared";
import { formatCount } from "./data";

export function CommentsPanel({
  comments,
  adding,
  onAdd,
  onLike,
}: {
  comments: ProjectCommentRow[];
  adding: boolean;
  onAdd: (content: string) => Promise<void>;
  onLike: (id: string) => void;
}) {
  const [text, setText] = useState("");
  const [liked, setLiked] = useState<Record<string, boolean>>({});

  async function submit() {
    if (!text.trim()) return;
    await onAdd(text.trim());
    setText("");
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <div className="flex-1">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={2}
            placeholder="Share your thoughts about this project..."
            className="w-full rounded-xl bg-muted border border-border p-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <button
          type="button"
          onClick={() => void submit()}
          disabled={!text.trim() || adding}
          className="inline-flex items-center gap-1.5 px-3 h-10 rounded-xl bg-gradient-primary text-white text-xs font-semibold shrink-0 self-start disabled:opacity-60"
        >
          {adding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          Post
        </button>
      </div>
      <div className="space-y-3">
        {comments.length === 0 && (
          <div className="text-center py-8 text-sm text-muted-foreground">No comments yet. Start the conversation.</div>
        )}
        {comments.map((c) => {
          const isLiked = Boolean(liked[c.id]);
          const count = c.likes + (isLiked ? 1 : 0);
          return (
            <div key={c.id} className="flex gap-3">
              <ProjectAvatar avatar={c.user.avatar} name={c.user.name} size={9} />
              <div className="flex-1 min-w-0 glass rounded-xl px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-foreground">{c.user.name}</span>
                  <span className="text-[11px] text-muted-foreground">@{c.user.username}</span>
                  <span className="text-[11px] text-muted-foreground/60 ml-auto">{new Date(c.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="text-sm text-foreground/90 mt-1">{c.content}</p>
                <button
                  type="button"
                  onClick={() => {
                    const next = !isLiked;
                    setLiked((prev) => ({ ...prev, [c.id]: next }));
                    onLike(c.id);
                  }}
                  className={cn(
                    "inline-flex items-center gap-1 text-[11px] mt-1.5 transition-colors",
                    isLiked ? "text-red-500" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Heart className={cn("w-3.5 h-3.5", isLiked && "fill-red-500")} />
                  {formatCount(count)}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
