import { auth } from "@clerk/nextjs/server";

export type Role = "viewer" | "agent" | "admin";

export type CurrentUser = { id: string; role: Role };

export class AuthError extends Error {
  constructor() {
    super("unauthenticated");
  }
}

const ROLES = ["viewer", "agent", "admin"] as const;

// Role lives in the session token's public metadata (see context/code-standards.md).
// A missing or unknown role resolves to "agent".
export function parseRole(value: unknown): Role {
  return ROLES.find((candidate) => candidate === value) ?? "agent";
}

export async function getOptionalUser(): Promise<CurrentUser | null> {
  const { userId, sessionClaims } = await auth();
  if (!userId) return null;

  return { id: userId, role: parseRole((sessionClaims?.metadata as { role?: unknown } | undefined)?.role) };
}

/** For Server Actions: throws AuthError when signed out, so the action can return a failure. */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getOptionalUser();
  if (!user) throw new AuthError();
  return user;
}

/** For pages: signed-out visitors are redirected to sign-in and returned here afterwards. */
export async function requirePageUser(): Promise<CurrentUser> {
  await auth.protect();
  return requireUser();
}
