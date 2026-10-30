"use client";

import Link from "next/link";
import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/EmptyState";

/**
 * Shared body for the per-route-group `error.tsx` boundaries. A dependency outage (D1, KV,
 * Clerk) reaches this instead of Next's default crash screen, so a read page fails as one
 * friendly panel and never as a half-rendered layout.
 *
 * Only the error name and digest are logged: an exception from a query can quote row values,
 * and the PII rule keeps addresses out of logs.
 */
export function RouteError({ error }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[app/route-error]", error.name, error.digest ?? "");
  }, [error]);

  return (
    <EmptyState
      action={
        <div className="flex flex-wrap items-center justify-center gap-2">
          {/* `reset()` alone re-renders the boundary without re-running the failed server
              render in this runtime, so the retry asks for the page again. */}
          <Button onClick={() => window.location.reload()} type="button">
            <RotateCcw aria-hidden />
            Try again
          </Button>
          <Button asChild variant="secondary">
            <Link href="/properties">Browse listings</Link>
          </Button>
        </div>
      }
      description="Something went wrong loading this page. Try again in a moment."
      icon={<AlertTriangle aria-hidden className="size-8" />}
      title="This page could not be loaded"
    />
  );
}
