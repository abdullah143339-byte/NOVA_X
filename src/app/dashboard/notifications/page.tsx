"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import { useAuth } from "@/providers/AuthProvider";
import {
  Bell,
  Heart,
  MessageCircle,
  UserPlus,
  Award,
  AtSign,
  Loader2,
  CheckCheck,
  Filter,
} from "lucide-react";

interface Notification {
  id: string;
  type: string;
  content?: string;
  title?: string;
  body?: string;
  isRead: boolean;
  createdAt: string;
  data?: any;
}

const typeIcons: Record<string, any> = {
  LIKE: Heart,
  COMMENT: MessageCircle,
  FOLLOW: UserPlus,
  ACHIEVEMENT: Award,
  MENTION: AtSign,
};

const typeColors: Record<string, string> = {
  LIKE: "text-red-500 bg-red-500/10",
  COMMENT: "text-blue-500 bg-blue-500/10",
  FOLLOW: "text-green-500 bg-green-500/10",
  ACHIEVEMENT: "text-amber-500 bg-amber-500/10",
  MENTION: "text-purple-500 bg-purple-500/10",
};

function timeAgo(dateStr: string) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const res = await api.getNotifications();
      const raw = res.data;
      const items = Array.isArray(raw)
        ? raw
        : Array.isArray(raw?.notifications)
          ? raw.notifications
          : Array.isArray(raw?.items)
            ? raw.items
            : [];
      setNotifications(items);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const markAllRead = async () => {
    try { await api.markAllNotificationsRead(); } catch {}
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const markRead = async (id: string) => {
    try { await api.markNotificationRead(id); } catch {}
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  };

  const filtered = filter === "unread" ? notifications.filter((n) => !n.isRead) : notifications;
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {unreadCount > 0 ? `${unreadCount} unread notifications` : "You're all caught up!"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="flex items-center gap-1.5 h-9 px-3 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Mark all read
            </button>
          )}
          <button
            onClick={() => setFilter(filter === "all" ? "unread" : "all")}
            className={cn(
              "flex items-center gap-1.5 h-9 px-3 rounded-lg text-xs transition-all",
              filter === "unread" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
            )}
          >
            <Filter className="w-3.5 h-3.5" />
            {filter === "all" ? "Unread" : "All"}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 glass rounded-2xl">
          <Bell className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-lg font-medium text-foreground">No notifications</p>
          <p className="text-sm text-muted-foreground mt-1">When something happens, you&apos;ll see it here</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((notif) => {
            const Icon = typeIcons[notif.type] || Bell;
            const colorClass = typeColors[notif.type] || "text-muted-foreground bg-muted";

            return (
              <button
                key={notif.id}
                onClick={() => !notif.isRead && markRead(notif.id)}
                className={cn(
                  "w-full flex items-start gap-3 p-4 rounded-xl text-left transition-all hover:bg-muted/50",
                  !notif.isRead && "glass"
                )}
              >
                <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0", colorClass)}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn("text-sm", !notif.isRead ? "text-foreground font-medium" : "text-muted-foreground")}>
                    {notif.content || notif.body || notif.title || ""}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{timeAgo(notif.createdAt)}</p>
                </div>
                {!notif.isRead && (
                  <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
