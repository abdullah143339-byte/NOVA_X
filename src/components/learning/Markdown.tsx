"use client";

import { Fragment, type ReactNode } from "react";
import { cn } from "@/lib/utils";

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function inline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern =
    /(`[^`]+`)|(\$[^$]+\$)|(\*\*[^*]+\*\*)|(~~[^~]+~~)|(\*[^*]+\*)|(!\[([^\]]*)\]\(([^)\s]+)\))|(\[([^\]]+)\]\(([^)\s]+)\))/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = pattern.exec(text))) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    const [full, code, math, bold, strike, italic, , alt, imgSrc, , linkText, linkHref] = m;
    if (code) {
      nodes.push(
        <code
          key={`${keyPrefix}-${i++}`}
          className="px-1.5 py-0.5 rounded-md bg-muted text-primary font-mono text-[0.85em]"
        >
          {code.slice(1, -1)}
        </code>
      );
    } else if (math) {
      nodes.push(
        <span key={`${keyPrefix}-${i++}`} className="font-serif italic text-accent whitespace-nowrap">
          {math.slice(1, -1)}
        </span>
      );
    } else if (bold) {
      nodes.push(
        <strong key={`${keyPrefix}-${i++}`} className="font-semibold text-foreground">
          {inline(bold.slice(2, -2), `${keyPrefix}-b${i}`)}
        </strong>
      );
    } else if (strike) {
      nodes.push(
        <del key={`${keyPrefix}-${i++}`} className="text-muted-foreground">
          {inline(strike.slice(2, -2), `${keyPrefix}-s${i}`)}
        </del>
      );
    } else if (italic) {
      nodes.push(
        <em key={`${keyPrefix}-${i++}`}>{inline(italic.slice(1, -1), `${keyPrefix}-i${i}`)}</em>
      );
    } else if (imgSrc) {
      nodes.push(
        <img
          key={`${keyPrefix}-${i++}`}
          src={imgSrc}
          alt={alt || "note image"}
          className="max-h-72 rounded-xl border border-border my-1"
          loading="lazy"
        />
      );
    } else if (linkHref) {
      const href = /^https?:\/\//.test(linkHref) ? linkHref : "#";
      nodes.push(
        <a
          key={`${keyPrefix}-${i++}`}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          {inline(linkText, `${keyPrefix}-l${i}`)}
        </a>
      );
    } else {
      nodes.push(full);
    }
    last = m.index + full.length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

type Block =
  | { type: "h"; level: number; text: string }
  | { type: "p"; text: string }
  | { type: "code"; lang: string; code: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "quote"; text: string }
  | { type: "hr" }
  | { type: "table"; head: string[]; rows: string[][] }
  | { type: "math"; formula: string };

function parse(lines: string[]): Block[] {
  const blocks: Block[] = [];
  let i = 0;
  const push = (b: Block | null) => {
    if (b) blocks.push(b);
  };

  while (i < lines.length) {
    const line = lines[i];

    if (/^\s*```/.test(line)) {
      const lang = line.replace(/^\s*```\s*/, "").trim();
      const code: string[] = [];
      i++;
      while (i < lines.length && !/^\s*```\s*$/.test(lines[i])) {
        code.push(lines[i]);
        i++;
      }
      i++;
      push({ type: "code", lang, code: code.join("\n") });
      continue;
    }

    const mathBlock = line.match(/^\s*\$\$(.*)\$\$\s*$/);
    if (mathBlock) {
      push({ type: "math", formula: mathBlock[1].trim() });
      i++;
      continue;
    }

    const head = line.match(/^(#{1,6})\s+(.*)$/);
    if (head) {
      push({ type: "h", level: head[1].length, text: head[2].trim() });
      i++;
      continue;
    }

    if (/^\s*([-*_])\s*\1\s*\1\s*$/.test(line) && /^\s*([-*_])\1{2,}\s*$/.test(line.trim())) {
      push({ type: "hr" });
      i++;
      continue;
    }

    if (/^\s*>\s?/.test(line)) {
      const quote: string[] = [];
      while (i < lines.length && /^\s*>\s?/.test(lines[i])) {
        quote.push(lines[i].replace(/^\s*>\s?/, ""));
        i++;
      }
      push({ type: "quote", text: quote.join(" ") });
      continue;
    }

    if (/^\s*[-*+]\s+/.test(line) || /^\s*\d+[.)]\s+/.test(line)) {
      const ordered = /^\s*\d+[.)]\s+/.test(line);
      const items: string[] = [];
      while (i < lines.length) {
        const li = ordered
          ? lines[i].match(/^\s*\d+[.)]\s+(.*)$/)
          : lines[i].match(/^\s*[-*+]\s+(.*)$/);
        if (li) {
          items.push(li[1].trim());
          i++;
        } else if (/^\s+[-*+]\s+/.test(lines[i])) {
          items.push(lines[i].trim().replace(/^[-*+]\s+/, ""));
          i++;
        } else {
          break;
        }
      }
      push({ type: ordered ? "ol" : "ul", items });
      continue;
    }

    if (/^\s*\|/.test(line) && lines[i + 1] && /^\s*\|[\s:-|]+\|\s*$/.test(lines[i + 1])) {
      const head = line.split("|").slice(1, -1).map((c) => c.trim());
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && /^\s*\|/.test(lines[i])) {
        rows.push(lines[i].split("|").slice(1, -1).map((c) => c.trim()));
        i++;
      }
      push({ type: "table", head, rows });
      continue;
    }

    if (line.trim() === "") {
      i++;
      continue;
    }

    const para: string[] = [line.trim()];
    i++;
    while (i < lines.length && lines[i].trim() !== "" && !/^\s*```/.test(lines[i])) {
      para.push(lines[i].trim());
      i++;
    }
    push({ type: "p", text: para.join(" ") });
  }
  return blocks;
}

function MathBlock({ formula }: { formula: string }) {
  return (
    <div className="my-3 px-4 py-3 rounded-xl bg-accent/8 border border-accent/20 text-center overflow-x-auto">
      <span className="font-serif italic text-accent text-base">{formula}</span>
    </div>
  );
}

export function MarkdownPreview({ content, className }: { content: string; className?: string }) {
  if (!content.trim()) {
    return <p className="text-sm text-muted-foreground italic">Empty note — start writing below.</p>;
  }
  const blocks = parse(content.split("\n"));
  return (
    <div className={cn("prose-like space-y-3 text-sm leading-relaxed", className)}>
      {blocks.map((b, idx) => {
        switch (b.type) {
          case "h":
            return (
              <h2
                key={idx}
                className={
                  cn(
                    "font-bold text-foreground",
                    b.level === 1 && "text-2xl",
                    b.level === 2 && "text-xl",
                    b.level === 3 && "text-lg",
                    b.level >= 4 && "text-base"
                  )
                }
              >
                {inline(b.text, `h${idx}`)}
              </h2>
            );
          case "p":
            return (
              <p key={idx} className="text-foreground/90">
                {inline(b.text, `p${idx}`)}
              </p>
            );
          case "code":
            return (
              <pre
                key={idx}
                className="rounded-xl bg-[#111318] border border-white/10 p-4 overflow-x-auto text-[13px] leading-relaxed"
              >
                <code className="font-mono text-zinc-200">{escapeHtml(b.code)}</code>
              </pre>
            );
          case "ul":
            return (
              <ul key={idx} className="space-y-1.5 pl-5 list-disc text-foreground/90">
                {b.items.map((it, j) => (
                  <li key={j}>{inline(it, `ul${idx}-${j}`)}</li>
                ))}
              </ul>
            );
          case "ol":
            return (
              <ol key={idx} className="space-y-1.5 pl-5 list-decimal text-foreground/90">
                {b.items.map((it, j) => (
                  <li key={j}>{inline(it, `ol${idx}-${j}`)}</li>
                ))}
              </ol>
            );
          case "quote":
            return (
              <blockquote
                key={idx}
                className="border-l-4 border-primary/40 pl-4 py-1 text-foreground/80 italic"
              >
                {inline(b.text, `q${idx}`)}
              </blockquote>
            );
          case "hr":
            return <hr key={idx} className="border-border" />;
          case "table":
            return (
              <div key={idx} className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/60">
                      {b.head.map((h, j) => (
                        <th key={j} className="px-3 py-2 text-left font-semibold text-foreground border-b border-border">
                          {inline(h, `th${idx}-${j}`)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {b.rows.map((row, r) => (
                      <tr key={r} className="border-b border-border last:border-0">
                        {row.map((cell, c) => (
                          <td key={c} className="px-3 py-2 text-foreground/85">
                            {inline(cell, `td${idx}-${r}-${c}`)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          case "math":
            return <MathBlock key={idx} formula={b.formula} />;
          default:
            return <Fragment key={idx} />;
        }
      })}
    </div>
  );
}
