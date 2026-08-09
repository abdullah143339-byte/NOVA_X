import type { MarketplaceItem } from "../types";

export interface SellerStats {
  totalRevenue: number;
  totalViews: number;
  totalSold: number;
  storeRating: number;
}

/** Aggregate sales figures from the seller's own product listings. */
export function computeSellerStats(listings: MarketplaceItem[]): SellerStats {
  const totalRevenue = listings.reduce((sum, i) => sum + i.price * (i.salesCount ?? 0), 0);
  const totalViews = listings.reduce((sum, i) => sum + (i.viewCount ?? 0), 0);
  const totalSold = listings.reduce((sum, i) => sum + (i.salesCount ?? 0), 0);
  const storeRating =
    listings.length === 0 ? 0 : listings.reduce((s, i) => s + (i.rating ?? 0), 0) / listings.length;
  return { totalRevenue, totalViews, totalSold, storeRating };
}

/** Shape of the logged-in seller used by the seller-center pages. */
export interface SellerUser {
  id?: string;
  firstName?: string;
  lastName?: string;
  username?: string;
}
