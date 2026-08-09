"use client";

export function ProjectCardSkeleton() {
  return (
    <div className="rounded-2xl glass overflow-hidden animate-pulse">
      <div className="h-36 bg-muted/60" />
      <div className="p-4 pt-7 space-y-3">
        <div className="h-4 w-3/4 rounded-full bg-muted/60" />
        <div className="h-3 w-full rounded-full bg-muted/40" />
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full bg-muted/60" />
          <div className="space-y-1.5 flex-1">
            <div className="h-3 w-1/3 rounded-full bg-muted/50" />
            <div className="h-2 w-1/4 rounded-full bg-muted/40" />
          </div>
        </div>
        <div className="flex gap-1.5 pt-1">
          <div className="h-5 w-14 rounded-md bg-muted/50" />
          <div className="h-5 w-16 rounded-md bg-muted/50" />
          <div className="h-5 w-12 rounded-md bg-muted/50" />
        </div>
      </div>
    </div>
  );
}

export function ProjectGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <ProjectCardSkeleton key={i} />
      ))}
    </div>
  );
}
