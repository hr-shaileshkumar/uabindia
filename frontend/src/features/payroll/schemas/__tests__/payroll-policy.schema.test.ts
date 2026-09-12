import { describe, expect, it } from "vitest";
import { validatePayrollPolicy } from "../payroll-policy.schema";

describe("payrollPolicySchema - Administrator Wage Policy Validation", () => {
  it("should validate a valid enterprise statutory payroll policy", () => {
    const validPolicy = {
      name: "Corporate Standard Indian Wage Policy",
      description: "Compliant with Indian Code on Wages",
      isDefault: true,
      payCycle: "Fixed30Days" as const,
      basicPercentageOfGross: 50,
      hraPercentageOfBasic: 40,
      pfCalculationBasis: "StatutoryWageCeiling" as const,
      pfWageCeiling: 15000,
      pfEmployeeRate: 12,
      pfEmployerRate: 12,
      isEsiEnabled: true,
      esiWageCeiling: 21000,
      esiEmployeeRate: 0.75,
      esiEmployerRate: 3.25,
      professionalTaxMonthly: 200,
      payDayOfMonth: 1,
      allowNegativeTakeHome: false,
      status: "Active" as const,
    };

    const result = validatePayrollPolicy(validPolicy);
    expect(result.success).toBe(true);
    expect(result.data?.basicPercentageOfGross).toBe(50);
    expect(result.data?.pfWageCeiling).toBe(15000);
  });

  it("should reject policy when Basic percentage of gross is below 10%", () => {
    const invalidPolicy = {
      name: "Invalid Wage Policy",
      basicPercentageOfGross: 5, // Below 10% minimum
    };

    const result = validatePayrollPolicy(invalidPolicy);
    expect(result.success).toBe(false);
    expect(result.error).toContain("Basic salary must be at least 10%");
  });

  it("should reject policy when Basic percentage exceeds 100%", () => {
    const invalidPolicy = {
      name: "Excessive Basic Policy",
      basicPercentageOfGross: 120,
    };

    const result = validatePayrollPolicy(invalidPolicy);
    expect(result.success).toBe(false);
    expect(result.error).toContain("Basic salary cannot exceed 100%");
  });

  it("should reject policy with invalid disbursement day of month", () => {
    const invalidPolicy = {
      name: "Invalid Day Policy",
      payDayOfMonth: 35, // Not a valid day of month
    };

    const result = validatePayrollPolicy(invalidPolicy);
    expect(result.success).toBe(false);
  });

  it("should reject policy with missing or too short name", () => {
    const invalidPolicy = {
      name: "A",
    };

    const result = validatePayrollPolicy(invalidPolicy);
    expect(result.success).toBe(false);
    expect(result.error).toContain("Policy name must be at least 2 characters");
  });
});
