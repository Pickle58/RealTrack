"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { canManageProperties, getMockAuthState, MOCK_AUTH_USER_BY_ROLE } from "@/lib/mock-auth";

export function NavbarAuth() {
  const state = getMockAuthState();

  if (state === "signed_out") {
    return (
      <div className="flex shrink-0 items-center gap-2">
        <Button asChild size="sm" variant="secondary">
          <Link href="/sign-in">Sign in</Link>
        </Button>
        <Button asChild size="sm">
          <Link href="/sign-up">Sign up</Link>
        </Button>
      </div>
    );
  }

  const user = MOCK_AUTH_USER_BY_ROLE[state];

  return (
    <div className="flex shrink-0 items-center gap-2">
      {canManageProperties(state) ? (
        <Button asChild size="sm">
          <Link href="/properties/new">
            <Plus aria-hidden />
            <span className="sr-only sm:not-sr-only">Add property</span>
          </Link>
        </Button>
      ) : null}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            aria-label={`Open user menu for ${user.name}`}
            className="rounded-full bg-accent-light text-xs font-medium text-accent hover:bg-accent-light hover:text-accent"
            size="icon-sm"
          >
            {user.initials}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="flex flex-col gap-0.5">
            <span className="text-sm font-medium text-text-primary">{user.name}</span>
            <span className="text-xs font-normal text-text-muted">{user.email}</span>
            <span className="text-xs font-normal text-text-muted">
              Role: {user.roleLabel} (mock)
            </span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/dashboard">Dashboard</Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => {
              toast.success("Sign-out is not connected yet.", {
                description: "Clerk takes over the auth controls in feature 10.",
              });
            }}
          >
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
