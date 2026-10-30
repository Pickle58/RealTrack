import { describe, expect, it } from "vitest";
import { canWriteListings, parseRole } from "@/lib/auth/roles";
import { formatLotSize, formatPrice } from "@/lib/format";
import { propertyDetailKey, propertyListKey, sha256Hex } from "@/lib/kv";

describe("formatPrice", () => {
  it("formats whole dollars with no cents", () => {
    expect(formatPrice(125_000_000)).toBe("$1,250,000");
    expect(formatPrice(0)).toBe("$0");
    expect(formatPrice(100)).toBe("$1");
  });

  it("rounds a part-dollar amount to the nearest dollar", () => {
    expect(formatPrice(1_250_050)).toBe("$12,501");
    expect(formatPrice(99)).toBe("$1");
    expect(formatPrice(49)).toBe("$0");
  });

  it("keeps a negative amount negative", () => {
    expect(formatPrice(-5_000)).toBe("-$50");
  });

  it("uses the listing's currency for the symbol", () => {
    expect(formatPrice(123_456, "EUR")).toBe("€1,235");
    expect(formatPrice(1_500_000, "GBP")).toBe("£15,000");
  });

  it("falls back to a readable string for a code Intl rejects", () => {
    expect(formatPrice(123_456, "US")).toBe("US 1,235");
  });
});

describe("formatLotSize", () => {
  it("labels square feet with thousands separators and no decimals", () => {
    expect(formatLotSize(10890, "sqft")).toBe("10,890 sq ft");
    expect(formatLotSize(10890.6, "sqft")).toBe("10,891 sq ft");
  });

  it("keeps the decimals an acreage needs", () => {
    expect(formatLotSize(0.25, "acres")).toBe("0.25 ac");
    expect(formatLotSize(12.5, "acres")).toBe("12.5 ac");
  });
});

describe("sha256Hex", () => {
  it("returns the leading hex characters of the SHA-256 digest", async () => {
    expect(await sha256Hex("hello")).toBe("2cf24dba5fb0a30e26e83b2ac5b9e29e");
    expect(await sha256Hex("")).toBe("e3b0c44298fc1c149afbf4c8996fb924");
  });

  it("truncates to the requested length", async () => {
    expect(await sha256Hex("hello", 16)).toBe("2cf24dba5fb0a30e");
    expect(await sha256Hex("hello", 4)).toBe("2cf2");
  });

  it("changes with the input, so two filters never share a key by accident", async () => {
    expect(await sha256Hex("oak")).not.toBe(await sha256Hex("pine"));
    expect(await sha256Hex("oak", 32)).toBe(await sha256Hex("oak", 32));
  });
});

describe("cache key builders", () => {
  it("keeps the list and detail namespaces apart", () => {
    expect(propertyListKey("7", "abc123")).toBe("properties:list:7:abc123");
    expect(propertyDetailKey("25be70cf")).toBe("properties:25be70cf");
  });

  it("gives every list version its own namespace", () => {
    expect(propertyListKey("1", "abc")).not.toBe(propertyListKey("2", "abc"));
  });
});

describe("role resolution", () => {
  it("accepts the three stored roles", () => {
    expect(parseRole("viewer")).toBe("viewer");
    expect(parseRole("agent")).toBe("agent");
    expect(parseRole("admin")).toBe("admin");
  });

  it("defaults a missing role to agent", () => {
    expect(parseRole(undefined)).toBe("agent");
    expect(parseRole(null)).toBe("agent");
    expect(parseRole("")).toBe("agent");
  });

  it("defaults an unknown or mistyped role to agent", () => {
    expect(parseRole("owner")).toBe("agent");
    expect(parseRole("Admin")).toBe("agent");
    expect(parseRole(7)).toBe("agent");
    expect(parseRole({ role: "admin" })).toBe("agent");
    expect(parseRole(["admin"])).toBe("agent");
  });

  it("only lets agents and admins write listings", () => {
    expect(canWriteListings("agent")).toBe(true);
    expect(canWriteListings("admin")).toBe(true);
    expect(canWriteListings("viewer")).toBe(false);
  });
});
