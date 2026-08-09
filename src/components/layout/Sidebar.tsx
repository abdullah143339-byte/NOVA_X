"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/AuthProvider";
import {
  Home,
  User,
  MessageSquare,
  Bell,
  Settings,
  LogOut,
  Sparkles,
  GraduationCap,
  Search,
  Video,
  ShoppingCart,
  Route,
  FolderGit2,
  Shield,
} from "lucide-react";

const bottomItems = [
  { label: "Notifications", href: "/dashboard/notifications", icon: <Bell className="w-5 h-5" /> },
  { label: "Settings", href: "/dashboard/settings", icon: <Settings className="w-5 h-5" /> },
];

const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN"];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  const isAdmin = user && ADMIN_ROLES.includes(user.role || "");

  const navItems = [
    { label: "Feed", href: "/dashboard", icon: <Home className="w-5 h-5" /> },
    { label: "Reels", href: "/dashboard/reels", icon: <Video className="w-5 h-5" /> },
    { label: "Profile", href: "/dashboard/profile", icon: <User className="w-5 h-5" /> },
    { label: "Marketplace", href: "/dashboard/marketplace", icon: <ShoppingCart className="w-5 h-5" /> },
    { label: "Projects", href: "/dashboard/projects", icon: <FolderGit2 className="w-5 h-5" /> },
    { label: "Learning Platform", href: "/dashboard/learning", icon: <GraduationCap className="w-5 h-5" /> },
    { label: "Messages", href: "/dashboard/messages", icon: <MessageSquare className="w-5 h-5" /> },
    ...(isAdmin
      ? [
          { label: "AI Router", href: "/dashboard/ai-router", icon: <Route className="w-5 h-5" /> },
          { label: "Admin Panel", href: "/dashboard/admin", icon: <Shield className="w-5 h-5" /> },
        ]
      : []),
  ];

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/dashboard/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
    }
  };

  return (
    <aside className="hidden lg:flex flex-col w-64 h-screen fixed left-0 top-0 glass-strong border-r border-border z-40">
      <div className="p-5 border-b border-border">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold text-gradient">NOVA AI</span>
        </Link>
        {user && (
          <div className="mt-3 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center text-white text-xs font-bold">
              {user.firstName?.[0]}{user.lastName?.[0] || user.username[0]?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-xs text-muted-foreground truncate">@{user.username}</p>
            </div>
          </div>
        )}
      </div>

      <div className="p-3">
        <form onSubmit={handleSearch} className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search..."
            className="w-full h-9 rounded-xl bg-muted border border-border pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
          />
        </form>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-border space-y-1">
        {bottomItems.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-200"
          >
            {item.icon}
            {item.label}
          </Link>
        ))}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-500/10 transition-all duration-200 w-full text-left"
        >
          <LogOut className="w-5 h-5" />
          Log Out
        </button>
      </div>
    </aside>
  );
}
