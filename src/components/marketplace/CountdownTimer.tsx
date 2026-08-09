"use client";

import { useEffect, useState } from "react";

interface CountdownTimerProps {
  targetMs?: number;
  className?: string;
}

function getRemaining(target: number): { h: number; m: number; s: number } {
  const diff = Math.max(0, target - Date.now());
  return {
    h: Math.floor(diff / 3600000),
    m: Math.floor((diff % 3600000) / 60000),
    s: Math.floor((diff % 60000) / 1000),
  };
}

export default function CountdownTimer({ targetMs, className }: CountdownTimerProps) {
  const [target] = useState(() => targetMs ?? Date.now() + 8 * 3600000);
  const [time, setTime] = useState(() => getRemaining(target));

  useEffect(() => {
    const id = window.setInterval(() => setTime(getRemaining(target)), 1000);
    return () => window.clearInterval(id);
  }, [target]);

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div className={`flex items-center gap-1.5 ${className ?? ""}`}>
      {[
        { label: "hrs", value: pad(time.h) },
        { label: "min", value: pad(time.m) },
        { label: "sec", value: pad(time.s) },
      ].map((b, i) => (
        <div key={b.label} className="flex items-center gap-1.5">
          <div className="flex flex-col items-center justify-center w-11 h-11 rounded-lg bg-black/40 text-white backdrop-blur-sm">
            <span className="text-sm font-bold leading-none tabular-nums">{b.value}</span>
            <span className="text-[9px] uppercase tracking-wide text-white/60 mt-0.5">{b.label}</span>
          </div>
          {i < 2 && <span className="text-white/70 font-bold">:</span>}
        </div>
      ))}
    </div>
  );
}
