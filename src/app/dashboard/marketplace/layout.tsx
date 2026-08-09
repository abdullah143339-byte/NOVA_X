import { MarketplaceProvider } from "@/components/marketplace/MarketplaceProvider";
import MarketplaceHeader from "@/components/marketplace/MarketplaceHeader";

export default function MarketplaceLayout({ children }: { children: React.ReactNode }) {
  return (
    <MarketplaceProvider>
      <div className="min-h-screen">
        <MarketplaceHeader />
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6">{children}</div>
      </div>
    </MarketplaceProvider>
  );
}
