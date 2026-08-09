"use client";

import { cn } from "@/lib/utils";

/**
 * VideoBackdrop — a looping background video layer.
 * Muted + autoplay + loop, `object-cover` so it fills the section, and an
 * optional dark overlay to keep foreground text/icons readable.
 */
export default function VideoBackdrop({
  src,
  overlayClassName = "bg-black/55",
  className,
  poster,
}: {
  src: string;
  overlayClassName?: string;
  className?: string;
  poster?: string;
}) {
  return (
    <>
      <video
        className={cn("absolute inset-0 w-full h-full object-cover", className)}
        src={src}
        poster={poster}
        autoPlay
        muted
        loop
        playsInline
        aria-hidden="true"
      />
      <div className={cn("absolute inset-0", overlayClassName)} aria-hidden="true" />
    </>
  );
}
