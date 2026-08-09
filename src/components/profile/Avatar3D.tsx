"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Camera } from "lucide-react";

interface Avatar3DProps {
  src?: string | null;
  initials: string;
  size?: number;
  accent?: string;
  editable?: boolean;
  onEdit?: () => void;
}

export default function Avatar3D({ src, initials, size = 112, accent = "#6C63FF", editable, onEdit }: Avatar3DProps) {
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rotateX = useSpring(useTransform(my, [-0.5, 0.5], [12, -12]), { stiffness: 200, damping: 20 });
  const rotateY = useSpring(useTransform(mx, [-0.5, 0.5], [-12, 12]), { stiffness: 200, damping: 20 });

  return (
    <motion.div
      className="relative group cursor-pointer"
      style={{ width: size, height: size, perspective: 600 }}
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        mx.set((e.clientX - rect.left) / rect.width - 0.5);
        my.set((e.clientY - rect.top) / rect.height - 0.5);
      }}
      onMouseLeave={() => {
        mx.set(0);
        my.set(0);
      }}
      aria-label="Profile avatar"
    >
      <motion.div
        style={{ rotateX, rotateY, transformStyle: "preserve-3d", width: size, height: size }}
        className="relative"
      >
        <div
          className="w-full h-full rounded-[28px] flex items-center justify-center text-white font-bold overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${accent}, ${accent}88)`,
            boxShadow: `0 18px 40px -12px ${accent}66`,
            fontSize: size * 0.38,
          }}
        >
          {src ? (
            <img src={src} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <span style={{ transform: "translateZ(24px)" }}>{initials}</span>
          )}
        </div>
        {editable && (
          <button
            onClick={onEdit}
            aria-label="Change avatar"
            className="absolute inset-0 w-full h-full rounded-[28px] bg-black/45 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            style={{ transform: "translateZ(30px)" }}
          >
            <Camera className="w-6 h-6 text-white" />
          </button>
        )}
      </motion.div>
    </motion.div>
  );
}
