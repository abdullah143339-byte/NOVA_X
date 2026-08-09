"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, FolderOpen, NotebookPen, Video, FilePlus2, ListTodo, Plus } from "lucide-react";
import Button from "@/components/ui/Button";
import { useLearning } from "@/components/learning/LearningProvider";
import { LearningNav, EmptyState } from "@/components/learning/LearningShared";
import { NoteCard, LectureCard, FileCard, TaskCard } from "@/components/learning/LearningCards";
import { colorClass } from "@/components/learning/data";
import { cn } from "@/lib/utils";

type Tab = "notes" | "lectures" | "files" | "tasks";

export default function SubjectDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { state, restoreSubject } = useLearning();
  const [tab, setTab] = useState<Tab>("notes");

  const subject = state.subjects.find((s) => s.id === params.id);

  const counts = useMemo(() => {
    const base = { id: params.id };
    return {
      notes: state.notes.filter((n) => n.subjectId === base.id && !n.trashed).length,
      lectures: state.lectures.filter((l) => l.subjectId === base.id && !l.trashed).length,
      files: state.files.filter((f) => f.subjectId === base.id && !f.trashed).length,
      tasks: state.tasks.filter((t) => t.subjectId === base.id && !t.trashed).length,
    };
  }, [state, params.id]);

  const items = useMemo(() => {
    const id = params.id;
    return {
      notes: state.notes.filter((n) => n.subjectId === id && !n.trashed).sort((a, b) => b.updatedAt - a.updatedAt),
      lectures: state.lectures.filter((l) => l.subjectId === id && !l.trashed).sort((a, b) => b.updatedAt - a.updatedAt),
      files: state.files.filter((f) => f.subjectId === id && !f.trashed).sort((a, b) => b.createdAt - a.createdAt),
      tasks: state.tasks.filter((t) => t.subjectId === id && !t.trashed).sort((a, b) => b.createdAt - a.createdAt),
    };
  }, [state, params.id]);

  if (!subject || subject.trashed) {
    return (
      <div className="space-y-6">
        <LearningNav />
        <EmptyState
          icon={FolderOpen}
          title="Subject not found"
          desc="This subject may have been moved to trash or deleted."
          action={<Button variant="secondary" onClick={() => router.push("/dashboard/learning/subjects")}><ArrowLeft className="w-4 h-4" /> Back to subjects</Button>}
        />
      </div>
    );
  }

  const tabs: { key: Tab; label: string; count: number; icon: typeof NotebookPen }[] = [
    { key: "notes", label: "Notes", count: counts.notes, icon: NotebookPen },
    { key: "lectures", label: "Lectures", count: counts.lectures, icon: Video },
    { key: "files", label: "Files", count: counts.files, icon: FilePlus2 },
    { key: "tasks", label: "Tasks", count: counts.tasks, icon: ListTodo },
  ];

  const emptyStates: Record<Tab, { icon: typeof NotebookPen; title: string; desc: string; cta: { label: string; href: string } }> = {
    notes: { icon: NotebookPen, title: "No notes", desc: "Take your first note for this subject.", cta: { label: "Write a note", href: "/dashboard/learning/notes/new" } },
    lectures: { icon: Video, title: "No lectures", desc: "Add a lecture or YouTube video to this subject.", cta: { label: "Add lecture", href: "/dashboard/learning/lectures/new" } },
    files: { icon: FilePlus2, title: "No files", desc: "Upload PDFs, docs and more to this subject.", cta: { label: "Upload file", href: "/dashboard/learning/files" } },
    tasks: { icon: ListTodo, title: "No tasks", desc: "Create a study task for this subject.", cta: { label: "Add task", href: "/dashboard/learning/tasks" } },
  };

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={() => router.push("/dashboard/learning/subjects")}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Subjects
      </button>

      <div className={cn("glass rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center gap-5 border", colorClass(subject.color))}>
        <div className="w-16 h-16 rounded-2xl border bg-background/40 flex items-center justify-center text-4xl shrink-0">
          {subject.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-foreground">{subject.name}</h1>
          {subject.description && <p className="mt-1 text-sm text-muted-foreground">{subject.description}</p>}
          <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><NotebookPen className="w-3.5 h-3.5" /> {counts.notes} notes</span>
            <span className="flex items-center gap-1"><Video className="w-3.5 h-3.5" /> {counts.lectures} lectures</span>
            <span className="flex items-center gap-1"><FilePlus2 className="w-3.5 h-3.5" /> {counts.files} files</span>
            <span className="flex items-center gap-1"><ListTodo className="w-3.5 h-3.5" /> {counts.tasks} tasks</span>
          </div>
        </div>
        {subject.archived && (
          <Button variant="secondary" size="sm" onClick={() => restoreSubject(subject.id)}>Unarchive</Button>
        )}
      </div>

      <LearningNav />

      <div className="flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none]">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={cn(
                "flex items-center gap-1.5 whitespace-nowrap px-3.5 py-2 rounded-xl text-sm font-medium transition-all",
                active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <Icon className="w-4 h-4" /> {t.label}
              <span className={cn("text-[11px] px-1.5 py-0.5 rounded-md", active ? "bg-primary/15" : "bg-muted text-muted-foreground")}>
                {t.count}
              </span>
            </button>
          );
        })}
      </div>

      {items[tab].length === 0 ? (
        <EmptyState
          icon={emptyStates[tab].icon}
          title={emptyStates[tab].title}
          desc={emptyStates[tab].desc}
          action={
            <Button onClick={() => router.push(emptyStates[tab].cta.href)}>
              <Plus className="w-4 h-4" /> {emptyStates[tab].cta.label}
            </Button>
          }
        />
      ) : (
        <div className={tab === "tasks" ? "space-y-2.5" : "grid md:grid-cols-2 xl:grid-cols-3 gap-4"}>
          {tab === "notes" && items.notes.map((n) => <NoteCard key={n.id} note={n} />)}
          {tab === "lectures" && items.lectures.map((l) => <LectureCard key={l.id} lecture={l} />)}
          {tab === "files" && items.files.map((f) => <FileCard key={f.id} file={f} />)}
          {tab === "tasks" && items.tasks.map((t) => <TaskCard key={t.id} task={t} />)}
        </div>
      )}
    </div>
  );
}
