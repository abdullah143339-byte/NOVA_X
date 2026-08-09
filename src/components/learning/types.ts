export type Visibility = "private" | "public";

export type SubjectColor =
  | "violet"
  | "blue"
  | "emerald"
  | "amber"
  | "rose"
  | "cyan"
  | "indigo"
  | "pink";

export interface Subject {
  id: string;
  name: string;
  emoji: string;
  color: SubjectColor;
  description: string;
  createdAt: number;
  updatedAt: number;
  archived: boolean;
  trashed: boolean;
}

export type LectureSource = "youtube" | "upload";

export interface Lecture {
  id: string;
  subjectId: string | null;
  title: string;
  description: string;
  teacher: string;
  tags: string[];
  source: LectureSource;
  url: string;
  mediaUrl: string;
  durationMin: number | null;
  completed: boolean;
  favorite: boolean;
  createdAt: number;
  updatedAt: number;
  archived: boolean;
  trashed: boolean;
}

export interface Note {
  id: string;
  subjectId: string | null;
  title: string;
  content: string;
  tags: string[];
  pinned: boolean;
  favorite: boolean;
  createdAt: number;
  updatedAt: number;
  archived: boolean;
  trashed: boolean;
}

export type FileKind = "pdf" | "docx" | "pptx" | "txt" | "image" | "zip" | "code";

export interface LearningFile {
  id: string;
  subjectId: string | null;
  name: string;
  kind: FileKind;
  size: number;
  mime: string;
  dataUrl: string;
  tags: string[];
  favorite: boolean;
  createdAt: number;
  archived: boolean;
  trashed: boolean;
}

export type TaskPriority = "low" | "medium" | "high";

export interface StudyTask {
  id: string;
  subjectId: string | null;
  title: string;
  notes: string;
  deadline: number | null;
  reminderAt: number | null;
  priority: TaskPriority;
  completed: boolean;
  createdAt: number;
  archived: boolean;
  trashed: boolean;
}

export interface Bookmark {
  id: string;
  refType: "note" | "lecture" | "file";
  refId: string;
  createdAt: number;
}

export interface StudySession {
  date: string;
  minutes: number;
}

export interface LearningState {
  subjects: Subject[];
  lectures: Lecture[];
  notes: Note[];
  files: LearningFile[];
  tasks: StudyTask[];
  bookmarks: Bookmark[];
  sessions: StudySession[];
}

export interface StudyStats {
  completedLectures: number;
  totalLectures: number;
  completedTasks: number;
  totalTasks: number;
  totalStudyMinutes: number;
  weekMinutes: number;
  monthMinutes: number;
  weekTarget: number;
}
