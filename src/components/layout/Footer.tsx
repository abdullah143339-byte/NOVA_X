"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import Logo from "@/components/ui/Logo";

const fade = {
  initial: { opacity: 0, y: 20, filter: "blur(10px)" },
  whileInView: { opacity: 1, y: 0, filter: "blur(0px)" },
  viewport: { once: true },
  transition: { duration: 0.8, ease: "easeOut" as const },
};

const productLinks = [
  { label: "Features", href: "/#features" },
  { label: "AI Assistant", href: "/dashboard/learning/ai-search" },
  { label: "Marketplace", href: "/dashboard/marketplace" },
  { label: "Learning", href: "/dashboard/learning" },
];

const companyLinks = [
  { label: "About", href: "/" },
  { label: "Blog", href: "/" },
  { label: "Careers", href: "/signup" },
  { label: "Contact", href: "/dashboard/messages" },
];

const legalLinks = [
  { label: "Privacy", href: "/dashboard/settings" },
  { label: "Terms", href: "/dashboard/settings" },
  { label: "Security", href: "/dashboard/settings" },
  { label: "Cookies", href: "/dashboard/settings" },
];

const socialLinks = [
  { label: "GitHub", href: "https://github.com/abdullah143339-byte/NOVA_X", external: true },
  { label: "Twitter", href: "/signup", external: false },
  { label: "Discord", href: "/dashboard/communities", external: false },
];

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
              <Logo size={32} />
              <div>
                <span className="text-lg font-bold text-gradient block leading-none">NOVAX</span>
                <span className="text-[10px] text-muted-foreground tracking-wide">Think Beyond Social</span>
              </div>
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
              {productLinks.map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {item.label}
                  </Link>
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
              {companyLinks.map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {item.label}
                  </Link>
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
              {legalLinks.map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {item.label}
                  </Link>
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
            &copy; 2026 NOVAX. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            {socialLinks.map((item) =>
              item.external ? (
                <a
                  key={item.label}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {item.label}
                </a>
              ) : (
                <Link
                  key={item.label}
                  href={item.href}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {item.label}
                </Link>
              )
            )}
          </div>
        </motion.div>
      </div>
    </footer>
  );
}
