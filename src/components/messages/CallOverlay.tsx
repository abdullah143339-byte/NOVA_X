"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff, Volume2, VolumeX, Loader2, ShieldOff } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Conversation } from "./types";
import { useCall, type CallKind } from "./useCall";

interface CallOverlayProps {
  conversation: Conversation;
  peerUserId: string;
  kind: CallKind;
  open: boolean;
  incomingOffer?: RTCSessionDescriptionInit | null;
  onClose: () => void;
}

function initials(name: string): string {
  return name.split(/\s+/).filter(Boolean).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

export default function CallOverlay({ conversation: conv, peerUserId, kind, open, incomingOffer, onClose }: CallOverlayProps) {
  const call = useCall({ peerUserId, kind, onClose });

  const isIncomingCall = !!incomingOffer && call.phase !== "active" && call.phase !== "connecting";

  const localRef = useRef<HTMLVideoElement>(null);
  const remoteRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!open) return;
    if (isIncomingCall && incomingOffer) {
      call.answerCall(incomingOffer);
    } else if (!isIncomingCall && call.phase === "idle") {
      call.startCall();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isIncomingCall, incomingOffer]);

  useEffect(() => {
    if (localRef.current && call.localStream) {
      localRef.current.srcObject = call.localStream;
    }
  }, [call.localStream]);

  useEffect(() => {
    if (remoteRef.current && call.remoteStream) {
      remoteRef.current.srcObject = call.remoteStream;
    }
  }, [call.remoteStream]);

  const statusText: Record<string, string> = {
    idle: "Preparing...",
    ringing: "Calling...",
    incoming: "Incoming call...",
    connecting: "Connecting...",
    active: "Connected",
    rejected: "Call rejected",
    unavailable: "User unavailable",
    busy: "User is on another call",
    ended: "Call ended",
    error: "Call failed",
  };

  const showControls = call.phase === "ringing" || call.phase === "connecting" || call.phase === "active";
  const canEnd = call.phase === "ringing" || call.phase === "connecting" || call.phase === "active" || call.phase === "incoming";
  const isVideo = kind === "video";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
          onClick={() => {
            if (call.phase === "ended" || call.phase === "error") onClose();
          }}
        >
          <motion.div
            initial={{ scale: 0.92, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.92, y: 20 }}
            className="w-full max-w-lg glass rounded-3xl p-6 sm:p-8 text-center overflow-hidden relative"
            onClick={(e) => e.stopPropagation()}
          >
            {isVideo && call.remoteStream && (
              <div className="relative aspect-video rounded-2xl bg-black overflow-hidden mb-4 border border-border">
                <video ref={remoteRef} autoPlay playsInline data-remote className="w-full h-full object-cover" />
              </div>
            )}

            <div className="relative mx-auto mb-3 overflow-hidden">
              {isVideo && call.localStream && (
                <video
                  ref={localRef}
                  autoPlay
                  playsInline
                  muted={call.muted || call.speakerOff}
                  className="w-24 h-32 sm:w-28 sm:h-36 rounded-2xl object-cover border border-border shadow-lg"
                />
              )}
              {(!isVideo || !call.localStream) && (
                <div className={cn("rounded-full bg-gradient-primary flex items-center justify-center text-white font-bold", isVideo ? "w-16 h-16 text-lg" : "w-24 h-24 text-2xl")}>
                  {conv.avatar ? <img src={conv.avatar} alt="" className="w-full h-full object-cover" /> : initials(conv.name)}
                </div>
              )}
            </div>

            <h3 className="text-lg font-bold text-foreground">{conv.name}</h3>
            <p className={cn(
              "text-sm mt-1 flex items-center justify-center gap-1.5",
              call.phase === "active" ? "text-green-500" : call.phase === "ringing" || call.phase === "incoming" || call.phase === "connecting" ? "text-amber-500" : "text-muted-foreground"
            )}>
              {(call.phase === "ringing" || call.phase === "incoming" || call.phase === "connecting") && (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              )}
              {call.phase === "active" && <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />}
              {call.error || statusText[call.phase] || "Call ended"}
            </p>

            {call.error && (
              <p className="text-xs text-red-400 mt-2 flex items-center justify-center gap-1">
                <ShieldOff className="w-3.5 h-3.5" /> {call.error}
              </p>
            )}

            {call.phase === "ended" || call.phase === "rejected" || call.phase === "unavailable" || call.phase === "busy" || call.phase === "error" ? (
              <div className="mt-6">
                <button
                  onClick={onClose}
                  className="h-10 px-6 rounded-xl bg-gradient-primary text-white text-sm font-medium hover:shadow-lg hover:shadow-primary/25 transition-all"
                >
                  Close
                </button>
              </div>
            ) : (
              <div className="mt-6 flex items-center justify-center gap-3">
                {isIncomingCall && call.phase === "incoming" && (
                  <button
                    onClick={() => call.answerCall(incomingOffer!)}
                    aria-label="Accept call"
                    className="w-14 h-14 rounded-2xl bg-green-500 text-white flex items-center justify-center hover:bg-green-600 transition-all"
                  >
                    <Phone className="w-5 h-5" />
                  </button>
                )}

                {showControls && isVideo && (
                  <button
                    onClick={call.toggleCamera}
                    aria-label="Toggle camera"
                    className={cn(
                      "w-14 h-14 rounded-2xl flex items-center justify-center transition-all",
                      call.cameraOff ? "bg-red-500 text-white" : "bg-muted text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {call.cameraOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                  </button>
                )}

                {showControls && (
                  <button
                    onClick={call.toggleMute}
                    aria-label="Toggle mute"
                    className={cn(
                      "w-14 h-14 rounded-2xl flex items-center justify-center transition-all",
                      call.muted ? "bg-red-500 text-white" : "bg-muted text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {call.muted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  </button>
                )}

                {canEnd && (
                  <button
                    onClick={() => {
                      if (call.phase === "incoming") call.rejectCall();
                      else call.endCall();
                    }}
                    aria-label="End call"
                    className="w-14 h-14 rounded-2xl bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-all"
                  >
                    <PhoneOff className="w-5 h-5" />
                  </button>
                )}

                {showControls && (
                  <button
                    onClick={call.toggleSpeaker}
                    aria-label="Toggle speaker"
                    className={cn(
                      "w-14 h-14 rounded-2xl flex items-center justify-center transition-all",
                      call.speakerOff ? "bg-red-500 text-white" : "bg-muted text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {call.speakerOff ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                  </button>
                )}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}