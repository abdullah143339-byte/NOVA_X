"use client";

import { useCallback, useEffect, useState } from "react";
import api from "@/lib/api";
import ProductCard from "@/components/marketplace/ProductCard";
import ProductCardSkeleton from "@/components/marketplace/ProductCardSkeleton";
import QuickViewModal from "@/components/marketplace/QuickViewModal";
import { extractItems } from "@/components/marketplace/itemUtils";
import type { MarketplaceItem } from "@/components/marketplace/types";

interface MarketplacePagePayload {
  items?: unknown;
  data?: unknown;
  total?: number;
  totalPages?: number;
}

const MAX_PAGES = 10;

export default function MarketplaceHomePage() {
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [quickItem, setQuickItem] = useState<MarketplaceItem | null>(null);

  // "For You" feed: fetch every page so all products show up in one list.
  const load = useCallback(async () => {
    try {
      const first = await api.getMarketplaceItems(1);
      let all = extractItems(first.data);
      const payload = first.data as MarketplacePagePayload;
      const totalPages = Math.min(payload.totalPages ?? 1, MAX_PAGES);
      for (let page = 2; page <= totalPages; page++) {
        const res = await api.getMarketplaceItems(page);
        all = all.concat(extractItems(res.data));
      }
      setItems(all);
    } catch {
      setItems([]);
    }
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-foreground">For You</h1>
        <p className="text-sm text-muted-foreground">All products, all in one place.</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 glass rounded-2xl">
          <p className="text-sm text-muted-foreground">No products yet. Check back soon.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {items.map((item) => (
            <ProductCard key={item.id} item={item} onQuickView={setQuickItem} />
          ))}
        </div>
      )}

      {quickItem && <QuickViewModal item={quickItem} onClose={() => setQuickItem(null)} />}
    </div>
  );
}
