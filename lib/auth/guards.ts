import { clerkClient } from "@clerk/nextjs/server";
import { type CurrentUser, parseRole, type Role } from "@/lib/auth/current-user";

/** Only agents and admins may create or change listings. Viewers are read-only. */
export function canWriteListings(role: Role): boolean {
  return role === "agent" || role === "admin";
}

/** Owner filter for listing queries and writes: admins act on every owner's rows (null). */
export function ownerScope(user: Pick<CurrentUser, "id" | "role">): string | null {
  return user.role === "admin" ? null : user.id;
}

/** Re-reads the role from Clerk instead of the session claim, which can lag after a change. */
export async function getFreshRole(userId: string): Promise<Role> {
  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  return parseRole(user.publicMetadata.role);
}
