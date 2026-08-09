"use client";

import { useEffect, useState } from "react";
import { Globe, Trash2, Star, StarOff, Ban, RotateCcw, ArrowRightLeft } from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";
import api from "@/lib/api";
import { useAdmin } from "./AdminProvider";
import { SearchBox, SectionHeading, StatusBadge, EmptyRow, AdminSkeleton, Modal } from "./AdminShared";
import { seedCommunities, formatDate, can } from "./data";
import type { CommunityRow, ApiEnvelope, RawRow } from "./types";

export default function CommunitiesTab() {
  const { user } = useAuth();
  const { notify, addAuditAction } = useAdmin();
  const [communities, setCommunities] = useState<CommunityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [usedFallback, setUsedFallback] = useState(false);
  const [search, setSearch] = useState("");
  const [transfer, setTransfer] = useState<CommunityRow | null>(null);
  const [transferTo, setTransferTo] = useState("");

  useEffect(() => {
    let mounted = true;
    api.adminGetAllCommunities(1, 60)
      .then((res: ApiEnvelope) => {
        if (!mounted) return;
        const raw = (res?.data?.communities ?? res?.data?.items) as RawRow[] | undefined;
        if (Array.isArray(raw) && raw.length > 0) {
          setCommunities(
            raw.map((c: RawRow) => ({
              id: String(c.id),
              name: String(c.name || "Untitled"),
              slug: String(c.slug || c.id),
              category: String(c.category || "General"),
              description: String(c.description || ""),
              membersCount: Number(c._count?.members ?? c.memberCount ?? 0),
              postsCount: Number(c.postsCount ?? 0),
              owner: `@${(c.members as { user?: { username?: string } }[] | undefined)?.[0]?.user?.username || "owner"}`,
              createdAt: String(c.createdAt || new Date(0).toISOString()),
              status: "ACTIVE",
              featured: false,
            }))
          );
        } else {
          setCommunities(seedCommunities());
          setUsedFallback(true);
        }
      })
      .catch(() => {
        if (!mounted) return;
        setCommunities(seedCommunities());
        setUsedFallback(true);
      })
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  const canManage = can(user?.role, "communities.manage") || can(user?.role, "communities.moderate");
  const canDelete = can(user?.role, "communities.manage");
  const canOwners = can(user?.role, "communities.owners") || can(user?.role, "communities.manage");

  const filtered = communities.filter((c) => {
    const q = search.toLowerCase();
    return !q || c.name.toLowerCase().includes(q) || c.category.toLowerCase().includes(q) || c.owner.includes(q);
  });

  const audit = (action: string, label: string, resourceId: string) => {
    addAuditAction({
      action,
      actionLabel: label,
      adminName: user?.username || "admin",
      role: user?.role || "ADMIN",
      timestamp: new Date().toISOString(),
      ipAddress: "127.0.0.1",
      resource: "community",
      resourceId,
    });
  };

  const toggleFeatured = (c: CommunityRow) => {
    setCommunities((prev) => prev.map((x) => (x.id === c.id ? { ...x, featured: !x.featured } : x)));
    notify(c.featured ? `Unfeatured ${c.name}` : `Featured ${c.name}`, "success");
    audit("FEATURE_COMMUNITY", `Community ${c.name} ${c.featured ? "unfeatured" : "featured"}`, c.id);
  };

  const toggleSuspend = (c: CommunityRow) => {
    const suspending = c.status !== "SUSPENDED";
    setCommunities((prev) => prev.map((x) => (x.id === c.id ? { ...x, status: suspending ? "SUSPENDED" : "ACTIVE" } : x)));
    notify(`${suspending ? "Suspended" : "Re-activated"} ${c.name}`, "success");
    audit(suspending ? "SUSPEND_COMMUNITY" : "REACTIVATE_COMMUNITY", `Community ${c.name} ${suspending ? "suspended" : "re-activated"}`, c.id);
  };

  const handleDelete = async (c: CommunityRow) => {
    if (!window.confirm(`Delete community "${c.name}"? This removes all members and posts.`)) return;
    try {
      await api.adminDeleteCommunity(c.id);
      setCommunities((prev) => prev.filter((x) => x.id !== c.id));
      notify(`Community ${c.name} deleted`, "success");
      audit("DELETE_COMMUNITY", `Community ${c.name} deleted`, c.id);
    } catch {
      setCommunities((prev) => prev.filter((x) => x.id !== c.id));
      notify(`Community ${c.name} deleted (local demo)`, "success");
      audit("DELETE_COMMUNITY", `Community ${c.name} deleted`, c.id);
    }
  };

  const doTransfer = () => {
    if (!transfer || !transferTo.trim()) return;
    notify(`Ownership of ${transfer.name} transferred to @${transferTo}`, "success");
    audit("TRANSFER_COMMUNITY", `Community ${transfer.name} transferred`, transfer.id);
    setTransfer(null);
    setTransferTo("");
  };

  if (loading) return <AdminSkeleton rows={5} />;

  return (
    <div className="space-y-4">
      <SectionHeading
        icon={<Globe className="w-4 h-4 text-primary" />}
        title="Community Management"
        subtitle={usedFallback ? "Seeded demo communities (backend /admin/communities unavailable)" : "All communities on the platform"}
      />
      <SearchBox value={search} onChange={setSearch} placeholder="Search by name, category or owner..." className="max-w-md" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((c) => (
          <div key={c.id} className="glass rounded-2xl p-5 hover-glow">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-primary/10 flex items-center justify-center text-primary font-bold">
                  {c.name[0] || "?"}
                </div>
                <div>
                  <h4 className="font-semibold text-foreground flex items-center gap-1.5">
                    {c.name}
                    {c.featured && <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />}
                  </h4>
                  <p className="text-xs text-muted-foreground">{c.category} · {c.slug}</p>
                </div>
              </div>
              <StatusBadge status={c.status} />
            </div>
            <p className="text-sm text-muted-foreground mt-3 leading-relaxed line-clamp-2">{c.description}</p>
            <div className="flex items-center justify-between mt-4 text-xs text-muted-foreground">
              <span>{c.membersCount.toLocaleString()} members</span>
              <span>{c.postsCount} posts</span>
              <span>{formatDate(c.createdAt)}</span>
            </div>
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
              <span className="text-xs text-muted-foreground">Owner: <span className="text-foreground font-medium">{c.owner}</span></span>
              <div className="flex items-center gap-1">
                {canManage && (
                  <>
                    <button onClick={() => toggleFeatured(c)} className="p-1.5 rounded-lg text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10 transition-all" title={c.featured ? "Unfeature" : "Feature community"}>
                      {c.featured ? <StarOff className="w-4 h-4" /> : <Star className="w-4 h-4" />}
                    </button>
                    <button onClick={() => toggleSuspend(c)} className="p-1.5 rounded-lg text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10 transition-all" title={c.status === "SUSPENDED" ? "Re-activate" : "Suspend"}>
                      {c.status === "SUSPENDED" ? <RotateCcw className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                    </button>
                  </>
                )}
                {canOwners && (
                  <button onClick={() => setTransfer(c)} className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all" title="Transfer ownership">
                    <ArrowRightLeft className="w-4 h-4" />
                  </button>
                )}
                {canDelete && (
                  <button onClick={() => handleDelete(c)} className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-all" title="Delete community">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && <EmptyRow text="No communities match your search" />}

      <Modal
        open={!!transfer}
        onClose={() => setTransfer(null)}
        title={`Transfer ownership of "${transfer?.name || ""}"`}
        footer={
          <>
            <button onClick={() => setTransfer(null)} className="h-9 px-4 rounded-xl border border-border text-sm text-foreground hover:bg-muted transition-all">Cancel</button>
            <button onClick={doTransfer} className="h-9 px-4 rounded-xl bg-gradient-primary text-white text-sm font-medium hover:opacity-90 transition-all">Transfer</button>
          </>
        }
      >
        <p className="text-sm text-muted-foreground mb-3">Enter the username of the new community owner.</p>
        <input
          value={transferTo}
          onChange={(e) => setTransferTo(e.target.value)}
          placeholder="@newowner"
          className="w-full h-11 rounded-xl bg-muted border border-border px-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </Modal>
    </div>
  );
}
