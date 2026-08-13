"use client";

import { MapPin, Calendar, Globe, Briefcase, Users, UserPlus, UserCheck, Send, Share2, Sparkles, PenLine, MessageCircle, ShoppingBag, Package } from "lucide-react";
import { motion } from "framer-motion";
import Button from "@/components/ui/Button";
import { useProfile } from "./ProfileProvider";
import AnimatedCover from "./AnimatedCover";
import Avatar3D from "./Avatar3D";
import CreatorBadge from "./CreatorBadge";
import ScoreRing from "./ScoreRing";
import { formatCount, formatJoined, getAiTrustScore, getCreatorLevel, computeCompletion } from "./data";
import type { ProfilePayload, ReputationData } from "./types";

interface ProfileHeaderProps {
  profile: ProfilePayload;
  reputation?: ReputationData;
  counts: { posts: number; reels: number; communities: number; market: number; followers: number; following: number };
  isOwner: boolean;
  isFollowing?: boolean;
  onFollow: () => void;
  onMessage: () => void;
  onShare: () => void;
  onEdit: () => void;
  onAi: () => void;
  onEditAvatar: () => void;
  onEditCover: () => void;
  onViewList?: (kind: "followers" | "following") => void;
  gradient: string;
  accent: string;
  initials: string;
  displayName: string;
}

export default function ProfileHeader({
  profile,
  reputation,
  counts,
  isOwner,
  isFollowing = false,
  onFollow,
  onMessage,
  onShare,
  onEdit,
  onAi,
  onEditAvatar,
  onEditCover,
  onViewList,
  gradient,
  accent,
  initials,
  displayName,
}: ProfileHeaderProps) {
  const { isRemoved } = useProfile();
  const followed = isFollowing;
  const removed = isRemoved(profile.id);
  const tier = getCreatorLevel(reputation?.totalScore ?? 0);
  const aiTrust = getAiTrustScore(reputation);
  const completion = computeCompletion({
    bio: profile.bio,
    location: profile.location,
    website: profile.website,
    coverImage: profile.coverImage,
    avatar: profile.avatar,
  });

  const stats: { label: string; value: number }[] = [
    { label: "Followers", value: removed ? 0 : counts.followers },
    { label: "Following", value: counts.following },
    { label: "Posts", value: counts.posts },
    { label: "Reels", value: counts.reels },
    { label: "Communities", value: counts.communities },
    { label: "Market", value: counts.market },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass rounded-2xl overflow-hidden"
    >
      <div className="relative h-36 sm:h-44">
        <AnimatedCover image={profile.coverImage} gradient={gradient} accent={accent} />
        {isOwner && (
          <button
            onClick={onEditCover}
            aria-label="Change cover"
            className="absolute top-3 right-3 z-10 inline-flex items-center gap-1.5 px-3 h-8 rounded-lg bg-black/40 text-white text-xs font-medium hover:bg-black/60 backdrop-blur transition-all"
          >
            <PenLine className="w-3.5 h-3.5" /> Change Cover
          </button>
        )}
      </div>

      <div className="px-5 sm:px-8 pb-6">
        <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12 sm:-mt-14">
          <div className="relative z-10 shrink-0">
            <Avatar3D src={profile.avatar} initials={initials} accent={accent} editable={isOwner} onEdit={onEditAvatar} />
          </div>
          <div className="flex-1 min-w-0 pb-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-foreground truncate">{displayName}</h1>
              <CreatorBadge verified tier={tier.tier} tierColor={tier.color} tierEmoji={tier.emoji} />
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">@{profile.username}</p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-3 text-xs text-muted-foreground">
              {profile.profile?.headline && (
                <span className="inline-flex items-center gap-1.5"><Briefcase className="w-3.5 h-3.5 text-primary" /> {profile.profile.headline}</span>
              )}
              {profile.location && (
                <span className="inline-flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-primary" /> {profile.location}</span>
              )}
              {profile.website && (
                <a
                  href={profile.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 hover:underline"
                >
                  <Globe className="w-3.5 h-3.5 text-primary" /> <span className="text-primary truncate max-w-[180px]">{profile.website.replace(/^https?:\/\//, "")}</span>
                </a>
              )}
              <span className="inline-flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-primary" /> Joined {formatJoined(profile.createdAt)}</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {isOwner ? (
              <>
                <Button size="sm" onClick={onEdit}><PenLine className="w-3.5 h-3.5" /> Edit Profile</Button>
                <Button size="sm" variant="secondary" onClick={onAi}><Sparkles className="w-3.5 h-3.5 text-primary" /> AI Assist</Button>
              </>
            ) : (
              <>
                <Button size="sm" variant={followed ? "secondary" : "primary"} onClick={onFollow}>
                  {followed ? <UserCheck className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
                  {followed ? "Following" : "Follow"}
                </Button>
                <Button size="sm" variant="secondary" onClick={onMessage}><Send className="w-3.5 h-3.5" /> Message</Button>
              </>
            )}
            <Button size="sm" variant="ghost" onClick={onShare} aria-label="Share profile"><Share2 className="w-3.5 h-3.5" /></Button>
          </div>
        </div>

        {profile.bio && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} className="text-sm text-foreground/90 mt-4 max-w-2xl leading-relaxed">
            {profile.bio}
          </motion.p>
        )}

        <div className="flex flex-wrap items-center gap-x-5 gap-y-3 mt-5">
          <button
            onClick={() => onViewList?.("followers")}
            className="inline-flex items-center gap-1.5 hover:opacity-80 transition-opacity"
          >
            <span className="text-sm font-bold text-foreground">{formatCount(stats[0].value)}</span>{" "}
            <span className="text-xs text-muted-foreground">Followers</span>
          </button>
          <button
            onClick={() => onViewList?.("following")}
            className="inline-flex items-center gap-1.5 hover:opacity-80 transition-opacity"
          >
            <span className="text-sm font-bold text-foreground">{formatCount(stats[1].value)}</span>{" "}
            <span className="text-xs text-muted-foreground">Following</span>
          </button>
          {stats.slice(2).map((s) => (
            <span key={s.label} className="inline-flex items-center gap-1.5">
              {s.label === "Communities" && <Users className="w-3.5 h-3.5 text-muted-foreground/60" />}
              {s.label === "Market" && <ShoppingBag className="w-3.5 h-3.5 text-muted-foreground/60" />}
              <span className="text-sm font-bold text-foreground">{formatCount(s.value)}</span>{" "}
              <span className="text-xs text-muted-foreground">{s.label}</span>
            </span>
          ))}
        </div>

        {isOwner && (
          <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl bg-muted/40 p-3 flex items-center justify-center">
              <ScoreRing value={reputation?.totalScore ?? 0} size={64} stroke={6} color={accent} label="Reputation" sublabel={`Level ${reputation?.level ?? 1} · ${reputation?.tier ?? "BRONZE"}`} />
            </div>
            <div className="rounded-xl bg-muted/40 p-3 flex items-center justify-center">
              <ScoreRing value={aiTrust} size={64} stroke={6} color="#38BDF8" label="AI Trust" sublabel="Insight score" />
            </div>
            <div className="rounded-xl bg-muted/40 p-3 flex items-center justify-center">
              <ScoreRing value={completion} size={64} stroke={6} color="#34D399" label="Completion" sublabel="Profile strength" />
            </div>
            <div className="rounded-xl bg-muted/40 p-3 flex flex-col items-center justify-center gap-1 text-center">
              <div className="w-16 h-16 flex flex-col items-center justify-center rounded-full border-2 border-dashed border-muted-foreground/30">
                <Package className="w-5 h-5 text-muted-foreground" />
              </div>
              <span className="text-[10px] font-medium text-muted-foreground">{counts.market} items selling</span>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border text-[11px] text-muted-foreground">
          <MessageCircle className="w-3 h-3" /> Open to opportunities
          <span className="mx-1">·</span>
          <Sparkles className="w-3 h-3 text-primary" /> Nova Creator Program
        </div>
      </div>
    </motion.div>
  );
}
