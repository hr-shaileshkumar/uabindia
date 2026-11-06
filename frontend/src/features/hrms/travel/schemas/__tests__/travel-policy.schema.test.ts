import { describe, expect, it } from "vitest";
import { validateTravelExpensePolicy } from "../travel-policy.schema";

describe("travelExpensePolicySchema - Travel & Expense Policy Validation", () => {
  it("should validate a valid travel & expense policy", () => {
    const validPolicy = {
      name: "Standard Corporate Domestic Travel Policy",
      description: "Applies to all domestic business visits",
      isDefault: true,
      maxDailyLodgingAllowance: 3500,
      maxDailyMealsAllowance: 800,
      mileageRatePerKmCar: 12,
      mileageRatePerKmBike: 6,
      requiresAdvanceApproval: true,
      approvalThresholdAmount: 5000,
      maxAdvancePercentage: 80,
      receiptRequiredAboveAmount: 200,
      expenseSubmissionWindowDays: 15,
      status: "Active" as const,
    };

    const result = validateTravelExpensePolicy(validPolicy);
    expect(result.success).toBe(true);
    expect(result.data?.maxDailyLodgingAllowance).toBe(3500);
    expect(result.data?.mileageRatePerKmCar).toBe(12);
    expect(result.data?.expenseSubmissionWindowDays).toBe(15);
  });

  it("should reject policy when lodging allowance is negative", () => {
    const invalidPolicy = {
      name: "Negative Allowance Policy",
      maxDailyLodgingAllowance: -500,
      maxDailyMealsAllowance: 800,
      mileageRatePerKmCar: 12,
      mileageRatePerKmBike: 6,
      approvalThresholdAmount: 5000,
      maxAdvancePercentage: 80,
      receiptRequiredAboveAmount: 200,
      expenseSubmissionWindowDays: 15,
    };

    const result = validateTravelExpensePolicy(invalidPolicy);
    expect(result.success).toBe(false);
    expect(result.error).toContain("Lodging allowance cannot be negative");
  });

  it("should reject policy when maxAdvancePercentage exceeds 100", () => {
    const invalidPolicy = {
      name: "Excessive Advance Policy",
      maxDailyLodgingAllowance: 3500,
      maxDailyMealsAllowance: 800,
      mileageRatePerKmCar: 12,
      mileageRatePerKmBike: 6,
      approvalThresholdAmount: 5000,
      maxAdvancePercentage: 120, // Exceeds 100%
      receiptRequiredAboveAmount: 200,
      expenseSubmissionWindowDays: 15,
    };

    const result = validateTravelExpensePolicy(invalidPolicy);
    expect(result.success).toBe(false);
    expect(result.error).toContain("Advance percentage must be between 0 and 100");
  });

  it("should reject policy when submission window is less than 1 day", () => {
    const invalidPolicy = {
      name: "Zero Day Window Policy",
      maxDailyLodgingAllowance: 3500,
      maxDailyMealsAllowance: 800,
      mileageRatePerKmCar: 12,
      mileageRatePerKmBike: 6,
      approvalThresholdAmount: 5000,
      maxAdvancePercentage: 80,
      receiptRequiredAboveAmount: 200,
      expenseSubmissionWindowDays: 0,
    };

    const result = validateTravelExpensePolicy(invalidPolicy);
    expect(result.success).toBe(false);
    expect(result.error).toContain("Submission window must be at least 1 day");
  });

  it("should reject policy with short name", () => {
    const invalidPolicy = {
      name: "T",
      maxDailyLodgingAllowance: 3500,
      maxDailyMealsAllowance: 800,
      mileageRatePerKmCar: 12,
      mileageRatePerKmBike: 6,
      approvalThresholdAmount: 5000,
      maxAdvancePercentage: 80,
      receiptRequiredAboveAmount: 200,
      expenseSubmissionWindowDays: 15,
    };

    const result = validateTravelExpensePolicy(invalidPolicy);
    expect(result.success).toBe(false);
    expect(result.error).toContain("Policy name must be at least 2 characters");
  });
});
