"use client";

import { useParams } from "next/navigation";
import { ProjectDetailView } from "@/components/projects/ProjectDetailView";

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id || "";
  return <ProjectDetailView id={id} />;
}
