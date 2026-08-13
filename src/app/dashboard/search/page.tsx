"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import Link from "next/link";
import { Search, Users, FileText, Hash, TrendingUp } from "lucide-react";

interface SearchResult {
  id: string;
  type: "user" | "post" | "community";
  title: string;
  subtitle: string;
  avatar?: string;
  url: string;
}

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const q = searchParams.get("q") || "";
  const [query, setQuery] = useState(q);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [trendingTags, setTrendingTags] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>("all");

  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const data: any = await api.globalSearch(searchQuery, activeFilter === "all" ? undefined : activeFilter);
      const items = data?.data?.results || data?.data || [];
      setResults(items.map((r: any) => ({
        id: r.id,
        type: r.type || "post",
        title: r.title || r.name || r.username || r.content?.slice(0, 80) || "Untitled",
        subtitle: r.description || r.bio || r.slug || r.content?.slice(0, 120) || "",
        url: r.type === "user" ? `/dashboard/profile?u=${r.username || r.id}` :
             r.type === "community" ? `/dashboard/communities` :
             `/dashboard?post=${r.id}`,
      })));
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [activeFilter]);

  useEffect(() => {
    if (q) performSearch(q);
  }, [q, performSearch]);

  useEffect(() => {
    api.getTrendingTags().then((data: any) => setTrendingTags(data?.data || [])).catch(() => {});
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/dashboard/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const typeIcons: Record<string, React.ReactNode> = {
    user: <Users className="w-4 h-4" />,
    post: <FileText className="w-4 h-4" />,
    community: <Hash className="w-4 h-4" />,
  };

  const filters = ["all", "users", "posts", "communities"];

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      <form onSubmit={handleSearch} className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search users, posts, communities..."
          className="w-full h-12 rounded-2xl bg-muted border border-border pl-12 pr-4 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-base"
          autoFocus
        />
      </form>

      <div className="flex gap-2">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`h-9 px-3 rounded-xl text-xs font-medium transition-all capitalize ${
              activeFilter === f
                ? "bg-primary/10 text-primary border border-primary/20"
                : "bg-muted text-muted-foreground hover:text-foreground border border-transparent"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      )}

      {!loading && results.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">{results.length} result{results.length !== 1 ? "s" : ""}</p>
          {results.map((r) => (
            <Link
              key={r.id}
              href={r.url}
              className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border border-border hover:bg-muted hover:border-primary/20 transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                {typeIcons[r.type]}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">{r.title}</p>
                <p className="text-xs text-muted-foreground truncate">{r.subtitle}</p>
              </div>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground px-2 py-0.5 rounded-lg bg-background border border-border">{r.type}</span>
            </Link>
          ))}
        </div>
      )}

      {!loading && q && results.length === 0 && (
        <div className="text-center py-12">
          <Search className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">No results for &ldquo;{q}&rdquo;</p>
        </div>
      )}

      {!q && trendingTags.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-foreground">
            <TrendingUp className="w-4 h-4 text-primary" />
            <p className="text-sm font-medium">Trending Tags</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {trendingTags.map((tag: any, i: number) => (
              <button
                key={i}
                onClick={() => {
                  const tagText = typeof tag === "string" ? tag : tag.tag || tag.name || "";
                  setQuery(tagText);
                  router.push(`/dashboard/search?q=${encodeURIComponent(tagText)}`);
                }}
                className="px-3 py-1.5 rounded-xl bg-muted border border-border text-xs font-medium text-muted-foreground hover:text-primary hover:border-primary/20 transition-all"
              >
                #{typeof tag === "string" ? tag : tag.tag || tag.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
