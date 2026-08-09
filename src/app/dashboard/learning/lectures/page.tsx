"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Video, Plus, Search, Star } from "lucide-react";
import Button from "@/components/ui/Button";
import { useLearning } from "@/components/learning/LearningProvider";
import { LearningNav, PageHeader, EmptyState } from "@/components/learning/LearningShared";
import { LectureCard } from "@/components/learning/LearningCards";
import { cn } from "@/lib/utils";

type Filter = "all" | "in-progress" | "completed" | "favorites";

export default function LecturesPage() {
  const router = useRouter();
  const { state } = useLearning();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const lectures = useMemo(() => {
    const q = query.trim().toLowerCase();
    return state.lectures
      .filter((l) => !l.trashed && !l.archived)
      .filter((l) => {
        if (filter === "in-progress" && l.completed) return false;
        if (filter === "completed" && !l.completed) return false;
        if (filter === "favorites" && !l.favorite) return false;
        if (q && !(l.title.toLowerCase().includes(q) || l.teacher.toLowerCase().includes(q) || l.tags.some((t) => t.toLowerCase().includes(q)))) return false;
        return true;
      })
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }, [state.lectures, query, filter]);

  const filters: { key: Filter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "in-progress", label: "In progress" },
    { key: "completed", label: "Completed" },
    { key: "favorites", label: "Favorites" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Lectures"
        subtitle="YouTube links or uploaded videos, with progress tracking."
        icon={Video}
        action={
          <Button onClick={() => router.push("/dashboard/learning/lectures/new")}>
            <Plus className="w-4 h-4" /> Add Lecture
          </Button>
        }
      />

      <LearningNav />

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search lectures…"
            aria-label="Search lectures"
            className="w-full h-12 rounded-2xl glass border border-border pl-11 pr-4 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
          />
        </div>
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none]">
        {filters.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={cn(
              "flex items-center gap-1.5 whitespace-nowrap px-3.5 py-2 rounded-xl text-sm font-medium transition-all",
              filter === f.key ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            {f.key === "favorites" && <Star className="w-4 h-4" />}
            {f.label}
          </button>
        ))}
      </div>

      {lectures.length === 0 ? (
        <EmptyState
          icon={Video}
          title={query || filter !== "all" ? "No lectures match" : "No lectures yet"}
          desc={query || filter !== "all" ? "Try a different filter or search." : "Save a YouTube video or upload your own lecture."}
          action={
            !query && filter === "all" && (
              <Button onClick={() => router.push("/dashboard/learning/lectures/new")}>
                <Plus className="w-4 h-4" /> Add a lecture
              </Button>
            )
          }
        />
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {lectures.map((l) => (
            <LectureCard key={l.id} lecture={l} />
          ))}
        </div>
      )}
    </div>
  );
}
