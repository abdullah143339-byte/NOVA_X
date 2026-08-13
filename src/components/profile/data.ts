export function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(n);
}

export function timeAgo(dateStr: string): string {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 86400 * 30) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function formatJoined(dateStr?: string): string {
  if (!dateStr) return "Nova";
  return new Date(dateStr).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export function computeCompletion(profile?: {
  bio?: string | null;
  location?: string | null;
  website?: string | null;
  coverImage?: string | null;
  avatar?: string | null;
}): number {
  let score = 0;
  if (profile?.avatar) score += 15;
  if (profile?.coverImage) score += 10;
  if (profile?.bio) score += 25;
  if (profile?.location) score += 15;
  if (profile?.website) score += 15;
  score += 20;
  return Math.min(100, score);
}

export const CREATOR_LEVELS = [
  { tier: "BRONZE", label: "Bronze Creator", color: "#CD7F32", min: 0, emoji: "🥉" },
  { tier: "SILVER", label: "Silver Creator", color: "#C0C0C0", min: 500, emoji: "🥈" },
  { tier: "GOLD", label: "Gold Creator", color: "#FFD700", min: 1500, emoji: "🥇" },
  { tier: "PLATINUM", label: "Platinum Creator", color: "#E5E4E2", min: 4000, emoji: "💎" },
] as const;

export function getCreatorLevel(score: number): (typeof CREATOR_LEVELS)[number] {
  let level: (typeof CREATOR_LEVELS)[number] = CREATOR_LEVELS[0];
  for (const l of CREATOR_LEVELS) {
    if (score >= l.min) level = l;
  }
  return level;
}

export function getAiTrustScore(reputation?: { trustScore: number; contributionScore: number; activityScore: number; expertiseScore: number }): number {
  if (!reputation) return 0;
  const raw =
    (reputation.trustScore ?? 0) * 0.4 +
    (reputation.contributionScore ?? 0) * 0.25 +
    (reputation.activityScore ?? 0) * 0.2 +
    (reputation.expertiseScore ?? 0) * 0.15;
  return Math.round(Math.min(100, Math.max(0, raw)));
}

export function getProfileThemes(): { id: string; name: string; accent: string; gradient: string }[] {
  return [
    { id: "aurora", name: "Aurora", accent: "#6C63FF", gradient: "from-violet-500 via-indigo-500 to-fuchsia-500" },
    { id: "ember", name: "Ember", accent: "#FF6C63", gradient: "from-rose-500 via-red-500 to-orange-500" },
    { id: "ocean", name: "Ocean", accent: "#38BDF8", gradient: "from-cyan-500 via-sky-500 to-blue-500" },
    { id: "mint", name: "Mint", accent: "#34D399", gradient: "from-emerald-500 via-teal-500 to-cyan-500" },
    { id: "sunset", name: "Sunset", accent: "#FB923C", gradient: "from-amber-400 via-orange-500 to-pink-500" },
    { id: "royal", name: "Royal", accent: "#A78BFA", gradient: "from-indigo-500 via-purple-500 to-violet-500" },
  ];
}

export function parseTags(tags?: string | string[]): string[] {
  if (Array.isArray(tags)) return tags;
  if (!tags) return [];
  try {
    const parsed = JSON.parse(tags);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function parseJsonArray(value?: string | null): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

export function getProfileUrl(username: string): string {
  return `https://nova.ai/${username}`;
}

export const AI_PROFILE_ACTIONS = [
  { id: "bio", label: "AI Bio Generator", emoji: "✍️", hint: "Craft a standout bio from your data" },
  { id: "summary", label: "AI Profile Summary", emoji: "📋", hint: "Professional one-paragraph summary" },
  { id: "skills", label: "AI Skills Analysis", emoji: "🧠", hint: "Discover gaps & recommended skills" },
  { id: "career", label: "AI Career Suggestions", emoji: "🚀", hint: "Next steps for your creator journey" },
  { id: "content", label: "AI Content Suggestions", emoji: "💡", hint: "Post ideas tuned to your audience" },
  { id: "username", label: "AI Username Suggestions", emoji: "🔤", hint: "Fresh handle ideas" },
  { id: "seo", label: "AI SEO Profile", emoji: "🔍", hint: "Optimize your profile for discovery" },
  { id: "translate", label: "AI Translation", emoji: "🌐", hint: "Translate your bio to another language" },
  { id: "reputation", label: "AI Reputation Analysis", emoji: "📊", hint: "Understand your reputation score" },
];
