import type { ChatMessage, MessageType } from "./types";

export function formatTime(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function formatConversationTime(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const dayDiff = Math.floor((startOfDay - new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()) / 86400000);
  if (dayDiff === 0) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (dayDiff === 1) return "Yesterday";
  if (dayDiff < 7) return d.toLocaleDateString([], { weekday: "short" });
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

export function isSameDay(a?: string | null, b?: string | null): boolean {
  if (!a || !b) return false;
  const da = new Date(a);
  const db = new Date(b);
  if (isNaN(da.getTime()) || isNaN(db.getTime())) return false;
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
}

export function formatDateLabel(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const dayDiff = Math.floor((startOfDay - new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()) / 86400000);
  if (dayDiff === 0) return "Today";
  if (dayDiff === 1) return "Yesterday";
  return d.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });
}

export function formatBytes(bytes?: number): string {
  if (!bytes || bytes <= 0) return "";
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  let n = bytes;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i++;
  }
  return `${n >= 10 || i === 0 ? Math.round(n) : n.toFixed(1)} ${units[i]}`;
}

export function formatDuration(seconds?: number): string {
  if (!seconds || seconds <= 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const typeLabels: Record<MessageType, string> = {
  TEXT: "Message",
  IMAGE: "📷 Image",
  VIDEO: "🎬 Video",
  AUDIO: "🎵 Audio",
  FILE: "📎 File",
  VOICE_NOTE: "🎙️ Voice note",
  STICKER: "Sticker",
  GIF: "GIF",
  CODE: "Code block",
  AI_RESPONSE: "AI response",
  SYSTEM: "",
};

export function messagePreview(m: Pick<ChatMessage, "type" | "content" | "media" | "isDeleted">): string {
  if (m.isDeleted) return "🚫 Message deleted";
  if (m.content && m.content.trim()) return m.content;
  if (Array.isArray(m.media) && m.media[0]?.name) return `📎 ${m.media[0].name}`;
  return typeLabels[m.type] || "Attachment";
}

export function isSystemMessage(m: ChatMessage): boolean {
  return m.type === "SYSTEM" || m.isDeleted === true;
}
