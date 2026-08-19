"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/lib/api";
import RecommendedPeople from "./RecommendedPeople";
import TrendingList from "./TrendingList";
import CommunitySuggestions from "./CommunitySuggestions";
import AIWidget from "./AIWidget";
import { Search, Loader2 } from "lucide-react";

interface Suggestion {
  id: string;
  username: string;
  displayName?: string | null;
  avatar?: string | null;
  headline?: string | null;
}

export default function RightSidebar() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Suggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const [open, setOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const q = query.trim();
    const t = setTimeout(async () => {
      if (!q) { setResults([]); setOpen(false); setSearching(false); return; }
      setSearching(true);
      try {
        const res = await api.globalSearch(q, "users");
        const raw = res.data;
        const list = Array.isArray(raw) ? raw : Array.isArray(raw?.users) ? raw.users : [];
        setResults(list.slice(0, 5));
        setOpen(true);
      } catch { setResults([]); }
      finally { setSearching(false); }
    }, q ? 250 : 0);
    return () => clearTimeout(t);
  }, [query]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    router.push(`/dashboard/search?q=${encodeURIComponent(query.trim())}`);
    setOpen(false);
  };

  return (
    <div className="space-y-4" aria-label="Right sidebar">
      <div ref={searchRef} className="relative">
        <form onSubmit={submit}>
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => results.length > 0 && setOpen(true)}
            placeholder="Search ZARYA..."
            aria-label="Search ZARYA"
            className="w-full h-11 rounded-xl bg-surface/80 border border-border pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all shadow-premium"
          />
          {searching && <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin" />}
        </form>

        <AnimatePresence>
          {open && results.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              className="absolute z-30 mt-2 w-full glass-strong rounded-2xl shadow-elevated overflow-hidden"
            >
              {results.map((u) => (
                <button
                  key={u.id}
                  onClick={() => { router.push(`/dashboard/profile?u=${u.username}`); setOpen(false); setQuery(""); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted/70 transition-all text-left"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center text-white text-[10px] font-bold overflow-hidden shrink-0">
                    {u.avatar ? <img src={u.avatar} alt="" className="w-full h-full object-cover" /> : (u.displayName?.[0] || u.username[0] || "U").toUpperCase()}
                  </div>
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-foreground truncate">{u.displayName || u.username}</span>
                    <span className="block text-[11px] text-muted-foreground truncate">@{u.username}{u.headline ? ` · ${u.headline}` : ""}</span>
                  </span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <RecommendedPeople />
      <TrendingList />
      <CommunitySuggestions />
      <AIWidget />
    </div>
  );
}
