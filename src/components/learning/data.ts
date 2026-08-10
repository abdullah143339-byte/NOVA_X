import type {
  LearningState,
  StudyStats,
  SubjectColor,
  FileKind,
} from "./types";

const STORAGE_KEY = "nova_learning_v2";
const LEGACY_STORAGE_KEY = "nova_learning_v1";

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

function emptyState(): LearningState {
  return {
    subjects: [],
    lectures: [],
    notes: [],
    files: [],
    tasks: [],
    bookmarks: [],
    sessions: [],
  };
}

export function loadState(): LearningState {
  if (typeof window === "undefined") return emptyState();
  try {
    localStorage.removeItem(LEGACY_STORAGE_KEY);
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyState();
    return JSON.parse(raw) as LearningState;
  } catch {
    return emptyState();
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
