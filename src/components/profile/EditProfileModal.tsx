"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, Save } from "lucide-react";
import api from "@/lib/api";
import type { ProfilePayload } from "./types";

interface EditProfileModalProps {
  open: boolean;
  onClose: () => void;
  profile: ProfilePayload;
  notify: (msg: string, type?: "success" | "error" | "info") => void;
  onSaved: (updates: { firstName?: string; lastName?: string; displayName?: string; bio?: string; location?: string; website?: string }) => void;
}

export default function EditProfileModal({ open, onClose, profile, notify, onSaved }: EditProfileModalProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [displayName, setDisplayName] = useState(profile.displayName || "");
  const [bio, setBio] = useState(profile.bio || "");
  const [location, setLocation] = useState(profile.location || "");
  const [website, setWebsite] = useState(profile.website || "");
  const [saving, setSaving] = useState(false);

  const hasChanges = () =>
    (firstName !== "" || lastName !== "" || displayName !== profile.displayName || bio !== profile.bio || location !== profile.location || website !== profile.website);

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const payload: Record<string, string> = {};
      if (firstName) payload.firstName = firstName;
      if (lastName) payload.lastName = lastName;
      if (displayName !== profile.displayName) payload.displayName = displayName;
      if (bio !== profile.bio) payload.bio = bio;
      if (location !== profile.location) payload.location = location;
      if (website !== profile.website) payload.website = website;
      if (Object.keys(payload).length > 0) {
        await api.updateProfile(payload);
      }
      onSaved({ firstName, lastName, displayName, bio, location, website });
      notify("Profile updated");
      onClose();
    } catch {
      notify("Failed to save changes", "error");
    } finally {
      setSaving(false);
    }
  };

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
            className="glass-strong rounded-2xl w-full max-w-md max-h-[84vh] overflow-y-auto no-scrollbar"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-surface/80 backdrop-blur">
              <h3 className="text-sm font-bold text-foreground">Edit Profile</h3>
              <button onClick={onClose} aria-label="Close edit profile" className="p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="edit-first" className="text-[11px] font-medium text-muted-foreground">First name</label>
                  <input id="edit-first" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First name" className="mt-1 w-full h-10 rounded-xl bg-muted border border-border px-3 text-xs text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/50" />
                </div>
                <div>
                  <label htmlFor="edit-last" className="text-[11px] font-medium text-muted-foreground">Last name</label>
                  <input id="edit-last" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last name" className="mt-1 w-full h-10 rounded-xl bg-muted border border-border px-3 text-xs text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/50" />
                </div>
              </div>

              <div>
                <label htmlFor="edit-display" className="text-[11px] font-medium text-muted-foreground">Display name</label>
                <input id="edit-display" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="How others see you" className="mt-1 w-full h-10 rounded-xl bg-muted border border-border px-3 text-xs text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/50" />
              </div>

              <div>
                <label htmlFor="edit-bio" className="text-[11px] font-medium text-muted-foreground">Bio</label>
                <textarea id="edit-bio" value={bio} onChange={(e) => setBio(e.target.value)} rows={3} placeholder="Tell people what you create" className="mt-1 w-full rounded-xl bg-muted border border-border px-3 py-2.5 text-xs text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/50 resize-none" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="edit-location" className="text-[11px] font-medium text-muted-foreground">Location</label>
                  <input id="edit-location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="City, Country" className="mt-1 w-full h-10 rounded-xl bg-muted border border-border px-3 text-xs text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/50" />
                </div>
                <div>
                  <label htmlFor="edit-website" className="text-[11px] font-medium text-muted-foreground">Website</label>
                  <input id="edit-website" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://..." className="mt-1 w-full h-10 rounded-xl bg-muted border border-border px-3 text-xs text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/50" />
                </div>
              </div>

              {/* TODO(backend): headline, about, social links and education/experience are exposed on
                  GET /users/:username → profile but not writable via PATCH /users/me yet. Wire them when added. */}

              <button onClick={handleSave} disabled={!hasChanges() || saving} aria-label="Save profile changes" className="w-full h-10 rounded-xl bg-gradient-primary text-white text-sm font-medium hover:shadow-lg hover:shadow-primary/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Changes
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
