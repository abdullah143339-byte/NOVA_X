"use client";

import { motion } from "framer-motion";
import Button from "@/components/ui/Button";
import BlurText from "@/components/ui/BlurText";
import VideoBackdrop from "@/components/landing/VideoBackdrop";
import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";

export default function CTA() {
  return (
    <section className="py-24 relative overflow-hidden">
      <VideoBackdrop
        src="/videos/cta-bg.mp4"
        overlayClassName="bg-gradient-to-b from-black/70 via-black/60 to-black/80"
      />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[150px]" />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 mb-6">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm text-muted-foreground">Join the Future</span>
          </div>

          <BlurText
            text="Ready to Experience The Future?"
            className="text-4xl sm:text-6xl font-bold mb-6"
            highlightWords={["The", "Future?"]}
            highlightClassName="text-gradient"
          />

          <motion.p
            initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="text-lg text-muted-foreground max-w-xl mx-auto mb-10"
          >
            Join thousands of creators, developers, and learners who are already building
            the future of social media.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link href="/signup">
              <Button size="lg">
                Create Free Account
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="secondary" size="lg">
                See Demo
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
