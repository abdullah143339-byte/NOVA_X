"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { AdminToast, AuditLogItem, FeatureFlag, SystemSetting } from "./types";
import { seedFeatureFlags, seedSettings } from "./data";

interface AdminContextValue {
  toasts: AdminToast[];
  notify: (message: string, type?: AdminToast["type"]) => void;
  dismissToast: (id: string) => void;
  sessionAudit: AuditLogItem[];
  addAuditAction: (log: Omit<AuditLogItem, "id">) => void;
  featureFlags: FeatureFlag[];
  toggleFeatureFlag: (key: string) => void;
  setFeatureRollout: (key: string, rollout: number) => void;
  settings: SystemSetting[];
  setSetting: (key: string, value: boolean | string) => void;
}

const AdminContext = createContext<AdminContextValue | undefined>(undefined);

const FF_KEY = "nova_admin_feature_flags";
const SETTINGS_KEY = "nova_admin_settings";

let auditSeq = 0;

function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function AdminProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<AdminToast[]>([]);
  const [sessionAudit, setSessionAudit] = useState<AuditLogItem[]>([]);
  const [featureFlags, setFeatureFlags] = useState<FeatureFlag[]>([]);
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const hydratedRef = useRef(false);
  const toastTimers = useRef<number[]>([]);

  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      setFeatureFlags(readStorage<FeatureFlag[]>(FF_KEY, seedFeatureFlags()));
      setSettings(readStorage<SystemSetting[]>(SETTINGS_KEY, seedSettings()));
      hydratedRef.current = true;
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    if (!hydratedRef.current) return;
    window.localStorage.setItem(FF_KEY, JSON.stringify(featureFlags));
  }, [featureFlags]);

  useEffect(() => {
    if (!hydratedRef.current) return;
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    const timers = toastTimers.current;
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const notify = useCallback((message: string, type: AdminToast["type"] = "success") => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev.slice(-4), { id, message, type }]);
    const timer = window.setTimeout(() => dismissToast(id), 3800);
    toastTimers.current.push(timer);
  }, [dismissToast]);

  const addAuditAction = useCallback((log: Omit<AuditLogItem, "id">) => {
    auditSeq += 1;
    setSessionAudit((prev) => [{ ...log, id: `audit-${Date.now()}-${auditSeq}` }, ...prev]);
  }, []);

  const toggleFeatureFlag = useCallback((key: string) => {
    setFeatureFlags((prev) => prev.map((f) => (f.key === key ? { ...f, enabled: !f.enabled } : f)));
  }, []);

  const setFeatureRollout = useCallback((key: string, rollout: number) => {
    setFeatureFlags((prev) => prev.map((f) => (f.key === key ? { ...f, rollout } : f)));
  }, []);

  const setSetting = useCallback((key: string, value: boolean | string) => {
    setSettings((prev) => prev.map((s) => (s.key === key ? { ...s, value } : s)));
  }, []);

  return (
    <AdminContext.Provider
      value={{
        toasts,
        notify,
        dismissToast,
        sessionAudit,
        addAuditAction,
        featureFlags,
        toggleFeatureFlag,
        setFeatureRollout,
        settings,
        setSetting,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (!context) throw new Error("useAdmin must be used within AdminProvider");
  return context;
}
