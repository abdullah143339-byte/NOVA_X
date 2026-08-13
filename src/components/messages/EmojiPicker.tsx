"use client";

import { motion } from "framer-motion";

const EMOJIS = [
  "😀", "😄", "😂", "🤣", "😊", "😍", "😘", "😎", "🤩", "🥳",
  "😢", "😭", "😡", "😱", "🤔", "😴", "🤯", "🥶", "😅", "🙃",
  "👍", "👎", "👏", "🙏", "💪", "🤝", "✌️", "🤞", "👌", "🫶",
  "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "💯", "🔥", "✨",
  "🎉", "🎊", "🚀", "⭐", "💡", "✅", "❌", "❗", "❓", "💬",
];

interface EmojiPickerProps {
  onPick: (emoji: string) => void;
}

export default function EmojiPicker({ onPick }: EmojiPickerProps) {
  return (
    <div className="grid grid-cols-8 sm:grid-cols-10 gap-0.5 p-2 max-h-48 overflow-y-auto no-scrollbar">
      {EMOJIS.map((e) => (
        <motion.button
          key={e}
          whileTap={{ scale: 1.35 }}
          onClick={() => onPick(e)}
          aria-label={`Add ${e}`}
          className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center text-lg transition-colors"
        >
          {e}
        </motion.button>
      ))}
    </div>
  );
}
