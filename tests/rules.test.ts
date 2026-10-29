import { describe, expect, it } from "vitest";
import { discountLabel, discountScore } from "@/lib/discount";
import { assertRadiusKm, maxSearchRadiusKm, validateNearbyQuery } from "@/lib/geo";
import { availabilityOf, isWithinSchedule } from "@/lib/offer-validity";
import { sanitizeMetadata } from "@/lib/sanitize";
import { escapeRegex, slugify } from "@/lib/slug";
import { zonedTimeToUtc } from "@/lib/time";
import { canSignInToPortal, redirectAfterLogin, safeCustomerNextPath } from "@/lib/authz";
import { registerSchema, userStatusSchema } from "@/validators";

describe("time zones", () => {
  it("converts the start of a Kolkata day to UTC", () => {
    expect(zonedTimeToUtc("2026-01-15T00:00:00", "Asia/Kolkata").toISOString()).toBe("2026-01-14T18:30:00.000Z");
  });
});

describe("offer validity", () => {
  const now = new Date("2026-06-15T08:00:00.000Z");
  const base = {
    status: "published" as const,
    validFrom: "2026-06-01T00:00:00.000Z",
    validUntil: "2026-06-30T00:00:00.000Z",
    timezone: "Asia/Kolkata",
    activeDays: ["monday"] as ["monday"],
  };

  it("marks published offers outside the date window as expired", () => {
    expect(availabilityOf({ ...base, validUntil: "2026-06-14T00:00:00.000Z" }, now)).toBe("expired");
  });

  it("keeps a draft out of the public schedule", () => {
    expect(isWithinSchedule({ ...base, status: "draft" }, now)).toBe(false);
  });

  it("accepts an overnight time window", () => {
    const evening = new Date("2026-06-15T18:00:00.000Z");
    expect(isWithinSchedule({ ...base, activeDays: [], startTime: "22:00", endTime: "02:00" }, evening)).toBe(true);
  });
});

describe("nearby search limits", () => {
  it("caps the radius at 100 kilometres", () => {
    process.env.MAX_SEARCH_RADIUS_KM = "250";
    expect(maxSearchRadiusKm()).toBe(100);
    expect(assertRadiusKm(180)).toBe(100);
    expect(validateNearbyQuery({ lat: "12.97", lng: "77.64", radiusKm: "5" }).radiusKm).toBe(5);
  });
});

describe("authorization helpers", () => {
  it("keeps each role in its own portal", () => {
    expect(canSignInToPortal("owner", "owner")).toBe(true);
    expect(canSignInToPortal("customer", "super_admin")).toBe(false);
    expect(redirectAfterLogin("owner")).toBe("/owner/dashboard");
    expect(redirectAfterLogin("super_admin")).toBe("/super-admin/dashboard");
    expect(redirectAfterLogin("customer", "/offers/lunch")).toBe("/offers/lunch");
  });

  it("rejects customer redirects into private areas", () => {
    expect(safeCustomerNextPath("/owner/dashboard", "/")).toBe("/");
    expect(safeCustomerNextPath("//evil.example", "/")).toBe("/");
    expect(safeCustomerNextPath("/favorites", "/")).toBe("/favorites");
  });
});

describe("registration validation", () => {
  it("rejects a super admin account type", () => {
    const result = registerSchema.safeParse({
      name: "Ada Lovelace",
      email: "ada@example.com",
      password: "CorrectHorse1",
      accountType: "super_admin",
    });
    expect(result.success).toBe(false);
  });

  it("does not accept a role when enabling an account", () => {
    const parsed = userStatusSchema.parse({ isActive: false, role: "super_admin" });
    expect(parsed).toEqual({ isActive: false });
  });
});

describe("public text helpers", () => {
  it("builds stable slugs and escapes search text", () => {
    expect(slugify("Bengaluru East")).toBe("bengaluru-east");
    expect(escapeRegex("a+b")).toBe("a\\+b");
  });

  it("labels discounts without inventing a price", () => {
    expect(discountLabel({ offerType: "percentage", discountValue: 20 })).toBe("20% off");
    expect(discountLabel({ offerType: "special" })).toBe("Special offer");
    expect(discountScore({ offerType: "bogo" })).toBe(50);
  });

  it("drops secrets from activity metadata", () => {
    expect(sanitizeMetadata({ status: "published", password: "hidden", token: "abc" })).toEqual({ status: "published" });
  });
});
