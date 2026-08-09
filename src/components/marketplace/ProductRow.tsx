"use client";

import SectionHeader from "./SectionHeader";
import ProductCard from "./ProductCard";
import ProductCardSkeleton from "./ProductCardSkeleton";
import type { MarketplaceItem } from "./types";

interface ProductRowProps {
  title: string;
  subtitle?: string;
  emoji?: string;
  href?: string;
  items: MarketplaceItem[];
  loading?: boolean;
  limit?: number;
  onQuickView: (item: MarketplaceItem) => void;
}

export default function ProductRow({
  title,
  subtitle,
  emoji,
  href,
  items,
  loading,
  limit = 8,
  onQuickView,
}: ProductRowProps) {
  const visible = items.slice(0, limit);

  return (
    <div>
      <SectionHeader title={title} subtitle={subtitle} emoji={emoji} href={href} />
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {Array.from({ length: limit }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className="text-center py-10 glass rounded-2xl">
          <p className="text-sm text-muted-foreground">No products in this section yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {visible.map((item) => (
            <ProductCard key={item.id} item={item} onQuickView={onQuickView} />
          ))}
        </div>
      )}
    </div>
  );
}
