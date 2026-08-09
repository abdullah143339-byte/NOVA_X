"use client";

import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import SearchPageClient from "./SearchPageClient";

export default function MarketplaceSearchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      }
    >
      <SearchPageClient />
    </Suspense>
  );
}
