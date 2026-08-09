"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { loadState, saveState, uid, dateKey } from "./data";
import api from "@/lib/api";
import type {
  LearningState,
  Subject,
  Lecture,
  Note,
  LearningFile,
  StudyTask,
  StudyStats,
  SubjectColor,
  LectureSource,
  FileKind,
  TaskPriority,
  Bookmark,
} from "./types";
import { computeStats } from "./data";

interface LearningContextType {
  state: LearningState;
  stats: StudyStats;
  offline: boolean;
  synced: boolean;
  addSubject: (data: Omit<Subject, "id" | "createdAt" | "updatedAt" | "archived" | "trashed">) => Subject;
  updateSubject: (id: string, patch: Partial<Subject>) => void;
  removeSubject: (id: string) => void;
  restoreSubject: (id: string) => void;
  deleteSubjectForever: (id: string) => void;
  addLecture: (data: Omit<Lecture, "id" | "createdAt" | "updatedAt" | "archived" | "trashed">) => Lecture;
  updateLecture: (id: string, patch: Partial<Lecture>) => void;
  removeLecture: (id: string) => void;
  restoreLecture: (id: string) => void;
  deleteLectureForever: (id: string) => void;
  addNote: (data: Omit<Note, "id" | "createdAt" | "updatedAt" | "archived" | "trashed">) => Note;
  updateNote: (id: string, patch: Partial<Note>) => void;
  removeNote: (id: string) => void;
  restoreNote: (id: string) => void;
  deleteNoteForever: (id: string) => void;
  addFile: (data: Omit<LearningFile, "id" | "createdAt" | "archived" | "trashed">) => LearningFile;
  updateFile: (id: string, patch: Partial<LearningFile>) => void;
  removeFile: (id: string) => void;
  restoreFile: (id: string) => void;
  deleteFileForever: (id: string) => void;
  addTask: (data: Omit<StudyTask, "id" | "createdAt" | "archived" | "trashed">) => StudyTask;
  updateTask: (id: string, patch: Partial<StudyTask>) => void;
  removeTask: (id: string) => void;
  restoreTask: (id: string) => void;
  deleteTaskForever: (id: string) => void;
  toggleBookmark: (refType: "note" | "lecture" | "file", refId: string) => void;
  isBookmarked: (refType: "note" | "lecture" | "file", refId: string) => boolean;
  trackMinutes: (minutes: number) => void;
  resetAll: () => void;
}

const LearningContext = createContext<LearningContextType | undefined>(undefined);

function useLocalState<T>(initial: () => T) {
  const [value, setValue] = useState<T>(initial);
  const ref = useRef(value);
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return [value, setValue, ref] as const;
}

// ---------- Backend payload helpers (mirror the whitelisted DTO fields) ----------

const subjectPayload = (s: Subject) => ({
  id: s.id, name: s.name, emoji: s.emoji, color: s.color, description: s.description,
});
const notePayload = (n: Note) => ({
  id: n.id, subjectId: n.subjectId, title: n.title, content: n.content, tags: n.tags,
  pinned: n.pinned, favorite: n.favorite,
});
const lecturePayload = (l: Lecture) => ({
  id: l.id, subjectId: l.subjectId, title: l.title, description: l.description, teacher: l.teacher,
  tags: l.tags, source: l.source, url: l.url, mediaUrl: l.mediaUrl, durationMin: l.durationMin,
  completed: l.completed, favorite: l.favorite,
});
const filePayload = (f: LearningFile) => ({
  id: f.id, subjectId: f.subjectId, name: f.name, kind: f.kind, size: f.size, mime: f.mime,
  dataUrl: f.dataUrl, tags: f.tags, favorite: f.favorite,
});
const taskPayload = (t: StudyTask) => ({
  id: t.id, subjectId: t.subjectId, title: t.title, notes: t.notes, deadline: t.deadline,
  reminderAt: t.reminderAt, priority: t.priority, completed: t.completed,
});

const UPDATE_KEYS: Record<string, string[]> = {
  subjects: ["name", "emoji", "color", "description", "archived", "trashed"],
  notes: ["subjectId", "title", "content", "tags", "pinned", "favorite", "archived", "trashed"],
  lectures: ["subjectId", "title", "description", "teacher", "tags", "source", "url", "mediaUrl", "durationMin", "completed", "favorite", "archived", "trashed"],
  files: ["subjectId", "name", "kind", "size", "mime", "dataUrl", "tags", "favorite", "archived", "trashed"],
  tasks: ["subjectId", "title", "notes", "deadline", "reminderAt", "priority", "completed", "archived", "trashed"],
};

const sanitizePatch = (patch: Record<string, unknown>, keys: string[]) =>
  Object.fromEntries(keys.filter((k) => k in patch).map((k) => [k, patch[k]]));

// ---------- Server state normalization ----------

const num = (v: unknown): number | null => (typeof v === "number" ? v : null);
const ts = (v: unknown, fallback: number) => num(v) ?? fallback;
const tags = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x) => typeof x === "string") : []);

interface ServerRow {
  id: string;
  subjectId?: string | null;
  name?: string;
  emoji?: string;
  color?: string;
  description?: string;
  title?: string;
  content?: string;
  teacher?: string;
  source?: string;
  url?: string;
  mediaUrl?: string;
  durationMin?: number | null;
  completed?: boolean;
  favorite?: boolean;
  pinned?: boolean;
  archived?: boolean;
  trashed?: boolean;
  kind?: string;
  size?: number;
  mime?: string;
  dataUrl?: string;
  notes?: string;
  deadline?: number | null;
  reminderAt?: number | null;
  priority?: string;
  tags?: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
  minutes?: unknown;
  date?: unknown;
  refType?: string;
  refId?: string;
}

interface ServerState {
  subjects?: ServerRow[];
  notes?: ServerRow[];
  lectures?: ServerRow[];
  files?: ServerRow[];
  tasks?: ServerRow[];
  bookmarks?: ServerRow[];
  sessions?: ServerRow[];
}

function normalizeServerState(s: ServerState): LearningState {
  const now = Date.now();
  return {
    subjects: (s?.subjects || []).map((x) => ({
      id: x.id, name: x.name || "", emoji: x.emoji || "📚", color: (x.color as SubjectColor) || "violet",
      description: x.description || "", archived: !!x.archived, trashed: !!x.trashed,
      createdAt: ts(x.createdAt, now), updatedAt: ts(x.updatedAt, now),
    })),
    notes: (s?.notes || []).map((x) => ({
      id: x.id, subjectId: x.subjectId ?? null, title: x.title || "", content: x.content || "",
      tags: tags(x.tags), pinned: !!x.pinned, favorite: !!x.favorite,
      archived: !!x.archived, trashed: !!x.trashed,
      createdAt: ts(x.createdAt, now), updatedAt: ts(x.updatedAt, now),
    })),
    lectures: (s?.lectures || []).map((x) => ({
      id: x.id, subjectId: x.subjectId ?? null, title: x.title || "", description: x.description || "",
      teacher: x.teacher || "", tags: tags(x.tags), source: (x.source as LectureSource) || "youtube",
      url: x.url || "", mediaUrl: x.mediaUrl || "", durationMin: x.durationMin ?? null,
      completed: !!x.completed, favorite: !!x.favorite, archived: !!x.archived, trashed: !!x.trashed,
      createdAt: ts(x.createdAt, now), updatedAt: ts(x.updatedAt, now),
    })),
    files: (s?.files || []).map((x) => ({
      id: x.id, subjectId: x.subjectId ?? null, name: x.name || "", kind: (x.kind as FileKind) || "file", size: x.size || 0,
      mime: x.mime || "", dataUrl: x.dataUrl || "", tags: tags(x.tags), favorite: !!x.favorite,
      archived: !!x.archived, trashed: !!x.trashed, createdAt: ts(x.createdAt, now),
    })),
    tasks: (s?.tasks || []).map((x) => ({
      id: x.id, subjectId: x.subjectId ?? null, title: x.title || "", notes: x.notes || "",
      deadline: x.deadline ?? null, reminderAt: x.reminderAt ?? null, priority: (x.priority as TaskPriority) || "medium",
      completed: !!x.completed, archived: !!x.archived, trashed: !!x.trashed,
      createdAt: ts(x.createdAt, now),
    })),
    bookmarks: (s?.bookmarks || []).map((x) => ({
      id: x.id, refType: (x.refType as Bookmark["refType"]) || "note", refId: x.refId || "", createdAt: ts(x.createdAt, now),
    })),
    sessions: (s?.sessions || []).map((x) => ({
      date: String(x.date || ""), minutes: Number(x.minutes) || 0,
    })),
  };
}

const isStateEmpty = (s: LearningState) =>
  !s.subjects.length && !s.notes.length && !s.lectures.length && !s.files.length &&
  !s.tasks.length && !s.bookmarks.length && !s.sessions.length;

export function LearningProvider({ children }: { children: ReactNode }) {
  const [state, setState, stateRef] = useLocalState<LearningState>(loadState);
  const [offline, setOffline] = useState(false);
  const [synced, setSynced] = useState(false);
  const hydrated = useRef(false);

  useEffect(() => {
    saveState(state);
  }, [state]);

  const fire = (promise: Promise<unknown>) => {
    promise.then(() => setOffline(false)).catch(() => setOffline(true));
  };

  const pushAll = async (snap: LearningState) => {
    for (const sub of snap.subjects) {
      try { await api.createLearning("subjects", subjectPayload(sub)); } catch { /* offline */ }
    }
    const groups: Array<{ key: string; list: Array<Note | Lecture | LearningFile | StudyTask> }> = [
      { key: "notes", list: snap.notes },
      { key: "lectures", list: snap.lectures },
      { key: "files", list: snap.files },
      { key: "tasks", list: snap.tasks },
    ];
    for (const group of groups) {
      for (const item of group.list) {
        try {
          const payload = group.key === "notes" ? notePayload(item as Note)
            : group.key === "lectures" ? lecturePayload(item as Lecture)
            : group.key === "files" ? filePayload(item as LearningFile)
            : taskPayload(item as StudyTask);
          await api.createLearning(group.key, payload);
        } catch { /* offline */ }
      }
    }
    for (const b of snap.bookmarks) {
      try { await api.toggleLearningBookmark(b.refType, b.refId); } catch { /* offline */ }
    }
    for (const sess of snap.sessions) {
      try { await api.trackStudySession(sess.minutes, sess.date); } catch { /* offline */ }
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.getLearningState();
        if (cancelled) return;
        const serverState = normalizeServerState(res.data);
        if (!isStateEmpty(serverState)) {
          setState(serverState);
        } else if (!isStateEmpty(stateRef.current)) {
          await pushAll(stateRef.current);
        }
        setOffline(false);
      } catch {
        if (!cancelled) setOffline(true);
      } finally {
        if (!cancelled) {
          hydrated.current = true;
          setSynced(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo<LearningContextType>(() => {
    const s = state;

    const addSubject: LearningContextType["addSubject"] = (data) => {
      const sub: Subject = {
        ...data,
        id: uid(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        archived: false,
        trashed: false,
      };
      setState({ ...s, subjects: [...s.subjects, sub] });
      fire(api.createLearning("subjects", subjectPayload(sub)));
      return sub;
    };

    const addLecture: LearningContextType["addLecture"] = (data) => {
      const item: Lecture = {
        ...data,
        id: uid(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        archived: false,
        trashed: false,
      };
      setState({ ...s, lectures: [...s.lectures, item] });
      fire(api.createLearning("lectures", lecturePayload(item)));
      return item;
    };

    const addNote: LearningContextType["addNote"] = (data) => {
      const item: Note = {
        ...data,
        id: uid(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        archived: false,
        trashed: false,
      };
      setState({ ...s, notes: [...s.notes, item] });
      fire(api.createLearning("notes", notePayload(item)));
      return item;
    };

    const addFile: LearningContextType["addFile"] = (data) => {
      const item: LearningFile = {
        ...data,
        id: uid(),
        createdAt: Date.now(),
        archived: false,
        trashed: false,
      };
      setState({ ...s, files: [...s.files, item] });
      fire(api.createLearning("files", filePayload(item)));
      return item;
    };

    const addTask: LearningContextType["addTask"] = (data) => {
      const item: StudyTask = {
        ...data,
        id: uid(),
        createdAt: Date.now(),
        archived: false,
        trashed: false,
      };
      setState({ ...s, tasks: [...s.tasks, item] });
      fire(api.createLearning("tasks", taskPayload(item)));
      return item;
    };

    const patchList = <T extends { id: string }>(list: T[], id: string, patch: Partial<T>): T[] =>
      list.map((x) => (x.id === id ? { ...x, ...patch, updatedAt: Date.now() } : x));

    const removeToTrash = <T extends { id: string }>(list: T[], id: string, field: "trashed" | "archived"): T[] =>
      list.map((x) => (x.id === id ? ({ ...x, [field]: true, updatedAt: Date.now() } as T) : x));

    return {
      state: s,
      stats: computeStats(s),
      offline,
      synced,

      addSubject,
      updateSubject: (id, patch) => {
        setState({ ...s, subjects: patchList(s.subjects, id, patch) });
        fire(api.updateLearning("subjects", id, sanitizePatch(patch, UPDATE_KEYS.subjects)));
      },
      removeSubject: (id) => {
        setState({ ...s, subjects: removeToTrash(s.subjects, id, "trashed") });
        fire(api.trashLearning("subjects", id));
      },
      restoreSubject: (id) => {
        setState({ ...s, subjects: patchList(s.subjects, id, { trashed: false, archived: false }) });
        fire(api.restoreLearning("subjects", id));
      },
      deleteSubjectForever: (id) => {
        setState({ ...s, subjects: s.subjects.filter((x) => x.id !== id) });
        fire(api.deleteLearningForever("subjects", id));
      },

      addLecture,
      updateLecture: (id, patch) => {
        setState({ ...s, lectures: patchList(s.lectures, id, patch) });
        fire(api.updateLearning("lectures", id, sanitizePatch(patch, UPDATE_KEYS.lectures)));
      },
      removeLecture: (id) => {
        setState({ ...s, lectures: removeToTrash(s.lectures, id, "trashed") });
        fire(api.trashLearning("lectures", id));
      },
      restoreLecture: (id) => {
        setState({ ...s, lectures: patchList(s.lectures, id, { trashed: false, archived: false }) });
        fire(api.restoreLearning("lectures", id));
      },
      deleteLectureForever: (id) => {
        setState({ ...s, lectures: s.lectures.filter((x) => x.id !== id) });
        fire(api.deleteLearningForever("lectures", id));
      },

      addNote,
      updateNote: (id, patch) => {
        setState({ ...s, notes: patchList(s.notes, id, patch) });
        fire(api.updateLearning("notes", id, sanitizePatch(patch, UPDATE_KEYS.notes)));
      },
      removeNote: (id) => {
        setState({ ...s, notes: removeToTrash(s.notes, id, "trashed") });
        fire(api.trashLearning("notes", id));
      },
      restoreNote: (id) => {
        setState({ ...s, notes: patchList(s.notes, id, { trashed: false, archived: false }) });
        fire(api.restoreLearning("notes", id));
      },
      deleteNoteForever: (id) => {
        setState({ ...s, notes: s.notes.filter((x) => x.id !== id) });
        fire(api.deleteLearningForever("notes", id));
      },

      addFile,
      updateFile: (id, patch) => {
        setState({ ...s, files: patchList(s.files, id, patch) });
        fire(api.updateLearning("files", id, sanitizePatch(patch, UPDATE_KEYS.files)));
      },
      removeFile: (id) => {
        setState({ ...s, files: removeToTrash(s.files, id, "trashed") });
        fire(api.trashLearning("files", id));
      },
      restoreFile: (id) => {
        setState({ ...s, files: patchList(s.files, id, { trashed: false, archived: false }) });
        fire(api.restoreLearning("files", id));
      },
      deleteFileForever: (id) => {
        setState({ ...s, files: s.files.filter((x) => x.id !== id) });
        fire(api.deleteLearningForever("files", id));
      },

      addTask,
      updateTask: (id, patch) => {
        setState({ ...s, tasks: patchList(s.tasks, id, patch) });
        fire(api.updateLearning("tasks", id, sanitizePatch(patch, UPDATE_KEYS.tasks)));
      },
      removeTask: (id) => {
        setState({ ...s, tasks: removeToTrash(s.tasks, id, "trashed") });
        fire(api.trashLearning("tasks", id));
      },
      restoreTask: (id) => {
        setState({ ...s, tasks: patchList(s.tasks, id, { trashed: false, archived: false }) });
        fire(api.restoreLearning("tasks", id));
      },
      deleteTaskForever: (id) => {
        setState({ ...s, tasks: s.tasks.filter((x) => x.id !== id) });
        fire(api.deleteLearningForever("tasks", id));
      },

      toggleBookmark: (refType, refId) => {
        const exists = s.bookmarks.some((b) => b.refType === refType && b.refId === refId);
        setState({
          ...s,
          bookmarks: exists
            ? s.bookmarks.filter((b) => !(b.refType === refType && b.refId === refId))
            : [...s.bookmarks, { id: uid(), refType, refId, createdAt: Date.now() }],
        });
        if (exists) {
          fire(api.removeLearningBookmark(refType, refId));
        } else {
          fire(api.toggleLearningBookmark(refType, refId));
        }
      },
      isBookmarked: (refType, refId) =>
        s.bookmarks.some((b) => b.refType === refType && b.refId === refId),

      trackMinutes: (minutes) => {
        const key = dateKey(Date.now());
        const existing = s.sessions.find((x) => x.date === key);
        setState({
          ...s,
          sessions: existing
            ? s.sessions.map((x) => (x.date === key ? { ...x, minutes: x.minutes + minutes } : x))
            : [...s.sessions, { date: key, minutes }],
        });
        fire(api.trackStudySession(minutes));
      },

      resetAll: () => {
        setState(loadState());
        fire(api.resetLearning());
      },
    };
  }, [state, setState, offline, synced]);

  return <LearningContext.Provider value={value}>{children}</LearningContext.Provider>;
}

export function useLearning() {
  const ctx = useContext(LearningContext);
  if (!ctx) throw new Error("useLearning must be used within LearningProvider");
  return ctx;
}
