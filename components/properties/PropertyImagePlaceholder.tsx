import { Home } from "lucide-react";
import { cn } from "@/lib/utils";

export function PropertyImagePlaceholder({ className, alt }: { className?: string; alt?: string }) {
  // A failed image keeps its description: the alt text says what the photo was.
  const description = alt?.trim() ? alt : "No photo available";

  return (
    <div
      className={cn("flex items-center justify-center bg-surface-secondary", className)}
      data-slot="property-image-placeholder"
    >
      <Home aria-hidden className="size-8 text-text-muted" />
      <span className="sr-only">{description}</span>
    </div>
  );
}
