"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { AdminProvider } from "@/components/admin/AdminProvider";
import AdminToasts from "@/components/admin/AdminToasts";
import DashboardTab from "@/components/admin/DashboardTab";
import UsersTab from "@/components/admin/UsersTab";
import RolesTab from "@/components/admin/RolesTab";
import ModerationTab from "@/components/admin/ModerationTab";
import CommunitiesTab from "@/components/admin/CommunitiesTab";
import MarketplaceTab from "@/components/admin/MarketplaceTab";
import AnalyticsTab from "@/components/admin/AnalyticsTab";
import AuditLogsTab from "@/components/admin/AuditLogsTab";
import SettingsTab from "@/components/admin/SettingsTab";
import { TAB_PERMISSIONS, can } from "@/components/admin/data";
import type { AdminTabId } from "@/components/admin/types";
import { Shield, Users, UserCog, ShieldAlert, Globe, ShoppingBag, BarChart3, ScrollText, Settings2, LayoutDashboard } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import Button from "@/components/ui/Button";

const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN"];

const TABS: { id: AdminTabId; label: string; icon: React.ReactNode }[] = [
  { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
  { id: "users", label: "Users", icon: <Users className="w-4 h-4" /> },
  { id: "roles", label: "Roles", icon: <UserCog className="w-4 h-4" /> },
  { id: "moderation", label: "Moderation", icon: <ShieldAlert className="w-4 h-4" /> },
  { id: "communities", label: "Communities", icon: <Globe className="w-4 h-4" /> },
  { id: "marketplace", label: "Marketplace", icon: <ShoppingBag className="w-4 h-4" /> },
  { id: "analytics", label: "Analytics", icon: <BarChart3 className="w-4 h-4" /> },
  { id: "audit", label: "Audit Logs", icon: <ScrollText className="w-4 h-4" /> },
  { id: "settings", label: "Settings", icon: <Settings2 className="w-4 h-4" /> },
];

function AdminLayout() {
  const { user } = useAuth();
  const [tab, setTab] = useState<AdminTabId>("dashboard");

  const visibleTabs = TABS.filter((t) => can(user?.role, TAB_PERMISSIONS[t.id]));

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Shield className="w-8 h-8 text-primary" />
            Admin Panel
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage users, roles, content, marketplace and platform settings
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Shield className="w-4 h-4 text-primary" />
          <span className="font-medium text-foreground">{user?.role}</span>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {visibleTabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            aria-current={tab === t.id ? "page" : undefined}
            className={`flex items-center gap-2 h-9 px-4 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
              tab === t.id
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {tab === "dashboard" && <DashboardTab onNavigate={(t) => setTab(t)} />}
      {tab === "users" && <UsersTab />}
      {tab === "roles" && <RolesTab />}
      {tab === "moderation" && <ModerationTab />}
      {tab === "communities" && <CommunitiesTab />}
      {tab === "marketplace" && <MarketplaceTab />}
      {tab === "analytics" && <AnalyticsTab />}
      {tab === "audit" && <AuditLogsTab />}
      {tab === "settings" && <SettingsTab />}
    </div>
  );
}

export default function AdminPage() {
  const { user } = useAuth();
  const router = useRouter();

  const isAdmin = user && ADMIN_ROLES.includes(user.role || "");

  if (user && !isAdmin) {
    router.push("/dashboard");
    return null;
  }

  if (!user || !isAdmin) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-20">
        <GlassCard className="p-12 text-center">
          <Shield className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Access Restricted</h2>
          <p className="text-muted-foreground mb-6">Admin panel is only for administrators.</p>
          <Button onClick={() => router.push("/dashboard")}>Back to Dashboard</Button>
        </GlassCard>
      </div>
    );
  }

  return (
    <AdminProvider>
      <AdminLayout />
      <AdminToasts />
    </AdminProvider>
  );
}
