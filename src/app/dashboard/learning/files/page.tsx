"use client";

import { useMemo, useRef, useState } from "react";
import { Folder, Plus, Upload, Loader2 } from "lucide-react";
import Button from "@/components/ui/Button";
import { useLearning } from "@/components/learning/LearningProvider";
import { LearningNav, PageHeader, EmptyState, SubjectSelect, TagInput } from "@/components/learning/LearningShared";
import { FileCard } from "@/components/learning/LearningCards";
import { fileKind, formatBytes } from "@/components/learning/data";
import type { FileKind } from "@/components/learning/types";
import { cn } from "@/lib/utils";

type Filter = "all" | "favorites" | FileKind;

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "pdf", label: "PDF" },
  { key: "docx", label: "DOC" },
  { key: "pptx", label: "PPT" },
  { key: "txt", label: "TXT" },
  { key: "image", label: "Images" },
  { key: "zip", label: "ZIP" },
  { key: "code", label: "Code" },
  { key: "favorites", label: "★ Favorites" },
];

export default function FilesPage() {
  const { state, addFile } = useLearning();
  const inputRef = useRef<HTMLInputElement>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [pending, setPending] = useState<{ name: string; size: number; kind: FileKind; dataUrl: string } | null>(null);
  const [subjectId, setSubjectId] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const files = useMemo(
    () =>
      state.files
        .filter((f) => !f.trashed && !f.archived)
        .filter((f) => (filter === "all" ? true : filter === "favorites" ? f.favorite : f.kind === filter))
        .sort((a, b) => b.createdAt - a.createdAt),
    [state.files, filter]
  );

  const onPick = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      setPending({ name: file.name, size: file.size, kind: fileKind(file.name), dataUrl: String(reader.result || "") });
      setSubjectId(null);
      setTags([]);
    };
    reader.readAsDataURL(file);
    if (inputRef.current) inputRef.current.value = "";
  };

  const save = () => {
    if (!pending) return;
    setSaving(true);
    addFile({
      subjectId,
      name: pending.name,
      kind: pending.kind,
      size: pending.size,
      mime: pending.dataUrl.split(";")[0]?.replace("data:", "") || "",
      dataUrl: pending.dataUrl,
      tags,
      favorite: false,
    });
    setPending(null);
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Files"
        subtitle="Upload PDFs, documents, images and more."
        icon={Folder}
        action={
          <Button onClick={() => inputRef.current?.click()}>
            <Plus className="w-4 h-4" /> Upload File
          </Button>
        }
      />

      <LearningNav />

      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.md,.csv,.json,.zip,.rar,.png,.jpg,.jpeg,.gif,.webp,.svg,.ts,.tsx,.js,.py,.java,.cpp,.c,.h,.html,.css,.sql,.sh"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onPick(f);
        }}
      />

      {pending ? (
        <div className="glass rounded-3xl p-6 max-w-2xl space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/15 flex items-center justify-center">
              <Upload className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-foreground text-sm truncate">{pending.name}</p>
              <p className="text-xs text-muted-foreground">{pending.kind.toUpperCase()} · {formatBytes(pending.size)}</p>
            </div>
          </div>
          <SubjectSelect subjects={state.subjects} value={subjectId} onChange={setSubjectId} placeholder="No subject" />
          <div className="rounded-xl bg-muted border border-border px-3 py-1.5">
            <TagInput tags={tags} onChange={setTags} />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setPending(null)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 animate-spin" />} Save File
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-full flex flex-col items-center justify-center gap-2 h-36 rounded-3xl border-2 border-dashed border-border bg-muted/20 hover:border-primary/50 hover:bg-muted/40 transition-all"
        >
          <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/15 flex items-center justify-center">
            <Upload className="w-6 h-6 text-primary" />
          </div>
          <p className="text-sm font-semibold text-foreground">Click to upload a file</p>
          <p className="text-xs text-muted-foreground">PDF, DOCX, PPTX, TXT, images, ZIP and code files</p>
        </button>
      )}

      <div className="flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none]">
        {FILTERS.map((f) => (
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

      {files.length === 0 ? (
        <EmptyState
          icon={Folder}
          title={filter === "all" ? "No files yet" : "No files match"}
          desc={filter === "all" ? "Upload your study materials to keep them organised by subject." : "Try a different filter."}
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {files.map((f) => (
            <FileCard key={f.id} file={f} />
          ))}
        </div>
      )}
    </div>
  );
}
