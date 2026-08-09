"use client";

import { useMemo } from "react";
import { Clock3, CheckCircle2, ListTodo, BarChart3, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";
import type { StudyStats, StudySession } from "./types";

function barChart(sessions: StudySession[]): { label: string; minutes: number }[] {
  const out: { label: string; minutes: number }[] = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const minutes = sessions.find((s) => s.date === key)?.minutes || 0;
    out.push({ label: d.toLocaleDateString(undefined, { weekday: "short" }), minutes });
  }
  return out;
}

export function ProgressPanel({ stats, sessions }: { stats: StudyStats; sessions: StudySession[] }) {
  const week = useMemo(() => barChart(sessions), [sessions]);
  const max = Math.max(60, ...week.map((d) => d.minutes));
  const hours = (stats.totalStudyMinutes / 60).toFixed(1);
  const weekHours = (stats.weekMinutes / 60).toFixed(1);
  const lecturePct = stats.totalLectures ? Math.round((stats.completedLectures / stats.totalLectures) * 100) : 0;
  const taskPct = stats.totalTasks ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0;
  const weekPct = Math.min(100, Math.round((stats.weekMinutes / stats.weekTarget) * 100));

  const cards = [
    { icon: Clock3, label: "Total study time", value: `${hours}h` },
    { icon: CheckCircle2, label: "Lectures done", value: `${stats.completedLectures}/${stats.totalLectures}` },
    { icon: ListTodo, label: "Tasks done", value: `${stats.completedTasks}/${stats.totalTasks}` },
    { icon: BarChart3, label: "This week", value: `${weekHours}h` },
  ];

  const bars = [
    { label: "Lectures", pct: lecturePct },
    { label: "Tasks", pct: taskPct },
    { label: "Weekly target", pct: weekPct },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {cards.map((c) => (
          <div key={c.label} className="glass rounded-2xl p-4">
            <c.icon className="w-4.5 h-4.5 text-primary" />
            <p className="mt-2.5 text-xl font-bold text-foreground tabular-nums">{c.value}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="glass rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <CalendarDays className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-foreground text-sm">Last 7 days (minutes)</h3>
        </div>
        <div className="flex items-end justify-between gap-2 h-28">
          {week.map((d) => (
            <div key={d.label} className="flex-1 flex flex-col items-center gap-1.5">
              <span className="text-[10px] text-muted-foreground tabular-nums">{d.minutes}</span>
              <div
                className="w-full rounded-lg bg-gradient-to-t from-primary/70 to-accent/70 transition-all"
                style={{ height: `${Math.max(4, (d.minutes / max) * 100)}%` }}
              />
              <span className="text-[10px] text-muted-foreground">{d.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="glass rounded-2xl p-5 space-y-4">
        {bars.map((b) => (
          <div key={b.label}>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-medium text-muted-foreground">{b.label}</span>
              <span className="font-bold text-foreground tabular-nums">{b.pct}%</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className={cn("h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all")}
                style={{ width: `${b.pct}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
