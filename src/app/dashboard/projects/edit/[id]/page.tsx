"use client";

import { useParams } from "next/navigation";
import { CreateProjectForm } from "@/components/projects/CreateProjectForm";

export default function EditProjectPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id || "";
  return <CreateProjectForm editId={id} />;
}
