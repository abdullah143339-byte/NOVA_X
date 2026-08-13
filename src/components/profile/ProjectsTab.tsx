"use client";

import Link from "next/link";
import { Loader2 } from "lucide-react";
import type { PostData } from "./types";

interface ProjectsTabProps {
  projectPosts: PostData[];
  loading: boolean;
}

export default function ProjectsTab({ projectPosts, loading }: ProjectsTabProps) {
  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      {projectPosts.length > 0 ? (
        <div>
          <h3 className="text-xs font-semibold text-foreground mb-3 uppercase tracking-wide">📌 Project Posts</h3>
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
      ) : (
        <div className="text-center py-12 glass rounded-2xl">
          <div className="w-14 h-14 rounded-2xl bg-gradient-primary/10 flex items-center justify-center mx-auto mb-3 text-2xl">🚀</div>
          <p className="text-sm font-semibold text-foreground">No projects yet</p>
          <p className="text-xs text-muted-foreground mt-1">Tag a post with <span className="text-primary">#project</span> to showcase it here.</p>
        </div>
      )}
    </div>
  );
}
