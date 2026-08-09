import { Star } from "lucide-react";

/** Reviews tab: placeholder until purchases start earning ratings. */
export default function SellerReviews() {
  return (
    <div className="glass rounded-2xl p-6 text-center">
      <Star className="w-10 h-10 text-amber-500 mx-auto mb-3" />
      <h2 className="text-lg font-semibold text-foreground">Store Reviews</h2>
      <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
        Customer reviews appear here once your products get purchased and rated.
      </p>
    </div>
  );
}
