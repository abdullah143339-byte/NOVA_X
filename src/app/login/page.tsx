"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Logo from "@/components/ui/Logo";
import { useAuth } from "@/providers/AuthProvider";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  CheckCircle2,
  ShieldQuestion,
  X,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface AuthError extends Error {
  tempToken?: string;
}

const FIELD_CLASS =
  "login-input h-12 text-slate-800 placeholder:text-slate-400 focus:ring-[#6C63FF]/40";

function GoogleIcon() {
  return (
    <svg className="w-4.5 h-4.5" viewBox="0 0 24 24">
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
      <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47a5.57 5.57 0 0 1-2.4 3.58v2.98h3.89c2.26-2.09 3.53-5.17 3.53-8.8z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A11.86 11.86 0 0 0 1 12c0 1.77.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.89-2.98c-1.08.72-2.45 1.16-3.39 1.16-2.86 0-5.29-1.93-6.16-4.53l-3.66 2.84C3.99 20.53 7.7 23 12 23z" />
    </svg>
  );
}

function GithubIcon() {
  return (
    <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
  );
}

const PRIMARY_BTN =
  "w-full h-12 rounded-xl font-semibold text-white transition-all duration-200 " +
  "shadow-[0_12px_28px_-10px_rgba(108,99,255,0.65),0_4px_12px_-4px_rgba(0,0,0,0.12)] " +
  "hover:shadow-[0_16px_34px_-10px_rgba(108,99,255,0.78)] hover:-translate-y-0.5 " +
  "active:translate-y-0 active:shadow-[inset_0_2px_6px_rgba(0,0,0,0.18),0_4px_10px_-6px_rgba(108,99,255,0.5)] " +
  "disabled:shadow-none disabled:hover:translate-y-0";

const socialButtonCls =
  "flex items-center justify-center gap-2.5 h-11 rounded-xl text-sm font-medium text-slate-700 " +
  "bg-[#F3F5FA] shadow-[6px_6px_14px_rgba(163,172,188,0.35),-6px_-6px_14px_rgba(255,255,255,0.95)] " +
  "hover:bg-white hover:shadow-[8px_8px_18px_rgba(163,172,188,0.4),-8px_-8px_18px_rgba(255,255,255,1)] hover:-translate-y-0.5 " +
  "active:translate-y-0 active:shadow-[inset_3px_3px_8px_rgba(163,172,188,0.35),inset_-3px_-3px_8px_rgba(255,255,255,0.9)] " +
  "transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#6C63FF]/40";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [identifier, setIdentifier] = useState(
      () => (typeof window !== "undefined" ? localStorage.getItem("novax_remembered_identifier") || "" : "")
  );
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [fieldErrors, setFieldErrors] = useState<{ identifier?: string; password?: string }>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [twoFactorStep, setTwoFactorStep] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [twoFactorError, setTwoFactorError] = useState("");
  const [tempToken, setTempToken] = useState("");
  const [shakeKey, setShakeKey] = useState(0);
  const { login, complete2FALogin } = useAuth();
  const router = useRouter();
  const identifierRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    identifierRef.current?.focus();
  }, []);

  const validate = useCallback((): boolean => {
    const errors: { identifier?: string; password?: string } = {};
    const id = identifier.trim();
    if (!id) {
      errors.identifier = "Email or username is required";
    } else if (id.includes("@") && !EMAIL_RE.test(id)) {
      errors.identifier = "Please enter a valid email address";
    }
    if (!password) {
      errors.password = "Password is required";
    } else if (password.length < 8) {
      errors.password = "Password must be at least 8 characters";
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }, [identifier, password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!validate()) {
      setShakeKey((k) => k + 1);
      return;
    }
    setLoading(true);
    try {
      await login(identifier.trim(), password);
      if (rememberMe) {
        localStorage.setItem("novax_remembered_identifier", identifier.trim());
      } else {
        localStorage.removeItem("novax_remembered_identifier");
      }
      setSuccess(true);
      setTimeout(() => router.push("/dashboard"), 900);
    } catch (err) {
      const e = err as AuthError;
      if (e?.tempToken) {
        setTempToken(e.tempToken);
        setTwoFactorStep(true);
        setTwoFactorError("");
      } else {
        setError(e?.message || "Invalid credentials. Please try again.");
        setShakeKey((k) => k + 1);
      }
    } finally {
      setLoading(false);
    }
  };

  const handle2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setTwoFactorError("");
    if (!twoFactorCode.trim()) {
      setTwoFactorError("Verification code is required");
      return;
    }
    setLoading(true);
    try {
      await complete2FALogin(tempToken, twoFactorCode.trim());
      setSuccess(true);
      setTimeout(() => router.push("/dashboard"), 900);
    } catch (err) {
      setTwoFactorError((err as Error)?.message || "Invalid verification code");
    } finally {
      setLoading(false);
    }
  };

  const oauth = (provider: string) => {
    window.location.href = `${API_URL}/auth/${provider}`;
  };

  return (
    <div
      className="login-light min-h-dvh relative overflow-hidden flex"
      style={{ background: "#EEF0F4" }}
    >
      <div
        aria-hidden
        className="absolute -top-40 -left-40 w-[42rem] h-[42rem] rounded-full blur-3xl opacity-40 pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(108,99,255,0.20) 0%, transparent 65%)" }}
      />
      <div
        aria-hidden
        className="absolute -bottom-48 -right-40 w-[44rem] h-[44rem] rounded-full blur-3xl opacity-30 pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(124,58,237,0.18) 0%, transparent 65%)" }}
      />
      <div
        aria-hidden
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[46rem] h-[46rem] max-w-[130vw] rounded-full pointer-events-none opacity-25"
        style={{ background: "radial-gradient(circle, rgba(255,255,255,0.9) 0%, transparent 60%)" }}
      />

      <div className="relative z-10 flex-1 flex p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0, y: 28, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="m-auto w-full max-w-[440px] pt-[calc(env(safe-area-inset-top)+1rem)] pb-[calc(env(safe-area-inset-bottom)+1rem)]"
        >
          <div className="login-card rounded-[2rem] sm:rounded-[3rem] p-7 sm:p-10">
            <div className="text-center mb-8">
              <motion.div
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.15, ease: "easeOut" }}
                className="login-orb w-16 h-16 sm:w-20 sm:h-20 rounded-full mx-auto flex items-center justify-center"
              >
                <Logo size={44} rounded="rounded-full" bgClassName="bg-white" />
              </motion.div>
              <h1 className="mt-5 text-3xl font-bold tracking-tight text-slate-900">NOVAX</h1>
              <p className="mt-1.5 text-[11px] font-medium uppercase tracking-[0.22em] text-slate-500">
                Think Beyond Social
              </p>
            </div>

            <div className="mb-7 text-center">
              <h2 className="text-2xl font-semibold text-slate-900">
                {twoFactorStep ? "Two-factor verification" : "Welcome back"}
              </h2>
              <p className="text-sm text-slate-500 mt-1.5">
                {twoFactorStep
                  ? "Enter the 6-digit code from your authenticator app"
                  : "Sign in to your account"}
              </p>
            </div>

            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  key="form-error"
                  initial={{ opacity: 0, y: -8, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  role="alert"
                  className="mb-5 overflow-hidden"
                >
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm flex items-start gap-2.5">
                    <ShieldQuestion className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>{error}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {success && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="mb-5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 text-sm flex items-center gap-2.5"
                  role="status"
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Signed in successfully! Redirecting...</span>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div
              key={shakeKey}
              animate={shakeKey ? { x: [0, -10, 10, -8, 8, -4, 4, 0] } : undefined}
              transition={{ duration: 0.45 }}
            >
              {twoFactorStep ? (
                <form className="space-y-4" onSubmit={handle2FA} noValidate>
                  <div className="p-3 rounded-xl bg-[#6C63FF]/10 border border-[#6C63FF]/25 text-[#5B50C4] text-sm text-center">
                    A verification code was required for this account.
                  </div>
                  <div>
                    <Input
                      label="Verification Code"
                      type="text"
                      placeholder="000000"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={6}
                      icon={<Lock className="w-4 h-4" />}
                      className={FIELD_CLASS}
                      aria-label="Verification code"
                      aria-invalid={!!twoFactorError}
                      aria-describedby={twoFactorError ? "2fa-error" : undefined}
                      value={twoFactorCode}
                      onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ""))}
                      error={twoFactorError}
                    />
                    {twoFactorError && (
                      <p id="2fa-error" className="sr-only">
                        {twoFactorError}
                      </p>
                    )}
                  </div>
                  <Button
                    className={PRIMARY_BTN}
                    style={{ background: "linear-gradient(135deg, #6C63FF, #7C3AED)" }}
                    size="lg"
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        Verify &amp; Sign In
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </Button>
                  <button
                    type="button"
                    onClick={() => {
                      setTwoFactorStep(false);
                      setTwoFactorCode("");
                      setTwoFactorError("");
                    }}
                    className="w-full text-sm text-slate-500 hover:text-slate-800 transition-colors py-1"
                  >
                    Back to login
                  </button>
                </form>
              ) : (
                <form className="space-y-5" onSubmit={handleSubmit} noValidate>
                  <div>
                    <div className="relative">
                      <Input
                        ref={identifierRef}
                        label="Email or Username"
                        type="text"
                        placeholder="you@example.com or username"
                        autoComplete="username"
                        icon={<Mail className="w-4 h-4" />}
                        className={FIELD_CLASS}
                        aria-invalid={!!fieldErrors.identifier}
                        aria-describedby={fieldErrors.identifier ? "identifier-error" : undefined}
                        value={identifier}
                        onChange={(e) => {
                          setIdentifier(e.target.value);
                          if (fieldErrors.identifier) setFieldErrors((p) => ({ ...p, identifier: undefined }));
                        }}
                        error={fieldErrors.identifier}
                      />
                      <button
                        type="button"
                        onClick={() => setIdentifier("")}
                        aria-label="Clear identifier"
                        className={`absolute right-3 top-[50px] -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors p-1 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6C63FF]/50 ${
                          identifier ? "" : "invisible"
                        }`}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    {fieldErrors.identifier && (
                      <p id="identifier-error" className="sr-only">
                        {fieldErrors.identifier}
                      </p>
                    )}
                  </div>

                  <div>
                    <div className="relative">
                      <Input
                        label="Password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        autoComplete="current-password"
                        icon={<Lock className="w-4 h-4" />}
                        className={FIELD_CLASS}
                        aria-invalid={!!fieldErrors.password}
                        aria-describedby={fieldErrors.password ? "password-error" : undefined}
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          if (fieldErrors.password) setFieldErrors((p) => ({ ...p, password: undefined }));
                        }}
                        error={fieldErrors.password}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((s) => !s)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        className="absolute right-3 top-[50px] -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors p-1 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6C63FF]/50"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {fieldErrors.password && (
                      <p id="password-error" className="sr-only">
                        {fieldErrors.password}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2.5 text-sm text-slate-600 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-300 bg-transparent accent-[#6C63FF] cursor-pointer"
                      />
                      Remember me
                    </label>
                    <Link
                      href="/forgot-password"
                      className="text-sm text-[#6C63FF] hover:text-[#7C3AED] font-medium transition-colors"
                    >
                      Forgot password?
                    </Link>
                  </div>

                  <Button
                    className={PRIMARY_BTN}
                    style={{ background: "linear-gradient(135deg, #6C63FF, #7C3AED)" }}
                    size="lg"
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      <>
                        Sign In
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </Button>
                </form>
              )}
            </motion.div>

            {!twoFactorStep && (
              <>
                <div className="mt-7 relative" aria-hidden>
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="px-4 text-xs text-slate-500 bg-[#F4F6FA]">or continue with</span>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3">
                  <button type="button" onClick={() => oauth("google")} className={socialButtonCls} aria-label="Continue with Google">
                    <GoogleIcon />
                    Google
                  </button>
                  <button type="button" onClick={() => oauth("github")} className={socialButtonCls} aria-label="Continue with GitHub">
                    <GithubIcon />
                    GitHub
                  </button>
                </div>

                <p className="text-center text-sm text-slate-500 mt-7">
                  Don&apos;t have an account?{" "}
                  <Link href="/signup" className="text-[#6C63FF] hover:text-[#7C3AED] font-semibold transition-colors">
                    Sign up free
                  </Link>
                </p>
              </>
            )}
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="text-center text-xs text-slate-400 mt-6"
          >
            © {new Date().getFullYear()} NOVAX · Think Beyond Social
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}
