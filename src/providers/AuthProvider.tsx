'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import api from '@/lib/api';
import { connectSocket, disconnectSocket } from '@/lib/socket';

interface User {
  id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  avatar?: string;
  role?: string;
  createdAt?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  complete2FALogin: (tempToken: string, code: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const token = localStorage.getItem('nova_token');
      if (!token) {
        setUser(null);
        return;
      }
      const res = await api.getMe();
      setUser(res.data);
      try { connectSocket(); } catch {}
    } catch {
      try {
        const refreshRes = await api.refresh();
        localStorage.setItem('nova_token', refreshRes.data.accessToken);
        const res = await api.getMe();
        setUser(res.data);
        try { connectSocket(); } catch {}
        return;
      } catch {}
      localStorage.removeItem('nova_token');
      setUser(null);
    }
  }, []);

  useEffect(() => {
    refreshUser().finally(() => setLoading(false));
    return () => { disconnectSocket(); };
  }, [refreshUser]);

  const login = async (identifier: string, password: string) => {
    const res = await api.login({ identifier, password });
    if (res.data?.requires2FA) {
      const err = new Error('Two-factor authentication required') as Error & { tempToken?: string };
      err.tempToken = res.data.tempToken;
      throw err;
    }
    localStorage.setItem('nova_token', res.data.accessToken);
    setUser(res.data.user);
    try { connectSocket(); } catch {}
  };

  const complete2FALogin = async (tempToken: string, code: string) => {
    const res = await api.verify2faLogin(tempToken, code);
    localStorage.setItem('nova_token', res.data.accessToken);
    setUser(res.data.user);
    try { connectSocket(); } catch {}
  };

  const register = async (data: any) => {
    const res = await api.register(data);
    localStorage.setItem('nova_token', res.data.accessToken);
    setUser(res.data.user);
    try { connectSocket(); } catch {}
  };

  const logout = async () => {
    try { await api.logout(); } catch {}
    localStorage.removeItem('nova_token');
    disconnectSocket();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, complete2FALogin, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
