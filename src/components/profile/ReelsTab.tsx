"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, MessageCircle, Play, X, Trash2 } from "lucide-react";
import EmptyState from "./EmptyState";
import { cn } from "@/lib/utils";
import type { PostData } from "./types";

interface ReelsTabProps {
  reels: PostData[];
  isOwner: boolean;
  onDelete: (id: string) => void;
}

export default function ReelsTab({ reels, isOwner, onDelete }: ReelsTabProps) {
  const [activeReel, setActiveReel] = useState<PostData | null>(null);

  const mediaUrl = (reel: PostData) => {
    const m = Array.isArray(reel.media) ? reel.media : [];
    return m[0]?.url || "";
  };

  return (
    <div className="space-y-4">
      {reels.length === 0 ? (
        <EmptyState emoji="🎬" title="No reels yet" subtitle="Upload short videos (max 5 min) to showcase your work" />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {reels.map((reel, i) => (
            <motion.div
              key={reel.id}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.04 }}
              className="aspect-[9/12] glass rounded-2xl overflow-hidden cursor-pointer group relative"
            >
              {mediaUrl(reel) && <video src={mediaUrl(reel)} className="w-full h-full object-cover" muted playsInline />}
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center" onClick={() => setActiveReel(reel)}>
                <span className="w-12 h-12 rounded-full bg-black/50 flex items-center justify-center"><Play className="w-6 h-6 text-white" /></span>
              </div>
              {isOwner && (
                <button onClick={() => onDelete(reel.id)} aria-label="Delete reel" className="absolute top-2 right-2 z-10 p-1.5 rounded-lg bg-black/50 text-white/80 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
              <div className="absolute bottom-2 left-2 right-2 flex items-center gap-3 text-white text-[11px]">
                <span className="flex items-center gap-1"><Heart className="w-3 h-3" /> {reel.likeCount ?? reel.reactionsCount ?? 0}</span>
                <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" /> {reel.commentCount ?? reel.commentsCount ?? 0}</span>
                {reel.viewCount !== undefined && <span className="ml-auto opacity-80">{reel.viewCount} views</span>}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {activeReel && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
            onClick={() => setActiveReel(null)}
          >
            <motion.div
              initial={{ scale: 0.94 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.94 }}
              className="relative w-full max-w-sm h-full sm:h-auto sm:aspect-[9/16] sm:max-h-[85dvh] rounded-none sm:rounded-2xl overflow-hidden bg-black"
              onClick={(e) => e.stopPropagation()}
            >
              {mediaUrl(activeReel) && <video src={mediaUrl(activeReel)} className="w-full h-full object-contain" controls autoPlay playsInline />}
              <button onClick={() => setActiveReel(null)} aria-label="Close reel" className="absolute top-3 right-3 p-2 rounded-lg bg-black/50 text-white hover:bg-black/70 transition-all">
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
