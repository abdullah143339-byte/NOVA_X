import { ShoppingBag } from "lucide-react";
import { formatPrice } from "../format";
import type { Order } from "../types";

interface SellerOrdersProps {
  orders: Order[];
}

/** Orders tab: purchases made from this seller's store. */
export default function SellerOrders({ orders }: SellerOrdersProps) {
  if (orders.length === 0) {
    return (
      <div className="text-center py-16 glass rounded-2xl">
        <ShoppingBag className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
        <p className="text-muted-foreground font-medium">No orders yet.</p>
        <p className="text-sm text-muted-foreground mt-1">Orders from your customers will appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {orders.map((o) => (
        <div key={o.id} className="glass rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">{o.id}</p>
            <span className="text-sm font-bold text-foreground">{formatPrice(o.total, o.currency)}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {o.lines.length} item(s) · {o.status} · {new Date(o.createdAt).toLocaleDateString()}
          </p>
        </div>
      ))}
    </div>
  );
}
