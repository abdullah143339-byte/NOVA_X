"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Smile,
  Paperclip,
  Image as ImageIcon,
  Mic,
  Sparkles,
  Send,
  X,
  Loader2,
} from "lucide-react";
import type { ChatMessage } from "./types";
import EmojiPicker from "./EmojiPicker";
import VoiceRecorder from "./VoiceRecorder";
import { cn } from "@/lib/utils";

interface MessageInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: (content: string) => void;
  onAttachImage: (file: File) => void;
  onAttachFile: (file: File) => void;
  onVoiceRecorded: (blob: Blob, duration: number) => void;
  onToggleAi: () => void;
  aiOpen: boolean;
  onTypingChange: (isTyping: boolean) => void;
  replyTo: ChatMessage | null;
  onCancelReply: () => void;
  sending: boolean;
  disabled?: boolean;
}

export default function MessageInput({
  value,
  onChange,
  onSend,
  onAttachImage,
  onAttachFile,
  onVoiceRecorded,
  onToggleAi,
  aiOpen,
  onTypingChange,
  replyTo,
  onCancelReply,
  sending,
  disabled,
}: MessageInputProps) {
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [attachOpen, setAttachOpen] = useState(false);
  const [recording, setRecording] = useState(false);
  const [dragging, setDragging] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimerRef = useRef<number>(0);

  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  }, []);

  useEffect(() => {
    autoResize();
  }, [value, autoResize]);

  const notifyTyping = useCallback(
    (isTyping: boolean) => {
      window.clearTimeout(typingTimerRef.current);
      onTypingChange(isTyping);
      if (isTyping) {
        typingTimerRef.current = window.setTimeout(() => onTypingChange(false), 2200);
      }
    },
    [onTypingChange]
  );

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
    notifyTyping(true);
  };

  const handleSend = () => {
    const content = value.trim();
    if (!content || sending || disabled) return;
    onSend(content);
    onChange("");
    notifyTyping(false);
    window.clearTimeout(typingTimerRef.current);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
    if (e.key === "Escape") {
      setEmojiOpen(false);
      setAttachOpen(false);
    }
  };

  const onPaste = (e: React.ClipboardEvent) => {
    const items = Array.from(e.clipboardData.items);
    const imageItem = items.find((i) => i.type.startsWith("image/"));
    if (imageItem) {
      const file = imageItem.getAsFile();
      if (file) {
        e.preventDefault();
        onAttachImage(file);
      }
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const files = Array.from(e.dataTransfer.files);
    files.forEach((f) => {
      if (f.type.startsWith("image/")) onAttachImage(f);
      else onAttachFile(f);
    });
  };

  const pickEmoji = (emoji: string) => {
    onChange(value + emoji);
    setEmojiOpen(false);
    requestAnimationFrame(() => {
      autoResize();
      textareaRef.current?.focus();
    });
  };

  const replySender = replyTo ? replyTo.content || "Attachment" : "";

  return (
    <div className="border-t border-border tactile-raised rounded-none shrink-0">
      <AnimatePresence>
        {dragging && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-20 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-xl border-2 border-dashed border-primary m-2 pointer-events-none"
          >
            <p className="text-sm font-medium text-primary">Drop files to send</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className="relative"
      >
        {replyTo && (
          <div className="flex items-center gap-2 px-4 pt-3">
            <div className="flex-1 flex items-center gap-2 rounded-2xl tactile-inset px-3 py-2 min-w-0">
              <span className="text-accent text-xs font-medium shrink-0">Replying to</span>
              <span className="text-xs text-foreground truncate">{replySender}</span>
            </div>
            <button onClick={onCancelReply} aria-label="Cancel reply" className="w-9 h-9 rounded-full tactile-icon-btn text-muted-foreground shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <AnimatePresence>
          {recording && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="px-3 pt-3"
            >
              <VoiceRecorder
                onRecorded={(blob, duration) => {
                  onVoiceRecorded(blob, duration);
                  setRecording(false);
                }}
                onCancel={() => setRecording(false)}
                sending={sending}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-end gap-1.5 p-3">
          <div className="relative">
            <button
              onClick={() => { setEmojiOpen((v) => !v); setAttachOpen(false); }}
              aria-label="Emoji"
              aria-expanded={emojiOpen}
              className={cn("tactile-icon-btn", emojiOpen ? "text-primary" : "text-muted-foreground")}
            >
              <Smile className="w-5 h-5" />
            </button>
            <AnimatePresence>
              {emojiOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.94, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.94, y: 8 }}
                  className="absolute bottom-12 left-0 z-30 tactile-raised rounded-2xl shadow-premium"
                >
                  <EmojiPicker onPick={pickEmoji} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="relative">
            <button
              onClick={() => { setAttachOpen((v) => !v); setEmojiOpen(false); }}
              aria-label="Attach"
              aria-expanded={attachOpen}
              className={cn("tactile-icon-btn", attachOpen ? "text-primary" : "text-muted-foreground")}
            >
              <Paperclip className="w-5 h-5" />
            </button>
            <AnimatePresence>
              {attachOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.94, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.94, y: 8 }}
                  className="absolute bottom-12 left-0 z-30 tactile-raised rounded-2xl shadow-premium p-1.5"
                >
                  <button
                    onClick={() => { imageInputRef.current?.click(); setAttachOpen(false); }}
                    className="w-full flex items-center gap-2 px-3 h-9 rounded-xl hover:bg-muted text-sm text-foreground transition-colors"
                  >
                    <ImageIcon className="w-4 h-4 text-accent" /> Photo / Video
                  </button>
                  <button
                    onClick={() => { fileInputRef.current?.click(); setAttachOpen(false); }}
                    className="w-full flex items-center gap-2 px-3 h-9 rounded-xl hover:bg-muted text-sm text-foreground transition-colors"
                  >
                    <Paperclip className="w-4 h-4 text-primary" /> File
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            onClick={() => setRecording((v) => !v)}
            aria-label="Voice note"
            className={cn("tactile-icon-btn", recording ? "text-red-500" : "text-muted-foreground")}
          >
            <Mic className="w-5 h-5" />
          </button>

          <button
            onClick={onToggleAi}
            aria-label="AI tools"
            aria-expanded={aiOpen}
            className={cn("tactile-icon-btn", aiOpen ? "text-accent ai-glow" : "text-muted-foreground")}
          >
            <Sparkles className="w-5 h-5" />
          </button>

          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={value}
              onChange={handleChange}
              onKeyDown={onKeyDown}
              onPaste={onPaste}
              rows={1}
              placeholder="Type a message..."
              aria-label="Message"
              className="w-full max-h-40 rounded-2xl tactile-inset px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 resize-none focus:outline-none focus:ring-2 focus:ring-[#6C63FF]/40 transition-all"
            />
          </div>

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleSend}
            disabled={!value.trim() || sending || disabled}
            aria-label="Send"
            className="w-11 h-11 rounded-full bg-gradient-to-br from-[#6C63FF] to-[#7C3AED] text-white flex items-center justify-center shadow-lg shadow-[#6C63FF]/30 hover:brightness-110 transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </motion.button>
        </div>

        <input
          ref={imageInputRef}
          type="file"
          accept="image/*,video/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onAttachImage(f);
            e.target.value = "";
          }}
        />
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onAttachFile(f);
            e.target.value = "";
          }}
        />
      </div>
    </div>
  );
}
