"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Show } from "@clerk/nextjs";
import { NavbarAuth } from "@/components/layout/NavbarAuth";
import { cn } from "@/lib/utils";

export function Navbar() {
  const pathname = usePathname();

  const links = [{ href: "/properties", label: "Browse" }];

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
            <Show when="signed-in">
              <Link
                className={cn(
                  "text-sm font-medium",
                  pathname === "/dashboard" || pathname.startsWith("/dashboard/")
                    ? "text-accent"
                    : "text-text-secondary hover:text-text-primary",
                )}
                href="/dashboard"
              >
                Dashboard
              </Link>
            </Show>
          </nav>
        </div>

        <NavbarAuth />
      </div>
    </header>
  );
}
