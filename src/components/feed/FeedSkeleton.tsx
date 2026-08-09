import { Loader2 } from "lucide-react";

export default function FeedSkeleton() {
  return (
    <div className="space-y-4" role="status" aria-label="Loading feed">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="glass rounded-2xl p-5 overflow-hidden relative">
          <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/5 to-transparent" />
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-muted shrink-0" />
            <div className="flex-1 space-y-2.5 py-1">
              <div className="h-3 w-32 rounded-full bg-muted" />
              <div className="h-3 w-20 rounded-full bg-muted" />
              <div className="h-3 w-full rounded-full bg-muted mt-3" />
              <div className="h-3 w-3/4 rounded-full bg-muted" />
              <div className="aspect-square w-full rounded-xl bg-muted/60 mt-3" />
            </div>
          </div>
        </div>
      ))}
      <div className="flex justify-center py-4">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    </div>
  );
}
