"use client";

import { useState } from "react";
import { Ticket, Check, X } from "lucide-react";
import { COUPONS } from "./catalog";
import { useMarketplace } from "./MarketplaceProvider";
import { formatPrice } from "./format";
import { cn } from "@/lib/utils";

export default function CouponBar() {
  const { applyCoupon, removeCoupon, couponCode, cartSubtotal, notify } = useMarketplace();
  const [revealed, setRevealed] = useState(false);

  const handleApply = (code: string) => {
    if (applyCoupon(code)) {
      setRevealed(false);
      notify(`Coupon ${code} applied`);
    } else {
      notify("Invalid coupon code", "error");
    }
  };

  return (
    <div className="rounded-2xl border border-dashed border-primary/40 bg-primary/5 p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
            <Ticket className="w-4 h-4 text-white" />
          </span>
          <div>
            <h3 className="text-sm font-bold text-foreground">Coupons & Vouchers</h3>
            <p className="text-[10px] text-muted-foreground">Tap a coupon to apply it to your next order</p>
          </div>
        </div>
        <button
          onClick={() => setRevealed((v) => !v)}
          className="text-xs font-medium text-primary hover:underline shrink-0"
        >
          {revealed ? "Hide" : "Show All"}
        </button>
      </div>

      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
        {COUPONS.map((coupon) => {
          const isActive = couponCode === coupon.code;
          const minMet = cartSubtotal >= coupon.minSpend;
          return (
            <div
              key={coupon.code}
              className={cn(
                "relative min-w-[180px] rounded-xl border p-3 flex flex-col justify-between transition-all",
                isActive ? "border-primary bg-primary/10" : "border-border bg-surface/50"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-lg">{coupon.emoji}</span>
                <div className="flex flex-col items-end gap-1">
                  {!minMet && coupon.minSpend > 0 && !isActive && (
                    <span className="text-[9px] font-medium text-amber-500 whitespace-nowrap">Min not met</span>
                  )}
                  <button
                    onClick={() => (isActive ? removeCoupon() : handleApply(coupon.code))}
                    aria-label={isActive ? `Remove coupon ${coupon.code}` : `Apply coupon ${coupon.code}`}
                    className={cn(
                      "w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold transition-all",
                      isActive ? "bg-green-500 text-white" : "bg-primary/10 text-primary hover:bg-primary hover:text-white"
                    )}
                  >
                    {isActive ? <X className="w-3 h-3" /> : <Check className="w-3 h-3" />}
                  </button>
                </div>
              </div>
              <div className="mt-2">
                <p className="text-sm font-bold text-foreground">{coupon.code}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{coupon.label}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {coupon.type === "percent"
                    ? `${coupon.value}% off`
                    : `Save ${formatPrice(coupon.value)}`}
                  {coupon.minSpend > 0 ? ` · min ${formatPrice(coupon.minSpend)}` : ""}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
