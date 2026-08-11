"use client";

import { useEffect, useMemo, useState } from "react";
import { ScrollText, Download, Search } from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";
import api from "@/lib/api";
import { useAdmin } from "./AdminProvider";
import { SectionHeading, EmptyRow, AdminSkeleton, downloadTextFile, toCsv } from "./AdminShared";
import { timeAgo, can } from "./data";
import type { AuditLogItem, ApiEnvelope, RawRow } from "./types";

const ACTION_STYLE: Record<string, string> = {
  DELETE_USER: "bg-red-500/10 text-red-500",
  BAN_USER: "bg-red-500/10 text-red-500",
  UNBAN_USER: "bg-green-500/10 text-green-600",
  SUSPEND_USER: "bg-amber-500/10 text-amber-600",
  WARN_USER: "bg-amber-500/10 text-amber-600",
  UPDATE_USER_ROLE: "bg-primary/10 text-primary",
  DELETE_POST: "bg-red-500/10 text-red-500",
  APPROVE_POST: "bg-green-500/10 text-green-600",
  RESOLVE_REPORT: "bg-green-500/10 text-green-600",
  DISMISS_REPORT: "bg-muted text-muted-foreground",
  DELETE_COMMUNITY: "bg-red-500/10 text-red-500",
  UPDATE_ORDER_STATUS: "bg-primary/10 text-primary",
  DELETE_REVIEW: "bg-red-500/10 text-red-500",
};

function humanizeAction(action: string) {
  return action.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function AuditLogsTab() {
  const { user } = useAuth();
  const { notify } = useAdmin();
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");

  useEffect(() => {
    let mounted = true;
    api.adminGetAllAuditLogs(1, 100)
      .then((res: ApiEnvelope) => {
        if (!mounted) return;
        const raw = (res?.data?.logs ?? res?.data?.items ?? res?.data) as RawRow[] | undefined;
        setLogs(
          (raw ?? []).map((l: RawRow) => ({
            id: String(l.id),
            action: String(l.action),
            actionLabel: humanizeAction(String(l.action)),
            adminName: l.adminUsername ? String(l.adminUsername) : l.userId ? String(l.userId).slice(0, 8) : "system",
            role: "SYSTEM",
            timestamp: String(l.createdAt || new Date(0).toISOString()),
            ipAddress: String(l.ipAddress || "—"),
            resource: String(l.resource || "system"),
            resourceId: l.resourceId ? String(l.resourceId) : undefined,
            details: l.newValues ? JSON.stringify(l.newValues) : undefined,
          }))
        );
      })
      .catch(() => {
        if (!mounted) return;
        setLogs([]);
      })
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  const actions = useMemo(() => {
    const s = new Set<string>();
    logs.forEach((l) => s.add(l.action));
    return Array.from(s);
  }, [logs]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return logs.filter((l) => {
      const matchQ = !q || l.actionLabel.toLowerCase().includes(q) || l.resource.toLowerCase().includes(q) || l.adminName.toLowerCase().includes(q);
      const matchF = filter === "ALL" || l.action === filter;
      return matchQ && matchF;
    });
  }, [logs, search, filter]);

  const canExport = can(user?.role, "security.audit") || can(user?.role, "*");

  const exportCsv = () => {
    const rows: (string | number)[][] = [["Time", "Action", "Admin", "Resource", "Resource ID", "IP"]];
    filtered.forEach((l) => rows.push([l.timestamp, l.action, l.adminName, l.resource, l.resourceId || "", l.ipAddress]));
    downloadTextFile("admin-audit-logs.csv", toCsv(rows));
    notify("Audit log exported", "success");
  };

  if (loading) return <AdminSkeleton rows={6} />;

  return (
    <div className="space-y-4">
      <SectionHeading
        icon={<ScrollText className="w-4 h-4 text-primary" />}
        title="Audit Logs"
        subtitle="Live backend audit trail"
        action={
          canExport ? (
            <button onClick={exportCsv} className="flex items-center gap-2 h-9 px-4 rounded-xl bg-gradient-primary text-white text-sm font-medium hover:opacity-90 transition-all">
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          ) : undefined
        }
      />

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search action, resource or admin..."
            className="w-full h-10 rounded-xl bg-muted border border-border pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="h-10 rounded-xl bg-muted border border-border px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          <option value="ALL">All actions</option>
          {actions.map((a) => (
            <option key={a} value={a}>{humanizeAction(a)}</option>
          ))}
        </select>
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground text-xs">
                {["Time", "Action", "Admin", "Resource", "Resource ID", "IP Address", "Details"].map((c) => (
                  <th key={c} className="p-3 font-medium text-left">{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((l) => (
                <tr key={l.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="p-3 text-muted-foreground whitespace-nowrap">{timeAgo(l.timestamp)}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-md text-[11px] font-medium ${ACTION_STYLE[l.action] || "bg-primary/10 text-primary"}`}>
                      {l.actionLabel}
                    </span>
                  </td>
                  <td className="p-3 text-foreground whitespace-nowrap">{l.adminName}</td>
                  <td className="p-3 text-muted-foreground whitespace-nowrap">{l.resource}</td>
                  <td className="p-3 text-muted-foreground font-mono text-xs truncate max-w-[140px]">{l.resourceId || "—"}</td>
                  <td className="p-3 text-muted-foreground whitespace-nowrap">{l.ipAddress}</td>
                  <td className="p-3 text-muted-foreground text-xs truncate max-w-[200px]">{l.details || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && <EmptyRow text="No audit logs match your filters" />}
      </div>
    </div>
  );
}
