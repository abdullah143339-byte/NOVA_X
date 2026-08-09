"use client";

import { motion } from "framer-motion";

interface ScoreRingProps {
  value: number;
  size?: number;
  stroke?: number;
  color?: string;
  label: string;
  sublabel?: string;
}

export default function ScoreRing({ value, size = 84, stroke = 7, color = "#6C63FF", label, sublabel }: ScoreRingProps) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(100, Math.max(0, value));

  return (
    <div className="flex flex-col items-center gap-1.5" role="img" aria-label={`${label}: ${pct}%`}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" className="text-border" strokeWidth={stroke} />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            whileInView={{ strokeDashoffset: circumference * (1 - pct / 100) }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            style={{ filter: `drop-shadow(0 0 6px ${color}66)` }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold text-foreground">{Math.round(pct)}</span>
        </div>
      </div>
      <span className="text-[10px] font-medium text-muted-foreground">{label}</span>
      {sublabel && <span className="text-[9px] text-muted-foreground/70 -mt-1">{sublabel}</span>}
    </div>
  );
}
