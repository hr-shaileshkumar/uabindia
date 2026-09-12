/**
 * Dynamic Attendance Policy Types (Loaded from Database via Backend API)
 */

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
  companyId?: string;
  projectId?: string;
  branchId?: string;
  status: "Active" | "Draft" | "Archived";
  createdAt?: string;
  updatedAt?: string;
}

export const DEFAULT_FALLBACK_ATTENDANCE_POLICY: AttendancePolicy = {
  id: "default-system-policy",
  name: "Standard Organization Shift Policy",
  description: "Default organization-wide policy enforced by backend",
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
  status: "Active",
};
