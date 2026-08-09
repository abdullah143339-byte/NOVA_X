export default function ProductCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-surface/40 overflow-hidden animate-pulse">
      <div className="aspect-square bg-muted/60" />
      <div className="p-3 space-y-2.5">
        <div className="h-2.5 w-2/3 rounded-full bg-muted/60" />
        <div className="h-3.5 w-4/5 rounded-full bg-muted/60" />
        <div className="h-3 w-1/2 rounded-full bg-muted/60" />
        <div className="flex items-center justify-between pt-1">
          <div className="h-5 w-16 rounded-full bg-muted/60" />
          <div className="h-8 w-8 rounded-lg bg-muted/60" />
        </div>
      </div>
    </div>
  );
}
