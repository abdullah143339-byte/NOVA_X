"use client";

import { motion } from "framer-motion";
import { Play } from "lucide-react";
import EmptyState from "./EmptyState";
import { cn } from "@/lib/utils";
import type { PostData } from "./types";

interface MediaTabProps {
  posts: PostData[];
  layout: "grid" | "list";
}

export default function MediaTab({ posts, layout }: MediaTabProps) {
  const media = posts
    .flatMap((post) =>
      (Array.isArray(post.media) ? post.media : []).map((m, i) => ({
        id: `${post.id}-${i}`,
        url: m.url,
        type: m.type || (/\.(mp4|webm|mov)$/i.test(m.url) ? "VIDEO" : "IMAGE"),
        postId: post.id,
      }))
    )
    .filter((m) => !!m.url);

  if (media.length === 0) {
    return <EmptyState emoji="🖼️" title="No media yet" subtitle="Posts with photos or videos will appear here" />;
  }

  if (layout === "list") {
    return (
      <div className="space-y-3">
        {media.map((m, i) => (
          <motion.div key={m.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="flex items-center gap-3 p-3 glass rounded-xl">
            <div className={cn("w-20 h-20 rounded-xl overflow-hidden bg-muted shrink-0 relative", m.type === "VIDEO" && "aspect-[9/12] w-14 h-20")}>
              {m.type === "VIDEO" ? (
                <video src={m.url} className="w-full h-full object-cover" muted playsInline />
              ) : (
                <img src={m.url} alt="" className="w-full h-full object-cover" />
              )}
              {m.type === "VIDEO" && <span className="absolute inset-0 flex items-center justify-center bg-black/30"><Play className="w-5 h-5 text-white" /></span>}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground truncate">Media from post</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{m.type === "VIDEO" ? "Video" : "Image"} · {new URL(m.url).pathname.split("/").pop()?.slice(0, 24) || "attachment"}</p>
            </div>
            <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", m.type === "VIDEO" ? "bg-primary/10 text-primary" : "bg-emerald-500/10 text-emerald-400")}>
              {m.type === "VIDEO" ? "🎬" : "🖼️"}
            </span>
          </motion.div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {media.map((m, i) => (
        <motion.div
          key={m.id}
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.03 }}
          className={cn("rounded-2xl overflow-hidden bg-muted relative group", m.type === "VIDEO" ? "aspect-[9/12]" : "aspect-square")}
        >
          {m.type === "VIDEO" ? (
            <video src={m.url} className="w-full h-full object-cover" muted playsInline />
          ) : (
            <img src={m.url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          )}
          {m.type === "VIDEO" && (
            <span className="absolute inset-0 flex items-center justify-center bg-black/30"><span className="w-10 h-10 rounded-full bg-black/50 flex items-center justify-center"><Play className="w-5 h-5 text-white" /></span></span>
          )}
        </motion.div>
      ))}
    </div>
  );
}
