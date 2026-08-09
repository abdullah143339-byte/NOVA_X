"use client";

import { motion } from "framer-motion";
import BlurText from "@/components/ui/BlurText";
import VideoBackdrop from "@/components/landing/VideoBackdrop";

const stats = [
  { value: "10+", label: "AI Models" },
  { value: "6", label: "Core Pillars" },
  { value: "100%", label: "Encrypted" },
  { value: "24/7", label: "AI Assistant" },
];

export default function Stats() {
  return (
    <section className="py-16 border-y border-border bg-surface/30 relative overflow-hidden">
      <VideoBackdrop
        src="/videos/stats-bg.mp4"
        overlayClassName="bg-black/60"
      />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
              whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: i * 0.1, ease: "easeOut" }}
              className="text-center"
            >
              <div className="text-3xl sm:text-4xl font-bold text-gradient mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
