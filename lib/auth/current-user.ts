import { auth } from "@clerk/nextjs/server";
import { parseRole, type Role } from "@/lib/auth/roles";

export type CurrentUser = { id: string; role: Role };
export class AuthError extends Error {
  constructor() {
    super("unauthenticated");
  }
}

export async function getOptionalUser(): Promise<CurrentUser | null> {
  const { userId, sessionClaims } = await auth();
  if (!userId) return null;

  return { id: userId, role: parseRole(sessionClaims?.metadata?.role) };
}

/** For Server Actions: throws AuthError when signed out, so the action can return a failure. */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getOptionalUser();
  if (!user) throw new AuthError();
  return user;
}

/**
 * For pages: signed-out visitors are redirected to sign-in and returned to
 * `returnTo` afterwards.
 *
 * `returnTo` is passed to `auth.protect()` as a relative `unauthenticatedUrl`
 * instead of letting Clerk resolve `NEXT_PUBLIC_CLERK_SIGN_IN_URL` against the
 * request origin: in local dev that origin is reported as `https://`, which
 * sends the browser to an https URL the plain-http dev server cannot serve.
 * A relative redirect keeps whatever origin the visitor is already on.
 */
export async function requirePageUser(returnTo: string): Promise<CurrentUser> {
  const user = await getOptionalUser();
  if (user) return user;

  await auth.protect({
    unauthenticatedUrl: `/sign-in?redirect_url=${encodeURIComponent(returnTo)}`,
  });

  // auth.protect() redirects here; this keeps the return type honest.
  return requireUser();
}
