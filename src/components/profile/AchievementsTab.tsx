"use client";

import { motion } from "framer-motion";
import { Trophy, Lock } from "lucide-react";
import ScoreRing from "./ScoreRing";
import { cn } from "@/lib/utils";
import type { AchievementDef, ReputationData } from "./types";

interface AchievementsTabProps {
  achievements: AchievementDef[];
  reputation?: ReputationData;
  tier: string;
  tierColor: string;
}

const RANKINGS = [
  { label: "Overall", value: "Top 12%" },
  { label: "Creator", value: "Top 8%" },
  { label: "Engagement", value: "Top 20%" },
  { label: "Marketplace", value: "Top 15%" },
];

export default function AchievementsTab({ achievements, reputation, tier, tierColor }: AchievementsTabProps) {
  const locked = achievements.filter((a) => !a.earned);

  const scoreMeta: { label: string; value: number; color: string }[] = [
    { label: "Contribution", value: reputation?.contributionScore ?? 0, color: "#6C63FF" },
    { label: "Helpful", value: reputation?.expertiseScore ?? 0, color: "#34D399" },
    { label: "Creator", value: reputation?.activityScore ?? 0, color: "#38BDF8" },
    { label: "Learning", value: reputation?.trustScore ?? 0, color: "#FB923C" },
  ];

  return (
    <div className="space-y-6">
      <div className="glass rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-bold text-foreground">Creator Profile</h3>
          <span className="ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: `${tierColor}1A`, color: tierColor }}>
            {tier} · Level {reputation?.level ?? 1}
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {scoreMeta.map((s) => (
            <div key={s.label} className="flex items-center justify-center rounded-xl bg-muted/40 p-3">
              <ScoreRing value={s.value} size={72} stroke={6} color={s.color} label={s.label} />
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-xs font-semibold text-foreground mb-3 uppercase tracking-wide">🏆 Badges & Milestones</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {achievements.map((a, i) => (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.04 }}
              className={cn("glass rounded-xl p-4 text-center", !a.earned && "opacity-50 grayscale")}
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-primary/10 flex items-center justify-center mx-auto mb-2 text-2xl">
                {a.earned ? a.emoji : <Lock className="w-5 h-5 text-muted-foreground" />}
              </div>
              <p className="text-xs font-semibold text-foreground">{a.title}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{a.description}</p>
              {a.date && <p className="text-[9px] text-muted-foreground/70 mt-1">{a.date}</p>}
            </motion.div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-xs font-semibold text-foreground mb-3 uppercase tracking-wide">📊 Top Rankings</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {RANKINGS.map((r, i) => (
            <motion.div key={r.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass rounded-xl p-4 text-center">
              <p className="text-lg font-bold text-gradient">{r.value}</p>
              <p className="text-[11px] text-muted-foreground mt-1">{r.label}</p>
            </motion.div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-xs font-semibold text-foreground mb-3 uppercase tracking-wide">🔒 Locked Achievements ({locked.length})</h3>
        <div className="flex flex-wrap gap-2">
          {locked.map((a) => (
            <span key={a.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/40 text-[11px] text-muted-foreground">
              <Lock className="w-3 h-3" /> {a.title}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
