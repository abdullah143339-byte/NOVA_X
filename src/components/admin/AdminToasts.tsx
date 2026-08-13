"use client";

import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";
import { useAdmin } from "./AdminProvider";

const ICONS = {
  success: <CheckCircle2 className="w-4 h-4 text-green-500" />,
  error: <XCircle className="w-4 h-4 text-red-500" />,
  info: <Info className="w-4 h-4 text-primary" />,
};

export default function AdminToasts() {
  const { toasts, dismissToast } = useAdmin();
  return (
    <div className="fixed bottom-20 lg:bottom-5 right-5 z-[100] space-y-2">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20 }}
            className="glass-strong rounded-xl px-4 py-3 flex items-center gap-3 shadow-elevated max-w-sm"
          >
            {ICONS[t.type]}
            <p className="text-sm text-foreground flex-1">{t.message}</p>
            <button onClick={() => dismissToast(t.id)} className="text-muted-foreground hover:text-foreground" aria-label="Dismiss">
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
