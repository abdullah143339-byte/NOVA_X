"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShoppingCart,
  Trash2,
  Heart,
  Bookmark,
  Minus,
  Plus,
  ArrowRight,
  Truck,
  X,
  Check,
} from "lucide-react";
import Button from "@/components/ui/Button";
import { useMarketplace } from "@/components/marketplace/MarketplaceProvider";
import { getPrimaryImage, formatPrice } from "@/components/marketplace/format";
import { calcShipping, calcTotals } from "@/components/marketplace/pricing";
import { cn } from "@/lib/utils";

export default function CartPage() {
  const router = useRouter();
  const {
    cart,
    updateQuantity,
    removeFromCart,
    toggleWishlist,
    clearCart,
    cartSubtotal,
    notify,
  } = useMarketplace();

  const shipping = calcShipping(cartSubtotal, "standard");
  const { tax, total } = calcTotals(cartSubtotal, 0, shipping);

  if (cart.length === 0) {
    return (
      <div className="text-center py-20 glass rounded-3xl">
        <div className="w-16 h-16 rounded-2xl bg-gradient-primary/10 flex items-center justify-center mx-auto mb-4">
          <ShoppingCart className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-xl font-semibold text-foreground">Your cart is empty</h2>
        <p className="text-sm text-muted-foreground mt-2">Looks like you haven&apos;t added anything yet.</p>
        <Button className="mt-6" onClick={() => router.push("/dashboard/marketplace")}>
          Start Shopping
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <div className="lg:col-span-2 space-y-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-foreground">Shopping Cart ({cart.length})</h1>
          <Button variant="ghost" size="sm" onClick={() => { clearCart(); notify("Cart cleared", "info"); }}>
            <Trash2 className="w-3.5 h-3.5" /> Clear All
          </Button>
        </div>

        {cart.map((line) => {
          const img = getPrimaryImage(line.item);
          const free = (line.item.stock ?? -1) === -1;
          return (
            <div key={line.item.id} className="glass rounded-2xl p-4 flex gap-4 items-start">
              <Link
                href={`/dashboard/marketplace/product/${line.item.id}`}
                className="w-24 h-24 rounded-xl overflow-hidden bg-muted/40 shrink-0"
              >
                {img ? (
                  <img src={img} alt={line.item.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-violet-500 to-purple-600 text-3xl">📦</div>
                )}
              </Link>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <Link
                      href={`/dashboard/marketplace/product/${line.item.id}`}
                      className="text-sm font-semibold text-foreground hover:text-primary line-clamp-2"
                    >
                      {line.item.title}
                    </Link>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {line.item.category} · {free ? "Free shipping" : "Standard delivery"}
                    </p>
                  </div>
                  <button
                    onClick={() => removeFromCart(line.item.id)}
                    aria-label={`Remove ${line.item.title} from cart`}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-all shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
                  <div className="flex items-center border border-border rounded-xl overflow-hidden">
                    <button
                      onClick={() => updateQuantity(line.item.id, line.quantity - 1)}
                      aria-label="Decrease quantity"
                      className="w-10 h-10 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-10 text-center text-sm font-semibold text-foreground">{line.quantity}</span>
                    <button
                      onClick={() => updateQuantity(line.item.id, line.quantity + 1)}
                      aria-label="Increase quantity"
                      className="w-10 h-10 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="text-right">
                    <p className="text-base font-bold text-foreground">
                      {formatPrice(line.item.price * line.quantity, line.item.currency)}
                    </p>
                    <p className="text-[11px] text-muted-foreground">{formatPrice(line.item.price, line.item.currency)} each</p>
                  </div>
                </div>

                <div className="flex items-center gap-1 mt-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      toggleWishlist(line.item);
                      notify(`${line.item.title} moved to wishlist`, "info");
                    }}
                  >
                    <Heart className="w-3.5 h-3.5" /> Move to Wishlist
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      toggleWishlist(line.item);
                      removeFromCart(line.item.id);
                    }}
                  >
                    <Bookmark className="w-3.5 h-3.5" /> Save for Later
                  </Button>
                </div>
              </div>
            </div>
          );
        })}

        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-4">
          <Truck className="w-4 h-4 text-green-500" />
          {cartSubtotal >= 50 || cartSubtotal === 0
            ? "Free standard shipping applied"
            : `Spend ${formatPrice(50 - cartSubtotal)} more for free shipping`}
        </div>
      </div>

      <div className="space-y-4">
        <div className="glass rounded-2xl p-5">
          <h2 className="text-base font-bold text-foreground mb-4">Order Summary</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium text-foreground">{formatPrice(cartSubtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Shipping</span>
              <span className="font-medium text-foreground">{shipping === 0 ? "Free" : formatPrice(shipping)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Estimated tax</span>
              <span className="font-medium text-foreground">{formatPrice(tax)}</span>
            </div>
            <div className="flex justify-between pt-3 border-t border-border text-base">
              <span className="font-bold text-foreground">Total</span>
              <span className="font-bold text-foreground">{formatPrice(total)}</span>
            </div>
          </div>

          <Button
            size="lg"
            className="w-full mt-5"
            onClick={() => router.push("/dashboard/marketplace/checkout")}
          >
            Proceed to Checkout <ArrowRight className="w-4 h-4" />
          </Button>

          <div className="flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground mt-3">
            <span className="flex items-center gap-1"><Check className="w-3 h-3 text-green-500" /> Secure</span>
            <span className="flex items-center gap-1"><Check className="w-3 h-3 text-green-500" /> Encrypted</span>
            <span className="flex items-center gap-1"><Check className="w-3 h-3 text-green-500" /> Insured</span>
          </div>
        </div>

        <Link
          href="/dashboard/marketplace"
          className="block text-center text-sm text-primary hover:underline"
        >
          ← Continue shopping
        </Link>
      </div>
    </div>
  );
}
