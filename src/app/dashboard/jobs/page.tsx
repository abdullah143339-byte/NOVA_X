"use client";

import { useMemo, useState } from "react";
import { Briefcase, Search, MapPin, Clock3, Users, Loader2, Handshake } from "lucide-react";

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  salary: string;
  category: string;
  tags: string[];
  applicants: number;
  posted: string;
}

const JOBS: Job[] = [
  { id: "j1", title: "Senior Frontend Engineer", company: "NovaTech", location: "Remote", type: "Full-time", salary: "$120k – $150k", category: "Engineering", tags: ["React", "TypeScript", "Next.js"], applicants: 24, posted: "2 days ago" },
  { id: "j2", title: "AI/ML Engineer", company: "DeepSync", location: "San Francisco, CA", type: "Full-time", salary: "$140k – $180k", category: "Engineering", tags: ["Python", "PyTorch", "LLMs"], applicants: 41, posted: "1 day ago" },
  { id: "j3", title: "Product Designer", company: "PixelForge", location: "New York, NY", type: "Contract", salary: "$90k – $120k", category: "Design", tags: ["Figma", "UI/UX"], applicants: 15, posted: "3 days ago" },
  { id: "j4", title: "Backend Engineer", company: "CloudNine", location: "Austin, TX", type: "Full-time", salary: "$110k – $140k", category: "Engineering", tags: ["Node.js", "PostgreSQL"], applicants: 18, posted: "5 days ago" },
  { id: "j5", title: "Growth Marketing Lead", company: "BrightLoop", location: "Remote", type: "Full-time", salary: "$85k – $110k", category: "Marketing", tags: ["SEO", "Content", "Analytics"], applicants: 9, posted: "1 week ago" },
  { id: "j6", title: "DevOps Engineer", company: "IronStack", location: "Seattle, WA", type: "Full-time", salary: "$125k – $155k", category: "Engineering", tags: ["AWS", "Kubernetes", "CI/CD"], applicants: 12, posted: "4 days ago" },
];

const CATEGORIES = ["All", "Engineering", "Design", "Marketing"];

export default function JobsPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [applied, setApplied] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return JOBS.filter((j) => {
      if (category !== "All" && j.category !== category) return false;
      if (!q) return true;
      return j.title.toLowerCase().includes(q) || j.company.toLowerCase().includes(q) || j.tags.some((t) => t.toLowerCase().includes(q));
    });
  }, [query, category]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-primary" />
            Jobs
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Find your next opportunity in the NOVA community</p>
        </div>
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search jobs, companies, skills..."
            className="w-full h-10 pl-9 pr-4 rounded-xl bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`h-8 px-3.5 rounded-lg text-xs font-medium transition-all ${
              category === c ? "bg-gradient-primary text-white" : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="glass rounded-2xl p-10 text-center">
          <p className="font-semibold text-foreground">No jobs found</p>
          <p className="text-sm text-muted-foreground mt-1">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((j) => (
            <div key={j.id} className="glass rounded-2xl p-5 shadow-premium flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="font-semibold text-foreground leading-tight">{j.title}</h3>
                  <p className="text-sm text-muted-foreground">{j.company}</p>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs shrink-0">{j.type}</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{j.location}</span>
                <span className="flex items-center gap-1"><Clock3 className="w-3 h-3" />{j.posted}</span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {j.tags.map((t) => (
                  <span key={t} className="px-2 py-0.5 rounded-md bg-muted text-xs text-muted-foreground">{t}</span>
                ))}
              </div>
              <div className="mt-auto pt-1 flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-foreground">{j.salary}</span>
                <span className="text-xs text-muted-foreground flex items-center gap-1"><Users className="w-3 h-3" />{j.applicants} applicants</span>
              </div>
              <button
                onClick={() => setApplied((prev) => new Set(prev).add(j.id))}
                disabled={applied.has(j.id)}
                className="w-full h-9 rounded-xl text-sm font-medium flex items-center justify-center gap-1.5 transition-all disabled:opacity-60 bg-gradient-primary text-white hover:scale-[1.02] active:scale-[0.98]"
              >
                {applied.has(j.id) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Handshake className="w-4 h-4" />}
                {applied.has(j.id) ? "Applied" : "Apply now"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
