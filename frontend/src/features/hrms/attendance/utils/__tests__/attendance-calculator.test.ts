import { describe, expect, it } from "vitest";
import {
  calculateShiftDuration,
  evaluateAttendanceStatus,
} from "../attendance-calculator";

describe("attendanceCalculator - Shift Duration & Status Evaluation", () => {
  it("should accurately calculate standard day shift duration with break deduction", () => {
    // 09:00 to 18:00 (9 hours = 540 min), minus 60 min break = 480 min (8 hours)
    const inTime = "2026-09-08T09:00:00.000Z";
    const outTime = "2026-09-08T18:00:00.000Z";
    const result = calculateShiftDuration(inTime, outTime, 60);

    expect(result.isValid).toBe(true);
    expect(result.totalMinutes).toBe(480);
    expect(result.totalHours).toBe(8);
    expect(result.formattedDuration).toBe("8h 0m");
    expect(result.isOvernight).toBe(false);
  });

  it("should handle overnight shifts crossing midnight", () => {
    // 22:00 (Sept 8) to 06:30 (Sept 9) = 8.5 hours (510 min), minus 30 min break = 480 min (8 hours)
    const inTime = "2026-09-08T22:00:00.000Z";
    const outTime = "2026-09-09T06:30:00.000Z";
    const result = calculateShiftDuration(inTime, outTime, 30);

    expect(result.isValid).toBe(true);
    expect(result.totalMinutes).toBe(480);
    expect(result.totalHours).toBe(8);
    expect(result.isOvernight).toBe(true);
  });

  it("should handle in-progress shifts without punch-out", () => {
    const inTime = "2026-09-08T09:00:00.000Z";
    const result = calculateShiftDuration(inTime, null);

    expect(result.isValid).toBe(true);
    expect(result.totalHours).toBe(0);
    expect(result.formattedDuration).toBe("In Progress");
  });

  it("should evaluate attendance status as Present for 8 hours", () => {
    const evaluation = evaluateAttendanceStatus(8);
    expect(evaluation.status).toBe("Present");
    expect(evaluation.overtimeHours).toBe(0);
    expect(evaluation.deficitHours).toBe(0);
  });

  it("should evaluate attendance status as Half Day for 5 hours", () => {
    const evaluation = evaluateAttendanceStatus(5);
    expect(evaluation.status).toBe("Half Day");
    expect(evaluation.deficitHours).toBe(3);
  });

  it("should evaluate attendance status as Absent if below 4 hours", () => {
    const evaluation = evaluateAttendanceStatus(2.5);
    expect(evaluation.status).toBe("Absent");
    expect(evaluation.deficitHours).toBe(5.5);
    expect(evaluation.anomalies.length).toBeGreaterThan(0);
  });

  it("should evaluate attendance status as Overtime for shifts exceeding standard hours", () => {
    const evaluation = evaluateAttendanceStatus(10.5);
    expect(evaluation.status).toBe("Overtime");
    expect(evaluation.overtimeHours).toBe(2.5);
  });

  it("should flag an anomaly for excessive shift duration exceeding 16 hours", () => {
    const evaluation = evaluateAttendanceStatus(18);
    expect(evaluation.anomalies.some((a) => a.includes("Excessive shift"))).toBe(true);
  });

  it("should dynamically enforce custom database-backed policy configured by administrator", () => {
    // Administrator created a 9-hour shift policy with 4.5h half day and 12h max continuous shift
    const customAdminPolicy = {
      id: "policy-plant-shift",
      name: "Plant 9-Hour Shift",
      isDefault: true,
      standardShiftHours: 9,
      minHalfDayHours: 4.5,
      gracePeriodMinutes: 20,
      overtimeThresholdHours: 9.5,
      maxContinuousHours: 12,
      autoDeductBreakMinutes: 60,
      requireGeofence: true,
      requireFacialVerification: true,
      allowManualRegularization: true,
      status: "Active" as const,
    };

    // 9 hours worked -> Present
    const res9 = evaluateAttendanceStatus(9, { policy: customAdminPolicy });
    expect(res9.status).toBe("Present");
    expect(res9.overtimeHours).toBe(0);

    // 4 hours worked -> Absent (because policy minHalfDayHours is 4.5)
    const res4 = evaluateAttendanceStatus(4, { policy: customAdminPolicy });
    expect(res4.status).toBe("Absent");

    // 5 hours worked -> Half Day (4.5 <= 5 < 9)
    const res5 = evaluateAttendanceStatus(5, { policy: customAdminPolicy });
    expect(res5.status).toBe("Half Day");

    // 11 hours worked -> Overtime (11 - 9.5 = 1.5h OT)
    const res11 = evaluateAttendanceStatus(11, { policy: customAdminPolicy });
    expect(res11.status).toBe("Overtime");
    expect(res11.overtimeHours).toBe(1.5);

    // 13 hours worked -> Anomaly flag (exceeds policy limit of 12 hours)
    const res13 = evaluateAttendanceStatus(13, { policy: customAdminPolicy });
    expect(res13.anomalies.some((a) => a.includes("12h"))).toBe(true);
  });
});

