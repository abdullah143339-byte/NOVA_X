"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Video, Link2, Upload, ArrowLeft, Loader2 } from "lucide-react";
import Button from "@/components/ui/Button";
import { useLearning } from "@/components/learning/LearningProvider";
import { LearningNav, PageHeader, SubjectSelect, TagInput } from "@/components/learning/LearningShared";
import { youtubeId, youtubeThumb, formatBytes } from "@/components/learning/data";
import { cn } from "@/lib/utils";

type Source = "youtube" | "upload";

export default function NewLecturePage() {
  const router = useRouter();
  const { state, addLecture } = useLearning();
  const [source, setSource] = useState<Source>("youtube");
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [teacher, setTeacher] = useState("");
  const [subjectId, setSubjectId] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [durationMin, setDurationMin] = useState("");
  const [uploadName, setUploadName] = useState("");
  const [uploadSize, setUploadSize] = useState(0);
  const [mediaUrl, setMediaUrl] = useState("");
  const [saving, setSaving] = useState(false);

  const ytId = source === "youtube" ? youtubeId(url) : null;

  const onFile = (file: File) => {
    setUploadName(file.name);
    setUploadSize(file.size);
    const reader = new FileReader();
    reader.onload = () => setMediaUrl(String(reader.result || ""));
    reader.readAsDataURL(file);
  };

  const save = () => {
    if (!title.trim()) return;
    if (source === "youtube" && !ytId) return;
    setSaving(true);
    addLecture({
      subjectId,
      title: title.trim(),
      description: description.trim(),
      teacher: teacher.trim(),
      tags,
      source,
      url: source === "youtube" ? url.trim() : "",
      mediaUrl: source === "upload" ? mediaUrl : "",
      durationMin: durationMin ? Math.max(1, Math.round(Number(durationMin))) : null,
      completed: false,
      favorite: false,
    });
    router.push("/dashboard/learning/lectures");
  };

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={() => router.push("/dashboard/learning/lectures")}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Lectures
      </button>

      <PageHeader title="Add Lecture" subtitle="Save a YouTube link or upload a video." icon={Video} />

      <LearningNav />

      <div className="max-w-2xl space-y-5">
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setSource("youtube")}
            className={cn(
              "flex items-center justify-center gap-2 h-11 rounded-xl border text-sm font-semibold transition-all",
              source === "youtube" ? "bg-primary/10 text-primary border-primary/40" : "border-border text-muted-foreground hover:text-foreground"
            )}
          >
            <Link2 className="w-4 h-4" /> YouTube link
          </button>
          <button
            type="button"
            onClick={() => setSource("upload")}
            className={cn(
              "flex items-center justify-center gap-2 h-11 rounded-xl border text-sm font-semibold transition-all",
              source === "upload" ? "bg-primary/10 text-primary border-primary/40" : "border-border text-muted-foreground hover:text-foreground"
            )}
          >
            <Upload className="w-4 h-4" /> Upload video
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1.5">Title *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Attention Is All You Need — Transformers Explained"
            className="w-full h-11 rounded-xl bg-muted border border-border px-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          />
        </div>

        {source === "youtube" ? (
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">YouTube URL *</label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=…"
              className="w-full h-11 rounded-xl bg-muted border border-border px-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
            {ytId ? (
              <div className="mt-3 flex items-center gap-3 glass rounded-xl p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={youtubeThumb(ytId)} alt="" className="w-28 h-16 object-cover rounded-lg" />
                <p className="text-sm text-emerald-400 font-medium">Valid YouTube link</p>
              </div>
            ) : url.trim() ? (
              <p className="mt-2 text-xs text-rose-400">Enter a valid YouTube URL (watch, youtu.be, shorts or embed).</p>
            ) : null}
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">Video file</label>
            <label className="flex flex-col items-center justify-center gap-2 h-40 rounded-2xl border-2 border-dashed border-border bg-muted/30 cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-all">
              {mediaUrl ? (
                <>
                  <Upload className="w-6 h-6 text-primary" />
                  <span className="text-sm font-medium text-foreground">{uploadName}</span>
                  <span className="text-xs text-muted-foreground">{formatBytes(uploadSize)}</span>
                </>
              ) : (
                <>
                  <Upload className="w-6 h-6 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">Choose a video to upload</span>
                  <span className="text-xs text-muted-foreground">MP4, WebM, MOV — stored locally</span>
                </>
              )}
              <input
                type="file"
                accept="video/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) onFile(f);
                }}
              />
            </label>
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">Teacher</label>
            <input
              type="text"
              value={teacher}
              onChange={(e) => setTeacher(e.target.value)}
              placeholder="e.g. Andrej Karpathy"
              className="w-full h-11 rounded-xl bg-muted border border-border px-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">Duration (minutes)</label>
            <input
              type="number"
              min={1}
              value={durationMin}
              onChange={(e) => setDurationMin(e.target.value)}
              placeholder="e.g. 45"
              className="w-full h-11 rounded-xl bg-muted border border-border px-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1.5">Subject</label>
          <SubjectSelect subjects={state.subjects} value={subjectId} onChange={setSubjectId} placeholder="No subject" />
        </div>

        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1.5">Tags</label>
          <div className="rounded-xl bg-muted border border-border px-3 py-1.5">
            <TagInput tags={tags} onChange={setTags} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1.5">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="What does this lecture cover?"
            className="w-full rounded-xl bg-muted border border-border px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none"
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => router.back()}>Cancel</Button>
          <Button onClick={save} disabled={saving || !title.trim() || (source === "youtube" && !ytId)}>
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Add Lecture
          </Button>
        </div>
      </div>
    </div>
  );
}
