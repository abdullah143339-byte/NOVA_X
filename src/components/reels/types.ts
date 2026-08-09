export interface ReelMedia {
  url: string;
  type?: string;
}

export interface ReelAuthor {
  id: string;
  username: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  avatar?: string | null;
  isVerified?: boolean;
}

export interface Reel {
  id: string;
  content: string;
  type: string;
  tags: string[];
  visibility?: string;
  isAIGenerated?: boolean;
  viewCount?: number;
  media?: ReelMedia[] | null;
  createdAt: string;
  author: ReelAuthor;
  isLiked?: boolean;
  isBookmarked?: boolean;
  likesCount?: number;
  commentsCount?: number;
  sharesCount?: number;
  location?: string;
  music?: string;
}

export interface ReelComment {
  id: string;
  content: string;
  postId: string;
  parentId?: string | null;
  isEdited?: boolean;
  isAIGenerated?: boolean;
  reactionsCount?: number;
  repliesCount?: number;
  createdAt: string;
  author?: {
    id: string;
    username: string;
    displayName?: string;
    firstName?: string;
    lastName?: string;
    avatar?: string | null;
    isVerified?: boolean;
  };
  _count?: { replies?: number };
  replies?: ReelComment[];
}
