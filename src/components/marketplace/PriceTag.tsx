import { formatPrice } from "./format";
import { cn } from "@/lib/utils";

interface PriceTagProps {
  price: number;
  currency?: string;
  originalPrice?: number;
  discount?: number;
  className?: string;
}

export default function PriceTag({ price, currency = "USD", originalPrice, discount, className }: PriceTagProps) {
  const showDiscount = discount && discount > 0;
  return (
    <div className={cn("flex items-baseline gap-1.5 min-w-0 flex-wrap", className)}>
      <span className="text-base sm:text-lg font-bold text-foreground whitespace-nowrap">{formatPrice(price, currency)}</span>
      {showDiscount && (
        <>
          {originalPrice !== undefined && (
            <span className="text-[11px] sm:text-xs text-muted-foreground line-through whitespace-nowrap">{formatPrice(originalPrice, currency)}</span>
          )}
          <span className="text-[10px] sm:text-xs font-bold text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded-md whitespace-nowrap">-{discount}%</span>
        </>
      )}
    </div>
  );
}
