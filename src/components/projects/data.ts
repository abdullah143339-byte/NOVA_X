import type {
  ProjectRow,
  ProjectCategory,
} from "./types";

export interface RawPost {
  id: string;
  content?: string;
  title?: string;
  tags?: string | string[];
  type?: string;
  visibility?: string;
  authorId?: string;
  author?: { id?: string; username?: string; displayName?: string; avatar?: string; verified?: boolean };
  media?: unknown;
  createdAt?: string;
  updatedAt?: string;
  viewCount?: number;
  reactionsCount?: number;
  commentsCount?: number;
  bookmarksCount?: number;
  sharesCount?: number;
  isLiked?: boolean;
  isBookmarked?: boolean;
  _count?: { comments?: number; shares?: number; bookmarks?: number };
}

export function extractPostList(body: unknown): RawPost[] {
  if (Array.isArray(body)) return body as RawPost[];
  const b = body as { data?: unknown; posts?: unknown };
  if (b.data && typeof b.data === "object" && "posts" in (b.data as { posts?: unknown })) {
    const posts = (b.data as { posts?: unknown }).posts;
    if (Array.isArray(posts)) return posts as RawPost[];
  }
  if (Array.isArray(b.data)) return b.data as RawPost[];
  if (Array.isArray(b.posts)) return b.posts as RawPost[];
  return [];
}

export function extractPost(body: unknown): RawPost | null {
  if (!body || typeof body !== "object") return null;
  const b = body as { data?: unknown };
  if (b.data && typeof b.data === "object" && "id" in (b.data as { id?: unknown })) return b.data as RawPost;
  if ("id" in b) return b as RawPost;
  return null;
}

export function hashSeed(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function posMod(n: number, m: number): number {
  return ((n % m) + m) % m;
}

export function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(n);
}

export const COVER_GRADIENTS = [
  "from-indigo-500 via-purple-500 to-pink-500",
  "from-sky-500 via-cyan-400 to-emerald-400",
  "from-rose-500 via-red-500 to-orange-400",
  "from-violet-600 via-fuchsia-500 to-amber-400",
  "from-emerald-500 via-teal-400 to-cyan-400",
  "from-blue-600 via-indigo-500 to-violet-500",
  "from-amber-500 via-orange-500 to-rose-500",
  "from-fuchsia-600 via-pink-500 to-rose-400",
  "from-slate-600 via-slate-500 to-slate-400",
  "from-lime-500 via-emerald-500 to-teal-400",
  "from-cyan-500 via-blue-500 to-indigo-500",
  "from-purple-600 via-violet-500 to-indigo-400",
];

export const LOGOS = ["🤖", "⚡", "🎨", "🛠️", "📊", "🧠", "🚀", "🔮", "🌐", "🛰️", "🎮", "📱", "💾", "🔐", "🧪", "🎧"];

export const CATEGORY_POOL: ProjectCategory[] = [
  "AI / ML",
  "Web App",
  "Mobile App",
  "Dev Tool",
  "Open Source Library",
  "Data Science",
  "Design System",
  "Blockchain",
  "Game",
  "Hardware",
  "AR / VR",
  "Other",
];

export const TECH_POOL = [
  "Next.js",
  "React",
  "TypeScript",
  "Python",
  "FastAPI",
  "PyTorch",
  "TensorFlow",
  "Node.js",
  "NestJS",
  "PostgreSQL",
  "MongoDB",
  "Redis",
  "Tailwind",
  "Prisma",
  "Rust",
  "Go",
  "Flutter",
  "Swift",
  "Kotlin",
  "Docker",
  "Kubernetes",
  "GraphQL",
  "RAG",
  "LLM",
  "Computer Vision",
  "WebSockets",
];

export const TAG_POOL = [
  "productivity",
  "developer-tools",
  "machine-learning",
  "real-time",
  "open-source",
  "saas",
  "startup",
  "automation",
  "privacy-first",
  "cross-platform",
  "free-tier",
  "api",
  "data-viz",
  "collaboration",
  "security",
];

export function parseTags(tags?: string | string[]): string[] {
  if (Array.isArray(tags)) return tags;
  if (typeof tags === "string") {
    try {
      const parsed = JSON.parse(tags);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

interface ProjectMediaEntry {
  kind?: string;
  features?: string[];
  screenshots?: string[];
}

function projectMediaFrom(post: RawPost): { features: string[]; screenshots: string[] } {
  const media = post.media;
  let entry: ProjectMediaEntry | null = null;
  if (Array.isArray(media) && media.length > 0 && typeof media[0] === "object" && media[0] !== null) {
    entry = media[0] as ProjectMediaEntry;
  } else if (media && typeof media === "object") {
    entry = media as ProjectMediaEntry;
  }
  const strArr = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []);
  return {
    features: entry ? strArr(entry.features) : [],
    screenshots: entry ? strArr(entry.screenshots) : [],
  };
}

export function normalizePostToProject(post: RawPost): ProjectRow {
  const content = String(post.content || "");  const lines = content.split("\n");
  const title = (lines[0] || "").replace(/^Project:\s*/i, "").trim() || "Untitled";
  const rest = lines.slice(1).join("\n");
  let url = "";
  let description = rest;
  const urlMatch = rest.match(/(?:URL|Link|🔗):\s*(\S+)/i);
  if (urlMatch) {
    url = urlMatch[1];
    description = rest.replace(urlMatch[0], "").trim();
  }
  const tags = parseTags(post.tags).filter((t: string) => t.toLowerCase() !== "project");
  const techStack = tags.slice(0, 4);
  const category = techStack[0] || "Other";
  const createdAt = post.createdAt || new Date().toISOString();
  const seed = hashSeed(`post:${post.id}`);
  const counts = post._count || {};
  const media = projectMediaFrom(post);
  return {
    id: post.id,
    title: title || "Untitled",
    tagline: description.split("\n")[0]?.slice(0, 96) || "",
    description,
    cover: COVER_GRADIENTS[seed % COVER_GRADIENTS.length],
    logo: LOGOS[seed % LOGOS.length],
    category,
    techStack,
    tags,
    status: "IN_PROGRESS",
    visibility: post.visibility === "PRIVATE" ? "PRIVATE" : "PUBLIC",
    isOpenSource: tags.some((t: string) => /open.?source/i.test(t)),
    isAI: tags.some((t: string) => /(ai|ml|gpt|model)/i.test(t)),
    isStartup: tags.some((t: string) => /startup|saas/i.test(t)),
    creator: {
      id: post.authorId,
      name: post.author?.displayName || post.author?.username || "You",
      username: post.author?.username || "you",
      verified: Boolean(post.author?.verified),
      avatar: "🧑‍🚀",
    },
    stats: {
      likes: post.reactionsCount || 0,
      views: post.viewCount || 0,
      comments: post.commentsCount ?? counts.comments ?? 0,
      bookmarks: post.bookmarksCount ?? counts.bookmarks ?? 0,
      shares: post.sharesCount ?? counts.shares ?? 0,
    },
    links: url ? { demo: url } : {},
    features: media.features,
    roadmap: [],
    changelog: [],
    team: [],
    gallery: media.screenshots,
    createdAt,
    updatedAt: post.updatedAt || createdAt,
    draft: false,
    source: "post",
    postId: post.id,
  };
}

export function sectionSort(projects: ProjectRow[], kind: string): ProjectRow[] {
  const arr = projects.slice();
  switch (kind) {
    case "popular":
      return arr.sort((a, b) => b.stats.likes - a.stats.likes);
    case "trending":
      return arr.sort((a, b) => b.stats.views - a.stats.views);
    case "newest":
      return arr.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    case "mostBookmarked":
      return arr.sort((a, b) => b.stats.bookmarks - a.stats.bookmarks);
    default:
      return arr;
  }
}
