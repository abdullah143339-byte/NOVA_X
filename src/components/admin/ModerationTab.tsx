"use client";

import { useEffect, useMemo, useState } from "react";
import { FileText, Video, Image as ImageIcon, MessageSquare, Flag, CheckCircle, XCircle, Trash2, ShieldAlert } from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";
import api from "@/lib/api";
import { useAdmin } from "./AdminProvider";
import { SectionHeading, StatusBadge, EmptyRow, AdminSkeleton } from "./AdminShared";
import { timeAgo, can } from "./data";
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
  const [loading, setLoading] = useState(true);
  const [reels, setReels] = useState<ModPostRow[]>([]);
  const [stories, setStories] = useState<StoryRow[]>([]);
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [reports, setReports] = useState<ReportRow[]>([]);

  useEffect(() => {
    let mounted = true;
    Promise.all([api.adminGetAllPosts(1, 60), api.adminGetReels(1, 60), api.adminGetStories(1, 60), api.adminGetComments(1, 60), api.adminGetReports(1, 60)])
      .then(([postsRes, reelsRes, storiesRes, commentsRes, reportsRes]: ApiEnvelope[]) => {
        if (!mounted) return;
        const rawPosts = (postsRes?.data?.posts ?? postsRes?.data?.items) as RawRow[] | undefined;
        setPosts(
          (rawPosts ?? []).map((p: RawRow) => ({
            id: String(p.id),
            content: String(p.content || p.title || "No content"),
            type: (String(p.type) === "VIDEO" ? "VIDEO" : (p.media as unknown[] | undefined)?.length ? "IMAGE" : "TEXT") as ModPostRow["type"],
            author: `@${(p.author as { username?: string } | undefined)?.username || (p.user as { username?: string } | undefined)?.username || "unknown"}`,
            createdAt: String(p.createdAt || new Date(0).toISOString()),
            reactions: Number(p.reactionsCount ?? p.reactionCount ?? 0),
            comments: Number(p._count?.comments ?? p.commentsCount ?? 0),
            status: "APPROVED",
          }))
        );
        const rawReels = (reelsRes?.data?.reels ?? reelsRes?.data?.items) as RawRow[] | undefined;
        setReels(
          (rawReels ?? []).map((p: RawRow) => ({
            id: String(p.id),
            content: String(p.content || p.title || "No content"),
            type: "VIDEO" as const,
            author: `@${(p.author as { username?: string } | undefined)?.username || "unknown"}`,
            createdAt: String(p.createdAt || new Date(0).toISOString()),
            reactions: Number(p.reactionsCount ?? p.reactionCount ?? 0),
            comments: Number(p._count?.comments ?? p.commentsCount ?? 0),
            status: "APPROVED",
          }))
        );
        const rawStories = (storiesRes?.data?.stories ?? storiesRes?.data?.items) as RawRow[] | undefined;
        setStories(
          (rawStories ?? []).map((s: RawRow) => ({
            id: String(s.id),
            author: `@${(s.author as { username?: string } | undefined)?.username || "unknown"}`,
            mediaType: (String(s.type) === "VIDEO" ? "VIDEO" : "IMAGE") as StoryRow["mediaType"],
            createdAt: String(s.createdAt || new Date(0).toISOString()),
            views: Number(s.viewCount ?? s.views ?? 0),
            status: "APPROVED",
          }))
        );
        const rawComments = (commentsRes?.data?.comments ?? commentsRes?.data?.items) as RawRow[] | undefined;
        setComments(
          (rawComments ?? []).map((c: RawRow) => ({
            id: String(c.id),
            author: `@${(c.author as { username?: string } | undefined)?.username || "unknown"}`,
            content: String(c.content || "No content"),
            postTitle: String((c.post as { content?: string } | undefined)?.content || "Post").slice(0, 42),
            createdAt: String(c.createdAt || new Date(0).toISOString()),
            likes: Number(c.reactionsCount ?? 0),
            status: "APPROVED",
          }))
        );
        const rawReports = (reportsRes?.data?.reports ?? reportsRes?.data?.items) as RawRow[] | undefined;
        setReports(
          (rawReports ?? []).map((r: RawRow) => ({
            id: String(r.id),
            type: (String(r.targetType || "POST").toUpperCase()) as ReportRow["type"],
            reason: String(r.reason || r.description || "No reason").replace(/_/g, " "),
            targetLabel: String(r.targetId || "—").slice(0, 24),
            reporter: r.reporterUsername ? `@${String(r.reporterUsername)}` : String(r.reporterId || "system").slice(0, 8),
            timestamp: String(r.createdAt || new Date(0).toISOString()),
            status: (String(r.status || "PENDING") === "UNDER_REVIEW" ? "REVIEWING" : String(r.status || "PENDING") === "DISMISSED" ? "REJECTED" : String(r.status || "PENDING")) as ReportRow["status"],
          }))
        );
      })
      .catch(() => {
        if (!mounted) return;
      })
      .finally(() => mounted && setLoading(false));
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

  const run = async (fn: () => Promise<unknown>, failMsg: string) => {
    try {
      await fn();
      return true;
    } catch {
      notify(failMsg, "error");
      return false;
    }
  };

  const approve = async (list: SubTab, id: string) => {
    if (list === "comments") {
      setStatus(list, id, "APPROVED");
      notify("Comment approved", "success");
      return;
    }
    const ok = await run(() => api.adminPublishPost(id), "Could not approve content");
    if (ok) {
      setStatus(list, id, "APPROVED");
      notify("Content approved", "success");
      audit("APPROVE_CONTENT", "Content approved", list === "posts" ? "post" : list === "reels" ? "reel" : "story", id);
    }
  };

  const reject = async (list: SubTab, id: string) => {
    if (list === "comments") {
      setStatus(list, id, "REJECTED");
      notify("Comment rejected", "info");
      return;
    }
    const ok = await run(() => api.adminDeletePost(id), "Could not reject content");
    if (ok) {
      remove(list, id);
      notify("Content rejected", "info");
      audit("REJECT_CONTENT", "Content rejected", list === "posts" ? "post" : list === "reels" ? "reel" : "story", id);
    }
  };

  const deleteContent = async (list: SubTab, id: string) => {
    const ok = await run(
      () => (list === "comments" ? api.adminDeleteComment(id) : api.adminDeletePost(id)),
      "Could not remove content"
    );
    if (ok) {
      remove(list, id);
      notify("Content removed", "success");
      audit("DELETE_CONTENT", "Content removed", list === "posts" ? "post" : list === "reels" ? "reel" : list === "stories" ? "story" : "comment", id);
    }
  };

  const resolve = async (id: string) => {
    const ok = await run(() => api.adminResolveReport(id, "Action taken"), "Could not resolve report");
    if (ok) {
      setStatus("reports", id, "RESOLVED");
      notify("Report resolved", "success");
      audit("RESOLVE_REPORT", "Report resolved", "report", id);
    }
  };

  const dismiss = async (id: string) => {
    const ok = await run(() => api.adminDismissReport(id), "Could not dismiss report");
    if (ok) {
      setStatus("reports", id, "REJECTED");
      notify("Report dismissed", "info");
      audit("DISMISS_REPORT", "Report dismissed", "report", id);
    }
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

  if (loading && sub === "posts") return <AdminSkeleton rows={5} />;

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
          onApprove={(id) => approve("posts", id)}
          onReject={(id) => reject("posts", id)}
          onDelete={(id) => deleteContent("posts", id)}
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
          onApprove={(id) => approve("reels", id)}
          onReject={(id) => reject("reels", id)}
          onDelete={(id) => deleteContent("reels", id)}
          columns={["Reel", "Author", "Reactions", "Comments", "Status", "Actions"]}
          contentKey="content"
        />
      )}
      {sub === "stories" && (
        <StoryList
          rows={stories}
          canApprove={canApprove}
          canDelete={canDelete}
          onApprove={(id) => approve("stories", id)}
          onReject={(id) => reject("stories", id)}
          onDelete={(id) => deleteContent("stories", id)}
        />
      )}
      {sub === "comments" && (
        <CommentList
          rows={comments}
          canApprove={canApprove}
          canDelete={canDelete}
          onApprove={(id) => approve("comments", id)}
          onReject={(id) => reject("comments", id)}
          onDelete={(id) => deleteContent("comments", id)}
        />
      )}
      {sub === "reports" && (
        <ReportList
          rows={reports}
          onResolve={(id) => resolve(id)}
          onReject={(id) => dismiss(id)}
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
