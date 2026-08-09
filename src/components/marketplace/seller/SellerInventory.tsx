import Link from "next/link";
import { Loader2, Package, Plus, CheckCircle2 } from "lucide-react";
import Button from "@/components/ui/Button";
import { getPrimaryImage, formatPrice, formatNumber } from "../format";
import type { MarketplaceItem } from "../types";

interface SellerInventoryProps {
  listings: MarketplaceItem[];
  loading: boolean;
  onAddFirst: () => void;
}

/** Inventory tab: the seller's published products. */
export default function SellerInventory({ listings, loading, onAddFirst }: SellerInventoryProps) {
  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (listings.length === 0) {
    return (
      <div className="text-center py-16 glass rounded-2xl">
        <Package className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
        <p className="text-muted-foreground font-medium">You haven&apos;t listed any products.</p>
        <Button className="mt-5" size="sm" onClick={onAddFirst}>
          <Plus className="w-4 h-4" /> Add your first product
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3">
      {listings.map((item) => (
        <div key={item.id} className="glass rounded-2xl p-4 flex items-center gap-4">
          <Link href={`/dashboard/marketplace/product/${item.id}`} className="w-14 h-14 rounded-xl overflow-hidden bg-muted/40 shrink-0">
            {getPrimaryImage(item) ? (
              <img src={getPrimaryImage(item) ?? undefined} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-violet-500 to-purple-600 text-xl">📦</div>
            )}
          </Link>
          <div className="flex-1 min-w-0">
            <Link href={`/dashboard/marketplace/product/${item.id}`} className="text-sm font-semibold text-foreground hover:text-primary line-clamp-1">
              {item.title}
            </Link>
            <p className="text-xs text-muted-foreground mt-0.5">
              {item.category} · {formatPrice(item.price, item.currency)} · {item.salesCount ?? 0} sold
            </p>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="px-2 py-0.5 rounded-md bg-green-500/10 text-green-500 text-[10px] font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Active
              </span>
              <span className="px-2 py-0.5 rounded-md bg-muted text-xs text-muted-foreground">
                {formatNumber(item.viewCount ?? 0)} views
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
