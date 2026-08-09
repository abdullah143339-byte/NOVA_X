"use client";

import { useMemo, useState } from "react";
import { ListTodo, Plus, Calendar, CheckCircle2 } from "lucide-react";
import Button from "@/components/ui/Button";
import { useLearning } from "@/components/learning/LearningProvider";
import { LearningNav, PageHeader, EmptyState, SubjectSelect } from "@/components/learning/LearningShared";
import { TaskCard } from "@/components/learning/LearningCards";
import type { TaskPriority } from "@/components/learning/types";
import { cn } from "@/lib/utils";

type Filter = "all" | "active" | "done" | "high";

const PRIORITIES: { key: TaskPriority; label: string }[] = [
  { key: "low", label: "Low" },
  { key: "medium", label: "Medium" },
  { key: "high", label: "High" },
];

export default function TasksPage() {
  const { state, addTask } = useLearning();
  const [filter, setFilter] = useState<Filter>("all");
  const [open, setOpen] = useState(false);

  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [subjectId, setSubjectId] = useState<string | null>(null);
  const [deadline, setDeadline] = useState("");
  const [reminder, setReminder] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");

  const tasks = useMemo(() => {
    return state.tasks
      .filter((t) => !t.trashed && !t.archived)
      .filter((t) => {
        if (filter === "active") return !t.completed;
        if (filter === "done") return t.completed;
        if (filter === "high") return !t.completed && t.priority === "high";
        return true;
      })
      .sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        return (a.deadline ?? Infinity) - (b.deadline ?? Infinity);
      });
  }, [state.tasks, filter]);

  const save = () => {
    if (!title.trim()) return;
    addTask({
      subjectId,
      title: title.trim(),
      notes: notes.trim(),
      deadline: deadline ? new Date(deadline + "T00:00:00").getTime() : null,
      reminderAt: reminder ? new Date(reminder + "T00:00:00").getTime() : null,
      priority,
      completed: false,
    });
    setTitle("");
    setNotes("");
    setSubjectId(null);
    setDeadline("");
    setReminder("");
    setPriority("medium");
    setOpen(false);
  };

  const filters: { key: Filter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "active", label: "Active" },
    { key: "done", label: "Done" },
    { key: "high", label: "High priority" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tasks"
        subtitle="Deadlines, reminders and study to-dos."
        icon={ListTodo}
        action={
          <Button onClick={() => setOpen(true)}>
            <Plus className="w-4 h-4" /> New Task
          </Button>
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

      {open && (
        <div className="glass rounded-3xl p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">Task *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Finish LoRA fine-tuning lecture"
              autoFocus
              className="w-full h-11 rounded-xl bg-muted border border-border px-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">Notes</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional details…"
              className="w-full h-11 rounded-xl bg-muted border border-border px-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <SubjectSelect subjects={state.subjects} value={subjectId} onChange={setSubjectId} placeholder="No subject" />
            <div className="flex gap-2">
              {PRIORITIES.map((p) => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => setPriority(p.key)}
                  className={cn(
                    "flex-1 h-11 rounded-xl border text-sm font-semibold transition-all",
                    priority === p.key
                      ? p.key === "high" ? "bg-rose-500/15 text-rose-400 border-rose-500/40"
                      : p.key === "medium" ? "bg-amber-500/15 text-amber-400 border-amber-500/40"
                      : "bg-emerald-500/15 text-emerald-400 border-emerald-500/40"
                      : "border-border text-muted-foreground hover:text-foreground"
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> Deadline
              </label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full h-11 rounded-xl bg-muted border border-border px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> Reminder
              </label>
              <input
                type="date"
                value={reminder}
                onChange={(e) => setReminder(e.target.value)}
                className="w-full h-11 rounded-xl bg-muted border border-border px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={!title.trim()}>Add Task</Button>
          </div>
        </div>
      )}

      {tasks.length === 0 ? (
        <EmptyState
          icon={ListTodo}
          title={filter === "all" ? "No tasks yet" : "No tasks match"}
          desc={filter === "all" ? "Plan your study sessions with deadlines and priorities." : "Try a different filter."}
          action={
            filter === "all" && (
              <Button onClick={() => setOpen(true)}>
                <Plus className="w-4 h-4" /> Add a task
              </Button>
            )
          }
        />
      ) : (
        <div className="space-y-2.5">
          {tasks.map((t) => (
            <TaskCard key={t.id} task={t} />
          ))}
        </div>
      )}
    </div>
  );
}
