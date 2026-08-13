import { Package, DollarSign, TrendingUp, Eye } from "lucide-react";
import { formatPrice, formatNumber } from "../format";
import { cn } from "@/lib/utils";
import type { SellerStats } from "./stats";
import type { MarketplaceItem } from "../types";

interface SellerStatsProps {
  stats: SellerStats;
  listings: MarketplaceItem[];
}

const STAT_CARDS = [
  { key: "count", label: "Active Products", icon: Package, color: "text-primary" },
  { key: "revenue", label: "Total Revenue", icon: DollarSign, color: "text-green-500" },
  { key: "sold", label: "Total Sold", icon: TrendingUp, color: "text-blue-500" },
  { key: "views", label: "Total Views", icon: Eye, color: "text-amber-500" },
] as const;

/** Dashboard tab: headline numbers plus performance progress bars. */
export default function SellerStats({ stats, listings }: SellerStatsProps) {
  const { totalRevenue, totalViews, totalSold, storeRating } = stats;

  const statValues = [
    { label: "Active Products", value: String(listings.length) },
    { label: "Total Revenue", value: formatPrice(totalRevenue) },
    { label: "Total Sold", value: formatNumber(totalSold) },
    { label: "Total Views", value: formatNumber(totalViews) },
  ];

  const metrics = [
    { label: "Avg. Rating", value: storeRating > 0 ? `${storeRating.toFixed(1)} / 5` : "No ratings yet", pct: storeRating > 0 ? storeRating / 5 : 0 },
    {
      label: "Sell Through Rate",
      value: listings.length ? `${Math.round((totalSold / Math.max(listings.length, 1)) * 10)}%` : "0%",
      pct: listings.length ? totalSold / Math.max(listings.length * 10, 1) : 0,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {STAT_CARDS.map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="glass rounded-2xl p-4">
              <Icon className={cn("w-5 h-5 mb-2", card.color)} />
              <p className="text-lg font-bold text-foreground">{statValues[i].value}</p>
              <p className="text-xs text-muted-foreground">{card.label}</p>
            </div>
          );
        })}
      </div>

      <div className="glass rounded-2xl p-5">
        <h2 className="text-base font-bold text-foreground mb-4">Performance Metrics</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {metrics.map((m) => (
            <div key={m.label} className="rounded-xl bg-muted/40 p-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-muted-foreground">{m.label}</span>
                <span className="font-semibold text-foreground">{m.value}</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full bg-gradient-primary" style={{ width: `${Math.min(100, m.pct * 100)}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
