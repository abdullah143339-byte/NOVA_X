"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface AnimatedCoverProps {
  image?: string | null;
  gradient?: string;
  accent?: string;
  className?: string;
}

export default function AnimatedCover({ image, gradient = "from-violet-500/40 via-indigo-500/40 to-fuchsia-500/40", accent = "#6C63FF", className }: AnimatedCoverProps) {
  return (
    <div className={cn("relative w-full h-full overflow-hidden", className)}>
      {image ? (
        <img src={image} alt="Cover" className="absolute inset-0 w-full h-full object-cover" />
      ) : (
        <div className={cn("absolute inset-0 bg-gradient-to-br", gradient)} />
      )}
      <div className="absolute inset-0 opacity-40" style={{ background: `linear-gradient(120deg, transparent 30%, ${accent}22 50%, transparent 70%)` }} />
      <motion.div
        className="absolute -left-16 top-4 w-56 h-56 rounded-full blur-3xl opacity-50"
        style={{ background: `${accent}55` }}
        animate={{ x: [0, 40, 0], y: [0, 16, 0], scale: [1, 1.15, 1] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -right-10 -bottom-16 w-64 h-64 rounded-full blur-3xl opacity-40"
        style={{ background: `${accent}44` }}
        animate={{ x: [0, -30, 0], y: [0, -20, 0], scale: [1, 1.2, 1] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/10" />
    </div>
  );
}
