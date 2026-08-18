"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Mic, Trash2, Send, Pause, Play, Loader2 } from "lucide-react";
import { formatDuration } from "./format";
import { cn } from "@/lib/utils";

interface VoiceRecorderProps {
  onRecorded: (blob: Blob, duration: number) => void;
  onCancel: () => void;
  sending?: boolean;
}

function drawWaveform(
  canvasRef: { current: HTMLCanvasElement | null },
  analyserRef: { current: AnalyserNode | null },
  rafRef: { current: number }
) {
  const canvas = canvasRef.current;
  const analyser = analyserRef.current;
  if (!canvas || !analyser) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const data = new Uint8Array(analyser.frequencyBinCount);
  analyser.getByteTimeDomainData(data);
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  ctx.lineWidth = 2;
  ctx.strokeStyle = "#6C63FF";
  ctx.beginPath();
  const slice = w / data.length;
  let x = 0;
  for (let i = 0; i < data.length; i++) {
    const v = data[i] / 128;
    const y = (v * h) / 2;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
    x += slice;
  }
  ctx.stroke();
  rafRef.current = requestAnimationFrame(() => drawWaveform(canvasRef, analyserRef, rafRef));
}

export default function VoiceRecorder({ onRecorded, onCancel, sending }: VoiceRecorderProps) {
  const [state, setState] = useState<"idle" | "recording" | "paused" | "preview">("idle");
  const [seconds, setSeconds] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);

  const mediaRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const timerRef = useRef<number>(0);
  const secondsRef = useRef(0);
  const blobRef = useRef<Blob | null>(null);
  const durationRef = useRef(0);
  const previewRef = useRef<HTMLAudioElement>(null);

  const cleanup = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    audioCtxRef.current?.close().catch(() => {});
    audioCtxRef.current = null;
    streamRef.current = null;
    analyserRef.current = null;
  }, []);

  const start = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRef.current = recorder;
      streamRef.current = stream;
      chunksRef.current = [];

      type AudioCtxConstructor = typeof AudioContext;
      const win = window as Window & { webkitAudioContext?: AudioCtxConstructor };
      const AudioCtx = window.AudioContext || win.webkitAudioContext;
      const ctx = new AudioCtx();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      source.connect(analyser);
      audioCtxRef.current = ctx;
      analyserRef.current = analyser;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        blobRef.current = blob;
        durationRef.current = secondsRef.current;
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        setState("preview");
        cleanup();
      };
      recorder.start(250);
      secondsRef.current = 0;
      setSeconds(0);
      setState("recording");
      drawWaveform(canvasRef, analyserRef, rafRef);
      timerRef.current = window.setInterval(() => {
        secondsRef.current += 1;
        setSeconds((s) => s + 1);
      }, 1000);
    } catch {
      setState("idle");
    }
  }, [cleanup]);

  const stop = useCallback(() => {
    window.clearInterval(timerRef.current);
    if (mediaRef.current && mediaRef.current.state !== "inactive") mediaRef.current.stop();
  }, []);

  useEffect(() => {
    const raf = rafRef.current;
    return () => {
      window.clearInterval(timerRef.current);
      cancelAnimationFrame(raf);
      cleanup();
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [cleanup, audioUrl]);

  const cancel = () => {
    window.clearInterval(timerRef.current);
    if (mediaRef.current && mediaRef.current.state !== "inactive") mediaRef.current.stop();
    cleanup();
    setState("idle");
    setSeconds(0);
    setAudioUrl(null);
    onCancel();
  };

  const send = () => {
    if (blobRef.current) onRecorded(blobRef.current, durationRef.current);
  };

  const previewToggle = () => {
    const el = previewRef.current;
    if (!el) return;
    if (playing) { el.pause(); setPlaying(false); }
    else el.play().then(() => setPlaying(true)).catch(() => {});
  };

  return (
    <div className="flex items-center gap-2 px-2 py-1.5 rounded-2xl tactile-raised">
      {state === "preview" ? (
        <>
          <button onClick={previewToggle} aria-label={playing ? "Pause" : "Play preview"} className="w-9 h-9 rounded-full bg-gradient-to-br from-[#6C63FF] to-[#7C3AED] text-white flex items-center justify-center shrink-0 shadow-md shadow-[#6C63FF]/30">
            {playing ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
          </button>
          {audioUrl && <audio ref={previewRef} src={audioUrl} onEnded={() => setPlaying(false)} className="hidden" />}
          <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden mx-1">
            <div className="h-full w-full bg-gradient-to-r from-[#6C63FF] to-[#7C3AED] rounded-full" />
          </div>
          <span className="text-xs text-muted-foreground tabular-nums shrink-0">{formatDuration(seconds)}</span>
          <button onClick={cancel} aria-label="Discard voice note" className="w-8 h-8 rounded-full tactile-icon-btn text-muted-foreground shrink-0" style={{ width: "2rem", height: "2rem", borderRadius: "999px" }}>
            <Trash2 className="w-4 h-4" />
          </button>
          <button onClick={send} disabled={sending} aria-label="Send voice note" className="w-9 h-9 rounded-full bg-gradient-to-br from-[#6C63FF] to-[#7C3AED] text-white flex items-center justify-center shrink-0 disabled:opacity-50 shadow-md shadow-[#6C63FF]/30">
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </>
      ) : (
        <>
          <span className={cn("w-2.5 h-2.5 rounded-full shrink-0", state === "recording" ? "bg-red-500 animate-pulse" : "bg-muted-foreground")} />
          <canvas ref={canvasRef} width={200} height={40} className="flex-1 h-10 max-w-[200px]" />
          <span className="text-xs text-muted-foreground tabular-nums shrink-0">{formatDuration(seconds)}</span>
          {state === "recording" ? (
            <>
              <button onClick={cancel} aria-label="Cancel recording" className="w-8 h-8 rounded-lg hover:bg-red-500/10 hover:text-red-500 flex items-center justify-center text-muted-foreground shrink-0">
                <Trash2 className="w-4 h-4" />
              </button>
              <button onClick={stop} aria-label="Finish recording" className="w-9 h-9 rounded-full bg-red-500 text-white flex items-center justify-center shrink-0 hover:scale-105 transition-transform">
                <Send className="w-4 h-4" />
              </button>
            </>
          ) : (
            <button onClick={start} aria-label="Record voice note" className="w-9 h-9 rounded-full bg-gradient-primary text-white flex items-center justify-center shrink-0 hover:scale-105 transition-transform">
              <Mic className="w-4 h-4" />
            </button>
          )}
        </>
      )}
    </div>
  );
}
