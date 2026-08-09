"use client";

import Link from "next/link";
import { Zap, ShoppingCart, Check } from "lucide-react";
import CountdownTimer from "./CountdownTimer";
import { useMarketplace } from "./MarketplaceProvider";
import { getPrimaryImage, getDiscount, formatPrice } from "./format";
import ProductCardSkeleton from "./ProductCardSkeleton";
import { cn } from "@/lib/utils";
import type { MarketplaceItem } from "./types";

interface FlashSaleProps {
  items: MarketplaceItem[];
  loading: boolean;
}

export default function FlashSale({ items, loading }: FlashSaleProps) {
  const { addToCart, isInCart } = useMarketplace();

  return (
    <div className="rounded-2xl sm:rounded-3xl bg-gradient-to-r from-red-600 via-rose-600 to-orange-600 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div className="flex items-center gap-3">
          <span className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center">
            <Zap className="w-6 h-6 text-white" />
          </span>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              Flash Sale <span className="text-xs font-medium bg-white/20 px-2 py-0.5 rounded-full">Limited Time</span>
            </h2>
            <p className="text-xs text-white/80">Hurry! Offers end soon.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-white/80 mr-1 hidden sm:block">Ends in</span>
          <CountdownTimer />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-10 bg-white/10 rounded-2xl">
          <p className="text-sm text-white/80">Flash sale items are being loaded — check back soon!</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {items.map((item) => {
            const img = getPrimaryImage(item);
            const discount = getDiscount(item);
            const inCart = isInCart(item.id);
            const salePrice = Math.round(item.price * (1 - discount / 100) * 100) / 100;
            return (
              <Link
                key={item.id}
                href={`/dashboard/marketplace/product/${item.id}`}
                className="group rounded-xl bg-white/95 overflow-hidden hover:-translate-y-0.5 hover:shadow-xl transition-all flex flex-col"
              >
                <div className="relative aspect-square bg-muted">
                  {img ? (
                    <img src={img} alt={item.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-violet-500 to-purple-600 text-4xl">📦</div>
                  )}
                  <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md bg-red-600 text-white text-[10px] font-bold">-{discount}%</span>
                </div>
                <div className="p-2.5 flex flex-col flex-1">
                  <p className="text-xs font-semibold text-foreground leading-snug line-clamp-2">{item.title}</p>
                  <div className="mt-1.5 flex items-baseline gap-1.5">
                    <span className="text-sm font-bold text-red-600">{formatPrice(salePrice, item.currency)}</span>
                    <span className="text-[10px] text-muted-foreground line-through">{formatPrice(item.price, item.currency)}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (!inCart) addToCart(item);
                    }}
                    disabled={inCart}
                    aria-label={inCart ? "Added to cart" : "Add to cart"}
                    className={cn(
                      "mt-2 w-full h-7 rounded-lg text-xs font-medium flex items-center justify-center gap-1 transition-all",
                      inCart ? "bg-green-500 text-white" : "bg-red-600 text-white hover:bg-red-700"
                    )}
                  >
                    {inCart ? <Check className="w-3 h-3" /> : <ShoppingCart className="w-3 h-3" />}
                    {inCart ? "Added" : "Add"}
                  </button>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
