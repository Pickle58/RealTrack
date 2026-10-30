"use client";

import { useEffect, useState, type ReactNode } from "react";

type ClientOnlyProps = {
  children: ReactNode;
};

/**
 * Defers its children until after hydration.
 *
 * Clerk's widgets (`<SignIn>`, `<SignUp>`, `<UserButton>`) render nothing until
 * clerk-js reports `loaded`, so the server output is empty. If clerk-js loads
 * before React hydrates, the first client render already contains the widget
 * and React reports a hydration mismatch. Gating on a `useEffect` flag makes
 * the server render and the first client render identical.
 */
export function ClientOnly({ children }: ClientOnlyProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return mounted ? children : null;
}
