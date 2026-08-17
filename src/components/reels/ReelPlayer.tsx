"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  PictureInPicture2,
  Loader2,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";

interface ReelPlayerProps {
  src: string;
  poster?: string;
  active: boolean;
  paused?: boolean;
  onDoubleTap?: () => void;
  preload?: "none" | "metadata" | "auto";
}

export default function ReelPlayer({ src, poster, active, paused = false, onDoubleTap, preload = "metadata" }: ReelPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const clickTimer = useRef<number | null>(null);

  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [loading, setLoading] = useState(true);
  const [buffering, setBuffering] = useState(false);
  const [error, setError] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);

  useEffect(() => {
    // On touch devices there is no hover; keep controls visible by default.
    const isTouch = typeof window !== "undefined" && window.matchMedia("(hover: none)").matches;
    setControlsVisible(!isTouch);
  }, []);

  useEffect(() => {
    if (!controlsVisible) {
      const t = setTimeout(() => setControlsVisible(true), 3000);
      return () => clearTimeout(t);
    }
  }, [controlsVisible]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (paused) { video.pause(); return; }
    if (active && !error) {
      video.muted = true;
      const p = video.play();
      if (p) p.catch(() => {});
    } else if (!active) {
      video.pause();
    }
  }, [active, error, paused]);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video || error) return;
    if (video.paused) { video.play().catch(() => {}); } else { video.pause(); }
  }, [error]);

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setMuted(video.muted);
  }, []);

  const toggleFullscreen = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    if (document.fullscreenElement) { document.exitFullscreen().catch(() => {}); } else { el.requestFullscreen().catch(() => {}); }
  }, []);

  const togglePip = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (document.pictureInPictureElement) { document.exitPictureInPicture().catch(() => {}); } else if (document.pictureInPictureEnabled) { video.requestPictureInPicture().catch(() => {}); }
  }, []);

  const retry = useCallback(() => {
    setRetrying(true);
    setError(false);
    const video = videoRef.current;
    if (video) {
      video.load();
      video.play().catch(() => {});
    }
    setRetrying(false);
  }, []);

  const seek = useCallback((value: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = value;
    setCurrentTime(value);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === " " || e.key === "k") { e.preventDefault(); togglePlay(); }
    else if (e.key === "m") { toggleMute(); }
    else if (e.key === "f") { toggleFullscreen(); }
    else if (e.key === "ArrowUp") { e.preventDefault(); toggleMute(); }
  }, [togglePlay, toggleMute, toggleFullscreen]);

  const handleClick = useCallback(() => {
    if (clickTimer.current !== null) { window.clearTimeout(clickTimer.current); clickTimer.current = null; return; }
    clickTimer.current = window.setTimeout(() => { clickTimer.current = null; togglePlay(); }, 250);
  }, [togglePlay]);

  const handleDoubleClick = useCallback(() => {
    if (clickTimer.current !== null) { window.clearTimeout(clickTimer.current); clickTimer.current = null; }
    onDoubleTap?.();
  }, [onDoubleTap]);

  useEffect(() => {
    const onFs = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  const fmt = (s: number) => {
    if (!isFinite(s)) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const pct = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufPct = duration > 0 ? (buffered / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 bg-black overflow-hidden group select-none focus:outline-none"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      role="group"
      aria-label="Reel video player"
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className="absolute inset-0 w-full h-full object-contain"
        autoPlay
        loop
        muted
        playsInline
        preload={preload}
        onPlay={() => { setPlaying(true); setLoading(false); setError(false); }}
        onPause={() => setPlaying(false)}
        onWaiting={() => setBuffering(true)}
        onPlaying={() => setBuffering(false)}
        onCanPlay={() => { setLoading(false); setBuffering(false); }}
        onLoadedMetadata={() => { setDuration(videoRef.current?.duration || 0); setLoading(false); }}
        onTimeUpdate={(e) => {
          const v = e.currentTarget;
          setCurrentTime(v.currentTime);
          try {
            if (v.buffered.length > 0) setBuffered(v.buffered.end(v.buffered.length - 1));
          } catch { /* noop */ }
        }}
        onError={() => { setError(true); setLoading(false); setBuffering(false); }}
      />

      {(loading || buffering) && !error && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <Loader2 className={`w-12 h-12 text-white/80 animate-spin ${buffering ? "opacity-70" : ""}`} />
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-20 bg-black/70">
          <div className="w-14 h-14 rounded-2xl bg-red-500/15 flex items-center justify-center">
            <AlertTriangle className="w-7 h-7 text-red-400" />
          </div>
          <p className="text-sm text-white/80 text-center px-6">
            This video could not be played. It may be unavailable or in an unsupported format.
          </p>
          <button
            onClick={retry}
            disabled={retrying}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium hover:bg-white/90 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${retrying ? "animate-spin" : ""}`} /> Retry
          </button>
        </div>
      )}

      {!error && (
        <>
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/40 pointer-events-none" />

          <div className={`absolute inset-x-0 bottom-0 z-20 px-4 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] transition-opacity duration-300 ${controlsVisible ? "opacity-100" : "opacity-0"}`}>
            <div className="relative h-1 rounded-full bg-white/25 overflow-hidden">
              <div className="absolute inset-y-0 left-0 bg-white/30" style={{ width: `${bufPct}%` }} />
              <input
                type="range"
                min={0}
                max={duration || 0}
                step={0.1}
                value={currentTime}
                onChange={(e) => seek(Number(e.target.value))}
                aria-label="Seek"
                className="absolute inset-0 w-full opacity-0 cursor-pointer h-6"
              />
              <div className="absolute inset-y-0 left-0 bg-white" style={{ width: `${pct}%` }} />
            </div>
            <div className="flex items-center gap-1 mt-2 text-white/90">
              <button onClick={togglePlay} aria-label={playing ? "Pause" : "Play"} className="w-10 h-10 flex items-center justify-center rounded-full active:bg-white/20 transition-colors">
                {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </button>
              <button onClick={toggleMute} aria-label={muted ? "Unmute" : "Mute"} className="w-10 h-10 flex items-center justify-center rounded-full active:bg-white/20 transition-colors">
                {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
              <span className="text-[11px] font-medium tabular-nums ml-1">{fmt(currentTime)} / {fmt(duration)}</span>
              <span className="flex-1" />
              {document.pictureInPictureEnabled && (
                <button onClick={togglePip} aria-label="Picture in picture" className="w-10 h-10 flex items-center justify-center rounded-full active:bg-white/20 transition-colors">
                  <PictureInPicture2 className="w-5 h-5" />
                </button>
              )}
              <button onClick={toggleFullscreen} aria-label="Fullscreen" className="w-10 h-10 flex items-center justify-center rounded-full active:bg-white/20 transition-colors">
                {fullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <motion.button
            onClick={handleClick}
            onDoubleClick={handleDoubleClick}
            aria-label={playing ? "Pause reel" : "Play reel"}
            className="absolute inset-0 z-[5] cursor-default"
            whileTap={{ opacity: 0.6 }}
          />
        </>
      )}
    </div>
  );
}
