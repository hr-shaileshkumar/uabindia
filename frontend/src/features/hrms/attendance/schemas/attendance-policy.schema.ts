import { z } from "zod";

export const attendancePolicySchema = z
  .object({
    name: z.string().min(2, "Policy name must be at least 2 characters").max(100),
    description: z.string().optional(),
    isDefault: z.boolean().default(false),
    standardShiftHours: z
      .number()
      .min(1, "Shift hours must be at least 1 hour")
      .max(24, "Shift hours cannot exceed 24 hours"),
    minHalfDayHours: z
      .number()
      .min(1, "Half-day threshold must be at least 1 hour")
      .max(12, "Half-day threshold cannot exceed 12 hours"),
    gracePeriodMinutes: z
      .number()
      .min(0, "Grace period cannot be negative")
      .max(120, "Grace period cannot exceed 120 minutes")
      .default(15),
    overtimeThresholdHours: z
      .number()
      .min(1, "Overtime threshold must be at least 1 hour")
      .max(24, "Overtime threshold cannot exceed 24 hours"),
    maxContinuousHours: z
      .number()
      .min(4, "Maximum continuous shift must be at least 4 hours")
      .max(24, "Maximum continuous shift cannot exceed 24 hours")
      .default(16),
    autoDeductBreakMinutes: z
      .number()
      .min(0, "Break minutes cannot be negative")
      .max(240, "Break minutes cannot exceed 4 hours")
      .default(60),
    requireGeofence: z.boolean().default(false),
    allowedRadiusMeters: z.number().min(10).max(5000).default(250),
    requireFacialVerification: z.boolean().default(false),
    minFacialConfidenceScore: z.number().min(50).max(100).default(75),
    allowManualRegularization: z.boolean().default(true),
    maxRegularizationsPerMonth: z.number().min(0).max(31).default(3),
    punchMode: z.enum(["TwoPunchFirstInLastOut", "MultiPunchPairwise", "SplitShiftFourPunch", "ContinuousRoaming"]).default("TwoPunchFirstInLastOut"),
    minPunchesRequiredPerDay: z.number().min(1).max(20).default(2),
    maxPunchesAllowedPerDay: z.number().min(1).max(50).optional(),
    earlyExitToleranceMinutes: z.number().min(0).max(120).default(15),
    missingPunchPenalty: z.string().default("HalfDay"),
    missingPunchGraceDays: z.number().min(0).max(30).default(3),
    defaultShiftId: z.string().optional(),
    status: z.enum(["Active", "Draft", "Archived"]).default("Active"),
    companyId: z.string().optional(),
    projectId: z.string().optional(),
    branchId: z.string().optional(),
    countryId: z.string().optional(),

    // Dynamic Deduction Basis & Late Slabs
    deductionBasis: z.enum(["HourlyPayAsYouGo", "MonthlyAccumulatedSlabs", "HybridBoth"]).default("MonthlyAccumulatedSlabs"),
    allowDailyShortfallOffsetWithOt: z.boolean().default(false),
    monthlyFreeLateDays: z.number().min(0).max(31).default(3),
    latePenaltyStepFrequency: z.number().min(1).max(10).default(1),
    latePenaltyAction: z.enum(["QuarterDay", "HalfDay", "FullDay"]).default("HalfDay"),
    minorLateWindowMinutes: z.number().min(0).max(120).default(15),
    majorLateThresholdMinutes: z.number().min(0).max(300).default(45),

    // Early Exit Thresholds
    earlyExitThresholdMinutes: z.number().min(0).max(300).default(60),
    earlyExitPenaltyAction: z.enum(["QuarterDay", "HalfDay", "FullDay"]).default("HalfDay"),

    // Overtime & Multipliers
    minMinutesForOvertime: z.number().min(0).max(300).default(30),
    requireOvertimeApproval: z.boolean().default(false),
    normalDayOtMultiplier: z.number().min(1.0).max(5.0).default(1.5),
    weekendOtMultiplier: z.number().min(1.0).max(5.0).default(2.0),
    holidayOtMultiplier: z.number().min(1.0).max(5.0).default(2.5),
    allowCompOffInsteadOfPay: z.boolean().default(true),
    weekOffPattern: z.enum(["SundayOnly", "AlternateSaturdaySunday", "AllSaturdaysSunday", "Custom"]).default("SundayOnly"),
  })
  .refine(
    (policy) => policy.minHalfDayHours < policy.standardShiftHours,
    {
      message: "Half-day threshold hours must be strictly less than standard shift hours.",
      path: ["minHalfDayHours"],
    },
  )
  .refine(
    (policy) => policy.overtimeThresholdHours >= policy.standardShiftHours,
    {
      message: "Overtime threshold cannot be lower than standard shift hours.",
      path: ["overtimeThresholdHours"],
    },
  );

export type AttendancePolicyInput = z.infer<typeof attendancePolicySchema>;

export function validateAttendancePolicy(payload: unknown): {
  success: boolean;
  data?: AttendancePolicyInput;
  error?: string;
  errors?: string[];
} {
  const result = attendancePolicySchema.safeParse(payload);
  if (result.success) {
    return { success: true, data: result.data };
  }

  const issues = result.error.issues;
  const errors = issues.map((i) => i.message);
  return {
    success: false,
    error: errors[0] ?? "Validation failed",
    errors,
  };
}
