"use client";

import { cn } from "@/lib/utils";

interface HeatmapProps {
  grid: number[][];
  accent?: string;
  className?: string;
}

function levelColor(v: number, accent: string, max: number): string {
  if (v === 0) return "var(--border)";
  const alpha = 0.25 + (v / max) * 0.75;
  return `${accent}${Math.round(alpha * 255).toString(16).padStart(2, "0")}`;
}

export default function Heatmap({ grid, accent = "#6C63FF", className }: HeatmapProps) {
  const max = Math.max(1, ...grid.flat());
  return (
    <div className={cn("flex gap-[3px] overflow-x-auto no-scrollbar pb-1", className)}>
      {grid.map((week, wi) => (
        <div key={wi} className="flex flex-col gap-[3px]">
          {week.map((v, di) => (
            <div
              key={di}
              className="w-2.5 h-2.5 rounded-[2px]"
              style={{ backgroundColor: levelColor(v, accent, max) }}
              title={`${v} activities`}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
