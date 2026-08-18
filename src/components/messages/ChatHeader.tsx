"use client";

import { useState } from "react";
import { Phone, Video, Search, MoreVertical, Info, ArrowLeft, BellOff, X } from "lucide-react";
import type { Conversation } from "./types";
import { isVerifiedUser } from "./types";
import { cn } from "@/lib/utils";

interface ChatHeaderProps {
  conversation: Conversation;
  online: boolean;
  typingName?: string;
  connected: boolean;
  detailsOpen: boolean;
  onToggleDetails: () => void;
  onBack: () => void;
  onSearch: (q: string) => void;
  onCall?: (kind: "voice" | "video") => void;
}

function initials(name: string): string {
  return name.split(/\s+/).filter(Boolean).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

export default function ChatHeader({
  conversation: conv,
  online,
  typingName,
  connected,
  detailsOpen,
  onToggleDetails,
  onBack,
  onSearch,
  onCall,
}: ChatHeaderProps) {
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState("");
  const other = conv.participants.find((p) => p.user?.id)?.user;
  const verified = conv.type === "DIRECT" ? isVerifiedUser(other) : false;
  const isGroup = conv.type === "GROUP";

  return (
    <div className="flex items-center justify-between gap-2 px-3 sm:px-5 py-2.5 border-b border-border tactile-raised rounded-none shrink-0">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onBack}
          aria-label="Back to conversations"
          className="lg:hidden w-9 h-9 rounded-full tactile-icon-btn text-muted-foreground shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <div className="relative shrink-0">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-bold text-white overflow-hidden shadow-md">
            {conv.avatar ? (
              <img src={conv.avatar} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-primary flex items-center justify-center">{initials(conv.name)}</div>
            )}
          </div>
          {online && <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-background" />}
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <h3 className="text-sm font-semibold text-foreground truncate flex items-center gap-1">
              {conv.name}
              {verified && <span className="w-4 h-4 shrink-0 rounded-full bg-accent text-white flex items-center justify-center text-[9px] font-bold">✓</span>}
            </h3>
          </div>
          <p className={cn("text-xs truncate", typingName ? "text-primary font-medium" : "text-muted-foreground")}>
            {typingName ? `${typingName} is typing...` : isGroup ? `${conv.participants.length} members` : online ? "Online" : connected ? "Offline" : "Connecting..."}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <button onClick={() => onCall?.("voice")} aria-label="Voice call" title="Voice call" className="w-10 h-10 rounded-full tactile-icon-btn text-muted-foreground hover:text-emerald-500">
          <Phone className="w-4 h-4" />
        </button>
        <button onClick={() => onCall?.("video")} aria-label="Video call" title="Video call" className="w-10 h-10 rounded-full tactile-icon-btn text-muted-foreground hover:text-accent">
          <Video className="w-4 h-4" />
        </button>

        {searching ? (
          <div className="flex items-center gap-1 rounded-full tactile-inset pl-3 pr-1 py-1">
            <Search className="w-3.5 h-3.5 text-muted-foreground" />
            <input
              autoFocus
              value={query}
              onChange={(e) => { setQuery(e.target.value); onSearch(e.target.value); }}
              placeholder="Search messages"
              aria-label="Search messages"
              className="w-28 sm:w-44 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
            />
            <button
              onClick={() => { setSearching(false); setQuery(""); onSearch(""); }}
              aria-label="Close search"
              className="w-7 h-7 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button onClick={() => setSearching(true)} aria-label="Search messages" className="w-10 h-10 rounded-full tactile-icon-btn text-muted-foreground">
            <Search className="w-4 h-4" />
          </button>
        )}

        <button
          onClick={onToggleDetails}
          aria-label="Chat details"
          className={cn("w-10 h-10 rounded-full tactile-icon-btn", detailsOpen ? "text-primary" : "text-muted-foreground")}
        >
          <Info className="w-4 h-4" />
        </button>

        {conv.isMuted && <BellOff className="w-4 h-4 text-muted-foreground hidden sm:block" />}
        <MoreVertical className="w-4 h-4 text-muted-foreground hidden sm:block" />
      </div>
    </div>
  );
}
