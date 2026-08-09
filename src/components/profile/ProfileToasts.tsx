"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Check, X, Info, AlertTriangle } from "lucide-react";
import { useProfile } from "./ProfileProvider";
import { cn } from "@/lib/utils";

export default function ProfileToasts() {
  const { toasts, dismissToast } = useProfile();

  return (
    <div className="fixed bottom-5 right-5 z-[70] flex flex-col gap-2 w-80 max-w-[calc(100vw-2.5rem)]">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
            className={cn(
              "glass-strong rounded-xl px-4 py-3 flex items-start gap-2.5 text-xs text-foreground shadow-xl",
              toast.type === "error" && "border-red-500/30",
              toast.type === "info" && "border-primary/30"
            )}
            role="status"
          >
            <span className="mt-0.5 shrink-0">
              {toast.type === "success" && <Check className="w-4 h-4 text-emerald-400" />}
              {toast.type === "error" && <AlertTriangle className="w-4 h-4 text-red-400" />}
              {toast.type === "info" && <Info className="w-4 h-4 text-primary" />}
            </span>
            <p className="flex-1 leading-snug">{toast.message}</p>
            <button onClick={() => dismissToast(toast.id)} aria-label="Dismiss" className="p-0.5 rounded-md text-muted-foreground hover:text-foreground transition-colors shrink-0">
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
