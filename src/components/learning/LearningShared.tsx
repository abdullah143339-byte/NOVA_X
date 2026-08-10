"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  FolderOpen,
  NotebookPen,
  Video,
  Folder,
  ListTodo,
  Bookmark,
  Trash2,
  Search,
  type LucideIcon,
} from "lucide-react";
import { colorClass } from "./data";
import type { Subject, TaskPriority, FileKind } from "./types";

export const LEARNING_BASE = "/dashboard/learning";

export const learningTabs = [
  { label: "Subjects", href: `${LEARNING_BASE}/subjects`, icon: FolderOpen },
  { label: "Notes", href: `${LEARNING_BASE}/notes`, icon: NotebookPen },
  { label: "Lectures", href: `${LEARNING_BASE}/lectures`, icon: Video },
  { label: "Files", href: `${LEARNING_BASE}/files`, icon: Folder },
  { label: "Tasks", href: `${LEARNING_BASE}/tasks`, icon: ListTodo },
  { label: "Bookmarks", href: `${LEARNING_BASE}/bookmarks`, icon: Bookmark },
  { label: "AI Search", href: `${LEARNING_BASE}/ai-search`, icon: Search },
  { label: "Trash", href: `${LEARNING_BASE}/trash`, icon: Trash2 },
];

export function LearningNav() {
  const pathname = usePathname();
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 [scrollbar-width:none]">
      {learningTabs.map((tab) => {
        const active = "exact" in tab && tab.exact ? pathname === tab.href : pathname.startsWith(tab.href);        const Icon = tab.icon;
        return (
          <Link
            key={tab.label}
            href={tab.href}
            className={cn(
              "flex items-center gap-1.5 whitespace-nowrap px-3.5 py-2 rounded-xl text-sm font-medium transition-all",
              active
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            <Icon className="w-4 h-4" />
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  icon: Icon,
  action,
}: {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="w-11 h-11 rounded-2xl bg-primary/10 border border-primary/15 flex items-center justify-center shrink-0">
            <Icon className="w-5.5 h-5.5 text-primary" />
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold text-foreground">{title}</h1>
          {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

export function SectionHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-end justify-between gap-3 mb-3">
      <div>
        <h2 className="text-base font-bold text-foreground">{title}</h2>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  desc,
  action,
}: {
  icon: LucideIcon;
  title: string;
  desc?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="glass rounded-3xl p-10 sm:p-14 text-center">
      <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 border border-primary/15 flex items-center justify-center">
        <Icon className="w-8 h-8 text-primary" />
      </div>
      <h3 className="mt-5 text-base font-bold text-foreground">{title}</h3>
      {desc && <p className="mt-1.5 text-sm text-muted-foreground max-w-sm mx-auto">{desc}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function StatCard({
  label,
  value,
  sub,
  icon: Icon,
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
  icon: LucideIcon;
}) {
  return (
    <div className="glass rounded-2xl p-4 flex items-start gap-3">
      <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/15 flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <div className="min-w-0">
        <p className="text-xl font-bold text-foreground leading-tight tabular-nums">{value}</p>
        <p className="text-xs text-muted-foreground mt-0.5 truncate">{label}</p>
        {sub && <p className="text-[11px] text-primary/80 mt-1">{sub}</p>}
      </div>
    </div>
  );
}

export function SubjectChip({ subject, to }: { subject?: Subject | null; to?: string }) {
  if (!subject) return null;
  const inner = (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border",
        colorClass(subject.color)
      )}
    >
      <span>{subject.emoji}</span>
      {subject.name}
    </span>
  );
  if (!to) return inner;
  return (
    <Link href={to} onClick={(e) => e.stopPropagation()} className="hover:opacity-80 transition-opacity">
      {inner}
    </Link>
  );
}

export function TagInput({
  tags,
  onChange,
  placeholder = "Add tag and press Enter",
}: {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}) {
  const add = (value: string) => {
    const v = value.trim().replace(/^#/, "");
    if (v && !tags.includes(v)) onChange([...tags, v]);
  };
  return (
    <div className="flex flex-wrap gap-1.5 items-center">
      {tags.map((t) => (
        <span
          key={t}
          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-primary/10 text-primary text-xs font-medium"
        >
          #{t}
          <button
            type="button"
            aria-label={`Remove tag ${t}`}
            onClick={() => onChange(tags.filter((x) => x !== t))}
            className="hover:text-red-500 transition-colors"
          >
            ×
          </button>
        </span>
      ))}
      <input
        type="text"
        placeholder={placeholder}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            add((e.target as HTMLInputElement).value);
            (e.target as HTMLInputElement).value = "";
          }
          if (e.key === "Backspace" && (e.target as HTMLInputElement).value === "" && tags.length) {
            onChange(tags.slice(0, -1));
          }
        }}
        onBlur={(e) => {
          if (e.target.value.trim()) {
            add(e.target.value);
            e.target.value = "";
          }
        }}
        className="flex-1 min-w-[140px] h-8 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
      />
    </div>
  );
}

export function SubjectSelect({
  subjects,
  value,
  onChange,
  placeholder = "No subject",
}: {
  subjects: Subject[];
  value: string | null;
  onChange: (id: string | null) => void;
  placeholder?: string;
}) {
  return (
    <select
      value={value || ""}
      onChange={(e) => onChange(e.target.value || null)}
      className="h-11 rounded-xl bg-muted border border-border px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
      aria-label="Subject"
    >
      <option value="">{placeholder}</option>
      {subjects.map((s) => (
        <option key={s.id} value={s.id}>
          {s.emoji} {s.name}
        </option>
      ))}
    </select>
  );
}

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  const map: Record<TaskPriority, string> = {
    high: "bg-rose-500/15 text-rose-400 border-rose-500/30",
    medium: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    low: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  };
  return (
    <span className={cn("px-2 py-0.5 rounded-lg text-[11px] font-semibold border", map[priority])}>
      {priority}
    </span>
  );
}

export function KindBadge({ kind }: { kind: FileKind }) {
  const map: Record<FileKind, string> = {
    pdf: "text-rose-400",
    docx: "text-blue-400",
    pptx: "text-amber-400",
    txt: "text-emerald-400",
    image: "text-cyan-400",
    zip: "text-violet-400",
    code: "text-zinc-400",
  };
  return <span className={cn("uppercase text-[11px] font-bold tracking-wide", map[kind])}>{kind}</span>;
}

export function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(text);
  return Promise.reject(new Error("Clipboard unavailable"));
}

export function useCopy(resetMs = 1600) {
  const [copied, setCopied] = useState(false);
  const copy = async (text: string) => {
    try {
      await copyToClipboard(text);
      setCopied(true);
      setTimeout(() => setCopied(false), resetMs);
    } catch {
      setCopied(false);
    }
  };
  return { copied, copy };
}
