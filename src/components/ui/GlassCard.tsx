"use client";

import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  padding?: "sm" | "md" | "lg";
}

export default function GlassCard({
  children,
  className,
  hover = true,
  padding = "md",
}: GlassCardProps) {
  return (
    <div
      className={cn(
        "glass rounded-2xl",
        hover && "hover-glow",
        {
          "p-3": padding === "sm",
          "p-5": padding === "md",
          "p-8": padding === "lg",
        },
        className
      )}
    >
      {children}
    </div>
  );
}
