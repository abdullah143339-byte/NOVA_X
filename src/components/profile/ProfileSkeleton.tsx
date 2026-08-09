"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ProfileSkeletonProps {
  className?: string;
}

export function ProfileSkeleton({ className }: ProfileSkeletonProps) {
  return (
    <div className={cn("space-y-6", className)} aria-hidden>
      <div className="glass rounded-2xl overflow-hidden">
        <div className="h-40 bg-muted/60 animate-pulse" />
        <div className="p-6 pt-14">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div className="flex items-end gap-4">
              <div className="w-24 h-24 rounded-[28px] bg-muted/70 animate-pulse" />
              <div className="space-y-2 pb-1">
                <div className="h-5 w-44 bg-muted/70 animate-pulse rounded-lg" />
                <div className="h-3 w-28 bg-muted/50 animate-pulse rounded-md" />
                <div className="h-3 w-56 bg-muted/50 animate-pulse rounded-md" />
              </div>
            </div>
            <div className="flex gap-2">
              <div className="h-10 w-24 bg-muted/60 animate-pulse rounded-xl" />
              <div className="h-10 w-24 bg-muted/60 animate-pulse rounded-xl" />
            </div>
          </div>
          <div className="flex gap-6 mt-6 pt-4 border-t border-border">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-4 w-16 bg-muted/50 animate-pulse rounded-md" />
            ))}
          </div>
        </div>
      </div>
      <div className="flex gap-1.5 overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-9 w-24 bg-muted/40 animate-pulse rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="aspect-square glass rounded-2xl bg-muted/30 animate-pulse" />
        ))}
      </div>
    </div>
  );
}
