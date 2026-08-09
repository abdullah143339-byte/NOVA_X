"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import api from "@/lib/api";
import GlassCard from "@/components/ui/GlassCard";
import Button from "@/components/ui/Button";
import {
  Brain, Code, MessageCircle, Globe, Image, Search,
  Send, Loader2, Sparkles, ArrowRight, CheckCircle2, Zap,
  Route, Cpu, Network, Languages, Bot, Shield,
} from "lucide-react";

interface ProviderInfo {
  id: string;
  name: string;
  model: string;
  capabilities: string[];
}

interface RouterInfo {
  providers: ProviderInfo[];
  routingStrategy: string;
  autoScaling: boolean;
  fallbackEnabled: boolean;
}

const taskProviders: Record<string, { id: string; label: string; icon: React.ReactNode; color: string; endpoint: string }> = {
  chat: { id: "chat", label: "Chat", icon: <MessageCircle className="w-5 h-5" />, color: "from-purple-500 to-pink-500", endpoint: "aiChat" },
  code: { id: "code", label: "Coding", icon: <Code className="w-5 h-5" />, color: "from-blue-500 to-cyan-500", endpoint: "aiGenerateCode" },
  image: { id: "image", label: "Images", icon: <Image className="w-5 h-5" />, color: "from-amber-500 to-orange-500", endpoint: "aiGenerateImage" },
  translate: { id: "translate", label: "Translate", icon: <Globe className="w-5 h-5" />, color: "from-green-500 to-emerald-500", endpoint: "aiTranslate" },
  search: { id: "search", label: "Search", icon: <Search className="w-5 h-5" />, color: "from-teal-500 to-cyan-500", endpoint: "aiDeepSearch" },
};

interface HistoryItem {
  task: string;
  input: string;
  result: any;
  model: string;
  provider: string;
}

const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN"];

export default function AIRouterPage() {
  const { user } = useAuth();
  const router = useRouter();
  const isAdmin = user && ADMIN_ROLES.includes(user.role || "");

  useEffect(() => {
    if (user && !isAdmin) {
      router.push("/dashboard");
    }
  }, [user, isAdmin, router]);

  const [routerInfo, setRouterInfo] = useState<RouterInfo | null>(null);
  const [selectedTask, setSelectedTask] = useState("chat");
  const [input, setInput] = useState("");
  const [targetLang, setTargetLang] = useState("es");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [infoLoading, setInfoLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.getRouterInfo() as any;
        setRouterInfo(res.data);
      } catch {} finally {
        setInfoLoading(false);
      }
    })();
  }, []);

  const handleRoute = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);

    try {
      let res: any;
      const task = selectedTask;

      switch (task) {
        case "chat":
          res = await api.aiChat([{ role: "user", content: input }]);
          break;
        case "code":
          res = await api.aiGenerateCode(input, "typescript", "generate");
          break;
        case "image":
          res = await api.aiGenerateImage(input);
          break;
        case "translate":
          res = await api.aiTranslate(input, targetLang);
          break;
        case "search":
          res = await api.aiDeepSearch(input, "deep");
          break;
        default:
          res = await api.aiAutoRoute(input);
      }

      setResult(res.data || res);
      setHistory((prev) => [{
        task,
        input: input.trim(),
        result: res.data || res,
        model: res.model || "unknown",
        provider: res.provider || "nova",
      }, ...prev].slice(0, 10));
    } catch (err: any) {
      setError(err.message || "Request failed");
    } finally {
      setLoading(false);
    }
  };

  const examples: Record<string, string[]> = {
    chat: ["Explain quantum computing simply", "What is the difference between SQL and NoSQL?", "Write a motivational message for a developer"],
    code: ["Write a React hook for debounced search", "Create a binary search in Python", "Build a REST API validator"],
    image: ["A futuristic city at sunset with neon lights", "A cute robot reading a book in a library", "Abstract geometric pattern with vibrant colors"],
    translate: ["Hello, how are you?", "What is your name?", "Thank you very much"],
    search: ["Latest trends in AI 2026", "Best practices for Next.js performance", "Understanding transformer architecture"],
  };

  if (user && !isAdmin) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-20">
        <GlassCard className="p-12 text-center">
          <Shield className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Access Restricted</h2>
          <p className="text-muted-foreground mb-6">
            AI Router is only available for administrators.
          </p>
          <Button onClick={() => router.push("/dashboard")}>Back to Dashboard</Button>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-2xl bg-gradient-primary flex items-center justify-center">
            <Route className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">AI Router</h1>
            <p className="text-sm text-muted-foreground">
              {routerInfo
                ? `${routerInfo.providers.length} providers • ${routerInfo.routingStrategy} routing • fallback ${routerInfo.fallbackEnabled ? "enabled" : "disabled"}`
                : "Loading router info..."}
            </p>
          </div>
        </div>
      </div>

      {/* Provider Strip */}
      {routerInfo && (
        <div className="glass rounded-2xl p-4">
          <div className="flex items-center gap-4 overflow-x-auto pb-1">
            {routerInfo.providers.map((p) => {
              const tp = Object.values(taskProviders).find((t) => t.id === p.id);
              return (
                <div key={p.id} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted border border-border shrink-0">
                  <div className={`w-6 h-6 rounded-lg bg-gradient-to-r ${tp?.color || "from-gray-500 to-gray-600"} flex items-center justify-center text-white`}>
                    {tp ? <div className="scale-[0.6]">{tp.icon}</div> : <Bot className="w-3 h-3" />}
                  </div>
                  <div>
                    <div className="text-xs font-medium text-foreground">{p.name}</div>
                    <div className="text-[10px] text-muted-foreground">{p.model}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Flow Visualization */}
      <div className="glass rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-mesh opacity-30" />
        <div className="relative flex items-center justify-center gap-2 sm:gap-6 flex-wrap">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/20">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <span className="text-[10px] text-muted-foreground mt-1">Your Input</span>
          </div>
          <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Route className="w-6 h-6 text-white" />
            </div>
            <span className="text-[10px] text-muted-foreground mt-1">AI Router</span>
          </div>
          <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
          <div className="flex flex-col items-center">
            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-r ${Object.values(taskProviders).find(t => t.id === selectedTask)?.color || "from-gray-500 to-gray-600"} flex items-center justify-center shadow-lg`}>
              {Object.values(taskProviders).find(t => t.id === selectedTask)?.icon || <Cpu className="w-6 h-6 text-white" />}
            </div>
            <span className="text-[10px] text-muted-foreground mt-1 capitalize">{selectedTask} Provider</span>
          </div>
          <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-500/20">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <span className="text-[10px] text-muted-foreground mt-1">Response</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Controls */}
        <div className="lg:col-span-2 space-y-6">
          {/* Provider Selector */}
          <div className="glass rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              AI Provider
            </h2>
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
              {Object.values(taskProviders).map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTask(t.id)}
                  className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border transition-all ${
                    selectedTask === t.id
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:border-primary/30 hover:bg-muted text-muted-foreground"
                  }`}
                >
                  <div className={`w-7 h-7 rounded-lg bg-gradient-to-r ${t.color} flex items-center justify-center text-white`}>
                    {t.icon}
                  </div>
                  <span className="text-[10px] font-medium leading-tight text-center">{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Input */}
          <div className="glass rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-foreground mb-3">Your Request</h2>
            {selectedTask === "translate" && (
              <div className="flex items-center gap-2 mb-3">
                <Globe className="w-4 h-4 text-muted-foreground" />
                <select
                  value={targetLang}
                  onChange={(e) => setTargetLang(e.target.value)}
                  className="flex-1 rounded-xl bg-muted border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                  <option value="it">Italian</option>
                  <option value="pt">Portuguese</option>
                  <option value="ru">Russian</option>
                  <option value="zh">Chinese</option>
                  <option value="ja">Japanese</option>
                  <option value="ko">Korean</option>
                  <option value="ar">Arabic</option>
                  <option value="hi">Hindi</option>
                  <option value="ur">Urdu</option>
                </select>
              </div>
            )}
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Describe what you need..."
              rows={4}
              className="w-full rounded-xl bg-muted border border-border p-4 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all resize-none"
            />
            <div className="flex flex-wrap gap-2 mt-3">
              {(examples[selectedTask] || examples.chat).slice(0, 3).map((ex) => (
                <button
                  key={ex}
                  onClick={() => setInput(ex)}
                  className="px-3 py-1.5 rounded-lg bg-muted border border-border text-xs text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all"
                >
                  {ex.length > 35 ? ex.slice(0, 35) + "..." : ex}
                </button>
              ))}
            </div>
            <button
              onClick={handleRoute}
              disabled={loading || !input.trim()}
              className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-primary text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {loading ? "Processing..." : `Route to ${Object.values(taskProviders).find(t => t.id === selectedTask)?.label || "AI"}`}
            </button>
            {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
          </div>
        </div>

        {/* Right: Results */}
        <div className="space-y-6">
          {/* Result */}
          <div className="glass rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              Response
            </h2>
            {result ? (
              <div className="space-y-3">
                {result.content && (
                  <div className="p-3 rounded-xl bg-muted border border-border text-sm text-foreground whitespace-pre-wrap max-h-64 overflow-y-auto">
                    {result.content}
                  </div>
                )}
                {result.prompt && result.url && (
                  <div className="space-y-2">
                    <div className="rounded-xl overflow-hidden border border-border bg-muted">
                      <img src={result.url} alt={result.prompt} className="w-full h-auto max-h-96 object-contain" />
                    </div>
                    <div className="flex items-center justify-between px-1">
                      <span className="text-xs text-muted-foreground">{result.style || "image"}</span>
                      <a href={result.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">Open original ↗</a>
                    </div>
                  </div>
                )}
                {!result.prompt && result.url && (
                  <div className="p-3 rounded-xl bg-muted border border-border text-center">
                    <p className="text-xs text-muted-foreground mb-1">Generated asset</p>
                    <a href={result.url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline break-all">{result.url}</a>
                  </div>
                )}
                {result.translatedText && (
                  <div className="space-y-2">
                    <div className="p-3 rounded-xl bg-muted border border-border text-sm text-foreground">{result.translatedText}</div>
                    {result.confidence && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <CheckCircle2 className="w-3 h-3 text-green-500" />
                        Confidence: {Math.round(result.confidence * 100)}%
                      </div>
                    )}
                  </div>
                )}
                {result.results && (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {result.results.map((r: any, i: number) => (
                      <div key={i} className="p-2.5 rounded-xl bg-muted border border-border">
                        <div className="text-xs font-medium text-foreground">{r.title}</div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">{r.snippet}</div>
                        <div className="text-[10px] text-muted-foreground mt-1">Relevance: {Math.round(r.relevance * 100)}%</div>
                      </div>
                    ))}
                  </div>
                )}
                {result.text && (
                  <div className="p-3 rounded-xl bg-muted border border-border">
                    <p className="text-xs text-foreground">{result.text}</p>
                    {result.duration && <p className="text-[10px] text-muted-foreground mt-1">Duration: {result.duration}s</p>}
                  </div>
                )}
                {!result.content && !result.url && !result.translatedText && !result.results && !result.text && !result.prompt && (
                  <div className="p-3 rounded-xl bg-muted border border-border text-sm text-foreground whitespace-pre-wrap max-h-64 overflow-y-auto">
                    {JSON.stringify(result, null, 2)}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-3">
                  <Bot className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">Waiting for input</p>
                <p className="text-xs text-muted-foreground/50 mt-1">Select a provider and enter your request</p>
              </div>
            )}
          </div>

          {/* History */}
          <div className="glass rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Network className="w-4 h-4 text-primary" />
              Recent Routes
            </h2>
            {history.length > 0 ? (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {history.map((h, i) => (
                  <div key={i} className="p-3 rounded-xl bg-muted border border-border text-xs hover:border-primary/30 transition-all cursor-default">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="px-1.5 py-0.5 rounded-md bg-primary/10 text-primary text-[10px] font-medium capitalize">{h.task}</span>
                      <span className="text-[10px] text-muted-foreground">{h.model}</span>
                    </div>
                    <p className="text-muted-foreground truncate">{h.input}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <p className="text-sm text-muted-foreground">No routes yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
