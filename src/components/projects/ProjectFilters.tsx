"use client";

import { Search, ArrowUpDown, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { CATEGORY_POOL } from "./data";
import type { ProjectStatus } from "./types";

export type SortKind = "newest" | "popular" | "trending" | "bookmarked";

export const SORT_OPTIONS: { id: SortKind; label: string }[] = [
  { id: "newest", label: "Newest" },
  { id: "popular", label: "Most Popular" },
  { id: "trending", label: "Trending" },
  { id: "bookmarked", label: "Most Bookmarked" },
];

export const STATUS_OPTIONS: { id: ProjectStatus | "ALL"; label: string }[] = [
  { id: "ALL", label: "All Status" },
  { id: "IDEA", label: "Idea" },
  { id: "IN_PROGRESS", label: "In Progress" },
  { id: "COMPLETED", label: "Completed" },
];

export function ProjectFilters({
  search,
  onSearch,
  sort,
  onSort,
  category,
  onCategory,
  status,
  onStatus,
}: {
  search: string;
  onSearch: (v: string) => void;
  sort: SortKind;
  onSort: (v: SortKind) => void;
  category: string;
  onCategory: (v: string) => void;
  status: ProjectStatus | "ALL";
  onStatus: (v: ProjectStatus | "ALL") => void;
}) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
      <div className="relative flex-1 min-w-0">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search projects by name, tech, tag..."
          className="w-full h-10 rounded-xl bg-muted border border-border pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
        />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex items-center gap-1 text-xs text-muted-foreground px-1">
          <Filter className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Filter</span>
        </div>
        <select
          value={category}
          onChange={(e) => onCategory(e.target.value)}
          aria-label="Category"
          className="h-10 px-3 rounded-xl bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          <option value="ALL">All Categories</option>
          {CATEGORY_POOL.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => onStatus(e.target.value as ProjectStatus | "ALL")}
          aria-label="Status"
          className="h-10 px-3 rounded-xl bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
        <div className="inline-flex items-center gap-1 text-xs text-muted-foreground px-1">
          <ArrowUpDown className="w-3.5 h-3.5" />
        </div>
        <div className="flex items-center gap-1 p-1 rounded-xl bg-muted border border-border">
          {SORT_OPTIONS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => onSort(s.id)}
              className={cn(
                "px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all",
                sort === s.id ? "bg-gradient-primary text-white" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
