"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  BookmarkCheck,
  MoreHorizontal,
  Sparkles,
  Music,
  BadgeCheck,
} from "lucide-react";
import type { Reel } from "./types";

function formatCount(n?: number): string {
  if (!n) return "0";
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  return n.toString();
}

interface ActionButtonProps {
  label: string;
  count?: number;
  active?: boolean;
  activeClass?: string;
  onClick?: () => void;
  children: React.ReactNode;
}

function ActionButton({ label, count, active, activeClass, onClick, children }: ActionButtonProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.82 }}
      onClick={onClick}
      aria-label={label}
      title={label}
      className="flex flex-col items-center gap-1.5 group"
    >
      <div
        className={`w-11 h-11 rounded-2xl glass-strong flex items-center justify-center backdrop-blur-md transition-all duration-300 group-hover:scale-110 ${
          active && activeClass ? activeClass : ""
        }`}
      >
        {children}
      </div>
      <span className="text-[11px] font-medium text-white/90 tabular-nums">{count !== undefined ? formatCount(count) : ""}</span>
    </motion.button>
  );
}

interface ReelActionRailProps {
  reel: Reel;
  currentUserId?: string;
  onLike: () => void;
  onComment: () => void;
  onShare: () => void;
  onBookmark: () => void;
  onProfile: () => void;
  onOpenAiSummary: () => void;
  onMore: () => void;
}

export default function ReelActionRail({
  reel,
  currentUserId,
  onLike,
  onComment,
  onShare,
  onBookmark,
  onProfile,
  onOpenAiSummary,
  onMore,
}: ReelActionRailProps) {
  const initials = [reel.author.firstName?.[0], reel.author.lastName?.[0]].filter(Boolean).join("") || reel.author.username.slice(0, 2).toUpperCase();

  return (
    <div className="absolute right-3 bottom-32 sm:bottom-24 z-20 flex flex-col items-center gap-4" aria-label="Reel actions">
      <motion.button
        whileTap={{ scale: 0.85 }}
        onClick={onProfile}
        aria-label="View profile"
        title={reel.author.username}
        className="relative w-12 h-12 rounded-full bg-gradient-primary p-[2px] ring-2 ring-white/30 hover:ring-white/70 transition-all"
      >
        <div className="w-full h-full rounded-full bg-[#0B0D12] overflow-hidden flex items-center justify-center">
          {reel.author.avatar ? (
            <img src={reel.author.avatar} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-xs font-bold text-white">{initials}</span>
          )}
        </div>
        {reel.author.isVerified && <BadgeCheck className="absolute -bottom-0.5 -right-0.5 w-4 h-4 text-accent bg-[#0B0D12] rounded-full" />}
      </motion.button>

      <div className="relative">
        <ActionButton label={reel.isLiked ? "Unlike" : "Like"} count={reel.likesCount} active={reel.isLiked} activeClass="bg-red-500/25" onClick={onLike}>
          <Heart className={`w-5 h-5 transition-all ${reel.isLiked ? "text-red-500 fill-red-500 scale-110" : "text-white"}`} />
        </ActionButton>
        <AnimatePresence>
          {reel.isLiked && (
            <motion.div
              key="burst"
              initial={{ scale: 0.4, opacity: 0.9 }}
              animate={{ scale: 1.8, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
            >
              <Heart className="w-12 h-12 text-red-500 fill-red-500" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <ActionButton label="Comment" count={reel.commentsCount} onClick={onComment}>
        <MessageCircle className="w-5 h-5 text-white" />
      </ActionButton>

      <ActionButton label="Share" count={reel.sharesCount} onClick={onShare}>
        <Share2 className="w-5 h-5 text-white" />
      </ActionButton>

      <ActionButton label="Save" active={reel.isBookmarked} activeClass="bg-primary/25" onClick={onBookmark}>
        {reel.isBookmarked ? <BookmarkCheck className="w-5 h-5 text-primary" /> : <Bookmark className="w-5 h-5 text-white" />}
      </ActionButton>

      <ActionButton label="AI summary" onClick={onOpenAiSummary}>
        <Sparkles className="w-5 h-5 text-accent" />
      </ActionButton>

      {reel.music && (
        <div className="flex flex-col items-center gap-1.5" aria-label="Music">
          <div className="w-11 h-11 rounded-2xl glass-strong flex items-center justify-center">
            <Music className="w-5 h-5 text-white animate-pulse" />
          </div>
        </div>
      )}

      {currentUserId && reel.author.id === currentUserId && (
        <ActionButton label="More" onClick={onMore}>
          <MoreHorizontal className="w-5 h-5 text-white" />
        </ActionButton>
      )}
    </div>
  );
}
