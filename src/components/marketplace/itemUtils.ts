import type { MarketplaceItem } from "./types";

/**
 * Normalise the response from the marketplace API into an item array.
 * The backend may return the list directly or wrapped in { items } / { data }.
 */
export function extractItems(raw: unknown): MarketplaceItem[] {
  if (Array.isArray(raw)) return raw as MarketplaceItem[];
  if (raw && typeof raw === "object") {
    const obj = raw as { items?: unknown; data?: unknown };
    if (Array.isArray(obj.items)) return obj.items as MarketplaceItem[];
    if (Array.isArray(obj.data)) return obj.data as MarketplaceItem[];
  }
  return [];
}
