export type MockAuthState = "signed_out" | "viewer" | "agent" | "admin";
export type MockAuthRole = Exclude<MockAuthState, "signed_out">;

export type MockAuthUser = {
  roleLabel: string;
  name: string;
  email: string;
  initials: string;
};

// Dev-only flag: set to "viewer", "agent" or "admin" to review each signed-in
// navbar state. Feature 10 replaces every caller with Clerk and deletes this file.
const MOCK_AUTH_STATE: MockAuthState = "signed_out";

export const MOCK_AUTH_USER_BY_ROLE: Record<MockAuthRole, MockAuthUser> = {
  viewer: {
    roleLabel: "Viewer",
    name: "Vera Lindholm",
    email: "vera.viewer@example.com",
    initials: "VL",
  },
  agent: {
    roleLabel: "Agent",
    name: "Alex Rivera",
    email: "alex.agent@example.com",
    initials: "AR",
  },
  admin: {
    roleLabel: "Admin",
    name: "Avery Chen",
    email: "avery.admin@example.com",
    initials: "AC",
  },
};

export function canManageProperties(state: MockAuthState): boolean {
  return state === "agent" || state === "admin";
}

export function getMockAuthState(): MockAuthState {
  // A production build always resolves to signed_out so the mock can never leak
  // into a deploy, even if the flag above is left on.
  if (process.env.NODE_ENV === "production") return "signed_out";

  return MOCK_AUTH_STATE;
}
