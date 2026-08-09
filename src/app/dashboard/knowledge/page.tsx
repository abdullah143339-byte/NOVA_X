"use client";

import { useState } from "react";
import { Network, Search, User, FileText, GraduationCap, Users, Lightbulb, Share2 } from "lucide-react";

interface Node {
  id: string;
  type: "concept" | "user" | "post" | "course" | "community" | "skill";
  label: string;
}

const NODES: Node[] = [
  { id: "c1", type: "concept", label: "Artificial Intelligence" },
  { id: "c2", type: "skill", label: "React" },
  { id: "c3", type: "course", label: "Full-Stack Development" },
  { id: "c4", type: "post", label: "How I learned TypeScript" },
  { id: "c5", type: "community", label: "Web Dev Hub" },
  { id: "c6", type: "user", label: "Top Contributors" },
];

const EDGES: { src: string; dst: string; rel: string }[] = [
  { src: "c2", dst: "c3", rel: "relates to" },
  { src: "c2", dst: "c4", rel: "featured in" },
  { src: "c3", dst: "c5", rel: "discussed in" },
  { src: "c1", dst: "c6", rel: "authored by" },
  { src: "c4", dst: "c1", rel: "explains" },
];

const TYPE_META: Record<string, { icon: React.ReactNode; cls: string }> = {
  concept: { icon: <Lightbulb className="w-4 h-4" />, cls: "text-amber-500 bg-amber-500/10" },
  user: { icon: <User className="w-4 h-4" />, cls: "text-primary bg-primary/10" },
  post: { icon: <FileText className="w-4 h-4" />, cls: "text-sky-500 bg-sky-500/10" },
  course: { icon: <GraduationCap className="w-4 h-4" />, cls: "text-emerald-500 bg-emerald-500/10" },
  community: { icon: <Users className="w-4 h-4" />, cls: "text-pink-500 bg-pink-500/10" },
  skill: { icon: <Share2 className="w-4 h-4" />, cls: "text-violet-500 bg-violet-500/10" },
};

export default function KnowledgeGraphPage() {
  const [query, setQuery] = useState("");

  const q = query.trim().toLowerCase();
  const filteredNodes = q ? NODES.filter((n) => n.label.toLowerCase().includes(q)) : NODES;
  const nodeById = (id: string) => NODES.find((n) => n.id === id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Network className="w-6 h-6 text-primary" />
            Knowledge Graph
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Explore how people, topics and content connect across NOVA AI</p>
        </div>
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search the graph..."
            className="w-full h-10 pl-9 pr-4 rounded-xl bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="glass rounded-2xl p-5 shadow-premium">
          <h2 className="text-sm font-bold text-foreground mb-4">Nodes ({filteredNodes.length})</h2>
          <div className="space-y-2 max-h-[480px] overflow-y-auto no-scrollbar">
            {filteredNodes.length === 0 && <p className="text-sm text-muted-foreground">No matching nodes</p>}
            {filteredNodes.map((n) => (
              <div key={n.id} className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-muted/60 transition-all">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${TYPE_META[n.type]?.cls ?? "text-muted-foreground bg-muted"}`}>
                  {TYPE_META[n.type]?.icon ?? <Lightbulb className="w-4 h-4" />}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{n.label}</p>
                  <p className="text-xs text-muted-foreground capitalize">{n.type}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 glass rounded-2xl p-5 shadow-premium">
          <h2 className="text-sm font-bold text-foreground mb-4">Connections ({EDGES.length})</h2>
          <div className="space-y-2 max-h-[480px] overflow-y-auto no-scrollbar">
            {EDGES.map((e, i) => (
              <div key={i} className="flex items-center gap-2 text-sm p-2 rounded-xl hover:bg-muted/60 transition-all">
                <span className="font-medium text-foreground truncate max-w-[30%]">{nodeById(e.src)?.label ?? e.src}</span>
                <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs shrink-0">{e.rel}</span>
                <span className="font-medium text-foreground truncate max-w-[30%]">{nodeById(e.dst)?.label ?? e.dst}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
