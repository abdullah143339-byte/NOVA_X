"use client";

import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  BellOff,
  ShieldOff,
  Flag,
  Trash2,
  Download,
  MapPin,
  Globe,
  Lock,
  FileText,
  Link2,
  Image as ImageIcon,
  Mic,
} from "lucide-react";
import type { Conversation, ChatMessage } from "./types";
import { isVerifiedUser } from "./types";
import { formatBytes } from "./format";
import { cn } from "@/lib/utils";

interface ChatDetailsProps {
  conversation: Conversation;
  currentUserId: string | null;
  online: boolean;
  messages: ChatMessage[];
  open: boolean;
  onClose: () => void;
  onAction?: (action: "mute" | "block" | "report" | "clear" | "delete") => void;
}

function initials(name: string): string {
  return name.split(/\s+/).filter(Boolean).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

export default function ChatDetails({ conversation: conv, currentUserId, online, messages, open, onClose, onAction }: ChatDetailsProps) {
  const other = conv.participants.find((p) => p.userId !== currentUserId)?.user;
  const verified = conv.type === "DIRECT" ? isVerifiedUser(other) : false;
  const isGroup = conv.type === "GROUP";
  const members = conv.participants.filter((p) => p.user?.id);

  const shared = useMemo(() => {
    const media: ChatMessage[] = [];
    const files: ChatMessage[] = [];
    const links: ChatMessage[] = [];
    const voice: ChatMessage[] = [];
    messages.forEach((m) => {
      const url = m.media?.[0]?.url || "";
      const isImg = m.type === "IMAGE" || /\.(png|jpe?g|gif|webp|svg|avif)$/i.test(url);
      const isVid = m.type === "VIDEO" || /\.(mp4|webm|mov|m4v)$/i.test(url);
      if (isImg || isVid) media.push(m);
      else if (m.type === "VOICE_NOTE" || m.type === "AUDIO") voice.push(m);
      else if (m.type === "FILE" || (m.media && !isImg && !isVid)) files.push(m);
      if (/(https?:\/\/)/.test(m.content)) links.push(m);
    });
    return { media: media.slice(0, 24), files: files.slice(0, 8), links: links.slice(0, 8), voice: voice.slice(0, 8) };
  }, [messages]);

  const actions = [
    { id: "mute" as const, icon: BellOff, label: "Mute", note: "Stop notifications", enabled: true },
    { id: "block" as const, icon: ShieldOff, label: "Block", note: "Block this contact", enabled: true, danger: !isGroup },
    { id: "report" as const, icon: Flag, label: "Report", note: "Report this chat", enabled: true },
    { id: "clear" as const, icon: Trash2, label: "Clear Chat", note: "Delete all messages", enabled: true },
    { id: "delete" as const, icon: Trash2, label: "Delete Chat", note: "Remove conversation", enabled: true, danger: true },
  ];

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm lg:hidden"
            onClick={onClose}
          />
          <motion.aside
            role="dialog"
            aria-label="Chat details"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed lg:static inset-y-0 right-0 z-[70] w-full sm:w-80 lg:w-72 xl:w-80 shrink-0 border-l border-border bg-background/80 backdrop-blur-xl overflow-y-auto no-scrollbar pb-[env(safe-area-inset-bottom)]"
          >
            <div className="sticky top-0 flex items-center justify-between px-4 py-3 border-b border-border tactile-raised">
              <h4 className="text-sm font-semibold text-foreground">Details</h4>
              <button onClick={onClose} aria-label="Close details" className="w-8 h-8 rounded-full tactile-icon-btn text-muted-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 text-center">
              <div className="relative w-20 h-20 mx-auto mb-3">
                <div className="w-20 h-20 rounded-[1.4rem] flex items-center justify-center text-xl font-bold text-white overflow-hidden shadow-lg">
                  {conv.avatar ? (
                    <img src={conv.avatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-primary flex items-center justify-center">{initials(conv.name)}</div>
                  )}
                </div>
                {online && <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-emerald-500 ring-2 ring-background" />}
              </div>
              <div className="flex items-center justify-center gap-1.5">
                <h3 className="text-base font-bold text-foreground flex items-center gap-1">
                  {conv.name}
                  {verified && <span className="w-4 h-4 rounded-full bg-accent text-white flex items-center justify-center text-[9px] font-bold">✓</span>}
                </h3>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isGroup ? `${conv.participants.length} members` : online ? "Online" : "Offline"}
              </p>

              {!isGroup && other?.bio && <p className="text-sm text-muted-foreground mt-3">{other.bio}</p>}

              {!isGroup && (
                <div className="flex items-center justify-center gap-4 mt-3 text-[11px] text-muted-foreground">
                  {other?.location && (
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {other.location}</span>
                  )}
                  {other?.website && (
                    <a href={other.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-accent">
                      <Globe className="w-3 h-3" /> Website
                    </a>
                  )}
                </div>
              )}

              {!isGroup && !other?.bio && !other?.location && (
                <p className="text-xs text-muted-foreground/60 mt-2 flex items-center justify-center gap-1">
                  <Lock className="w-3 h-3" /> End-to-end encrypted conversation
                </p>
              )}
            </div>

            {isGroup && (
              <div className="px-4 mb-4">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Members</p>
                <div className="space-y-1">
                  {members.map((p) => (
                    <div key={p.userId} className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl hover:bg-muted/50">
                      <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center text-white text-[10px] font-bold overflow-hidden shrink-0">
                        {p.user?.avatar ? <img src={p.user.avatar} alt="" className="w-full h-full object-cover" /> : initials(p.user?.displayName || p.user?.username || "U")}
                      </div>
                      <span className="text-sm text-foreground truncate flex-1">{p.user?.displayName || p.user?.username}</span>
                      {p.role && p.role !== "MEMBER" && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/12 text-accent font-medium">{p.role.toLowerCase()}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="px-4 mb-4">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Shared Media</p>
              {shared.media.length > 0 ? (
                <div className="grid grid-cols-4 gap-1.5">
                  {shared.media.map((m) => (
                    <a
                      key={m.id}
                      href={m.media?.[0]?.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="relative aspect-square rounded-xl overflow-hidden tactile-inset group"
                    >
                      {m.type === "VIDEO" || /\.(mp4|webm)$/i.test(m.media?.[0]?.url || "") ? (
                        <video src={m.media?.[0]?.url} className="w-full h-full object-cover" preload="metadata" muted />
                      ) : (
                        <img src={m.media?.[0]?.url} alt="" className="w-full h-full object-cover" loading="lazy" />
                      )}
                    </a>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center py-4 text-muted-foreground">
                  <ImageIcon className="w-5 h-5 mb-1" />
                  <p className="text-xs">No media shared yet</p>
                </div>
              )}
            </div>

            {shared.files.length > 0 && (
              <div className="px-4 mb-4">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Shared Files</p>
                <div className="space-y-1.5">
                  {shared.files.map((m) => (
                    <a key={m.id} href={m.media?.[0]?.url} target="_blank" rel="noopener noreferrer" download className="flex items-center gap-2 px-2.5 py-2 rounded-2xl tactile-surface hover:brightness-105 transition-colors">
                      <FileText className="w-4 h-4 text-accent shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-foreground truncate">{m.media?.[0]?.name || "File"}</p>
                        <p className="text-[10px] text-muted-foreground">{formatBytes(m.media?.[0]?.size)}</p>
                      </div>
                      <Download className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {shared.links.length > 0 && (
              <div className="px-4 mb-4">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Shared Links</p>
                <div className="space-y-1.5">
                  {shared.links.map((m) => (
                    <div key={m.id} className="flex items-center gap-2 px-2.5 py-2 rounded-2xl tactile-surface">
                      <Link2 className="w-4 h-4 text-primary shrink-0" />
                      <p className="text-xs text-foreground truncate">{m.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {shared.voice.length > 0 && (
              <div className="px-4 mb-4">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Voice Notes</p>
                <div className="flex items-center gap-2 px-2.5 py-2 rounded-2xl tactile-surface">
                  <Mic className="w-4 h-4 text-accent shrink-0" />
                  <p className="text-xs text-foreground">{shared.voice.length} voice note{shared.voice.length > 1 ? "s" : ""}</p>
                </div>
              </div>
            )}

            <div className="px-4 pb-6">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Actions</p>
              <div className="space-y-1.5">
                {actions.map((a) => (
                  <button
                    key={a.label}
                    title={a.note}
                    onClick={() => {
                      if (onAction) {
                        onAction(a.id);
                        onClose();
                      }
                    }}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-3 h-11 rounded-2xl text-sm transition-colors tactile-surface",
                      a.danger ? "text-red-500 hover:bg-red-500/10" : "text-muted-foreground hover:text-foreground hover:brightness-105"
                    )}
                  >
                    <a.icon className="w-4 h-4" />
                    <span className="flex-1 text-left">{a.label}</span>
                    <span className="text-[10px] text-muted-foreground/60">{a.note}</span>
                  </button>
                ))}
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
