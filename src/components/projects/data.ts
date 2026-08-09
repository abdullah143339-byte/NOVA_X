import type {
  ProjectRow,
  ProjectStatus,
  ProjectCategory,
  ProjectTeamMember,
  ProjectRoadmapPhase,
  ProjectChangelogEntry,
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

export function pickFrom<T>(arr: T[], seed: number): T {
  return arr[posMod(seed, arr.length)];
}

export function pickMany<T>(arr: T[], seed: number, n: number): T[] {
  const out: T[] = [];
  let s = seed;
  const pool = arr.slice();
  for (let i = 0; i < n && pool.length > 0; i += 1) {
    s = Math.imul(s, 1103515245) + 12345;
    const idx = posMod(s, pool.length);
    out.push(pool[idx]);
    pool.splice(idx, 1);
  }
  return out;
}

export function shuffleArray<T>(arr: T[], seed: number): T[] {
  const out = arr.slice();
  let s = seed;
  for (let i = out.length - 1; i > 0; i -= 1) {
    s = Math.imul(s, 1103515245) + 12345;
    const j = s % (i + 1);
    const tmp = out[i];
    out[i] = out[j];
    out[j] = tmp;
  }
  return out;
}

export function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(n);
}

export function isoHoursAgo(hours: number): string {
  return new Date(Date.now() - hours * 3600_000).toISOString();
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

export interface ProjectTemplate {
  title: string;
  tagline: string;
  description: string;
  category: string;
  status: ProjectStatus;
  isAI: boolean;
  isOpenSource: boolean;
  isStartup: boolean;
  license: string;
}

export const PROJECT_TEMPLATES: ProjectTemplate[] = [
  {
    title: "NexusMind",
    tagline: "Local-first AI assistant that runs fully on-device with zero data exfiltration.",
    description:
      "NexusMind is a privacy-first personal AI that embeds small language models directly on your device. It handles summaries, smart replies, document Q&A and automation pipelines entirely offline, syncing an encrypted index across your devices. Built with a modular plugin architecture, it ships with a sandboxed runtime so third-party skills can never touch raw data.",
    category: "AI / ML",
    status: "IN_PROGRESS",
    isAI: true,
    isOpenSource: true,
    isStartup: true,
    license: "MIT",
  },
  {
    title: "PulseBoard",
    tagline: "Real-time analytics for indie hackers, streaming every metric live.",
    description:
      "PulseBoard aggregates revenue, traffic and engagement metrics into one live dashboard. WebSockets push every event to the board in under 100ms, with anomaly detection that flags spikes before they become incidents. One-line SDK works with any stack, and the free tier covers up to 100K events per month.",
    category: "Web App",
    status: "COMPLETED",
    isAI: true,
    isOpenSource: false,
    isStartup: true,
    license: "Proprietary",
  },
  {
    title: "ThreadForge",
    tagline: "Turn a single idea into an organized knowledge base with AI clustering.",
    description:
      "ThreadForge ingests scattered notes, bookmarks and meeting transcripts, then uses embedding clustering to auto-organize everything into a navigable knowledge graph. Ask questions in natural language and get answers with exact source citations. Collaboration is real-time with fine-grained role permissions.",
    category: "AI / ML",
    status: "IN_PROGRESS",
    isAI: true,
    isOpenSource: false,
    isStartup: false,
    license: "Proprietary",
  },
  {
    title: "GlassDB",
    tagline: "An embedded vector database written in Rust with zero dependencies.",
    description:
      "GlassDB is a tiny, embedded vector store engineered for edge and browser deployments. mmap-based indexing keeps memory flat even at 10M vectors, and a WASM build ships < 1MB gzipped. It exposes a familiar SQL-ish API and plugs into any ORM with a single adapter.",
    category: "Open Source Library",
    status: "COMPLETED",
    isAI: true,
    isOpenSource: true,
    isStartup: false,
    license: "Apache-2.0",
  },
  {
    title: "LumeOS",
    tagline: "A terminal-first operating layer for creative teams and studios.",
    description:
      "LumeOS wraps your project files, task boards and version control into a single command-line and keyboard-driven surface. Scriptable workflows let teams define pipelines once and run them everywhere, while the status bar keeps every commit, deploy and review in view.",
    category: "Dev Tool",
    status: "IDEA",
    isAI: false,
    isOpenSource: false,
    isStartup: true,
    license: "Proprietary",
  },
  {
    title: "CipherKeys",
    tagline: "Passwordless auth infrastructure with passkeys and hardware keys.",
    description:
      "CipherKeys provides drop-in passwordless authentication for any backend. WebAuthn, passkeys and FIDO2 security keys are handled out of the box, with a resilient recovery flow and full audit logging. The admin console visualizes every sign-in attempt with device intelligence.",
    category: "Dev Tool",
    status: "IN_PROGRESS",
    isAI: false,
    isOpenSource: false,
    isStartup: true,
    license: "Proprietary",
  },
  {
    title: "Visionary",
    tagline: "Computer vision toolkit that turns CCTV feeds into actionable alerts.",
    description:
      "Visionary detects objects, anomalies and safety violations across live camera feeds, then alerts teams with bounded latency under 300ms on edge hardware. Privacy filters auto-blur bystanders, and every decision is explainable with a visual reasoning trace.",
    category: "AI / ML",
    status: "IN_PROGRESS",
    isAI: true,
    isOpenSource: false,
    isStartup: false,
    license: "Proprietary",
  },
  {
    title: "OrbitUI",
    tagline: "An accessible component kit for planetary-scale design systems.",
    description:
      "OrbitUI ships production-ready, themeable React components built for accessibility and performance. Every component ships with a design token engine, keyboard-first interaction patterns and zero-JS fallbacks. Used by 4K+ teams with a 99.9% lighthouse baseline.",
    category: "Design System",
    status: "COMPLETED",
    isAI: false,
    isOpenSource: true,
    isStartup: false,
    license: "MIT",
  },
  {
    title: "DriftCast",
    tagline: "Low-latency podcast streaming with live transcripts and clip sharing.",
    description:
      "DriftCast streams podcasts with sub-second latency, generates live transcripts in 12 languages and lets listeners clip and share moments that drive virality. Analytics show exactly where listeners drop off, so creators can keep audiences hooked.",
    category: "Mobile App",
    status: "IDEA",
    isAI: true,
    isOpenSource: false,
    isStartup: true,
    license: "Proprietary",
  },
  {
    title: "FieldPulse",
    tagline: "Offline-first field service app for remote teams with flaky networks.",
    description:
      "FieldPulse keeps crews productive with full offline support and conflict-free sync. Jobs, photos and signatures sync when connectivity returns, and a map view coordinates fleets in real time. Built with a resilient CRDT-based data layer.",
    category: "Mobile App",
    status: "COMPLETED",
    isAI: false,
    isOpenSource: false,
    isStartup: false,
    license: "Proprietary",
  },
  {
    title: "HyperMesh",
    tagline: "A peer-to-peer networking layer for multiplayer games in the browser.",
    description:
      "HyperMesh handles WebRTC mesh + relay topologies so browser games can support 64-player lobbies without dedicated servers. State sync is lockstep with lag compensation built in, and the benchmark suite proves 60Hz at scale. Ships with Unity, Godot and raw JS bindings.",
    category: "Game",
    status: "IN_PROGRESS",
    isAI: false,
    isOpenSource: true,
    isStartup: false,
    license: "MIT",
  },
  {
    title: "TerraScan",
    tagline: "Satellite-based crop health monitoring for precision agriculture.",
    description:
      "TerraScan ingests satellite imagery to compute NDVI vegetation indexes and stress maps across thousands of hectares. Growers get irrigation and fertilizer recommendations straight to their phones, with confidence scores and per-field history.",
    category: "Data Science",
    status: "IDEA",
    isAI: true,
    isOpenSource: false,
    isStartup: true,
    license: "Proprietary",
  },
];

export const CREATOR_POOL = [
  { name: "Ayesha Khan", username: "ayesha", avatar: "👩‍💻" },
  { name: "Bilal Ahmed", username: "bilal", avatar: "🧑‍🚀" },
  { name: "Mariam Ali", username: "mariam", avatar: "👩‍🎤" },
  { name: "Usman Tariq", username: "usman", avatar: "🧑‍🔬" },
  { name: "Zainab Raza", username: "zainab", avatar: "👩‍🎨" },
  { name: "Hamza Sheikh", username: "hamza", avatar: "🧑‍💻" },
  { name: "Fatima Noor", username: "fatima", avatar: "👩‍🔧" },
  { name: "Ali Raza", username: "ali", avatar: "🧑‍🏫" },
];

export const TEAM_ROLES = ["Founder", "Co-founder", "Lead Engineer", "ML Engineer", "Product Designer", "Data Scientist"];

export const ROADMAP_PHASES: ProjectRoadmapPhase[] = [
  { phase: "01", title: "Research & validate the core problem", done: true },
  { phase: "02", title: "Build the MVP with early users", done: true },
  { phase: "03", title: "Open beta & gather telemetry", done: true },
  { phase: "04", title: "Scale infrastructure & hardening", done: false },
  { phase: "05", title: "Public launch & growth loop", done: false },
];

export const FEATURE_POOL = [
  "Natural language interface",
  "Real-time collaboration",
  "Offline-first sync",
  "Role-based access control",
  "One-click deploys",
  "Embedded analytics",
  "Keyboard-first UX",
  "Dark mode everywhere",
  "Plugin marketplace",
  "Webhook integrations",
  "End-to-end encryption",
  "Custom domains",
  "Audit logging",
  "Batch automation",
  "Live notifications",
  "Versioned history",
];

export const CHANGELOG_NOTES = [
  "Faster cold start and reduced memory footprint.",
  "New onboarding flow with progressive disclosure.",
  "Fixed an edge case where sync could drop changes.",
  "Added keyboard shortcuts and command palette.",
  "Improved accessibility contrast ratios across themes.",
  "Restyled empty states with helpful guidance.",
  "Shipped experimental beta of the automation engine.",
];

export const COMMENTS_POOL = [
  "This is exactly what the community needed. Amazing work!",
  "The attention to detail here is on another level. 🔥",
  "Can we get a writeup on how you handled the real-time sync?",
  "Bookmarking this — I'm going to steal the onboarding ideas.",
  "The architecture notes in the docs are super clear. Respect.",
  "Performance numbers look incredible. What's the stack?",
  "Been following this since the first prototype, so proud!",
  "Would love a self-hosted edition with Docker Compose.",
  "This solved a problem I've had for months. Thank you!",
  "The AI features are a game changer. Keep shipping!",
];

export const PROJECT_TAGS_BY_CATEGORY: Record<string, string[]> = {
  "AI / ML": ["machine-learning", "llm", "rag", "automation"],
  "Web App": ["saas", "real-time", "productivity"],
  "Mobile App": ["cross-platform", "collaboration", "productivity"],
  "Dev Tool": ["developer-tools", "api", "automation"],
  "Open Source Library": ["open-source", "api", "developer-tools"],
  "Data Science": ["data-viz", "machine-learning"],
  "Design System": ["developer-tools", "open-source", "collaboration"],
  Game: ["real-time", "security"],
};

function buildDetails(template: ProjectTemplate) {
  const seedA = hashSeed(`${template.title}#a`);
  const seedB = hashSeed(`${template.title}#b`);
  const seedC = hashSeed(`${template.title}#c`);
  const features = pickMany(FEATURE_POOL, seedA, 4 + (seedB % 3));
  const doneCount = template.status === "COMPLETED" ? 5 : template.status === "IN_PROGRESS" ? 3 : 1;
  const roadmap = ROADMAP_PHASES.map((p, i) => ({ ...p, done: i < doneCount }));
  const teamCount = 2 + (seedC % 3);
  const teamPool: string[] = [];
  const team: ProjectTeamMember[] = [];
  let s = seedB;
  for (let i = 0; i < teamCount; i += 1) {
    s = Math.imul(s, 1103515245) + 12345;
    const name = pickFrom(["Ali", "Sara", "Daniyal", "Hira", "Omar", "Kiran", "Fahad", "Maha"], s);
    const username = `${name.toLowerCase()}-dev`;
    const role = TEAM_ROLES[posMod(s + i, TEAM_ROLES.length)];
    if (!teamPool.includes(username)) {
      teamPool.push(username);
      team.push({ name, username, role });
    }
  }
  const changelog: ProjectChangelogEntry[] = [];
  let cs = seedC;
  const versions = ["0.9.0", "0.8.0", "0.7.0"];
  for (let i = 0; i < versions.length; i += 1) {
    cs = Math.imul(cs, 1103515245) + 12345;
    const notes = pickMany(CHANGELOG_NOTES, cs, 3);
    changelog.push({ version: versions[i], date: isoHoursAgo(24 * (i + 2)), notes });
  }
  const gallery = pickMany(COVER_GRADIENTS, seedB, 4);
  const galleryUnique = gallery.length >= 4 ? gallery : [...gallery, ...gallery];
  return { features, roadmap, team, changelog, gallery: galleryUnique.slice(0, 4) };
}

function seededStats(template: ProjectTemplate, seed: number) {
  let s = seed;
  const likes = 120 + posMod(s, 5000);
  s = Math.imul(s, 1103515245) + 12345;
  const views = likes * (2 + posMod(s, 9));
  s = Math.imul(s, 1103515245) + 12345;
  const comments = likes / (4 + posMod(s, 8));
  s = Math.imul(s, 1103515245) + 12345;
  const bookmarks = likes / (2 + posMod(s, 6));
  s = Math.imul(s, 1103515245) + 12345;
  const shares = likes / (5 + posMod(s, 10));
  return {
    likes: Math.floor(likes),
    views: Math.floor(views),
    comments: Math.floor(comments),
    bookmarks: Math.floor(bookmarks),
    shares: Math.floor(shares),
    stars: template.isOpenSource ? Math.floor(50 + posMod(s, 3000)) : undefined,
  };
}

export function seedShowcaseProject(index: number): ProjectRow {
  const template = PROJECT_TEMPLATES[index % PROJECT_TEMPLATES.length];
  const seed = hashSeed(`showcase:${template.title}:${index}`);
  const seedA = hashSeed(`${template.title}#a`);
  const creator = pickFrom(CREATOR_POOL, seedA);
  const techStack = pickMany(TECH_POOL, seed, 4);
  const tags = PROJECT_TAGS_BY_CATEGORY[template.category] || pickMany(TAG_POOL, seedA, 3);
  const details = buildDetails(template);
  const hoursAgo = 2 + (seed % 480);
  return {
    id: `showcase-${index + 1}`,
    title: template.title,
    tagline: template.tagline,
    description: template.description,
    cover: COVER_GRADIENTS[index % COVER_GRADIENTS.length],
    logo: LOGOS[index % LOGOS.length],
    category: template.category,
    techStack,
    tags,
    status: template.status,
    visibility: "PUBLIC",
    isOpenSource: template.isOpenSource,
    isAI: template.isAI,
    isStartup: template.isStartup,
    creator: { name: creator.name, username: creator.username, verified: index % 3 === 0, avatar: creator.avatar },
    stats: seededStats(template, seed),
    links: template.isOpenSource
      ? { github: "https://github.com", docs: "https://example.com/docs" }
      : { demo: "https://example.com/demo", docs: "https://example.com/docs" },
    license: template.license,
    features: details.features,
    roadmap: details.roadmap,
    changelog: details.changelog,
    team: details.team,
    gallery: details.gallery,
    createdAt: isoHoursAgo(hoursAgo),
    updatedAt: isoHoursAgo(hoursAgo - 2),
    draft: false,
    source: "showcase",
  };
}

export function seedShowcaseProjects(count: number): ProjectRow[] {
  const out: ProjectRow[] = [];
  for (let i = 0; i < count; i += 1) {
    out.push(seedShowcaseProject(i));
  }
  return out;
}

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
    features: [],
    roadmap: [],
    changelog: [],
    team: [],
    gallery: [],
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
