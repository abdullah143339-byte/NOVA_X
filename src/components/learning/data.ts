import type {
  LearningState,
  Subject,
  Lecture,
  Note,
  LearningFile,
  StudyTask,
  StudyStats,
  SubjectColor,
  FileKind,
} from "./types";

const STORAGE_KEY = "nova_learning_v1";

export const SUBJECT_COLORS: Record<SubjectColor, string> = {
  violet: "#6C63FF",
  blue: "#3B82F6",
  emerald: "#10B981",
  amber: "#F59E0B",
  rose: "#F43F5E",
  cyan: "#06B6D4",
  indigo: "#6366F1",
  pink: "#EC4899",
};

export function colorClass(color: SubjectColor): string {
  const map: Record<SubjectColor, string> = {
    violet: "bg-[#6C63FF]/15 text-[#6C63FF] border-[#6C63FF]/30",
    blue: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    emerald: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    amber: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    rose: "bg-rose-500/15 text-rose-400 border-rose-500/30",
    cyan: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
    indigo: "bg-indigo-500/15 text-indigo-400 border-indigo-500/30",
    pink: "bg-pink-500/15 text-pink-400 border-pink-500/30",
  };
  return map[color];
}

export function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function fileKind(name: string): FileKind {
  const ext = name.split(".").pop()?.toLowerCase() || "";
  if (["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext)) return "image";
  if (["pdf"].includes(ext)) return "pdf";
  if (["doc", "docx"].includes(ext)) return "docx";
  if (["ppt", "pptx"].includes(ext)) return "pptx";
  if (["txt", "md", "log"].includes(ext)) return "txt";
  if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) return "zip";
  return "code";
}

export function formatBytes(bytes: number): string {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  let n = bytes;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i++;
  }
  return `${n.toFixed(n >= 10 || i === 0 ? 0 : 1)} ${units[i]}`;
}

export function formatDate(ts: number | null | undefined): string {
  if (!ts) return "—";
  return new Date(ts).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function formatDuration(min: number | null): string {
  if (!min) return "—";
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h ? `${h}h ${m}m` : `${m}m`;
}

export function relativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(ts);
}

export function youtubeId(url: string): string | null {
  const m = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/
  );
  return m ? m[1] : null;
}

export function youtubeThumb(id: string): string {
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}

export function dateKey(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function addMinutes(date: string, minutes: number): string {
  const d = new Date(`${date}T00:00:00`);
  d.setDate(d.getDate());
  d.setMinutes(d.getMinutes() + minutes);
  return dateKey(d.getTime());
}

export function computeStats(state: LearningState): StudyStats {
  const lectures = state.lectures.filter((l) => !l.trashed && !l.archived);
  const tasks = state.tasks.filter((t) => !t.trashed && !t.archived);
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - 7);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const totalStudyMinutes = state.sessions.reduce((s, x) => s + x.minutes, 0);
  const weekMinutes = state.sessions
    .filter((s) => new Date(`${s.date}T00:00:00`).getTime() >= weekStart.getTime())
    .reduce((s, x) => s + x.minutes, 0);
  const monthMinutes = state.sessions
    .filter((s) => new Date(`${s.date}T00:00:00`).getTime() >= monthStart.getTime())
    .reduce((s, x) => s + x.minutes, 0);

  return {
    completedLectures: lectures.filter((l) => l.completed).length,
    totalLectures: lectures.length,
    completedTasks: tasks.filter((t) => t.completed).length,
    totalTasks: tasks.length,
    totalStudyMinutes,
    weekMinutes,
    monthMinutes,
    weekTarget: 300,
  };
}

function seed(): LearningState {
  const now = Date.now();
  const day = 86400000;
  const ai: Subject = { id: "sub-ai", name: "AI", emoji: "🤖", color: "violet", description: "Machine learning, neural networks and AI agents.", createdAt: now - 30 * day, updatedAt: now - 2 * day, archived: false, trashed: false };
  const prog: Subject = { id: "sub-prog", name: "Programming", emoji: "💻", color: "blue", description: "TypeScript, Python and software craftsmanship.", createdAt: now - 25 * day, updatedAt: now - day, archived: false, trashed: false };
  const math: Subject = { id: "sub-math", name: "Mathematics", emoji: "📐", color: "emerald", description: "Linear algebra and probability for machine learning.", createdAt: now - 20 * day, updatedAt: now - 3 * day, archived: false, trashed: false };
  const sec: Subject = { id: "sub-sec", name: "Cyber Security", emoji: "🛡️", color: "rose", description: "Threat modelling, OWASP and secure coding.", createdAt: now - 15 * day, updatedAt: now - day, archived: false, trashed: false };

  const lectures: Lecture[] = [
    {
      id: "lec-1", subjectId: "sub-ai", title: "Attention Is All You Need — Transformers Explained",
      description: "The transformer architecture, self-attention, positional encodings and multi-head attention.",
      teacher: "Andrej Karpathy", tags: ["transformers", "deep-learning"], source: "youtube",
      url: "https://www.youtube.com/watch?v=wjZofJX0v4M", mediaUrl: "",
      durationMin: 32, completed: true, favorite: true, createdAt: now - 10 * day, updatedAt: now - 4 * day, archived: false, trashed: false,
    },
    {
      id: "lec-2", subjectId: "sub-ai", title: "Fine-tuning LLMs with LoRA",
      description: "Low-rank adaptation, adapter layers and efficient fine-tuning.",
      teacher: "Sebastian Raschka", tags: ["llm", "lora"], source: "youtube",
      url: "https://www.youtube.com/watch?v=Dh8KTz3pVf8", mediaUrl: "",
      durationMin: 48, completed: false, favorite: false, createdAt: now - 5 * day, updatedAt: now - 2 * day, archived: false, trashed: false,
    },
    {
      id: "lec-3", subjectId: "sub-prog", title: "TypeScript Generics & Advanced Types",
      description: "Generic constraints, mapped types, utility types and type gymnastics.",
      teacher: "Matt Pocock", tags: ["typescript"], source: "youtube",
      url: "https://www.youtube.com/watch?v=xYkQjJg0HMY", mediaUrl: "",
      durationMin: 26, completed: false, favorite: true, createdAt: now - 3 * day, updatedAt: now - day, archived: false, trashed: false,
    },
  ];

  const notes: Note[] = [
    {
      id: "note-1", subjectId: "sub-ai", title: "Transformer Math Cheat Sheet",
      content: [
        "# Transformer Math Cheat Sheet",
        "",
        "## Self-Attention",
        "",
        "$$ Q = XW_Q, \\quad K = XW_K, \\quad V = XW_V $$",
        "",
        "$$ \\text{Attention}(Q,K,V) = \\text{softmax}\\left(\\frac{QK^T}{\\sqrt{d_k}}\\right)V $$",
        "",
        "### Key ideas",
        "",
        "- Scaled dot-product attention divides by $\\sqrt{d_k}$ to stabilise gradients",
        "- Multi-head attention splits the last dimension into `h` heads",
        "- Positional encodings add order information to token embeddings",
        "",
        "| Head | Focus |",
        "| --- | --- |",
        "| 1 | Syntax |",
        "| 2 | Semantics |",
        "",
        "```ts",
        "function attention(Q, K, V, dk) {",
        "  return softmax(scaledDot(Q, K, dk)).matmul(V);",
        "}",
        "```",
      ].join("\n"),
      tags: ["transformers", "math"], pinned: true, favorite: true, createdAt: now - 8 * day, updatedAt: now - 3 * day, archived: false, trashed: false,
    },
    {
      id: "note-2", subjectId: "sub-sec", title: "OWASP Top 10 — Quick Summary",
      content: [
        "# OWASP Top 10 — Quick Summary",
        "",
        "1. **Broken Access Control** — enforce least privilege server-side",
        "2. **Cryptographic Failures** — use modern ciphers, no homebrew crypto",
        "3. **Injection** — parameterise queries, escape output",
        "",
        "> Never trust user input. Validate everything at the boundary.",
        "",
        "Code snippet for SQL injection prevention:",
        "",
        "```python",
        "cursor.execute(\"SELECT * FROM users WHERE id = ?\", (user_id,))",
        "```",
      ].join("\n"),
      tags: ["owasp", "security"], pinned: false, favorite: true, createdAt: now - 6 * day, updatedAt: now - 2 * day, archived: false, trashed: false,
    },
    {
      id: "note-3", subjectId: "sub-math", title: "Linear Algebra Essentials",
      content: [
        "# Linear Algebra Essentials",
        "",
        "## Vectors & Matrices",
        "",
        "A vector $\\vec{v} \\in \\mathbb{R}^n$. The dot product:",
        "",
        "$$ \\vec{a} \\cdot \\vec{b} = \\sum_{i=1}^{n} a_i b_i = \\|\\vec{a}\\|\\|\\vec{b}\\|\\cos\\theta $$",
        "",
        "| Operation | Formula |",
        "| --- | --- |",
        "| Dot product | $\\vec{a}\\cdot\\vec{b}$ |",
        "| Cross product | $\\vec{a}\\times\\vec{b}$ |",
        "",
        "- Matrix-vector multiplication as linear transformation",
        "- Eigenvalues describe scaling along eigenvectors",
      ].join("\n"),
      tags: ["linear-algebra"], pinned: false, favorite: false, createdAt: now - 4 * day, updatedAt: now - day, archived: false, trashed: false,
    },
  ];

  const files: LearningFile[] = [
    {
      id: "file-1", subjectId: "sub-ai", name: "attention-is-all-you-need.pdf", kind: "pdf",
      size: 2200000, mime: "application/pdf", dataUrl: "", tags: ["transformers"], favorite: true,
      createdAt: now - 7 * day, archived: false, trashed: false,
    },
    {
      id: "file-2", subjectId: "sub-prog", name: "typescript-notes.md", kind: "txt",
      size: 18000, mime: "text/markdown", dataUrl: "", tags: ["typescript"], favorite: false,
      createdAt: now - 3 * day, archived: false, trashed: false,
    },
  ];

  const tasks: StudyTask[] = [
    {
      id: "task-1", subjectId: "sub-ai", title: "Finish LoRA fine-tuning lecture",
      notes: "Take notes on adapter layer sizes.", deadline: now + 2 * day, reminderAt: now + day,
      priority: "high", completed: false, createdAt: now - 2 * day, archived: false, trashed: false,
    },
    {
      id: "task-2", subjectId: "sub-prog", title: "Submit TypeScript assignment",
      notes: "Cover mapped types and generics.", deadline: now + 5 * day, reminderAt: null,
      priority: "medium", completed: false, createdAt: now - day, archived: false, trashed: false,
    },
    {
      id: "task-3", subjectId: "sub-math", title: "Practice eigenvector problems",
      notes: "10 problems from chapter 6.", deadline: now - day, reminderAt: null,
      priority: "low", completed: true, createdAt: now - 5 * day, archived: false, trashed: false,
    },
  ];

  const bookmarks = [
    { id: "bm-1", refType: "note" as const, refId: "note-1", createdAt: now - 2 * day },
    { id: "bm-2", refType: "lecture" as const, refId: "lec-3", createdAt: now - day },
    { id: "bm-3", refType: "file" as const, refId: "file-1", createdAt: now - 4 * day },
  ];

  const sessions = [] as { date: string; minutes: number }[];
  for (let i = 0; i < 14; i++) {
    sessions.push({ date: dateKey(now - i * day), minutes: 40 + ((i * 37) % 80) });
  }

  return {
    subjects: [ai, prog, math, sec],
    lectures,
    notes,
    files,
    tasks,
    bookmarks,
    sessions,
  };
}

export function loadState(): LearningState {
  if (typeof window === "undefined") return seed();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const s = seed();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
      return s;
    }
    return JSON.parse(raw) as LearningState;
  } catch {
    return seed();
  }
}

export function saveState(state: LearningState): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage quota exceeded — drop large data URLs to keep the app usable.
  }
}

// The Learning Hub is persisted via the backend /learning API (see
// backend/src/modules/learning). localStorage acts as an offline cache that the
// client syncs to the server on the next successful load.
export const learningApiSynced = true;
