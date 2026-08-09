"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { ProfileTabDef } from "./types";

interface ProfileTabsProps {
  tabs: ProfileTabDef[];
  active: string;
  onChange: (id: string) => void;
  ownerOnly?: boolean;
  className?: string;
}

export default function ProfileTabs({ tabs, active, onChange, ownerOnly, className }: ProfileTabsProps) {
  return (
    <div className={cn("flex gap-1.5 overflow-x-auto no-scrollbar", className)} role="tablist" aria-label="Profile sections">
      {tabs.map((tab) => {
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            aria-label={tab.label}
            onClick={() => onChange(tab.id)}
            className={cn(
              "relative shrink-0 inline-flex items-center gap-1.5 px-4 h-9 rounded-xl text-xs font-medium transition-all",
              isActive ? "text-white" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            {isActive && (
              <motion.span
                layoutId={ownerOnly ? "profile-tab-glow-owner" : "profile-tab-glow"}
                className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary to-accent shadow-lg shadow-primary/25"
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
              />
            )}
            <span className="relative z-10">{tab.icon}</span>
            <span className="relative z-10">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
