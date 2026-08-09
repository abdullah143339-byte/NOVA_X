"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart, ShoppingCart, Trash2 } from "lucide-react";
import Button from "@/components/ui/Button";
import { useMarketplace } from "@/components/marketplace/MarketplaceProvider";
import { getPrimaryImage, formatPrice } from "@/components/marketplace/format";
import type { MarketplaceItem } from "@/components/marketplace/types";

export default function WishlistPage() {
  const router = useRouter();
  const { wishlist, toggleWishlist, addToCart, isInCart, notify } = useMarketplace();

  if (wishlist.length === 0) {
    return (
      <div className="text-center py-20 glass rounded-3xl">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-4">
          <Heart className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-xl font-semibold text-foreground">Your wishlist is empty</h2>
        <p className="text-sm text-muted-foreground mt-2">Save products you love and find them here.</p>
        <Button className="mt-6" onClick={() => router.push("/dashboard/marketplace")}>
          Explore Products
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-foreground">My Wishlist ({wishlist.length})</h1>
        <Button variant="ghost" size="sm" onClick={() => { toggleWishlist(wishlist[0]); }}>
          <Trash2 className="w-3.5 h-3.5" /> Clear All
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        {wishlist.map((item) => (
          <WishlistCard
            key={item.id}
            item={item}
            inCart={isInCart(item.id)}
            onMoveToCart={() => {
              addToCart(item);
              notify(`${item.title} moved to cart`);
            }}
            onRemove={() => toggleWishlist(item)}
          />
        ))}
      </div>
    </div>
  );
}

function WishlistCard({
  item,
  inCart,
  onMoveToCart,
  onRemove,
}: {
  item: MarketplaceItem;
  inCart: boolean;
  onMoveToCart: () => void;
  onRemove: () => void;
}) {
  const img = getPrimaryImage(item);
  return (
    <div className="glass rounded-2xl overflow-hidden flex flex-col group">
      <Link href={`/dashboard/marketplace/product/${item.id}`} className="relative aspect-square bg-muted/40 block">
        {img ? (
          <img src={img} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-violet-500 to-purple-600 text-4xl">📦</div>
        )}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onRemove();
          }}
          aria-label={`Remove ${item.title} from wishlist`}
          className="absolute top-2 right-2 w-8 h-8 rounded-lg bg-black/40 text-white flex items-center justify-center hover:bg-red-500 transition-all"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </Link>
      <div className="p-3 flex flex-col flex-1">
        <Link href={`/dashboard/marketplace/product/${item.id}`} className="text-sm font-semibold text-foreground line-clamp-2 hover:text-primary">
          {item.title}
        </Link>
        <p className="text-sm font-bold text-foreground mt-1.5">{formatPrice(item.price, item.currency)}</p>
        <Button size="sm" className="mt-3" variant={inCart ? "secondary" : "primary"} disabled={inCart} onClick={onMoveToCart}>
          <ShoppingCart className="w-3.5 h-3.5" /> {inCart ? "In Cart" : "Move to Cart"}
        </Button>
      </div>
    </div>
  );
}
