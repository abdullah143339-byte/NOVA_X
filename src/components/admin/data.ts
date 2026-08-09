import type {
  AdminRole,
  AdminPermissionDef,
  AdminUserRow,
  AnalyticsData,
  AuditLogItem,
  CommentRow,
  CommunityRow,
  CouponRow,
  FeatureFlag,
  MarketplaceProductRow,
  ModPostRow,
  OrderRow,
  RefundRow,
  ReportRow,
  ReviewRow,
  SecurityEvent,
  StoryRow,
  SystemSetting,
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

export function formatMoney(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toLocaleString("en-US")}`;
}

export function formatDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return iso;
  }
}

export function timeAgo(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 86400 * 30) return `${Math.floor(diff / 86400)}d ago`;
  return formatDate(iso);
}

const ANCHOR = Date.UTC(2026, 7, 4, 12, 0, 0);

function isoDaysAgo(days: number): string {
  return new Date(ANCHOR - days * 86400000).toISOString();
}

function isoHoursAgo(hours: number): string {
  return new Date(ANCHOR - hours * 3600000).toISOString();
}

// ---------------------------------------------------------------------------
// RBAC MODEL
// ---------------------------------------------------------------------------

export const PERMISSION_DEFS: AdminPermissionDef[] = [
  { module: "dashboard", moduleLabel: "Dashboard", action: "view", label: "View dashboard" },
  { module: "users", moduleLabel: "Users", action: "view", label: "View users" },
  { module: "users", moduleLabel: "Users", action: "manage", label: "Manage users" },
  { module: "users", moduleLabel: "Users", action: "warn", label: "Warn users" },
  { module: "users", moduleLabel: "Users", action: "suspend", label: "Suspend users" },
  { module: "users", moduleLabel: "Users", action: "ban", label: "Ban users" },
  { module: "users", moduleLabel: "Users", action: "roles", label: "Assign roles" },
  { module: "users", moduleLabel: "Users", action: "assist", label: "Assist users" },
  { module: "users", moduleLabel: "Users", action: "passwordReset", label: "Reset passwords" },
  { module: "users", moduleLabel: "Users", action: "recovery", label: "Account recovery" },
  { module: "roles", moduleLabel: "Roles", action: "view", label: "View roles" },
  { module: "roles", moduleLabel: "Roles", action: "manage", label: "Create / edit / delete roles" },
  { module: "roles", moduleLabel: "Roles", action: "clone", label: "Clone roles" },
  { module: "roles", moduleLabel: "Roles", action: "export", label: "Export roles" },
  { module: "moderation", moduleLabel: "Moderation", action: "view", label: "View moderation queue" },
  { module: "moderation", moduleLabel: "Moderation", action: "posts", label: "Moderate posts" },
  { module: "moderation", moduleLabel: "Moderation", action: "reels", label: "Moderate reels" },
  { module: "moderation", moduleLabel: "Moderation", action: "stories", label: "Moderate stories" },
  { module: "moderation", moduleLabel: "Moderation", action: "comments", label: "Moderate comments" },
  { module: "moderation", moduleLabel: "Moderation", action: "approve", label: "Approve content" },
  { module: "moderation", moduleLabel: "Moderation", action: "reject", label: "Reject content" },
  { module: "moderation", moduleLabel: "Moderation", action: "delete", label: "Delete content" },
  { module: "moderation", moduleLabel: "Moderation", action: "resolveReports", label: "Resolve reports" },
  { module: "content", moduleLabel: "Content", action: "posts", label: "Manage posts" },
  { module: "content", moduleLabel: "Content", action: "reels", label: "Manage reels" },
  { module: "content", moduleLabel: "Content", action: "stories", label: "Manage stories" },
  { module: "content", moduleLabel: "Content", action: "comments", label: "Manage comments" },
  { module: "content", moduleLabel: "Content", action: "trending", label: "Trending content" },
  { module: "content", moduleLabel: "Content", action: "featured", label: "Featured content" },
  { module: "content", moduleLabel: "Content", action: "aiRecommendations", label: "AI recommendations" },
  { module: "communities", moduleLabel: "Communities", action: "view", label: "View communities" },
  { module: "communities", moduleLabel: "Communities", action: "manage", label: "Manage communities" },
  { module: "communities", moduleLabel: "Communities", action: "reports", label: "Community reports" },
  { module: "communities", moduleLabel: "Communities", action: "owners", label: "Manage owners" },
  { module: "communities", moduleLabel: "Communities", action: "moderators", label: "Manage moderators" },
  { module: "communities", moduleLabel: "Communities", action: "members", label: "Manage members" },
  { module: "communities", moduleLabel: "Communities", action: "analytics", label: "Community analytics" },
  { module: "communities", moduleLabel: "Communities", action: "moderate", label: "Moderate communities" },
  { module: "marketplace", moduleLabel: "Marketplace", action: "view", label: "View marketplace" },
  { module: "marketplace", moduleLabel: "Marketplace", action: "products", label: "Manage products" },
  { module: "marketplace", moduleLabel: "Marketplace", action: "stores", label: "Manage stores" },
  { module: "marketplace", moduleLabel: "Marketplace", action: "orders", label: "Manage orders" },
  { module: "marketplace", moduleLabel: "Marketplace", action: "track", label: "Track orders" },
  { module: "marketplace", moduleLabel: "Marketplace", action: "coupons", label: "Manage coupons" },
  { module: "marketplace", moduleLabel: "Marketplace", action: "refunds", label: "Manage refunds" },
  { module: "marketplace", moduleLabel: "Marketplace", action: "featured", label: "Feature products" },
  { module: "marketplace", moduleLabel: "Marketplace", action: "reviews", label: "Manage reviews" },
  { module: "marketplace", moduleLabel: "Marketplace", action: "inventory", label: "Manage inventory" },
  { module: "marketplace", moduleLabel: "Marketplace", action: "disputes", label: "Resolve disputes" },
  { module: "marketplace", moduleLabel: "Marketplace", action: "moderate", label: "Moderate listings" },
  { module: "analytics", moduleLabel: "Analytics", action: "view", label: "View analytics" },
  { module: "analytics", moduleLabel: "Analytics", action: "export", label: "Export analytics" },
  { module: "finance", moduleLabel: "Finance", action: "view", label: "View financial reports" },
  { module: "finance", moduleLabel: "Finance", action: "reports", label: "Refund / payout reports" },
  { module: "tickets", moduleLabel: "Support", action: "view", label: "View tickets" },
  { module: "tickets", moduleLabel: "Support", action: "manage", label: "Manage tickets" },
  { module: "tickets", moduleLabel: "Support", action: "resolve", label: "Resolve tickets" },
  { module: "ai", moduleLabel: "AI", action: "view", label: "View AI management" },
  { module: "ai", moduleLabel: "AI", action: "models", label: "Manage AI models" },
  { module: "ai", moduleLabel: "AI", action: "providers", label: "Manage providers" },
  { module: "ai", moduleLabel: "AI", action: "prompts", label: "Manage prompt templates" },
  { module: "ai", moduleLabel: "AI", action: "analytics", label: "AI analytics" },
  { module: "ai", moduleLabel: "AI", action: "moderation", label: "AI moderation" },
  { module: "ai", moduleLabel: "AI", action: "logs", label: "AI logs" },
  { module: "ai", moduleLabel: "AI", action: "usage", label: "AI usage" },
  { module: "ai", moduleLabel: "AI", action: "switching", label: "Model switching" },
  { module: "ai", moduleLabel: "AI", action: "manage", label: "Manage AI settings" },
  { module: "security", moduleLabel: "Security", action: "view", label: "View security" },
  { module: "security", moduleLabel: "Security", action: "loginLogs", label: "Login logs" },
  { module: "security", moduleLabel: "Security", action: "audit", label: "Audit logs" },
  { module: "security", moduleLabel: "Security", action: "ip", label: "IP management" },
  { module: "security", moduleLabel: "Security", action: "rateLimit", label: "Rate limiting" },
  { module: "security", moduleLabel: "Security", action: "twoFactor", label: "2FA management" },
  { module: "security", moduleLabel: "Security", action: "reports", label: "Security reports" },
  { module: "security", moduleLabel: "Security", action: "suspicious", label: "Suspicious activity" },
  { module: "security", moduleLabel: "Security", action: "apiMonitoring", label: "API monitoring" },
  { module: "security", moduleLabel: "Security", action: "sessions", label: "Session management" },
  { module: "security", moduleLabel: "Security", action: "manage", label: "Manage security" },
  { module: "settings", moduleLabel: "Settings", action: "view", label: "View settings" },
  { module: "settings", moduleLabel: "Settings", action: "manage", label: "System configuration" },
  { module: "settings", moduleLabel: "Settings", action: "security", label: "Security settings" },
  { module: "settings", moduleLabel: "Settings", action: "apiKeys", label: "API keys" },
  { module: "settings", moduleLabel: "Settings", action: "database", label: "Database monitoring" },
  { module: "settings", moduleLabel: "Settings", action: "server", label: "Server settings" },
  { module: "settings", moduleLabel: "Settings", action: "featureFlags", label: "Feature flags" },
  { module: "settings", moduleLabel: "Settings", action: "backup", label: "Backup & restore" },
  { module: "settings", moduleLabel: "Settings", action: "announcements", label: "Announcements" },
  { module: "settings", moduleLabel: "Settings", action: "notifications", label: "Notifications" },
];

export const ADMIN_ROLES: AdminRole[] = [
  {
    id: "SUPER_ADMIN",
    name: "Super Admin",
    tagline: "Full platform access",
    description: "Unrestricted access to every module, resource and configuration across NOVA AI.",
    color: "#8b5cf6",
    emoji: "👑",
    system: true,
    members: 2,
    permissions: ["*"],
  },
  {
    id: "MODERATOR",
    name: "Moderator",
    tagline: "Content moderation",
    description: "Approves or removes posts, reels, stories and comments; warns, suspends or temp-bans users and resolves reports.",
    color: "#f59e0b",
    emoji: "🛡️",
    members: 6,
    permissions: [
      "dashboard.view",
      "users.view", "users.warn", "users.suspend", "users.ban",
      "moderation.view", "moderation.posts", "moderation.reels", "moderation.stories", "moderation.comments",
      "moderation.approve", "moderation.reject", "moderation.delete", "moderation.resolveReports",
      "communities.view", "communities.moderate",
      "marketplace.view", "marketplace.moderate",
    ],
  },
  {
    id: "SUPPORT_ADMIN",
    name: "Support Admin",
    tagline: "Customer support",
    description: "Handles support tickets, refunds, marketplace disputes and order tracking. View-only on user profiles and no security changes.",
    color: "#0ea5e9",
    emoji: "🎧",
    members: 4,
    permissions: [
      "dashboard.view",
      "users.view", "users.assist", "users.passwordReset", "users.recovery",
      "tickets.view", "tickets.manage", "tickets.resolve",
      "marketplace.orders", "marketplace.track", "marketplace.refunds", "marketplace.disputes",
      "finance.reports",
    ],
  },
  {
    id: "MARKETPLACE_ADMIN",
    name: "Marketplace Admin",
    tagline: "Marketplace operations",
    description: "Manages products, stores, sellers, orders, coupons, refunds, featured products, reviews and inventory.",
    color: "#10b981",
    emoji: "🛍️",
    members: 3,
    permissions: [
      "dashboard.view",
      "users.view",
      "marketplace.view", "marketplace.products", "marketplace.stores", "marketplace.orders",
      "marketplace.coupons", "marketplace.refunds", "marketplace.featured", "marketplace.reviews",
      "marketplace.inventory", "marketplace.disputes",
    ],
  },
  {
    id: "COMMUNITY_ADMIN",
    name: "Community Admin",
    tagline: "Community operations",
    description: "Manages communities, community reports, owners, moderators, members and community analytics.",
    color: "#06b6d4",
    emoji: "🌐",
    members: 3,
    permissions: [
      "dashboard.view",
      "users.view",
      "communities.view", "communities.manage", "communities.reports", "communities.owners",
      "communities.moderators", "communities.members", "communities.analytics",
    ],
  },
  {
    id: "CONTENT_ADMIN",
    name: "Content Admin",
    tagline: "Content curation",
    description: "Manages posts, reels, stories, comments, trending and featured content plus AI recommendations.",
    color: "#ec4899",
    emoji: "🎬",
    members: 4,
    permissions: [
      "dashboard.view",
      "moderation.view", "moderation.posts", "moderation.reels", "moderation.stories", "moderation.comments",
      "moderation.approve", "moderation.reject", "moderation.delete",
      "content.posts", "content.reels", "content.stories", "content.comments",
      "content.trending", "content.featured", "content.aiRecommendations",
    ],
  },
  {
    id: "ANALYTICS_ADMIN",
    name: "Analytics Admin",
    tagline: "Read-only analytics",
    description: "Read-only access to revenue, growth, users, marketplace, communities, reports, traffic and performance.",
    color: "#3b82f6",
    emoji: "📊",
    members: 2,
    permissions: ["dashboard.view", "analytics.view", "analytics.export", "finance.view", "finance.reports"],
  },
  {
    id: "SECURITY_ADMIN",
    name: "Security Admin",
    tagline: "Platform security",
    description: "Login logs, audit logs, IP management, rate limiting, 2FA, security reports, suspicious activity, API monitoring and sessions.",
    color: "#ef4444",
    emoji: "🔐",
    members: 2,
    permissions: [
      "dashboard.view",
      "security.view", "security.loginLogs", "security.audit", "security.ip", "security.rateLimit",
      "security.twoFactor", "security.reports", "security.suspicious", "security.apiMonitoring",
      "security.sessions", "security.manage",
      "settings.security",
    ],
  },
  {
    id: "AI_ADMIN",
    name: "AI Admin",
    tagline: "AI operations",
    description: "Manages AI models, providers, prompt templates, AI analytics, moderation, logs, usage and model switching.",
    color: "#d946ef",
    emoji: "🤖",
    members: 2,
    permissions: [
      "dashboard.view",
      "ai.view", "ai.models", "ai.providers", "ai.prompts", "ai.analytics", "ai.moderation",
      "ai.logs", "ai.usage", "ai.switching", "ai.manage",
    ],
  },
];

export const TAB_PERMISSIONS: Record<string, string> = {
  dashboard: "dashboard.view",
  users: "users.view",
  roles: "roles.manage",
  moderation: "moderation.view",
  communities: "communities.view",
  marketplace: "marketplace.view",
  analytics: "analytics.view",
  audit: "security.audit",
  settings: "settings.view",
};

export function getRole(id: string): AdminRole {
  return ADMIN_ROLES.find((r) => r.id === id) || ADMIN_ROLES[0];
}

export function can(roleId: string | undefined, permission: string): boolean {
  if (!roleId) return false;
  const role = getRole(roleId);
  if (!role) return false;
  return role.permissions.includes("*") || role.permissions.includes(permission);
}

export function canAny(roleId: string | undefined, permissions: string[]): boolean {
  return permissions.some((p) => can(roleId, p));
}

export function roleColor(role: string): string {
  return getRole(role).color;
}

// ---------------------------------------------------------------------------
// SEEDED DATA
// ---------------------------------------------------------------------------

const FIRST = [
  "Ayesha", "Bilal", "Fatima", "Hamza", "Hina", "Imran", "Junaid", "Kiran", "Mahnoor",
  "Noman", "Omar", "Priya", "Rahul", "Sana", "Tariq", "Uzma", "Vivek", "Waleed", "Zoya",
  "Ahmed", "Dania", "Farhan", "Gul", "Hassan", "Iqra", "Kashif", "Laraib", "Mehak",
  "Nadia", "Osama", "Rabia", "Saad", "Talha", "Umair", "Yasir", "Zain", "Ali", "Sara",
];

const LAST = [
  "Khan", "Ahmed", "Ali", "Hussain", "Raza", "Malik", "Sheikh", "Chaudhry", "Butt", "Qureshi",
  "Baig", "Mirza", "Iqbal", "Anwar", "Farooq", "Shah", "Abbas", "Usmani", "Siddiqui", "Ansari",
  "Haider", "Rana", "Niazi", "Javed", "Akhtar", "Saleem", "Arif", "Nadeem", "Kamran", "Sohail",
];

const ROLES = ["USER", "CREATOR", "INSTRUCTOR", "MODERATOR", "SUPPORT_ADMIN", "MARKETPLACE_ADMIN", "COMMUNITY_ADMIN", "CONTENT_ADMIN", "ANALYTICS_ADMIN", "SECURITY_ADMIN", "AI_ADMIN", "ADMIN"];

export function seedAdminUsers(count = 44): AdminUserRow[] {
  const users: AdminUserRow[] = [
    {
      id: "35e1a65b-3e1a-4493-a967-00f24754f19c",
      username: "testnova",
      email: "testnova@nova.ai",
      firstName: "Test",
      lastName: "User",
      role: "SUPER_ADMIN",
      status: "ACTIVE",
      isSuspended: false,
      createdAt: isoDaysAgo(320),
      lastActiveAt: isoHoursAgo(0.2),
      postsCount: 8,
      followersCount: 1284,
      followingCount: 96,
    },
    {
      id: "ab21a1fb-b199-46bb-a6f1-91995c955bda",
      username: "abdullah143339",
      email: "abdullah143339@gmail.com",
      firstName: "Abdullah",
      lastName: "Fuji",
      role: "SUPER_ADMIN",
      status: "ACTIVE",
      isSuspended: false,
      createdAt: isoDaysAgo(400),
      lastActiveAt: isoHoursAgo(3),
      postsCount: 24,
      followersCount: 5210,
      followingCount: 154,
    },
  ];
  const baseSeed = hashSeed("nova-admin-users");
  for (let i = 0; i < count; i++) {
    const first = pickFrom(FIRST, baseSeed, i);
    const last = pickFrom(LAST, baseSeed, i + 7);
    const username = `${first}${last}`.toLowerCase().replace(/\s+/g, "");
    const role = pickFrom(ROLES, baseSeed + i, i + 3);
    const statusPool: AdminUserRow["status"][] = ["ACTIVE", "ACTIVE", "ACTIVE", "ACTIVE", "INACTIVE", "SUSPENDED", "BANNED"];
    const status = pickFrom(statusPool, baseSeed + i * 3, i);
    users.push({
      id: `usr-${i}-${baseSeed % 1000}`,
      username,
      email: `${username}@${pickFrom(["gmail.com", "yahoo.com", "outlook.com", "proton.me", "nova.ai"], baseSeed + i, i)}`,
      firstName: first,
      lastName: last,
      role,
      status,
      isSuspended: status === "SUSPENDED" || status === "BANNED",
      createdAt: isoDaysAgo(10 + ((baseSeed + i * 17) % 380)),
      lastActiveAt: isoHoursAgo(((baseSeed + i * 13) % 260) + 0.5),
      postsCount: (baseSeed + i * 5) % 120,
      followersCount: (baseSeed + i * 29) % 9000,
      followingCount: (baseSeed + i * 11) % 700,
    });
  }
  return users;
}

export function getRoleMembersCounts(): Record<string, number> {
  const counts: Record<string, number> = {};
  ADMIN_ROLES.forEach((r) => (counts[r.id] = r.members));
  const seeded = seedAdminUsers(44);
  seeded.forEach((u) => {
    const role = getRole(u.role);
    if (role) counts[role.id] = (counts[role.id] || 0) + 1;
    else counts.USER = (counts.USER || 0) + 1;
  });
  counts.USER = Math.max(0, 396 - Object.values(counts).reduce((a, b) => a + b, 0) + (counts.USER || 0));
  return counts;
}

const AUDIT_ACTIONS: { action: string; label: string; resource: string }[] = [
  { action: "DELETE_USER", label: "User Deleted", resource: "user" },
  { action: "BAN_USER", label: "User Banned", resource: "user" },
  { action: "UNBAN_USER", label: "User Unbanned", resource: "user" },
  { action: "DELETE_POST", label: "Post Removed", resource: "post" },
  { action: "APPROVE_POST", label: "Post Approved", resource: "post" },
  { action: "REJECT_POST", label: "Post Rejected", resource: "post" },
  { action: "DELETE_REEL", label: "Reel Removed", resource: "reel" },
  { action: "APPROVE_REEL", label: "Reel Approved", resource: "reel" },
  { action: "DELETE_COMMUNITY", label: "Community Deleted", resource: "community" },
  { action: "MODERATE_COMMUNITY", label: "Community Moderated", resource: "community" },
  { action: "REFUND_APPROVED", label: "Refund Approved", resource: "refund" },
  { action: "ROLE_UPDATED", label: "Role Updated", resource: "role" },
  { action: "ROLE_CREATED", label: "Role Created", resource: "role" },
  { action: "SETTINGS_CHANGED", label: "Settings Changed", resource: "settings" },
  { action: "API_KEY_UPDATED", label: "API Key Updated", resource: "apiKey" },
  { action: "STORE_SUSPENDED", label: "Store Suspended", resource: "store" },
  { action: "RESOLVE_REPORT", label: "Report Resolved", resource: "report" },
  { action: "FEATURE_TOGGLED", label: "Feature Toggled", resource: "featureFlag" },
];

const ADMIN_NAMES = ["abdullah143339", "testnova", "moderator_niazi", "mod_kiran", "support_umair", "mp_raza", "sec_hamza", "ai_omar"];

export function seedAuditLogs(count = 34): AuditLogItem[] {
  const seed = hashSeed("nova-admin-audit");
  const items: AuditLogItem[] = [];
  for (let i = 0; i < count; i++) {
    const def = pickFrom(AUDIT_ACTIONS, seed + i * 3, i);
    const adminName = pickFrom(ADMIN_NAMES, seed + i, i + 1);
    const role = adminName.includes("moderator") || adminName.includes("mod_") ? "MODERATOR" : adminName.includes("support") ? "SUPPORT_ADMIN" : adminName.includes("mp_") ? "MARKETPLACE_ADMIN" : adminName.includes("sec_") ? "SECURITY_ADMIN" : adminName.includes("ai_") ? "AI_ADMIN" : "SUPER_ADMIN";
    items.push({
      id: `audit-${seed}-${i}`,
      action: def.action,
      actionLabel: def.label,
      adminName,
      role,
      timestamp: isoHoursAgo(((seed + i * 7) % 300) + 0.1),
      ipAddress: `103.${(seed + i * 13) % 255}.${(seed + i * 29) % 255}.${(seed + i * 7) % 255}`,
      resource: def.resource,
      resourceId: `res-${(seed + i * 11) % 9999}`,
      details: `${def.label} by @${adminName}`,
    });
  }
  return items;
}

const REPORT_REASONS = [
  "Spam content", "Harassment or hate speech", "Misinformation", "Inappropriate content",
  "Impersonation", "Scam or fraud", "Intellectual property", "Violence or threats",
  "Nudity / adult content", "Marketplace counterfeit",
];

export function seedReports(count = 10): ReportRow[] {
  const seed = hashSeed("nova-admin-reports");
  const types: ReportRow["type"][] = ["POST", "REEL", "STORY", "COMMENT", "COMMUNITY", "MARKETPLACE"];
  const statuses: ReportRow["status"][] = ["PENDING", "PENDING", "PENDING", "REVIEWING", "RESOLVED", "REJECTED"];
  const items: ReportRow[] = [];
  for (let i = 0; i < count; i++) {
    items.push({
      id: `rep-${seed}-${i}`,
      type: pickFrom(types, seed + i * 3, i),
      reason: pickFrom(REPORT_REASONS, seed + i, i + 2),
      targetLabel: `@${pickFrom(FIRST, seed + i, i).toLowerCase()}${pickFrom(LAST, seed + i, i + 1).toLowerCase()}`,
      reporter: `@${pickFrom(FIRST, seed + i * 2, i + 3).toLowerCase()}`,
      timestamp: isoHoursAgo(((seed + i * 5) % 200) + 0.5),
      status: pickFrom(statuses, seed + i * 7, i),
    });
  }
  return items;
}

const POST_TEXTS = [
  "Just shipped the v2 of my AI dashboard — the new charts are gorgeous 📊",
  "5 tips to grow on NOVA in 2026 that actually work",
  "Finally hit 1K followers! Thanks everyone 🎉",
  "Building a voice assistant with NestJS + WebSockets this weekend",
  "Open-sourced my resume builder — check the repo link 🔗",
  "Hot take: community is the new network. Thoughts?",
  "My daily prompt engineering workflow (save this) 🧵",
  "Team meeting went from 1h to 15m with AI minutes. Game changer.",
];

export function seedModPosts(count = 14): ModPostRow[] {
  const seed = hashSeed("nova-admin-posts");
  const statuses: ModPostRow["status"][] = ["PENDING", "PENDING", "APPROVED", "APPROVED", "REJECTED"];
  const items: ModPostRow[] = [];
  for (let i = 0; i < count; i++) {
    items.push({
      id: `post-${seed}-${i}`,
      content: pickFrom(POST_TEXTS, seed + i, i),
      type: pickFrom(["TEXT", "TEXT", "IMAGE", "VIDEO", "TEXT"] as const, seed + i * 2, i),
      author: `@${pickFrom(FIRST, seed + i, i + 2).toLowerCase()}`,
      createdAt: isoHoursAgo(((seed + i * 3) % 240) + 0.2),
      reactions: (seed + i * 17) % 500,
      comments: (seed + i * 5) % 80,
      status: pickFrom(statuses, seed + i * 3, i),
    });
  }
  return items;
}

export function seedReels(count = 8): ModPostRow[] {
  const seed = hashSeed("nova-admin-reels");
  const statuses: ModPostRow["status"][] = ["PENDING", "PENDING", "APPROVED", "APPROVED", "REJECTED"];
  const items: ModPostRow[] = [];
  for (let i = 0; i < count; i++) {
    items.push({
      id: `reel-${seed}-${i}`,
      content: pickFrom(POST_TEXTS, seed + i * 2, i).slice(0, 60),
      type: "VIDEO",
      author: `@${pickFrom(FIRST, seed + i, i + 4).toLowerCase()}`,
      createdAt: isoHoursAgo(((seed + i * 7) % 160) + 0.3),
      reactions: (seed + i * 23) % 2000,
      comments: (seed + i * 9) % 300,
      status: pickFrom(statuses, seed + i * 3, i),
    });
  }
  return items;
}

export function seedStories(count = 6): StoryRow[] {
  const seed = hashSeed("nova-admin-stories");
  const statuses: StoryRow["status"][] = ["PENDING", "PENDING", "APPROVED", "APPROVED", "REJECTED"];
  const items: StoryRow[] = [];
  for (let i = 0; i < count; i++) {
    items.push({
      id: `story-${seed}-${i}`,
      author: `@${pickFrom(FIRST, seed + i, i + 1).toLowerCase()}`,
      mediaType: pickFrom(["IMAGE", "IMAGE", "VIDEO"] as const, seed + i, i),
      createdAt: isoHoursAgo(((seed + i * 11) % 90) + 0.1),
      views: (seed + i * 37) % 3000,
      status: pickFrom(statuses, seed + i * 3, i),
    });
  }
  return items;
}

export function seedComments(count = 10): CommentRow[] {
  const seed = hashSeed("nova-admin-comments");
  const statuses: CommentRow["status"][] = ["PENDING", "PENDING", "APPROVED", "APPROVED", "REJECTED"];
  const texts = ["This is so good!", "lol 😂", "Can you share the link?", "Totally disagree, here's why…", "Thanks for sharing 🙌", "Reported content here", "Great thread, following", "First 🥇"];
  const items: CommentRow[] = [];
  for (let i = 0; i < count; i++) {
    items.push({
      id: `cmt-${seed}-${i}`,
      author: `@${pickFrom(FIRST, seed + i, i + 5).toLowerCase()}`,
      content: pickFrom(texts, seed + i * 2, i),
      postTitle: pickFrom(POST_TEXTS, seed + i, i).slice(0, 42),
      createdAt: isoHoursAgo(((seed + i * 5) % 120) + 0.2),
      likes: (seed + i * 13) % 200,
      status: pickFrom(statuses, seed + i * 3, i),
    });
  }
  return items;
}

const COMMUNITY_NAMES: [string, string][] = [
  ["AI Innovators", "AI"],
  ["NOVA Creators", "Creators"],
  ["TypeScript Masters", "Development"],
  ["UI/UX Design Hub", "Design"],
  ["Photography", "Hobbies"],
  ["Startup Founders", "Business"],
  ["Web3 & Blockchain", "Tech"],
  ["Gaming Arena", "Gaming"],
  ["Digital Marketing", "Business"],
  ["Data Science Lounge", "Development"],
  ["Travel Diaries", "Hobbies"],
  ["Remote Work Club", "Career"],
];

export function seedCommunities(count = 12): CommunityRow[] {
  const seed = hashSeed("nova-admin-communities");
  const statuses: CommunityRow["status"][] = ["ACTIVE", "ACTIVE", "ACTIVE", "FLAGGED", "SUSPENDED"];
  const items: CommunityRow[] = [];
  for (let i = 0; i < count; i++) {
    const [name, category] = COMMUNITY_NAMES[i % COMMUNITY_NAMES.length];
    items.push({
      id: `comm-${seed}-${i}`,
      name,
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      category,
      description: `Community for ${category.toLowerCase()} enthusiasts on NOVA AI.`,
      membersCount: 120 + ((seed + i * 31) % 9000),
      postsCount: (seed + i * 19) % 800,
      owner: `@${pickFrom(FIRST, seed + i, i).toLowerCase()}`,
      createdAt: isoDaysAgo(20 + ((seed + i * 7) % 320)),
      status: pickFrom(statuses, seed + i * 3, i),
      featured: i % 4 === 0,
    });
  }
  return items;
}

const PRODUCT_NAMES: [string, string][] = [
  ["AI-Powered Resume Builder", "Software"],
  ["Premium Thumbnail Pack", "Digital Assets"],
  ["Nova Pro Notion Template", "Templates"],
  ["React Component Library", "Code"],
  ["UI Design System (Figma)", "Design"],
  ["SEO Audit Course", "Courses"],
  ["Cloud Hosting (1yr)", "Services"],
  ["Brand Identity Kit", "Design"],
  ["TypeScript Masterclass", "Courses"],
  ["Noise-Cancelling Headset", "Hardware"],
  ["Mechanical Keyboard", "Hardware"],
  ["Prompt Engineering Bundle", "Digital Assets"],
  ["Web Scraper API Credits", "Services"],
  ["Custom Portfolio Website", "Services"],
];

export function seedMarketplaceProducts(count = 14): MarketplaceProductRow[] {
  const seed = hashSeed("nova-admin-products");
  const statuses: MarketplaceProductRow["status"][] = ["ACTIVE", "ACTIVE", "ACTIVE", "PENDING", "PENDING", "SUSPENDED", "HIDDEN"];
  const items: MarketplaceProductRow[] = [];
  for (let i = 0; i < count; i++) {
    const [title, category] = PRODUCT_NAMES[i % PRODUCT_NAMES.length];
    items.push({
      id: `prod-${seed}-${i}`,
      title,
      category,
      price: 5 + ((seed + i * 29) % 300),
      type: pickFrom(["PRODUCT", "SERVICE", "DIGITAL", "COURSE"] as const, seed + i, i),
      seller: `@${pickFrom(FIRST, seed + i, i + 1).toLowerCase()}`,
      status: pickFrom(statuses, seed + i * 3, i),
      rating: (3 + ((seed + i * 7) % 20)) / 10,
      sales: (seed + i * 41) % 900,
      stock: (seed + i * 13) % 200,
      featured: i % 3 === 0,
    });
  }
  return items;
}

const ORDER_STATUSES: OrderRow["status"][] = ["PENDING", "PAID", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"];

export function seedOrders(count = 12): OrderRow[] {
  const seed = hashSeed("nova-admin-orders");
  const items: OrderRow[] = [];
  for (let i = 0; i < count; i++) {
    items.push({
      id: `ord-${seed}-${i}`,
      orderNo: `NV-${(82000 + seed + i * 17) % 90000}`,
      buyer: `@${pickFrom(FIRST, seed + i, i + 2).toLowerCase()}`,
      seller: `@${pickFrom(FIRST, seed + i, i + 6).toLowerCase()}`,
      product: PRODUCT_NAMES[(seed + i) % PRODUCT_NAMES.length][0],
      amount: 5 + ((seed + i * 31) % 400),
      status: pickFrom(ORDER_STATUSES, seed + i * 5, i),
      createdAt: isoHoursAgo(((seed + i * 9) % 720) + 1),
      paymentMethod: pickFrom(["Visa", "Mastercard", "PayPal", "Wallet", "UPI"] as const, seed + i, i),
    });
  }
  return items;
}

export function seedCoupons(count = 6): CouponRow[] {
  const seed = hashSeed("nova-admin-coupons");
  const items: CouponRow[] = [];
  for (let i = 0; i < count; i++) {
    items.push({
      id: `coup-${seed}-${i}`,
      code: `NOVA${(1000 + seed + i * 37) % 9000}`,
      description: pickFrom(["New user welcome", "Festive sale", "Creator launch", "Flash weekend", "Course discount", "Member perk"], seed + i, i),
      discount: 5 + ((seed + i * 11) % 45),
      type: pickFrom(["PERCENT", "PERCENT", "FIXED"] as const, seed + i, i),
      maxUses: 100 + ((seed + i * 23) % 900),
      used: (seed + i * 17) % 500,
      expiresAt: isoDaysAgo(-(10 + ((seed + i * 7) % 60))),
      active: i % 3 !== 1,
    });
  }
  return items;
}

export function seedRefunds(count = 6): RefundRow[] {
  const seed = hashSeed("nova-admin-refunds");
  const statuses: RefundRow["status"][] = ["PENDING", "PENDING", "APPROVED", "REJECTED", "PROCESSED"];
  const reasons = ["Item not as described", "Never received", "Requested cancellation", "Accidental purchase", "Defective product"];
  const items: RefundRow[] = [];
  for (let i = 0; i < count; i++) {
    items.push({
      id: `ref-${seed}-${i}`,
      orderNo: `NV-${(83000 + seed + i * 13) % 90000}`,
      buyer: `@${pickFrom(FIRST, seed + i, i + 3).toLowerCase()}`,
      amount: 10 + ((seed + i * 23) % 250),
      reason: pickFrom(reasons, seed + i, i),
      status: pickFrom(statuses, seed + i * 3, i),
      createdAt: isoHoursAgo(((seed + i * 11) % 400) + 1),
    });
  }
  return items;
}

export function seedReviews(count = 8): ReviewRow[] {
  const seed = hashSeed("nova-admin-reviews");
  const statuses: ReviewRow["status"][] = ["PUBLISHED", "PUBLISHED", "PUBLISHED", "PENDING", "REMOVED"];
  const items: ReviewRow[] = [];
  for (let i = 0; i < count; i++) {
    items.push({
      id: `rev-${seed}-${i}`,
      product: PRODUCT_NAMES[(seed + i) % PRODUCT_NAMES.length][0],
      reviewer: `@${pickFrom(FIRST, seed + i, i + 1).toLowerCase()}`,
      rating: 3 + ((seed + i * 5) % 3),
      content: pickFrom(["Amazing quality, would recommend!", "Good value for the price.", "Doesn't meet expectations.", "Incredible, shipping was fast!", "Exactly as described."], seed + i, i),
      status: pickFrom(statuses, seed + i * 3, i),
      createdAt: isoDaysAgo(1 + ((seed + i * 7) % 30)),
    });
  }
  return items;
}

const MONTH_LABELS = ["Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"];

function series(base: number, growth: number, seed: number): { label: string; value: number }[] {
  return MONTH_LABELS.map((label, i) => {
    const jitter = ((seed + i * 37) % 20) - 10;
    return { label, value: Math.max(0, Math.round(base * (1 + i * growth / 11) * (1 + jitter / 100))) };
  });
}

export function seedAnalytics(): AnalyticsData {
  const seed = hashSeed("nova-admin-analytics");
  return {
    revenue: series(42000, 0.9, seed + 1),
    newUsers: series(900, 0.65, seed + 2),
    activeUsers: series(6200, 0.35, seed + 3),
    traffic: series(180000, 0.5, seed + 4),
    gmv: series(68000, 1.1, seed + 5),
    aiRequests: series(15000, 1.4, seed + 6),
    growth: series(4, 1.2, seed + 7),
  };
}

export function seedSettings(): SystemSetting[] {
  return [
    { key: "site_name", group: "general", label: "Platform name", description: "Display name shown across the platform", type: "text", value: "NOVA AI" },
    { key: "allow_registration", group: "general", label: "Open registration", description: "Allow new users to sign up without invites", type: "toggle", value: true },
    { key: "maintenance_mode", group: "general", label: "Maintenance mode", description: "Show a maintenance screen to non-admins", type: "toggle", value: false },
    { key: "default_language", group: "general", label: "Default language", description: "Fallback locale for new users", type: "select", value: "English", options: ["English", "Urdu", "Hindi", "Spanish", "Arabic", "French"] },
    { key: "default_theme", group: "general", label: "Default theme", description: "Theme applied for new visitors", type: "select", value: "Dark", options: ["Dark", "Light", "System"] },
    { key: "enforce_2fa", group: "security", label: "Enforce 2FA for admins", description: "Require two-factor authentication for all admin roles", type: "toggle", value: true },
    { key: "session_timeout", group: "security", label: "Session timeout (min)", description: "Idle minutes before an admin session expires", type: "select", value: "30", options: ["15", "30", "60", "120"] },
    { key: "rate_limiting", group: "security", label: "Global rate limiting", description: "Throttle API requests per IP per minute", type: "toggle", value: true },
    { key: "ip_logging", group: "security", label: "IP logging", description: "Record IP addresses in audit and login logs", type: "toggle", value: true },
    { key: "password_confirm", group: "security", label: "Password confirmation", description: "Require password before sensitive admin actions", type: "toggle", value: true },
    { key: "email_verification", group: "security", label: "Require email verification", description: "Block logins until email is verified", type: "toggle", value: false },
    { key: "notif_email", group: "notifications", label: "Email notifications", description: "Send transactional emails to users", type: "toggle", value: true },
    { key: "notif_push", group: "notifications", label: "Push notifications", description: "Browser push notifications for engaged users", type: "toggle", value: true },
    { key: "notif_digest", group: "notifications", label: "Weekly digest", description: "Send a weekly activity summary email", type: "toggle", value: false },
    { key: "ai_model", group: "ai", label: "Default AI model", description: "Model used by the AI router by default", type: "select", value: "Mistral 7B", options: ["Mistral 7B", "Llama 3", "GPT-4o", "Claude Sonnet", "Gemini Flash"] },
    { key: "ai_moderation", group: "ai", label: "AI content moderation", description: "Auto-screen posts and comments with AI", type: "toggle", value: true },
    { key: "ai_fallback", group: "ai", label: "AI fallback enabled", description: "Route to backup provider when primary fails", type: "toggle", value: true },
    { key: "payout_fees", group: "billing", label: "Payout fee (%)", description: "Platform fee applied to seller payouts", type: "select", value: "5", options: ["0", "3", "5", "8", "10"] },
    { key: "currency", group: "billing", label: "Default currency", description: "Marketplace and wallet currency", type: "select", value: "USD", options: ["USD", "EUR", "GBP", "PKR", "INR"] },
    { key: "tax_rate", group: "billing", label: "Tax rate (%)", description: "Sales tax applied to marketplace orders", type: "select", value: "0", options: ["0", "5", "10", "18"] },
  ];
}

export function seedFeatureFlags(): FeatureFlag[] {
  return [
    { key: "ff.reels", label: "Reels", description: "Short-form video reels across the platform", enabled: true, rollout: 100, impact: "high" },
    { key: "ff.stories", label: "Stories", description: "24-hour ephemeral stories", enabled: true, rollout: 60, impact: "high" },
    { key: "ff.marketplace", label: "Marketplace", description: "Products, services and digital goods", enabled: true, rollout: 100, impact: "high" },
    { key: "ff.communities", label: "Communities", description: "Interest-based community groups", enabled: true, rollout: 100, impact: "medium" },
    { key: "ff.ai.assistant", label: "AI Assistant", description: "Conversational AI assistant", enabled: true, rollout: 100, impact: "high" },
    { key: "ff.ai.router", label: "AI Router", description: "Model routing and provider failover", enabled: true, rollout: 80, impact: "high" },
    { key: "ff.ai.image", label: "AI Image Generation", description: "Text-to-image generation", enabled: true, rollout: 40, impact: "medium" },
    { key: "ff.voice.messages", label: "Voice Messages", description: "Voice recordings in DMs", enabled: true, rollout: 25, impact: "low" },
    { key: "ff.gamification", label: "Gamification", description: "Badges, leaderboards and XP", enabled: false, rollout: 0, impact: "low" },
    { key: "ff.live.streaming", label: "Live Streaming", description: "Live video broadcast support", enabled: false, rollout: 0, impact: "high" },
  ];
}

export function seedSecurityEvents(count = 12): SecurityEvent[] {
  const seed = hashSeed("nova-admin-security");
  const labels = ["Failed login (5x)", "New device login", "Suspicious IP blocked", "2FA enabled", "Password changed", "API key created", "Rate limit triggered", "Session revoked", "IP whitelisted", "2FA disabled"];
  const severities: SecurityEvent["severity"][] = ["LOW", "LOW", "MEDIUM", "MEDIUM", "HIGH", "CRITICAL"];
  const items: SecurityEvent[] = [];
  for (let i = 0; i < count; i++) {
    items.push({
      id: `sec-${seed}-${i}`,
      type: pickFrom(["LOGIN", "DEVICE", "IP", "2FA", "API", "SESSION", "RATE_LIMIT"], seed + i, i),
      label: pickFrom(labels, seed + i, i),
      user: `@${pickFrom(FIRST, seed + i, i + 1).toLowerCase()}`,
      ipAddress: `103.${(seed + i * 11) % 255}.${(seed + i * 23) % 255}.${(seed + i * 3) % 255}`,
      timestamp: isoHoursAgo(((seed + i * 5) % 600) + 0.2),
      severity: pickFrom(severities, seed + i * 3, i),
      resolved: i % 3 !== 0,
    });
  }
  return items;
}

export const STOCK_NAMES = [
  "AI-Powered Resume Builder",
  "React Component Library",
  "Nova Pro Notion Template",
  "TypeScript Masterclass",
  "Brand Identity Kit",
  "Prompt Engineering Bundle",
  "Web Scraper API Credits",
  "Custom Portfolio Website",
];
