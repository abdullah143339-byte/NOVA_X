"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { NotebookPen, Plus, Search, Pin, Star } from "lucide-react";
import Button from "@/components/ui/Button";
import { useLearning } from "@/components/learning/LearningProvider";
import { LearningNav, PageHeader, EmptyState } from "@/components/learning/LearningShared";
import { NoteCard } from "@/components/learning/LearningCards";
import { cn } from "@/lib/utils";

type Filter = "all" | "pinned" | "favorites";
type Sort = "recent" | "oldest" | "alpha";

export default function NotesPage() {
  const router = useRouter();
  const { state } = useLearning();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<Sort>("recent");

  const notes = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = state.notes.filter((n) => !n.trashed && !n.archived);
    const filtered = list.filter((n) => {
      if (filter === "pinned" && !n.pinned) return false;
      if (filter === "favorites" && !n.favorite) return false;
      if (q && !(n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q) || n.tags.some((t) => t.toLowerCase().includes(q)))) return false;
      return true;
    });
    return [...filtered].sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      if (sort === "recent") return b.updatedAt - a.updatedAt;
      if (sort === "oldest") return a.updatedAt - b.updatedAt;
      return a.title.localeCompare(b.title);
    });
  }, [state.notes, query, filter, sort]);

  const filters: { key: Filter; label: string; icon: typeof Pin }[] = [
    { key: "all", label: "All", icon: NotebookPen },
    { key: "pinned", label: "Pinned", icon: Pin },
    { key: "favorites", label: "Favorites", icon: Star },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notes"
        subtitle="Write, pin and favourite your study notes."
        icon={NotebookPen}
        action={
          <Button onClick={() => router.push("/dashboard/learning/notes/new")}>
            <Plus className="w-4 h-4" /> New Note
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
            placeholder="Search notes…"
            aria-label="Search notes"
            className="w-full h-12 rounded-2xl glass border border-border pl-11 pr-4 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
          />
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as Sort)}
          aria-label="Sort notes"
          className="h-12 rounded-2xl bg-muted border border-border px-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
        >
          <option value="recent">Recently updated</option>
          <option value="oldest">Oldest first</option>
          <option value="alpha">A → Z</option>
        </select>
      </div>

      <div className="flex gap-1.5">
        {filters.map((f) => {
          const Icon = f.icon;
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={cn(
                "flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-all",
                filter === f.key ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <Icon className="w-4 h-4" /> {f.label}
            </button>
          );
        })}
      </div>

      {notes.length === 0 ? (
        <EmptyState
          icon={NotebookPen}
          title={query || filter !== "all" ? "No notes match" : "No notes yet"}
          desc={query || filter !== "all" ? "Try a different filter or search." : "Capture your first idea, formula or summary."}
          action={
            !query && filter === "all" && (
              <Button onClick={() => router.push("/dashboard/learning/notes/new")}>
                <Plus className="w-4 h-4" /> Write a note
              </Button>
            )
          }
        />
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {notes.map((n) => (
            <NoteCard key={n.id} note={n} />
          ))}
        </div>
      )}
    </div>
  );
}
