"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, Heart, Scale, ShoppingCart, Truck, BadgeCheck, Check } from "lucide-react";
import { useMarketplace } from "./MarketplaceProvider";
import StarRating from "./StarRating";
import PriceTag from "./PriceTag";
import { getItemImages, getPrimaryImage, formatNumber, getTypeLabel, getTypeColor } from "./format";
import { cn } from "@/lib/utils";
import type { MarketplaceItem } from "./types";

interface ProductCardProps {
  item: MarketplaceItem;
  onQuickView?: (item: MarketplaceItem) => void;
}

export default function ProductCard({ item, onQuickView }: ProductCardProps) {
  const { addToCart, isInCart, toggleWishlist, isWishlisted, toggleCompare, isCompared } = useMarketplace();
  const [imageIndex, setImageIndex] = useState(0);
  const [imgError, setImgError] = useState(false);

  const images = getItemImages(item);
  const primary = getPrimaryImage(item);
  const inCart = isInCart(item.id);
  const wished = isWishlisted(item.id);
  const compared = isCompared(item.id);
  const currentImage = images[imageIndex] ?? primary;

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(item);
  };

  const handleToggleCompare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleCompare(item);
  };

  const handleQuickView = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onQuickView?.(item);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!inCart) addToCart(item);
  };

  return (
    <Link
      href={`/dashboard/marketplace/product/${item.id}`}
      className="group relative flex flex-col rounded-2xl border border-border bg-surface/40 backdrop-blur-sm overflow-hidden hover:shadow-xl hover:shadow-primary/10 hover:border-primary/40 hover:-translate-y-0.5 transition-all duration-300"
    >
      <div className="relative aspect-square overflow-hidden bg-muted/40">
        {currentImage && !imgError ? (
          <img
            src={currentImage}
            alt={item.title}
            onError={() => setImgError(true)}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className={cn("w-full h-full bg-gradient-to-br flex items-center justify-center", getTypeColor(item.type))}>
            <span className="text-5xl">{item.type === "SERVICE" ? "🛠️" : item.type === "AI_MODEL" ? "🤖" : "📦"}</span>
          </div>
        )}

        <div className="absolute top-2 left-2 flex flex-col gap-1 items-start">
          {item.isFeatured && (
            <span className="px-1.5 py-0.5 rounded-md bg-gradient-primary text-white text-[10px] font-bold flex items-center gap-1">
              <BadgeCheck className="w-2.5 h-2.5" /> Featured
            </span>
          )}
          <span className="px-1.5 py-0.5 rounded-md bg-black/50 text-white text-[10px] font-medium backdrop-blur-sm">
            {getTypeLabel(item.type)}
          </span>
        </div>

        <div className="absolute top-2 right-2 flex flex-col gap-1.5">
          <button
            onClick={handleToggleWishlist}
            aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
            className={cn(
              "w-9 h-9 rounded-lg flex items-center justify-center backdrop-blur-md transition-all active:scale-95",
              wished ? "bg-red-500 text-white" : "bg-black/40 text-white hover:bg-black/60"
            )}
          >
            <Heart className={cn("w-4 h-4", wished && "fill-current")} />
          </button>
          <button
            onClick={handleQuickView}
            aria-label="Quick view"
            className="w-9 h-9 rounded-lg bg-black/40 text-white flex items-center justify-center backdrop-blur-md hover:bg-black/60 transition-all active:scale-95"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={handleToggleCompare}
            aria-label={compared ? "Remove from compare" : "Add to compare"}
            className={cn(
              "w-9 h-9 rounded-lg flex items-center justify-center backdrop-blur-md transition-all active:scale-95",
              compared ? "bg-primary text-white" : "bg-black/40 text-white hover:bg-black/60"
            )}
          >
            {compared ? <Check className="w-4 h-4" /> : <Scale className="w-4 h-4" />}
          </button>
        </div>

        {images.length > 1 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
            {images.slice(0, 4).map((img, i) => (
              <button
                key={i}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setImageIndex(i);
                  setImgError(false);
                }}
                aria-label={`Image ${i + 1}`}
                className={cn(
                  "w-2 h-2 rounded-full transition-all",
                  i === imageIndex ? "bg-white w-3" : "bg-white/50"
                )}
              />
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col flex-1 p-3">
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mb-1">
          <span className="truncate">{item.category || "General"}</span>
          <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
          <span className="flex items-center gap-0.5 text-green-500 font-medium">
            <Truck className="w-2.5 h-2.5" /> Free Shipping
          </span>
        </div>

        <h3 className="text-sm font-semibold text-foreground leading-snug line-clamp-2 mb-1.5 group-hover:text-primary transition-colors">
          {item.title}
        </h3>

        <div className="flex items-center justify-between mt-auto pt-2">
          <div className="min-w-0">
            <PriceTag price={item.price} currency={item.currency} />
            <div className="flex items-center gap-1 mt-1">
              <StarRating rating={item.rating ?? 0} count={item.reviewCount ?? 0} />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mt-2">
          <span className="text-[10px] text-muted-foreground">
            {formatNumber(item.salesCount ?? 0)} sold · {formatNumber(item.viewCount ?? 0)} views
          </span>
          <button
            onClick={handleAddToCart}
            disabled={inCart}
            aria-label={inCart ? "Added to cart" : "Add to cart"}
            className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center transition-all",
              inCart
                ? "bg-green-500 text-white"
                : "bg-primary/10 text-primary hover:bg-primary hover:text-white"
            )}
          >
            {inCart ? <Check className="w-4 h-4" /> : <ShoppingCart className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </Link>
  );
}
