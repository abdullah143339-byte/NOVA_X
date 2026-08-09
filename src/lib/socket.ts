'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:8080';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('nova_token') : null;
    socket = io(SOCKET_URL, {
      auth: { token },
      autoConnect: false,
      transports: ['websocket', 'polling'],
    });
  }
  return socket;
}

export function connectSocket() {
  const s = getSocket();
  if (!s.connected) {
    const token = localStorage.getItem('nova_token');
    if (token) {
      s.auth = { token };
      s.connect();
    }
  }
  return s;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('nova_token');
    if (!token) return;

    const s = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    s.on('connect', () => setConnected(true));
    s.on('disconnect', () => setConnected(false));

    s.connect();
    socketRef.current = s;

    return () => {
      s.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, []);

  const emit = useCallback((event: string, data?: any) => {
    socketRef.current?.emit(event, data);
  }, []);

  const on = useCallback((event: string, handler: (...args: any[]) => void) => {
    socketRef.current?.on(event, handler);
    return () => {
      socketRef.current?.off(event, handler);
    };
  }, []);

  return { socket: socketRef.current, connected, emit, on };
}

export function useRealtimeMessages(conversationId: string | null, onNewMessage: (msg: any) => void) {
  const { socket, connected, emit } = useSocket();

  useEffect(() => {
    if (!socket || !connected || !conversationId) return;

    emit('conversation:join', { conversationId });
    socket.on('message:new', onNewMessage);

    return () => {
      emit('conversation:leave', { conversationId });
      socket.off('message:new', onNewMessage);
    };
  }, [socket, connected, conversationId, emit, onNewMessage]);
}

export function useRealtimeNotifications(onNotification: (notif: any) => void) {
  const { socket, connected } = useSocket();

  useEffect(() => {
    if (!socket || !connected) return;
    socket.on('notification:new', onNotification);
    return () => { socket.off('notification:new', onNotification); };
  }, [socket, connected, onNotification]);
}
