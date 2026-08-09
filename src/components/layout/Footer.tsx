"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

const fade = {
  initial: { opacity: 0, y: 20, filter: "blur(10px)" },
  whileInView: { opacity: 1, y: 0, filter: "blur(0px)" },
  viewport: { once: true },
  transition: { duration: 0.8, ease: "easeOut" as const },
};

export default function Footer() {
  return (
    <footer className="border-t border-border bg-surface/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <motion.div
            {...fade}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="col-span-2 md:col-span-1"
          >
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold text-gradient">NOVA AI</span>
            </div>
            <p className="text-sm text-muted-foreground max-w-xs">
              The future generation of social media — AI-first, voice-first, community-driven.
            </p>
          </motion.div>
          <motion.div
            {...fade}
            transition={{ duration: 0.8, delay: 0.15, ease: "easeOut" }}
          >
            <h3 className="text-sm font-semibold text-foreground mb-3">Product</h3>
            <ul className="space-y-2">
              {["Features", "AI Assistant", "Marketplace", "Learning"].map((item) => (
                <li key={item}>
                  <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>
          <motion.div
            {...fade}
            transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
          >
            <h3 className="text-sm font-semibold text-foreground mb-3">Company</h3>
            <ul className="space-y-2">
              {["About", "Blog", "Careers", "Contact"].map((item) => (
                <li key={item}>
                  <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>
          <motion.div
            {...fade}
            transition={{ duration: 0.8, delay: 0.45, ease: "easeOut" }}
          >
            <h3 className="text-sm font-semibold text-foreground mb-3">Legal</h3>
            <ul className="space-y-2">
              {["Privacy", "Terms", "Security", "Cookies"].map((item) => (
                <li key={item}>
                  <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
        <motion.div
          {...fade}
          transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
          className="mt-8 pt-8 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-4"
        >
          <p className="text-sm text-muted-foreground">
            &copy; 2026 NOVA AI. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            {["GitHub", "Twitter", "Discord"].map((item) => (
              <a
                key={item}
                href="#"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {item}
              </a>
            ))}
          </div>
        </motion.div>
      </div>
    </footer>
  );
}
