import api from "@/lib/api";
import type { ProjectRow } from "./types";

interface AiResponse {
  text: string;
  fallback: boolean;
}

async function callAI(messages: { role: string; content: string }[]): Promise<string> {
  const res = await api.aiChat(messages, 0.4);
  const data = res.data as { content?: string };
  return String(data?.content || "").trim();
}

export async function aiSummarizeProject(project: ProjectRow): Promise<AiResponse> {
  try {
    const text = await callAI([
      {
        role: "system",
        content:
          "You are a product analyst. Summarize this project in 3 punchy bullet points that highlight value, differentiators and traction. No fluff.",
      },
      {
        role: "user",
        content: `Title: ${project.title}\nTagline: ${project.tagline}\nDescription: ${project.description}\nTech: ${project.techStack.join(", ")}\nStatus: ${project.status}`,
      },
    ]);
    return { text, fallback: false };
  } catch {
    return {
      text: `• ${project.tagline}\n• Builds on ${project.techStack.slice(0, 3).join(", ") || "a modern stack"} for real-world impact.\n• Currently in ${project.status === "COMPLETED" ? "production with a shipped product" : "active development with a clear roadmap"}.`,
      fallback: true,
    };
  }
}

export async function aiSuggestTags(project: ProjectRow): Promise<AiResponse> {
  try {
    const text = await callAI([
      {
        role: "system",
        content: "Reply with ONLY a comma-separated list of 8 discoverability tags for this project. No prose, no numbers.",
      },
      {
        role: "user",
        content: `Title: ${project.title}\nDescription: ${project.description}\nTech: ${project.techStack.join(", ")}\nCategory: ${project.category}`,
      },
    ]);
    return { text, fallback: false };
  } catch {
    return {
      text: `${project.category.toLowerCase()}, developer-tools, startup-ready, ${project.techStack[0]?.toLowerCase() || "product"}, showcase, ai-powered, modern, scalable`,
      fallback: true,
    };
  }
}

export async function aiSuggestTechStack(project: ProjectRow): Promise<AiResponse> {
  try {
    const text = await callAI([
      {
        role: "system",
        content: "Reply with ONLY a comma-separated list of 6 recommended technologies for this project with a one-line reason each.",
      },
      {
        role: "user",
        content: `Title: ${project.title}\nDescription: ${project.description}\nCategory: ${project.category}\nCurrent stack: ${project.techStack.join(", ")}`,
      },
    ]);
    return { text, fallback: false };
  } catch {
    return {
      text: `${project.techStack[0] || "Next.js"} for the core, ${project.techStack[1] || "PostgreSQL"} for data, Tailwind for UI, Docker for deploys, Redis for caching`,
      fallback: true,
    };
  }
}

export async function aiGenerateDescription(project: Partial<ProjectRow>): Promise<AiResponse> {
  try {
    const text = await callAI([
      {
        role: "system",
        content:
          "Write a polished 2-paragraph project description (90-140 words) that clearly explains the problem, the solution and the differentiator. Marketing tone, no emojis.",
      },
      {
        role: "user",
        content: `Title: ${project.title || "Untitled"}\nTagline: ${project.tagline || ""}\nCategory: ${project.category || "Other"}\nTech: ${(project.techStack || []).join(", ")}`,
      },
    ]);
    return { text, fallback: false };
  } catch {
    return {
      text: `${project.title || "This project"} tackles a problem many teams hit every day. The current approach is slow and fragmented, so ${project.title || "it"} takes a focused, modern approach built with ${(project.techStack || []).join(", ") || "a modern stack"}.\n\nWhat makes it different is a strong developer experience and clean architecture. The result is something teams actually enjoy using, with room to grow through the roadmap ahead.`,
      fallback: true,
    };
  }
}

export async function aiExplainCode(code: string, context: ProjectRow): Promise<AiResponse> {
  try {
    const text = await callAI([
      {
        role: "system",
        content: "Explain the given code snippet simply, then point out any risks or improvements. Max 120 words.",
      },
      {
        role: "user",
        content: `Project: ${context.title}\nCode:\n${code.slice(0, 2000)}`,
      },
    ]);
    return { text, fallback: false };
  } catch {
    return {
      text: "This looks like a standard implementation for the feature it powers. I'd suggest adding input validation, error handling for edge cases, and a few unit tests before shipping to production.",
      fallback: true,
    };
  }
}

export async function aiDocsHelper(project: ProjectRow): Promise<AiResponse> {
  try {
    const text = await callAI([
      {
        role: "system",
        content:
          "Generate a short documentation outline for this open-source project: getting started, architecture, API reference, contributing, FAQ. One line each.",
      },
      {
        role: "user",
        content: `Title: ${project.title}\nDescription: ${project.description}\nTech: ${project.techStack.join(", ")}\nLicense: ${project.license || "unknown"}`,
      },
    ]);
    return { text, fallback: false };
  } catch {
    return {
      text: "Getting Started: install with the package manager of your choice.\nArchitecture: modular core with a thin adapter layer.\nAPI Reference: documented in JSDoc across the codebase.\nContributing: fork, branch, open a PR with tests.\nFAQ: check the discussions tab for common questions.",
      fallback: true,
    };
  }
}

export function findSimilarProjects(project: ProjectRow, pool: ProjectRow[]): ProjectRow[] {
  const mine = new Set([...project.techStack, ...project.tags, String(project.category).toLowerCase()]);
  const scored = pool
    .filter((p) => p.id !== project.id)
    .map((p) => {
      let score = 0;
      for (const t of p.techStack) if (mine.has(t)) score += 2;
      for (const t of p.tags) if (mine.has(t)) score += 1;
      if (String(p.category).toLowerCase() === String(project.category).toLowerCase()) score += 3;
      return { p, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);
  return scored.slice(0, 3).map((x) => x.p);
}
