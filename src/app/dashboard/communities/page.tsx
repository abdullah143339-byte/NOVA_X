"use client";

import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import { Users, Loader2, UserPlus, UserCheck, Search } from "lucide-react";

interface Community {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  icon?: string | null;
  image?: string | null;
  membersCount?: number;
  isMember?: boolean;
  category?: string | null;
}

export default function CommunitiesPage() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState<Set<string>>(new Set());

  const load = useCallback(() => {
    setLoading(true);
    api
      .getCommunities(1)
      .then((res) => {
        const raw = res.data;
        const list = Array.isArray(raw) ? raw : Array.isArray(raw?.communities) ? raw.communities : Array.isArray(raw?.items) ? raw.items : [];
        setCommunities(list);
      })
      .catch(() => setCommunities([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggleJoin = async (c: Community) => {
    setBusy((prev) => new Set(prev).add(c.id));
    try {
      if (c.isMember) {
        await api.leaveCommunity(c.id);
        setCommunities((prev) => prev.map((x) => x.id === c.id ? { ...x, isMember: false, membersCount: Math.max(0, (x.membersCount ?? 1) - 1) } : x));
      } else {
        await api.joinCommunity(c.id);
        setCommunities((prev) => prev.map((x) => x.id === c.id ? { ...x, isMember: true, membersCount: (x.membersCount ?? 0) + 1 } : x));
      }
    } catch {}
    finally { setBusy((prev) => { const s = new Set(prev); s.delete(c.id); return s; }); }
  };

  const q = query.trim().toLowerCase();
  const filtered = q
    ? communities.filter((c) => c.name.toLowerCase().includes(q) || (c.description ?? "").toLowerCase().includes(q) || (c.category ?? "").toLowerCase().includes(q))
    : communities;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Communities</h1>
          <p className="text-sm text-muted-foreground mt-1">Discover and join communities around topics you love</p>
        </div>
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search communities..."
            className="w-full h-10 pl-9 pr-4 rounded-xl bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
      </div>

      {loading ? (
        <div className="glass rounded-2xl p-8 flex flex-col items-center justify-center gap-3 text-muted-foreground">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
          <p className="text-sm">Loading communities...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass rounded-2xl p-10 flex flex-col items-center justify-center gap-3 text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-primary flex items-center justify-center text-white">
            <Users className="w-7 h-7" />
          </div>
          <p className="font-semibold text-foreground">{q ? "No communities found" : "No communities yet"}</p>
          <p className="text-sm text-muted-foreground">
            {q ? "Try a different search term" : "Be the first to start a community"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((c) => (
            <div key={c.id} className="glass rounded-2xl p-5 shadow-premium flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center text-white text-base font-bold overflow-hidden shrink-0">
                  {c.icon || c.image ? <img src={c.icon || c.image || ""} alt="" className="w-full h-full object-cover" /> : c.name[0]?.toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-foreground truncate">{c.name}</h3>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {c.membersCount ?? 0} members
                  </p>
                </div>
              </div>
              {c.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">{c.description}</p>
              )}
              <div className="mt-auto">
                <button
                  onClick={() => toggleJoin(c)}
                  disabled={busy.has(c.id)}
                  className={`w-full h-9 rounded-xl text-sm font-medium flex items-center justify-center gap-1.5 transition-all ${
                    c.isMember
                      ? "bg-muted text-foreground hover:bg-muted/70"
                      : "bg-gradient-primary text-white hover:scale-[1.02] active:scale-[0.98]"
                  } disabled:opacity-50`}
                >
                  {busy.has(c.id) ? <Loader2 className="w-4 h-4 animate-spin" /> : c.isMember ? <UserCheck className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                  {c.isMember ? "Joined" : "Join"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
