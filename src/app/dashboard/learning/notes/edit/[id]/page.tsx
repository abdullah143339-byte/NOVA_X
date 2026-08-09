"use client";

import { useParams, useRouter } from "next/navigation";
import { NotebookPen, ArrowLeft } from "lucide-react";
import Button from "@/components/ui/Button";
import { useLearning } from "@/components/learning/LearningProvider";
import { LearningNav, PageHeader, EmptyState } from "@/components/learning/LearningShared";
import { NoteEditor } from "@/components/learning/NoteEditor";

export default function EditNotePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { state } = useLearning();
  const note = state.notes.find((n) => n.id === params.id);

  if (!note || note.trashed) {
    return (
      <div className="space-y-6">
        <LearningNav />
        <EmptyState
          icon={NotebookPen}
          title="Note not found"
          desc="This note may have been deleted or moved to trash."
          action={<Button variant="secondary" onClick={() => router.push("/dashboard/learning/notes")}><ArrowLeft className="w-4 h-4" /> Back to notes</Button>}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Edit Note" subtitle="Changes are auto-saved." icon={NotebookPen} />
      <LearningNav />
      <NoteEditor note={note} />
    </div>
  );
}
