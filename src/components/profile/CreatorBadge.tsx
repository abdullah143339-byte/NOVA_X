"use client";

import { BadgeCheck, Crown } from "lucide-react";
import { cn } from "@/lib/utils";

interface CreatorBadgeProps {
  verified?: boolean;
  tier: string;
  tierColor?: string;
  tierEmoji?: string;
  size?: "sm" | "md";
  className?: string;
}

export default function CreatorBadge({ verified, tier, tierColor = "#CD7F32", tierEmoji = "🥉", size = "sm", className }: CreatorBadgeProps) {
  const small = size === "sm";
  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      {verified && (
        <span
          title="Verified Creator"
          className={cn("inline-flex items-center justify-center rounded-full bg-gradient-to-br from-sky-400 to-blue-600 text-white", small ? "w-4 h-4" : "w-5 h-5")}
        >
          <BadgeCheck className={small ? "w-3 h-3" : "w-3.5 h-3.5"} />
        </span>
      )}
      <span
        title={`${tier} Creator`}
        className={cn(
          "inline-flex items-center gap-1 rounded-full font-semibold",
          small ? "px-1.5 py-0.5 text-[9px]" : "px-2 py-0.5 text-[10px]"
        )}
        style={{ backgroundColor: `${tierColor}1A`, color: tierColor, border: `1px solid ${tierColor}40` }}
      >
        <Crown className={small ? "w-2.5 h-2.5" : "w-3 h-3"} />
        {tierEmoji} {tier}
      </span>
    </div>
  );
}
