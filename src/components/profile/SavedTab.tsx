"use client";

import { Loader2 } from "lucide-react";
import PostCardItem from "./PostCardItem";
import EmptyState from "./EmptyState";
import type { PostData } from "./types";

interface SavedTabProps {
  posts: PostData[];
  loading: boolean;
  currentUserId: string;
  notify: (msg: string, type?: "success" | "error" | "info") => void;
  onToggleBookmark: (id: string) => void;
}

export default function SavedTab({ posts, loading, currentUserId, notify, onToggleBookmark }: SavedTabProps) {
  return (
    <div className="space-y-4">
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>
      ) : posts.length === 0 ? (
        <EmptyState emoji="🔖" title="No saved items yet" subtitle="Bookmark posts to save them for later" />
      ) : (
        posts.map((post) => (
          <PostCardItem
            key={post.id}
            post={{ ...post, isBookmarked: true }}
            isOwner={post.authorId === currentUserId}
            isSaved
            onToggleBookmark={onToggleBookmark}
            onDelete={() => {}}
            notify={notify}
          />
        ))
      )}
    </div>
  );
}
