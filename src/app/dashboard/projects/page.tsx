"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, FolderOpen, Sparkles, Layers, Loader2, FolderGit2 } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import Button from "@/components/ui/Button";
import { useAuth } from "@/providers/AuthProvider";
import api from "@/lib/api";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { ProjectGridSkeleton } from "@/components/projects/ProjectCardSkeleton";
import { ProjectFilters, type SortKind } from "@/components/projects/ProjectFilters";
import { ProjectSectionRow } from "@/components/projects/ProjectSections";
import { ProjectAIAssistant } from "@/components/projects/ProjectAIAssistant";
import { ShareSheet } from "@/components/projects/ShareSheet";
import { useSocialMap } from "@/components/projects/ProjectShared";
import { seedShowcaseProjects, normalizePostToProject, sectionSort, extractPostList, parseTags, posMod } from "@/components/projects/data";
import type { ProjectRow, ProjectStatus, ProjectSection } from "@/components/projects/types";

function filterProjects(projects: ProjectRow[], search: string, category: string, status: ProjectStatus | "ALL"): ProjectRow[] {
  const q = search.trim().toLowerCase();
  return projects.filter((p) => {
    if (category !== "ALL" && String(p.category) !== category) return false;
    if (status !== "ALL" && p.status !== status) return false;
    if (!q) return true;
    const haystack = `${p.title} ${p.tagline} ${p.description} ${p.techStack.join(" ")} ${p.tags.join(" ")} ${String(p.category)} ${p.creator.name} ${p.creator.username}`.toLowerCase();
    return haystack.includes(q);
  });
}

export default function ProjectsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKind>("newest");
  const [category, setCategory] = useState("ALL");
  const [status, setStatus] = useState<ProjectStatus | "ALL">("ALL");
  const [visibleCount, setVisibleCount] = useState(9);
  const [shareTarget, setShareTarget] = useState<ProjectRow | null>(null);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiTarget, setAiTarget] = useState<ProjectRow | null>(null);
  const [origin, setOrigin] = useState("");
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const { map: social, merge, like, bookmark, follow } = useSocialMap([]);

  useEffect(() => {
    if (origin) return;
    const raf = requestAnimationFrame(() => {
      if (typeof window !== "undefined") setOrigin(window.location.origin);
    });
    return () => cancelAnimationFrame(raf);
  }, [origin]);

  useEffect(() => {
    let mounted = true;
    const raf = requestAnimationFrame(() => {
      const seed = seedShowcaseProjects(12);
      async function load() {
        let merged = seed;
        if (user) {
          try {
            const res = await api.getUserPosts(user.id);
            const items = extractPostList(res.data);
            const postProjects = items
              .filter((p) => parseTags(p.tags).includes("project"))
              .map((p) => normalizePostToProject(p));
            merged = [...seed, ...postProjects];
          } catch {
            merged = seed;
          }
        }
        if (!mounted) return;
        setProjects(merged);
        merge(merged);
        setLoading(false);
      }
      void load();
    });
    return () => {
      mounted = false;
      cancelAnimationFrame(raf);
    };
  }, [user, merge]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisibleCount((c) => c + 6);
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [projects.length]);

  const isFiltering = search.trim().length > 0 || category !== "ALL" || status !== "ALL";

  const filtered = useMemo(
    () => filterProjects(projects, search, category, status),
    [projects, search, category, status]
  );

  const sorted = useMemo(() => sectionSort(filtered, sort), [filtered, sort]);

  const sections = useMemo<ProjectSection[]>(() => {
    if (isFiltering || projects.length === 0) return [];
    const popular = sectionSort(projects, "popular");
    const trending = sectionSort(projects, "trending");
    const newest = sectionSort(projects, "newest");
    const ai = projects.filter((p) => p.isAI);
    const oss = projects.filter((p) => p.isOpenSource);
    const startup = projects.filter((p) => p.isStartup);
    const recommended = pickRecommended(projects);
    const list: ProjectSection[] = [];
    if (popular.length) list.push({ title: "Featured", subtitle: "Top projects the community loves", projects: popular });
    if (trending.length) list.push({ title: "Trending", subtitle: "Highest engagement this week", projects: trending });
    if (ai.length) list.push({ title: "AI Projects", subtitle: "Powered by machine learning", projects: ai });
    if (oss.length) list.push({ title: "Open Source", subtitle: "Free, transparent & community driven", projects: oss });
    if (startup.length) list.push({ title: "Startup", subtitle: "Early-stage products with big ambition", projects: startup });
    if (newest.length) list.push({ title: "New", subtitle: "Freshly published projects", projects: newest });
    if (recommended.length) list.push({ title: "Recommended for You", subtitle: "Picked based on your interests", projects: recommended });
    return list;
  }, [projects, isFiltering]);

  const handleOpen = useCallback((id: string) => {
    if (id) router.push(`/dashboard/projects/${id}`);
  }, [router]);

  const handleLike = useCallback((id: string, liked: boolean) => {
    like(id, liked);
    const p = projects.find((x) => x.id === id);
    if (p && p.source === "post" && p.postId) void api.reactToPost(p.postId, "LIKE").catch(() => {});
  }, [like, projects]);

  const handleBookmark = useCallback((id: string, bookmarked: boolean) => {
    bookmark(id, bookmarked);
    const p = projects.find((x) => x.id === id);
    if (p && p.source === "post" && p.postId) void api.toggleBookmark(p.postId).catch(() => {});
  }, [bookmark, projects]);

  const handleFollow = useCallback((id: string, followed: boolean) => {
    follow(id, followed);
  }, [follow]);

  const handleShare = useCallback((id: string) => {
    const p = projects.find((x) => x.id === id);
    if (p) setShareTarget(p);
    if (p && p.source === "post" && p.postId) void api.sharePost(p.postId).catch(() => {});
  }, [projects]);

  function changeSearch(v: string) {
    setSearch(v);
    setVisibleCount(9);
  }
  function changeSort(v: SortKind) {
    setSort(v);
    setVisibleCount(9);
  }
  function changeCategory(v: string) {
    setCategory(v);
    setVisibleCount(9);
  }
  function changeStatus(v: ProjectStatus | "ALL") {
    setStatus(v);
    setVisibleCount(9);
  }

  const heroStats = useMemo(
    () => [
      { label: "Projects", value: projects.length },
      { label: "AI Powered", value: projects.filter((p) => p.isAI).length },
      { label: "Open Source", value: projects.filter((p) => p.isOpenSource).length },
      { label: "Total Views", value: projects.reduce((sum, p) => sum + p.stats.views, 0) },
    ],
    [projects]
  );

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/20 via-muted/30 to-accent/20 p-6 md:p-8">
        <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_1px_1px,currentColor_1px,transparent_0)] [background-size:22px_22px] text-primary" />
        <div className="relative flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
              <FolderGit2 className="w-7 h-7 text-primary" /> Project Showcase
            </h1>
            <p className="text-sm text-muted-foreground mt-1.5 max-w-xl">
              Discover, follow and launch projects built by the community. From AI experiments to open-source libraries.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 max-w-lg">
              {heroStats.map((s) => (
                <div key={s.label} className="glass rounded-xl px-3 py-2">
                  <p className="text-lg font-bold text-foreground tabular-nums">{s.value}</p>
                  <p className="text-[11px] text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <Button variant="ghost" onClick={() => { setAiTarget(projects[0] || null); setAiOpen(true); }}>
              <Sparkles className="w-4 h-4 text-primary" /> AI Assistant
            </Button>
            <Button variant="secondary" onClick={() => router.push("/dashboard/projects/my")}>
              <FolderOpen className="w-4 h-4" /> My Projects
            </Button>
            <Button onClick={() => router.push("/dashboard/projects/create")}>
              <Plus className="w-4 h-4" /> Create Project
            </Button>
          </div>
        </div>
      </div>

      <ProjectFilters
        search={search}
        onSearch={changeSearch}
        sort={sort}
        onSort={changeSort}
        category={category}
        onCategory={changeCategory}
        status={status}
        onStatus={changeStatus}
      />

      {loading ? (
        <ProjectGridSkeleton count={6} />
      ) : (
        <>
          {sections.map((section) => (
            <ProjectSectionRow
              key={section.title}
              section={section}
              socialMap={social}
              onOpen={handleOpen}
              onLike={handleLike}
              onBookmark={handleBookmark}
              onShare={handleShare}
              onFollow={handleFollow}
            />
          ))}

          <section>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-foreground">{isFiltering ? "Search Results" : "Browse All Projects"}</h2>
                <p className="text-xs text-muted-foreground mt-0.5">{sorted.length} project{sorted.length === 1 ? "" : "s"}</p>
              </div>
              {!isFiltering && (
                <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Layers className="w-4 h-4" /> Infinite scroll enabled
                </span>
              )}
            </div>
            {sorted.length === 0 ? (
              <GlassCard className="p-12 text-center">
                <p className="text-sm text-muted-foreground">
                  No projects match your filters. Try a different search or <button type="button" onClick={() => { setSearch(""); setCategory("ALL"); setStatus("ALL"); }} className="text-primary hover:underline">clear filters</button>.
                </p>
              </GlassCard>
            ) : (
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {sorted.slice(0, visibleCount).map((p) => (
                  <ProjectCard
                    key={p.id}
                    project={p}
                    social={social[p.id]}
                    onOpen={handleOpen}
                    onLike={handleLike}
                    onBookmark={handleBookmark}
                    onShare={handleShare}
                    onFollow={handleFollow}
                  />
                ))}
              </div>
            )}
            {visibleCount < sorted.length && (
              <div className="flex items-center justify-center py-8 gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading more...
              </div>
            )}
            <div ref={sentinelRef} className="h-px" />
          </section>
        </>
      )}

      <ShareSheet
        open={Boolean(shareTarget)}
        onClose={() => setShareTarget(null)}
        title={shareTarget?.title || ""}
        url={shareTarget ? `${origin}/dashboard/projects/${shareTarget.id}` : ""}
      />
      {aiOpen && aiTarget && <ProjectAIAssistant project={aiTarget} open={aiOpen} onClose={() => setAiOpen(false)} />}
    </div>
  );
}

function pickRecommended(projects: ProjectRow[]): ProjectRow[] {
  if (projects.length === 0) return [];
  const seed = 42;
  const arr = projects.slice();
  const out: ProjectRow[] = [];
  let s = seed;
  while (out.length < Math.min(6, arr.length)) {
    s = Math.imul(s, 1103515245) + 12345;
    const idx = posMod(s, arr.length);
    out.push(arr[idx]);
    arr.splice(idx, 1);
  }
  return out;
}
