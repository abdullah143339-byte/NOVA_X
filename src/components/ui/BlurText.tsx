"use client";

import { motion } from "framer-motion";
import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

interface BlurTextProps {
  text: string;
  className?: string;
  highlightWords?: string[];
  highlightClassName?: string;
}

export default function BlurText({ text, className, highlightWords = [], highlightClassName = "" }: BlurTextProps) {
  const words = text.split(" ");

  return (
    <h1 className={twMerge("flex flex-wrap justify-center gap-y-[0.1em]", className)}>
      {words.map((word, i) => {
        const isHighlight = highlightWords.includes(word);
        return (
          <motion.span
            key={i}
            initial={{ filter: "blur(10px)", opacity: 0, y: 50 }}
            whileInView={{ filter: "blur(0px)", opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ duration: 0.7, delay: i * 0.1, ease: "easeOut" }}
            className={clsx("inline-block mr-[0.28em]", isHighlight ? highlightClassName : "")}
          >
            {word}
          </motion.span>
        );
      })}
    </h1>
  );
}
