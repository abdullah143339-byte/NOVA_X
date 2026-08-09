import { Star, StarHalf } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  rating?: number;
  count?: number;
  size?: "sm" | "md";
  showCount?: boolean;
  className?: string;
}

export default function StarRating({
  rating = 0,
  count,
  size = "sm",
  showCount = true,
  className,
}: StarRatingProps) {
  const clamped = Math.max(0, Math.min(5, rating));
  const full = Math.floor(clamped);
  const half = clamped - full >= 0.4;

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <div className="flex items-center gap-0.5" aria-label={`${clamped.toFixed(1)} out of 5 stars`}>
        {Array.from({ length: 5 }).map((_, i) => {
          if (i < full) {
            return <Star key={i} className={cn(size === "sm" ? "w-3 h-3" : "w-4 h-4", "text-amber-500 fill-amber-500")} />;
          }
          if (i === full && half) {
            return <StarHalf key={i} className={cn(size === "sm" ? "w-3 h-3" : "w-4 h-4", "text-amber-500 fill-amber-500")} />;
          }
          return <Star key={i} className={cn(size === "sm" ? "w-3 h-3" : "w-4 h-4", "text-muted-foreground/30 fill-muted-foreground/30")} />;
        })}
      </div>
      <span className={cn("font-medium text-foreground", size === "sm" ? "text-xs" : "text-sm")}>
        {clamped.toFixed(1)}
      </span>
      {showCount && count !== undefined && (
        <span className="text-xs text-muted-foreground">({count})</span>
      )}
    </div>
  );
}
