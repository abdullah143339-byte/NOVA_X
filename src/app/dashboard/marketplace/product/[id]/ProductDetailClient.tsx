"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Heart,
  Scale,
  ShoppingCart,
  Share2,
  Truck,
  ShieldCheck,
  RotateCcw,
  BadgeCheck,
  Store,
  ChevronRight,
  Minus,
  Plus,
  Check,
  Package,
  Star,
  MessageSquare,
} from "lucide-react";
import api from "@/lib/api";
import Button from "@/components/ui/Button";
import StarRating from "@/components/marketplace/StarRating";
import PriceTag from "@/components/marketplace/PriceTag";
import ProductCard from "@/components/marketplace/ProductCard";
import ProductCardSkeleton from "@/components/marketplace/ProductCardSkeleton";
import QuickViewModal from "@/components/marketplace/QuickViewModal";
import { useMarketplace } from "@/components/marketplace/MarketplaceProvider";
import {
  getItemImages,
  getItemVideos,
  getTypeColor,
  getTypeLabel,
  getDiscount,
  formatNumber,
} from "@/components/marketplace/format";
import { OFFICIAL_STORES } from "@/components/marketplace/catalog";
import { cn } from "@/lib/utils";
import type { MarketplaceItem } from "@/components/marketplace/types";

function extractItem(raw: unknown): MarketplaceItem | null {
  if (!raw) return null;
  if (raw && typeof raw === "object" && "id" in raw) return raw as MarketplaceItem;
  return null;
}

function extractItems(raw: unknown): MarketplaceItem[] {
  if (Array.isArray(raw)) return raw as MarketplaceItem[];
  if (raw && typeof raw === "object") {
    const obj = raw as { items?: unknown; data?: unknown };
    if (Array.isArray(obj.items)) return obj.items as MarketplaceItem[];
    if (Array.isArray(obj.data)) return obj.data as MarketplaceItem[];
  }
  return [];
}

interface ReviewSeed {
  author: string;
  rating: number;
  title: string;
  content: string;
  date: string;
  verified: boolean;
}

const REVIEW_SEEDS: ReviewSeed[] = [
  { author: "Ayesha K.", rating: 5, title: "Exceeded expectations", content: "Exactly what I was looking for. Great quality and the seller responded quickly.", date: "2 days ago", verified: true },
  { author: "Bilal R.", rating: 5, title: "Highly recommend", content: "Very professional product. The documentation is thorough and easy to follow.", date: "1 week ago", verified: true },
  { author: "Fatima S.", rating: 4, title: "Really good", content: "Solid product overall. Would love to see a few more examples included.", date: "2 weeks ago", verified: true },
  { author: "Hassan M.", rating: 5, title: "Worth every cent", content: "Saved me hours of work. The quality is top notch.", date: "3 weeks ago", verified: false },
  { author: "Zara A.", rating: 4, title: "Great value", content: "Very good for the price. Customer support was helpful when I had questions.", date: "1 month ago", verified: true },
];

export default function ProductDetailClient() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { addToCart, isInCart, toggleWishlist, isWishlisted, toggleCompare, isCompared, addRecentlyViewed, notify } = useMarketplace();

  const [item, setItem] = useState<MarketplaceItem | null>(null);
  const [related, setRelated] = useState<MarketplaceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [imgError, setImgError] = useState(false);
  const [zoom, setZoom] = useState(false);
  const [quickItem, setQuickItem] = useState<MarketplaceItem | null>(null);

  const load = useCallback(
    (itemId: string) => {
      return Promise.allSettled([api.getMarketplaceItem(itemId), api.getMarketplaceItems(1)])
        .then(([itemRes, relatedRes]) => {
          const itemData = itemRes.status === "fulfilled" ? extractItem(itemRes.value?.data) : null;
          if (!itemData) {
            setNotFound(true);
          } else {
            setItem(itemData);
            addRecentlyViewed(itemData);
          }
          if (relatedRes.status === "fulfilled") {
            const list = extractItems(relatedRes.value?.data).filter((i) => i.id !== itemId);
            setRelated(list.slice(0, 8));
          }
        })
        .catch(() => setNotFound(true));
    },
    [addRecentlyViewed]
  );

  useEffect(() => {
    if (id) load(id).finally(() => setLoading(false));
  }, [id, load]);

  const images = getItemImages(item);
  const videos = getItemVideos(item);
  const wished = isWishlisted(item?.id ?? "");
  const compared = isCompared(item?.id ?? "");
  const inCart = isInCart(item?.id ?? "");
  const discount = getDiscount(item);
  const store = useMemo(() => OFFICIAL_STORES[(item?.id.length ?? 0) % OFFICIAL_STORES.length], [item]);

  const reviews = useMemo(() => {
    if (!item) return [];
    const start = (item.id.charCodeAt(0) + item.id.length) % REVIEW_SEEDS.length;
    return Array.from({ length: 5 }).map((_, i) => REVIEW_SEEDS[(start + i) % REVIEW_SEEDS.length]);
  }, [item]);

  const specs = useMemo(() => {
    if (!item) return [];
    return [
      { label: "Product Type", value: getTypeLabel(item.type) },
      { label: "Category", value: item.category },
      { label: "Sales", value: `${formatNumber(item.salesCount ?? 0)} sold` },
      { label: "Views", value: formatNumber(item.viewCount ?? 0) },
      { label: "Listing ID", value: item.id.slice(0, 8).toUpperCase() },
      { label: "Status", value: item.status ?? "Active" },
    ];
  }, [item]);

  const highlights = useMemo(() => {
    if (!item) return [];
    return [
      "Industry-standard quality with production-ready output",
      "Includes detailed documentation and setup guide",
      "Free lifetime updates for verified purchases",
      "Works across all modern devices and browsers",
    ];
  }, [item]);

  const handleBuyNow = () => {
    if (!item) return;
    if (!inCart) addToCart(item, quantity);
    router.push("/dashboard/marketplace/checkout");
  };

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: item?.title ?? "NOVA Market", url }).catch(() => {});
    } else {
      window.navigator.clipboard?.writeText(url).then(() => notify("Link copied to clipboard", "info")).catch(() => {});
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="aspect-square rounded-2xl bg-muted/60 animate-pulse" />
          <div className="space-y-3">
            <div className="h-6 w-3/4 rounded-full bg-muted/60 animate-pulse" />
            <div className="h-4 w-1/2 rounded-full bg-muted/60 animate-pulse" />
            <div className="h-10 w-40 rounded-xl bg-muted/60 animate-pulse" />
            <div className="h-20 w-full rounded-xl bg-muted/60 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (notFound || !item) {
    return (
      <div className="text-center py-24 glass rounded-3xl">
        <Package className="w-14 h-14 text-muted-foreground/40 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-foreground">Product not found</h2>
        <p className="text-sm text-muted-foreground mt-2">This product may have been removed or is no longer available.</p>
        <Button className="mt-6" onClick={() => router.push("/dashboard/marketplace")}>
          Back to Marketplace
        </Button>
      </div>
    );
  }

  const currentImage = images[imageIndex];

  return (
    <div className="space-y-8">
      <nav className="flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap">
        <Link href="/dashboard/marketplace" className="hover:text-primary">Home</Link>
        <ChevronRight className="w-3 h-3" />
        <Link href="/dashboard/marketplace/search" className="hover:text-primary">{item.category}</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-foreground line-clamp-1">{item.title}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10">
        {/* Gallery */}
        <div>
          <div
            className="relative aspect-square rounded-2xl overflow-hidden bg-muted/40 border border-border cursor-zoom-in"
            onMouseEnter={() => setZoom(true)}
            onMouseLeave={() => setZoom(false)}
          >
            {currentImage && !imgError ? (
              <img
                src={currentImage}
                alt={item.title}
                onError={() => setImgError(true)}
                className={cn("w-full h-full object-cover transition-transform duration-300", zoom && "scale-150")}
              />
            ) : (
              <div className={cn("w-full h-full bg-gradient-to-br flex items-center justify-center", getTypeColor(item.type))}>
                <span className="text-8xl">{item.type === "SERVICE" ? "🛠️" : item.type === "AI_MODEL" ? "🤖" : "📦"}</span>
              </div>
            )}
            {discount > 0 && (
              <span className="absolute top-3 left-3 px-2 py-1 rounded-md bg-red-500 text-white text-xs font-bold">-{discount}% OFF</span>
            )}
          </div>

          {images.length > 1 && (
            <div className="flex gap-2 mt-3 overflow-x-auto no-scrollbar pb-1">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setImageIndex(i);
                    setImgError(false);
                  }}
                  aria-label={`View image ${i + 1}`}
                  className={cn(
                    "w-16 h-16 rounded-xl overflow-hidden border-2 transition-all shrink-0",
                    i === imageIndex ? "border-primary" : "border-border opacity-60 hover:opacity-100"
                  )}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {videos.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-semibold text-foreground mb-2">Product Video</p>
              {videos.map((v, i) => (
                <video
                  key={i}
                  src={v}
                  controls
                  playsInline
                  className="w-full aspect-video rounded-2xl border border-border bg-black"
                />
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[10px] font-bold">{getTypeLabel(item.type)}</span>
            <span className="px-2 py-0.5 rounded-md bg-muted text-muted-foreground text-[10px] font-medium">{item.category}</span>
            {item.status === "ACTIVE" && (
              <span className="px-2 py-0.5 rounded-md bg-green-500/10 text-green-500 text-[10px] font-medium flex items-center gap-1">
                <Check className="w-3 h-3" /> In Stock
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mt-3 leading-tight">{item.title}</h1>

          <div className="flex items-center gap-2 mt-3">
            <StarRating rating={item.rating ?? 0} count={item.reviewCount ?? 0} size="md" />
            <span className="text-xs text-muted-foreground">· {formatNumber(item.salesCount ?? 0)} sold · {formatNumber(item.viewCount ?? 0)} views</span>
          </div>

          <div className="mt-4">
            <PriceTag price={item.price} currency={item.currency} discount={discount} className="[&>span:first-child]:text-3xl" />
          </div>

          <p className="text-sm text-muted-foreground mt-4 leading-relaxed">{item.description}</p>

          <div className="mt-5 grid grid-cols-2 gap-2">
            <div className="flex items-start gap-2 rounded-xl bg-muted/40 p-3">
              <Truck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-foreground">Free Shipping</p>
                <p className="text-[10px] text-muted-foreground">Express delivery available</p>
              </div>
            </div>
            <div className="flex items-start gap-2 rounded-xl bg-muted/40 p-3">
              <ShieldCheck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-foreground">Secure Payment</p>
                <p className="text-[10px] text-muted-foreground">Protected by NOVA Pay</p>
              </div>
            </div>
            <div className="flex items-start gap-2 rounded-xl bg-muted/40 p-3">
              <RotateCcw className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-foreground">7-Day Returns</p>
                <p className="text-[10px] text-muted-foreground">Easy replacement policy</p>
              </div>
            </div>
            <div className="flex items-start gap-2 rounded-xl bg-muted/40 p-3">
              <BadgeCheck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-foreground">Lifetime Updates</p>
                <p className="text-[10px] text-muted-foreground">Free upgrades included</p>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <p className="text-xs font-medium text-foreground mb-2">Quantity</p>
            <div className="flex items-center gap-3">
              <div className="flex items-center border border-border rounded-xl overflow-hidden">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  aria-label="Decrease quantity"
                  className="w-9 h-10 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-10 text-center text-sm font-semibold text-foreground">{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => Math.min(99, q + 1))}
                  aria-label="Increase quantity"
                  className="w-9 h-10 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <span className="text-xs text-muted-foreground">in stock</span>
            </div>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row gap-2.5">
            <Button size="lg" className="flex-1" onClick={() => { if (!inCart) addToCart(item, quantity); }}>
              {inCart ? <Check className="w-4 h-4" /> : <ShoppingCart className="w-4 h-4" />}
              {inCart ? "Added to Cart" : "Add to Cart"}
            </Button>
            <Button size="lg" variant="accent" className="flex-1" onClick={handleBuyNow}>
              Buy Now
            </Button>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => toggleWishlist(item)}>
              <Heart className={cn("w-4 h-4", wished && "fill-red-500 text-red-500")} />
              {wished ? "Saved" : "Wishlist"}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => toggleCompare(item)}>
              <Scale className={cn("w-4 h-4", compared && "text-primary")} />
              {compared ? "In Compare" : "Compare"}
            </Button>
            <Button variant="ghost" size="sm" onClick={handleShare}>
              <Share2 className="w-4 h-4" /> Share
            </Button>
          </div>

          {/* Seller card */}
          <div className="mt-6 p-4 rounded-2xl border border-border bg-surface/40">
            <div className="flex items-center gap-3">
              <div className={cn("w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center text-xl", store.gradient)}>
                {store.emoji}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-foreground flex items-center gap-1.5">
                  <Store className="w-3.5 h-3.5 text-muted-foreground" /> {store.name}
                  {store.verified && <BadgeCheck className="w-3.5 h-3.5 text-primary" />}
                </p>
                <p className="text-[11px] text-muted-foreground">⭐ {store.rating} · {store.followers.toLocaleString()} followers · ~1 hr response</p>
              </div>
            </div>
            {item.contact && (
              <div className="mt-3 flex items-center gap-2 rounded-xl bg-muted/50 px-3 py-2.5">
                <span className="text-base">📞</span>
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Seller Contact</p>
                  <a
                    href={`tel:${item.contact}`}
                    className="text-sm font-semibold text-foreground hover:text-primary transition-colors"
                  >
                    {item.contact}
                  </a>
                </div>
              </div>
            )}
            <div className="mt-3 flex gap-2">
              <Link
                href={`/dashboard/marketplace/messages?seller=${item.sellerId}&item=${item.id}&title=${encodeURIComponent(item.title)}`}
                className="flex-1 inline-flex items-center justify-center gap-1.5 h-10 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-all"
              >
                <MessageSquare className="w-4 h-4" /> Message Seller
              </Link>
              <Link
                href="/dashboard/marketplace/seller"
                className="flex-1 inline-flex items-center justify-center h-10 rounded-xl border border-border text-sm font-medium text-foreground hover:border-primary/40 hover:bg-muted transition-all"
              >
                Visit Store
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Highlights + Specs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass rounded-2xl p-5">
          <h2 className="text-base font-bold text-foreground mb-3">Product Highlights</h2>
          <ul className="space-y-2">
            {highlights.map((h, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" /> {h}
              </li>
            ))}
          </ul>
        </div>
        <div className="glass rounded-2xl p-5">
          <h2 className="text-base font-bold text-foreground mb-3">Specifications</h2>
          <div className="space-y-1.5">
            {specs.map((s) => (
              <div key={s.label} className="flex items-center justify-between gap-4 text-sm py-1 border-b border-border/40 last:border-0">
                <span className="text-muted-foreground">{s.label}</span>
                <span className="font-medium text-foreground text-right">{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Reviews */}
      <div className="glass rounded-2xl p-5 sm:p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" /> Customer Reviews
          </h2>
          <span className="text-sm text-muted-foreground">{(item.reviewCount ?? 0) + 5} total</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reviews.map((r, i) => (
            <div key={i} className="rounded-xl bg-muted/40 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-gradient-primary flex items-center justify-center text-white text-xs font-bold">
                    {r.author[0]}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{r.author}</p>
                    <div className="flex items-center gap-1.5">
                      <StarRating rating={r.rating} showCount={false} />
                      {r.verified && (
                        <span className="text-[9px] font-medium text-green-500 flex items-center gap-0.5">
                          <BadgeCheck className="w-3 h-3" /> Verified Purchase
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <span className="text-[10px] text-muted-foreground">{r.date}</span>
              </div>
              <p className="text-sm font-semibold text-foreground mt-3">{r.title}</p>
              <p className="text-xs text-muted-foreground mt-1">{r.content}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Related */}
      <div>
        <h2 className="text-lg sm:text-xl font-bold text-foreground mb-5">Related Products</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {related.length === 0
            ? Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)
            : related.map((rel) => <ProductCard key={rel.id} item={rel} onQuickView={setQuickItem} />)}
        </div>
      </div>

      {quickItem && <QuickViewModal item={quickItem} onClose={() => setQuickItem(null)} />}
    </div>
  );
}
