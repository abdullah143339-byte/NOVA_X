"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { ProfilePrefs, ToastMessage } from "./types";

interface ProfileContextValue {
  prefs: ProfilePrefs;
  setPrefs: (prefs: Partial<ProfilePrefs>) => void;
  toasts: ToastMessage[];
  notify: (message: string, type?: ToastMessage["type"]) => void;
  dismissToast: (id: string) => void;
  isFollowing: (userId: string) => boolean;
  toggleFollow: (userId: string) => void;
  isRemoved: (userId: string) => boolean;
  removeFollower: (userId: string) => void;
  visitorCount: number;
  profileViews: number;
  recordVisit: () => void;
  recordView: () => void;
}

const ProfileContext = createContext<ProfileContextValue | undefined>(undefined);

const PREFS_KEY = "nova_profile_prefs";
const FOLLOW_KEY = "nova_profile_following";
const REMOVED_KEY = "nova_profile_removed";
const VISITOR_KEY = "nova_profile_visitors";
const VIEWS_KEY = "nova_profile_views";

const DEFAULT_PREFS: ProfilePrefs = {
  accentColor: "#6C63FF",
  theme: "aurora",
  layout: "grid",
  privacy: "public",
  pinnedLinks: ["github", "linkedin"],
  followCategories: ["AI", "Design"],
  visibility: { activity: true, likes: true, saved: true },
};

function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefsState] = useState<ProfilePrefs>(DEFAULT_PREFS);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [following, setFollowing] = useState<Record<string, boolean>>({});
  const [removed, setRemoved] = useState<string[]>([]);
  const [visitorCount, setVisitorCount] = useState(0);
  const [profileViews, setProfileViews] = useState(0);
  const hydratedRef = useRef(false);
  const toastTimers = useRef<number[]>([]);

  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      setPrefsState({ ...DEFAULT_PREFS, ...readStorage<Partial<ProfilePrefs>>(PREFS_KEY, {}) });
      setFollowing(readStorage<Record<string, boolean>>(FOLLOW_KEY, {}));
      setRemoved(readStorage<string[]>(REMOVED_KEY, []));
      setVisitorCount(readStorage<number>(VISITOR_KEY, 0));
      setProfileViews(readStorage<number>(VIEWS_KEY, 0));
      hydratedRef.current = true;
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    if (!hydratedRef.current) return;
    window.localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  }, [prefs]);

  useEffect(() => {
    if (!hydratedRef.current) return;
    window.localStorage.setItem(FOLLOW_KEY, JSON.stringify(following));
  }, [following]);

  useEffect(() => {
    if (!hydratedRef.current) return;
    window.localStorage.setItem(REMOVED_KEY, JSON.stringify(removed));
  }, [removed]);

  useEffect(() => {
    if (!hydratedRef.current) return;
    window.localStorage.setItem(VISITOR_KEY, JSON.stringify(visitorCount));
  }, [visitorCount]);

  useEffect(() => {
    if (!hydratedRef.current) return;
    window.localStorage.setItem(VIEWS_KEY, JSON.stringify(profileViews));
  }, [profileViews]);

  useEffect(() => {
    const timers = toastTimers.current;
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const notify = useCallback((message: string, type: ToastMessage["type"] = "success") => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    const timer = window.setTimeout(() => dismissToast(id), 3600);
    toastTimers.current.push(timer);
  }, [dismissToast]);

  const setPrefs = useCallback((patch: Partial<ProfilePrefs>) => {
    setPrefsState((prev) => ({ ...prev, ...patch }));
  }, []);

  const isFollowing = useCallback((userId: string) => !!following[userId], [following]);

  const toggleFollow = useCallback((userId: string) => {
    setFollowing((prev) => ({ ...prev, [userId]: !prev[userId] }));
  }, []);

  const isRemoved = useCallback((userId: string) => removed.includes(userId), [removed]);

  const removeFollower = useCallback((userId: string) => {
    setRemoved((prev) => (prev.includes(userId) ? prev : [...prev, userId]));
  }, []);

  const recordVisit = useCallback(() => {
    setVisitorCount((prev) => prev + 1);
  }, []);

  const recordView = useCallback(() => {
    setProfileViews((prev) => prev + 1);
  }, []);

  return (
    <ProfileContext.Provider
      value={{
        prefs,
        setPrefs,
        toasts,
        notify,
        dismissToast,
        isFollowing,
        toggleFollow,
        isRemoved,
        removeFollower,
        visitorCount,
        profileViews,
        recordVisit,
        recordView,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (!context) throw new Error("useProfile must be used within ProfileProvider");
  return context;
}
