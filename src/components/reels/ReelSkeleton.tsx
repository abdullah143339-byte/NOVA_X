export default function ReelSkeleton() {
  return (
    <div className="relative h-full w-full bg-[#0B0D12] overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0 bg-gradient-to-b from-[#171B22]/60 to-[#0B0D12]" />
      <div className="absolute left-4 bottom-28 w-3/5 space-y-3">
        <div className="h-4 w-32 rounded-full bg-white/10 animate-pulse" />
        <div className="h-3 w-full rounded-full bg-white/10 animate-pulse" />
        <div className="h-3 w-4/5 rounded-full bg-white/10 animate-pulse" />
        <div className="h-3 w-2/3 rounded-full bg-white/10 animate-pulse" />
      </div>
      <div className="absolute right-4 bottom-32 flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-white/10 animate-pulse" />
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="w-11 h-11 rounded-2xl bg-white/10 animate-pulse" />
        ))}
      </div>
      <div className="absolute inset-x-0 top-6 flex justify-center">
        <div className="h-8 w-56 rounded-full bg-white/10 animate-pulse" />
      </div>
    </div>
  );
}
