"use client";

import { useState } from "react";
import Link from "next/link";
import { X, ShoppingCart, Heart, Check, BadgeCheck, Truck } from "lucide-react";
import Button from "@/components/ui/Button";
import StarRating from "./StarRating";
import PriceTag from "./PriceTag";
import { useMarketplace } from "./MarketplaceProvider";
import { getItemImages, getTypeColor, getTypeLabel } from "./format";
import { cn } from "@/lib/utils";
import type { MarketplaceItem } from "./types";

interface QuickViewModalProps {
  item: MarketplaceItem;
  onClose: () => void;
}

export default function QuickViewModal({ item, onClose }: QuickViewModalProps) {
  const { addToCart, isInCart, toggleWishlist, isWishlisted } = useMarketplace();
  const [imageIndex, setImageIndex] = useState(0);
  const [imgError, setImgError] = useState(false);

  const images = getItemImages(item);
  const inCart = isInCart(item.id);
  const wished = isWishlisted(item.id);
  const currentImage = images[imageIndex];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto no-scrollbar" onClick={(e) => e.stopPropagation()}>
        <div className="glass-strong rounded-2xl border border-border overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <span className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <BadgeCheck className="w-4 h-4 text-primary" /> Quick View
            </span>
            <button onClick={onClose} aria-label="Close quick view" className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-5">
            <div className="relative aspect-square rounded-xl overflow-hidden bg-muted/40">
              {currentImage && !imgError ? (
                <img src={currentImage} alt={item.title} onError={() => setImgError(true)} className="w-full h-full object-cover" />
              ) : (
                <div className={cn("w-full h-full bg-gradient-to-br flex items-center justify-center", getTypeColor(item.type))}>
                  <span className="text-6xl">{item.type === "SERVICE" ? "🛠️" : "📦"}</span>
                </div>
              )}
              {images.length > 1 && (
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                  {images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => { setImageIndex(i); setImgError(false); }}
                      aria-label={`Image ${i + 1}`}
                      className={cn("w-2.5 h-2.5 rounded-full", i === imageIndex ? "bg-white" : "bg-white/50")}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[10px] font-medium text-muted-foreground">{getTypeLabel(item.type)}</span>
                <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
                <span className="text-[10px] font-medium text-primary">{item.category}</span>
              </div>
              <h3 className="text-base font-semibold text-foreground leading-snug">{item.title}</h3>
              <div className="flex items-center gap-2 mt-2">
                <StarRating rating={item.rating ?? 0} count={item.reviewCount ?? 0} />
                <span className="text-xs text-muted-foreground">· {item.salesCount ?? 0} sold</span>
              </div>
              <div className="mt-3">
                <PriceTag price={item.price} currency={item.currency} />
              </div>
              <p className="text-sm text-muted-foreground mt-3 line-clamp-3">{item.description}</p>

              <div className="flex items-center gap-1.5 mt-3 text-xs text-green-500 font-medium">
                <Truck className="w-3.5 h-3.5" /> Free shipping · Express delivery available
              </div>

              <div className="mt-auto pt-4 flex items-center gap-2">
                <Button size="sm" onClick={() => { if (!inCart) addToCart(item); }} disabled={inCart} className="flex-1">
                  {inCart ? <Check className="w-4 h-4" /> : <ShoppingCart className="w-4 h-4" />}
                  {inCart ? "In Cart" : "Add to Cart"}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => toggleWishlist(item)} aria-label="Toggle wishlist">
                  <Heart className={cn("w-4 h-4", wished && "fill-red-500 text-red-500")} />
                </Button>
              </div>

              <Link
                href={`/dashboard/marketplace/product/${item.id}`}
                className="mt-3 text-center text-sm font-medium text-primary hover:underline"
              >
                View Full Details →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
