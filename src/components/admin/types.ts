export interface ApiEnvelope {
  success?: boolean;
  data?: Record<string, unknown>;
  error?: string;
}

export interface RawRow {
  [key: string]: unknown;
  _count?: Record<string, unknown>;
}

export interface RawSeries {
  date: string;
  [key: string]: unknown;
}

export type AdminRoleId =
  | "SUPER_ADMIN"
  | "MODERATOR"
  | "SUPPORT_ADMIN"
  | "MARKETPLACE_ADMIN"
  | "COMMUNITY_ADMIN"
  | "CONTENT_ADMIN"
  | "ANALYTICS_ADMIN"
  | "SECURITY_ADMIN"
  | "AI_ADMIN";

export type UserStatusType = "ACTIVE" | "INACTIVE" | "SUSPENDED" | "BANNED" | "DEACTIVATED";

export interface AdminRole {
  id: AdminRoleId;
  name: string;
  tagline: string;
  description: string;
  color: string;
  emoji: string;
  permissions: string[];
  members: number;
  system?: boolean;
}

export interface AdminPermissionDef {
  module: string;
  moduleLabel: string;
  action: string;
  label: string;
}

export interface AdminUserRow {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  status: UserStatusType;
  isSuspended: boolean;
  createdAt: string;
  lastActiveAt: string;
  postsCount: number;
  followersCount: number;
  followingCount: number;
}

export interface AuditLogItem {
  id: string;
  action: string;
  actionLabel: string;
  adminName: string;
  role: string;
  timestamp: string;
  ipAddress: string;
  resource: string;
  resourceId?: string;
  details?: string;
}

export interface ReportRow {
  id: string;
  type: "POST" | "REEL" | "STORY" | "COMMENT" | "COMMUNITY" | "MARKETPLACE";
  reason: string;
  targetLabel: string;
  reporter: string;
  timestamp: string;
  status: "PENDING" | "REVIEWING" | "RESOLVED" | "REJECTED";
}

export interface ModPostRow {
  id: string;
  content: string;
  type: "TEXT" | "IMAGE" | "VIDEO";
  author: string;
  createdAt: string;
  reactions: number;
  comments: number;
  status: "PENDING" | "APPROVED" | "REJECTED";
}

export interface StoryRow {
  id: string;
  author: string;
  mediaType: "IMAGE" | "VIDEO";
  createdAt: string;
  views: number;
  status: "PENDING" | "APPROVED" | "REJECTED";
}

export interface CommentRow {
  id: string;
  author: string;
  content: string;
  postTitle: string;
  createdAt: string;
  likes: number;
  status: "PENDING" | "APPROVED" | "REJECTED";
}

export interface CommunityRow {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string;
  membersCount: number;
  postsCount: number;
  owner: string;
  createdAt: string;
  status: "ACTIVE" | "FLAGGED" | "SUSPENDED";
  featured: boolean;
}

export interface MarketplaceProductRow {
  id: string;
  title: string;
  category: string;
  price: number;
  type: "PRODUCT" | "SERVICE" | "DIGITAL" | "COURSE";
  seller: string;
  status: "ACTIVE" | "PENDING" | "SUSPENDED" | "HIDDEN";
  rating: number;
  sales: number;
  stock: number;
  featured: boolean;
}

export interface OrderRow {
  id: string;
  orderNo: string;
  buyer: string;
  seller: string;
  product: string;
  amount: number;
  status: "PENDING" | "PAID" | "SHIPPED" | "DELIVERED" | "CANCELLED" | "REFUNDED";
  createdAt: string;
  paymentMethod: string;
}

export interface CouponRow {
  id: string;
  code: string;
  description: string;
  discount: number;
  type: "PERCENT" | "FIXED";
  maxUses: number;
  used: number;
  expiresAt: string;
  active: boolean;
}

export interface RefundRow {
  id: string;
  orderNo: string;
  buyer: string;
  amount: number;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "PROCESSED";
  createdAt: string;
}

export interface ReviewRow {
  id: string;
  product: string;
  reviewer: string;
  rating: number;
  content: string;
  status: "PUBLISHED" | "PENDING" | "REMOVED";
  createdAt: string;
}

export interface SeriesPoint {
  label: string;
  value: number;
}

export interface AnalyticsData {
  revenue: SeriesPoint[];
  newUsers: SeriesPoint[];
  activeUsers: SeriesPoint[];
  traffic: SeriesPoint[];
  gmv: SeriesPoint[];
  aiRequests: SeriesPoint[];
  growth: SeriesPoint[];
}

export interface SystemSetting {
  key: string;
  group: "general" | "security" | "notifications" | "ai" | "billing";
  label: string;
  description: string;
  type: "toggle" | "select" | "text";
  value: boolean | string;
  options?: string[];
}

export interface FeatureFlag {
  key: string;
  label: string;
  description: string;
  enabled: boolean;
  rollout: number;
  impact: "high" | "medium" | "low";
}

export interface SecurityEvent {
  id: string;
  type: string;
  label: string;
  user: string;
  ipAddress: string;
  timestamp: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  resolved: boolean;
}

export interface AdminToast {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

export interface AdminStats {
  totalUsers: number;
  totalPosts: number;
  totalCommunities: number;
  totalProjects: number;
  totalRevenue: number;
  totalOrders: number;
  totalAIRequests: number;
  openTickets: number;
  pendingReports: number;
  activeReels: number;
  activeStories: number;
  marketplaceItems: number;
}

export type AdminTabId =
  | "dashboard"
  | "users"
  | "roles"
  | "moderation"
  | "communities"
  | "marketplace"
  | "analytics"
  | "audit"
  | "settings";
