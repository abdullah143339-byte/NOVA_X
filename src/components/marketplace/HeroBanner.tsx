"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { HERO_BANNERS } from "./catalog";
import { cn } from "@/lib/utils";

export default function HeroBanner() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setActive((prev) => (prev + 1) % HERO_BANNERS.length);
    }, 5000);
    return () => window.clearInterval(id);
  }, []);

  const go = (dir: number) => {
    setActive((prev) => (prev + dir + HERO_BANNERS.length) % HERO_BANNERS.length);
  };

  return (
    <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl">
      <div
        className="flex transition-transform duration-500 ease-out"
        style={{ transform: `translateX(-${active * 100}%)` }}
      >
        {HERO_BANNERS.map((b) => (
          <div key={b.id} className="w-full shrink-0 px-1">
            <div className={`relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r ${b.gradient} p-6 sm:p-12 min-h-[200px] sm:min-h-[260px] flex items-center`}>
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.6),transparent_50%)]" />
              <div className="relative z-10 max-w-lg">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/15 text-white text-[10px] font-semibold uppercase tracking-wider backdrop-blur-sm">
                  {b.emoji} NOVA Market
                </span>
                <h1 className="mt-3 text-2xl sm:text-4xl font-bold text-white leading-tight">{b.title}</h1>
                <p className="mt-2 text-sm sm:text-base text-white/80">{b.subtitle}</p>
                <Link
                  href="/dashboard/marketplace/search?q=sale"
                  className="mt-5 inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-white text-foreground text-sm font-semibold hover:shadow-lg transition-all"
                >
                  {b.cta}
                </Link>
              </div>
              <span className="absolute right-6 sm:right-14 bottom-4 sm:bottom-8 text-6xl sm:text-8xl opacity-90 select-none">{b.emoji}</span>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={() => go(-1)}
        aria-label="Previous banner"
        className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/30 text-white flex items-center justify-center hover:bg-black/50 transition-all backdrop-blur-sm"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button
        onClick={() => go(1)}
        aria-label="Next banner"
        className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/30 text-white flex items-center justify-center hover:bg-black/50 transition-all backdrop-blur-sm"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
        {HERO_BANNERS.map((_, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            aria-label={`Go to banner ${i + 1}`}
            className={cn("h-1.5 rounded-full transition-all", i === active ? "w-6 bg-white" : "w-2 bg-white/50")}
          />
        ))}
      </div>
    </div>
  );
}
