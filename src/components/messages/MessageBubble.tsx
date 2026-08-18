"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import {
  Download,
  Play,
  Pause,
  Loader2,
  AlertTriangle,
  Volume2,
  MessageSquareReply,
  Forward,
} from "lucide-react";
import type { ChatMessage } from "./types";
import { formatTime, formatBytes, formatDuration } from "./format";
import { cn } from "@/lib/utils";

function urlize(text: string): React.ReactNode[] {
  const parts = text.split(/(```[\s\S]*?```|`[^`]+`|\*\*[^*]+\*\*|https?:\/\/[^\s]+)/g);
  return parts.map((part, i) => {
    if (part.startsWith("```")) {
      const code = part.slice(3, -3);
      return (
        <pre key={i} className="mt-1 mb-1 bg-[#101216]/80 border border-white/10 rounded-lg p-2.5 overflow-x-auto text-[12px] leading-relaxed font-mono text-white/90">
          {code}
        </pre>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return <code key={i} className="bg-[#101216]/80 border border-white/10 rounded px-1.5 py-0.5 text-[12px] font-mono text-white/90">{part.slice(1, -1)}</code>;
    }
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>;
    }
    if (/^https?:\/\//.test(part)) {
      return (
        <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 break-all font-medium text-[#8b5a2b]">
          {part}
        </a>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

function fileIcon(message: ChatMessage): React.ReactNode {
  const name = message.media?.[0]?.name || "";
  const ext = name.split(".").pop()?.toLowerCase() || "";
  const isCode = message.type === "CODE" || ["js", "ts", "tsx", "jsx", "py", "html", "css", "json", "md"].includes(ext);
  const isSheet = ["xls", "xlsx", "csv"].includes(ext);
  const isSlides = ["ppt", "pptx"].includes(ext);
  const isDoc = ["doc", "docx", "txt", "pdf"].includes(ext);
  const cls = isCode ? "text-accent bg-accent/10" : isSheet ? "text-emerald-500 bg-emerald-500/10" : isSlides ? "text-amber-500 bg-amber-500/10" : "text-blue-500 bg-blue-500/10";
  const label = isCode ? "</>" : isSheet ? "≡" : isSlides ? "▤" : isDoc ? "📄" : "📎";
  return <span className={cn("w-11 h-11 rounded-xl flex items-center justify-center text-base font-bold shrink-0", cls)}>{label}</span>;
}

interface MessageBubbleProps {
  message: ChatMessage;
  isMe: boolean;
  currentUserId: string | null;
  groupStart?: boolean;
  onReply: (m: ChatMessage) => void;
  onForward: (m: ChatMessage) => void;
  onOpenMedia: (m: ChatMessage) => void;
  onRetry: (m: ChatMessage) => void;
  onDelete: (m: ChatMessage) => void;
  onQuoteClick?: (id: string) => void;
}

export default function MessageBubble({
  message: m,
  isMe,
  currentUserId,
  groupStart = false,
  onReply,
  onForward,
  onOpenMedia,
  onRetry,
  onDelete,
  onQuoteClick,
}: MessageBubbleProps) {
  const [playingVoice, setPlayingVoice] = useState(false);
  const voiceRef = useRef<HTMLAudioElement>(null);
  const senderName = m.sender?.displayName || m.sender?.username || "Unknown";
  const canDelete = isMe || currentUserId === m.senderId;

  const media = m.media?.[0];
  const isImage = m.type === "IMAGE" || media?.type === "IMAGE" || /\.(png|jpe?g|gif|webp|svg|avif|heic)$/i.test(media?.url || "");
  const isVideo = m.type === "VIDEO" || media?.type === "VIDEO" || /\.(mp4|webm|mov|m4v|mkv|3gp|avi)$/i.test(media?.url || "");
  const isAudio = m.type === "AUDIO" || m.type === "VOICE_NOTE" || media?.type?.startsWith("audio") || /\.(mp3|wav|ogg|m4a|aac|flac|opus)$/i.test(media?.url || "");
  const isFile = m.type === "FILE" || (!!media && !isImage && !isVideo && !isAudio);

  const quoted = m.replyTo;
  const replyPreview = quoted?.content || (quoted?.type === "IMAGE" ? "📷 Photo" : quoted?.type === "VOICE_NOTE" ? "🎙️ Voice note" : quoted?.type === "VIDEO" ? "🎬 Video" : quoted?.type === "FILE" ? "📎 File" : "Attachment");

  return (
    <motion.div
      layout
      id={`msg-${m.id}`}
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", damping: 26, stiffness: 320 }}
      className={cn("flex flex-col group", isMe ? "items-end" : "items-start", groupStart ? "message-group-break" : "message-group")}
    >
      <div className={cn("flex items-end gap-2", isMe ? "max-w-[80%] sm:max-w-[58%] flex-row-reverse" : "max-w-[82%] sm:max-w-[62%]")}>
        {!isMe && (
          <div className="w-7 h-7 rounded-full bg-gradient-primary flex items-center justify-center text-white text-[10px] font-bold shrink-0 overflow-hidden mb-1 shadow-md ring-1 ring-black/5">
            {m.sender?.avatar ? <img src={m.sender.avatar} alt="" className="w-full h-full object-cover" /> : senderName.slice(0, 2).toUpperCase()}
          </div>
        )}

        <div
          className={cn(
            "relative text-sm leading-relaxed max-w-full px-3.5 py-2.5 message-tactile",
            isMe ? "message-sent rounded-br-md" : "message-received rounded-bl-md"
          )}
        >
          {!isMe && m.conversationId && (
            <p className="text-[11px] font-semibold text-[#8b5a2b] mb-0.5">{senderName}</p>
          )}

          {quoted && (
            <button
              onClick={() => {
                if (onQuoteClick && quoted?.id) onQuoteClick(quoted.id);
              }}
              className="flex items-center gap-2 w-full max-w-[240px] rounded-lg px-2.5 py-1.5 mb-1.5 border-l-2 border-[#8b5a2b]/60 bg-black/5 text-left"
            >
              <MessageSquareReply className="w-3.5 h-3.5 shrink-0 opacity-70" />
              <div className="min-w-0">
                <p className="text-[10px] font-medium truncate text-[#8b5a2b]">
                  {quoted.sender?.id === currentUserId ? "You" : quoted.sender?.displayName || quoted.sender?.username || "User"}
                </p>
                <p className="text-[11px] truncate text-black/55">{replyPreview}</p>
              </div>
            </button>
          )}

          {isImage && media?.url && (
            <button
              onClick={() => onOpenMedia(m)}
              className="block rounded-xl overflow-hidden -mx-1 mb-1 cursor-zoom-in"
            >
              <img src={media.url} alt="" className="max-h-72 w-auto rounded-xl object-cover" loading="lazy" />
            </button>
          )}

          {isVideo && media?.url && (
            <button
              onClick={() => onOpenMedia(m)}
              className="relative block rounded-xl overflow-hidden mb-1 cursor-zoom-in"
            >
              <video src={media.url} className="max-h-72 w-auto rounded-xl" preload="metadata" muted playsInline />
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="w-11 h-11 rounded-full bg-black/50 backdrop-blur flex items-center justify-center">
                  <Play className="w-5 h-5 text-white fill-white" />
                </span>
              </span>
            </button>
          )}

          {isAudio && media?.url && (
            <div className="flex items-center gap-2 rounded-xl px-2 py-1.5 mb-1 min-w-[200px] bg-black/5">
              <button
                onClick={() => {
                  const el = voiceRef.current;
                  if (!el) return;
                  if (playingVoice) { el.pause(); setPlayingVoice(false); }
                  else { el.play().then(() => setPlayingVoice(true)).catch(() => {}); }
                }}
                aria-label={playingVoice ? "Pause" : "Play"}
                className="w-9 h-9 rounded-full bg-white/90 text-[#0B0D12] flex items-center justify-center shrink-0 shadow-sm"
              >
                {playingVoice ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
              </button>
              <div className="flex-1 flex items-center gap-2">
                <Volume2 className="w-3.5 h-3.5 opacity-60" />
                <div className="flex-1 h-1 rounded-full bg-black/20">
                  <div className="h-full w-0 rounded-full bg-current" />
                </div>
                <span className="text-[11px] tabular-nums text-black/70">
                  {media.duration ? formatDuration(media.duration) : formatDuration(0)}
                </span>
              </div>
              <audio ref={voiceRef} src={media.url} preload="metadata" onEnded={() => setPlayingVoice(false)} className="hidden" />
            </div>
          )}

          {isFile && media?.url && (
            <div className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 mb-1 min-w-[220px] bg-black/5">
              {fileIcon(m)}
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium truncate text-[#2b2417]">
                  {media.name || media.url.split("/").pop()}
                </p>
                <p className="text-[11px] text-black/60">
                  {formatBytes(media.size) || "File"}
                </p>
              </div>
              <a
                href={media.url}
                download={media.name}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Download file"
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-black/10"
              >
                <Download className="w-4 h-4" />
              </a>
            </div>
          )}

          {m.type === "CODE" && m.content && (
            <pre className="mt-1 mb-1 rounded-lg p-2.5 overflow-x-auto text-[12px] leading-relaxed font-mono border bg-[#101216]/90 border-white/10 text-white/90">{m.content}</pre>
          )}

          {m.isForwarded && (
            <p className="text-[10px] flex items-center gap-1 mb-0.5 text-black/55">
              <Forward className="w-3 h-3" /> Forwarded
            </p>
          )}

          {m.content && m.type !== "CODE" && (
            <div className={cn("whitespace-pre-wrap break-words", m.isDeleted && "opacity-60 italic")}>
              {urlize(m.content)}
            </div>
          )}

          <div className="message-meta justify-end mt-1">
            <span>{formatTime(m.createdAt)}</span>
            {m.isEdited && <span>· edited</span>}
            {isMe && m.status === "sent" && (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="opacity-80">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            )}
            {isMe && m.status === "sending" && <Loader2 className="w-3 h-3 animate-spin" />}
            {isMe && m.status === "error" && (
              <button onClick={() => onRetry(m)} aria-label="Retry send" className="text-red-500 hover:text-red-700">
                <AlertTriangle className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div
        className={cn(
          "flex items-center gap-0.5 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity",
          isMe ? "flex-row" : "flex-row-reverse"
        )}
      >
        <button onClick={() => onReply(m)} aria-label="Reply" title="Reply" className="w-7 h-7 rounded-full tactile-icon-btn hover:text-foreground" style={{ width: "1.75rem", height: "1.75rem", borderRadius: "999px" }}>
          <MessageSquareReply className="w-3.5 h-3.5" />
        </button>
        <button onClick={() => onForward(m)} aria-label="Forward" title="Forward" className="w-7 h-7 rounded-full tactile-icon-btn hover:text-foreground" style={{ width: "1.75rem", height: "1.75rem", borderRadius: "999px" }}>
          <Forward className="w-3.5 h-3.5" />
        </button>
        {canDelete && !m.isDeleted && (
          <button onClick={() => onDelete(m)} aria-label="Delete" title="Delete" className="w-7 h-7 rounded-full tactile-icon-btn hover:text-red-500" style={{ width: "1.75rem", height: "1.75rem", borderRadius: "999px" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /></svg>
          </button>
        )}
      </div>
    </motion.div>
  );
}
