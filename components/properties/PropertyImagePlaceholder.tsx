import { Home } from "lucide-react";
import { cn } from "@/lib/utils";

export function PropertyImagePlaceholder({ className }: { className?: string }) {
  return (
    <div
      className={cn("flex items-center justify-center bg-surface-secondary", className)}
      data-slot="property-image-placeholder"
    >
      <Home aria-hidden className="size-8 text-text-muted" />
      <span className="sr-only">No photo available</span>
    </div>
  );
}
