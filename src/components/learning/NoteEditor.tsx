"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import { useLearning } from "./LearningProvider";
import { SubjectSelect, TagInput } from "./LearningShared";
import { MarkdownPreview } from "./Markdown";
import type { Note } from "./types";
import {
  Bold,
  Italic,
  Code,
  Heading2,
  Link2,
  Image,
  List,
  ListOrdered,
  Quote,
  TableProperties,
  Sigma,
  Eye,
  PenLine,
  Check,
  Loader2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const DRAFT_KEY = "novax_note_draft";

const ACTIONS: { icon: LucideIcon; label: string; before: string; after: string; pad?: string }[] = [
  { icon: Bold, label: "Bold", before: "**", after: "**" },
  { icon: Italic, label: "Italic", before: "*", after: "*" },
  { icon: Code, label: "Code", before: "`", after: "`", pad: "code" },
  { icon: Heading2, label: "Heading", before: "\n## ", after: "\n", pad: "Heading" },
  { icon: Link2, label: "Link", before: "[", after: "](https://)", pad: "title" },
  { icon: Image, label: "Image", before: "![", after: "](https://)", pad: "alt" },
  { icon: List, label: "List", before: "\n- ", after: "\n", pad: "item" },
  { icon: ListOrdered, label: "Ordered list", before: "\n1. ", after: "\n", pad: "item" },
  { icon: Quote, label: "Quote", before: "\n> ", after: "\n", pad: "quote" },
  { icon: TableProperties, label: "Table", before: "\n| A | B |\n| --- | --- |\n", after: "", pad: "| 1 | 2 |" },
  { icon: Sigma, label: "Math", before: "$$ ", after: " $$", pad: "x^2" },
];

function readDraft(): { title: string; content: string; subjectId: string | null; tags: string[] } | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as { title: string; content: string; subjectId: string | null; tags: string[] };
  } catch {
    return null;
  }
}

export function NoteEditor({
  note,
  onDone,
}: {
  note?: Note;
  onDone?: () => void;
}) {
  const { state, addNote, updateNote } = useLearning();
  const router = useRouter();
  const isEdit = Boolean(note);

  const [title, setTitle] = useState(note?.title || "");
  const [content, setContent] = useState(note?.content || "");
  const [subjectId, setSubjectId] = useState<string | null>(note?.subjectId || null);
  const [tags, setTags] = useState<string[]>(note?.tags || []);
  const [preview, setPreview] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const areaRef = useRef<HTMLTextAreaElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saved = useRef(false);

  useEffect(() => {
    if (isEdit) return;
    let cancelled = false;
    const d = readDraft();
    if (d && !title && d.content) {
      const raf = requestAnimationFrame(() => {
        if (cancelled) return;
        setTitle(d.title);
        setContent(d.content);
        setSubjectId(d.subjectId);
        setTags(d.tags);
      });
      return () => {
        cancelled = true;
        cancelAnimationFrame(raf);
      };
    }
  }, [isEdit, title]);

  useEffect(() => {
    if (!isEdit) {
      try {
        localStorage.setItem(
          DRAFT_KEY,
          JSON.stringify({ title, content, subjectId, tags })
        );
      } catch {
        // storage full
      }
      return;
    }
    if (!note) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    if (dirty) {
      saveTimer.current = setTimeout(() => {
        updateNote(note.id, { title, content, subjectId, tags });
        setDirty(false);
      }, 800);
    }
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [title, content, subjectId, tags, isEdit, note, updateNote, dirty]);

  const apply = useCallback((before: string, after: string, padding?: string) => {
    const el = areaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const sel = content.slice(start, end);
    const withSel = sel || (padding ?? "text");
    const next =
      content.slice(0, start) + before + withSel + after + content.slice(end);
    setContent(next);
    setDirty(true);
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + before.length + withSel.length + after.length;
      el.setSelectionRange(pos, pos);
    });
  }, [content]);

  const handleSave = () => {
    if (!title.trim() && !content.trim()) return;
    setSaving(true);
    if (isEdit && note) {
      updateNote(note.id, { title, content, subjectId, tags });
    } else {
      const created = addNote({ title: title.trim() || "Untitled note", content, subjectId, tags, pinned: false, favorite: false });
      localStorage.removeItem(DRAFT_KEY);
      saved.current = true;
      router.push(`/dashboard/learning/notes/edit/${created.id}`);
    }
    setSaving(false);
    onDone?.();
  };

  const goBack = () => {
    router.back();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {dirty ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Check className="w-3.5 h-3.5 text-emerald-400" />
          )}
          {dirty ? "Saving…" : isEdit ? "Auto-saved" : "Draft auto-saved"}
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="md" onClick={goBack}>
            Cancel
          </Button>
          <Button size="md" onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : isEdit ? "Update Note" : "Create Note"}
          </Button>
        </div>
      </div>

      <input
        type="text"
        value={title}
        onChange={(e) => {
          setTitle(e.target.value);
          setDirty(true);
        }}
        placeholder="Note title"
        aria-label="Note title"
        className="w-full h-12 px-4 rounded-xl bg-muted border border-border text-lg font-bold text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
      />

      <div className="flex flex-wrap items-center gap-2">
        <SubjectSelect subjects={state.subjects} value={subjectId} onChange={(v) => {
          setSubjectId(v);
          setDirty(true);
        }} />
        <div className="flex-1 min-w-[180px] rounded-xl bg-muted border border-border px-3 py-1.5">
          <TagInput tags={tags} onChange={(v) => {
            setTags(v);
            setDirty(true);
          }} placeholder="Add tags…" />
        </div>
      </div>

      <div className="rounded-2xl border border-border overflow-hidden bg-muted/30">
        <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-border bg-muted/60">
          <div className="flex items-center gap-1 overflow-x-auto">
            {ACTIONS.map((a) => (
              <button
                key={a.label}
                type="button"
                onClick={() => apply(a.before, a.after, a.pad)}
                aria-label={a.label}
                title={a.label}
                className="w-9 h-9 sm:w-8 sm:h-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface flex items-center justify-center transition-all shrink-0"
              >
                <a.icon className="w-4 h-4" />
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setPreview((p) => !p)}
            className={cn(
              "flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs font-medium border transition-all shrink-0",
              preview
                ? "bg-primary/10 text-primary border-primary/30"
                : "text-muted-foreground border-border hover:text-foreground"
            )}
          >
            {preview ? <PenLine className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            {preview ? "Edit" : "Preview"}
          </button>
        </div>

        {preview ? (
          <div className="p-5 min-h-[320px] bg-background/40">
            <MarkdownPreview content={content} />
          </div>
        ) : (
          <textarea
            ref={areaRef}
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              setDirty(true);
            }}
            placeholder={"Write your note…\n\nUse markdown: **bold**, `code`, $$ math $$, tables & code blocks."}
            aria-label="Note content"
            className="w-full min-h-[320px] p-5 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/40 font-mono leading-relaxed focus:outline-none resize-y"
          />
        )}
      </div>
    </div>
  );
}
