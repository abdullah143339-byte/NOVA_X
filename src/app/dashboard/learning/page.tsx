"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import { useLearning } from "@/components/learning/LearningProvider";
import {
  LearningNav,
  PageHeader,
  SectionHeader,
  StatCard,
  EmptyState,
} from "@/components/learning/LearningShared";
import { NoteCard, LectureCard, TaskCard } from "@/components/learning/LearningCards";
import { ProgressPanel } from "@/components/learning/ProgressPanel";
import { CalendarView } from "@/components/learning/CalendarView";
import { useCopy } from "@/components/learning/LearningShared";
import { GraduationCap, Play, Plus, Search, Clock3, FolderOpen, NotebookPen, Video, FileText, ListTodo, Share2 } from "lucide-react";
import Link from "next/link";

export default function LearningHubPage() {
  const { state, stats } = useLearning();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const { copied, copy } = useCopy();

  const active = useMemo(
    () => ({
      lectures: state.lectures.filter((l) => !l.trashed && !l.archived),
      notes: state.notes.filter((n) => !n.trashed && !n.archived),
      files: state.files.filter((f) => !f.trashed && !f.archived),
      tasks: state.tasks.filter((t) => !t.trashed && !t.archived),
      subjects: state.subjects.filter((s) => !s.trashed),
      bookmarks: state.bookmarks,
    }),
    [state]
  );

  const q = query.trim().toLowerCase();
  const searching = q.length > 0;

  const searchResults = useMemo(() => {
    if (!searching) return null;
    const match = (s: string) => s.toLowerCase().includes(q);
    return {
      subjects: active.subjects.filter((s) => match(s.name) || match(s.description)),
      notes: active.notes.filter((n) => match(n.title) || match(n.content) || n.tags.some(match)),
      lectures: active.lectures.filter((l) => match(l.title) || match(l.description) || match(l.teacher) || l.tags.some(match)),
      files: active.files.filter((f) => match(f.name) || f.tags.some(match)),
      tasks: active.tasks.filter((t) => match(t.title) || match(t.notes)),
    };
  }, [searching, q, active]);

  const continueLearning = useMemo(
    () => [...active.lectures.filter((l) => !l.completed)].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 4),
    [active.lectures]
  );
  const recentNotes = useMemo(
    () => [...active.notes].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 3),
    [active.notes]
  );
  const recentPdfs = useMemo(
    () => active.files.filter((f) => f.kind === "pdf").slice(0, 3),
    [active.files]
  );
  const favoriteSubjects = useMemo(
    () => active.subjects.slice(0, 4),
    [active.subjects]
  );
  const upcomingTasks = useMemo(
    () =>
      active.tasks
        .filter((t) => !t.completed)
        .sort((a, b) => (a.deadline ?? Infinity) - (b.deadline ?? Infinity))
        .slice(0, 4),
    [active.tasks]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Learning Hub"
        subtitle="Your personal workspace to store, organise and study smarter."
        icon={GraduationCap}
        action={
          <Button onClick={() => router.push("/dashboard/learning/notes/new")}>
            <Plus className="w-4 h-4" /> New Note
          </Button>
        }
      />

      <LearningNav />

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search subjects, notes, lectures, files, tasks…"
          aria-label="Search learning"
          className="w-full h-12 rounded-2xl glass border border-border pl-11 pr-4 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
        />
      </div>

      {searching && searchResults ? (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            {searchResults.subjects.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => router.push(`/dashboard/learning/subjects/${s.id}`)}
                className="glass rounded-2xl p-4 text-left hover:shadow-lg transition-all flex items-center gap-3"
              >
                <span className="text-2xl">{s.emoji}</span>
                <span>
                  <span className="block font-semibold text-foreground text-sm">{s.name}</span>
                  <span className="block text-xs text-muted-foreground">Subject</span>
                </span>
              </button>
            ))}
            {searchResults.notes.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => router.push(`/dashboard/learning/notes/edit/${n.id}`)}
                className="glass rounded-2xl p-4 text-left hover:shadow-lg transition-all"
              >
                <span className="flex items-center gap-2 text-primary"><NotebookPen className="w-4 h-4" /> Note</span>
                <span className="block mt-1 font-semibold text-foreground text-sm">{n.title || "Untitled"}</span>
              </button>
            ))}
            {searchResults.lectures.map((l) => (
              <button
                key={l.id}
                type="button"
                onClick={() => router.push(`/dashboard/learning/lectures`)}
                className="glass rounded-2xl p-4 text-left hover:shadow-lg transition-all"
              >
                <span className="flex items-center gap-2 text-primary"><Video className="w-4 h-4" /> Lecture</span>
                <span className="block mt-1 font-semibold text-foreground text-sm">{l.title}</span>
              </button>
            ))}
            {searchResults.files.map((f) => (
              <div key={f.id} className="glass rounded-2xl p-4">
                <span className="flex items-center gap-2 text-primary"><FileText className="w-4 h-4" /> File</span>
                <span className="block mt-1 font-semibold text-foreground text-sm truncate">{f.name}</span>
              </div>
            ))}
            {searchResults.tasks.map((t) => (
              <div key={t.id} className="glass rounded-2xl p-4">
                <span className="flex items-center gap-2 text-primary"><ListTodo className="w-4 h-4" /> Task</span>
                <span className="block mt-1 font-semibold text-foreground text-sm">{t.title}</span>
              </div>
            ))}
          </div>
          {Object.values(searchResults).every((a) => a.length === 0) && (
            <EmptyState
              icon={Search}
              title="No results found"
              desc={`Nothing matches "${query.trim()}". Try a different keyword.`}
            />
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard icon={Clock3} label="Study hours" value={(stats.totalStudyMinutes / 60).toFixed(1)} sub={`${(stats.weekMinutes / 60).toFixed(1)}h this week`} />
            <StatCard icon={Play} label="Lectures" value={`${stats.completedLectures}/${stats.totalLectures}`} sub={`${stats.totalLectures ? Math.round((stats.completedLectures / stats.totalLectures) * 100) : 0}% complete`} />
            <StatCard icon={ListTodo} label="Tasks" value={`${stats.completedTasks}/${stats.totalTasks}`} sub={`${stats.totalTasks ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0}% done`} />
            <StatCard icon={FolderOpen} label="Subjects" value={active.subjects.length} sub={`${active.notes.length} notes · ${active.files.length} files`} />
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <section>
                <SectionHeader
                  title="Continue Learning"
                  subtitle="Pick up where you left off"
                  action={<Link href="/dashboard/learning/lectures" className="text-sm font-semibold text-primary hover:underline">View all</Link>}
                />
                {continueLearning.length === 0 ? (
                  <EmptyState icon={Video} title="Nothing in progress" desc="Mark lectures complete to track your progress." action={<Button variant="secondary" onClick={() => router.push("/dashboard/learning/lectures/new")}><Plus className="w-4 h-4" /> Add lecture</Button>} />
                ) : (
                  <div className="grid md:grid-cols-2 gap-4">
                    {continueLearning.map((l) => (
                      <LectureCard key={l.id} lecture={l} />
                    ))}
                  </div>
                )}
              </section>

              <section>
                <SectionHeader
                  title="Recent Notes"
                  subtitle="Latest things you wrote"
                  action={<Link href="/dashboard/learning/notes" className="text-sm font-semibold text-primary hover:underline">View all</Link>}
                />
                {recentNotes.length === 0 ? (
                  <EmptyState icon={NotebookPen} title="No notes yet" action={<Button onClick={() => router.push("/dashboard/learning/notes/new")}><Plus className="w-4 h-4" /> Write a note</Button>} />
                ) : (
                  <div className="grid md:grid-cols-3 gap-4">
                    {recentNotes.map((n) => (
                      <NoteCard key={n.id} note={n} />
                    ))}
                  </div>
                )}
              </section>

              <section>
                <SectionHeader
                  title="Upcoming Tasks"
                  subtitle="Deadlines and reminders"
                  action={<Link href="/dashboard/learning/tasks" className="text-sm font-semibold text-primary hover:underline">View all</Link>}
                />
                {upcomingTasks.length === 0 ? (
                  <EmptyState icon={ListTodo} title="All clear" desc="No pending tasks. Enjoy the calm." />
                ) : (
                  <div className="space-y-2.5">
                    {upcomingTasks.map((t) => (
                      <TaskCard key={t.id} task={t} />
                    ))}
                  </div>
                )}
              </section>
            </div>

            <div className="space-y-6">
              <section>
                <SectionHeader title="Study Progress" />
                <ProgressPanel stats={stats} sessions={state.sessions} />
              </section>

              <section>
                <SectionHeader
                  title="Favorite Subjects"
                  action={<Link href="/dashboard/learning/subjects" className="text-sm font-semibold text-primary hover:underline">Manage</Link>}
                />
                <div className="grid grid-cols-2 gap-3">
                  {favoriteSubjects.map((s) => (
                    <Link
                      key={s.id}
                      href={`/dashboard/learning/subjects/${s.id}`}
                      className="glass rounded-2xl p-4 hover:shadow-lg transition-all group"
                    >
                      <span className="text-2xl">{s.emoji}</span>
                      <p className="mt-2 font-semibold text-foreground text-sm truncate">{s.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {state.notes.filter((n) => n.subjectId === s.id && !n.trashed).length} notes
                      </p>
                    </Link>
                  ))}
                </div>
              </section>

              <section>
                <SectionHeader title="Recent PDFs" action={<Link href="/dashboard/learning/files" className="text-sm font-semibold text-primary hover:underline">All files</Link>} />
                {recentPdfs.length === 0 ? (
                  <div className="glass rounded-2xl p-5 text-sm text-muted-foreground">
                    No PDFs yet. <Link href="/dashboard/learning/files" className="text-primary hover:underline">Upload one</Link>.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {recentPdfs.map((f) => (
                      <div key={f.id} className="glass rounded-xl px-4 py-3 flex items-center gap-3">
                        <FileText className="w-4 h-4 text-rose-400 shrink-0" />
                        <span className="text-sm text-foreground truncate flex-1">{f.name}</span>
                        {f.dataUrl && (
                          <a href={f.dataUrl} download={f.name} className="text-xs font-semibold text-primary hover:underline shrink-0">Open</a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section>
                <SectionHeader title="Study Calendar" subtitle="Schedule & deadlines" />
                <CalendarView tasks={active.tasks} />
              </section>

              <section>
                <SectionHeader
                  title="Share your workspace"
                  subtitle="Copy a link to this hub"
                />
                <div className="glass rounded-2xl p-4 flex items-center gap-3">
                  <Share2 className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-xs text-muted-foreground truncate flex-1">Learning Hub</span>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      const url = `${window.location.origin}/dashboard/learning`;
                      copy(url);
                    }}
                  >
                    {copied ? "Copied" : "Copy"}
                  </Button>
                </div>
              </section>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
