"use client";

import { useEffect, useRef, useCallback } from "react";
import { useSocket } from "@/lib/socket";
import type { RawMessage, TypingState } from "./types";

interface MessagesSocketHandlers {
  onMessage: (payload: { conversationId: string; message: RawMessage }) => void;
  onTyping: (payload: TypingState) => void;
  onOnline: (payload: { userId: string }) => void;
  onOffline: (payload: { userId: string }) => void;
}

export function useMessagesSocket(
  activeId: string | null,
  handlers: MessagesSocketHandlers
) {
  const { socket, connected } = useSocket();
  const handlersRef = useRef(handlers);

  useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);

  useEffect(() => {
    if (!socket || !connected) return;
    const onMessage = (p: { conversationId: string; message: RawMessage }) => handlersRef.current.onMessage(p);
    const onTyping = (p: TypingState) => handlersRef.current.onTyping(p);
    const onOnline = (p: { userId: string }) => handlersRef.current.onOnline(p);
    const onOffline = (p: { userId: string }) => handlersRef.current.onOffline(p);
    socket.on("message:new", onMessage);
    socket.on("message:typing", onTyping);
    socket.on("user:online", onOnline);
    socket.on("user:offline", onOffline);
    return () => {
      socket.off("message:new", onMessage);
      socket.off("message:typing", onTyping);
      socket.off("user:online", onOnline);
      socket.off("user:offline", onOffline);
    };
  }, [socket, connected]);

  useEffect(() => {
    if (!socket || !connected || !activeId) return;
    socket.emit("conversation:join", { conversationId: activeId });
    return () => { socket.emit("conversation:leave", { conversationId: activeId }); };
  }, [socket, connected, activeId]);

  const emitTyping = useCallback(
    (conversationId: string, isTyping: boolean) => {
      socket?.emit("message:typing", { conversationId, isTyping });
    },
    [socket]
  );

  return { connected, emitTyping };
}
