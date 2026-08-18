"use client";

import { Fragment, type ReactNode } from "react";
import { cn } from "@/lib/utils";

function renderInline(text: string): ReactNode[] {
  const parts = text.split(
    /(`[^`]+`|\*\*[^*\n]+\*\*|__[^_\n]+__|\*[^*\n]+\*|\[[^\]]+\]\([^)\s]+\))/g
  );
  return parts.map((part, i) => {
    if (!part) return null;
    if (part.startsWith("`") && part.endsWith("`") && part.length > 1) {
      return (
        <code key={i} className="rounded-md border border-white/10 bg-[#0f1115] px-1.5 py-0.5 text-[12px] font-mono text-white/90">
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("__") && part.endsWith("__") && part.length > 4) {
      return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
      return <em key={i} className="italic">{part.slice(1, -1)}</em>;
    }
    const link = part.match(/^\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)$/);
    if (link) {
      return (
        <a key={i} href={link[2]} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2 break-all">
          {link[1]}
        </a>
      );
    }
    return <Fragment key={i}>{part}</Fragment>;
  });
}

function parseRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((c) => c.trim());
}

function renderBlocks(content: string): ReactNode[] {
  const blocks: ReactNode[] = [];
  const chunks = content.split(/(```[\s\S]*?```)/g);
  let key = 0;
  let pending = "";

  const flush = () => {
    if (!pending.trim()) {
      pending = "";
      return;
    }
    blocks.push(
      <p key={key++} className="text-sm leading-relaxed whitespace-pre-wrap">
        {renderInline(pending.trim())}
      </p>
    );
    pending = "";
  };

  chunks.forEach((chunk) => {
    if (chunk.startsWith("```")) {
      flush();
      const firstNewline = chunk.indexOf("\n");
      const lang = firstNewline === -1 ? "" : chunk.slice(3, firstNewline).trim();
      const code = firstNewline === -1 ? chunk.slice(3, -3).trim() : chunk.slice(firstNewline + 1, -3).replace(/\n$/, "");
      blocks.push(
        <pre key={key++} className="my-2 overflow-x-auto rounded-xl border border-white/10 bg-[#0f1115] p-3 text-[12px] leading-relaxed font-mono text-white/90">
          {code}
        </pre>
      );
      return;
    }

    const lines = chunk.split("\n");
    let i = 0;
    while (i < lines.length) {
      const line = lines[i];
      const trimmed = line.trim();

      if (!trimmed) {
        flush();
        i++;
        continue;
      }

      const heading = trimmed.match(/^(#{1,4})\s+(.*)$/);
      if (heading) {
        flush();
        blocks.push(
          <h4 key={key++} className="text-[15px] font-semibold my-2 first:mt-0">
            {renderInline(heading[2])}
          </h4>
        );
        i++;
        continue;
      }

      if (/^([-*_=]{3,})\s*$/.test(trimmed) && trimmed.length <= 12) {
        flush();
        blocks.push(<div key={key++} className="my-2 border-t border-border/60" />);
        i++;
        continue;
      }

      const tableSep = /^\s*\|?[\s:|-]*-\s[\s:|-]*\|?\s*$/;
      if (trimmed.includes("|") && i + 1 < lines.length && tableSep.test(lines[i + 1])) {
        flush();
        const rows: string[][] = [parseRow(trimmed)];
        i += 2;
        while (i < lines.length && lines[i].trim().includes("|")) {
          rows.push(parseRow(lines[i]));
          i++;
        }
        const head = rows[0];
        const body = rows.slice(1);
        blocks.push(
          <div key={key++} className="my-2 overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr>
                  {head.map((h, hi) => (
                    <th key={hi} className="border border-border bg-muted/60 px-2 py-1.5 text-left font-semibold">
                      {renderInline(h)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {body.map((r, ri) => (
                  <tr key={ri}>
                    {r.map((c, ci) => (
                      <td key={ci} className="border border-border px-2 py-1.5">
                        {renderInline(c)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        continue;
      }

      const ol = trimmed.match(/^\d+[.)]\s+(.*)$/);
      if (ol) {
        flush();
        const items: ReactNode[] = [];
        while (i < lines.length) {
          const m = lines[i].trim().match(/^\d+[.)]\s+(.*)$/);
          if (!m) break;
          items.push(<li key={key++} className="text-sm leading-relaxed">{renderInline(m[1])}</li>);
          i++;
        }
        blocks.push(<ol key={key++} className="my-1.5 list-decimal space-y-1 pl-4">{items}</ol>);
        continue;
      }

      const ul = trimmed.match(/^[-*+]\s+(.*)$/);
      if (ul) {
        flush();
        const items: ReactNode[] = [];
        while (i < lines.length) {
          const m = lines[i].trim().match(/^[-*+]\s+(.*)$/);
          if (!m) break;
          items.push(<li key={key++} className="text-sm leading-relaxed">{renderInline(m[1])}</li>);
          i++;
        }
        blocks.push(<ul key={key++} className="my-1.5 list-disc space-y-1 pl-4">{items}</ul>);
        continue;
      }

      pending += (pending ? "\n" : "") + line;
      i++;
    }
  });

  flush();
  return blocks;
}

export default function Markdown({ content, className }: { content: string; className?: string }) {
  return <div className={cn("min-w-0 break-words", className)}>{renderBlocks(content)}</div>;
}
