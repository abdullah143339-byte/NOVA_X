"use client";

import { motion } from "framer-motion";
import Button from "@/components/ui/Button";
import BlurText from "@/components/ui/BlurText";
import VideoBackdrop from "@/components/landing/VideoBackdrop";
import {
  Sparkles,
  ArrowRight,
  Brain,
  Shield,
} from "lucide-react";
import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      <VideoBackdrop
        src="/videos/hero-bg.mp4"
        overlayClassName="bg-gradient-to-b from-black/70 via-black/50 to-black/80"
      />

      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-[128px] animate-float" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/15 rounded-full blur-[128px] animate-float" style={{ animationDelay: "-3s" }} />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 mb-8">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-sm text-muted-foreground">
                ZARYA · Think Beyond Social
              </span>
            </div>
          </motion.div>

          <BlurText 
            text="Think Beyond Social"
            className="text-5xl sm:text-6xl lg:text-8xl font-bold tracking-tight mb-6"
            highlightWords={["Beyond", "Social"]}
            highlightClassName="text-gradient"
          />

          <motion.p
            initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10"
          >
            ZARYA brings social networking, AI, communication, learning,
            marketplace, and community together in one platform.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link href="/signup">
              <Button size="lg">
                Start Your Journey
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="secondary" size="lg">
                Explore Platform
              </Button>
            </Link>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 40, filter: "blur(10px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
          className="mt-20 relative"
        >
          <div className="glass rounded-3xl p-1 max-w-5xl mx-auto">
            <div className="bg-gradient-to-br from-surface to-background rounded-[22px] p-6 sm:p-10">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  {
                    icon: <Brain className="w-5 h-5" />,
                    title: "AI Router",
                    desc: "AI for chat, coding, images, translation, and deep search",
                    color: "from-purple-500 to-blue-500",
                  },
                  {
                    icon: <Sparkles className="w-5 h-5" />,
                    title: "AI Assistant",
                    desc: "Chat with ZARYA AI directly inside the app",
                    color: "from-amber-500 to-orange-500",
                  },
                  {
                    icon: <Shield className="w-5 h-5" />,
                    title: "Secure by Default",
                    desc: "JWT auth, Google OAuth, and two-factor authentication",
                    color: "from-green-500 to-emerald-500",
                  },
                ].map((feature, i) => (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    transition={{ duration: 0.5, delay: 0.7 + i * 0.1, ease: "easeOut" }}
                    className="glass rounded-2xl p-5 hover-glow cursor-default"
                  >
                    <div
                      className={`w-10 h-10 rounded-xl bg-gradient-to-r ${feature.color} flex items-center justify-center text-white mb-3`}
                    >
                      {feature.icon}
                    </div>
                    <h3 className="font-semibold text-foreground mb-1">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.desc}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
