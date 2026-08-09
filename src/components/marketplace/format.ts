import type { MarketplaceItem } from "./types";

export function getItemImages(item: MarketplaceItem | undefined | null): string[] {
  if (!item?.images) return [];
  const raw = item.images;
  if (Array.isArray(raw)) {
    return raw.filter((x): x is string => typeof x === "string");
  }
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.filter((x): x is string => typeof x === "string");
      return [raw];
    } catch {
      return [raw];
    }
  }
  return [];
}

export function getPrimaryImage(item: MarketplaceItem | undefined | null): string | null {
  const images = getItemImages(item);
  return images[0] ?? null;
}

/** Videos uploaded by the seller (stored in the `files` field as URLs/data URLs). */
export function getItemVideos(item: MarketplaceItem | undefined | null): string[] {
  if (!item?.files) return [];
  const raw = item.files;
  if (Array.isArray(raw)) return raw.filter((x): x is string => typeof x === "string");
  if (typeof raw === "string") return [raw];
  return [];
}

export function getDiscount(item: MarketplaceItem | undefined | null): number {
  if (!item) return 0;
  let hash = 0;
  for (let i = 0; i < item.id.length; i++) {
    hash = (hash * 31 + item.id.charCodeAt(i)) >>> 0;
  }
  return 10 + (hash % 46);
}

export function formatPrice(value: number | undefined | null, _currency = "PKR"): string {
  const amount = Number.isFinite(value) ? Number(value) : 0;
  try {
    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
    }).format(amount);
  } catch {
    return `Rs ${amount.toFixed(2)}`;
  }
}

export function formatNumber(value: number | undefined | null): string {
  const n = Number(value ?? 0);
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return `${n}`;
}

export function formatCountdown(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

export function getTypeLabel(type: string): string {
  const map: Record<string, string> = {
    TEMPLATE: "Template",
    COMPONENT: "Component",
    PLUGIN: "Plugin",
    COURSE: "Course",
    EBOOK: "E-Book",
    CODE_SNIPPET: "Code Snippet",
    AI_MODEL: "AI Model",
    SERVICE: "Service",
    HARDWARE: "Hardware",
    DIGITAL_ART: "Digital Art",
  };
  return map[type] ?? type;
}

export function getTypeColor(type: string): string {
  const map: Record<string, string> = {
    TEMPLATE: "from-violet-500 to-purple-600",
    COMPONENT: "from-blue-500 to-cyan-500",
    PLUGIN: "from-amber-500 to-orange-500",
    COURSE: "from-emerald-500 to-green-600",
    EBOOK: "from-rose-500 to-pink-500",
    CODE_SNIPPET: "from-gray-500 to-slate-600",
    AI_MODEL: "from-fuchsia-500 to-pink-500",
    SERVICE: "from-teal-500 to-cyan-500",
    HARDWARE: "from-zinc-500 to-gray-600",
    DIGITAL_ART: "from-indigo-500 to-violet-500",
  };
  return map[type] ?? "from-primary/20 to-accent/20";
}
