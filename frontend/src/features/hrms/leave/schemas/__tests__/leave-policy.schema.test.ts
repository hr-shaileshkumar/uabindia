import { describe, expect, it } from "vitest";
import { leavePolicySchema } from "../leave-policy.schema";

describe("Leave Policy Schema Validation", () => {
  it("validates a valid full statutory leave policy", () => {
    const validPolicy = {
      name: "Privilege Leave 2026",
      description: "Annual earned leaves",
      isDefault: true,
      type: "Privilege / Earned Leave",
      leaveTypeCode: "PL",
      entitlementPerYear: 18,
      allocationFrequency: "Yearly" as const,
      carryForwardAllowed: true,
      maxCarryForwardDays: 30,
      encashmentAllowed: true,
      maxEncashmentDays: 15,
      sandwichRuleEnabled: false,
      allowDuringProbation: false,
      minServiceDaysRequired: 90,
      maxConsecutiveDays: 15,
      noticePeriodDays: 3,
      requiresProofDocument: false,
      proofRequiredAfterDays: 3,
      status: "Active" as const,
    };

    const result = leavePolicySchema.safeParse(validPolicy);
    expect(result.success).toBe(true);
  });

  it("fails if policy name is less than 2 characters", () => {
    const invalid = {
      name: "A",
      type: "Casual Leave",
      entitlementPerYear: 12,
      allocationFrequency: "Yearly",
    };

    const result = leavePolicySchema.safeParse(invalid);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("at least 2 characters");
    }
  });

  it("fails if carryForwardAllowed is true but maxCarryForwardDays is 0", () => {
    const invalid = {
      name: "Sick Leave",
      type: "Sick Leave",
      entitlementPerYear: 10,
      allocationFrequency: "Yearly",
      carryForwardAllowed: true,
      maxCarryForwardDays: 0,
    };

    const result = leavePolicySchema.safeParse(invalid);
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path.includes("maxCarryForwardDays"));
      expect(issue).toBeDefined();
    }
  });

  it("fails if encashmentAllowed is true but maxEncashmentDays is 0", () => {
    const invalid = {
      name: "Earned Leave",
      type: "Earned Leave",
      entitlementPerYear: 15,
      allocationFrequency: "Yearly",
      encashmentAllowed: true,
      maxEncashmentDays: 0,
    };

    const result = leavePolicySchema.safeParse(invalid);
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path.includes("maxEncashmentDays"));
      expect(issue).toBeDefined();
    }
  });

  it("fails if entitlement is negative or exceeds 365", () => {
    const negative = {
      name: "Invalid Quota",
      type: "CL",
      entitlementPerYear: -5,
      allocationFrequency: "Monthly",
    };
    expect(leavePolicySchema.safeParse(negative).success).toBe(false);

    const excessive = {
      name: "Excessive Quota",
      type: "CL",
      entitlementPerYear: 400,
      allocationFrequency: "Monthly",
    };
    expect(leavePolicySchema.safeParse(excessive).success).toBe(false);
  });
});
