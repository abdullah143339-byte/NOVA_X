"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Search, Loader2, Check, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { ADMIN_ROLES } from "./data";

export function RoleBadge({ role, className }: { role: string; className?: string }) {
  const def = ADMIN_ROLES.find((r) => r.id === role);
  if (!def) {
    const label = role ? role.split("_").map((w) => w[0] + w.slice(1).toLowerCase()).join(" ") : "USER";
    return (
      <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-muted text-muted-foreground", className)}>
        {label}
      </span>
    );
  }
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium",
        className
      )}
      style={{ color: def.color, backgroundColor: `${def.color}18`, border: `1px solid ${def.color}30` }}
    >
      <span className="text-[10px]">{def.emoji}</span>
      {def.name}
    </span>
  );
}

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const tone =
    status === "ACTIVE" || status === "APPROVED" || status === "PUBLISHED" || status === "RESOLVED" || status === "PROCESSED" || status === "DELIVERED" || status === "PAID"
      ? "bg-green-500/10 text-green-600 dark:text-green-400"
      : status === "PENDING" || status === "REVIEWING" || status === "SHIPPED" || status === "FLAGGED" || status === "REJECTED" || status === "SUSPENDED" || status === "HIDDEN" || status === "INACTIVE"
      ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
      : status === "BANNED" || status === "REMOVED" || status === "CANCELLED" || status === "CRITICAL"
      ? "bg-red-500/10 text-red-500"
      : "bg-muted text-muted-foreground";
  return (
    <span className={cn("inline-flex px-2 py-0.5 rounded-md text-[11px] font-medium", tone, className)}>
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}

export function StatCard({
  label,
  value,
  icon,
  color = "from-primary to-muted-foreground",
  delta,
  sublabel,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color?: string;
  delta?: string;
  sublabel?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-5 hover-glow"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-muted-foreground">{label}</span>
        <div className={cn("w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center text-white", color)}>
          {icon}
        </div>
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      {delta && <p className={cn("text-xs mt-1", delta.startsWith("+") ? "text-green-500" : delta.startsWith("-") ? "text-red-500" : "text-muted-foreground")}>{delta}</p>}
      {!delta && sublabel && <p className="text-xs text-muted-foreground mt-1">{sublabel}</p>}
    </motion.div>
  );
}

export function Toggle({
  checked,
  onChange,
  disabled,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
  label?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label || "Toggle"}
      disabled={disabled}
      onClick={onChange}
      className={cn(
        "relative w-10 h-6 rounded-full transition-colors duration-200 shrink-0",
        checked ? "bg-gradient-primary" : "bg-muted",
        disabled && "opacity-40 cursor-not-allowed"
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200",
          checked && "translate-x-4"
        )}
      />
    </button>
  );
}

export function SearchBox({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || "Search..."}
        className="w-full h-10 rounded-xl bg-muted border border-border pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
      />
    </div>
  );
}

export function SectionHeading({
  icon,
  title,
  subtitle,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 flex-wrap">
      <div className="flex items-center gap-3">
        {icon && <div className="w-9 h-9 rounded-xl bg-gradient-primary/10 flex items-center justify-center text-primary">{icon}</div>}
        <div>
          <h3 className="text-base font-bold text-foreground">{title}</h3>
          {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="flex items-center gap-2">{action}</div>}
    </div>
  );
}

export function AdminSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="glass rounded-2xl p-6 space-y-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-12 rounded-xl bg-muted/50 animate-pulse" />
      ))}
    </div>
  );
}

export function LoadingCard({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="glass rounded-2xl p-12 flex flex-col items-center justify-center gap-3">
      <Loader2 className="w-6 h-6 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

export function EmptyRow({ text = "Nothing here yet" }: { text?: string }) {
  return (
    <div className="p-8 text-center text-sm text-muted-foreground">{text}</div>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[90] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            onClick={(e) => e.stopPropagation()}
            className={cn("glass-strong rounded-2xl w-full max-h-[85vh] overflow-y-auto shadow-elevated", wide ? "max-w-3xl" : "max-w-lg")}
          >
            <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-border">
              <h3 className="font-bold text-foreground">{title}</h3>
              <button onClick={onClose} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all" aria-label="Close">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-6 py-5">{children}</div>
            {footer && <div className="px-6 pb-5 flex justify-end gap-2">{footer}</div>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function MatrixCell({ on }: { on: boolean }) {
  return on ? (
    <Check className="w-4 h-4 text-green-500 mx-auto" />
  ) : (
    <Minus className="w-4 h-4 text-muted-foreground/40 mx-auto" />
  );
}

export function downloadTextFile(filename: string, content: string, mime = "text/csv") {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function toCsv(rows: (string | number)[][]): string {
  return rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
}
