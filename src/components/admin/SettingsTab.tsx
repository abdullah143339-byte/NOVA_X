"use client";

import { useEffect, useState } from "react";
import { Settings2, Flag, ShieldCheck, Megaphone, CheckCircle } from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";
import api from "@/lib/api";
import { useAdmin } from "./AdminProvider";
import { SectionHeading, Toggle, StatusBadge, EmptyRow, AdminSkeleton } from "./AdminShared";
import { timeAgo, can } from "./data";
import type { SecurityEvent, ApiEnvelope, RawRow } from "./types";

const GROUPS: { id: string; label: string }[] = [
  { id: "general", label: "General" },
  { id: "security", label: "Security" },
  { id: "notifications", label: "Notifications" },
  { id: "ai", label: "AI" },
  { id: "billing", label: "Billing" },
];

const IMPACT_STYLE: Record<string, string> = {
  high: "bg-red-500/10 text-red-500",
  medium: "bg-amber-500/10 text-amber-600",
  low: "bg-green-500/10 text-green-600",
};

export default function SettingsTab() {
  const { user } = useAuth();
  const { notify, addAuditAction, settings, setSetting, featureFlags, toggleFeatureFlag, setFeatureRollout } = useAdmin();
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastBody, setBroadcastBody] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    let mounted = true;
    api.adminGetSecurityEvents(1, 30)
      .then((res: ApiEnvelope) => {
        if (!mounted) return;
        const raw = (res?.data?.events ?? res?.data?.items) as RawRow[] | undefined;
        setEvents(
          (raw ?? []).map((e: RawRow) => ({
            id: String(e.id),
            type: String(e.type),
            label: String(e.type).replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()),
            user: e.username ? `@${String(e.username)}` : e.userId ? String(e.userId).slice(0, 8) : "system",
            ipAddress: String(e.ipAddress || "—"),
            timestamp: String(e.createdAt || new Date(0).toISOString()),
            severity: String(e.severity || "LOW") as SecurityEvent["severity"],
            resolved: Boolean(e.isResolved),
          }))
        );
      })
      .catch(() => {
        if (!mounted) return;
        setEvents([]);
      })
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  const canSettings = can(user?.role, "settings.view") || can(user?.role, "*");
  const canFlags = can(user?.role, "settings.featureFlags") || can(user?.role, "settings.manage") || can(user?.role, "*");
  const canSecurity = can(user?.role, "security.view") || can(user?.role, "security.suspicious") || can(user?.role, "*");
  const canBroadcast = can(user?.role, "settings.notifications") || can(user?.role, "settings.manage") || can(user?.role, "*");

  const resolveEvent = async (e: SecurityEvent) => {
    try {
      await api.adminResolveSecurityEvent(e.id);
      setEvents((prev) => prev.map((x) => (x.id === e.id ? { ...x, resolved: true } : x)));
      notify("Security event resolved", "success");
      addAuditAction({
        action: "RESOLVE_SECURITY_EVENT",
        actionLabel: "Security event resolved",
        adminName: user?.username || "admin",
        role: user?.role || "ADMIN",
        timestamp: new Date().toISOString(),
        ipAddress: "127.0.0.1",
        resource: "security_event",
        resourceId: e.id,
      });
    } catch {
      notify("Could not resolve event", "error");
    }
  };

  const sendBroadcast = async () => {
    if (!broadcastTitle.trim()) {
      notify("Title is required", "error");
      return;
    }
    setSending(true);
    try {
      await api.adminBroadcastNotification(broadcastTitle.trim(), broadcastBody.trim());
      notify("Notification broadcast to all users", "success");
    } catch {
      notify("Could not send broadcast", "error");
    }
    addAuditAction({
      action: "BROADCAST_NOTIFICATION",
      actionLabel: "Notification broadcast",
      adminName: user?.username || "admin",
      role: user?.role || "ADMIN",
      timestamp: new Date().toISOString(),
      ipAddress: "127.0.0.1",
      resource: "notification",
    });
    setBroadcastTitle("");
    setBroadcastBody("");
    setSending(false);
  };

  if (loading) return <AdminSkeleton rows={6} />;

  return (
    <div className="space-y-6">
      <SectionHeading
        icon={<Settings2 className="w-4 h-4 text-primary" />}
        title="System Settings"
        subtitle="Platform configuration, feature flags and security monitoring"
      />

      {canSettings && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {GROUPS.map((g) => {
            const groupSettings = settings.filter((s) => s.group === g.id);
            if (groupSettings.length === 0) return null;
            return (
              <div key={g.id} className="glass rounded-2xl p-5">
                <h4 className="font-bold text-foreground mb-4 capitalize">{g.label} Settings</h4>
                <div className="space-y-4">
                  {groupSettings.map((s) => (
                    <div key={s.key} className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium text-foreground">{s.label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{s.description}</p>
                      </div>
                      {s.type === "toggle" && (
                        <Toggle checked={s.value as boolean} onChange={() => setSetting(s.key, !(s.value as boolean))} label={s.label} />
                      )}
                      {s.type === "select" && (
                        <select
                          value={s.value as string}
                          onChange={(e) => setSetting(s.key, e.target.value)}
                          className="h-8 rounded-lg bg-muted border border-border px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                        >
                          {s.options?.map((o) => (
                            <option key={o} value={o}>{o}</option>
                          ))}
                        </select>
                      )}
                      {s.type === "text" && (
                        <input
                          type="text"
                          value={s.value as string}
                          onChange={(e) => setSetting(s.key, e.target.value)}
                          className="h-8 rounded-lg bg-muted border border-border px-2 text-xs text-foreground w-32 focus:outline-none focus:ring-1 focus:ring-primary/50"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {canFlags && (
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-gradient-primary/10 flex items-center justify-center text-primary"><Flag className="w-4 h-4" /></div>
            <div>
              <h4 className="font-bold text-foreground">Feature Flags</h4>
              <p className="text-xs text-muted-foreground">Toggle features and control rollout percentage</p>
            </div>
          </div>
          <div className="space-y-4">
            {featureFlags.map((f) => (
              <div key={f.key} className="flex items-start justify-between gap-4 pb-4 border-b border-border/50 last:border-0 last:pb-0">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground font-mono">{f.key}</p>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium ${IMPACT_STYLE[f.impact]}`}>{f.impact}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{f.description}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={5}
                      value={f.rollout}
                      onChange={(e) => setFeatureRollout(f.key, Number(e.target.value))}
                      className="w-32 accent-primary"
                    />
                    <span className="text-xs text-muted-foreground w-8">{f.rollout}%</span>
                  </div>
                </div>
                <Toggle checked={f.enabled} onChange={() => toggleFeatureFlag(f.key)} label={f.key} />
              </div>
            ))}
          </div>
        </div>
      )}

      {canSecurity && (
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-gradient-primary/10 flex items-center justify-center text-primary"><ShieldCheck className="w-4 h-4" /></div>
            <div>
              <h4 className="font-bold text-foreground">Security Events</h4>
              <p className="text-xs text-muted-foreground">Live backend security events</p>
            </div>
          </div>
          <div className="space-y-3">
            {events.map((e) => (
              <div key={e.id} className="flex items-center justify-between gap-3 py-2 border-b border-border/50 last:border-0">
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`shrink-0 px-2 py-0.5 rounded-md text-[10px] font-bold ${
                    e.severity === "CRITICAL" ? "bg-red-500/10 text-red-500" : e.severity === "HIGH" ? "bg-amber-500/10 text-amber-600" : "bg-muted text-muted-foreground"
                  }`}>{e.severity}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{e.label}</p>
                    <p className="text-xs text-muted-foreground truncate">{e.user} · {e.ipAddress} · {timeAgo(e.timestamp)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <StatusBadge status={e.resolved ? "RESOLVED" : "PENDING"} />
                  {!e.resolved && (
                    <button onClick={() => resolveEvent(e)} className="p-1.5 rounded-lg text-muted-foreground hover:text-green-500 hover:bg-green-500/10 transition-all" title="Resolve">
                      <CheckCircle className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
            {events.length === 0 && <EmptyRow text="No security events" />}
          </div>
        </div>
      )}

      {canBroadcast && (
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-gradient-primary/10 flex items-center justify-center text-primary"><Megaphone className="w-4 h-4" /></div>
            <div>
              <h4 className="font-bold text-foreground">Broadcast Notification</h4>
              <p className="text-xs text-muted-foreground">Send a system notification to all users</p>
            </div>
          </div>
          <div className="space-y-3">
            <input
              type="text"
              value={broadcastTitle}
              onChange={(e) => setBroadcastTitle(e.target.value)}
              placeholder="Notification title"
              className="w-full h-10 rounded-xl bg-muted border border-border px-4 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <textarea
              value={broadcastBody}
              onChange={(e) => setBroadcastBody(e.target.value)}
              placeholder="Message body (optional)"
              rows={2}
              className="w-full rounded-xl bg-muted border border-border px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
            />
            <button
              onClick={sendBroadcast}
              disabled={sending}
              className="flex items-center gap-2 h-10 px-4 rounded-xl bg-gradient-primary text-white text-sm font-medium hover:opacity-90 transition-all disabled:opacity-50"
            >
              <Megaphone className="w-4 h-4" />
              {sending ? "Sending..." : "Broadcast to all users"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
