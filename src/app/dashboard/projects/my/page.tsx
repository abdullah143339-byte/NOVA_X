"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, Edit3, Trash2, FileText, FolderGit2 } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import Button from "@/components/ui/Button";
import { useAuth } from "@/providers/AuthProvider";
import api from "@/lib/api";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { ProjectGridSkeleton } from "@/components/projects/ProjectCardSkeleton";
import { useSocialMap } from "@/components/projects/ProjectShared";
import { normalizePostToProject, extractPostList, parseTags } from "@/components/projects/data";
import type { ProjectRow } from "@/components/projects/types";

const DRAFT_KEY = "nova_project_drafts";

interface DraftRecord {
  savedAt: string;
  editId?: string;
  form: {
    logo?: string;
    title: string;
    tagline: string;
    description: string;
    category: string;
    status: string;
    techStack: string[];
    tags: string[];
  };
}

export default function MyProjectsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [drafts, setDrafts] = useState<{ id: string; record: DraftRecord }[]>([]);
  const [loading, setLoading] = useState(true);
  const { map: social, merge, like, bookmark, follow } = useSocialMap([]);

  useEffect(() => {
    let mounted = true;
    const raf = requestAnimationFrame(() => {
      async function load() {
        if (!user) {
          if (mounted) setLoading(false);
          return;
        }
        try {
          const res = await api.getUserPosts(user.id);
          const items = extractPostList(res.data);
          const mine = items.filter((p) => parseTags(p.tags).includes("project")).map((p) => normalizePostToProject(p));
          if (mounted) {
            setProjects(mine);
            merge(mine);
          }
        } catch {
          if (mounted) setProjects([]);
        } finally {
          if (mounted) setLoading(false);
        }
      }
      void load();
    });
    return () => {
      mounted = false;
      cancelAnimationFrame(raf);
    };
  }, [user, merge]);

  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      try {
        const raw = localStorage.getItem(DRAFT_KEY);
        const parsed = raw ? (JSON.parse(raw) as Record<string, DraftRecord>) : {};
        const list = Object.keys(parsed).map((id) => ({ id, record: parsed[id] }));
        list.sort((a, b) => new Date(b.record.savedAt).getTime() - new Date(a.record.savedAt).getTime());
        setDrafts(list);
      } catch {
        setDrafts([]);
      }
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  const handleOpen = useCallback((id: string) => {
    router.push(`/dashboard/projects/${id}`);
  }, [router]);

  const handleLike = useCallback((id: string, liked: boolean) => {
    like(id, liked);
    const p = projects.find((x) => x.id === id);
    if (p && p.postId) void api.reactToPost(p.postId, "LIKE").catch(() => {});
  }, [like, projects]);

  const handleBookmark = useCallback((id: string, bookmarked: boolean) => {
    bookmark(id, bookmarked);
    const p = projects.find((x) => x.id === id);
    if (p && p.postId) void api.toggleBookmark(p.postId).catch(() => {});
  }, [bookmark, projects]);

  const handleFollow = useCallback((id: string, followed: boolean) => {
    follow(id, followed);
  }, [follow]);

  const handleShare = useCallback((id: string) => {
    void id;
  }, []);

  async function handleDelete(id: string, postId?: string) {
    if (!postId) return;
    if (!confirm("Delete this project permanently?")) return;
    try {
      await api.deletePost(postId);
      setProjects((prev) => prev.filter((p) => p.id !== id));
    } catch {
      alert("Failed to delete project");
    }
  }

  function deleteDraft(id: string) {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      const parsed = raw ? (JSON.parse(raw) as Record<string, DraftRecord>) : {};
      delete parsed[id];
      localStorage.setItem(DRAFT_KEY, JSON.stringify(parsed));
      setDrafts((prev) => prev.filter((d) => d.id !== id));
    } catch {
      alert("Failed to delete draft");
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-2">
            <FolderGit2 className="w-6 h-6 text-primary" /> My Projects
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            {projects.length} published · {drafts.length} draft{drafts.length === 1 ? "" : "s"}
          </p>
        </div>
        <Button onClick={() => router.push("/dashboard/projects/create")}>
          <Plus className="w-4 h-4" /> New Project
        </Button>
      </div>

      {loading ? (
        <ProjectGridSkeleton count={3} />
      ) : projects.length > 0 ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((p) => (
            <div key={p.id} className="relative">
              <ProjectCard
                project={p}
                social={social[p.id]}
                onOpen={handleOpen}
                onLike={handleLike}
                onBookmark={handleBookmark}
                onShare={handleShare}
                onFollow={handleFollow}
              />
              <div className="absolute top-3 right-14 flex gap-1.5">
                <button
                  type="button"
                  aria-label="Edit project"
                  title="Edit"
                  onClick={() => router.push(`/dashboard/projects/edit/${p.id}`)}
                  className="w-9 h-9 rounded-xl glass flex items-center justify-center text-white hover:scale-105 transition-transform"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  aria-label="Delete project"
                  title="Delete"
                  onClick={() => void handleDelete(p.id, p.postId)}
                  className="w-9 h-9 rounded-xl glass flex items-center justify-center text-white hover:scale-105 transition-transform"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <GlassCard className="p-12 text-center">
          <FileText className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground">You haven&apos;t published any projects yet.</p>
          <Button className="mt-4" onClick={() => router.push("/dashboard/projects/create")}>
            <Plus className="w-4 h-4" /> Create your first project
          </Button>
        </GlassCard>
      )}

      {drafts.length > 0 && (
        <section>
          <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-muted-foreground" /> Drafts
            <span className="text-[11px] font-medium text-muted-foreground">(saved in this browser)</span>
          </h2>
          <div className="space-y-2">
            {drafts.map((d) => (
              <GlassCard key={d.id} className="flex flex-wrap items-center gap-3">
                <span className="text-2xl">{d.record.form.logo || "🗂️"}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground truncate">{d.record.form.title || "Untitled draft"}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {d.record.form.category || "Uncategorized"} · {d.record.form.status?.replace("_", " ")} · saved {new Date(d.record.savedAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" onClick={() => router.push(`/dashboard/projects/edit/${d.id}`)}>
                    <Edit3 className="w-3.5 h-3.5" /> Continue
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => deleteDraft(d.id)}>
                    <Trash2 className="w-3.5 h-3.5 text-red-500" />
                  </Button>
                </div>
              </GlassCard>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
