"use client";

import { motion } from "framer-motion";
import Heatmap from "./Heatmap";
import { timeAgo } from "./data";
import type { ActivityItem } from "./types";

interface ActivityTabProps {
  activity: ActivityItem[];
  heatmap: number[][];
  accent: string;
  visible: boolean;
}

const KIND_BG: Record<ActivityItem["kind"], string> = {
  post: "bg-primary/10",
  comment: "bg-sky-500/10",
  like: "bg-red-500/10",
  share: "bg-emerald-500/10",
  market: "bg-amber-500/10",
  community: "bg-violet-500/10",
  achievement: "bg-fuchsia-500/10",
  follow: "bg-cyan-500/10",
};

export default function ActivityTab({ activity, heatmap, accent, visible }: ActivityTabProps) {
  const daysActive = heatmap.flat().filter((v) => v > 0).length;

  if (!visible) {
    return (
      <div className="text-center py-14 glass rounded-2xl">
        <div className="w-16 h-16 rounded-2xl bg-gradient-primary/10 flex items-center justify-center mx-auto mb-4 text-3xl">🔒</div>
        <p className="text-foreground font-semibold">Activity is private</p>
        <p className="text-sm text-muted-foreground mt-1">This user keeps their activity history hidden</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="glass rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-foreground">Contribution Activity</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">{daysActive} contributions in the last year</p>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            Less
            {[0, 1, 2, 3, 4].map((l) => (
              <span key={l} className="w-2.5 h-2.5 rounded-[2px]" style={{ backgroundColor: l === 0 ? "var(--border)" : `${accent}${Math.round((l / 4) * 0.9 * 255).toString(16).padStart(2, "0")}` }} />
            ))}
            More
          </div>
        </div>
        <Heatmap grid={heatmap} accent={accent} />
      </div>

      <div>
        <h3 className="text-xs font-semibold text-foreground mb-3 uppercase tracking-wide">🕑 Recent Activity</h3>
        <div className="relative">
          <div className="absolute left-4 top-2 bottom-2 w-px bg-border" />
          <div className="space-y-3">
            {activity.map((item, i) => (
              <motion.div key={item.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }} className="relative flex items-start gap-3 pl-10">
                <span className={`absolute left-0 top-0 w-8 h-8 rounded-full flex items-center justify-center text-sm ${KIND_BG[item.kind]}`}>
                  {item.emoji}
                </span>
                <div className="glass rounded-xl px-4 py-3 flex-1">
                  <p className="text-xs text-foreground">{item.text}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{timeAgo(item.date)}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
