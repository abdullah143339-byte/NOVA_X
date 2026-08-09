"use client";

import { useState } from "react";
import { Check, Link2, Send, AtSign, Globe, Mail } from "lucide-react";
import { Modal } from "@/components/admin/AdminShared";

const SHARE_PLATFORMS = [
  { id: "twitter", name: "X / Twitter", icon: <AtSign className="w-4 h-4" />, color: "bg-sky-500/10 text-sky-500 border border-sky-500/20" },
  { id: "whatsapp", name: "WhatsApp", icon: <Send className="w-4 h-4" />, color: "bg-green-500/10 text-green-500 border border-green-500/20" },
  { id: "facebook", name: "Facebook", icon: <Globe className="w-4 h-4" />, color: "bg-blue-500/10 text-blue-500 border border-blue-500/20" },
  { id: "email", name: "Email", icon: <Mail className="w-4 h-4" />, color: "bg-amber-500/10 text-amber-500 border border-amber-500/20" },
];

function buildShareUrl(platform: string, url: string, title: string) {
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  switch (platform) {
    case "twitter":
      return `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`;
    case "whatsapp":
      return `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`;
    case "facebook":
      return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
    case "email":
      return `mailto:?subject=${encodedTitle}&body=${encodedUrl}`;
    default:
      return url;
  }
}

export function ShareSheet({
  open,
  onClose,
  title,
  url,
  onShared,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  url: string;
  onShared?: () => void;
}) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const el = document.createElement("textarea");
      el.value = url;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopied(true);
    if (onShared) onShared();
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Modal open={open} onClose={onClose} title="Share this project">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="flex-1 min-w-0 px-3 py-2 rounded-xl bg-muted border border-border text-sm text-muted-foreground truncate">{url}</div>
          <button
            type="button"
            onClick={copyLink}
            className="inline-flex items-center gap-1.5 px-3 h-9 rounded-xl bg-gradient-primary text-white text-xs font-semibold shrink-0"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Link2 className="w-3.5 h-3.5" />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {SHARE_PLATFORMS.map((p) => (
            <a
              key={p.id}
              href={buildShareUrl(p.id, url, title)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onShared}
              className={`inline-flex items-center gap-2 px-3 h-10 rounded-xl text-xs font-semibold transition-transform hover:scale-[1.02] ${p.color}`}
            >
              {p.icon}
              {p.name}
            </a>
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground">Note: analytics for shares syncs to the backend once the projects API ships.</p>
      </div>
    </Modal>
  );
}
