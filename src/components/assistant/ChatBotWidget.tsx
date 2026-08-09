"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Loader2, Bot, Sparkles } from "lucide-react";
import api from "@/lib/api";

const WEBSITE_KNOWLEDGE = `You are NOVA AI, the intelligent assistant of the NOVA platform.
You have complete knowledge of the entire website and its features.

== PLATFORM OVERVIEW ==
NOVA is a premium AI-powered social ecosystem where users can Connect, Learn, Build, Collaborate, and Grow.
It combines Social Media, AI, Learning, Portfolio, Community, and Collaboration in one platform.

== PAGES & FEATURES ==

1. Dashboard (/) - Main feed showing posts from followed users, trending content, and personalized AI recommendations.

2. AI Router (/dashboard/ai-router) - Routes user requests to the best AI provider:
   - Chat: Groq → Gemini → OpenRouter → DeepSeek → Mistral
   - Code generation/review/debug/explain/refactor
   - Image generation: Flux (BFL) → FAL AI → Stability AI
   - Translation & language detection
   - Deep search with AI-powered summaries

3. AI Search (/dashboard/learning/ai-search) - AI-powered educational search inside the Learning Platform: explains topics with diagrams, key points, related topics and generated images.

4. Communities (/dashboard/communities) - Interest-based groups in categories: AI, Programming, Cyber Security, Design, Gaming, Business. Features: posts, discussions, events, collaboration.

5. Portfolio (/dashboard/portfolio) - Users showcase projects, GitHub links, skills, achievements, certifications. AI-generated portfolio system.

7. Messages (/dashboard/messages) - Private chat, group chat, file sharing, voice/video call ready structure.

8. Notifications (/dashboard/notifications) - Activity notifications, mentions, follows, likes, comments.

9. Search (/dashboard/search) - Intelligent search for people, projects, communities, skills, learning content.

10. Profile (/dashboard/profile) - User profile with reputation scores (skills, helpful, project, community, trust), posts, projects.

11. Settings (/dashboard/settings) - Account settings, 2FA setup, security, appearance, notifications preferences.

12. Projects (/dashboard/projects) - GitHub-style project showcase with URLs, descriptions, and contact buttons.

14. Marketplace (/dashboard/marketplace) - Digital marketplace for services and products.

16. Security features: JWT auth, Google OAuth, 2FA (authenticator app), rate limiting, input validation.

17. Login (/login) - Email/password & Google OAuth sign in.
18. Signup (/signup) - New user registration.
19. Forgot Password (/forgot-password) - Password reset.

== AI PROVIDERS INTEGRATED ==
- Groq: 7,200 req/day free (mixtral-8x7b, llama-3.1-70b)
- Gemini: 1,500 req/day free (gemini-1.5-flash, gemini-1.5-pro)
- OpenRouter: Free tier models (mistral-7b, gpt-3.5-turbo)
- DeepSeek: $5 free credits (deepseek-chat, deepseek-coder)
- Mistral: 500k tokens/day free (mistral-small, codestral)
- Flux (BFL): Image generation via API
- FAL AI: Image generation via fal-ai/flux
- Stability AI: Image generation via SD3
- Google Search: Web search API

== TECH STACK ==
- Frontend: Next.js 16 with Turbopack, Tailwind CSS v4, Framer Motion, Three.js/React Three Fiber
- Backend: NestJS with Prisma ORM (SQLite), WebSocket support
- Auth: JWT + Google OAuth with refresh tokens

== SITE WIDE FEATURES ==
- Dark theme with glassmorphism design
- 3D animations with Three.js
- Mobile responsive with sidebar + bottom nav
- Real-time notifications
- User reputation system
- AI-powered recommendations

Answer questions helpfully about any part of the website. Guide users to the right pages and features based on their needs. Keep responses concise and actionable.`;

export default function ChatBotWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{ role: "system", content: WEBSITE_KNOWLEDGE }, { role: "assistant", content: "Hi! I'm NOVA. Ask me anything about the platform." }]);
    }
  }, [open]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: "user", content: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const chatHistory = [...messages, userMsg].filter(m => m.role !== "system");
      const res = await api.aiChat(chatHistory) as any;
      const reply = res?.data?.content || "I'm not sure about that. Try asking differently!";
      setMessages(prev => [...prev, { role: "assistant", content: reply }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Sorry, I'm having trouble connecting. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-80 sm:w-96 glass-strong rounded-2xl shadow-elevated border border-border overflow-hidden animate-scale-in" style={{ maxHeight: "500px" }}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface/50">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-primary flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-semibold text-foreground">NOVA AI</span>
            </div>
            <button onClick={() => setOpen(false)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-muted transition-colors">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          <div className="p-3 overflow-y-auto space-y-3" style={{ height: "340px" }}>
            {messages.filter(m => m.role !== "system").map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] px-3 py-2 rounded-xl text-sm ${
                  msg.role === "user"
                    ? "bg-primary text-white rounded-tr-md"
                    : "bg-muted/70 text-foreground rounded-tl-md border border-border/50"
                }`}>
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-muted/70 border border-border/50 px-3 py-2 rounded-xl rounded-tl-md">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-3 border-t border-border bg-surface/30">
            <div className="flex items-center gap-2">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleSend())}
                placeholder="Ask me about NOVA..."
                className="flex-1 rounded-xl bg-muted/70 border border-border px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/40 transition-all"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || loading}
                className="w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center disabled:opacity-40 hover:opacity-90 transition-opacity shrink-0"
              >
                {loading ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Send className="w-4 h-4 text-white" />}
              </button>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-2xl bg-gradient-primary shadow-lg shadow-primary/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-all animate-float"
        style={{ animationDuration: "4s" }}
      >
        {open ? <X className="w-6 h-6 text-white" /> : <MessageCircle className="w-6 h-6 text-white" />}
      </button>
    </>
  );
}
