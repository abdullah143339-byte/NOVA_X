"use client";

import { LearningProvider } from "@/components/learning/LearningProvider";

export default function LearningLayout({ children }: { children: React.ReactNode }) {
  return <LearningProvider>{children}</LearningProvider>;
}
