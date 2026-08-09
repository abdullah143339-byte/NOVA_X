import type {
  AchievementDef,
  ActivityItem,
  CertificationItem,
  CommunityItem,
  EducationItem,
  ExperienceItem,
  FollowerItem,
  MarketItem,
  ProjectDef,
} from "./types";

export function hashSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function pickFrom<T>(pool: T[], seed: number, index: number): T {
  return pool[(seed + index * 7919) % pool.length];
}

export function shuffleArray<T>(input: T[], seed: number): T[] {
  const arr = [...input];
  let s = seed;
  for (let i = arr.length - 1; i > 0; i--) {
    s = Math.imul(s ^ (s >>> 15), s | 1);
    const j = Math.abs(s) % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

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
  if (!reputation) return 42;
  const raw =
    reputation.trustScore * 0.4 +
    reputation.contributionScore * 0.25 +
    reputation.activityScore * 0.2 +
    reputation.expertiseScore * 0.15;
  return Math.round(Math.min(100, Math.max(0, raw)));
}

// TODO(backend): profile.experience / profile.education are JSON strings. When the backend
// returns structured education/experience, parse them here instead of seeding.
const SKILLS = ["TypeScript", "React", "Next.js", "NestJS", "Node.js", "Python", "UI/UX Design", "Product Strategy", "Machine Learning", "Prompt Engineering", "GraphQL", "PostgreSQL", "DevOps", "Figma", "Motion Design", "Technical Writing"];
const INTERESTS = ["AI", "Open Source", "Design", "Startups", "Photography", "Gaming", "Travel", "Music", "Blockchain", "Robotics", "Gaming", "Cinema"];
const LANGUAGES = ["English", "Urdu", "Hindi", "Spanish", "Arabic", "French", "German"];
const CERT_POOL = [
  { name: "AI & Machine Learning Fundamentals", issuer: "DeepLearning.AI", year: "2025" },
  { name: "Certified React Developer", issuer: "Meta", year: "2024" },
  { name: "AWS Certified Cloud Practitioner", issuer: "Amazon Web Services", year: "2024" },
  { name: "Professional Frontend Engineer", issuer: "HackerRank", year: "2023" },
  { name: "DevOps Fundamentals", issuer: "Linux Foundation", year: "2023" },
  { name: "NestJS Advanced Architecture", issuer: "Udemy", year: "2025" },
];

export function getSkills(seed: string): string[] {
  const s = hashSeed(seed + "skills");
  const count = 5 + (s % 4);
  return shuffleArray(SKILLS, s).slice(0, count);
}

export function getInterests(seed: string): string[] {
  const s = hashSeed(seed + "interests");
  return shuffleArray(INTERESTS, s).slice(0, 6);
}

export function getLanguages(seed: string): string[] {
  const s = hashSeed(seed + "langs");
  return shuffleArray(LANGUAGES, s).slice(0, 3);
}

export function getCertifications(seed: string): CertificationItem[] {
  const s = hashSeed(seed + "certs");
  return shuffleArray(CERT_POOL, s).slice(0, 3);
}

export function getExperience(seed: string): ExperienceItem[] {
  const s = hashSeed(seed + "exp");
  return [
    {
      role: pickFrom(["Senior Product Engineer", "Full-Stack Developer", "AI Solutions Architect", "Creative Technologist"], s, 0),
      company: pickFrom(["Nova Labs", "TechNova", "PixelForge Studio", "CloudWorks"], s, 1),
      period: pickFrom(["2023 — Present", "2022 — Present", "2021 — Present"], s, 2),
      description: "Building AI-powered products end to end — from design systems and realtime APIs to deployment and analytics.",
    },
    {
      role: pickFrom(["Software Engineer", "Frontend Engineer", "ML Engineer", "Product Engineer"], s, 3),
      company: pickFrom(["Innovate Inc", "Brightloop", "DevSphere", "Kickstart HQ"], s, 4),
      period: pickFrom(["2020 — 2023", "2019 — 2022", "2018 — 2021"], s, 5),
      description: "Shipped high-traffic features used by millions of users. Improved performance and developer experience across teams.",
    },
  ];
}

export function getEducation(seed: string): EducationItem[] {
  const s = hashSeed(seed + "edu");
  return [
    {
      degree: pickFrom(["B.Sc. Computer Science", "B.E. Software Engineering", "B.A. Interaction Design", "B.Tech Information Technology"], s, 0),
      school: pickFrom(["National University of Technology", "Institute of Engineering & Sciences", "State University of Computing", "Academy of Design & Technology"], s, 1),
      period: pickFrom(["2016 — 2020", "2017 — 2021", "2015 — 2019"], s, 2),
    },
  ];
}

export function getAchievements(seed: string, reputation?: { tier: string; level: number; totalScore: number }): AchievementDef[] {
  const tier = reputation?.tier || "BRONZE";
  const level = reputation?.level || 1;
  const score = reputation?.totalScore ?? 0;
  const unlocked = (i: number) => i < Math.min(3 + Math.floor(level / 2), 6);
  return [
    { id: "early-adopter", title: "Early Adopter", emoji: "🚀", description: "Joined NOVA AI in its founding days", earned: true, date: "Joined", tier: "Bronze" },
    { id: "first-post", title: "First Post", emoji: "📝", description: "Published your very first post", earned: true, date: "First publish", tier: "Bronze" },
    { id: "social-butterfly", title: "Social Butterfly", emoji: "🦋", description: "Connect with 10 people", earned: score > 200, tier: "Bronze" },
    { id: "content-machine", title: "Content Machine", emoji: "⚡", description: "Publish 25 posts", earned: score > 500 || tier !== "BRONZE", tier: "Silver" },
    { id: "creator-badge", title: "Verified Creator", emoji: "✅", description: "Become a verified creator", earned: tier === "GOLD" || tier === "PLATINUM", tier: "Gold" },
    { id: "market-tycoon", title: "Market Tycoon", emoji: "💼", description: "Sell 10 items in the marketplace", earned: false, tier: "Gold" },
    { id: "reputation-legend", title: "Reputation Legend", emoji: "🏆", description: "Reach the top of the leaderboard", earned: tier === "PLATINUM", tier: "Platinum" },
  ].filter(() => true).slice(0, 7).map((a, i) => ({ ...a, earned: a.earned || unlocked(i) }));
}

export function getActivity(seed: string, posts: unknown[], marketCount: number, communityCount: number, days = 14): ActivityItem[] {
  const s = hashSeed(seed + "act");
  const out: ActivityItem[] = [];
  const now = Date.now();
  const kinds: ActivityItem["kind"][] = ["post", "comment", "like", "share", "market", "community", "achievement", "follow"];
  for (let i = 0; i < days; i++) {
    if (Math.abs((s + i) % 7) < 3) continue;
    const kind = pickFrom(kinds, s + i, i);
    const date = new Date(now - i * 86400000).toISOString();
    const texts: Record<ActivityItem["kind"], string> = {
      post: pickFrom(["Published a new post", "Shared your latest update", "Posted a story"], s + i, i),
      comment: pickFrom(["Commented on a community thread", "Left a reply on a post", "Answered a question"], s + i, i),
      like: pickFrom(["Liked a post", "Liked a reel", "Liked a marketplace item"], s + i, i),
      share: "Shared a post with followers",
      market: pickFrom(["Listed a new marketplace item", "Sold an item", "Updated a listing"], s + i, i),
      community: pickFrom(["Joined a community", "Started a community discussion", "Reached a community milestone"], s + i, i),
      achievement: "Earned a new achievement badge",
      follow: "Gained a new follower",
    };
    const emojis: Record<ActivityItem["kind"], string> = {
      post: "📝",
      comment: "💬",
      like: "❤️",
      share: "🔁",
      market: "🛍️",
      community: "👥",
      achievement: "🏅",
      follow: "➕",
    };
    out.push({ id: `act-${i}`, kind, emoji: emojis[kind], text: texts[kind], date, detail: undefined });
  }
  if (posts.length > 0) {
    out.unshift({ id: "act-post-now", kind: "post", emoji: "📝", text: "Recent post published", date: new Date().toISOString() });
  }
  if (marketCount > 0) {
    out.unshift({ id: "act-market", kind: "market", emoji: "🛍️", text: `${marketCount} item${marketCount > 1 ? "s" : ""} listed on the marketplace`, date: new Date().toISOString() });
  }
  if (communityCount > 0) {
    out.unshift({ id: "act-comm", kind: "community", emoji: "👥", text: `Active in ${communityCount} communities`, date: new Date().toISOString() });
  }
  return out.slice(0, 30);
}

export function getHeatmap(seed: string, activityBias = 0.4): number[][] {
  const s = hashSeed(seed + "heat");
  const weeks = 52;
  const grid: number[][] = [];
  for (let w = 0; w < weeks; w++) {
    const week: number[] = [];
    for (let d = 0; d < 7; d++) {
      const r = Math.abs(Math.sin(s + w * 12.9898 + d * 78.233) * 43758.5453) % 1;
      week.push(r < 1 - activityBias ? 0 : r < activityBias ? Math.ceil(r * 12) : 0);
    }
    grid.push(week);
  }
  return grid;
}

const FOLLOWER_NAMES = [
  ["Ayesha Khan", "ayesha.dev"], ["Bilal Raza", "bilal.raza"], ["Fatima Sheikh", "fatima.codes"], ["Hassan Ali", "hassanali"], ["Zara Ahmed", "zaraahmed"], ["Omar Farooq", "omar.farooq"], ["Sara Malik", "saramalik"], ["Imran Qureshi", "imranq"], ["Noor Fatima", "noor.fatima"], ["Usman Ghani", "usmanghani"], ["Mariam Baig", "mariambaig"], ["Raza Hussain", "razah"], ["Amina Tariq", "amina.tariq"], ["Kamran Shah", "kamran.shah"], ["Laila Nawaz", "laila.n"], ["Fahad Riaz", "fahadriaz"], ["Hina Yousaf", "hina.y"], ["Danish Iqbal", "danishiqbal"], ["Sania Javed", "sania.javed"], ["Tariq Mehmood", "tariqm"],
];
const FOLLOWER_BIOS = ["Building the future of AI 🚀", "Full-stack engineer", "Design lover", "Open-source contributor", "Startup founder", "Content creator", "ML enthusiast", "Product designer", "Writer & storyteller", "Photographer"];

export function getFollowers(seed: string, count: number): FollowerItem[] {
  const s = hashSeed(seed + "fol");
  return Array.from({ length: Math.min(count, 20) }).map((_, i) => {
    const [name, username] = FOLLOWER_NAMES[(s + i) % FOLLOWER_NAMES.length];
    const mutual = (s + i) % 3 === 0;
    return {
      id: `f-${seed}-${i}`,
      name,
      username,
      bio: pickFrom(FOLLOWER_BIOS, s + i, i),
      mutual,
      following: mutual,
      followedByMe: (s + i) % 4 !== 1,
      role: (s + i) % 7 === 0 ? "Verified Creator" : undefined,
    };
  });
}

const PROJECT_POOL: ProjectDef[] = [
  { id: "p1", title: "NOVA AI Platform", description: "An AI-powered social & commerce platform with realtime messaging, reels, marketplace and a reputation engine.", tech: ["Next.js", "NestJS", "PostgreSQL", "Redis"], status: "Active", stars: 482 },
  { id: "p2", title: "Realtime Chat Engine", description: "Socket.io powered chat with presence, typing indicators, AI assistance and end-to-end media sharing.", tech: ["Node.js", "Socket.io", "React"], status: "Completed", stars: 214 },
  { id: "p3", title: "AI Router Orchestrator", description: "Intelligent task routing across LLM providers with cost, latency and quality trade-off scoring.", tech: ["Python", "FastAPI", "LangChain"], status: "In Progress", stars: 367 },
  { id: "p4", title: "Design System Kit", description: "A glassmorphism design system with 60+ components, dark/light theming and motion primitives.", tech: ["React", "Tailwind", "Framer Motion"], status: "Completed", stars: 150 },
  { id: "p5", title: "Knowledge Graph Engine", description: "Entity relationship discovery over user content powering recommendations.", tech: ["Neo4j", "TypeScript"], status: "Active", stars: 98 },
];

export function getProjects(seed: string, projectPostCount: number): ProjectDef[] {
  const s = hashSeed(seed + "proj");
  const base = shuffleArray(PROJECT_POOL, s);
  if (projectPostCount > 0) {
    return base;
  }
  return base.slice(0, 3);
}

const COMMUNITY_NAMES = [
  ["AI Innovators", "Innovation", "ai-innovators"], ["Web Developers Hub", "Development", "web-dev-hub"], ["Digital Artists", "Design", "digital-artists"], ["Startup Founders", "Business", "startup-founders"], ["ML Enthusiasts", "AI", "ml-enthusiasts"], ["Nova Creators", "Creators", "nova-creators"],
];

export function getOwnedCommunities(seed: string): CommunityItem[] {
  const s = hashSeed(seed + "comm");
  return [0, 1].map((i) => {
    const [name, category, slug] = COMMUNITY_NAMES[(s + i) % COMMUNITY_NAMES.length];
    return {
      id: `owned-${i}`,
      name,
      title: name,
      slug,
      description: `${category} community for creators.`,
      category,
      memberCount: 1200 + ((s + i * 37) % 9000),
      role: "OWNER",
    };
  });
}

export function getJoinedCommunities(seed: string): CommunityItem[] {
  const s = hashSeed(seed + "jcomm");
  return [2, 3, 4].map((i) => {
    const [name, category, slug] = COMMUNITY_NAMES[(s + i) % COMMUNITY_NAMES.length];
    return {
      id: `joined-${i}`,
      name,
      title: name,
      slug,
      description: `${category} community for creators.`,
      category,
      memberCount: 800 + ((s + i * 53) % 6000),
      role: (s + i) % 5 === 0 ? "MODERATOR" : "MEMBER",
    };
  });
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

// QR code: deterministic 21x21 finder-pattern + pseudo-random modules.
export function buildQrModules(seed: string): boolean[][] {
  const s = hashSeed(seed + "qr");
  const size = 21;
  const grid: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));
  const finder = (r: number, c: number) => {
    for (let i = 0; i < 7; i++) {
      for (let j = 0; j < 7; j++) {
        const on = i === 0 || i === 6 || j === 0 || j === 6 || (i >= 2 && i <= 4 && j >= 2 && j <= 4);
        grid[r + i][c + j] = on;
      }
    }
  };
  finder(0, 0);
  finder(0, size - 7);
  finder(size - 7, 0);
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      const inFinder = (i < 7 && j < 7) || (i < 7 && j >= size - 7) || (i >= size - 7 && j < 7);
      if (!inFinder) {
        grid[i][j] = ((s + i * 31 + j * 17) % 5) === 0;
      }
    }
  }
  return grid;
}

export function marketRating(item: MarketItem): number {
  return item.rating ?? 3.5 + ((hashSeed(item.id) % 15) / 10);
}

export function marketSales(item: MarketItem): number {
  return item.salesCount ?? (hashSeed(item.id) % 400);
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
