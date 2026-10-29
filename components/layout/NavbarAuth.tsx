"use client";

import Link from "next/link";
import { Show, useAuth, UserButton } from "@clerk/nextjs";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { canWriteListings, parseRole } from "@/lib/auth/roles";

export function NavbarAuth() {
  const { isLoaded, isSignedIn, sessionClaims } = useAuth();
  const role = parseRole((sessionClaims as { metadata?: { role?: unknown } } | undefined)?.metadata?.role);
  const canCreate = isLoaded && isSignedIn === true && canWriteListings(role);

  return (
    <div className="flex shrink-0 items-center gap-2">
      <Show fallback={<SignedOutActions />} when="signed-in">
        {canCreate ? (
          <Button asChild size="sm">
            <Link href="/properties/new">
              <Plus aria-hidden />
              <span className="sr-only sm:not-sr-only">Add property</span>
            </Link>
          </Button>
        ) : null}
        <UserButton />
      </Show>
    </div>
  );
}

function SignedOutActions() {
  return (
    <>
      <Button asChild size="sm" variant="secondary">
        <Link href="/sign-in">Sign in</Link>
      </Button>
      <Button asChild size="sm">
        <Link href="/sign-up">Sign up</Link>
      </Button>
    </>
  );
}
