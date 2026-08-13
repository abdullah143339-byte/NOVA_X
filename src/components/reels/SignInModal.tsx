"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, LogIn, UserPlus, Sparkles } from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";

interface SignInModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  message?: string;
}

export default function SignInModal({ open, onClose, onSuccess, message }: SignInModalProps) {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!identifier.trim() || !password) {
      setError("Please enter your email/username and password.");
      return;
    }
    setLoading(true);
    try {
      const res = await api.login({ identifier: identifier.trim(), password });
      localStorage.setItem("novax_token", res.data.accessToken);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          aria-modal="true"
          role="dialog"
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ type: "spring", damping: 24, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md glass-strong rounded-3xl p-7 shadow-2xl"
          >
            <div className="flex items-start justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-primary flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground leading-tight">Welcome back</h2>
                  <p className="text-xs text-muted-foreground">{message || "Sign in to like, comment and save reels."}</p>
                </div>
              </div>
              <button onClick={onClose} aria-label="Close" className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={submit} className="space-y-3.5">
              <input
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Email or username"
                autoComplete="username"
                className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/60 transition-shadow"
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                autoComplete="current-password"
                className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/60 transition-shadow"
              />

              {error && (
                <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-gradient-primary text-white font-semibold hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-60"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
                {loading ? "Signing in..." : "Sign in"}
              </button>
            </form>

            <div className="my-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-white/10" />
              <span className="text-[11px] text-muted-foreground uppercase tracking-wider">or</span>
              <div className="h-px flex-1 bg-white/10" />
            </div>

            <Link
              href="/signup"
              onClick={onClose}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border border-white/10 text-foreground font-medium hover:bg-white/5 active:scale-[0.98] transition-all"
            >
              <UserPlus className="w-4 h-4" /> Create free account
            </Link>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
