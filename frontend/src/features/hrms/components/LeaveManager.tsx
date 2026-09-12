"use client";

/**
 * Backward compatibility re-export for LeaveManager.
 * The implementation has been refactored into the canonical feature slice:
 * src/features/hrms/leave/
 */
export * from "../leave";
export { default } from "../leave";
