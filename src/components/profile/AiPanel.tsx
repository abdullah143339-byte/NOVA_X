"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Loader2, Check, Copy, X } from "lucide-react";
import api from "@/lib/api";
import { AI_PROFILE_ACTIONS, getSkills, parseJsonArray } from "./data";
import { cn } from "@/lib/utils";

interface AiPanelProps {
  open: boolean;
  onClose: () => void;
  displayName: string;
  username: string;
  bio?: string | null;
  profileAbout?: string | null;
  skillsRaw?: string;
  tier: string;
  totalScore: number;
  postsCount: number;
  accent: string;
  notify: (msg: string, type?: "success" | "error" | "info") => void;
}

const ACTION_PROMPTS: Record<string, string> = {
  bio: "Write a compelling, professional bio for a NOVA AI creator profile. Keep it under 220 characters, friendly and premium.",
  summary: "Write a concise professional profile summary (2-3 sentences) that highlights strengths, expertise and passion.",
  skills: "Analyze the user's skills and suggest 3 recommended skills to add, plus a one-line explanation for each.",
  career: "Suggest 3 concrete next steps to grow as a creator on the platform, tailored to their profile.",
  content: "Suggest 5 content/post ideas this creator could publish, one line each.",
  username: "Suggest 6 clean, memorable username/handle ideas based on their current handle.",
  seo: "Give 5 quick SEO/profile-optimization tips for a NOVA AI profile.",
  translate: "Translate the user's bio into natural English, Spanish and Arabic. Show all three.",
  reputation: "Explain the user's reputation score in simple terms and give 3 ways to improve it.",
};

export default function AiPanel({ open, onClose, displayName, username, bio, profileAbout, skillsRaw, tier, totalScore, postsCount, accent, notify }: AiPanelProps) {
  const [action, setAction] = useState<string | null>(null);
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const context = [
    `Name: ${displayName}`,
    `Handle: @${username}`,
    `Bio: ${bio || "not set"}`,
    `About: ${profileAbout || "not set"}`,
    `Skills: ${parseJsonArray(skillsRaw).join(", ") || getSkills(username).join(", ")}`,
    `Creator tier: ${tier}`,
    `Reputation score: ${totalScore}`,
    `Posts: ${postsCount}`,
  ].join("\n");

  const runAction = async (id: string) => {
    setAction(id);
    setLoading(true);
    setOutput("");
    const label = AI_PROFILE_ACTIONS.find((a) => a.id === id)?.label || id;
    const prompt = ACTION_PROMPTS[id];
    const finalPrompt = id === "translate" ? `${prompt}\n\nBio to translate:\n"${bio || displayName + " is a creator on NOVA AI."}"` : prompt;
    try {
      const res = await api.aiChat([
        { role: "system", content: "You are NOVA AI's friendly profile assistant. Be concise, warm and practical. Use plain text with short bullet points." },
        { role: "user", content: `${context}\n\nTask: ${finalPrompt}` },
      ]);
      setOutput((res.data?.content as string) || localFallback(id));
    } catch {
      setOutput(localFallback(id));
      notify(`${label} generated offline`, "info");
    } finally {
      setLoading(false);
    }
  };

  const localFallback = (id: string): string => {
    const lines: Record<string, string[]> = {
      bio: [
        `${displayName} — creator, builder and lifelong learner on NOVA AI. I ship products, share ideas and help the community grow. 🚀`,
        `Building cool things with AI · ${postsCount} posts and counting. Let's create together! ✨`,
      ],
      summary: [
        `${displayName} is a passionate creator focused on turning ideas into shipped products. With a growing portfolio of posts, reels and marketplace items, they blend creativity with technical craft. Known for being approachable, consistent and community-first, ${displayName} is building a digital identity around trust and value.`,
      ],
      skills: [
        `• Recommended to highlight: AI Prompting — you already create AI-powered content.\n• Add: Public Speaking — grows your reach and authority.\n• Add: Analytics — helps you double down on what works.`,
      ],
      career: [
        `• Publish consistently — a weekly cadence beats bursts.\n• Engage daily — comments and replies raise your trust score.\n• Launch one marketplace item — monetize your expertise.`,
      ],
      content: [
        `• "3 things AI taught me this week"\n• Behind-the-scenes of your latest project\n• A quick tutorial/reel on your niche\n• Ask-me-anything thread\n• One myth about creators, debunked`,
      ],
      username: [
        `@${username.replace(/^@/, "")}`,
        `@${username.replace(/^@/, "")}·creates`,
        `@${username.replace(/^@/, "")}·studio`,
        `@${username.replace(/^@/, "")}·labs`,
        `@${username.replace(/^@/, "")}·io`,
        `@${username.replace(/^@/, "")}·world`,
      ],
      seo: [
        `• Use a keyword-rich bio (your niche + value).\n• Pin your best post.\n• Add location + website.\n• Use clear categories in the marketplace.\n• Keep a consistent visual theme.`,
      ],
      translate: [
        `English: ${bio || `${displayName} is a creator on NOVA AI.`}`,
        `Español: ${translateLine(bio || displayName, "es")}`,
        `العربية: ${translateLine(bio || displayName, "ar")}`,
      ],
      reputation: [
        `Your reputation score is ${totalScore} (${tier}). It reflects trust, contribution, activity and expertise.\n\nTo improve: engage meaningfully, publish original content, and complete your profile 100%.`,
      ],
    };
    return lines[id]?.join("\n\n") || "Here's some guidance for your profile.";
  };

  const translateLine = (text: string, lang: string): string => {
    const map: Record<string, Record<string, string>> = {
      es: { "creator": "creador", "on": "en", "is": "es", "a": "un" },
      ar: { "creator": "مبدع", "on": "على", "is": "هو", "a": "" },
    };
    return text.split(" ").map((w) => map[lang]?.[w.toLowerCase()] || w).join(" ");
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      notify("Copied to clipboard");
      setTimeout(() => setCopied(false), 1600);
    } catch {}
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="glass-strong rounded-2xl w-full max-w-2xl max-h-[82vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${accent}1A` }}>
                  <Sparkles className="w-4 h-4" style={{ color: accent }} />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-foreground">NOVA AI Profile Assistant</h3>
                  <p className="text-[11px] text-muted-foreground">Powered by {displayName.split(" ")[0]}&apos;s profile data</p>
                </div>
              </div>
              <button onClick={onClose} aria-label="Close AI assistant" className="p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-1 min-h-0">
              <div className="w-52 shrink-0 border-r border-border overflow-y-auto no-scrollbar hidden sm:block p-3">
                {AI_PROFILE_ACTIONS.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => runAction(a.id)}
                    className={cn(
                      "w-full text-left px-3 py-2.5 rounded-xl mb-1 transition-all",
                      action === a.id ? "bg-primary/10" : "hover:bg-muted/60"
                    )}
                  >
                    <span className="flex items-center gap-2 text-xs font-medium text-foreground">
                      <span className="text-sm">{a.emoji}</span> {a.label}
                    </span>
                    <span className="block text-[10px] text-muted-foreground mt-0.5 pl-6">{a.hint}</span>
                  </button>
                ))}
              </div>

              <div className="flex-1 flex flex-col min-w-0">
                <div className="flex gap-1.5 sm:hidden p-3 border-b border-border overflow-x-auto no-scrollbar">
                  {AI_PROFILE_ACTIONS.map((a) => (
                    <button key={a.id} onClick={() => runAction(a.id)} aria-label={a.label} className={cn("shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-medium", action === a.id ? "bg-primary/10 text-primary" : "bg-muted/50 text-muted-foreground")}>
                      {a.emoji} {a.label}
                    </button>
                  ))}
                </div>
                <div className="flex-1 overflow-y-auto no-scrollbar p-5">
                  {!action && !loading && (
                    <div className="h-full flex flex-col items-center justify-center text-center">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-primary/10 flex items-center justify-center mb-4 text-2xl">🤖</div>
                      <p className="text-sm font-semibold text-foreground">What should I help you with?</p>
                      <p className="text-xs text-muted-foreground mt-1 max-w-xs">Pick an action to generate AI-powered insights for your profile.</p>
                    </div>
                  )}
                  {loading && (
                    <div className="flex items-start gap-3">
                      <span className="w-8 h-8 rounded-xl bg-gradient-primary/10 flex items-center justify-center shrink-0"><Loader2 className="w-4 h-4 text-primary animate-spin" /></span>
                      <div className="space-y-2 flex-1">
                        <div className="h-3 w-3/4 bg-muted/50 animate-pulse rounded-md" />
                        <div className="h-3 w-1/2 bg-muted/40 animate-pulse rounded-md" />
                        <div className="h-3 w-2/3 bg-muted/40 animate-pulse rounded-md" />
                      </div>
                    </div>
                  )}
                  {!loading && output && (
                    <div>
                      <div className="flex items-center gap-1.5 mb-2">
                        <span className="text-[11px] font-semibold text-primary uppercase tracking-wide">{AI_PROFILE_ACTIONS.find((a) => a.id === action)?.label}</span>
                        <button onClick={copy} aria-label="Copy result" className="ml-auto p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-all">
                          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-xl p-4 text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
                        {output}
                      </motion.div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
