"use client";

import { useState, useCallback } from "react";
import { BadgeCheck, Eye, Heart, MessageSquare, Share2, Bookmark, GitFork } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProjectRow, ProjectStatus } from "./types";
import { formatCount } from "./data";

export const STATUS_STYLE: Record<ProjectStatus, string> = {
  IDEA: "bg-violet-500/15 text-violet-500 border border-violet-500/30",
  IN_PROGRESS: "bg-amber-500/15 text-amber-500 border border-amber-500/30",
  COMPLETED: "bg-green-500/15 text-green-500 border border-green-500/30",
};

export function StatusPill({ status, className }: { status: ProjectStatus; className?: string }) {
  const label = status === "IN_PROGRESS" ? "In Progress" : status.charAt(0) + status.slice(1).toLowerCase();
  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold", STATUS_STYLE[status], className)}>
      <span className={cn("w-1.5 h-1.5 rounded-full", status === "COMPLETED" ? "bg-green-500" : status === "IN_PROGRESS" ? "bg-amber-500" : "bg-violet-500")} />
      {label}
    </span>
  );
}

export function VerifiedBadge({ className }: { className?: string }) {
  return <BadgeCheck className={cn("w-4 h-4 text-sky-500 fill-sky-500/20 shrink-0", className)} />;
}

const AVATAR_SIZES: Record<number, string> = {
  8: "w-8 h-8",
  9: "w-9 h-9",
  10: "w-10 h-10",
  11: "w-11 h-11",
  12: "w-12 h-12",
};

export function ProjectAvatar({ avatar, name, size = 9 }: { avatar: string; name: string; size?: number }) {
  return (
    <span
      className={cn("rounded-full bg-gradient-to-br from-muted to-muted/60 flex items-center justify-center text-sm shrink-0 select-none", AVATAR_SIZES[size] || AVATAR_SIZES[9])}
      title={name}
    >
      {avatar}
    </span>
  );
}

export function TechChips({ stack, max = 4 }: { stack: string[]; max?: number }) {
  const shown = stack.slice(0, max);
  const extra = stack.length - shown.length;
  return (
    <div className="flex flex-wrap gap-1.5">
      {shown.map((t) => (
        <span key={t} className="px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[11px] font-medium">
          {t}
        </span>
      ))}
      {extra > 0 && <span className="px-2 py-0.5 rounded-md bg-muted text-muted-foreground text-[11px] font-medium">+{extra}</span>}
    </div>
  );
}

export function TagChips({ tags, max = 3 }: { tags: string[]; max?: number }) {
  const shown = tags.slice(0, max);
  const extra = tags.length - shown.length;
  return (
    <div className="flex flex-wrap gap-1.5">
      {shown.map((t) => (
        <span key={t} className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-[10px] font-medium">
          #{t}
        </span>
      ))}
      {extra > 0 && <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-[10px] font-medium">+{extra}</span>}
    </div>
  );
}

export function StatPill({
  icon,
  count,
  active,
  activeClass,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  count: number;
  active?: boolean;
  activeClass?: string;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors rounded-lg px-1.5 py-1",
        onClick && "hover:bg-muted/60",
        active && (activeClass || "text-primary")
      )}
    >
      {icon}
      <span className="tabular-nums">{formatCount(count)}</span>
    </button>
  );
}

export interface ProjectSocial {
  liked: boolean;
  bookmarked: boolean;
  followed: boolean;
}

export type SocialMap = Record<string, ProjectSocial>;

export function emptySocial(isFollowed?: boolean): ProjectSocial {
  return { liked: false, bookmarked: false, followed: Boolean(isFollowed) };
}

export function buildSocialMap(projects: ProjectRow[]): SocialMap {
  const map: SocialMap = {};
  for (const p of projects) map[p.id] = emptySocial(p.creator.isFollowed);
  return map;
}

export function StatsBar({
  project,
  social,
  onLike,
  onBookmark,
  onShare,
  showViews = true,
  onComment,
}: {
  project: ProjectRow;
  social?: ProjectSocial;
  onLike?: () => void;
  onBookmark?: () => void;
  onShare?: () => void;
  showViews?: boolean;
  onComment?: () => void;
}) {
  const s = social || emptySocial(false);
  const likeCount = project.stats.likes + (s.liked ? 1 : 0);
  const bookmarkCount = project.stats.bookmarks + (s.bookmarked ? 1 : 0);
  return (
    <div className="flex items-center gap-1">
      <StatPill icon={<Heart className="w-4 h-4" />} count={likeCount} label="Likes" active={s.liked} activeClass="text-red-500 fill-red-500" onClick={onLike} />
      {showViews && <StatPill icon={<Eye className="w-4 h-4" />} count={project.stats.views} label="Views" />}
      <StatPill icon={<MessageSquare className="w-4 h-4" />} count={project.stats.comments} label="Comments" onClick={onComment} />
      <StatPill icon={<Bookmark className="w-4 h-4" />} count={bookmarkCount} label="Bookmarks" active={s.bookmarked} activeClass="text-sky-500 fill-sky-500" onClick={onBookmark} />
      <StatPill icon={<Share2 className="w-4 h-4" />} count={project.stats.shares} label="Shares" onClick={onShare} />
      {typeof project.stats.stars === "number" && (
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground px-1.5 py-1" title="GitHub stars">
          <GitFork className="w-4 h-4" />
          <span className="tabular-nums">{formatCount(project.stats.stars)}</span>
        </span>
      )}
    </div>
  );
}

export function useSocialMap(initial: ProjectRow[]) {
  const [map, setMap] = useState<SocialMap>(() => buildSocialMap(initial));
  const merge = useCallback((projects: ProjectRow[]) => {
    setMap((prev) => ({ ...buildSocialMap(projects), ...prev }));
  }, []);
  const patch = useCallback((id: string, partial: Partial<ProjectSocial>) => {
    setMap((prev) => {
      const base = prev[id] || emptySocial(false);
      return { ...prev, [id]: { ...base, ...partial } };
    });
  }, []);
  const like = useCallback((id: string, liked: boolean) => patch(id, { liked }), [patch]);
  const bookmark = useCallback((id: string, bookmarked: boolean) => patch(id, { bookmarked }), [patch]);
  const follow = useCallback((id: string, followed: boolean) => patch(id, { followed }), [patch]);
  return { map, merge, like, bookmark, follow };
}
