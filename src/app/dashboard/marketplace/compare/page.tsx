"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Scale, X, ShoppingCart } from "lucide-react";
import Button from "@/components/ui/Button";
import { useMarketplace } from "@/components/marketplace/MarketplaceProvider";
import { getPrimaryImage, formatPrice } from "@/components/marketplace/format";

export default function ComparePage() {
  const router = useRouter();
  const { compare, toggleCompare, clearCompare, addToCart, isInCart, notify } = useMarketplace();

  if (compare.length === 0) {
    return (
      <div className="text-center py-20 glass rounded-3xl">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Scale className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-xl font-semibold text-foreground">Nothing to compare</h2>
        <p className="text-sm text-muted-foreground mt-2">
          Add up to 4 products to compare their specs side by side.
        </p>
        <Button className="mt-6" onClick={() => router.push("/dashboard/marketplace")}>
          Browse Products
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-foreground">Compare Products ({compare.length}/4)</h1>
        <Button variant="ghost" size="sm" onClick={clearCompare}>
          <X className="w-3.5 h-3.5" /> Clear All
        </Button>
      </div>

      <div className="overflow-x-auto no-scrollbar">
        <table className="w-full min-w-[640px] border-separate border-spacing-0">
          <thead>
            <tr>
              <th className="text-left text-xs font-semibold text-muted-foreground p-3 w-32">Product</th>
              {compare.map((item) => (
                <th key={item.id} className="p-3 text-left align-top w-40">
                  <div className="relative">
                    <Link href={`/dashboard/marketplace/product/${item.id}`} className="block rounded-xl overflow-hidden bg-muted/40 aspect-square">
                      {getPrimaryImage(item) ? (
                        <img src={getPrimaryImage(item) ?? undefined} alt={item.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-violet-500 to-purple-600 text-3xl">📦</div>
                      )}
                    </Link>
                    <button
                      onClick={() => toggleCompare(item)}
                      aria-label={`Remove ${item.title} from compare`}
                      className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-all"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              { label: "Title", render: (i: typeof compare[0]) => (
                <Link href={`/dashboard/marketplace/product/${i.id}`} className="text-sm font-semibold text-foreground hover:text-primary line-clamp-2 block">
                  {i.title}
                </Link>
              ) },
              { label: "Category", render: (i: typeof compare[0]) => <span className="text-sm text-muted-foreground">{i.category}</span> },
              { label: "Type", render: (i: typeof compare[0]) => <span className="text-sm text-muted-foreground">{i.type}</span> },
              { label: "Price", render: (i: typeof compare[0]) => <span className="text-base font-bold text-foreground">{formatPrice(i.price, i.currency)}</span> },
              { label: "Rating", render: (i: typeof compare[0]) => <span className="text-sm text-foreground">⭐ {i.rating?.toFixed(1) ?? "0.0"} ({i.reviewCount ?? 0})</span> },
              { label: "Sold", render: (i: typeof compare[0]) => <span className="text-sm text-muted-foreground">{i.salesCount ?? 0} sold</span> },
              { label: "Views", render: (i: typeof compare[0]) => <span className="text-sm text-muted-foreground">{i.viewCount ?? 0} views</span> },
              { label: "Action", render: (i: typeof compare[0]) => {
                const inCart = isInCart(i.id);
                return (
                  <Button
                    size="sm"
                    variant={inCart ? "secondary" : "primary"}
                    disabled={inCart}
                    onClick={() => {
                      addToCart(i);
                      notify(`${i.title} added to cart`);
                    }}
                  >
                    <ShoppingCart className="w-3.5 h-3.5" /> {inCart ? "In Cart" : "Add to Cart"}
                  </Button>
                );
              } },
            ].map((row) => (
              <tr key={row.label}>
                <td className="p-3 border-t border-border text-xs font-semibold text-muted-foreground">{row.label}</td>
                {compare.map((item) => (
                  <td key={item.id} className="p-3 border-t border-border align-top">
                    {row.render(item)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
