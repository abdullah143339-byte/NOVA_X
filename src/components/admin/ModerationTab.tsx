"use client";

import { useEffect, useMemo, useState } from "react";
import { FileText, Video, Image as ImageIcon, MessageSquare, Flag, CheckCircle, XCircle, Trash2, ShieldAlert } from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";
import api from "@/lib/api";
import { useAdmin } from "./AdminProvider";
import { SectionHeading, StatusBadge, EmptyRow, AdminSkeleton } from "./AdminShared";
import { seedModPosts, seedReels, seedStories, seedComments, seedReports, timeAgo, can } from "./data";
import type { ModPostRow, StoryRow, CommentRow, ReportRow, ApiEnvelope, RawRow } from "./types";

type SubTab = "posts" | "reels" | "stories" | "comments" | "reports";

const SUB_TABS: { id: SubTab; label: string; icon: React.ReactNode; perm: string }[] = [
  { id: "posts", label: "Posts", icon: <FileText className="w-4 h-4" />, perm: "moderation.posts" },
  { id: "reels", label: "Reels", icon: <Video className="w-4 h-4" />, perm: "moderation.reels" },
  { id: "stories", label: "Stories", icon: <ImageIcon className="w-4 h-4" />, perm: "moderation.stories" },
  { id: "comments", label: "Comments", icon: <MessageSquare className="w-4 h-4" />, perm: "moderation.comments" },
  { id: "reports", label: "Reports", icon: <Flag className="w-4 h-4" />, perm: "moderation.resolveReports" },
];

export default function ModerationTab() {
  const { user } = useAuth();
  const { notify, addAuditAction } = useAdmin();
  const [sub, setSub] = useState<SubTab>("posts");
  const [posts, setPosts] = useState<ModPostRow[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [reels, setReels] = useState<ModPostRow[]>([]);
  const [stories, setStories] = useState<StoryRow[]>([]);
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [reports, setReports] = useState<ReportRow[]>([]);

  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      setReels(seedReels());
      setStories(seedStories());
      setComments(seedComments());
      setReports(seedReports());
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    let mounted = true;
    api.adminGetAllPosts(1, 60)
      .then((res: ApiEnvelope) => {
        if (!mounted) return;
        const raw = (res?.data?.posts ?? res?.data?.items) as RawRow[] | undefined;
        if (Array.isArray(raw) && raw.length > 0) {
          setPosts(
            raw.map((p: RawRow) => ({
              id: String(p.id),
              content: String(p.content || p.text || "No content"),
              type: (String(p.type) === "VIDEO" ? "VIDEO" : (p.media as unknown[] | undefined)?.length ? "IMAGE" : "TEXT") as ModPostRow["type"],
              author: `@${(p.author as { username?: string } | undefined)?.username || (p.user as { username?: string } | undefined)?.username || "unknown"}`,
              createdAt: String(p.createdAt || new Date(0).toISOString()),
              reactions: Number(p.reactionsCount ?? p.reactionCount ?? 0),
              comments: Number(p._count?.comments ?? 0),
              status: "APPROVED",
            }))
          );
        } else {
          setPosts(seedModPosts());
        }
      })
      .catch(() => {
        if (!mounted) return;
        setPosts(seedModPosts());
      })
      .finally(() => mounted && setPostsLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  const canApprove = can(user?.role, "moderation.approve");
  const canDelete = can(user?.role, "moderation.delete");

  const audit = (action: string, label: string, resource: string, resourceId: string) => {
    addAuditAction({
      action,
      actionLabel: label,
      adminName: user?.username || "admin",
      role: user?.role || "ADMIN",
      timestamp: new Date().toISOString(),
      ipAddress: "127.0.0.1",
      resource,
      resourceId,
    });
  };

  const setStatus = (list: "posts" | "reels" | "stories" | "comments" | "reports", id: string, status: string) => {
    if (list === "posts") setPosts((prev) => prev.map((x) => (x.id === id ? { ...x, status: status as ModPostRow["status"] } : x)));
    if (list === "reels") setReels((prev) => prev.map((x) => (x.id === id ? { ...x, status: status as ModPostRow["status"] } : x)));
    if (list === "stories") setStories((prev) => prev.map((x) => (x.id === id ? { ...x, status: status as StoryRow["status"] } : x)));
    if (list === "comments") setComments((prev) => prev.map((x) => (x.id === id ? { ...x, status: status as CommentRow["status"] } : x)));
    if (list === "reports") setReports((prev) => prev.map((x) => (x.id === id ? { ...x, status: status as ReportRow["status"] } : x)));
  };

  const remove = (list: "posts" | "reels" | "stories" | "comments" | "reports", id: string) => {
    if (list === "posts") setPosts((prev) => prev.filter((x) => x.id !== id));
    if (list === "reels") setReels((prev) => prev.filter((x) => x.id !== id));
    if (list === "stories") setStories((prev) => prev.filter((x) => x.id !== id));
    if (list === "comments") setComments((prev) => prev.filter((x) => x.id !== id));
    if (list === "reports") setReports((prev) => prev.filter((x) => x.id !== id));
  };

  const counts = useMemo(
    () => ({
      posts: posts.filter((p) => p.status === "PENDING").length,
      reels: reels.filter((p) => p.status === "PENDING").length,
      stories: stories.filter((s) => s.status === "PENDING").length,
      comments: comments.filter((c) => c.status === "PENDING").length,
      reports: reports.filter((r) => r.status === "PENDING" || r.status === "REVIEWING").length,
    }),
    [posts, reels, stories, comments, reports]
  );

  const tabs = SUB_TABS.filter((t) => can(user?.role, t.perm) || can(user?.role, "moderation.view"));

  if (postsLoading && sub === "posts") return <AdminSkeleton rows={5} />;

  return (
    <div className="space-y-4">
      <SectionHeading
        icon={<ShieldAlert className="w-4 h-4 text-primary" />}
        title="Content Moderation"
        subtitle="Approve, reject or remove user-generated content"
      />
      <div className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setSub(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
              sub === t.id ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            {t.icon}
            {t.label}
            {counts[t.id] > 0 && (
              <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center">
                {counts[t.id]}
              </span>
            )}
          </button>
        ))}
      </div>

      {sub === "posts" && (
        <ModList
          rows={posts}
          resource="post"
          canApprove={canApprove}
          canDelete={canDelete}
          onApprove={(id) => { setStatus("posts", id, "APPROVED"); notify("Post approved", "success"); audit("APPROVE_POST", "Post approved", "post", id); }}
          onReject={(id) => { setStatus("posts", id, "REJECTED"); notify("Post rejected", "info"); audit("REJECT_POST", "Post rejected", "post", id); }}
          onDelete={(id) => { remove("posts", id); notify("Post removed", "success"); audit("DELETE_POST", "Post removed", "post", id); }}
          columns={["Content", "Author", "Reactions", "Comments", "Status", "Actions"]}
          contentKey="content"
        />
      )}
      {sub === "reels" && (
        <ModList
          rows={reels}
          resource="reel"
          canApprove={canApprove}
          canDelete={canDelete}
          onApprove={(id) => { setStatus("reels", id, "APPROVED"); notify("Reel approved", "success"); audit("APPROVE_REEL", "Reel approved", "reel", id); }}
          onReject={(id) => { setStatus("reels", id, "REJECTED"); notify("Reel rejected", "info"); audit("REJECT_REEL", "Reel rejected", "reel", id); }}
          onDelete={(id) => { remove("reels", id); notify("Reel removed", "success"); audit("DELETE_REEL", "Reel removed", "reel", id); }}
          columns={["Reel", "Author", "Reactions", "Comments", "Status", "Actions"]}
          contentKey="content"
        />
      )}
      {sub === "stories" && (
        <StoryList
          rows={stories}
          canApprove={canApprove}
          canDelete={canDelete}
          onApprove={(id) => { setStatus("stories", id, "APPROVED"); notify("Story approved", "success"); audit("APPROVE_STORY", "Story approved", "story", id); }}
          onReject={(id) => { setStatus("stories", id, "REJECTED"); notify("Story rejected", "info"); audit("REJECT_STORY", "Story rejected", "story", id); }}
          onDelete={(id) => { remove("stories", id); notify("Story removed", "success"); audit("DELETE_STORY", "Story removed", "story", id); }}
        />
      )}
      {sub === "comments" && (
        <CommentList
          rows={comments}
          canApprove={canApprove}
          canDelete={canDelete}
          onApprove={(id) => { setStatus("comments", id, "APPROVED"); notify("Comment approved", "success"); audit("APPROVE_COMMENT", "Comment approved", "comment", id); }}
          onReject={(id) => { setStatus("comments", id, "REJECTED"); notify("Comment rejected", "info"); audit("REJECT_COMMENT", "Comment rejected", "comment", id); }}
          onDelete={(id) => { remove("comments", id); notify("Comment removed", "success"); audit("DELETE_COMMENT", "Comment removed", "comment", id); }}
        />
      )}
      {sub === "reports" && (
        <ReportList
          rows={reports}
          onResolve={(id) => { setStatus("reports", id, "RESOLVED"); notify("Report resolved", "success"); audit("RESOLVE_REPORT", "Report resolved", "report", id); }}
          onReject={(id) => { setStatus("reports", id, "REJECTED"); notify("Report dismissed", "info"); audit("DISMISS_REPORT", "Report dismissed", "report", id); }}
        />
      )}
    </div>
  );
}

function ActionButtons({
  status,
  canApprove,
  canDelete,
  onApprove,
  onReject,
  onDelete,
}: {
  status: string;
  canApprove: boolean;
  canDelete: boolean;
  onApprove: () => void;
  onReject: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center justify-end gap-1">
      {canApprove && status === "PENDING" && (
        <button onClick={onApprove} className="p-1.5 rounded-lg text-muted-foreground hover:text-green-500 hover:bg-green-500/10 transition-all" title="Approve">
          <CheckCircle className="w-4 h-4" />
        </button>
      )}
      {canApprove && status === "PENDING" && (
        <button onClick={onReject} className="p-1.5 rounded-lg text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10 transition-all" title="Reject">
          <XCircle className="w-4 h-4" />
        </button>
      )}
      {canDelete && (
        <button onClick={onDelete} className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-all" title="Delete">
          <Trash2 className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

function ModList({
  rows,
  resource,
  canApprove,
  canDelete,
  onApprove,
  onReject,
  onDelete,
  columns,
  contentKey,
}: {
  rows: ModPostRow[];
  resource: string;
  canApprove: boolean;
  canDelete: boolean;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onDelete: (id: string) => void;
  columns: string[];
  contentKey: string;
}) {
  return (
    <div className="glass rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-muted-foreground text-xs">
              {columns.map((c) => (
                <th key={c} className={`p-3 font-medium ${c === "Actions" ? "text-right" : "text-left"}`}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                <td className="p-3 max-w-sm">
                  <p className="text-foreground truncate">{String((row as unknown as Record<string, unknown>)[contentKey])}</p>
                </td>
                <td className="p-3 text-muted-foreground whitespace-nowrap">{row.author}</td>
                <td className="p-3 text-muted-foreground">{row.reactions}</td>
                <td className="p-3 text-muted-foreground">{row.comments}</td>
                <td className="p-3"><StatusBadge status={row.status} /></td>
                <td className="p-3">
                  <ActionButtons status={row.status} canApprove={canApprove} canDelete={canDelete} onApprove={() => onApprove(row.id)} onReject={() => onReject(row.id)} onDelete={() => onDelete(row.id)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length === 0 && <EmptyRow text={`No ${resource}s in the queue`} />}
    </div>
  );
}

function StoryList({
  rows,
  canApprove,
  canDelete,
  onApprove,
  onReject,
  onDelete,
}: {
  rows: StoryRow[];
  canApprove: boolean;
  canDelete: boolean;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="glass rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-muted-foreground text-xs">
              <th className="text-left p-3 font-medium">Story</th>
              <th className="text-left p-3 font-medium">Author</th>
              <th className="text-left p-3 font-medium">Media</th>
              <th className="text-left p-3 font-medium">Views</th>
              <th className="text-left p-3 font-medium">Time</th>
              <th className="text-left p-3 font-medium">Status</th>
              <th className="text-right p-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => (
              <tr key={s.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                <td className="p-3 text-muted-foreground">{s.id.slice(0, 8)}…</td>
                <td className="p-3 text-muted-foreground whitespace-nowrap">{s.author}</td>
                <td className="p-3 text-muted-foreground">{s.mediaType === "VIDEO" ? "🎬 Video" : "🖼️ Image"}</td>
                <td className="p-3 text-muted-foreground">{s.views}</td>
                <td className="p-3 text-muted-foreground whitespace-nowrap">{timeAgo(s.createdAt)}</td>
                <td className="p-3"><StatusBadge status={s.status} /></td>
                <td className="p-3">
                  <ActionButtons status={s.status} canApprove={canApprove} canDelete={canDelete} onApprove={() => onApprove(s.id)} onReject={() => onReject(s.id)} onDelete={() => onDelete(s.id)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length === 0 && <EmptyRow text="No stories in the queue" />}
    </div>
  );
}

function CommentList({
  rows,
  canApprove,
  canDelete,
  onApprove,
  onReject,
  onDelete,
}: {
  rows: CommentRow[];
  canApprove: boolean;
  canDelete: boolean;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="glass rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-muted-foreground text-xs">
              <th className="text-left p-3 font-medium">Comment</th>
              <th className="text-left p-3 font-medium">Author</th>
              <th className="text-left p-3 font-medium">On post</th>
              <th className="text-left p-3 font-medium">Likes</th>
              <th className="text-left p-3 font-medium">Status</th>
              <th className="text-right p-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                <td className="p-3 max-w-xs">
                  <p className="text-foreground truncate">{c.content}</p>
                </td>
                <td className="p-3 text-muted-foreground whitespace-nowrap">{c.author}</td>
                <td className="p-3 text-muted-foreground truncate max-w-[160px]">{c.postTitle}</td>
                <td className="p-3 text-muted-foreground">{c.likes}</td>
                <td className="p-3"><StatusBadge status={c.status} /></td>
                <td className="p-3">
                  <ActionButtons status={c.status} canApprove={canApprove} canDelete={canDelete} onApprove={() => onApprove(c.id)} onReject={() => onReject(c.id)} onDelete={() => onDelete(c.id)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length === 0 && <EmptyRow text="No comments in the queue" />}
    </div>
  );
}

function ReportList({
  rows,
  onResolve,
  onReject,
}: {
  rows: ReportRow[];
  onResolve: (id: string) => void;
  onReject: (id: string) => void;
}) {
  return (
    <div className="glass rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-muted-foreground text-xs">
              <th className="text-left p-3 font-medium">Type</th>
              <th className="text-left p-3 font-medium">Reason</th>
              <th className="text-left p-3 font-medium">Target</th>
              <th className="text-left p-3 font-medium">Reporter</th>
              <th className="text-left p-3 font-medium">Time</th>
              <th className="text-left p-3 font-medium">Status</th>
              <th className="text-right p-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                <td className="p-3"><span className="px-2 py-0.5 rounded-md bg-primary/5 text-primary text-xs font-medium">{r.type}</span></td>
                <td className="p-3 text-foreground">{r.reason}</td>
                <td className="p-3 text-muted-foreground whitespace-nowrap">{r.targetLabel}</td>
                <td className="p-3 text-muted-foreground whitespace-nowrap">{r.reporter}</td>
                <td className="p-3 text-muted-foreground whitespace-nowrap">{timeAgo(r.timestamp)}</td>
                <td className="p-3"><StatusBadge status={r.status} /></td>
                <td className="p-3">
                  <div className="flex items-center justify-end gap-1">
                    {(r.status === "PENDING" || r.status === "REVIEWING") && (
                      <>
                        <button onClick={() => onResolve(r.id)} className="p-1.5 rounded-lg text-muted-foreground hover:text-green-500 hover:bg-green-500/10 transition-all" title="Resolve report">
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button onClick={() => onReject(r.id)} className="p-1.5 rounded-lg text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10 transition-all" title="Dismiss report">
                          <XCircle className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length === 0 && <EmptyRow text="No reports to review" />}
    </div>
  );
}
