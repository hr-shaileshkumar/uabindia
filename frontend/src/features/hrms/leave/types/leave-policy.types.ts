/**
 * Dynamic Leave Policy Types (Stored in DB via Backend API, Admin Configurable)
 */

export interface LeavePolicy {
  id: string;
  name: string;
  description?: string;
  isDefault: boolean;
  type: string;                      // e.g. "Casual Leave", "Privilege / Earned Leave", "Sick Leave"
  leaveTypeCode?: string;            // e.g. "CL", "PL", "SL", "ML"
  entitlementPerYear: number;        // Annual quota (e.g. 12, 18, 15)
  allocationFrequency: "Yearly" | "Monthly" | "Quarterly"; // Accrual frequency
  carryForwardAllowed: boolean;      // Can unused leaves roll over
  maxCarryForwardDays: number;       // Maximum carry-forward cap (e.g. 30 days)
  encashmentAllowed: boolean;        // Can unused leaves be encashed
  maxEncashmentDays: number;         // Maximum encashable days per year
  sandwichRuleEnabled: boolean;      // Weekend/holiday between leave days counts as leave
  allowDuringProbation: boolean;     // Probationary employee eligibility
  minServiceDaysRequired: number;    // Days after joining before leave can be availed
  maxConsecutiveDays: number;        // Maximum single stretch of leave days
  noticePeriodDays: number;          // Advance notice required in days
  requiresProofDocument: boolean;    // Medical/supporting certificate required
  proofRequiredAfterDays: number;    // e.g. required if leave > 2 days
  companyId?: string;
  projectId?: string;
  status: "Active" | "Draft" | "Archived";
  createdAt?: string;
  updatedAt?: string;
}

export const DEFAULT_FALLBACK_LEAVE_POLICY: LeavePolicy = {
  id: "default-system-leave-policy",
  name: "Standard Organization Leave Policy",
  description: "Default organization-wide statutory leave policy stored in database",
  isDefault: true,
  type: "Privilege / Earned Leave",
  leaveTypeCode: "PL",
  entitlementPerYear: 18,
  allocationFrequency: "Yearly",
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
  status: "Active",
};

export interface LeaveCalculationInput {
  fromDate: string;
  toDate: string;
  isHalfDay?: boolean;
  halfDaySession?: "FirstHalf" | "SecondHalf";
  holidays?: string[]; // array of "YYYY-MM-DD"
  weekendDays?: number[]; // default [0, 6] (Sunday = 0, Saturday = 6)
  sandwichRuleEnabled?: boolean;
}

export interface LeaveCalculationResult {
  totalCalendarDays: number;
  holidaysCount: number;
  weekendsCount: number;
  effectiveLeaveDays: number;
  sandwichedDaysCount: number;
  isHalfDay: boolean;
}

export interface CarryForwardResult {
  currentBalance: number;
  carriedForward: number;
  lapsed: number;
  capApplied: boolean;
}

export interface EncashmentResult {
  eligibleDays: number;
  encashableDays: number;
  dailyRate: number;
  totalEncashmentAmount: number;
}
