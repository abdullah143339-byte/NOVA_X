"use client";

import { useMemo, useState } from "react";
import { FolderOpen, Plus, Search } from "lucide-react";
import Button from "@/components/ui/Button";
import { useLearning } from "@/components/learning/LearningProvider";
import { LearningNav, PageHeader, EmptyState } from "@/components/learning/LearningShared";
import { SubjectCard } from "@/components/learning/LearningCards";
import { Modal } from "@/components/learning/Modal";
import { SUBJECT_COLORS } from "@/components/learning/data";
import type { SubjectColor } from "@/components/learning/types";
import { cn } from "@/lib/utils";

const EMOJIS = ["📚", "🤖", "💻", "📐", "🛡️", "🧪", "🎨", "🌐", "🎵", "🧠", "🔬", "📊"];

export default function SubjectsPage() {
  const { state, addSubject } = useLearning();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("📚");
  const [color, setColor] = useState<SubjectColor>("violet");
  const [description, setDescription] = useState("");
  const [query, setQuery] = useState("");

  const subjects = useMemo(
    () =>
      state.subjects
        .filter((s) => !s.trashed)
        .filter((s) => (query ? s.name.toLowerCase().includes(query.toLowerCase()) : true))
        .sort((a, b) => (a.archived === b.archived ? 0 : a.archived ? 1 : -1)),
    [state.subjects, query]
  );

  const create = () => {
    if (!name.trim()) return;
    addSubject({ name: name.trim(), emoji, color, description: description.trim() });
    setName("");
    setEmoji("📚");
    setColor("violet");
    setDescription("");
    setOpen(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Subjects"
        subtitle="Your personal folders for every subject you're learning."
        icon={FolderOpen}
        action={
          <Button onClick={() => setOpen(true)}>
            <Plus className="w-4 h-4" /> New Subject
          </Button>
        }
      />

      <LearningNav />

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search subjects…"
          aria-label="Search subjects"
          className="w-full h-12 rounded-2xl glass border border-border pl-11 pr-4 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
        />
      </div>

      {subjects.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title={query ? "No subjects found" : "No subjects yet"}
          desc={query ? "Try a different keyword." : "Create your first subject to start organising your learning materials."}
          action={
            !query && (
              <Button onClick={() => setOpen(true)}>
                <Plus className="w-4 h-4" /> Create a subject
              </Button>
            )
          }
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {subjects.map((s) => (
            <SubjectCard key={s.id} subject={s} />
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Create a subject">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Artificial Intelligence"
              autoFocus
              className="w-full h-11 rounded-xl bg-muted border border-border px-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">Icon</label>
            <div className="flex flex-wrap gap-1.5">
              {EMOJIS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setEmoji(e)}
                  className={cn(
                    "w-10 h-10 rounded-xl border text-xl flex items-center justify-center transition-all",
                    emoji === e
                      ? "bg-primary/10 border-primary/40"
                      : "border-border hover:bg-muted"
                  )}
                  aria-label={`Choose icon ${e}`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">Color</label>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(SUBJECT_COLORS) as SubjectColor[]).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={cn(
                    "w-8 h-8 rounded-full border-2 transition-all",
                    color === c ? "border-foreground scale-110" : "border-transparent hover:scale-110"
                  )}
                  style={{ backgroundColor: SUBJECT_COLORS[c] }}
                  aria-label={`Choose ${c} color`}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">
              Description <span className="text-muted-foreground/50">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this subject about?"
              rows={3}
              className="w-full rounded-xl bg-muted border border-border px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={create} disabled={!name.trim()}>Create Subject</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
