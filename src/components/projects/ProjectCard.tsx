"use client";

import { Bookmark, GitFork, Rocket, FolderGit2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProjectRow } from "./types";
import { StatusPill, VerifiedBadge, ProjectAvatar, TechChips, TagChips, StatsBar, type ProjectSocial } from "./ProjectShared";

export function ProjectCard({
  project,
  social,
  onOpen,
  onLike,
  onBookmark,
  onShare,
  onFollow,
}: {
  project: ProjectRow;
  social?: ProjectSocial;
  onOpen: (id: string) => void;
  onLike: (id: string, liked: boolean) => void;
  onBookmark: (id: string, bookmarked: boolean) => void;
  onShare: (id: string) => void;
  onFollow: (id: string, followed: boolean) => void;
}) {
  const s = social || { liked: false, bookmarked: false, followed: false };
  return (
    <article className="group relative flex flex-col rounded-2xl glass overflow-hidden hover-glow transition-all duration-300 cursor-pointer" onClick={() => onOpen(project.id)}>
      <div className={cn("relative h-36 overflow-hidden bg-gradient-to-br", project.cover)}>
        <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:16px_16px]" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        <div className="absolute top-3 left-3 flex items-center gap-2">
          <StatusPill status={project.status} className="glass" />
          {project.isOpenSource && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-black/40 text-white backdrop-blur">
              <GitFork className="w-3 h-3" /> OSS
            </span>
          )}
        </div>
        <span className="absolute top-3 right-3 px-2 py-0.5 rounded-md bg-black/40 text-white text-[11px] font-medium backdrop-blur">
          {project.category}
        </span>
        <button
          type="button"
          aria-label={s.bookmarked ? "Remove bookmark" : "Bookmark project"}
          title="Bookmark"
          onClick={(e) => {
            e.stopPropagation();
            onBookmark(project.id, !s.bookmarked);
          }}
          className={cn(
            "absolute bottom-3 right-3 w-9 h-9 rounded-xl glass flex items-center justify-center transition-all hover:scale-105",
            s.bookmarked && "text-sky-400"
          )}
        >
          <Bookmark className={cn("w-[18px] h-[18px]", s.bookmarked && "fill-sky-400")} />
        </button>
        <span className="absolute -bottom-5 left-4 w-12 h-12 rounded-2xl bg-gradient-to-br from-muted to-muted/40 border border-border shadow-lg flex items-center justify-center text-2xl select-none">
          {project.logo}
        </span>
      </div>

      <div className="flex-1 p-4 pt-7 flex flex-col gap-3">
        <div>
          <h3 className="font-bold text-foreground leading-snug group-hover:text-primary transition-colors">
            {project.title}
          </h3>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{project.tagline || project.description}</p>
        </div>

        <div className="flex items-center gap-2">
          <ProjectAvatar avatar={project.creator.avatar} name={project.creator.name} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1">
              <span className="text-xs font-semibold text-foreground truncate">{project.creator.name}</span>
              {project.creator.verified && <VerifiedBadge />}
            </div>
            <p className="text-[11px] text-muted-foreground truncate">@{project.creator.username}</p>
          </div>
          <button
            type="button"
            aria-label={s.followed ? "Unfollow" : "Follow"}
            onClick={(e) => {
              e.stopPropagation();
              onFollow(project.id, !s.followed);
            }}
            className={cn(
              "px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all",
              s.followed ? "glass text-muted-foreground" : "bg-gradient-primary text-white"
            )}
          >
            {s.followed ? "Following" : "Follow"}
          </button>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {project.isStartup && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-pink-500/10 text-pink-500 text-[11px] font-semibold">
              <Rocket className="w-3 h-3" /> Startup
            </span>
          )}
          {project.isAI && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-fuchsia-500/10 text-fuchsia-500 text-[11px] font-semibold">
              ✨ AI Powered
            </span>
          )}
        </div>

        <TechChips stack={project.techStack} />
        <TagChips tags={project.tags} />

        <div className="mt-auto pt-2 border-t border-border/60 flex items-center justify-between">
          <StatsBar
            project={project}
            social={s}
            showViews
            onLike={() => onLike(project.id, !s.liked)}
            onBookmark={() => onBookmark(project.id, !s.bookmarked)}
            onShare={() => onShare(project.id)}
            onComment={() => onOpen(project.id)}
          />
          <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
            <FolderGit2 className="w-3.5 h-3.5" />
            {new Date(project.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>
    </article>
  );
}
