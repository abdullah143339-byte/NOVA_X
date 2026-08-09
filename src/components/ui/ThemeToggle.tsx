"use client";

import { useTheme } from "@/providers/ThemeProvider";
import { Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        "relative w-10 h-10 rounded-xl glass flex items-center justify-center",
        "hover:bg-primary/10 transition-all duration-300 hover:scale-110",
        className
      )}
      aria-label="Toggle theme"
    >
      <div className="relative w-5 h-5">
        <Sun
          className={cn(
            "absolute inset-0 w-5 h-5 text-amber-500 transition-all duration-300",
            theme === "dark" ? "rotate-0 scale-100 opacity-100" : "rotate-90 scale-0 opacity-0"
          )}
        />
        <Moon
          className={cn(
            "absolute inset-0 w-5 h-5 text-primary transition-all duration-300",
            theme === "light" ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-0 opacity-0"
          )}
        />
      </div>
    </button>
  );
}
