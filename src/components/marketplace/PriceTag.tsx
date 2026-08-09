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
    <div className={cn("flex items-baseline gap-2", className)}>
      <span className="text-lg font-bold text-foreground">{formatPrice(price, currency)}</span>
      {showDiscount && (
        <>
          {originalPrice !== undefined && (
            <span className="text-xs text-muted-foreground line-through">{formatPrice(originalPrice, currency)}</span>
          )}
          <span className="text-xs font-bold text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded-md">-{discount}%</span>
        </>
      )}
    </div>
  );
}
