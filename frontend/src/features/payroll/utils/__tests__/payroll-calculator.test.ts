import { describe, expect, it } from "vitest";
import {
  calculateSalaryBreakdown,
  STATUTORY_CONSTANTS,
} from "../payroll-calculator";

describe("payrollCalculator - Enterprise Payroll & Statutory Engine", () => {
  it("should calculate standard salary components for an exempt employee above ESI ceiling", () => {
    // Gross 50,000 / month
    // Basic: 25,000 (50%)
    // HRA: 10,000 (40% of Basic)
    // Special: 15,000
    // PF: Capped at 15,000 ceiling -> 1,800
    // ESI: 0 (Gross > 21,000)
    // PT: 200
    // Net = 50,000 - (1800 + 200) = 48,000
    const result = calculateSalaryBreakdown({
      grossSalary: 50000,
    });

    expect(result.basicSalary).toBe(25000);
    expect(result.hra).toBe(10000);
    expect(result.specialAllowance).toBe(15000);
    expect(result.employeePf).toBe(1800);
    expect(result.employeeEsi).toBe(0);
    expect(result.professionalTax).toBe(200);
    expect(result.netSalary).toBe(48000);
    expect(result.isNegativeNetPay).toBe(false);
    expect(result.anomalies.length).toBe(0);
  });

  it("should calculate ESI for wages under statutory ceiling of Rs 21,000", () => {
    // Gross: 18,000
    // Basic: 9,000
    // HRA: 3,600
    // Special: 5,400
    // PF: 9,000 * 12% = 1,080
    // ESI: 18,000 * 0.75% = 135
    // PT: 200
    // Total Deductions: 1080 + 135 + 200 = 1,415
    // Net = 18,000 - 1,415 = 16,585
    const result = calculateSalaryBreakdown({
      grossSalary: 18000,
    });

    expect(result.basicSalary).toBe(9000);
    expect(result.employeePf).toBe(1080);
    expect(result.employeeEsi).toBe(135);
    expect(result.totalDeductions).toBe(1415);
    expect(result.netSalary).toBe(16585);
  });

  it("should calculate uncapped PF on actual basic when statutory cap is disabled", () => {
    // Gross: 100,000 -> Basic: 50,000
    // Full PF: 50,000 * 12% = 6,000
    const result = calculateSalaryBreakdown({
      grossSalary: 100000,
      pfCappedAtStatutoryLimit: false,
    });

    expect(result.basicSalary).toBe(50000);
    expect(result.employeePf).toBe(6000);
  });

  it("should deduct Loss of Pay (LOP) pro-rata and adjust statutory contributions", () => {
    // Gross 30,000, Month Days = 30, LOP = 5 days
    // LOP Deduction = (30,000 / 30) * 5 = 5,000
    // Adjusted Gross = 25,000
    const result = calculateSalaryBreakdown({
      grossSalary: 30000,
      totalMonthDays: 30,
      lopDays: 5,
    });

    expect(result.lopDeduction).toBe(5000);
    expect(result.adjustedGrossEarnings).toBe(25000);
    expect(result.netSalary).toBeLessThan(30000);
  });

  it("should flag an anomaly when deductions exceed earnings causing negative net pay", () => {
    const result = calculateSalaryBreakdown({
      grossSalary: 15000,
      additionalDeductions: 20000, // Massive loan/advance recovery
    });

    expect(result.isNegativeNetPay).toBe(true);
    expect(result.netSalary).toBeLessThan(0);
    expect(result.anomalies.some((a) => a.includes("negative"))).toBe(true);
  });

  it("should flag an anomaly when LOP days exceed total month days", () => {
    const result = calculateSalaryBreakdown({
      grossSalary: 20000,
      totalMonthDays: 30,
      lopDays: 35,
    });

    expect(result.anomalies.some((a) => a.includes("exceed total month days"))).toBe(true);
  });

  it("should dynamically calculate salary components based on custom administrator policy", () => {
    // Administrator configured: 60% Basic, 50% HRA, uncapped PF, ESI ceiling Rs 25,000, PT Rs 250
    const customPolicy = {
      id: "policy-executive",
      name: "Executive Wage Policy",
      isDefault: false,
      payCycle: "Fixed30Days" as const,
      basicPercentageOfGross: 60,
      hraPercentageOfBasic: 50,
      pfCalculationBasis: "ActualBasic" as const,
      pfWageCeiling: 15000,
      pfEmployeeRate: 12,
      pfEmployerRate: 12,
      isEsiEnabled: true,
      esiWageCeiling: 25000,
      esiEmployeeRate: 0.75,
      esiEmployerRate: 3.25,
      professionalTaxMonthly: 250,
      payDayOfMonth: 1,
      allowNegativeTakeHome: false,
      status: "Active" as const,
    };

    // Gross: 40,000
    // Basic: 40,000 * 60% = 24,000
    // HRA: 24,000 * 50% = 12,000
    // Special: 40,000 - 36,000 = 4,000
    // PF: Uncapped on 24,000 * 12% = 2,880
    // ESI: 0 (since 40,000 > 25,000 ceiling)
    // PT: 250
    // Net: 40,000 - (2,880 + 250) = 36,870
    const result = calculateSalaryBreakdown({
      grossSalary: 40000,
      policy: customPolicy,
    });

    expect(result.basicSalary).toBe(24000);
    expect(result.hra).toBe(12000);
    expect(result.specialAllowance).toBe(4000);
    expect(result.employeePf).toBe(2880);
    expect(result.employeeEsi).toBe(0);
    expect(result.professionalTax).toBe(250);
    expect(result.netSalary).toBe(36870);
  });
});
