"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Lock, Globe, Grid2X2, Rows3 } from "lucide-react";
import { useProfile } from "./ProfileProvider";
import { getProfileThemes } from "./data";
import { cn } from "@/lib/utils";

interface CustomizeModalProps {
  open: boolean;
  onClose: () => void;
}

const FOLLOW_CATEGORIES = ["AI", "Design", "Startups", "Coding", "Photography", "Music", "Gaming", "Writing"];

const SOCIAL_LINKS = [
  { id: "github", label: "GitHub", placeholder: "https://github.com/username" },
  { id: "linkedin", label: "LinkedIn", placeholder: "https://linkedin.com/in/username" },
  { id: "twitter", label: "X / Twitter", placeholder: "https://x.com/username" },
  { id: "youtube", label: "YouTube", placeholder: "https://youtube.com/@username" },
];

export default function CustomizeModal({ open, onClose }: CustomizeModalProps) {
  const { prefs, setPrefs, notify } = useProfile();
  const themes = getProfileThemes();
  const [social, setSocial] = useState<Record<string, string>>({});

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            className="glass-strong rounded-2xl w-full max-w-lg max-h-[82vh] overflow-y-auto no-scrollbar"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-surface/80 backdrop-blur">
              <h3 className="text-sm font-bold text-foreground">Customize Profile</h3>
              <button onClick={onClose} aria-label="Close customization" className="p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <p className="text-xs font-semibold text-foreground mb-3">Profile Theme & Accent</p>
                <div className="grid grid-cols-3 gap-2">
                  {themes.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => { setPrefs({ theme: t.id, accentColor: t.accent }); notify(`${t.name} theme applied`); }}
                      className={cn(
                        "rounded-xl p-2 border transition-all text-left",
                        prefs.theme === t.id ? "border-primary ring-1 ring-primary/40" : "border-border hover:border-muted-foreground/40"
                      )}
                    >
                      <div className={cn("h-8 rounded-lg bg-gradient-to-r mb-2", t.gradient)} />
                      <span className="text-[11px] font-medium text-foreground flex items-center gap-1">
                        {t.name}
                        {prefs.theme === t.id && <Check className="w-3 h-3 text-primary" />}
                      </span>
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <label htmlFor="custom-accent" className="text-[11px] text-muted-foreground">Custom accent:</label>
                  <input id="custom-accent" type="color" value={prefs.accentColor} onChange={(e) => setPrefs({ accentColor: e.target.value })} className="w-8 h-8 rounded-lg border border-border bg-transparent cursor-pointer" />
                  <span className="text-[11px] text-muted-foreground font-mono">{prefs.accentColor}</span>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-foreground mb-3">Content Layout</p>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => setPrefs({ layout: "grid" })} className={cn("flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-medium transition-all", prefs.layout === "grid" ? "border-primary bg-primary/5 text-foreground" : "border-border text-muted-foreground")}>
                    <Grid2X2 className="w-4 h-4" /> Grid View
                  </button>
                  <button onClick={() => setPrefs({ layout: "list" })} className={cn("flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-medium transition-all", prefs.layout === "list" ? "border-primary bg-primary/5 text-foreground" : "border-border text-muted-foreground")}>
                    <Rows3 className="w-4 h-4" /> List View
                  </button>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-foreground mb-3">Profile Privacy</p>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => { setPrefs({ privacy: "public" }); notify("Profile is now public"); }} className={cn("flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-medium transition-all", prefs.privacy === "public" ? "border-primary bg-primary/5 text-foreground" : "border-border text-muted-foreground")}>
                    <Globe className="w-4 h-4" /> Public
                  </button>
                  <button onClick={() => { setPrefs({ privacy: "private" }); notify("Profile is now private"); }} className={cn("flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-medium transition-all", prefs.privacy === "private" ? "border-primary bg-primary/5 text-foreground" : "border-border text-muted-foreground")}>
                    <Lock className="w-4 h-4" /> Private
                  </button>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-foreground mb-3">Pinned Social Links</p>
                <div className="grid grid-cols-2 gap-2">
                  {SOCIAL_LINKS.map((s) => {
                    const pinned = prefs.pinnedLinks.includes(s.id);
                    return (
                      <button
                        key={s.id}
                        onClick={() => {
                          const next = pinned ? prefs.pinnedLinks.filter((x) => x !== s.id) : [...prefs.pinnedLinks, s.id];
                          setPrefs({ pinnedLinks: next });
                        }}
                        className={cn("flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-medium transition-all", pinned ? "border-primary bg-primary/5 text-foreground" : "border-border text-muted-foreground")}
                      >
                        {pinned ? <Check className="w-3.5 h-3.5 text-primary" /> : <span className="w-3.5 h-3.5" />} {s.label}
                      </button>
                    );
                  })}
                </div>
                <div className="mt-3 space-y-2">
                  {SOCIAL_LINKS.map((s) => (
                    <input
                      key={s.id}
                      value={social[s.id] ?? ""}
                      onChange={(e) => setSocial((prev) => ({ ...prev, [s.id]: e.target.value }))}
                      placeholder={s.placeholder}
                      className="w-full h-9 rounded-xl bg-muted border border-border px-3 text-xs text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/50"
                    />
                  ))}
                  {/* TODO(backend): persist social URLs via PATCH /users/me when profile social fields are exposed. */}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-foreground mb-3">Follow Categories & Interests</p>
                <div className="flex flex-wrap gap-1.5">
                  {FOLLOW_CATEGORIES.map((c) => {
                    const selected = prefs.followCategories.includes(c);
                    return (
                      <button
                        key={c}
                        onClick={() => {
                          const next = selected ? prefs.followCategories.filter((x) => x !== c) : [...prefs.followCategories, c];
                          setPrefs({ followCategories: next });
                        }}
                        className={cn("px-3 py-1.5 rounded-full text-[11px] font-medium border transition-all", selected ? "bg-primary/10 text-primary border-primary/30" : "border-border text-muted-foreground hover:text-foreground")}
                      >
                        {selected && <Check className="w-3 h-3 inline mr-1" />} {c}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
