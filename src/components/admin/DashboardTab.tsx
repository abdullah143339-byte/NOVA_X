"use client";

import { useEffect, useState } from "react";
import { Users, FileText, Globe, FolderGit2, CircleDollarSign, ShoppingCart, Cpu, Ticket, Server, Database, HardDrive, Wifi, Bot, ShieldAlert, Activity } from "lucide-react";
import { useAdmin } from "./AdminProvider";
import { StatCard, SectionHeading, LoadingCard } from "./AdminShared";
import { seedAdminUsers, seedAuditLogs, seedOrders, seedReports, seedSecurityEvents, seedAnalytics, getRoleMembersCounts, formatMoney, timeAgo, formatCount, hashSeed, can } from "./data";
import api from "@/lib/api";
import { useAuth } from "@/providers/AuthProvider";
import type { AdminStats, AdminTabId, ApiEnvelope } from "./types";

export default function DashboardTab({ onNavigate }: { onNavigate: (tab: AdminTabId) => void }) {
  const { user } = useAuth();
  const { sessionAudit } = useAdmin();
  const [liveStats, setLiveStats] = useState<Partial<AdminStats> | null>(null);
  const [loading, setLoading] = useState(true);
  const [usedFallback, setUsedFallback] = useState(false);

  useEffect(() => {
    let mounted = true;
    api.adminGetSystemStats()
      .then((res: ApiEnvelope) => {
        if (!mounted) return;
        setLiveStats((res?.data as Partial<AdminStats> | undefined) || null);
      })
      .catch(() => {
        if (!mounted) return;
        setUsedFallback(true);
      })
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  const seeded = seedAdminUsers(44);
  const roleCounts = getRoleMembersCounts();
  const orders = seedOrders();
  const reports = seedReports();
  const audit = seedAuditLogs();
  const security = seedSecurityEvents();
  const analytics = seedAnalytics();
  const pendingReports = reports.filter((r) => r.status === "PENDING" || r.status === "REVIEWING").length;
  const aiTotal = analytics.aiRequests.reduce((a, b) => a + b.value, 0);
  const revenueTotal = orders.reduce((a, b) => a + b.amount, 0);
  const critical = security.filter((s) => s.severity === "HIGH" || s.severity === "CRITICAL").length;

  if (loading) return <LoadingCard label="Fetching system stats..." />;

  const usersTotal = liveStats?.totalUsers ?? seeded.length + 350;
  const postsTotal = liveStats?.totalPosts ?? 32;
  const communitiesTotal = liveStats?.totalCommunities ?? seedCommunitiesCount();
  const projectsTotal = liveStats?.totalProjects ?? 18;

  const cards = [
    { label: "Total Users", value: formatCount(usersTotal), icon: <Users className="w-5 h-5" />, color: "from-blue-500 to-cyan-500", delta: "+12.4% this month" },
    { label: "Total Posts", value: formatCount(postsTotal), icon: <FileText className="w-5 h-5" />, color: "from-purple-500 to-pink-500", delta: "+8.1% this week" },
    { label: "Communities", value: formatCount(communitiesTotal), icon: <Globe className="w-5 h-5" />, color: "from-green-500 to-emerald-500", delta: "+3 new" },
    { label: "Projects", value: formatCount(projectsTotal), icon: <FolderGit2 className="w-5 h-5" />, color: "from-amber-500 to-orange-500", sublabel: "Portfolio projects" },
    { label: "Revenue (30d)", value: formatMoney(revenueTotal * 10), icon: <CircleDollarSign className="w-5 h-5" />, color: "from-emerald-500 to-teal-500", delta: "+18.2%" },
    { label: "Orders", value: orders.length + 146, icon: <ShoppingCart className="w-5 h-5" />, color: "from-rose-500 to-red-500", delta: "+6.7%" },
    { label: "AI Requests (30d)", value: formatCount(aiTotal), icon: <Cpu className="w-5 h-5" />, color: "from-fuchsia-500 to-purple-500", delta: "+34.1%" },
    { label: "Open Tickets", value: 14 + (critical % 5), icon: <Ticket className="w-5 h-5" />, color: "from-sky-500 to-blue-500", sublabel: `${pendingReports} pending reports` },
  ];

  const health = [
    { label: "API Server", icon: <Server className="w-4 h-4" />, status: "Operational", ok: true, latency: "42ms" },
    { label: "Database", icon: <Database className="w-4 h-4" />, status: "Operational", ok: true, latency: "8ms" },
    { label: "Storage", icon: <HardDrive className="w-4 h-4" />, status: "Operational", ok: true, latency: "61%" },
    { label: "CDN / Edge", icon: <Wifi className="w-4 h-4" />, status: "Operational", ok: true, latency: "31ms" },
    { label: "AI Router", icon: <Bot className="w-4 h-4" />, status: "Degraded", ok: false, latency: "1.2s" },
  ];

  const quick = [
    { label: "Moderate Queue", tab: "moderation" as AdminTabId, icon: <ShieldAlert className="w-4 h-4" />, perm: "moderation.view" },
    { label: "Manage Users", tab: "users" as AdminTabId, icon: <Users className="w-4 h-4" />, perm: "users.view" },
    { label: "Roles & Permissions", tab: "roles" as AdminTabId, icon: <Activity className="w-4 h-4" />, perm: "roles.manage" },
    { label: "Audit Logs", tab: "audit" as AdminTabId, icon: <Activity className="w-4 h-4" />, perm: "security.audit" },
  ].filter((q) => can(user?.role, q.perm));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <SectionHeading
          icon={<Activity className="w-4 h-4 text-primary" />}
          title="Platform Overview"
          subtitle={usedFallback ? "Showing seeded demo metrics (backend /admin/stats unavailable)" : "Live metrics from the NOVA control plane"}
        />
        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground glass rounded-lg px-3 py-1.5">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          {usedFallback ? "Demo data" : "Live"}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <StatCard key={c.label} {...c} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 glass rounded-2xl p-5 hover-glow">
          <SectionHeading icon={<Activity className="w-4 h-4 text-primary" />} title="Quick Actions" subtitle="Jump into the most common admin tasks" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
            {quick.map((q) => (
              <button
                key={q.label}
                onClick={() => onNavigate(q.tab)}
                className="flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/30 hover:bg-muted hover:border-primary/40 transition-all text-left"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-primary/10 flex items-center justify-center text-primary">{q.icon}</div>
                <span className="text-sm font-medium text-foreground">{q.label}</span>
              </button>
            ))}
            <button
              onClick={() => onNavigate("marketplace")}
              className="flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/30 hover:bg-muted hover:border-primary/40 transition-all text-left"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-primary/10 flex items-center justify-center text-primary"><ShoppingCart className="w-4 h-4" /></div>
              <span className="text-sm font-medium text-foreground">Marketplace</span>
            </button>
          </div>
        </div>

        <div className="glass rounded-2xl p-5 hover-glow">
          <SectionHeading icon={<Server className="w-4 h-4 text-primary" />} title="System Health" subtitle="Seeded demo health monitor" />
          <div className="space-y-3 mt-4">
            {health.map((h) => (
              <div key={h.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">{h.icon}</span>
                  <span className="text-foreground">{h.label}</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className={h.ok ? "text-green-500" : "text-amber-500"}>{h.status}</span>
                  <span className="text-muted-foreground">{h.latency}</span>
                  <span className={`w-2 h-2 rounded-full ${h.ok ? "bg-green-500" : "bg-amber-500 animate-pulse"}`} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass rounded-2xl p-5 hover-glow">
          <SectionHeading icon={<Users className="w-4 h-4 text-primary" />} title="Role Distribution" subtitle="Admins & staff across roles" />
          <div className="space-y-3 mt-4">
            {Object.entries(roleCounts).map(([role, count]) => (
              <div key={role} className="flex items-center gap-3">
                <span className="w-28 text-xs text-muted-foreground truncate">{role.replace(/_/g, " ")}</span>
                <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-primary to-accent" style={{ width: `${Math.min(100, (count / Math.max(1, usersTotal)) * 1000)}%` }} />
                </div>
                <span className="text-xs text-foreground font-medium">{count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass rounded-2xl p-5 hover-glow">
          <SectionHeading icon={<Activity className="w-4 h-4 text-primary" />} title="Recent Admin Activity" subtitle="Latest actions across the platform" />
          <div className="space-y-3 mt-4">
            {[...sessionAudit, ...audit].slice(0, 6).map((log) => (
              <div key={log.id} className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm text-foreground truncate">{log.actionLabel}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    @{log.adminName} · <span className="text-muted-foreground">{log.resource}</span>
                  </p>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">{timeAgo(log.timestamp)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function seedCommunitiesCount(): number {
  return 12 + (hashSeed("comm-count") % 40);
}
