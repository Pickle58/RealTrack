export type Role = "viewer" | "agent" | "admin";

const ROLES = ["viewer", "agent", "admin"] as const;

// Role lives in the session token's public metadata (see context/code-standards.md).
// A missing or unknown role resolves to "agent".
export function parseRole(value: unknown): Role {
  return ROLES.find((candidate) => candidate === value) ?? "agent";
}

/** Only agents and admins may create or change listings. Viewers are read-only. */
export function canWriteListings(role: Role): boolean {
  return role === "agent" || role === "admin";
}
