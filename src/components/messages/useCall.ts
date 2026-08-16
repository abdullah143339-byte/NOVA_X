"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Socket } from "socket.io-client";
import { getSocket } from "@/lib/socket";

export type CallKind = "voice" | "video";

export type CallPhase =
  | "idle"
  | "ringing"
  | "incoming"
  | "connecting"
  | "active"
  | "rejected"
  | "unavailable"
  | "busy"
  | "ended"
  | "error";

interface UseCallOptions {
  peerUserId: string;
  kind: CallKind;
  onClose?: () => void;
}

const RTC_CONFIG = {
  iceServers: (() => {
    const stun = process.env.NEXT_PUBLIC_STUN_SERVERS || "stun:stun.l.google.com:19302";
    const turnRaw = process.env.NEXT_PUBLIC_TURN_SERVERS;
    const servers: RTCIceServer[] = stun
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((urls) => ({ urls }));
    if (turnRaw) {
      for (const entry of turnRaw.split(";")) {
        const parts = entry.split("@");
        if (parts.length !== 2) continue;
        const [cred, url] = parts;
        const ci = cred.lastIndexOf(":");
        if (ci === -1) continue;
        servers.push({ urls: url.trim(), username: cred.slice(0, ci), credential: cred.slice(ci + 1) });
      }
    }
    return servers.length > 0 ? servers : [{ urls: "stun:stun.l.google.com:19302" }];
  })(),
};

export function useCall({ peerUserId, kind, onClose }: UseCallOptions) {
  const socketRef = useRef<Socket | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [phase, setPhase] = useState<CallPhase>("idle");
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [speakerOff, setSpeakerOff] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  const socket = useCallback(() => {
    if (!socketRef.current) {
      const s = getSocket();
      if (!s.connected) {
        const token = typeof window !== "undefined" ? localStorage.getItem("novax_token") : null;
        if (token) {
          s.auth = { token };
          s.connect();
        }
      }
      socketRef.current = s;
    }
    return socketRef.current;
  }, []);

  const peerRef = useRef(peerUserId);
  useEffect(() => {
    peerRef.current = peerUserId;
  }, [peerUserId]);

  const ensurePC = useCallback(() => {
    if (pcRef.current) return pcRef.current;
    const pc = new RTCPeerConnection(RTC_CONFIG);
    pcRef.current = pc;

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        socket().emit("call:ice", { toUserId: peerRef.current, candidate: e.candidate.toJSON() });
      }
    };

    pc.ontrack = (e) => {
      setRemoteStream(e.streams[0] || null);
    };

    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      if (state === "connected") {
        setPhase((p) => (p === "connecting" || p === "ringing" ? "active" : p));
      } else if (state === "failed" || state === "disconnected") {
        setError("Connection lost. The call may be unstable.");
      }
    };

    return pc;
  }, [socket]);

  const getMedia = useCallback(async (): Promise<MediaStream | null> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: kind === "video",
      });
      streamRef.current = stream;
      setLocalStream(stream);
      return stream;
    } catch {
      setError(
        kind === "video"
          ? "Could not access camera/microphone. Check permissions."
          : "Could not access microphone. Check permissions."
      );
      return null;
    }
  }, [kind]);

  const cleanup = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setLocalStream(null);
    setRemoteStream(null);
    pcRef.current?.close();
    pcRef.current = null;
  }, []);

  // Outgoing call: grab media, create offer, send to peer via signaling.
  const startCall = useCallback(async () => {
    const stream = await getMedia();
    if (!stream) {
      setPhase("error");
      return;
    }
    const pc = ensurePC();
    stream.getTracks().forEach((t) => pc.addTrack(t, stream));
    setPhase("ringing");
    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket().emit("call:offer", { toUserId: peerRef.current, kind, sdp: offer });
    } catch {
      setPhase("error");
    }
  }, [getMedia, ensurePC, socket, kind]);

  // Answer an incoming call.
  const answerCall = useCallback(
    async (offer: RTCSessionDescriptionInit) => {
      const stream = await getMedia();
      if (!stream) {
        setPhase("error");
        return;
      }
      const pc = ensurePC();
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));
      try {
        await pc.setRemoteDescription(offer);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        setPhase("connecting");
        socket().emit("call:answer", { toUserId: peerRef.current, sdp: answer });
      } catch {
        setPhase("error");
      }
    },
    [getMedia, ensurePC, socket]
  );

  const rejectCall = useCallback(() => {
    cleanup();
    setPhase("ended");
  }, [cleanup]);

  const endCall = useCallback(() => {
    socket().emit("call:end", { toUserId: peerRef.current });
    cleanup();
    setPhase("ended");
    onClose?.();
  }, [socket, cleanup, onClose]);

  const cancelCall = useCallback(() => {
    socket().emit("call:cancel", { toUserId: peerRef.current });
    cleanup();
    setPhase("ended");
    onClose?.();
  }, [socket, cleanup, onClose]);

  const toggleMute = useCallback(() => {
    setMuted((m) => {
      const next = !m;
      streamRef.current?.getAudioTracks().forEach((t) => (t.enabled = !next));
      return next;
    });
  }, []);

  const toggleCamera = useCallback(() => {
    setCameraOff((c) => {
      const next = !c;
      streamRef.current?.getVideoTracks().forEach((t) => (t.enabled = !next));
      return next;
    });
  }, []);

  const toggleSpeaker = useCallback(() => {
    setSpeakerOff((s) => {
      const next = !s;
      try {
        const el = document.querySelector<HTMLVideoElement>("video[data-remote]");
        if (el) el.muted = next;
      } catch {}
      return next;
    });
  }, []);

  // Signal handlers
  useEffect(() => {
    const s = socket();
    const onAnswer = async (p: { userId: string; sdp: RTCSessionDescriptionInit }) => {
      if (p.userId !== peerRef.current) return;
      const pc = pcRef.current;
      if (!pc) return;
      try {
        await pc.setRemoteDescription(p.sdp);
        setPhase("connecting");
      } catch {
        setError("Call handshake failed.");
      }
    };
    const onIce = async (p: { userId: string; candidate: RTCIceCandidateInit }) => {
      if (p.userId !== peerRef.current) return;
      const pc = pcRef.current;
      if (!pc || !p.candidate) return;
      try {
        await pc.addIceCandidate(p.candidate);
      } catch {}
    };
    const onRejected = (p: { userId: string }) => {
      if (p.userId !== peerRef.current) return;
      setPhase("rejected");
    };
    const onUnavailable = () => setPhase("unavailable");
    const onBusy = () => setPhase("busy");
    const onEnded = (p: { userId: string }) => {
      if (p.userId !== peerRef.current) return;
      cleanup();
      setPhase("ended");
    };
    const onCancelled = (p: { userId: string }) => {
      if (p.userId !== peerRef.current) return;
      setPhase("ended");
    };
    const onError = (p: { message: string }) => {
      setError(p?.message || "Call failed.");
      setPhase("error");
    };

    s.on("call:answer", onAnswer);
    s.on("call:ice", onIce);
    s.on("call:rejected", onRejected);
    s.on("call:unavailable", onUnavailable);
    s.on("call:busy", onBusy);
    s.on("call:ended", onEnded);
    s.on("call:cancelled", onCancelled);
    s.on("call:error", onError);

    return () => {
      s.off("call:answer", onAnswer);
      s.off("call:ice", onIce);
      s.off("call:rejected", onRejected);
      s.off("call:unavailable", onUnavailable);
      s.off("call:busy", onBusy);
      s.off("call:ended", onEnded);
      s.off("call:cancelled", onCancelled);
      s.off("call:error", onError);
    };
  }, [socket, cleanup]);

  // Stop media on unmount.
  useEffect(() => () => cleanup(), [cleanup]);

  return {
    phase,
    muted,
    cameraOff,
    speakerOff,
    localStream,
    remoteStream,
    error,
    startCall,
    answerCall,
    rejectCall,
    endCall,
    cancelCall,
    toggleMute,
    toggleCamera,
    toggleSpeaker,
  };
}