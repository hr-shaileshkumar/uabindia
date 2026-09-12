"use client";

/**
 * Backward compatibility re-export for AttendanceList.
 * The implementation has been refactored into the feature slice:
 * src/features/hrms/attendance/
 */
export * from "../attendance";
export { default } from "../attendance";
