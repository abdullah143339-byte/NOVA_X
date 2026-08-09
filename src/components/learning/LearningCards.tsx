"use client";

import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useLearning } from "./LearningProvider";
import { PriorityBadge, KindBadge, SubjectChip } from "./LearningShared";
import { colorClass, formatBytes, formatDate, formatDuration, relativeTime, youtubeThumb } from "./data";
import type { Subject, Lecture, Note, LearningFile, StudyTask } from "./types";
import {
  Pin,
  Star,
  Bookmark,
  Archive,
  Trash2,
  Check,
  Video,
  Clock3,
  Calendar,
  Bell,
  FileText,
  Image as ImageIcon,
  FileArchive,
  Braces,
  Presentation,
  FilePlus2,
  Play,
} from "lucide-react";

export function SubjectCard({ subject }: { subject: Subject }) {
  const { state, updateSubject, removeSubject } = useLearning();
  const counts = {
    notes: state.notes.filter((n) => n.subjectId === subject.id && !n.trashed).length,
    lectures: state.lectures.filter((l) => l.subjectId === subject.id && !l.trashed).length,
    files: state.files.filter((f) => f.subjectId === subject.id && !f.trashed).length,
    tasks: state.tasks.filter((t) => t.subjectId === subject.id && !t.trashed).length,
  };
  return (
    <div className="glass rounded-2xl p-5 hover:shadow-lg transition-all group">
      <div className="flex items-start justify-between">
        <div
          className={cn(
            "w-12 h-12 rounded-2xl border flex items-center justify-center text-2xl",
            colorClass(subject.color)
          )}
        >
          {subject.emoji}
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            aria-label={`Archive ${subject.name}`}
            onClick={() => updateSubject(subject.id, { archived: !subject.archived })}
            className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center transition-all",
              subject.archived ? "text-amber-400 bg-amber-500/10" : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            <Archive className="w-4 h-4" />
          </button>
          <button
            type="button"
            aria-label={`Move ${subject.name} to trash`}
            onClick={() => removeSubject(subject.id)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-all"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      <h3 className="mt-3 font-bold text-foreground text-base">{subject.name}</h3>
      {subject.description && (
        <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{subject.description}</p>
      )}
      <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><FileText className="w-3.5 h-3.5" />{counts.notes}</span>
        <span className="flex items-center gap-1"><Video className="w-3.5 h-3.5" />{counts.lectures}</span>
        <span className="flex items-center gap-1"><FilePlus2 className="w-3.5 h-3.5" />{counts.files}</span>
        <span className="flex items-center gap-1"><Check className="w-3.5 h-3.5" />{counts.tasks}</span>
      </div>
      <Link
        href={`/dashboard/learning/subjects/${subject.id}`}
        className="mt-4 block text-center py-2 rounded-xl text-sm font-semibold bg-primary/10 text-primary hover:bg-primary/20 transition-all"
      >
        Open folder
      </Link>
    </div>
  );
}

function ActionIcon({
  label,
  active,
  onClick,
  icon: Icon,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
  icon: typeof Pin;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={cn(
        "w-8 h-8 rounded-lg flex items-center justify-center transition-all",
        active ? "text-amber-400 bg-amber-500/10" : "text-muted-foreground hover:text-foreground hover:bg-muted"
      )}
    >
      <Icon className="w-4 h-4" />
    </button>
  );
}

export function NoteCard({ note }: { note: Note }) {
  const { state, updateNote, removeNote, toggleBookmark, isBookmarked } = useLearning();
  const subject = state.subjects.find((s) => s.id === note.subjectId) || null;
  const excerpt = note.content.replace(/[#*`>|$[\]]/g, " ").replace(/\s+/g, " ").trim().slice(0, 110);
  const bm = isBookmarked("note", note.id);

  return (
    <Link
      href={`/dashboard/learning/notes/edit/${note.id}`}
      className="block glass rounded-2xl p-5 hover:shadow-lg transition-all group"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <SubjectChip subject={subject} to={subject ? `/dashboard/learning/subjects/${subject.id}` : undefined} />
          <span className="text-[11px] text-muted-foreground">{relativeTime(note.updatedAt)}</span>
        </div>
        <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <ActionIcon
            label={note.pinned ? "Unpin" : "Pin"}
            active={note.pinned}
            icon={Pin}
            onClick={() => updateNote(note.id, { pinned: !note.pinned })}
          />
          <ActionIcon
            label={note.favorite ? "Unfavorite" : "Favorite"}
            active={note.favorite}
            icon={Star}
            onClick={() => updateNote(note.id, { favorite: !note.favorite })}
          />
          <ActionIcon
            label={bm ? "Remove bookmark" : "Bookmark"}
            active={bm}
            icon={Bookmark}
            onClick={() => toggleBookmark("note", note.id)}
          />
          <ActionIcon
            label="Archive"
            icon={Archive}
            onClick={() => updateNote(note.id, { archived: !note.archived })}
          />
          <ActionIcon label="Trash" icon={Trash2} onClick={() => removeNote(note.id)} />
        </div>
      </div>
      <h3 className="mt-3 font-bold text-foreground truncate">{note.title || "Untitled note"}</h3>
      {excerpt && <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{excerpt}</p>}
      {note.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {note.tags.map((t) => (
            <span key={t} className="px-2 py-0.5 rounded-lg bg-primary/10 text-primary text-[11px]">
              #{t}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}

export function LectureCard({ lecture }: { lecture: Lecture }) {
  const { state, updateLecture, removeLecture, toggleBookmark, isBookmarked } = useLearning();
  const subject = state.subjects.find((s) => s.id === lecture.subjectId) || null;
  const thumb = lecture.source === "youtube" && lecture.url ? youtubeThumb(lecture.url) : null;
  const bm = isBookmarked("lecture", lecture.id);

  return (
    <div className="glass rounded-2xl overflow-hidden hover:shadow-lg transition-all group">
      {thumb ? (
        <Link href={lecture.url} target="_blank" rel="noopener noreferrer" className="relative block aspect-video bg-black">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={thumb} alt="" className="w-full h-full object-cover opacity-80" loading="lazy" />
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="w-12 h-12 rounded-full bg-black/60 backdrop-blur flex items-center justify-center">
              <Play className="w-5 h-5 text-white fill-white" />
            </span>
          </span>
          <span className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-black/60 text-white text-[11px] font-medium">
            YouTube
          </span>
        </Link>
      ) : (
        <div className="aspect-video bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
          <Video className="w-10 h-10 text-primary/50" />
        </div>
      )}

      <div className="p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <SubjectChip subject={subject} to={subject ? `/dashboard/learning/subjects/${subject.id}` : undefined} />
          </div>
          <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <ActionIcon
              label={lecture.completed ? "Mark incomplete" : "Mark complete"}
              active={lecture.completed}
              icon={Check}
              onClick={() => updateLecture(lecture.id, { completed: !lecture.completed })}
            />
            <ActionIcon
              label={lecture.favorite ? "Unfavorite" : "Favorite"}
              active={lecture.favorite}
              icon={Star}
              onClick={() => updateLecture(lecture.id, { favorite: !lecture.favorite })}
            />
            <ActionIcon
              label={bm ? "Remove bookmark" : "Bookmark"}
              active={bm}
              icon={Bookmark}
              onClick={() => toggleBookmark("lecture", lecture.id)}
            />
            <ActionIcon label="Trash" icon={Trash2} onClick={() => removeLecture(lecture.id)} />
          </div>
        </div>
        <h3 className={cn("mt-2.5 font-bold text-foreground leading-snug", lecture.completed && "line-through text-muted-foreground")}>
          {lecture.title}
        </h3>
        {lecture.teacher && <p className="mt-1 text-xs text-muted-foreground">by {lecture.teacher}</p>}
        {lecture.description && (
          <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{lecture.description}</p>
        )}
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
          {lecture.durationMin != null && (
            <span className="flex items-center gap-1"><Clock3 className="w-3.5 h-3.5" />{formatDuration(lecture.durationMin)}</span>
          )}
          {lecture.url && (
            <Link href={lecture.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              Watch on YouTube
            </Link>
          )}
        </div>
        {lecture.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {lecture.tags.map((t) => (
              <span key={t} className="px-2 py-0.5 rounded-lg bg-primary/10 text-primary text-[11px]">
                #{t}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function FileTypeIcon({ kind }: { kind: LearningFile["kind"] }) {
  const map = {
    pdf: FileText,
    docx: FileText,
    pptx: Presentation,
    txt: FileText,
    image: ImageIcon,
    zip: FileArchive,
    code: Braces,
  };
  const Icon = map[kind];
  return <Icon className="w-5 h-5" />;
}

export function FileCard({ file }: { file: LearningFile }) {
  const { state, updateFile, removeFile, toggleBookmark, isBookmarked } = useLearning();
  const subject = state.subjects.find((s) => s.id === file.subjectId) || null;
  const bm = isBookmarked("file", file.id);

  return (
    <div className="glass rounded-2xl p-5 hover:shadow-lg transition-all group">
      <div className="flex items-start justify-between gap-2">
        <div className="w-11 h-11 rounded-xl bg-muted border border-border flex items-center justify-center text-muted-foreground shrink-0">
          <FileTypeIcon kind={file.kind} />
        </div>
        <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <ActionIcon
            label={file.favorite ? "Unfavorite" : "Favorite"}
            active={file.favorite}
            icon={Star}
            onClick={() => updateFile(file.id, { favorite: !file.favorite })}
          />
          <ActionIcon
            label={bm ? "Remove bookmark" : "Bookmark"}
            active={bm}
            icon={Bookmark}
            onClick={() => toggleBookmark("file", file.id)}
          />
          <ActionIcon label="Trash" icon={Trash2} onClick={() => removeFile(file.id)} />
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <KindBadge kind={file.kind} />
        <span className="text-[11px] text-muted-foreground">{formatBytes(file.size)}</span>
      </div>
      <h3 className="mt-1.5 font-semibold text-foreground text-sm truncate">{file.name}</h3>
      <div className="mt-2 flex items-center justify-between gap-2">
        <SubjectChip subject={subject} to={subject ? `/dashboard/learning/subjects/${subject.id}` : undefined} />
        {file.dataUrl ? (
          <a
            href={file.dataUrl}
            download={file.name}
            className="text-xs font-semibold text-primary hover:underline"
          >
            Download
          </a>
        ) : (
          <span className="text-[11px] text-muted-foreground">{formatDate(file.createdAt)}</span>
        )}
      </div>
    </div>
  );
}

export function TaskCard({ task }: { task: StudyTask }) {
  const { state, updateTask, removeTask } = useLearning();
  const subject = state.subjects.find((s) => s.id === task.subjectId) || null;
  const [now] = useState(() => Date.now());
  const overdue = task.deadline && task.deadline < now && !task.completed;

  return (
    <div className={cn("glass rounded-2xl p-4 flex items-start gap-3 transition-all", task.completed && "opacity-60")}>
      <button
        type="button"
        aria-label={task.completed ? "Mark incomplete" : "Mark complete"}
        onClick={() => updateTask(task.id, { completed: !task.completed })}
        className={cn(
          "w-6 h-6 mt-0.5 rounded-lg border flex items-center justify-center transition-all shrink-0",
          task.completed
            ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400"
            : "border-border text-transparent hover:border-primary/50"
        )}
      >
        <Check className="w-4 h-4" />
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className={cn("font-semibold text-foreground text-sm", task.completed && "line-through")}>
            {task.title}
          </p>
          <PriorityBadge priority={task.priority} />
        </div>
        {task.notes && <p className="mt-1 text-sm text-muted-foreground line-clamp-1">{task.notes}</p>}
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
          <SubjectChip subject={subject} to={subject ? `/dashboard/learning/subjects/${subject.id}` : undefined} />
          {task.deadline && (
            <span className={cn("flex items-center gap-1", overdue && "text-rose-400 font-medium")}>
              <Calendar className="w-3.5 h-3.5" />
              {formatDate(task.deadline)}
              {overdue && " · overdue"}
            </span>
          )}
          {task.reminderAt && (
            <span className="flex items-center gap-1">
              <Bell className="w-3.5 h-3.5" />
              {formatDate(task.reminderAt)}
            </span>
          )}
        </div>
      </div>

      <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <ActionIcon label="Archive" icon={Archive} onClick={() => updateTask(task.id, { archived: !task.archived })} />
        <ActionIcon label="Trash" icon={Trash2} onClick={() => removeTask(task.id)} />
      </div>
    </div>
  );
}

export function TagRow({ tags }: { tags: string[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.map((t) => (
        <span key={t} className="px-2 py-0.5 rounded-lg bg-primary/10 text-primary text-[11px]">
          #{t}
        </span>
      ))}
    </div>
  );
}
