"use client";

import { ChevronRight } from "lucide-react";
import { ProjectCard } from "./ProjectCard";
import type { ProjectSection } from "./types";
import type { SocialMap } from "./ProjectShared";

export function ProjectSectionRow({
  section,
  socialMap,
  onOpen,
  onLike,
  onBookmark,
  onShare,
  onFollow,
}: {
  section: ProjectSection;
  socialMap: SocialMap;
  onOpen: (id: string) => void;
  onLike: (id: string, liked: boolean) => void;
  onBookmark: (id: string, bookmarked: boolean) => void;
  onShare: (id: string) => void;
  onFollow: (id: string, followed: boolean) => void;
}) {
  return (
    <section>
      <div className="flex items-end justify-between gap-3 mb-4">
        <div>
          <h2 className="text-lg font-bold text-foreground">{section.title}</h2>
          {section.subtitle && <p className="text-xs text-muted-foreground mt-0.5">{section.subtitle}</p>}
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
          onClick={() => onOpen(section.projects[0]?.id || "")}
        >
          View all <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 snap-x">
        {section.projects.slice(0, 6).map((p) => (
          <div key={p.id} className="w-[290px] shrink-0 snap-start">
            <ProjectCard
              project={p}
              social={socialMap[p.id]}
              onOpen={onOpen}
              onLike={onLike}
              onBookmark={onBookmark}
              onShare={onShare}
              onFollow={onFollow}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
