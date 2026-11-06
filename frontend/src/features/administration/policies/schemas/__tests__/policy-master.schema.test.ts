import { describe, expect, it } from "vitest";
import {
  policyMasterSchema,
  policyVersionSchema,
} from "../policy-master.schema";

describe("Policy Master & Versioning Zod Schema Validation", () => {
  it("validates a valid Policy Master definition", () => {
    const valid = {
      code: "ATT_LATE_COMING_01",
      category: "ATTENDANCE_TIMESHEET" as const,
      name: "Late Mark & Grace Period Policy",
      description: "Standard grace window and deduction rules",
      isMandatoryAcknowledgment: true,
      isSystemCritical: true,
      priority: 5,
      status: "Active" as const,
    };

    const res = policyMasterSchema.safeParse(valid);
    expect(res.success).toBe(true);
  });

  it("fails if policy code contains lowercase or spaces", () => {
    const invalid = {
      code: "att late mark",
      category: "ATTENDANCE_TIMESHEET" as const,
      name: "Invalid Code Policy",
      description: "Code has lowercase and spaces",
    };

    const res = policyMasterSchema.safeParse(invalid);
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.issues[0].message).toContain("UPPERCASE");
    }
  });

  it("validates a valid Policy Version with temporal dates", () => {
    const validVersion = {
      version: "2.1",
      effectiveFrom: "2026-04-01",
      effectiveTo: "2027-03-31",
      status: "Active" as const,
      changeLogReason: "Annual revision approved by board",
      authorName: "Corporate HR Head",
      applicability: {
        departmentIds: ["Clinical", "Nursing"],
        employmentTypes: ["Permanent" as const, "Contract" as const],
      },
      ruleConfig: {
        gracePeriodMinutes: 15,
        maxAllowed: 3,
      },
    };

    const res = policyVersionSchema.safeParse(validVersion);
    expect(res.success).toBe(true);
  });

  it("fails if effectiveTo is earlier than effectiveFrom", () => {
    const invalidVersion = {
      version: "1.0",
      effectiveFrom: "2026-06-01",
      effectiveTo: "2026-01-01", // Earlier than effectiveFrom!
      status: "Active" as const,
      changeLogReason: "Test date validation",
      authorName: "HR",
    };

    const res = policyVersionSchema.safeParse(invalidVersion);
    expect(res.success).toBe(false);
    if (!res.success) {
      const issue = res.error.issues.find((i) => i.path.includes("effectiveTo"));
      expect(issue).toBeDefined();
    }
  });
});
