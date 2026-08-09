"use client";

import { RefreshCw } from "lucide-react";
import { MEGA_CATEGORIES } from "./catalog";
import { cn } from "@/lib/utils";

export interface SearchFilters {
  type: string;
  category: string;
  maxPrice: number;
  minRating: number;
}

export const DEFAULT_FILTERS: SearchFilters = { type: "", category: "", maxPrice: 0, minRating: 0 };

export const TYPE_FILTERS = [
  { id: "TEMPLATE", label: "Templates" },
  { id: "COMPONENT", label: "Components" },
  { id: "PLUGIN", label: "Plugins" },
  { id: "COURSE", label: "Courses" },
  { id: "EBOOK", label: "E-Books" },
  { id: "AI_MODEL", label: "AI Models" },
  { id: "SERVICE", label: "Services" },
  { id: "DIGITAL_ART", label: "Digital Art" },
];

interface SearchFiltersPanelProps {
  filters: SearchFilters;
  maxPrice: number;
  onApply: (patch: Partial<SearchFilters>) => void;
  onReset: () => void;
}

/** Collapsible filter controls: product type, category, price and rating. */
export default function SearchFiltersPanel({ filters, maxPrice, onApply, onReset }: SearchFiltersPanelProps) {
  return (
    <div className="glass rounded-2xl p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div>
        <p className="text-xs font-semibold text-foreground mb-2">Product Type</p>
        <div className="flex flex-wrap gap-1.5">
          <FilterChip active={filters.type === ""} onClick={() => onApply({ type: "" })} label="All" />
          {TYPE_FILTERS.map((t) => (
            <FilterChip
              key={t.id}
              active={filters.type === t.id}
              onClick={() => onApply({ type: filters.type === t.id ? "" : t.id })}
              label={t.label}
            />
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-foreground mb-2">Category</p>
        <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto no-scrollbar">
          {MEGA_CATEGORIES.map((c) => (
            <FilterChip
              key={c.id}
              active={filters.category === c.label}
              onClick={() => onApply({ category: filters.category === c.label ? "" : c.label })}
              label={c.label}
            />
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <p className="text-xs font-semibold text-foreground mb-2">
            Max Price: {filters.maxPrice > 0 ? `$${filters.maxPrice}` : "Any"}
          </p>
          <input
            type="range"
            min={0}
            max={Math.max(maxPrice, 1)}
            step={5}
            value={filters.maxPrice}
            onChange={(e) => onApply({ maxPrice: Number(e.target.value) })}
            aria-label="Maximum price filter"
            className="w-full accent-primary"
          />
        </div>
        <div>
          <p className="text-xs font-semibold text-foreground mb-2">Minimum Rating</p>
          <div className="flex gap-1.5">
            {[0, 3, 4, 4.5].map((r) => (
              <FilterChip
                key={r}
                active={filters.minRating === r}
                onClick={() => onApply({ minRating: filters.minRating === r ? 0 : r })}
                label={r === 0 ? "Any" : `${r}★`}
              />
            ))}
          </div>
        </div>
        <button
          onClick={onReset}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
        >
          <RefreshCw className="w-3 h-3" /> Reset filters
        </button>
      </div>
    </div>
  );
}

function FilterChip({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-3 py-1.5 rounded-lg text-xs transition-all",
        active ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:text-foreground"
      )}
    >
      {label}
    </button>
  );
}
