import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  emoji?: string;
  href?: string;
  linkLabel?: string;
  accent?: boolean;
}

export default function SectionHeader({
  title,
  subtitle,
  emoji,
  href,
  linkLabel = "See All",
  accent,
}: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-3 mb-5">
      <div className="flex items-center gap-3">
        {emoji && (
          <span className="w-10 h-10 rounded-xl bg-gradient-primary/15 flex items-center justify-center text-lg shrink-0">
            {emoji}
          </span>
        )}
        <div>
          <h2
            className={cn(
              "text-lg sm:text-xl font-bold text-foreground flex items-center gap-2",
              accent && "text-gradient"
            )}
          >
            {title}
          </h2>
          {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {href && (
        <Link
          href={href}
          className="inline-flex items-center gap-0.5 text-sm font-medium text-primary hover:gap-1.5 transition-all shrink-0"
        >
          {linkLabel} <ChevronRight className="w-4 h-4" />
        </Link>
      )}
    </div>
  );
}

export type { SectionHeaderProps };
