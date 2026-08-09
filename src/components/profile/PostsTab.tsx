"use client";

import { useRef, useState } from "react";
import { Loader2, Send, Image as ImageIcon, Mic, Globe, X } from "lucide-react";
import api from "@/lib/api";
import PostCardItem from "./PostCardItem";
import EmptyState from "./EmptyState";
import type { PostData } from "./types";

interface PostsTabProps {
  posts: PostData[];
  loading: boolean;
  isOwner: boolean;
  currentUser: { id: string; username: string; firstName?: string; lastName?: string; avatar?: string };
  notify: (msg: string, type?: "success" | "error" | "info") => void;
  onPostCreated: (post: PostData) => void;
  onDelete: (id: string) => void;
  onToggleBookmark: (id: string) => void;
}

export default function PostsTab({ posts, loading, isOwner, currentUser, notify, onPostCreated, onDelete, onToggleBookmark }: PostsTabProps) {
  const mediaInputRef = useRef<HTMLInputElement>(null);
  const [content, setContent] = useState("");
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);
  const [posting, setPosting] = useState(false);

  const handleMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const allowed = /image\/(jpeg|png|gif|webp|heic|heif|avif|bmp)|video\/(mp4|webm|quicktime|x-m4v|x-matroska|3gpp|x-msvideo)/;
    const bad = files.find((f) => !allowed.test(f.type) && !f.type);
    if (bad) {
      notify("Unsupported file type. Use JPG, PNG, GIF, WEBP, HEIC, MP4, or WebM.", "error");
      e.target.value = "";
      return;
    }
    const remaining = 10 - mediaFiles.length;
    const selected = files.slice(0, remaining);
    setMediaFiles((prev) => [...prev, ...selected]);
    selected.forEach((f) => {
      const reader = new FileReader();
      reader.onload = (ev) => setMediaPreviews((prev) => [...prev, ev.target?.result as string]);
      reader.readAsDataURL(f);
    });
    e.target.value = "";
  };

  const removeMedia = (index: number) => {
    setMediaFiles((prev) => prev.filter((_, i) => i !== index));
    setMediaPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePost = async () => {
    if ((!content.trim() && mediaFiles.length === 0) || posting) return;
    setPosting(true);
    try {
      const uploadedUrls: string[] = [];
      for (const file of mediaFiles) {
        const isVideo = file.type.startsWith("video/");
        const uploadType = isVideo ? "reel" : "post";
        let duration: number | undefined;
        if (isVideo) {
          const videoEl = document.createElement("video");
          videoEl.src = URL.createObjectURL(file);
          await new Promise((resolve) => { videoEl.onloadedmetadata = resolve; });
          duration = Math.round(videoEl.duration);
          URL.revokeObjectURL(videoEl.src);
        }
        const uploadRes = await api.uploadFile(file, uploadType, duration || undefined);
        uploadedUrls.push(uploadRes.data.url);
      }
      const hasVideo = mediaFiles.some((f) => f.type.startsWith("video/"));
      const finalType = hasVideo ? "VIDEO" : mediaFiles.length > 0 ? "IMAGE" : "TEXT";
      const res = await api.createPost({
        content,
        type: finalType,
        media: uploadedUrls.map((url) => ({ url, type: finalType })),
      });
      const created: PostData = {
        ...res.data,
        likeCount: 0,
        commentCount: 0,
        isLiked: false,
        isBookmarked: false,
        author: { id: currentUser.id, username: currentUser.username, displayName: [currentUser.firstName, currentUser.lastName].filter(Boolean).join(" "), avatar: currentUser.avatar },
      };
      onPostCreated(created);
      setContent("");
      setMediaFiles([]);
      setMediaPreviews([]);
      notify("Post published");
    } catch {
      notify("Failed to post. Please try again.", "error");
    } finally {
      setPosting(false);
    }
  };

  const initials = [currentUser.firstName?.[0], currentUser.lastName?.[0]].filter(Boolean).join("").toUpperCase() || currentUser.username.slice(0, 2).toUpperCase();

  return (
    <div className="space-y-4">
      {isOwner && (
        <div className="glass rounded-2xl p-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center text-white text-sm font-bold shrink-0 overflow-hidden">
              {currentUser.avatar ? <img src={currentUser.avatar} alt="" className="w-full h-full object-cover" /> : initials}
            </div>
            <div className="flex-1">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handlePost(); }}
                placeholder="Share something with your followers..."
                aria-label="New post"
                className="w-full bg-transparent text-foreground placeholder:text-muted-foreground/50 resize-none focus:outline-none text-sm min-h-[60px]"
                rows={2}
              />
              {mediaPreviews.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {mediaPreviews.map((preview, i) => (
                    <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden bg-muted border border-border">
                      <img src={preview} alt="" className="w-full h-full object-cover" />
                      <button onClick={() => removeMedia(i)} aria-label="Remove media" className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/50 flex items-center justify-center">
                        <X className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                <div className="flex items-center gap-1">
                  <input ref={mediaInputRef} type="file" accept="image/*,video/*" multiple className="hidden" onChange={handleMediaSelect} />
                  <button onClick={() => mediaInputRef.current?.click()} disabled={mediaFiles.length >= 10} aria-label="Add photos" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:bg-muted transition-all disabled:opacity-30">
                    <ImageIcon className="w-3.5 h-3.5" /> {mediaFiles.length > 0 ? `${mediaFiles.length}/10` : "Photos"}
                  </button>
                  <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:bg-muted transition-all">
                    <Mic className="w-3.5 h-3.5" /> Voice
                  </button>
                  <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:bg-muted transition-all">
                    <Globe className="w-3.5 h-3.5" /> Public
                  </button>
                </div>
                <button onClick={handlePost} disabled={(content.trim() === "" && mediaFiles.length === 0) || posting} aria-label="Publish post" className="px-4 py-1.5 rounded-lg bg-gradient-primary text-white text-xs font-medium hover:shadow-lg hover:shadow-primary/25 transition-all disabled:opacity-50">
                  {posting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>
      ) : posts.length === 0 ? (
        <EmptyState emoji="📝" title="No posts yet" subtitle="Create your first post to share with the world" />
      ) : (
        posts.map((post) => (
          <PostCardItem key={post.id} post={post} isOwner={isOwner && post.authorId === currentUser.id} onToggleBookmark={onToggleBookmark} onDelete={onDelete} notify={notify} />
        ))
      )}
    </div>
  );
}
