import Link from "next/link";
import { SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/EmptyState";

export default function PropertyNotFound() {
  return (
    <EmptyState
      action={
        <Button asChild>
          <Link href="/properties">Browse active listings</Link>
        </Button>
      }
      description="It may have been sold, taken off the market, or the link may be wrong."
      icon={<SearchX aria-hidden className="size-8" />}
      title="Property not found"
    />
  );
}
