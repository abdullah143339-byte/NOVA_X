import Button from "@/components/ui/Button";
import { FileText, AlertTriangle } from "lucide-react";

export function EmptyFeed() {
  return (
    <div className="glass rounded-2xl p-10 text-center animate-fade-in">
      <div className="w-16 h-16 rounded-2xl bg-gradient-primary/10 flex items-center justify-center mx-auto mb-4">
        <FileText className="w-8 h-8 text-primary" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-1.5">No posts yet</h3>
      <p className="text-sm text-muted-foreground mb-5 max-w-xs mx-auto">
        Be the first to share something. Create a post above and it will appear right here.
      </p>
    </div>
  );
}

export function ErrorFeed({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="glass rounded-2xl p-10 text-center animate-fade-in" role="alert">
      <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-4">
        <AlertTriangle className="w-8 h-8 text-red-500" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-1.5">Couldn&apos;t load the feed</h3>
      <p className="text-sm text-muted-foreground mb-5 max-w-xs mx-auto">
        Something went wrong while fetching posts. Please try again.
      </p>
      <Button variant="secondary" onClick={onRetry}>Retry</Button>
    </div>
  );
}
