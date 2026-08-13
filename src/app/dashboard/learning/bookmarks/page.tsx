"use client";

import { useMemo, useState } from "react";
import { Bookmark, NotebookPen, Video, FileText } from "lucide-react";
import { useLearning } from "@/components/learning/LearningProvider";
import { LearningNav, PageHeader, EmptyState } from "@/components/learning/LearningShared";
import { NoteCard, LectureCard, FileCard } from "@/components/learning/LearningCards";
import type { Note, Lecture, LearningFile } from "@/components/learning/types";
import { cn } from "@/lib/utils";

type Filter = "all" | "note" | "lecture" | "file";

type BookmarkItem =
  | { key: string; type: "note"; node: Note }
  | { key: string; type: "lecture"; node: Lecture }
  | { key: string; type: "file"; node: LearningFile };

export default function BookmarksPage() {
  const { state } = useLearning();
  const [filter, setFilter] = useState<Filter>("all");

  const bookmarks = useMemo(() => {
    const list = state.bookmarks.filter((b) => (filter === "all" ? true : b.refType === filter));
    return list
      .map((b): BookmarkItem | null => {
        if (b.refType === "note") {
          const ref = state.notes.find((n) => n.id === b.refId && !n.trashed);
          return ref ? { key: b.id, type: "note", node: ref } : null;
        }
        if (b.refType === "lecture") {
          const ref = state.lectures.find((l) => l.id === b.refId && !l.trashed);
          return ref ? { key: b.id, type: "lecture", node: ref } : null;
        }
        const ref = state.files.find((f) => f.id === b.refId && !f.trashed);
        return ref ? { key: b.id, type: "file", node: ref } : null;
      })
      .filter((x): x is BookmarkItem => x !== null);
  }, [state, filter]);

  const filters: { key: Filter; label: string; icon: typeof Bookmark }[] = [
    { key: "all", label: "All", icon: Bookmark },
    { key: "note", label: "Notes", icon: NotebookPen },
    { key: "lecture", label: "Lectures", icon: Video },
    { key: "file", label: "Files", icon: FileText },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Bookmarks" subtitle="Quick access to your saved learning materials." icon={Bookmark} />

      <LearningNav />

      <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
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

      {bookmarks.length === 0 ? (
        <EmptyState
          icon={Bookmark}
          title="No bookmarks yet"
          desc="Tap the bookmark icon on any note, lecture or file to save it here."
        />
      ) : (
        <div className={filter === "file" ? "grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" : "grid md:grid-cols-2 xl:grid-cols-3 gap-4"}>
          {bookmarks.map((b) =>
            b.type === "note" ? (
              <NoteCard key={b.key} note={b.node} />
            ) : b.type === "lecture" ? (
              <LectureCard key={b.key} lecture={b.node} />
            ) : (
              <FileCard key={b.key} file={b.node} />
            )
          )}
        </div>
      )}
    </div>
  );
}
