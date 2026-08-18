"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Users, UserPlus, X, Loader2, Check, CheckCheck } from "lucide-react";
import api from "@/lib/api";
import { cn } from "@/lib/utils";

interface SearchResult {
  id: string;
  username: string;
  displayName?: string | null;
  avatar?: string | null;
  bio?: string | null;
}

interface NewChatModalProps {
  open: boolean;
  onClose: () => void;
  currentUserId: string | null;
  onCreated: (conversationId: string) => void;
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function NewChatModal({ open, onClose, currentUserId, onCreated }: NewChatModalProps) {
  const [mode, setMode] = useState<"direct" | "group">("direct");
  const [query, setQuery] = useState("");
  const [groupName, setGroupName] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback((q: string) => {
    setLoading(true);
    setError("");
    const fetchUsers = (): Promise<SearchResult[]> => {
      if (q.trim()) {
        return api.searchUsers(q).then((r) => {
          const data = r.data as { users?: SearchResult[] };
          return Array.isArray(data?.users) ? data.users : [];
        });
      }
      return api.getRecommendedPeople(10).then((r) =>
        Array.isArray(r.data) ? (r.data as SearchResult[]) : []
      );
    };
    fetchUsers()
      .then((users) => setResults(users.filter((u) => u.id !== currentUserId)))
      .catch(() => setError("Search failed. Try again."))
      .finally(() => setLoading(false));
  }, [currentUserId]);

  useEffect(() => {
    if (!open) return;
    const id = requestAnimationFrame(() => {
      setQuery("");
      setGroupName("");
      setSelected(new Set());
      setMode("direct");
      load("");
    });
    return () => cancelAnimationFrame(id);
  }, [open, load]);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => load(query), 300);
    return () => window.clearTimeout(t);
  }, [query, open, load]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectedUsers = results.filter((r) => selected.has(r.id));

  const handleCreate = async () => {
    if (mode === "direct") {
      const id = [...selected][0];
      if (!id) return;
      setCreating(true);
      setError("");
      try {
        const res = await api.createConversation({ participantId: id });
        onCreated(res.data?.id || "");
      } catch {
        setError("Could not create conversation.");
      } finally {
        setCreating(false);
      }
    } else {
      if (selected.size === 0 || !groupName.trim()) {
        setError("Add members and a group name.");
        return;
      }
      setCreating(true);
      setError("");
      try {
        const res = await api.createConversation({
          participantIds: [...selected],
          type: "GROUP",
          name: groupName.trim(),
        });
        onCreated(res.data?.id || "");
      } catch {
        setError("Could not create group.");
      } finally {
        setCreating(false);
      }
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-label="New chat"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: "spring", damping: 26, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full sm:max-w-md max-h-[88dvh] flex flex-col tactile-raised rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-premium"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div className="flex items-center gap-2 rounded-full tactile-inset p-1">
                <button
                  onClick={() => { setMode("direct"); setSelected(new Set()); }}
                  className={cn("h-8 px-3.5 rounded-full text-sm font-medium transition-all flex items-center gap-1.5", mode === "direct" ? "bg-gradient-to-br from-[#6C63FF] to-[#7C3AED] text-white shadow-md shadow-[#6C63FF]/30" : "text-muted-foreground hover:text-foreground")}
                >
                  <UserPlus className="w-3.5 h-3.5" /> Direct
                </button>
                <button
                  onClick={() => { setMode("group"); setSelected(new Set()); }}
                  className={cn("h-8 px-3.5 rounded-full text-sm font-medium transition-all flex items-center gap-1.5", mode === "group" ? "bg-gradient-to-br from-[#6C63FF] to-[#7C3AED] text-white shadow-md shadow-[#6C63FF]/30" : "text-muted-foreground hover:text-foreground")}
                >
                  <Users className="w-3.5 h-3.5" /> Group
                </button>
              </div>
              <button onClick={onClose} aria-label="Close" className="w-9 h-9 rounded-full tactile-icon-btn text-muted-foreground transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto overscroll-contain flex-1 min-h-0">
              {mode === "group" && (
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Group name"
                  aria-label="Group name"
                  className="w-full h-10 rounded-2xl tactile-inset px-4 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-[#6C63FF]/40 transition-all mb-3"
                />
              )}

              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={mode === "direct" ? "Search people..." : "Search people to add..."}
                  aria-label="Search people"
                  className="w-full h-10 rounded-2xl tactile-inset pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-[#6C63FF]/40 transition-all"
                />
              </div>

              {mode === "group" && selectedUsers.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {selectedUsers.map((u) => (
                    <span key={u.id} className="inline-flex items-center gap-1 h-7 px-2.5 rounded-full tactile-inset text-primary text-xs font-medium">
                      {u.displayName || u.username}
                      <button onClick={() => toggle(u.id)} aria-label={`Remove ${u.username}`} className="text-muted-foreground hover:text-foreground">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <div className="max-h-64 overflow-y-auto no-scrollbar -mx-1 px-1 space-y-1">
                {loading && (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-5 h-5 text-primary animate-spin" />
                  </div>
                )}
                {error && <p className="text-xs text-red-500 text-center py-6">{error}</p>}
                {!loading && !error && results.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-6">No people found</p>
                )}
                {!loading && results.map((u) => {
                  const checked = selected.has(u.id);
                  return (
                    <button
                      key={u.id}
                      onClick={() => toggle(u.id)}
                      className={cn(
                        "w-full flex items-center gap-3 px-2 py-2 rounded-2xl text-left transition-all",
                        checked ? "tactile-inset ring-1 ring-[#6C63FF]/40" : "hover:bg-muted/50"
                      )}
                    >
                      <div className="w-9 h-9 rounded-[0.8rem] bg-gradient-primary flex items-center justify-center text-white text-xs font-bold shrink-0 overflow-hidden shadow-md">
                        {u.avatar ? <img src={u.avatar} alt="" className="w-full h-full object-cover" /> : initials(u.displayName || u.username)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{u.displayName || u.username}</p>
                        <p className="text-xs text-muted-foreground truncate">@{u.username}</p>
                      </div>
                      <span className={cn("w-5 h-5 rounded-full flex items-center justify-center transition-all", checked ? "bg-gradient-to-br from-[#6C63FF] to-[#7C3AED] text-white shadow-md shadow-[#6C63FF]/30" : "tactile-inset")}>
                        {checked && <Check className="w-3 h-3" />}
                      </span>
                    </button>
                  );
                })}
              </div>

              <button
                onClick={handleCreate}
                disabled={creating || (mode === "direct" ? selected.size !== 1 : selected.size === 0 || !groupName.trim())}
                className="w-full mt-4 h-11 rounded-full bg-gradient-to-br from-[#6C63FF] to-[#7C3AED] text-white text-sm font-medium shadow-lg shadow-[#6C63FF]/25 hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {creating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Creating...
                  </>
                ) : mode === "direct" ? (
                  selected.size === 1 ? "Start Chat" : "Select a person"
                ) : (
                  <>
                    <CheckCheck className="w-4 h-4" /> Create Group
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
