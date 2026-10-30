import { beforeEach, describe, expect, it, vi } from "vitest";

const { authMock, getUserMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  getUserMock: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: authMock,
  clerkClient: () => Promise.resolve({ users: { getUser: getUserMock } }),
}));

import { AuthError, getOptionalUser, requireUser } from "@/lib/auth/current-user";
import { getFreshRole, ownerScope } from "@/lib/auth/guards";

function signIn(sessionClaims: unknown): void {
  authMock.mockResolvedValue({ userId: "user_1", sessionClaims });
}

beforeEach(() => {
  authMock.mockReset();
  getUserMock.mockReset();
});

describe("getOptionalUser", () => {
  it("returns null when the request is signed out", async () => {
    authMock.mockResolvedValue({ userId: null, sessionClaims: null });

    expect(await getOptionalUser()).toBeNull();
  });

  it("reads the role out of the session token's public metadata", async () => {
    for (const role of ["viewer", "agent", "admin"] as const) {
      signIn({ metadata: { role } });
      expect(await getOptionalUser()).toEqual({ id: "user_1", role });
    }
  });

  it("defaults to agent when the claim is missing", async () => {
    for (const claims of [null, {}, { metadata: null }, { metadata: {} }]) {
      signIn(claims);
      expect(await getOptionalUser()).toEqual({ id: "user_1", role: "agent" });
    }
  });

  it("defaults to agent when the claim holds an unrecognized value", async () => {
    for (const role of ["owner", "Admin", 7, { name: "admin" }, ["admin"]]) {
      signIn({ metadata: { role } });
      expect(await getOptionalUser()).toEqual({ id: "user_1", role: "agent" });
    }
  });

  it("returns the signed-in id alongside the role", async () => {
    authMock.mockResolvedValue({ userId: "user_admin", sessionClaims: { metadata: { role: "admin" } } });

    expect(await getOptionalUser()).toEqual({ id: "user_admin", role: "admin" });
  });

  it("treats a Clerk outage as signed out, so public pages still render", async () => {
    authMock.mockRejectedValue(new Error("Clerk is unreachable"));

    expect(await getOptionalUser()).toBeNull();
  });
});

describe("requireUser", () => {
  it("throws an AuthError with no personal detail when signed out", async () => {
    authMock.mockResolvedValue({ userId: null, sessionClaims: null });

    const attempt = requireUser();
    await expect(attempt).rejects.toBeInstanceOf(AuthError);
    await expect(attempt).rejects.toThrow("unauthenticated");
  });

  it("returns the caller when signed in", async () => {
    signIn({ metadata: { role: "viewer" } });

    expect(await requireUser()).toEqual({ id: "user_1", role: "viewer" });
  });

  it("fails closed as signed out during a Clerk outage, never as a role", async () => {
    authMock.mockRejectedValue(new Error("Clerk is unreachable"));

    await expect(requireUser()).rejects.toBeInstanceOf(AuthError);
  });
});

describe("getFreshRole", () => {
  it("reads the current role from Clerk instead of the session claim", async () => {
    signIn({ metadata: { role: "viewer" } });
    getUserMock.mockResolvedValue({ publicMetadata: { role: "admin" } });

    expect(await getFreshRole("user_1")).toBe("admin");
    expect(getUserMock).toHaveBeenCalledWith("user_1");
  });

  it("returns viewer when Clerk says so", async () => {
    getUserMock.mockResolvedValue({ publicMetadata: { role: "viewer" } });

    expect(await getFreshRole("user_1")).toBe("viewer");
  });

  it("defaults to agent when the user record has no role", async () => {
    getUserMock.mockResolvedValue({ publicMetadata: {} });

    expect(await getFreshRole("user_1")).toBe("agent");
  });
});

describe("ownerScope", () => {
  it("gives admins every owner's rows", () => {
    expect(ownerScope({ id: "user_1", role: "admin" })).toBeNull();
  });

  it("scopes agents and viewers to their own rows", () => {
    expect(ownerScope({ id: "user_1", role: "agent" })).toBe("user_1");
    expect(ownerScope({ id: "user_1", role: "viewer" })).toBe("user_1");
  });
});
