"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Users, Loader2, Crown, Shield } from "lucide-react";
import { formatCount } from "./data";
import { cn } from "@/lib/utils";
import type { CommunityItem } from "./types";

interface CommunitiesTabProps {
  joined: CommunityItem[];
  owned: CommunityItem[];
  loading: boolean;
}

function avatarEmoji(category?: string): string {
  switch (category) {
    case "AI": case "Innovation": return "🤖";
    case "Development": case "Coding": return "💻";
    case "Design": return "🎨";
    case "Business": return "🚀";
    case "Creators": return "✨";
    default: return "👥";
  }
}

export default function CommunitiesTab({ joined, owned, loading }: CommunitiesTabProps) {
  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>;
  }

  const sections = [
    { title: "Owned", items: owned, icon: <Crown className="w-3.5 h-3.5 text-amber-400" />, empty: "You haven't created any communities yet" },
    { title: "Joined", items: joined, icon: <Shield className="w-3.5 h-3.5 text-primary" />, empty: "Join communities to grow your network" },
  ];

  const totalItems = owned.length + joined.length;
  if (totalItems === 0) {
    return <div className="text-center py-14 glass rounded-2xl">
      <div className="w-16 h-16 rounded-2xl bg-gradient-primary/10 flex items-center justify-center mx-auto mb-4 text-3xl">👥</div>
      <p className="text-foreground font-semibold">No communities yet</p>
      <p className="text-sm text-muted-foreground mt-1">Join or create communities to connect with like-minded creators</p>
    </div>;
  }

  return (
    <div className="space-y-6">
      {sections.map((section) => (
        <div key={section.title}>
          <h3 className="flex items-center gap-1.5 text-xs font-semibold text-foreground mb-3 uppercase tracking-wide">{section.icon} {section.title}</h3>
          {section.items.length === 0 ? (
            <p className="text-xs text-muted-foreground py-4 text-center glass rounded-xl">{section.empty}</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {section.items.map((community, i) => (
                <motion.div key={community.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                  <Link href={`/dashboard/communities/${community.slug || community.id}`} className="block glass rounded-xl p-4 hover-glow group">
                    <div className="flex items-start gap-3">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-xl shrink-0">
                        {avatarEmoji(community.category)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">{community.name || community.title}</h4>
                          {community.role && (
                            <span className={cn("text-[9px] font-semibold px-1.5 py-0.5 rounded-full shrink-0", community.role === "OWNER" ? "bg-amber-500/10 text-amber-400" : "bg-primary/10 text-primary")}>
                              {community.role}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{community.description || "Community"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {formatCount(community.memberCount ?? community._count?.members ?? 0)} members</span>
                      {community.category && <span className="ml-auto px-2 py-0.5 rounded-full bg-muted text-[10px]">{community.category}</span>}
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
