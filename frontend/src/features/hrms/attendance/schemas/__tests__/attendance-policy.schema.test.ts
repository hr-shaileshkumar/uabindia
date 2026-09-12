import { describe, expect, it } from "vitest";
import { validateAttendancePolicy } from "../attendance-policy.schema";

describe("attendancePolicySchema - Administrator Policy Configuration Validation", () => {
  it("should validate a valid enterprise attendance shift policy", () => {
    const validPolicy = {
      name: "Corporate Standard Shift",
      description: "Standard 8.5 hour shift policy with 15-minute grace period",
      isDefault: true,
      standardShiftHours: 8.5,
      minHalfDayHours: 4.5,
      gracePeriodMinutes: 15,
      overtimeThresholdHours: 8.5,
      maxContinuousHours: 16,
      autoDeductBreakMinutes: 45,
      requireGeofence: true,
      allowedRadiusMeters: 200,
      requireFacialVerification: true,
      minFacialConfidenceScore: 80,
      allowManualRegularization: true,
      maxRegularizationsPerMonth: 2,
      status: "Active" as const,
    };

    const result = validateAttendancePolicy(validPolicy);
    expect(result.success).toBe(true);
    expect(result.data?.standardShiftHours).toBe(8.5);
    expect(result.data?.minHalfDayHours).toBe(4.5);
  });

  it("should reject policy when half-day threshold is equal or greater than standard shift hours", () => {
    const invalidPolicy = {
      name: "Invalid Shift Policy",
      standardShiftHours: 8,
      minHalfDayHours: 8, // Half day cannot equal or exceed standard shift!
      overtimeThresholdHours: 8,
    };

    const result = validateAttendancePolicy(invalidPolicy);
    expect(result.success).toBe(false);
    expect(result.error).toContain("Half-day threshold hours must be strictly less than standard shift hours");
  });

  it("should reject policy when overtime threshold is less than standard shift hours", () => {
    const invalidPolicy = {
      name: "Invalid OT Policy",
      standardShiftHours: 8,
      minHalfDayHours: 4,
      overtimeThresholdHours: 7, // OT cannot begin before standard shift is completed
    };

    const result = validateAttendancePolicy(invalidPolicy);
    expect(result.success).toBe(false);
    expect(result.error).toContain("Overtime threshold cannot be lower than standard shift hours");
  });

  it("should reject policy with negative grace period or shift hours", () => {
    const invalidPolicy = {
      name: "Negative Shift Policy",
      standardShiftHours: -8,
      minHalfDayHours: 4,
      overtimeThresholdHours: 8,
    };

    const result = validateAttendancePolicy(invalidPolicy);
    expect(result.success).toBe(false);
  });

  it("should reject policy with missing or too short policy name", () => {
    const invalidPolicy = {
      name: "A",
      standardShiftHours: 8,
      minHalfDayHours: 4,
      overtimeThresholdHours: 8,
    };

    const result = validateAttendancePolicy(invalidPolicy);
    expect(result.success).toBe(false);
    expect(result.error).toContain("Policy name must be at least 2 characters");
  });
});
