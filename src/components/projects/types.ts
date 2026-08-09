export type ProjectStatus = "IDEA" | "IN_PROGRESS" | "COMPLETED";

export type ProjectVisibility = "PUBLIC" | "PRIVATE";

export type ProjectCategory =
  | "AI / ML"
  | "Web App"
  | "Mobile App"
  | "Dev Tool"
  | "Design System"
  | "Open Source Library"
  | "Data Science"
  | "Blockchain"
  | "Game"
  | "Hardware"
  | "AR / VR"
  | "Other";

export interface ProjectTeamMember {
  name: string;
  username: string;
  role: string;
}

export interface ProjectRoadmapPhase {
  phase: string;
  title: string;
  done: boolean;
}

export interface ProjectChangelogEntry {
  version: string;
  date: string;
  notes: string[];
}

export interface ProjectLinks {
  github?: string;
  demo?: string;
  docs?: string;
  download?: string;
}

export interface ProjectCreator {
  id?: string;
  name: string;
  username: string;
  verified: boolean;
  avatar: string;
  isFollowed?: boolean;
}

export interface ProjectStats {
  likes: number;
  views: number;
  comments: number;
  bookmarks: number;
  shares: number;
  stars?: number;
}

export interface ProjectRow {
  id: string;
  title: string;
  tagline: string;
  description: string;
  cover: string;
  logo: string;
  category: ProjectCategory | string;
  techStack: string[];
  tags: string[];
  status: ProjectStatus;
  visibility: ProjectVisibility;
  isOpenSource: boolean;
  isAI: boolean;
  isStartup: boolean;
  creator: ProjectCreator;
  stats: ProjectStats;
  links: ProjectLinks;
  license?: string;
  features: string[];
  roadmap: ProjectRoadmapPhase[];
  changelog: ProjectChangelogEntry[];
  team: ProjectTeamMember[];
  gallery: string[];
  demoVideo?: string;
  createdAt: string;
  updatedAt: string;
  draft: boolean;
  source: "post" | "showcase";
  postId?: string;
}

export interface ProjectCommentRow {
  id: string;
  user: { name: string; username: string; avatar: string };
  content: string;
  createdAt: string;
  likes: number;
}

export interface ProjectSection {
  title: string;
  subtitle: string;
  projects: ProjectRow[];
}
