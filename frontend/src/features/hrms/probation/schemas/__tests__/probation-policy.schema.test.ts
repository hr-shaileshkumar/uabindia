import { describe, expect, it } from "vitest";
import { validateProbationPolicy } from "../probation-policy.schema";

describe("probationPolicySchema - HR Core Confirmation & Probation Policy Validation", () => {
  it("should validate a standard enterprise probation & confirmation policy", () => {
    const validPolicy = {
      name: "Standard Statutory Confirmation & Probation Policy",
      description: "Default 3-month probation policy with 15-day probation notice",
      isDefault: true,
      defaultProbationMonths: 3,
      maxExtensionMonths: 3,
      noticePeriodDaysProbation: 15,
      noticePeriodDaysConfirmed: 60,
      evaluationReminderDaysBeforeEnd: 15,
      requiresManagerReview: true,
      requiresHodApproval: true,
      autoConfirmationAllowed: false,
      minimumReviewScoreForConfirmation: 70,
      status: "Active" as const,
    };

    const result = validateProbationPolicy(validPolicy);
    expect(result.success).toBe(true);
    expect(result.data?.defaultProbationMonths).toBe(3);
    expect(result.data?.noticePeriodDaysProbation).toBe(15);
    expect(result.data?.minimumReviewScoreForConfirmation).toBe(70);
  });

  it("should reject policy when default probation months is 0 or negative", () => {
    const invalidPolicy = {
      name: "Zero Month Policy",
      defaultProbationMonths: 0,
    };

    const result = validateProbationPolicy(invalidPolicy);
    expect(result.success).toBe(false);
    expect(result.error).toContain("Probation period must be at least 1 month");
  });

  it("should reject policy when minimum review score exceeds 100%", () => {
    const invalidPolicy = {
      name: "Excessive Score Policy",
      defaultProbationMonths: 3,
      minimumReviewScoreForConfirmation: 150,
    };

    const result = validateProbationPolicy(invalidPolicy);
    expect(result.success).toBe(false);
    expect(result.error).toContain("Score cannot exceed 100%");
  });

  it("should reject policy when evaluation reminder is less than 1 day", () => {
    const invalidPolicy = {
      name: "Invalid Reminder Policy",
      defaultProbationMonths: 3,
      evaluationReminderDaysBeforeEnd: 0,
    };

    const result = validateProbationPolicy(invalidPolicy);
    expect(result.success).toBe(false);
    expect(result.error).toContain("Reminder must be at least 1 day prior");
  });

  it("should reject policy with empty or too short name", () => {
    const invalidPolicy = {
      name: "P",
      defaultProbationMonths: 3,
    };

    const result = validateProbationPolicy(invalidPolicy);
    expect(result.success).toBe(false);
    expect(result.error).toContain("Policy name must be at least 2 characters");
  });
});
