"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X, SlidersHorizontal, Package } from "lucide-react";
import api from "@/lib/api";
import ProductCard from "@/components/marketplace/ProductCard";
import ProductCardSkeleton from "@/components/marketplace/ProductCardSkeleton";
import QuickViewModal from "@/components/marketplace/QuickViewModal";
import EmptyState from "@/components/marketplace/EmptyState";
import SearchFiltersPanel, { DEFAULT_FILTERS, type SearchFilters } from "@/components/marketplace/SearchFiltersPanel";
import { extractItems } from "@/components/marketplace/itemUtils";
import { cn } from "@/lib/utils";
import type { MarketplaceItem } from "@/components/marketplace/types";

const SORT_OPTIONS = [
  { id: "relevance", label: "Relevance" },
  { id: "popular", label: "Most Popular" },
  { id: "price-asc", label: "Price: Low to High" },
  { id: "price-desc", label: "Price: High to Low" },
  { id: "rating", label: "Top Rated" },
  { id: "newest", label: "Newest" },
];

export default function SearchPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") ?? "";
  const [query, setQuery] = useState(initialQuery);
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>(DEFAULT_FILTERS);
  const [sort, setSort] = useState("relevance");
  const [quickItem, setQuickItem] = useState<MarketplaceItem | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      return JSON.parse(window.localStorage.getItem("novax_market_searches") ?? "[]") as string[];
    } catch {
      return [];
    }
  });

  const loadedRef = useRef(false);

  const saveSearch = useCallback((term: string) => {
    const trimmed = term.trim();
    if (!trimmed) return;
    setRecentSearches((prev) => {
      const next = [trimmed, ...prev.filter((s) => s !== trimmed)].slice(0, 8);
      window.localStorage.setItem("novax_market_searches", JSON.stringify(next));
      return next;
    });
  }, []);

  const load = useCallback(
    (q: string, type: string, category: string) => {
      return api
        .getMarketplaceItems(1, type || undefined, category || undefined)
        .then((res) => {
          let list = extractItems(res.data);
          if (q) {
            const term = q.toLowerCase();
            list = list.filter(
              (i) =>
                i.title.toLowerCase().includes(term) ||
                i.description.toLowerCase().includes(term) ||
                i.category.toLowerCase().includes(term)
            );
          }
          setItems(list);
        })
        .catch(() => setItems([]));
    },
    []
  );

  useEffect(() => {
    if (!loadedRef.current) {
      loadedRef.current = true;
      load(initialQuery, "", "").finally(() => setLoading(false));
    }
  }, [initialQuery, load]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const term = query.trim();
    if (!term) return;
    saveSearch(term);
    router.replace(`/dashboard/marketplace/search?q=${encodeURIComponent(term)}`);
    load(term, filters.type, filters.category);
  };

  const applyFilters = (next: Partial<SearchFilters>) => {
    const merged = { ...filters, ...next };
    setFilters(merged);
    load(query, merged.type, merged.category);
  };

  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setSort("relevance");
    load(query, "", "");
  };

  const maxPrice = items.reduce((m, i) => Math.max(m, i.price), 0);

  // Client-side filtering (price/rating) and sorting of the fetched results.
  const filtered = items
    .filter((i) => {
      if (filters.maxPrice > 0 && i.price > filters.maxPrice) return false;
      if (filters.minRating > 0 && (i.rating ?? 0) < filters.minRating) return false;
      return true;
    })
    .sort((a, b) => {
      if (sort === "price-asc") return a.price - b.price;
      if (sort === "price-desc") return b.price - a.price;
      if (sort === "rating") return (b.rating ?? 0) - (a.rating ?? 0);
      if (sort === "popular") return (b.salesCount ?? 0) - (a.salesCount ?? 0);
      if (sort === "newest") return new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime();
      return 0;
    });

  const filtersActive =
    filtersOpen || Object.values(filters).some((v) => (typeof v === "number" ? v > 0 : v !== ""));

  const runSearch = (term: string) => {
    setQuery(term);
    saveSearch(term);
    router.replace(`/dashboard/marketplace/search?q=${encodeURIComponent(term)}`);
    load(term, filters.type, filters.category);
  };

  return (
    <div className="space-y-5">
      {/* Search bar */}
      <form onSubmit={handleSubmit} className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search products, categories, brands..."
          aria-label="Search marketplace products"
          className="w-full h-12 rounded-2xl bg-muted border border-border pl-12 pr-12 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label="Clear search"
            className="absolute right-4 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg bg-muted-foreground/10 flex items-center justify-center text-muted-foreground hover:text-foreground"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </form>

      {/* Recent searches */}
      {recentSearches.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground font-medium">Recent:</span>
          {recentSearches.map((s) => (
            <button
              key={s}
              onClick={() => runSearch(s)}
              className="px-3 py-1 rounded-full glass text-xs text-muted-foreground hover:text-foreground hover:bg-surface transition-all"
            >
              {s}
            </button>
          ))}
          <button
            onClick={() => {
              setRecentSearches([]);
              window.localStorage.removeItem("novax_market_searches");
            }}
            className="text-xs text-muted-foreground/60 hover:text-red-500 px-1"
          >
            Clear
          </button>
        </div>
      )}

      {/* Filters toggle + sort + result count */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setFiltersOpen((v) => !v)}
          className={cn(
            "inline-flex items-center gap-2 h-9 px-3.5 rounded-xl text-sm font-medium transition-all",
            filtersActive ? "bg-primary text-white" : "glass text-muted-foreground hover:text-foreground"
          )}
        >
          <SlidersHorizontal className="w-4 h-4" /> Filters
        </button>

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          aria-label="Sort results"
          className="h-9 rounded-xl glass px-3 text-sm text-foreground focus:outline-none"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.id} value={o.id}>{o.label}</option>
          ))}
        </select>

        <span className="ml-auto text-sm text-muted-foreground">
          {loading ? "Searching..." : `${filtered.length} result${filtered.length === 1 ? "" : "s"}`}
        </span>
      </div>

      {filtersOpen && <SearchFiltersPanel filters={filters} maxPrice={maxPrice} onApply={applyFilters} onReset={resetFilters} />}

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Package className="w-8 h-8 text-primary" />}
          title="No products found"
          subtitle="Try a different search term or adjust your filters."
          actionLabel="Reset Search"
          onAction={resetFilters}
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {filtered.map((item) => (
            <ProductCard key={item.id} item={item} onQuickView={setQuickItem} />
          ))}
        </div>
      )}

      {quickItem && <QuickViewModal item={quickItem} onClose={() => setQuickItem(null)} />}
    </div>
  );
}
