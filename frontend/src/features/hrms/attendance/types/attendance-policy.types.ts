/**
 * Dynamic Attendance Policy Types (Loaded from Database via Backend API)
 * All policies, shift rules, calculation matrices, and regularization requests
 * are strictly stored and retrieved from the database.
 */

export type PunchPolicyMode = 
  | "TwoPunchFirstInLastOut"
  | "MultiPunchPairwise"
  | "SplitShiftFourPunch"
  | "ContinuousRoaming";

export type DeductionBasis = 
  | "HourlyPayAsYouGo"
  | "MonthlyAccumulatedSlabs"
  | "HybridBoth";

export type LatePenaltyAction = 
  | "QuarterDay"
  | "HalfDay"
  | "FullDay";

export type WeekOffPattern = 
  | "SundayOnly"
  | "AlternateSaturdaySunday"
  | "AllSaturdaysSunday"
  | "Custom";

export interface AttendancePolicy {
  id: string;
  name: string;
  description?: string;
  isDefault: boolean;
  standardShiftHours: number;       // e.g. 8 or 9 hours
  minHalfDayHours: number;          // e.g. 4 or 4.5 hours
  gracePeriodMinutes: number;       // e.g. 15 minutes
  overtimeThresholdHours: number;   // e.g. 8.5 hours
  maxContinuousHours: number;       // e.g. 16 hours
  autoDeductBreakMinutes: number;   // e.g. 45 or 60 minutes
  requireGeofence: boolean;         // Geofence GPS verification required
  allowedRadiusMeters?: number;     // e.g. 200m around office coordinates
  requireFacialVerification: boolean;// Biometric FRS check
  minFacialConfidenceScore?: number;// e.g. 80%
  allowManualRegularization: boolean;// Allow employee punch dispute requests
  maxRegularizationsPerMonth?: number;// e.g. 3 per month
  punchMode?: PunchPolicyMode;
  minPunchesRequiredPerDay?: number;
  maxPunchesAllowedPerDay?: number;
  earlyExitToleranceMinutes?: number;
  missingPunchPenalty?: string;     // "FlagForReview" | "HalfDay" | "MarkAbsent"
  missingPunchGraceDays?: number;   // e.g. 3 days self-service window
  defaultShiftId?: string;
  companyId?: string;
  projectId?: string;
  branchId?: string;
  countryId?: string;
  status: "Active" | "Draft" | "Archived";

  // Dynamic Deduction Basis & Late Matrices (From Database)
  deductionBasis?: DeductionBasis;
  allowDailyShortfallOffsetWithOt?: boolean;
  monthlyFreeLateDays?: number;      // e.g. 3 free lates per month
  latePenaltyStepFrequency?: number; // e.g. every 1 or 3 lates thereafter
  latePenaltyAction?: LatePenaltyAction;
  minorLateWindowMinutes?: number;   // e.g. 15 or 45 mins
  majorLateThresholdMinutes?: number;// e.g. 45 or 120 mins (>120 = Absent/HalfDay)

  // Early Exit
  earlyExitThresholdMinutes?: number;// e.g. 60 mins early
  earlyExitPenaltyAction?: LatePenaltyAction;

  // Overtime Multipliers & Week-Off
  minMinutesForOvertime?: number;    // e.g. 30 or 60 mins
  requireOvertimeApproval?: boolean;
  normalDayOtMultiplier?: number;    // e.g. 1.5x
  weekendOtMultiplier?: number;      // e.g. 2.0x
  holidayOtMultiplier?: number;      // e.g. 2.5x
  allowCompOffInsteadOfPay?: boolean;
  weekOffPattern?: WeekOffPattern;

  createdAt?: string;
  updatedAt?: string;
}

export interface AttendanceRegularizationRequest {
  id: string;
  employeeId: string;
  employeeName?: string;
  employeeCode?: string;
  date: string;
  requestType: "MissingPunch" | "OnDuty" | "WorkFromHome" | "BiometricDispute";
  reason: string;
  proposedInTime?: string;
  proposedOutTime?: string;
  status: "Pending" | "Approved" | "Rejected";
  managerRemarks?: string;
  approvedAt?: string;
  createdAt: string;
}

export const DEFAULT_FALLBACK_ATTENDANCE_POLICY: AttendancePolicy = {
  id: "default-system-policy",
  name: "Standard Organization Shift Policy",
  description: "Default organization-wide policy enforced by backend database",
  isDefault: true,
  standardShiftHours: 8,
  minHalfDayHours: 4,
  gracePeriodMinutes: 15,
  overtimeThresholdHours: 8,
  maxContinuousHours: 16,
  autoDeductBreakMinutes: 60,
  requireGeofence: false,
  allowedRadiusMeters: 250,
  requireFacialVerification: false,
  minFacialConfidenceScore: 75,
  allowManualRegularization: true,
  maxRegularizationsPerMonth: 3,
  punchMode: "TwoPunchFirstInLastOut",
  minPunchesRequiredPerDay: 2,
  earlyExitToleranceMinutes: 15,
  missingPunchPenalty: "HalfDay",
  missingPunchGraceDays: 3,
  deductionBasis: "MonthlyAccumulatedSlabs",
  monthlyFreeLateDays: 3,
  latePenaltyStepFrequency: 1,
  latePenaltyAction: "HalfDay",
  minorLateWindowMinutes: 15,
  majorLateThresholdMinutes: 45,
  earlyExitThresholdMinutes: 60,
  earlyExitPenaltyAction: "HalfDay",
  normalDayOtMultiplier: 1.5,
  weekendOtMultiplier: 2.0,
  holidayOtMultiplier: 2.5,
  allowCompOffInsteadOfPay: true,
  weekOffPattern: "SundayOnly",
  allowDailyShortfallOffsetWithOt: false,
  status: "Active",
};
