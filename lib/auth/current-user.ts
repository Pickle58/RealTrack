import { TEMPORARY_OWNER_ID } from "@/services/properties";

export type CurrentUser = { id: string; role: "agent" | "admin" };

// TODO(phase-3): replace with requireUser() from Clerk session claims.
export async function getCurrentUser(): Promise<CurrentUser> {
  return { id: TEMPORARY_OWNER_ID, role: "agent" };
}
