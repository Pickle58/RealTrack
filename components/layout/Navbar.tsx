"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const links = [{ href: "/properties", label: "Browse" }];

export function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-surface">
      <div className="mx-auto flex h-16 w-full max-w-[1200px] items-center justify-between gap-4 px-4 md:px-6">
        <div className="flex min-w-0 items-center gap-6">
          <Link className="truncate text-base font-semibold text-text-primary" href="/">
            Real Estate Tracker
          </Link>
          <nav aria-label="Main" className="flex items-center gap-4">
            {links.map((link) => {
              const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);

              return (
                <Link
                  className={cn(
                    "text-sm font-medium",
                    isActive ? "text-accent" : "text-text-secondary hover:text-text-primary",
                  )}
                  href={link.href}
                  key={link.href}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button asChild size="sm" variant="secondary">
            <Link href="/sign-in">Sign in</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/sign-up">Sign up</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
