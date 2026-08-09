"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Flame, Users, Sparkles, TrendingUp, MapPin, Upload, Clapperboard, AlertTriangle, RefreshCw, Loader2 } from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";
import api from "@/lib/api";
import { parseTags } from "@/components/feed/PostCard";
import ReelCard from "@/components/reels/ReelCard";
import ReelSkeleton from "@/components/reels/ReelSkeleton";
import ReelEmpty from "@/components/reels/ReelEmpty";
import UploadReel from "@/components/reels/UploadReel";
import type { Reel, ReelMedia } from "@/components/reels/types";

const CATEGORIES = [
  { id: "For You", label: "For You", icon: Flame },
  { id: "Following", label: "Following", icon: Users },
  { id: "AI Picks", label: "AI Picks", icon: Sparkles },
  { id: "Trending", label: "Trending", icon: TrendingUp },
  { id: "Nearby", label: "Nearby", icon: MapPin },
];

interface ReelAuthorPayload {
  id?: string;
  username?: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  avatar?: string | null;
  isVerified?: boolean;
}

interface ReelPayload {
  id: string;
  content?: string;
  type?: string;
  tags?: unknown;
  visibility?: string;
  isAIGenerated?: boolean;
  viewCount?: number;
  media?: unknown;
  createdAt?: string;
  location?: string;
  music?: string;
  isLiked?: boolean;
  isBookmarked?: boolean;
  likesCount?: number;
  reactionsCount?: number;
  commentsCount?: number;
  sharesCount?: number;
  author?: ReelAuthorPayload;
}

function normalizeReel(raw: ReelPayload): Reel {
  const author = raw.author || {};
  return {
    id: raw.id,
    content: raw.content || "",
    type: raw.type || "VIDEO",
    tags: parseTags(raw.tags),
    visibility: raw.visibility || "PUBLIC",
    isAIGenerated: !!raw.isAIGenerated,
    viewCount: raw.viewCount ?? 0,
    media: Array.isArray(raw.media) ? (raw.media as ReelMedia[]) : null,
    createdAt: raw.createdAt || new Date().toISOString(),
    location: raw.location,
    music: raw.music,
    author: {
      id: author.id || "unknown",
      username: author.username || "unknown",
      displayName: author.displayName,
      firstName: author.firstName,
      lastName: author.lastName,
      avatar: author.avatar,
      isVerified: author.isVerified,
    },
    isLiked: !!raw.isLiked,
    isBookmarked: !!raw.isBookmarked,
    likesCount: raw.likesCount ?? raw.reactionsCount ?? 0,
    commentsCount: raw.commentsCount ?? 0,
    sharesCount: raw.sharesCount ?? 0,
  };
}

export default function ReelsPage() {
  const { user } = useAuth();
  const [category, setCategory] = useState("For You");
  const [reels, setReels] = useState<Reel[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const loadReels = useCallback((cat: string, p: number, replace: boolean) => {
    return api.getReelsFeed(cat, p, 8)
      .then((res) => {
        const raw = res.data;
        let items: ReelPayload[] = [];
        if (Array.isArray(raw)) items = raw as ReelPayload[];
        else if (Array.isArray(raw?.posts)) items = raw.posts;
        else if (Array.isArray(raw?.items)) items = raw.items;
        else if (Array.isArray(raw?.data)) items = raw.data;
        const videos = items.filter((x) => x.type === "VIDEO");
        const mapped = videos.map(normalizeReel);
        setReels((prev) => (replace ? mapped : [...prev, ...mapped]));
        setHasMore(videos.length === 8);
        setError(false);
      })
      .catch(() => {
        if (p === 1) { setReels([]); setError(true); }
      });
  }, []);

  useEffect(() => {
    loadReels("For You", 1, true).finally(() => setLoading(false));
  }, [loadReels]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && hasMore && !loading && !loadingMore && reels.length > 0) {
          setLoadingMore(true);
          const next = page + 1;
          loadReels(category, next, false).finally(() => { setPage(next); setLoadingMore(false); });
        }
      },
      { root: scrollRef.current, rootMargin: "600px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore, page, category, reels.length, loadReels]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = scrollRef.current;
      if (!el) return;
      if (e.key === "ArrowDown") { e.preventDefault(); el.scrollBy({ top: el.clientHeight, behavior: "smooth" }); }
      else if (e.key === "ArrowUp") { e.preventDefault(); el.scrollBy({ top: -el.clientHeight, behavior: "smooth" }); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el || el.clientHeight === 0) return;
    const idx = Math.round(el.scrollTop / el.clientHeight);
    setActiveIndex((prev) => (prev === idx ? prev : idx));
  };

  const selectCategory = (cat: string) => {
    if (cat === category || loading) return;
    setCategory(cat);
    setError(false);
    setReels([]);
    setActiveIndex(0);
    setPage(1);
    setHasMore(true);
    setLoading(true);
    if (scrollRef.current) scrollRef.current.scrollTo({ top: 0 });
    loadReels(cat, 1, true).finally(() => setLoading(false));
  };

  const reload = useCallback(() => {
    setError(false);
    setReels([]);
    setActiveIndex(0);
    setPage(1);
    setHasMore(true);
    setLoading(true);
    if (scrollRef.current) scrollRef.current.scrollTo({ top: 0 });
    loadReels(category, 1, true).finally(() => setLoading(false));
  }, [category, loadReels]);

  const toggleLike = (i: number) => {
    const reel = reels[i];
    if (!reel) return;
    const liked = !reel.isLiked;
    setReels((prev) => prev.map((r, idx) => (idx === i ? { ...r, isLiked: liked, likesCount: (r.likesCount ?? 0) + (liked ? 1 : -1) } : r)));
    api.reactToPost(reel.id).catch(() => {});
  };

  const toggleBookmark = (i: number) => {
    const reel = reels[i];
    if (!reel) return;
    setReels((prev) => prev.map((r, idx) => (idx === i ? { ...r, isBookmarked: !r.isBookmarked } : r)));
    api.toggleBookmark(reel.id).catch(() => {});
  };

  const bumpCommentCount = (i: number) => {
    setReels((prev) => prev.map((r, idx) => (idx === i ? { ...r, commentsCount: (r.commentsCount ?? 0) + 1 } : r)));
  };

  const bumpShareCount = (i: number) => {
    setReels((prev) => prev.map((r, idx) => (idx === i ? { ...r, sharesCount: (r.sharesCount ?? 0) + 1 } : r)));
  };

  const handleDelete = async (i: number) => {
    const reel = reels[i];
    if (!reel || !window.confirm("Delete this reel?")) return;
    try { await api.deletePost(reel.id); } catch { return; }
    setReels((prev) => prev.filter((_, idx) => idx !== i));
    setActiveIndex((prev) => Math.max(0, prev - 1));
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: Math.max(0, i - 1) * el.clientHeight, behavior: "smooth" });
  };

  const startIdx = Math.max(0, activeIndex - 1);
  const endIdx = Math.min(reels.length - 1, activeIndex + 1);
  const windowIndices: number[] = [];
  for (let i = startIdx; i <= endIdx; i++) windowIndices.push(i);

  return (
    <div className="fixed inset-0 lg:left-64 z-40 bg-[#0B0D12] overflow-hidden">
      <div className="absolute inset-x-0 top-0 z-30 flex items-center justify-between gap-3 px-4 pt-3 pb-2 pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="w-9 h-9 rounded-2xl glass-strong flex items-center justify-center">
            <Clapperboard className="w-4.5 h-4.5 text-primary" />
          </div>
          <span className="hidden sm:inline text-base font-bold text-white">Reels</span>
        </div>

        <div className="flex-1 flex justify-center overflow-x-auto no-scrollbar pointer-events-auto px-2">
          <div className="flex items-center gap-1 glass-strong rounded-full p-1 backdrop-blur-md">
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                onClick={() => selectCategory(c.id)}
                className={`flex items-center gap-1.5 h-8 px-3 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                  category === c.id ? "bg-gradient-primary text-white shadow-lg shadow-primary/25" : "text-white/70 hover:text-white"
                }`}
                aria-pressed={category === c.id}
              >
                <c.icon className="w-3.5 h-3.5" />
                <span className="hidden md:inline">{c.label}</span>
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => setUploadOpen(true)}
          className="pointer-events-auto inline-flex items-center gap-1.5 h-9 px-4 rounded-full bg-gradient-primary text-white text-xs font-medium hover:shadow-lg hover:shadow-primary/40 transition-all"
        >
          <Upload className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Upload</span>
        </button>
      </div>

      {loading ? (
        <ReelSkeleton />
      ) : error ? (
        <div className="h-full flex items-center justify-center">
          <div className="glass-strong rounded-3xl p-8 text-center max-w-sm mx-4">
            <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-7 h-7 text-red-500" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">Reels unavailable</h2>
            <p className="text-sm text-muted-foreground mt-2">We could not load reels. Check your connection and try again.</p>
            <button
              onClick={reload}
              className="mt-5 inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-gradient-primary text-white text-sm font-medium hover:shadow-lg hover:shadow-primary/25 transition-all"
            >
              <RefreshCw className="w-4 h-4" /> Retry
            </button>
          </div>
        </div>
      ) : reels.length === 0 ? (
        <ReelEmpty onUpload={() => setUploadOpen(true)} />
      ) : (
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="h-full overflow-y-auto snap-y snap-mandatory no-scrollbar overscroll-contain"
          aria-label="Reels feed"
        >
          <div className="relative" style={{ height: `${reels.length * 100}%` }}>
            {windowIndices.map((i) => (
              <div key={reels[i].id} className="absolute inset-x-0 h-full snap-start" style={{ top: `${i * 100}%` }}>
                <ReelCard
                  reel={reels[i]}
                  active={i === activeIndex}
                  currentUserId={user?.id}
                  preload={i === activeIndex + 1 ? "auto" : "metadata"}
                  onLike={() => toggleLike(i)}
                  onBookmark={() => toggleBookmark(i)}
                  onCommented={() => bumpCommentCount(i)}
                  onShared={() => bumpShareCount(i)}
                  onDelete={() => handleDelete(i)}
                />
              </div>
            ))}
            {hasMore && <div ref={sentinelRef} className="absolute inset-x-0 h-24" style={{ top: `${reels.length * 100}%` }} />}
          </div>
          {loadingMore && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
            </div>
          )}
        </div>
      )}

      {uploadOpen && <UploadReel open={uploadOpen} onClose={() => setUploadOpen(false)} onUploaded={reload} />}
    </div>
  );
}
