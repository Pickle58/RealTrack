"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NavbarAuth } from "@/components/layout/NavbarAuth";
import { getMockAuthState } from "@/lib/mock-auth";
import { cn } from "@/lib/utils";

export function Navbar() {
  const pathname = usePathname();
  const isSignedIn = getMockAuthState() !== "signed_out";

  const links = [
    { href: "/properties", label: "Browse" },
    ...(isSignedIn ? [{ href: "/dashboard", label: "Dashboard" }] : []),
  ];

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

        <NavbarAuth />
      </div>
    </header>
  );
}
