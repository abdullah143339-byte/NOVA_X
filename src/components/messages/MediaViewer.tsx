"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ZoomIn, ZoomOut, Download } from "lucide-react";
import type { ChatMessage } from "./types";

interface MediaViewerProps {
  message: ChatMessage | null;
  onClose: () => void;
}

export default function MediaViewer({ message, onClose }: MediaViewerProps) {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const id = requestAnimationFrame(() => setScale(1));
    return () => cancelAnimationFrame(id);
  }, [message?.id]);

  useEffect(() => {
    if (!message) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [message, onClose]);

  if (!message) return null;
  const media = message.media?.[0];
  const isVideo = message.type === "VIDEO" || /\.(mp4|webm|mov|m4v)$/i.test(media?.url || "");
  const url = media?.url || "";
  const name = media?.name || url.split("/").pop() || "media";

  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] bg-black/90 backdrop-blur flex flex-col"
          role="dialog"
          aria-label="Media viewer"
          onClick={onClose}
        >
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setScale((s) => Math.max(0.5, s - 0.25))}
                aria-label="Zoom out"
                className="w-10 h-10 rounded-full bg-white/10 backdrop-blur flex items-center justify-center text-white hover:bg-white/20 transition-colors"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                onClick={() => setScale((s) => Math.min(3, s + 0.25))}
                aria-label="Zoom in"
                className="w-10 h-10 rounded-full bg-white/10 backdrop-blur flex items-center justify-center text-white hover:bg-white/20 transition-colors"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={() => setScale(1)}
                aria-label="Reset zoom"
                className="h-10 px-4 rounded-full bg-white/10 backdrop-blur text-xs text-white hover:bg-white/20 transition-colors"
              >
                {Math.round(scale * 100)}%
              </button>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={url}
                download={name}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Download"
                className="w-10 h-10 rounded-full bg-white/10 backdrop-blur flex items-center justify-center text-white hover:bg-white/20 transition-colors"
              >
                <Download className="w-4 h-4" />
              </a>
              <button
                onClick={onClose}
                aria-label="Close viewer"
                className="w-10 h-10 rounded-full bg-white/10 backdrop-blur flex items-center justify-center text-white hover:bg-white/20 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div
            className="flex-1 flex items-center justify-center overflow-auto no-scrollbar p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <motion.div
              animate={{ scale }}
              transition={{ type: "spring", damping: 24, stiffness: 260 }}
              className="max-w-full max-h-full"
            >
              {isVideo ? (
                <video src={url} controls autoPlay className="max-h-[80vh] max-w-full rounded-xl" />
              ) : (
                <img src={url} alt="" className="max-h-[80vh] max-w-full rounded-xl object-contain" />
              )}
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
