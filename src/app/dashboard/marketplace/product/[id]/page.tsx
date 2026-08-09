"use client";

import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import ProductDetailClient from "./ProductDetailClient";

export default function MarketplaceProductPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      }
    >
      <ProductDetailClient />
    </Suspense>
  );
}
