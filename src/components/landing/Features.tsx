"use client";

import { motion, type Variants } from "framer-motion";
import GlassCard from "@/components/ui/GlassCard";
import BlurText from "@/components/ui/BlurText";
import VideoBackdrop from "@/components/landing/VideoBackdrop";
import {
  Users,
  Brain,
  Mic,
  Trophy,
  MessageSquare,
  BookOpen,
  ShoppingCart,
  Layout,
  Search,
  Shield,
  BarChart3,
  Sparkles,
} from "lucide-react";

const features = [
  {
    icon: <Brain className="w-6 h-6" />,
    title: "AI Router",
    description: "Intelligent routing to the best model for every task — coding, chat, translation, images, and more.",
    color: "from-violet-500 to-purple-600",
  },
  {
    icon: <Users className="w-6 h-6" />,
    title: "Dynamic Profiles",
    description: "AI personalizes what visitors see — devs see repos, designers see portfolios, recruiters see experience.",
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: <Mic className="w-6 h-6" />,
    title: "Voice-First Social",
    description: "Publish voice posts, stories, and blogs. AI generates captions, transcripts, and translations.",
    color: "from-amber-500 to-orange-500",
  },
  {
    icon: <Trophy className="w-6 h-6" />,
    title: "Reputation System",
    description: "Meaningful scores — Helpful, Trust, Skill, Community, Contribution — not just likes and followers.",
    color: "from-green-500 to-emerald-500",
  },
  {
    icon: <MessageSquare className="w-6 h-6" />,
    title: "Smart Messaging",
    description: "Encrypted chats with AI summarization, reply suggestions, voice/video calls, and smart search.",
    color: "from-pink-500 to-rose-500",
  },
  {
    icon: <BookOpen className="w-6 h-6" />,
    title: "Learning Platform",
    description: "Daily plans, weekly challenges, skill trees, coding challenges, XP, levels, and certificates.",
    color: "from-teal-500 to-cyan-500",
  },
  {
    icon: <ShoppingCart className="w-6 h-6" />,
    title: "Marketplace",
    description: "Sell courses, templates, prompts, designs, AI agents, digital products, and services.",
    color: "from-indigo-500 to-blue-500",
  },
  {
    icon: <Layout className="w-6 h-6" />,
    title: "AI Portfolio",
    description: "Auto-generated portfolios from your activity — projects, skills, timeline, achievements.",
    color: "from-fuchsia-500 to-pink-500",
  },
  {
    icon: <Search className="w-6 h-6" />,
    title: "AI Search",
    description: "Natural language search — find people, projects, skills, and content effortlessly.",
    color: "from-cyan-500 to-blue-500",
  },
  {
    icon: <Shield className="w-6 h-6" />,
    title: "Enterprise Security",
    description: "RBAC, 2FA, E2E encryption, OWASP Top 10, audit logs, brute-force protection.",
    color: "from-red-500 to-orange-500",
  },
  {
    icon: <BarChart3 className="w-6 h-6" />,
    title: "Smart Analytics",
    description: "AI-powered insights on your content, engagement, learning progress, and reputation.",
    color: "from-emerald-500 to-green-500",
  },
  {
    icon: <Sparkles className="w-6 h-6" />,
    title: "AI Companion",
    description: "Create personalized AI friends — teacher, coach, mentor, or professional companion.",
    color: "from-violet-500 to-indigo-500",
  },
];

const containerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 30, filter: "blur(10px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.7, ease: "easeOut" } },
};

export default function Features() {
  return (
    <section id="features" className="py-24 relative overflow-hidden">
      <VideoBackdrop
        src="/videos/features-bg.mp4"
        overlayClassName="bg-gradient-to-b from-black/65 via-black/55 to-black/75"
      />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 mb-4">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm text-muted-foreground">Core Features</span>
          </div>
          <BlurText
            text="Everything You Need, Nothing You Don't"
            className="text-4xl sm:text-5xl font-bold mb-4"
            highlightWords={["Nothing", "You", "Don't"]}
            highlightClassName="text-gradient"
          />
          <motion.p
            initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="text-lg text-muted-foreground max-w-2xl mx-auto"
          >
            A complete platform combining social media, AI, learning, creator economy, and collaboration.
          </motion.p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {features.map((feature) => (
            <motion.div key={feature.title} variants={itemVariants}>
              <GlassCard className="h-full">
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-r ${feature.color} flex items-center justify-center text-white mb-4`}
                >
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </GlassCard>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
