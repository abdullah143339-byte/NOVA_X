"use client";

import { NotebookPen } from "lucide-react";
import { LearningNav, PageHeader } from "@/components/learning/LearningShared";
import { NoteEditor } from "@/components/learning/NoteEditor";

export default function NewNotePage() {
  return (
    <div className="space-y-6">
      <PageHeader title="New Note" subtitle="Markdown supported — it auto-saves as a draft." icon={NotebookPen} />
      <LearningNav />
      <NoteEditor />
    </div>
  );
}
