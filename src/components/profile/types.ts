export interface ProfileUser {
  id: string;
  username: string;
  displayName?: string;
  avatar?: string | null;
  coverImage?: string | null;
  bio?: string | null;
  location?: string | null;
  website?: string | null;
  createdAt?: string;
}

export interface ProfileMeta {
  headline?: string | null;
  about?: string | null;
  skills?: string;
  interests?: string;
  languages?: string;
  education?: string;
  experience?: string;
  resumeUrl?: string | null;
  portfolioUrl?: string | null;
  linkedinUrl?: string | null;
  githubUrl?: string | null;
  twitterUrl?: string | null;
  youtubeUrl?: string | null;
  followersCount?: number;
  followingCount?: number;
  postsCount?: number;
  endorsements?: number;
  viewCount?: number;
}

export interface ProfilePayload {
  id: string;
  username: string;
  displayName?: string;
  avatar?: string | null;
  coverImage?: string | null;
  bio?: string | null;
  location?: string | null;
  website?: string | null;
  createdAt?: string;
  profile?: ProfileMeta;
  _count?: { followers: number; following: number; posts: number };
}

export interface ReputationData {
  totalScore: number;
  trustScore: number;
  expertiseScore: number;
  activityScore: number;
  contributionScore: number;
  level: number;
  tier: string;
  badges: string;
}

export interface PostMedia {
  url: string;
  type: string;
}

export interface PostData {
  id: string;
  authorId: string;
  content: string;
  title?: string;
  type: string;
  media?: PostMedia[];
  tags?: string | string[];
  isPinned?: boolean;
  isLiked?: boolean;
  isBookmarked?: boolean;
  isAIGenerated?: boolean;
  reactionsCount?: number;
  commentsCount?: number;
  sharesCount?: number;
  viewCount?: number;
  createdAt: string;
  author?: { id: string; username: string; displayName?: string; avatar?: string | null };
  _count?: { comments: number; shares: number };
  likeCount?: number;
  commentCount?: number;
}

export interface MarketItem {
  id: string;
  sellerId?: string;
  title: string;
  description?: string;
  shortDescription?: string;
  price: number;
  category?: string;
  type?: string;
  status?: string;
  images?: (string | { url: string })[];
  rating?: number;
  salesCount?: number;
  viewCount?: number;
  isFeatured?: boolean;
}

export interface CommunityItem {
  id: string;
  name?: string;
  title?: string;
  slug?: string;
  description?: string;
  category?: string;
  memberCount?: number;
  _count?: { members?: number };
  ownerId?: string;
  role?: string;
}

export interface ProfileTabDef {
  id: string;
  label: string;
  icon: string;
}

export interface ProfilePrefs {
  accentColor: string;
  theme: string;
  layout: "grid" | "list";
  privacy: "public" | "private";
  pinnedLinks: string[];
  followCategories: string[];
  visibility: Record<string, boolean>;
}

export interface ToastMessage {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

export interface FollowerItem {
  id: string;
  name: string;
  username: string;
  avatar?: string;
  bio?: string;
  mutual: boolean;
  following: boolean;
  followedByMe: boolean;
  role?: string;
}

export interface AchievementDef {
  id: string;
  title: string;
  emoji: string;
  description: string;
  earned: boolean;
  date?: string;
  tier?: string;
}

export interface ActivityItem {
  id: string;
  emoji: string;
  text: string;
  detail?: string;
  date: string;
  kind: "post" | "comment" | "like" | "share" | "market" | "community" | "achievement" | "follow";
}

export interface ExperienceItem {
  role: string;
  company: string;
  period: string;
  description: string;
}

export interface EducationItem {
  degree: string;
  school: string;
  period: string;
}

export interface CertificationItem {
  name: string;
  issuer: string;
  year: string;
}

export interface ProjectDef {
  id: string;
  title: string;
  description: string;
  image?: string;
  tech: string[];
  github?: string;
  demo?: string;
  status: "Active" | "Completed" | "In Progress";
  stars?: number;
}
