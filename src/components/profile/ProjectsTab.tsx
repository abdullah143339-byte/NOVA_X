"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { GitBranch, ExternalLink, Star, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProjectDef, PostData } from "./types";

interface ProjectsTabProps {
  projects: ProjectDef[];
  projectPosts: PostData[];
  loading: boolean;
}

const STATUS_COLORS: Record<string, string> = {
  Active: "bg-emerald-500/10 text-emerald-400",
  Completed: "bg-sky-500/10 text-sky-400",
  "In Progress": "bg-amber-500/10 text-amber-400",
};

export default function ProjectsTab({ projects, projectPosts, loading }: ProjectsTabProps) {
  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xs font-semibold text-foreground mb-3 uppercase tracking-wide">💼 Portfolio Projects</h3>
        {projects.length === 0 ? (
          <p className="text-xs text-muted-foreground py-4 text-center glass rounded-xl">No projects yet — tag a post with <span className="text-primary">#project</span> to add one.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {projects.map((project, i) => (
              <motion.div key={project.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass rounded-xl overflow-hidden hover-glow">
                <div className="h-28 bg-gradient-to-br from-primary/20 via-accent/10 to-primary/10 relative overflow-hidden">
                  {project.image ? (
                    <img src={project.image} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-3xl opacity-70">🚀</div>
                  )}
                  <span className={cn("absolute top-2 right-2 text-[9px] font-semibold px-2 py-0.5 rounded-full", STATUS_COLORS[project.status] || "bg-muted text-muted-foreground")}>
                    {project.status}
                  </span>
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-sm font-semibold text-foreground truncate">{project.title}</h4>
                    {project.stars !== undefined && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground shrink-0"><Star className="w-3 h-3 text-amber-400 fill-amber-400" /> {project.stars}</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{project.description}</p>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {project.tech.map((t) => (
                      <span key={t} className="px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[10px]">{t}</span>
                    ))}
                  </div>
                  <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border">
                    <span className="flex items-center gap-1 text-[11px] text-muted-foreground"><GitBranch className="w-3.5 h-3.5" /> Repository</span>
                    <span className="flex items-center gap-1 text-[11px] text-primary"><ExternalLink className="w-3.5 h-3.5" /> Live Demo</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {projectPosts.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-foreground mb-3 uppercase tracking-wide">📌 Tagged Project Posts</h3>
          <div className="space-y-2">
            {projectPosts.map((p) => (
              <div key={p.id} className="glass rounded-xl p-3 flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{p.content}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{p.likeCount ?? p.reactionsCount ?? 0} likes · {p.commentCount ?? p.commentsCount ?? 0} comments</p>
                </div>
                <Link href="/dashboard" className="ml-3 text-[11px] text-primary shrink-0">View</Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
