"use client";

/**
 * HRMS Feature Hooks (Decoupled Architecture)
 * All domain hooks are extracted into their respective feature slices under:
 * src/features/hrms/
 *
 * This file maintains 100% backward compatibility for existing callers.
 */

// Performance Appraisals Hook
export { usePerformanceAppraisals } from "@/features/hrms/performance";

// Recruitment Hook
export { useRecruitment } from "@/features/hrms/recruitment";

// Training & Certifications Hook
export { useTraining } from "@/features/hrms/training";

// Asset Management Hooks
export { useAssets, type AssetPayload, type AllocationPayload } from "@/features/hrms/assets";

// Shift Management Hooks
export { useShifts, type ShiftPayload, type ShiftSwapPayload } from "@/features/hrms/shifts";

// Overtime Tracking Hook
export { useOvertime } from "@/features/hrms/overtime";
