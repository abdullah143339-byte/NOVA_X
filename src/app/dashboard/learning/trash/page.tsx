"use client";

import { useMemo, useState } from "react";
import { Trash2, FolderOpen, NotebookPen, Video, FilePlus2, ListTodo, RotateCcw, XCircle } from "lucide-react";
import Button from "@/components/ui/Button";
import { useLearning } from "@/components/learning/LearningProvider";
import { LearningNav, PageHeader, EmptyState } from "@/components/learning/LearningShared";
import { formatDate } from "@/components/learning/data";
import { cn } from "@/lib/utils";

type Filter = "all" | "subjects" | "notes" | "lectures" | "files" | "tasks";

export default function TrashPage() {
  const l = useLearning();
  const { state } = l;
  const [filter, setFilter] = useState<Filter>("all");

  const rows = useMemo(() => {
    const out: { key: string; icon: typeof Trash2; label: string; type: string; date: number; kind: Filter; restore: () => void; del: () => void }[] = [];
    const match = (f: Filter, k: Exclude<Filter, "all">) => f === "all" || f === k;

    if (match(filter, "subjects")) {
      for (const s of state.subjects.filter((x) => x.trashed)) {
        out.push({ key: s.id, icon: FolderOpen, label: s.name, type: "Subject", date: s.updatedAt, kind: "subjects", restore: () => l.restoreSubject(s.id), del: () => l.deleteSubjectForever(s.id) });
      }
    }
    if (match(filter, "notes")) {
      for (const n of state.notes.filter((x) => x.trashed)) {
        out.push({ key: n.id, icon: NotebookPen, label: n.title || "Untitled note", type: "Note", date: n.updatedAt, kind: "notes", restore: () => l.restoreNote(n.id), del: () => l.deleteNoteForever(n.id) });
      }
    }
    if (match(filter, "lectures")) {
      for (const v of state.lectures.filter((x) => x.trashed)) {
        out.push({ key: v.id, icon: Video, label: v.title, type: "Lecture", date: v.updatedAt, kind: "lectures", restore: () => l.restoreLecture(v.id), del: () => l.deleteLectureForever(v.id) });
      }
    }
    if (match(filter, "files")) {
      for (const f of state.files.filter((x) => x.trashed)) {
        out.push({ key: f.id, icon: FilePlus2, label: f.name, type: "File", date: f.createdAt, kind: "files", restore: () => l.restoreFile(f.id), del: () => l.deleteFileForever(f.id) });
      }
    }
    if (match(filter, "tasks")) {
      for (const t of state.tasks.filter((x) => x.trashed)) {
        out.push({ key: t.id, icon: ListTodo, label: t.title, type: "Task", date: t.createdAt, kind: "tasks", restore: () => l.restoreTask(t.id), del: () => l.deleteTaskForever(t.id) });
      }
    }
    return out.sort((a, b) => b.date - a.date);
  }, [state, filter, l]);

  const totalTrashed =
    state.subjects.filter((x) => x.trashed).length +
    state.notes.filter((x) => x.trashed).length +
    state.lectures.filter((x) => x.trashed).length +
    state.files.filter((x) => x.trashed).length +
    state.tasks.filter((x) => x.trashed).length;

  const filters: { key: Filter; label: string }[] = [
    { key: "all", label: `All (${totalTrashed})` },
    { key: "subjects", label: "Subjects" },
    { key: "notes", label: "Notes" },
    { key: "lectures", label: "Lectures" },
    { key: "files", label: "Files" },
    { key: "tasks", label: "Tasks" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Trash"
        subtitle="Restore deleted items or delete them forever."
        icon={Trash2}
        action={
          totalTrashed > 0 ? (
            <Button variant="danger" size="sm" onClick={l.resetAll}>
              <XCircle className="w-4 h-4" /> Reset workspace
            </Button>
          ) : undefined
        }
      />

      <LearningNav />

      <div className="flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none]">
        {filters.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={cn(
              "whitespace-nowrap px-3.5 py-2 rounded-xl text-sm font-medium transition-all",
              filter === f.key ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {rows.length === 0 ? (
        <EmptyState icon={Trash2} title="Trash is empty" desc="Deleted items land here so you can restore them if needed." />
      ) : (
        <div className="space-y-2">
          {rows.map((r) => {
            const Icon = r.icon;
            return (
              <div key={r.key} className="glass rounded-2xl px-4 py-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-muted border border-border flex items-center justify-center text-muted-foreground shrink-0">
                  <Icon className="w-4.5 h-4.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{r.label}</p>
                  <p className="text-xs text-muted-foreground">{r.type} · {formatDate(r.date)}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button variant="secondary" size="sm" onClick={r.restore}>
                    <RotateCcw className="w-3.5 h-3.5" /> Restore
                  </Button>
                  <Button variant="danger" size="sm" onClick={r.del}>
                    <Trash2 className="w-3.5 h-3.5" /> Delete forever
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
