"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X } from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";

interface Story {
  id: string;
  authorId: string;
  username: string;
  displayName: string;
  avatar?: string | null;
  mediaUrl: string;
  createdAt: string;
  online?: boolean;
}

// TODO: Connect to backend when a GET /stories endpoint is available.
// The strip renders the "Add Story" tile as an empty state until then.
export default function StoryStrip() {
  const { user } = useAuth();
  const [stories, setStories] = useState<Story[]>([]);
  const [viewing, setViewing] = useState<Story | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddStory = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    const url = URL.createObjectURL(file);
    setStories((prev) => [
      {
        id: `local-${Date.now()}`,
        authorId: user.id,
        username: user.username,
        displayName: user.displayName || user.username,
        avatar: user.avatar || null,
        mediaUrl: url,
        createdAt: new Date().toISOString(),
        online: true,
      },
      ...prev,
    ]);
    e.target.value = "";
  };

  const initial = user ? [user.firstName?.[0], user.lastName?.[0]].filter(Boolean).join("") || user.username[0]?.toUpperCase() || "U" : "U";

  return (
    <section aria-label="Stories" className="glass rounded-2xl p-4">
      <div className="flex gap-3 overflow-x-auto no-scrollbar">
        <button
          onClick={() => fileInputRef.current?.click()}
          aria-label="Add story"
          className="group flex flex-col items-center gap-1.5 shrink-0 w-[68px]"
        >
          <span className="relative w-14 h-14 rounded-full bg-muted flex items-center justify-center text-sm font-bold text-foreground border-2 border-dashed border-border transition-all group-hover:border-primary group-hover:scale-105">
            {user?.avatar ? (
              <img src={user.avatar} alt="" className="w-full h-full rounded-full object-cover" />
            ) : (
              initial
            )}
            <motion.span
              className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-gradient-primary flex items-center justify-center text-white shadow-premium"
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
            >
              <Plus className="w-3 h-3" />
            </motion.span>
          </span>
          <span className="text-[11px] text-muted-foreground">Add Story</span>
        </button>
        <input ref={fileInputRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleAddStory} />

        <AnimatePresence>
          {stories.map((story) => (
            <motion.button
              key={story.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={() => setViewing(story)}
              className="flex flex-col items-center gap-1.5 shrink-0 w-[68px] group"
              aria-label={`View story by ${story.displayName}`}
            >
              <span className="relative p-[2.5px] rounded-full bg-gradient-to-tr from-primary via-accent to-pink-500 transition-transform group-hover:scale-105">
                <span className="block w-[52px] h-[52px] rounded-full bg-surface overflow-hidden ring-2 ring-background">
                  {story.avatar ? (
                    <img src={story.avatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="w-full h-full flex items-center justify-center text-sm font-bold text-foreground">
                      {story.displayName[0]?.toUpperCase()}
                    </span>
                  )}
                </span>
                {story.online && (
                  <span className="absolute bottom-1 right-1 w-3 h-3 rounded-full bg-success ring-2 ring-background" />
                )}
              </span>
              <span className="text-[11px] text-muted-foreground truncate w-full text-center">{story.displayName}</span>
            </motion.button>
          ))}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {viewing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setViewing(null)}
          >
            <button
              className="absolute top-4 right-4 w-10 h-10 rounded-full glass flex items-center justify-center"
              onClick={() => setViewing(null)}
              aria-label="Close story"
            >
              <X className="w-5 h-5" />
            </button>
            <motion.div
              initial={{ scale: 0.92 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.92 }}
              className="max-w-lg w-full aspect-[9/16] rounded-2xl overflow-hidden relative"
              onClick={(e) => e.stopPropagation()}
            >
              {viewing.mediaUrl.match(/\.(mp4|webm|mov)$/i) ? (
                <video src={viewing.mediaUrl} autoPlay loop muted playsInline className="w-full h-full object-cover" />
              ) : (
                <img src={viewing.mediaUrl} alt="" className="w-full h-full object-cover" />
              )}
              <div className="absolute top-3 left-3 flex items-center gap-2">
                <div className="w-9 h-9 rounded-full overflow-hidden bg-surface ring-2 ring-white/20">
                  {viewing.avatar ? (
                    <img src={viewing.avatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="w-full h-full flex items-center justify-center text-xs font-bold">
                      {viewing.displayName[0]?.toUpperCase()}
                    </span>
                  )}
                </div>
                <p className="text-sm font-semibold text-white drop-shadow">{viewing.displayName}</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
