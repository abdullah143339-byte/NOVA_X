"use client";

import { useState } from "react";
import { Sparkles, Wand2, Tags, Cpu, FileText, Code2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Modal } from "@/components/admin/AdminShared";
import type { ProjectRow } from "./types";
import { aiSummarizeProject, aiSuggestTags, aiSuggestTechStack, aiDocsHelper, aiExplainCode } from "./ai";

type AIMode = "summary" | "tags" | "tech" | "docs" | "code";

const MODES: { id: AIMode; label: string; icon: React.ReactNode }[] = [
  { id: "summary", label: "Summary", icon: <Wand2 className="w-4 h-4" /> },
  { id: "tags", label: "Suggest Tags", icon: <Tags className="w-4 h-4" /> },
  { id: "tech", label: "Tech Stack", icon: <Cpu className="w-4 h-4" /> },
  { id: "docs", label: "Docs Outline", icon: <FileText className="w-4 h-4" /> },
  { id: "code", label: "Explain Code", icon: <Code2 className="w-4 h-4" /> },
];

export function ProjectAIAssistant({
  project,
  open,
  onClose,
}: {
  project: ProjectRow;
  open: boolean;
  onClose: () => void;
}) {
  const [mode, setMode] = useState<AIMode>("summary");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [fallbackUsed, setFallbackUsed] = useState(false);
  const [codeInput, setCodeInput] = useState("");

  async function run() {
    setLoading(true);
    setResult("");
    setFallbackUsed(false);
    let res: { text: string; fallback: boolean };
    try {
      if (mode === "summary") res = await aiSummarizeProject(project);
      else if (mode === "tags") res = await aiSuggestTags(project);
      else if (mode === "tech") res = await aiSuggestTechStack(project);
      else if (mode === "docs") res = await aiDocsHelper(project);
      else res = await aiExplainCode(codeInput || "// paste your code snippet here", project);
    } catch {
      res = { text: "The AI service is currently unavailable. Please try again in a moment.", fallback: true };
    }
    setResult(res.text);
    setFallbackUsed(res.fallback);
    setLoading(false);
  }

  function switchMode(next: AIMode) {
    setMode(next);
    setResult("");
    setFallbackUsed(false);
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      wide
      title={
        <span className="inline-flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" /> AI Project Assistant
        </span>
      }
    >
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex md:flex-col gap-1.5 md:w-44 shrink-0 overflow-x-auto">
          {MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => switchMode(m.id)}
              className={cn(
                "inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all",
                mode === m.id ? "bg-gradient-primary text-white" : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {m.icon}
              {m.label}
            </button>
          ))}
        </div>
        <div className="flex-1 min-w-0 space-y-3">
          {mode === "code" && (
            <textarea
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value)}
              rows={5}
              placeholder="Paste a code snippet from this project to get an AI explanation..."
              className="w-full rounded-xl bg-muted border border-border p-3 text-sm text-foreground font-mono placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          )}
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">
              {mode === "summary"
                ? "Get a punchy 3-point summary of this project."
                : mode === "tags"
                ? "Discover 8 SEO-friendly tags for better reach."
                : mode === "tech"
                ? "Recommended technologies with reasoning."
                : mode === "docs"
                ? "A ready documentation outline."
                : "Understand any code snippet instantly."}
            </p>
            <button
              type="button"
              onClick={run}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 h-9 rounded-xl bg-gradient-primary text-white text-xs font-semibold shrink-0 disabled:opacity-60"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              {loading ? "Thinking..." : "Generate"}
            </button>
          </div>
          {result && (
            <div className="rounded-xl bg-muted/60 border border-border p-4 text-sm text-foreground whitespace-pre-wrap leading-relaxed">
              {result}
            </div>
          )}
          {fallbackUsed && <p className="text-[11px] text-amber-500">Shown from local fallback (AI service unavailable).</p>}
        </div>
      </div>
    </Modal>
  );
}
