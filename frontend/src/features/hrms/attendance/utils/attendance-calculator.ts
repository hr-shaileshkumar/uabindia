import type { AttendancePolicy } from "../types/attendance-policy.types";

export interface ShiftDurationResult {
  totalMinutes: number;
  totalHours: number;
  formattedDuration: string;
  isOvernight: boolean;
  isValid: boolean;
  error?: string;
}

export interface AttendanceEvaluationOptions {
  standardShiftHours?: number;
  minHalfDayHours?: number;
  overtimeThresholdHours?: number;
  maxContinuousHours?: number;
  policy?: Partial<AttendancePolicy>;
}

export interface AttendanceEvaluation {
  status: "Present" | "Half Day" | "Absent" | "Overtime";
  workedHours: number;
  overtimeHours: number;
  deficitHours: number;
  anomalies: string[];
}

/**
 * Calculates work duration from punch-in and punch-out, accounting for cross-midnight overnight shifts.
 */
export function calculateShiftDuration(
  punchIn: string | Date,
  punchOut?: string | Date | null,
  breakMinutes = 0,
): ShiftDurationResult {
  if (!punchIn) {
    return {
      totalMinutes: 0,
      totalHours: 0,
      formattedDuration: "0h 0m",
      isOvernight: false,
      isValid: false,
      error: "Punch-in time is required",
    };
  }

  if (!punchOut) {
    return {
      totalMinutes: 0,
      totalHours: 0,
      formattedDuration: "In Progress",
      isOvernight: false,
      isValid: true,
    };
  }

  const inDate = new Date(punchIn);
  const outDate = new Date(punchOut);

  if (isNaN(inDate.getTime()) || isNaN(outDate.getTime())) {
    return {
      totalMinutes: 0,
      totalHours: 0,
      formattedDuration: "0h 0m",
      isOvernight: false,
      isValid: false,
      error: "Invalid timestamp format",
    };
  }

  let diffMs = outDate.getTime() - inDate.getTime();
  let isOvernight = false;

  const isDiffDate =
    outDate.getUTCDate() !== inDate.getUTCDate() || outDate.getDate() !== inDate.getDate();
  const isClockRollover =
    inDate.getHours() > outDate.getHours() || inDate.getUTCHours() > outDate.getUTCHours();

  // Cross-midnight shift rollover check if times are given on the same day but out < in
  if (diffMs < 0) {
    // If punch-out was recorded as earlier on the same date, adjust by +24 hours for night shift
    diffMs += 24 * 60 * 60 * 1000;
    isOvernight = true;
  } else if (isDiffDate || isClockRollover) {
    isOvernight = true;
  }

  const rawMinutes = Math.floor(diffMs / (1000 * 60));
  const totalMinutes = Math.max(0, rawMinutes - Math.max(0, breakMinutes));
  const totalHours = Math.round((totalMinutes / 60) * 100) / 100;

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const formattedDuration = `${hours}h ${minutes}m`;

  return {
    totalMinutes,
    totalHours,
    formattedDuration,
    isOvernight,
    isValid: true,
  };
}

/**
 * Evaluates standard working day status, half-day threshold, and overtime hours.
 * Uses dynamic AttendancePolicy from backend/database when provided.
 */
export function evaluateAttendanceStatus(
  workedHours: number,
  options?: AttendanceEvaluationOptions,
): AttendanceEvaluation {
  const policy = options?.policy;
  const standardHours = policy?.standardShiftHours ?? options?.standardShiftHours ?? 8;
  const minHalfDay = policy?.minHalfDayHours ?? options?.minHalfDayHours ?? 4;
  const overtimeThreshold = policy?.overtimeThresholdHours ?? options?.overtimeThresholdHours ?? standardHours;
  const maxContinuousHours = policy?.maxContinuousHours ?? options?.maxContinuousHours ?? 16;

  const anomalies: string[] = [];

  if (workedHours > maxContinuousHours) {
    anomalies.push(
      `Excessive shift duration (${workedHours}h) exceeds policy maximum continuous threshold (${maxContinuousHours}h).`,
    );
  }

  if (workedHours <= 0) {
    return {
      status: "Absent",
      workedHours: 0,
      overtimeHours: 0,
      deficitHours: standardHours,
      anomalies,
    };
  }

  if (workedHours < minHalfDay) {
    return {
      status: "Absent",
      workedHours,
      overtimeHours: 0,
      deficitHours: Math.round((standardHours - workedHours) * 100) / 100,
      anomalies: [...anomalies, `Worked hours (${workedHours}h) below half-day threshold (${minHalfDay}h).`],
    };
  }

  if (workedHours < standardHours) {
    return {
      status: "Half Day",
      workedHours,
      overtimeHours: 0,
      deficitHours: Math.round((standardHours - workedHours) * 100) / 100,
      anomalies,
    };
  }

  if (workedHours > overtimeThreshold) {
    const overtimeHours = Math.round((workedHours - overtimeThreshold) * 100) / 100;
    return {
      status: "Overtime",
      workedHours,
      overtimeHours,
      deficitHours: 0,
      anomalies,
    };
  }

  return {
    status: "Present",
    workedHours,
    overtimeHours: 0,
    deficitHours: 0,
    anomalies,
  };
}
