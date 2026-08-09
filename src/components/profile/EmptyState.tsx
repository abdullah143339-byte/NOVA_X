"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  emoji: string;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}

export default function EmptyState({ emoji, title, subtitle, action, className }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("text-center py-14 glass rounded-2xl", className)}
    >
      <div className="w-16 h-16 rounded-2xl bg-gradient-primary/10 flex items-center justify-center mx-auto mb-4 text-3xl">
        {emoji}
      </div>
      <p className="text-foreground font-semibold">{title}</p>
      {subtitle && <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">{subtitle}</p>}
      {action && <div className="mt-5">{action}</div>}
    </motion.div>
  );
}
