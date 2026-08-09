"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { useAuth } from "@/providers/AuthProvider";
import {
  Home,
  User,
  MessageSquare,
  Bell,
  Sparkles,
  Video,
  Route,
  Shield,
  ShoppingCart,
  GraduationCap,
} from "lucide-react";

const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN"];

export default function MobileNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const isAdmin = user && ADMIN_ROLES.includes(user.role || "");

  const mobileItems = [
    { label: "Feed", href: "/dashboard", icon: <Home className="w-5 h-5" /> },
    { label: "Market", href: "/dashboard/marketplace", icon: <ShoppingCart className="w-5 h-5" /> },
    { label: "Reels", href: "/dashboard/reels", icon: <Video className="w-5 h-5" /> },
    { label: "Learning", href: "/dashboard/learning", icon: <GraduationCap className="w-5 h-5" /> },
    { label: "Messages", href: "/dashboard/messages", icon: <MessageSquare className="w-5 h-5" /> },
    ...(isAdmin
      ? [
          { label: "AI Router", href: "/dashboard/ai-router", icon: <Route className="w-5 h-5" /> },
          { label: "Admin", href: "/dashboard/admin", icon: <Shield className="w-5 h-5" /> },
        ]
      : []),
    { label: "Profile", href: "/dashboard/profile", icon: <User className="w-5 h-5" /> },
  ];

  return (
    <>
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 glass-strong border-b border-border h-14 flex items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-gradient">NOVA AI</span>
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link href="/dashboard/notifications" className="relative w-9 h-9 rounded-xl glass flex items-center justify-center">
            <Bell className="w-4 h-4" />
            <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-red-500 rounded-full border-2 border-background" />
          </Link>
        </div>
      </header>

      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 glass-strong border-t border-border">
        <div className="flex items-center justify-around h-16">
          {mobileItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium transition-all",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
