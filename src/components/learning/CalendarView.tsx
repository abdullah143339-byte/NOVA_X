"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { StudyTask } from "./types";
import { dateKey } from "./data";

function startOfWeek(d: Date): Date {
  const x = new Date(d);
  const day = x.getDay();
  x.setDate(x.getDate() - day);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function CalendarView({ tasks }: { tasks: StudyTask[] }) {
  const today = new Date();
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selected, setSelected] = useState<string>(dateKey(today.getTime()));

  const days = useMemo(() => {
    const start = startOfWeek(cursor);
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [cursor]);

  const byDay = useMemo(() => {
    const map = new Map<string, StudyTask[]>();
    for (const t of tasks) {
      if (!t.deadline || t.completed) continue;
      const k = dateKey(t.deadline);
      const arr = map.get(k) || [];
      arr.push(t);
      map.set(k, arr);
    }
    return map;
  }, [tasks]);

  const selectedTasks = byDay.get(selected) || [];
  const monthLabel = cursor.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const todayKey = dateKey(today.getTime());

  const move = (dir: -1 | 1) => {
    setCursor((c) => new Date(c.getFullYear(), c.getMonth() + dir, 1));
  };

  return (
    <div className="glass rounded-3xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-foreground">{monthLabel}</h3>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => move(-1)}
            aria-label="Previous month"
            className="w-8 h-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface flex items-center justify-center transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => move(1)}
            aria-label="Next month"
            className="w-8 h-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface flex items-center justify-center transition-all"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-muted-foreground mb-1">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="py-1">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((d) => {
          const key = dateKey(d.getTime());
          const inMonth = d.getMonth() === cursor.getMonth();
          const count = (byDay.get(key) || []).length;
          const isToday = key === todayKey;
          const isSelected = key === selected;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setSelected(key)}
              className={cn(
                "relative aspect-square rounded-lg text-xs flex items-center justify-center transition-all",
                inMonth ? "text-foreground" : "text-muted-foreground/40",
                isSelected && "bg-primary text-primary-foreground font-bold shadow-md",
                !isSelected && isToday && "border border-primary/50",
                !isSelected && !isToday && "hover:bg-muted"
              )}
              aria-label={`${key}${count ? `, ${count} task${count > 1 ? "s" : ""}` : ""}`}
            >
              {d.getDate()}
              {count > 0 && (
                <span
                  className={cn(
                    "absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full",
                    isSelected ? "bg-primary-foreground" : "bg-rose-400"
                  )}
                />
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-4 border-t border-border pt-3">
        <p className="text-xs font-semibold text-muted-foreground mb-2">
          {new Date(`${selected}T00:00:00`).toLocaleDateString(undefined, {
            weekday: "long",
            month: "short",
            day: "numeric",
          })}
        </p>
        {selectedTasks.length === 0 ? (
          <p className="text-sm text-muted-foreground">No tasks due this day.</p>
        ) : (
          <ul className="space-y-1.5">
            {selectedTasks.map((t) => (
              <li key={t.id} className="flex items-center gap-2 text-sm text-foreground/90">
                <span
                  className={cn(
                    "w-2 h-2 rounded-full shrink-0",
                    t.priority === "high" && "bg-rose-400",
                    t.priority === "medium" && "bg-amber-400",
                    t.priority === "low" && "bg-emerald-400"
                  )}
                />
                <span className="truncate">{t.title}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
