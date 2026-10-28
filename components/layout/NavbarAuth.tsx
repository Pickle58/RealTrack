"use client";

import Link from "next/link";
import { Show, UserButton } from "@clerk/nextjs";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export function NavbarAuth() {
  return (
    <div className="flex shrink-0 items-center gap-2">
      <Show fallback={<SignedOutActions />} when="signed-in">
        <Button asChild size="sm">
          <Link href="/properties/new">
            <Plus aria-hidden />
            <span className="sr-only sm:not-sr-only">Add property</span>
          </Link>
        </Button>
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
