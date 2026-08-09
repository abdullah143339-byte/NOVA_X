"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Users, UserPlus } from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/providers/AuthProvider";
import FollowersList from "./FollowersList";

export default function FollowersPageView({ mode }: { mode: "followers" | "following" }) {
  const { user } = useAuth();
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let active = true;
    (async () => {
      try {
        const res = await api.getUserProfile(user.username);
        const data = res?.data;
        if (!active) return;
        if (mode === "followers") setCount(data?._count?.followers ?? data?.profile?.followersCount ?? 0);
        else setCount(data?._count?.following ?? data?.profile?.followingCount ?? 0);
      } catch {
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [user, mode]);

  const title = mode === "followers" ? "Followers" : "Following";
  const icon = mode === "followers" ? <Users className="w-5 h-5 text-primary" /> : <UserPlus className="w-5 h-5 text-primary" />;

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div>
        <Link href="/dashboard/profile" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to profile
        </Link>
        <h1 className="text-xl font-bold text-foreground mt-3 flex items-center gap-2">
          {icon} {title}
        </h1>
      </div>
      <FollowersList seed={user?.username || "nova"} count={count} mode={mode} isOwner loading={loading || !user} />
    </div>
  );
}
