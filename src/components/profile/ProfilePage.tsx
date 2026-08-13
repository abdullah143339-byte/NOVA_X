"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { SlidersHorizontal, FileDown, Printer, RefreshCw, AlertTriangle } from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/providers/AuthProvider";
import { useProfile } from "./ProfileProvider";
import ProfileHeader from "./ProfileHeader";
import ProfileTabs from "./ProfileTabs";
import { ProfileSkeleton } from "./ProfileSkeleton";
import EditProfileModal from "./EditProfileModal";
import AiPanel from "./AiPanel";
import CustomizeModal from "./CustomizeModal";
import ShareProfileModal from "./ShareProfileModal";
import PostsTab from "./PostsTab";
import ReelsTab from "./ReelsTab";
import MediaTab from "./MediaTab";
import SavedTab from "./SavedTab";
import MarketplaceTab from "./MarketplaceTab";
import CommunitiesTab from "./CommunitiesTab";
import ProjectsTab from "./ProjectsTab";
import AboutTab from "./AboutTab";
import { parseTags, parseJsonArray, getProfileThemes, getCreatorLevel } from "./data";
import type {
  CertificationItem,
  CommunityItem,
  EducationItem,
  ExperienceItem,
  MarketItem,
  PostData,
  PostMedia,
  ProfilePayload,
  ProfileTabDef,
  ReputationData,
} from "./types";
import { cn } from "@/lib/utils";

type RawPost = Record<string, unknown>;

function parseItems<T>(raw: string | null | undefined): T[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

interface RawCommunity {
  id: string;
  name?: string;
  title?: string;
  slug?: string;
  description?: string;
  category?: string;
  icon?: string;
  image?: string;
  membersCount?: number;
  memberCount?: number;
  isMember?: boolean;
  isOwner?: boolean;
  isModerator?: boolean;
  ownerId?: string;
  owner?: { id: string };
  _count?: { members?: number };
}

function normalizeCommunity(c: RawCommunity): CommunityItem {
  return {
    id: String(c.id),
    name: c.name || c.title,
    title: c.name || c.title,
    slug: c.slug,
    description: c.description,
    category: c.category,
    memberCount: c.membersCount ?? c.memberCount ?? c._count?.members ?? 0,
    ownerId: c.ownerId,
    role: c.isOwner ? "OWNER" : c.isModerator ? "MODERATOR" : "MEMBER",
  };
}

function normalizePost(p: RawPost, isSaved = false): PostData {
  let media: PostMedia[] = [];
  const rawMedia = p.media;
  if (Array.isArray(rawMedia)) media = rawMedia as PostMedia[];
  else if (typeof rawMedia === "string") {
    try {
      const parsed = JSON.parse(rawMedia);
      media = Array.isArray(parsed) ? (parsed as PostMedia[]) : [{ url: rawMedia, type: String(p.type ?? "TEXT") }];
    } catch {
      media = [{ url: rawMedia, type: String(p.type ?? "TEXT") }];
    }
  }
  const count = (p._count ?? {}) as { comments?: number; postReactions?: number };
  const base = p as unknown as PostData;
  return {
    ...base,
    media,
    likeCount: Number(p.likesCount ?? p.reactionsCount ?? count.postReactions ?? 0),
    commentCount: Number(p.commentsCount ?? count.comments ?? 0),
    isBookmarked: Boolean(p.isBookmarked ?? isSaved),
  };
}

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const { prefs, notify } = useProfile();
  const router = useRouter();

  const [profile, setProfile] = useState<ProfilePayload | null>(null);
  const [reputation, setReputation] = useState<ReputationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("posts");

  const [userPosts, setUserPosts] = useState<PostData[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [savedPosts, setSavedPosts] = useState<PostData[]>([]);
  const [savedLoading, setSavedLoading] = useState(false);
  const [marketItems, setMarketItems] = useState<MarketItem[]>([]);
  const [marketLoading, setMarketLoading] = useState(false);
  const [communities, setCommunities] = useState<{ owned: CommunityItem[]; joined: CommunityItem[] }>({ owned: [], joined: [] });
  const [communitiesLoading, setCommunitiesLoading] = useState(true);

  const [aiOpen, setAiOpen] = useState(false);
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const isOwner = !!user && !!profile && user.username === profile.username;

  const loadProfile = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const [pRes, rRes] = await Promise.all([
        api.getUserProfile(user.username).catch(() => null),
        api.getUserReputation(user.id).catch(() => null),
      ]);
      if (pRes?.data) {
        setProfile(pRes.data as ProfilePayload);
        setReputation(rRes?.data ?? null);
      } else {
        setError("Could not load profile data");
      }
    } catch {
      setError("Failed to load profile. Check your connection.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  const loadPosts = useCallback(async () => {
    if (!user) return;
    setPostsLoading(true);
    try {
      const res = await api.getUserPosts(user.id);
      const raw = res?.data;
      const items = Array.isArray(raw) ? raw : raw?.posts || [];
      setUserPosts(items.map((p: RawPost) => normalizePost(p)));
    } catch {
      setUserPosts([]);
    } finally {
      setPostsLoading(false);
    }
  }, [user]);

  const loadSaved = useCallback(async () => {
    if (!user) return;
    setSavedLoading(true);
    try {
      const res = await api.getMyBookmarks();
      const raw = res?.data;
      const items = Array.isArray(raw) ? raw : raw?.items || [];
      setSavedPosts(items.map((b: RawPost) => {
        const p = (b.post as RawPost) || b;
        return { ...normalizePost(p, true), savedAt: b.createdAt };
      }));
    } catch {
      setSavedPosts([]);
    } finally {
      setSavedLoading(false);
    }
  }, [user]);

  const loadMarket = useCallback(async () => {
    if (!user) return;
    setMarketLoading(true);
    try {
      const res = await api.getMarketplaceItems(1);
      const raw = res?.data;
      const items = Array.isArray(raw) ? raw : raw?.items || raw?.data || [];
      setMarketItems(items.filter((i: RawPost) => String(i.sellerId) === user.id));
    } catch {
      setMarketItems([]);
    } finally {
      setMarketLoading(false);
    }
  }, [user]);

  const loadCommunities = useCallback(async () => {
    if (!user) return;
    setCommunitiesLoading(true);
    try {
      const res = await api.getCommunities(1);
      const raw = res?.data;
      const list = (
        Array.isArray(raw)
          ? raw
          : Array.isArray(raw?.communities)
            ? raw.communities
            : Array.isArray(raw?.items)
              ? raw.items
              : []
      ) as RawCommunity[];
      const owned = list
        .filter((c) => String(c.ownerId ?? c.owner?.id ?? "") === String(user.id))
        .map(normalizeCommunity);
      const joined = list
        .filter((c) => c.isMember && String(c.ownerId ?? c.owner?.id ?? "") !== String(user.id))
        .map(normalizeCommunity);
      setCommunities({ owned, joined });
    } catch {
      setCommunities({ owned: [], joined: [] });
    } finally {
      setCommunitiesLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const t = window.setTimeout(() => {
      loadProfile();
      loadPosts();
      loadCommunities();
    }, 0);
    return () => window.clearTimeout(t);
  }, [user, loadProfile, loadPosts, loadCommunities]);

  useEffect(() => {
    if (!user) return;
    const t = window.setTimeout(() => {
      if (activeTab === "saved") loadSaved();
      if (activeTab === "market") loadMarket();
    }, 0);
    return () => window.clearTimeout(t);
  }, [user, activeTab, loadSaved, loadMarket]);

  const reloadProfile = useCallback(async () => {
    if (!user) return;
    try {
      const res = await api.getUserProfile(user.username);
      if (res?.data) setProfile(res.data as ProfilePayload);
    } catch {}
  }, [user]);

  const displayName = profile?.displayName || user?.displayName || [user?.firstName, user?.lastName].filter(Boolean).join(" ") || profile?.username || user?.username || "";
  const initials =
    (profile?.displayName || displayName)
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join("") || (profile?.username || "N").slice(0, 2).toUpperCase();

  const theme = getProfileThemes().find((t) => t.id === prefs.theme) ?? getProfileThemes()[0];
  const accent = prefs.accentColor;
  const tier = getCreatorLevel(reputation?.totalScore ?? 0);

  const reelPosts = userPosts.filter((p) => p.type === "VIDEO");
  const projectPosts = userPosts.filter((p) => parseTags(p.tags).includes("project"));
  const followersCount = profile?._count?.followers ?? profile?.profile?.followersCount ?? 0;

  const meta = profile?.profile;
  const skills = parseJsonArray(meta?.skills);
  const interests = parseJsonArray(meta?.interests);
  const languages = parseJsonArray(meta?.languages);
  const experience = parseItems<ExperienceItem>(meta?.experience);
  const education = parseItems<EducationItem>(meta?.education);
  const certifications: CertificationItem[] = [];

  const counts = {
    posts: userPosts.length,
    reels: reelPosts.length,
    communities: communities.owned.length + communities.joined.length,
    market: marketItems.length,
    followers: followersCount,
    following: profile?._count?.following ?? profile?.profile?.followingCount ?? 0,
  };

  const tabs: ProfileTabDef[] = [
    { id: "posts", label: "Posts", icon: "📝" },
    { id: "reels", label: "Reels", icon: "🎬" },
    { id: "media", label: "Media", icon: "🖼️" },
    ...(isOwner ? [{ id: "saved", label: "Saved", icon: "🔖" }] : []),
    { id: "market", label: "Marketplace", icon: "🛍️" },
    { id: "communities", label: "Communities", icon: "👥" },
    { id: "projects", label: "Projects", icon: "🚀" },
    { id: "about", label: "About", icon: "ℹ️" },
  ];

  const handlePostCreated = useCallback((post: PostData) => {
    setUserPosts((prev) => [post, ...prev]);
  }, []);

  const handleDeletePost = useCallback(async (id: string) => {
    if (!window.confirm("Delete this post?")) return;
    try {
      await api.deletePost(id);
      setUserPosts((prev) => prev.filter((p) => p.id !== id));
      setSavedPosts((prev) => prev.filter((p) => p.id !== id));
      notify("Post deleted");
    } catch {
      notify("Failed to delete post", "error");
    }
  }, [notify]);

  const handleToggleBookmark = useCallback(async (id: string) => {
    setUserPosts((prev) => prev.map((p) => (p.id === id ? { ...p, isBookmarked: !p.isBookmarked } : p)));
    try {
      await api.toggleBookmark(id);
      if (activeTab === "saved") loadSaved();
    } catch {
      setUserPosts((prev) => prev.map((p) => (p.id === id ? { ...p, isBookmarked: !p.isBookmarked } : p)));
      notify("Failed to update bookmark", "error");
    }
  }, [activeTab, loadSaved, notify]);

  const handleFollow = useCallback(async () => {
    if (!profile) return;
    try {
      await api.followUser(profile.id);
      notify(`Following @${profile.username}`);
    } catch {
      notify("Could not follow right now", "error");
    }
  }, [profile, notify]);

  const handleMessage = useCallback(() => {
    router.push("/dashboard/messages");
  }, [router]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const up = await api.uploadFile(file, "avatar");
      await api.updateProfile({ avatar: up.data.url });
      notify("Avatar updated");
      if (refreshUser) await refreshUser();
      await reloadProfile();
    } catch {
      notify("Failed to upload avatar", "error");
    }
  };

  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const up = await api.uploadFile(file, "cover");
      await api.updateProfile({ coverImage: up.data.url });
      notify("Cover updated");
      await reloadProfile();
    } catch {
      notify("Failed to upload cover", "error");
    }
  };

  const handleProfileSaved = useCallback((updates: { firstName?: string; lastName?: string; displayName?: string; bio?: string; location?: string; website?: string }) => {
    setProfile((prev) => {
      if (!prev) return prev;
      const nextDisplay = updates.displayName?.trim() || [updates.firstName, updates.lastName].filter(Boolean).join(" ").trim() || prev.displayName;
      return {
        ...prev,
        displayName: nextDisplay,
        bio: updates.bio !== undefined ? updates.bio : prev.bio,
        location: updates.location !== undefined ? updates.location : prev.location,
        website: updates.website !== undefined ? updates.website : prev.website,
      };
    });
    if (refreshUser) refreshUser();
  }, [refreshUser]);

  const exportPortfolio = () => {
    if (!profile) return;
    const parts = [
      `${displayName} (@${profile.username})`,
      `Tier: ${tier.tier} · Level ${reputation?.level ?? 1}`,
      `Reputation: ${reputation?.totalScore ?? 0}`,
      "",
      `Bio: ${profile.bio || "—"}`,
      `Headline: ${profile.profile?.headline || "—"}`,
      `Location: ${profile.location || "—"}`,
      `Website: ${profile.website || "—"}`,
      "",
      `Skills: ${skills.join(", ")}`,
      "",
      "Experience:",
      ...experience.flatMap((x) => [`  • ${x.role} @ ${x.company} (${x.period})`, `    ${x.description}`]),
      "",
      "Education:",
      ...education.map((x) => `  • ${x.degree} @ ${x.school} (${x.period})`),
      "",
      "Certifications:",
      ...certifications.map((x) => `  • ${x.name} (${x.issuer}, ${x.year})`),
      "",
      `Posts: ${userPosts.length} · Reels: ${reelPosts.length} · Communities: ${counts.communities} · Market items: ${marketItems.length}`,
    ].join("\n");
    const blob = new Blob([parts], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${profile.username}-portfolio.txt`;
    a.click();
    URL.revokeObjectURL(url);
    notify("Portfolio exported");
  };

  const renderTab = () => {
    switch (activeTab) {
      case "posts":
        return (
          <PostsTab
            posts={userPosts}
            loading={postsLoading}
            isOwner={isOwner}
            currentUser={{ id: user?.id ?? "", username: user?.username ?? "", firstName: user?.firstName, lastName: user?.lastName, avatar: user?.avatar }}
            notify={notify}
            onPostCreated={handlePostCreated}
            onDelete={handleDeletePost}
            onToggleBookmark={handleToggleBookmark}
          />
        );
      case "reels":
        return <ReelsTab reels={reelPosts} isOwner={isOwner} onDelete={handleDeletePost} />;
      case "media":
        return <MediaTab posts={userPosts} layout={prefs.layout} />;
      case "saved":
        return <SavedTab posts={savedPosts} loading={savedLoading} currentUserId={user?.id ?? ""} notify={notify} onToggleBookmark={handleToggleBookmark} />;
      case "market":
        return <MarketplaceTab items={marketItems} loading={marketLoading} isOwner={isOwner} />;
      case "communities":
        return <CommunitiesTab joined={communities.joined} owned={communities.owned} loading={communitiesLoading} />;
      case "projects":
        return <ProjectsTab projectPosts={projectPosts} loading={loading} />;
      case "about":
        return (
          <AboutTab
            profile={profile!}
            aboutText={profile?.profile?.about || ""}
            skills={skills}
            interests={interests}
            languages={languages}
            experience={experience}
            education={education}
            certifications={certifications}
          />
        );
      default:
        return null;
    }
  };

  if (loading && !profile) return <ProfileSkeleton />;

  if (error && !profile) {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center py-20 glass rounded-2xl">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-7 h-7 text-red-400" />
        </div>
        <p className="text-foreground font-semibold">Couldn&apos;t load this profile</p>
        <p className="text-sm text-muted-foreground mt-1">{error}</p>
        <button
          onClick={() => { loadProfile(); loadPosts(); }}
          className="mt-5 inline-flex items-center gap-2 h-9 px-4 rounded-xl bg-gradient-primary text-white text-xs font-medium hover:shadow-lg hover:shadow-primary/25 transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Retry
        </button>
      </motion.div>
    );
  }

  if (!profile) return null;

  return (
    <div className="space-y-5">
      <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
      <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />

      <ProfileHeader
        profile={profile}
        reputation={reputation ?? undefined}
        counts={counts}
        isOwner={isOwner}
        onFollow={handleFollow}
        onMessage={handleMessage}
        onShare={() => setShareOpen(true)}
        onEdit={() => setEditOpen(true)}
        onAi={() => setAiOpen(true)}
        onEditAvatar={() => avatarInputRef.current?.click()}
        onEditCover={() => coverInputRef.current?.click()}
        gradient={theme.gradient}
        accent={accent}
        initials={initials}
        displayName={displayName}
      />

      {isOwner && (
        <div className="glass rounded-2xl px-4 py-3 flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setCustomizeOpen(true)}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-muted text-xs font-medium text-foreground hover:bg-muted/70 transition-all"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" /> Customize
            </button>
            <button
              onClick={exportPortfolio}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-muted text-xs font-medium text-foreground hover:bg-muted/70 transition-all"
              title="Download portfolio"
            >
              <FileDown className="w-3.5 h-3.5" /> Export
            </button>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-muted text-xs font-medium text-foreground hover:bg-muted/70 transition-all"
              title="Export as PDF"
            >
              <Printer className="w-3.5 h-3.5" /> PDF
            </button>
          </div>
        </div>
      )}

      <div className="glass rounded-2xl p-3">
        <ProfileTabs tabs={tabs} active={activeTab} onChange={setActiveTab} ownerOnly={isOwner} />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18 }}
          className={cn("min-h-[200px]")}
        >
          {renderTab()}
        </motion.div>
      </AnimatePresence>

      <EditProfileModal open={editOpen} onClose={() => setEditOpen(false)} profile={profile} notify={notify} onSaved={handleProfileSaved} />
      <AiPanel
        open={aiOpen}
        onClose={() => setAiOpen(false)}
        displayName={displayName}
        username={profile.username}
        bio={profile.bio}
        profileAbout={profile.profile?.about}
        skillsRaw={profile.profile?.skills}
        tier={tier.tier}
        totalScore={reputation?.totalScore ?? 0}
        postsCount={userPosts.length}
        accent={accent}
        notify={notify}
      />
      <CustomizeModal open={customizeOpen} onClose={() => setCustomizeOpen(false)} />
      <ShareProfileModal open={shareOpen} onClose={() => setShareOpen(false)} username={profile.username} accent={accent} notify={notify} />
    </div>
  );
}
