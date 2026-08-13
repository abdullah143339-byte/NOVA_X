"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/providers/AuthProvider";
import api from "@/lib/api";
import GlassCard from "@/components/ui/GlassCard";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import ThemeToggle from "@/components/ui/ThemeToggle";
import {
  User,
  Bell,
  Shield,
  Palette,
  Globe,
  Save,
  Mail,
  Lock,
  Smartphone,
  Eye,
  EyeOff,
  Trash2,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  KeyRound,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NOTIF_KEY = "novax_notification_prefs";
const ACCENT_KEY = "novax_accent_color";
const FONT_KEY = "novax_font_size";
const PRIVACY_KEY = "novax_privacy_prefs";

const DEFAULT_NOTIFS: Record<string, boolean> = {
  likes: true,
  comments: true,
  followers: true,
  messages: true,
  communities: false,
  learning: true,
  marketplace: true,
};

const ACCENT_COLORS = ["#7C3AED", "#2563EB", "#059669", "#DC2626", "#D97706", "#EC4899"];

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch {
    return fallback;
  }
}

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [website, setWebsite] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [notifPrefs, setNotifPrefs] = useState<Record<string, boolean>>(DEFAULT_NOTIFS);
  const [accent, setAccentLocal] = useState(ACCENT_COLORS[0]);
  const [fontSize, setFontSizeLocal] = useState(14);
  const [privacyPrefs, setPrivacyPrefs] = useState<Record<string, string>>({
    profile: "Everyone",
    post: "Public",
    online: "Everyone",
  });

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwMsg, setPwMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [pwSaving, setPwSaving] = useState(false);

  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [twoFactorLoading, setTwoFactorLoading] = useState(false);
  const [twoFactorSecret, setTwoFactorSecret] = useState<string | null>(null);
  const [twoFactorOtp, setTwoFactorOtp] = useState("");
  const [twoFactorMsg, setTwoFactorMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [deleting, setDeleting] = useState(false);
  const [delMsg, setDelMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const a = readJson<string>(ACCENT_KEY, ACCENT_COLORS[0]);
      const f = readJson<number>(FONT_KEY, 14);
      setNotifPrefs(readJson<Record<string, boolean>>(NOTIF_KEY, DEFAULT_NOTIFS));
      setAccentLocal(a);
      setFontSizeLocal(f);
      setPrivacyPrefs(readJson<Record<string, string>>(PRIVACY_KEY, {
        profile: "Everyone",
        post: "Public",
        online: "Everyone",
      }));
      document.documentElement.style.setProperty("--novax-accent", a);
      document.documentElement.style.setProperty("--novax-font-size", `${f}px`);
    }
  }, []);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || `${user.firstName || ""} ${user.lastName || ""}`.trim());
      const load = async () => {
        try {
          const res = await api.getUserProfile(user.username);
          const p = res.data;
          setBio(p.bio || "");
          setLocation(p.location || "");
          setWebsite(p.website || "");
        } catch {}
      };
      load();
    }
  }, [user]);

  const load2FAStatus = useCallback(async () => {
    setTwoFactorLoading(true);
    try {
      const res = await api.get2FAStatus();
      setTwoFactorEnabled(Boolean(res?.data?.isEnabled ?? res?.data?.enabled));
    } catch {
      setTwoFactorEnabled(false);
    } finally {
      setTwoFactorLoading(false);
    }
  }, []);

  useEffect(() => {
    load2FAStatus();
  }, [load2FAStatus]);

  const handleSaveProfile = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await api.updateProfile({ displayName: displayName.trim(), bio: bio.trim(), location: location.trim(), website: website.trim() });
      setSaved(true);
      if (refreshUser) await refreshUser();
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      alert(err?.message || "Failed to save");
    } finally { setSaving(false); }
  };

  const toggleNotif = (key: string) => {
    setNotifPrefs((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      localStorage.setItem(NOTIF_KEY, JSON.stringify(next));
      return next;
    });
  };

  const chooseAccent = (color: string) => {
    setAccentLocal(color);
    localStorage.setItem(ACCENT_KEY, JSON.stringify(color));
    document.documentElement.style.setProperty("--novax-accent", color);
  };

  const changeFontSize = (value: number) => {
    setFontSizeLocal(value);
    localStorage.setItem(FONT_KEY, JSON.stringify(value));
    document.documentElement.style.setProperty("--novax-font-size", `${value}px`);
  };

  const changePrivacy = (key: string, value: string) => {
    setPrivacyPrefs((prev) => {
      const next = { ...prev, [key]: value };
      localStorage.setItem(PRIVACY_KEY, JSON.stringify(next));
      return next;
    });
  };

  const handleChangePassword = async () => {
    setPwMsg(null);
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPwMsg({ type: "error", text: "Fill in all password fields" });
      return;
    }
    if (newPassword.length < 12) {
      setPwMsg({ type: "error", text: "New password must be at least 12 characters" });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwMsg({ type: "error", text: "New passwords do not match" });
      return;
    }
    setPwSaving(true);
    try {
      await api.changePassword(currentPassword, newPassword);
      setPwMsg({ type: "success", text: "Password updated. Please sign in again." });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setPwMsg({ type: "error", text: err?.message || "Failed to change password" });
    } finally {
      setPwSaving(false);
    }
  };

  const handleSetup2FA = async () => {
    setTwoFactorMsg(null);
    setTwoFactorLoading(true);
    try {
      const res = await api.setup2FA();
      const secret = res?.data?.secret || res?.data?.otpauthUrl || res?.data?.base32 || "";
      setTwoFactorSecret(String(secret || ""));
      setTwoFactorOtp("");
      setTwoFactorMsg({ type: "success", text: "Scan this secret in your authenticator app, then enter the code below." });
    } catch (err: any) {
      setTwoFactorMsg({ type: "error", text: err?.message || "Could not start 2FA setup" });
    } finally {
      setTwoFactorLoading(false);
    }
  };

  const handleEnable2FA = async () => {
    if (!twoFactorOtp.trim()) {
      setTwoFactorMsg({ type: "error", text: "Enter the verification code" });
      return;
    }
    setTwoFactorLoading(true);
    try {
      await api.enable2FA(twoFactorOtp.trim());
      setTwoFactorEnabled(true);
      setTwoFactorSecret(null);
      setTwoFactorOtp("");
      setTwoFactorMsg({ type: "success", text: "Two-factor authentication enabled" });
    } catch (err: any) {
      setTwoFactorMsg({ type: "error", text: err?.message || "Invalid code" });
    } finally {
      setTwoFactorLoading(false);
    }
  };

  const handleDisable2FA = async () => {
    if (!twoFactorOtp.trim()) {
      setTwoFactorMsg({ type: "error", text: "Enter your current 2FA code to disable" });
      return;
    }
    setTwoFactorLoading(true);
    try {
      await api.disable2FA(twoFactorOtp.trim());
      setTwoFactorEnabled(false);
      setTwoFactorOtp("");
      setTwoFactorMsg({ type: "success", text: "Two-factor authentication disabled" });
    } catch (err: any) {
      setTwoFactorMsg({ type: "error", text: err?.message || "Invalid code" });
    } finally {
      setTwoFactorLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDelMsg(null);
    if (!window.confirm("Are you sure you want to permanently delete your account? This cannot be undone.")) return;
    setDeleting(true);
    try {
      setDelMsg({ type: "error", text: "Account deletion requires a backend endpoint that isn't available yet." });
    } finally {
      setDeleting(false);
    }
  };

  const tabs = [
    { id: "profile", label: "Profile", icon: <User className="w-4 h-4" /> },
    { id: "notifications", label: "Notifications", icon: <Bell className="w-4 h-4" /> },
    { id: "security", label: "Security", icon: <Shield className="w-4 h-4" /> },
    { id: "appearance", label: "Appearance", icon: <Palette className="w-4 h-4" /> },
    { id: "privacy", label: "Privacy", icon: <Globe className="w-4 h-4" /> },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your account preferences</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-6">
        <div className="flex gap-2 overflow-x-auto no-scrollbar sm:hidden -mx-1 px-1 pb-1 w-full">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 h-9 rounded-xl text-sm font-medium transition-all whitespace-nowrap shrink-0 ${
                activeTab === tab.id
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        <div className="w-48 shrink-0 hidden sm:block">
          <nav className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex-1 space-y-6">
          {activeTab === "profile" && (
            <>
              <GlassCard hover={false}>
                <h2 className="text-lg font-semibold text-foreground mb-4">Profile Information</h2>
                <div className="space-y-4">
                  <Input label="Display Name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
                  <Input label="Username" defaultValue={user?.username || ""} disabled />
                  <Input label="Email" type="email" defaultValue={user?.email || ""} icon={<Mail className="w-4 h-4" />} disabled />
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground/80">Bio</label>
                    <textarea
                      className="w-full h-24 rounded-xl bg-muted border border-border px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all resize-none"
                      placeholder="Tell the world about yourself..."
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input label="Location" placeholder="San Francisco, CA" value={location} onChange={(e) => setLocation(e.target.value)} />
                    <Input label="Website" placeholder="yoursite.com" value={website} onChange={(e) => setWebsite(e.target.value)} />
                  </div>
                </div>
                <div className="mt-6 flex items-center justify-end gap-3">
                  {saved && (
                    <span className="flex items-center gap-1.5 text-xs text-green-500"><CheckCircle2 className="w-3.5 h-3.5" /> Saved!</span>
                  )}
                  <Button size="sm" onClick={handleSaveProfile} disabled={saving}>
                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    {saving ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </GlassCard>
            </>
          )}

          {activeTab === "notifications" && (
            <GlassCard hover={false}>
              <h2 className="text-lg font-semibold text-foreground mb-4">Notification Preferences</h2>
              <div className="space-y-4">
                {[
                  { key: "likes", label: "Post likes", description: "When someone likes your post" },
                  { key: "comments", label: "Comments", description: "When someone comments on your post" },
                  { key: "followers", label: "New followers", description: "When someone follows you" },
                  { key: "messages", label: "Messages", description: "When you receive a new message" },
                  { key: "communities", label: "Community updates", description: "Activity in your communities" },
                  { key: "learning", label: "Learning reminders", description: "Daily learning reminders" },
                  { key: "marketplace", label: "Marketplace", description: "Updates on your purchases" },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-sm font-medium text-foreground">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!notifPrefs[item.key]}
                        onChange={() => toggleNotif(item.key)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:bg-primary peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all" />
                    </label>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-3">Preferences are saved on this device.</p>
            </GlassCard>
          )}

          {activeTab === "security" && (
            <>
              <GlassCard hover={false}>
                <h2 className="text-lg font-semibold text-foreground mb-4">Change Password</h2>
                <div className="space-y-4">
                  <div className="relative">
                    <Input label="Current Password" type={showCurrentPassword ? "text" : "password"} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} icon={<Lock className="w-4 h-4" />} />
                    <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} className="absolute right-3 top-[42px] text-muted-foreground hover:text-foreground">
                      {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <div className="relative">
                    <Input label="New Password" type={showNewPassword ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} icon={<Lock className="w-4 h-4" />} />
                    <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-[42px] text-muted-foreground hover:text-foreground">
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <Input label="Confirm New Password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} icon={<Lock className="w-4 h-4" />} />
                </div>
                {pwMsg && (
                  <p className={cn("text-xs mt-2", pwMsg.type === "success" ? "text-green-500" : "text-red-500")}>{pwMsg.text}</p>
                )}
                <div className="mt-6 flex justify-end">
                  <Button size="sm" onClick={handleChangePassword} disabled={pwSaving}>
                    {pwSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <KeyRound className="w-3.5 h-3.5" />}
                    Update Password
                  </Button>
                </div>
              </GlassCard>

              <GlassCard hover={false}>
                <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-primary" /> Two-Factor Authentication
                </h2>
                <p className="text-sm text-muted-foreground mb-4">
                  {twoFactorEnabled ? "2FA is enabled. Enter a code to disable it." : "Add an extra layer of security to your account"}
                </p>

                {twoFactorEnabled ? (
                  <div className="space-y-3">
                    <Input label="Verification code" value={twoFactorOtp} onChange={(e) => setTwoFactorOtp(e.target.value)} placeholder="123456" />
                    <Button size="sm" variant="secondary" onClick={handleDisable2FA} disabled={twoFactorLoading}>
                      {twoFactorLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Shield className="w-3.5 h-3.5" />}
                      Disable 2FA
                    </Button>
                  </div>
                ) : twoFactorSecret ? (
                  <div className="space-y-3">
                    <div className="rounded-xl bg-muted p-3">
                      <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">Secret</p>
                      <p className="font-mono text-sm text-foreground break-all">{twoFactorSecret}</p>
                    </div>
                    <Input label="Verification code" value={twoFactorOtp} onChange={(e) => setTwoFactorOtp(e.target.value)} placeholder="123456" />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleEnable2FA} disabled={twoFactorLoading}>
                        {twoFactorLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                        Verify & Enable
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => { setTwoFactorSecret(null); setTwoFactorOtp(""); }}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <Button size="sm" variant="secondary" onClick={handleSetup2FA} disabled={twoFactorLoading}>
                    {twoFactorLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Shield className="w-3.5 h-3.5" />}
                    Enable 2FA
                  </Button>
                )}
                {twoFactorMsg && (
                  <p className={cn("text-xs mt-3", twoFactorMsg.type === "success" ? "text-green-500" : "text-red-500")}>{twoFactorMsg.text}</p>
                )}
              </GlassCard>

              <GlassCard hover={false} className="border-red-500/20">
                <h2 className="text-lg font-semibold text-red-500 mb-4 flex items-center gap-2">
                  <Trash2 className="w-5 h-5" /> Delete Account
                </h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Permanently delete your account and all associated data. This action cannot be undone.
                </p>
                <Button size="sm" variant="danger" onClick={handleDeleteAccount} disabled={deleting}>
                  {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                  Delete Account
                </Button>
                {delMsg && <p className="text-xs text-red-500 mt-3">{delMsg.text}</p>}
              </GlassCard>
            </>
          )}

          {activeTab === "appearance" && (
            <GlassCard hover={false}>
              <h2 className="text-lg font-semibold text-foreground mb-4">Appearance</h2>
              <div className="space-y-6">
                <div>
                  <p className="text-sm font-medium text-foreground mb-3">Theme</p>
                  <div className="flex items-center gap-3">
                    <ThemeToggle />
                    <span className="text-sm text-muted-foreground">Toggle between light and dark mode</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground mb-3">Accent Color</p>
                  <div className="flex items-center gap-2">
                    {ACCENT_COLORS.map((color) => (
                      <button
                        key={color}
                        onClick={() => chooseAccent(color)}
                        aria-label={`Accent color ${color}`}
                        className={cn(
                          "w-8 h-8 rounded-full transition-all",
                          accent === color ? "ring-2 ring-offset-2 ring-foreground/40 scale-110" : "border-2 border-transparent hover:border-foreground/20"
                        )}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground mb-3">Font Size</p>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">A</span>
                    <input
                      type="range"
                      min="12"
                      max="18"
                      value={fontSize}
                      onChange={(e) => changeFontSize(Number(e.target.value))}
                      className="flex-1 accent-primary"
                    />
                    <span className="text-lg text-muted-foreground">A</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">Current size: {fontSize}px</p>
                </div>
              </div>
            </GlassCard>
          )}

          {activeTab === "privacy" && (
            <GlassCard hover={false}>
              <h2 className="text-lg font-semibold text-foreground mb-4">Privacy Settings</h2>
              <div className="space-y-4">
                {[
                  { key: "profile", label: "Profile visibility", description: "Who can see your profile", options: ["Everyone", "Followers", "Only me"] },
                  { key: "post", label: "Post visibility", description: "Default visibility for new posts", options: ["Public", "Followers", "Only me"] },
                  { key: "online", label: "Online status", description: "Show when you're online", options: ["Everyone", "Followers", "Nobody"] },
                ].map((item) => (
                  <div key={item.key} className="py-2">
                    <p className="text-sm font-medium text-foreground">{item.label}</p>
                    <p className="text-xs text-muted-foreground mb-2">{item.description}</p>
                    <select
                      value={privacyPrefs[item.key] || item.options[0]}
                      onChange={(e) => changePrivacy(item.key, e.target.value)}
                      className="w-full h-10 rounded-xl bg-muted border border-border px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                      {item.options.map((opt) => (
                        <option key={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-3">Privacy preferences are saved on this device.</p>
            </GlassCard>
          )}
        </div>
      </div>
    </div>
  );
}
