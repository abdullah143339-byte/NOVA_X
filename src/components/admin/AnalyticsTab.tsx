"use client";

import { useEffect, useMemo, useState } from "react";
import { BarChart3, Download, TrendingUp, Users, DollarSign, BrainCircuit, MousePointerClick, Activity } from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";
import api from "@/lib/api";
import { useAdmin } from "./AdminProvider";
import { SectionHeading, AdminSkeleton, StatCard, downloadTextFile, toCsv } from "./AdminShared";
import { seedAnalytics, formatMoney, formatCount, can } from "./data";
import type { AnalyticsData, SeriesPoint, ApiEnvelope, RawSeries } from "./types";

function AreaChart({ data, color, height = 160 }: { data: SeriesPoint[]; color: string; height?: number }) {
  const width = 600;
  const pad = 24;
  const [hover] = useState<number | null>(null);

  const { points } = useMemo(() => {
    const max = Math.max(1, ...data.map((d) => d.value));
    const stepX = (width - pad * 2) / Math.max(1, data.length - 1);
    const points = data.map((d, i) => ({
      x: pad + i * stepX,
      y: height - pad - (d.value / max) * (height - pad * 2),
      ...d,
    }));
    return { points, max };
  }, [data, height]);

  const line = points.map((p) => `${p.x},${p.y}`).join(" ");
  const area = `${pad},${height - pad} ${line} ${width - pad},${height - pad}`;

  return (
    <div className="relative w-full" style={{ height }}>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id={`grad-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.35" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((f) => (
          <line key={f} x1={pad} x2={width - pad} y1={pad + f * (height - pad * 2)} y2={pad + f * (height - pad * 2)} stroke="currentColor" className="text-border/40" strokeWidth="1" strokeDasharray="4 4" />
        ))}
        <polygon points={area} fill={`url(#grad-${color.replace("#", "")})`} />
        <polyline points={line} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={hover === i ? 5 : 2.5} fill={color} className="transition-all" />
        ))}
      </svg>
      <div className="absolute inset-x-0 bottom-0 flex justify-between px-2 pointer-events-none">
        {points.filter((_, i) => i % Math.max(1, Math.ceil(points.length / 6)) === 0).map((p, i) => (
          <span key={i} className="text-[10px] text-muted-foreground">{p.label}</span>
        ))}
      </div>
      {hover !== null && (
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-foreground text-background text-xs px-2 py-1 rounded-md whitespace-nowrap">
          {points[hover].label}: {formatCount(points[hover].value)}
        </div>
      )}
    </div>
  );
}

function ChartCard({ title, subtitle, icon, data, color }: { title: string; subtitle: string; icon: React.ReactNode; data: SeriesPoint[]; color: string }) {
  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl bg-gradient-primary/10 flex items-center justify-center" style={{ color }}>{icon}</div>
        <div>
          <h4 className="text-sm font-bold text-foreground">{title}</h4>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      <AreaChart data={data} color={color} />
    </div>
  );
}

export default function AnalyticsTab() {
  const { user } = useAuth();
  const { notify } = useAdmin();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [usedFallback, setUsedFallback] = useState(false);

  useEffect(() => {
    let mounted = true;
    api.adminGetAnalyticsOverview(30)
      .then((res: ApiEnvelope) => {
        if (!mounted) return;
        const series = (res?.data?.series as RawSeries[] | undefined) ?? [];
        if (series.length > 0) {
          setAnalytics({
            revenue: series.map((s) => ({ label: String(s.date).slice(5), value: Math.round(Number(s.revenue ?? 0)) })),
            newUsers: series.map((s) => ({ label: String(s.date).slice(5), value: Number(s.newUsers ?? 0) })),
            activeUsers: series.map((s) => ({ label: String(s.date).slice(5), value: Number(s.newMessages ?? 0) + Number(s.reactions ?? 0) + Number(s.follows ?? 0) })),
            traffic: series.map((s) => ({ label: String(s.date).slice(5), value: Number(s.views ?? 0) })),
            gmv: series.map((s) => ({ label: String(s.date).slice(5), value: Math.round(Number(s.revenue ?? 0)) })),
            aiRequests: series.map((s) => ({ label: String(s.date).slice(5), value: Number(s.aiMessages ?? 0) })),
            growth: series.map((s) => ({ label: String(s.date).slice(5), value: Number(s.newUsers ?? 0) })),
          });
        } else {
          setAnalytics(seedAnalytics());
          setUsedFallback(true);
        }
      })
      .catch(() => {
        if (!mounted) return;
        setAnalytics(seedAnalytics());
        setUsedFallback(true);
      })
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  const canExport = can(user?.role, "analytics.export") || can(user?.role, "analytics.view");

  const totals = useMemo(() => {
    const d = analytics;
    if (!d) return { revenue: 0, users: 0, active: 0, ai: 0, views: 0 };
    const sum = (s: SeriesPoint[]) => s.reduce((a, x) => a + x.value, 0);
    return { revenue: sum(d.revenue), users: sum(d.newUsers), active: sum(d.activeUsers), ai: sum(d.aiRequests), views: sum(d.traffic) };
  }, [analytics]);

  const exportCsv = () => {
    if (!analytics) return;
    const n = analytics.revenue.length;
    const rows: (string | number)[][] = [["Date", "Revenue", "New Users", "Active", "AI Requests", "Traffic"]];
    for (let i = 0; i < n; i++) {
      rows.push([
        analytics.revenue[i]?.label ?? "",
        analytics.revenue[i]?.value ?? 0,
        analytics.newUsers[i]?.value ?? 0,
        analytics.activeUsers[i]?.value ?? 0,
        analytics.aiRequests[i]?.value ?? 0,
        analytics.traffic[i]?.value ?? 0,
      ]);
    }
    downloadTextFile("admin-analytics.csv", toCsv(rows));
    notify("Analytics exported", "success");
  };

  if (loading) return <AdminSkeleton rows={6} />;

  return (
    <div className="space-y-4">
      <SectionHeading
        icon={<BarChart3 className="w-4 h-4 text-primary" />}
        title="Platform Analytics"
        subtitle={usedFallback ? "Seeded demo analytics (30 days)" : "Live platform metrics (30 days)"}
        action={
          canExport ? (
            <button onClick={exportCsv} className="flex items-center gap-2 h-9 px-4 rounded-xl bg-gradient-primary text-white text-sm font-medium hover:opacity-90 transition-all">
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          ) : undefined
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard label="Revenue (30d)" value={formatMoney(totals.revenue)} icon={<DollarSign className="w-5 h-5" />} color="from-green-500 to-emerald-700" />
        <StatCard label="New Users" value={formatCount(totals.users)} icon={<Users className="w-5 h-5" />} color="from-primary to-indigo-700" />
        <StatCard label="Active Users" value={formatCount(totals.active)} icon={<Activity className="w-5 h-5" />} color="from-sky-500 to-blue-700" />
        <StatCard label="AI Requests" value={formatCount(totals.ai)} icon={<BrainCircuit className="w-5 h-5" />} color="from-fuchsia-500 to-purple-700" />
        <StatCard label="Traffic (views)" value={formatCount(totals.views)} icon={<MousePointerClick className="w-5 h-5" />} color="from-amber-500 to-orange-700" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Revenue" subtitle="Daily revenue last 30 days" icon={<TrendingUp className="w-4 h-4" />} data={analytics?.revenue || []} color="#22c55e" />
        <ChartCard title="New Users" subtitle="Daily signups last 30 days" icon={<Users className="w-4 h-4" />} data={analytics?.newUsers || []} color="#8b5cf6" />
        <ChartCard title="Active Users" subtitle="Daily engaged users" icon={<Activity className="w-4 h-4" />} data={analytics?.activeUsers || []} color="#0ea5e9" />
        <ChartCard title="AI Requests" subtitle="Daily AI interactions" icon={<BrainCircuit className="w-4 h-4" />} data={analytics?.aiRequests || []} color="#d946ef" />
      </div>
    </div>
  );
}
