"use client";

import { useState, useEffect } from "react";
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
  Moon,
  Sun,
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
} from "lucide-react";

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

      <div className="flex gap-6">
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
                  <div className="grid grid-cols-2 gap-4">
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
                  { label: "Post likes", description: "When someone likes your post", enabled: true },
                  { label: "Comments", description: "When someone comments on your post", enabled: true },
                  { label: "New followers", description: "When someone follows you", enabled: true },
                  { label: "Messages", description: "When you receive a new message", enabled: true },
                  { label: "Community updates", description: "Activity in your communities", enabled: false },
                  { label: "Learning reminders", description: "Daily learning reminders", enabled: true },
                  { label: "Marketplace", description: "Updates on your purchases", enabled: true },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-sm font-medium text-foreground">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked={item.enabled} className="sr-only peer" />
                      <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:bg-primary peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all" />
                    </label>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}

          {activeTab === "security" && (
            <>
              <GlassCard hover={false}>
                <h2 className="text-lg font-semibold text-foreground mb-4">Change Password</h2>
                <div className="space-y-4">
                  <div className="relative">
                    <Input label="Current Password" type={showCurrentPassword ? "text" : "password"} icon={<Lock className="w-4 h-4" />} />
                    <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} className="absolute right-3 top-[42px] text-muted-foreground hover:text-foreground">
                      {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <div className="relative">
                    <Input label="New Password" type={showNewPassword ? "text" : "password"} icon={<Lock className="w-4 h-4" />} />
                    <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-[42px] text-muted-foreground hover:text-foreground">
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <Input label="Confirm New Password" type="password" icon={<Lock className="w-4 h-4" />} />
                </div>
                <div className="mt-6 flex justify-end">
                  <Button size="sm">
                    <Shield className="w-3.5 h-3.5" />
                    Update Password
                  </Button>
                </div>
              </GlassCard>

              <GlassCard hover={false}>
                <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-primary" /> Two-Factor Authentication
                </h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Add an extra layer of security to your account
                </p>
                <Button size="sm" variant="secondary">
                  Enable 2FA
                </Button>
              </GlassCard>

              <GlassCard hover={false} className="border-red-500/20">
                <h2 className="text-lg font-semibold text-red-500 mb-4 flex items-center gap-2">
                  <Trash2 className="w-5 h-5" /> Delete Account
                </h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Permanently delete your account and all associated data. This action cannot be undone.
                </p>
                <Button size="sm" variant="danger">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Delete Account
                </Button>
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
                    {["#7C3AED", "#2563EB", "#059669", "#DC2626", "#D97706", "#EC4899"].map((color) => (
                      <button
                        key={color}
                        className="w-8 h-8 rounded-full border-2 border-transparent hover:border-foreground/20 transition-all"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground mb-3">Font Size</p>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">A</span>
                    <input type="range" min="12" max="18" defaultValue="14" className="flex-1 accent-primary" />
                    <span className="text-lg text-muted-foreground">A</span>
                  </div>
                </div>
              </div>
            </GlassCard>
          )}

          {activeTab === "privacy" && (
            <GlassCard hover={false}>
              <h2 className="text-lg font-semibold text-foreground mb-4">Privacy Settings</h2>
              <div className="space-y-4">
                {[
                  { label: "Profile visibility", description: "Who can see your profile", options: ["Everyone", "Followers", "Only me"] },
                  { label: "Post visibility", description: "Default visibility for new posts", options: ["Public", "Followers", "Only me"] },
                  { label: "Online status", description: "Show when you're online", options: ["Everyone", "Followers", "Nobody"] },
                ].map((item) => (
                  <div key={item.label} className="py-2">
                    <p className="text-sm font-medium text-foreground">{item.label}</p>
                    <p className="text-xs text-muted-foreground mb-2">{item.description}</p>
                    <select className="w-full h-10 rounded-xl bg-muted border border-border px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50">
                      {item.options.map((opt) => (
                        <option key={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}
        </div>
      </div>
    </div>
  );
}
