"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search, UserCheck, UserPlus, UserX, Loader2, Users } from "lucide-react";
import { useProfile } from "./ProfileProvider";
import { getFollowers } from "./data";
import { cn } from "@/lib/utils";

interface FollowersListProps {
  seed: string;
  count: number;
  mode: "followers" | "following";
  isOwner: boolean;
  loading: boolean;
}

export default function FollowersList({ seed, count, mode, isOwner, loading }: FollowersListProps) {
  const { isFollowing, toggleFollow, isRemoved, removeFollower, notify } = useProfile();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"default" | "name" | "mutual">("default");

  const base = useMemo(() => getFollowers(seed, Math.max(count, 12)), [seed, count]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    let items = base.filter((f) => {
      if (mode === "followers" && isRemoved(f.id)) return false;
      if (q && !(f.name.toLowerCase().includes(q) || f.username.toLowerCase().includes(q))) return false;
      return true;
    });
    if (sort === "name") items = [...items].sort((a, b) => a.name.localeCompare(b.name));
    if (sort === "mutual") items = [...items].sort((a, b) => Number(b.mutual) - Number(a.mutual));
    return items;
  }, [base, query, sort, mode, isRemoved]);

  if (loading) {
    return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="glass rounded-2xl p-3 flex flex-col sm:flex-row gap-2 sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${mode}...`}
            aria-label={`Search ${mode}`}
            className="w-full h-9 rounded-xl bg-muted border border-border pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/50"
          />
        </div>
        <div className="flex items-center gap-1.5">
          {(["default", "name", "mutual"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSort(s)}
              className={cn(
                "px-3 h-9 rounded-xl text-[11px] font-medium transition-all",
                sort === s ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
              )}
            >
              {s === "default" ? "Latest" : s === "name" ? "Name" : "Mutual"}
            </button>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="text-center py-16 glass rounded-2xl">
          <div className="w-16 h-16 rounded-2xl bg-gradient-primary/10 flex items-center justify-center mx-auto mb-4 text-3xl">
            <Users className="w-7 h-7 text-primary" />
          </div>
          <p className="text-foreground font-semibold">{mode === "followers" ? "No followers yet" : "Not following anyone yet"}</p>
          <p className="text-sm text-muted-foreground mt-1">{query ? "No results for your search" : "People will show up here as your network grows"}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {visible.map((f, i) => {
            const following = isFollowing(f.id);
            const removed = isRemoved(f.id);
            return (
              <motion.div
                key={f.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className={cn("glass rounded-xl p-3 flex items-center gap-3", removed && "opacity-50")}
              >
                <div className="w-11 h-11 rounded-xl bg-gradient-primary flex items-center justify-center text-white text-sm font-bold shrink-0 overflow-hidden">
                  {f.avatar ? <img src={f.avatar} alt="" className="w-full h-full object-cover" /> : f.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="text-sm font-semibold text-foreground truncate">{f.name}</p>
                    {f.role && <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary shrink-0">✓ {f.role}</span>}
                    {f.mutual && <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-sky-500/10 text-sky-400 shrink-0">Mutual</span>}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">@{f.username}</p>
                  {f.bio && <p className="text-[11px] text-muted-foreground/80 truncate mt-0.5">{f.bio}</p>}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {mode === "followers" && isOwner && (
                    <button
                      onClick={() => { removeFollower(f.id); notify(`Removed @${f.username} from followers`, "info"); }}
                      aria-label={`Remove ${f.name}`}
                      className="p-2 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-all"
                    >
                      <UserX className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => {
                      const nowFollowing = !isFollowing(f.id);
                      toggleFollow(f.id);
                      notify(nowFollowing ? `Following @${f.username}` : `Unfollowed @${f.username}`);
                    }}
                    className={cn(
                      "inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-[11px] font-medium transition-all",
                      following ? "glass border border-border text-foreground" : "bg-gradient-primary text-white hover:shadow-lg hover:shadow-primary/25"
                    )}
                  >
                    {following ? <UserCheck className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
                    {following ? "Following" : "Follow"}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
