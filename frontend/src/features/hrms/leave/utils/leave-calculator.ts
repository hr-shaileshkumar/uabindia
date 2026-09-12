import type {
  LeaveCalculationInput,
  LeaveCalculationResult,
  CarryForwardResult,
  EncashmentResult,
  LeavePolicy,
} from "../types/leave-policy.types";

/**
 * Format a Date to YYYY-MM-DD
 */
function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Parse YYYY-MM-DD to a local calendar Date (avoiding UTC timezone shift)
 */
function parseDateKey(str: string): Date {
  const [y, m, d] = str.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/**
 * Pure calculation engine for effective leave days accounting for weekends,
 * public holidays, and the statutory sandwich rule.
 */
export function calculateEffectiveLeaveDays(input: LeaveCalculationInput): LeaveCalculationResult {
  const {
    fromDate,
    toDate,
    isHalfDay = false,
    holidays = [],
    weekendDays = [0, 6], // Sunday = 0, Saturday = 6
    sandwichRuleEnabled = false,
  } = input;

  if (isHalfDay) {
    return {
      totalCalendarDays: 1,
      holidaysCount: 0,
      weekendsCount: 0,
      effectiveLeaveDays: 0.5,
      sandwichedDaysCount: 0,
      isHalfDay: true,
    };
  }

  const start = parseDateKey(fromDate);
  const end = parseDateKey(toDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
    return {
      totalCalendarDays: 0,
      holidaysCount: 0,
      weekendsCount: 0,
      effectiveLeaveDays: 0,
      sandwichedDaysCount: 0,
      isHalfDay: false,
    };
  }

  const holidaySet = new Set(holidays);
  const weekendSet = new Set(weekendDays);

  let totalCalendarDays = 0;
  let holidaysCount = 0;
  let weekendsCount = 0;
  let nonWorkingDaysBetween = 0;

  const current = new Date(start);
  while (current <= end) {
    totalCalendarDays++;
    const dateKey = formatDateKey(current);
    const dayOfWeek = current.getDay();

    const isHoliday = holidaySet.has(dateKey);
    const isWeekend = weekendSet.has(dayOfWeek);

    if (isHoliday) {
      holidaysCount++;
    }
    if (isWeekend && !isHoliday) {
      weekendsCount++;
    }
    if (isHoliday || isWeekend) {
      nonWorkingDaysBetween++;
    }

    current.setDate(current.getDate() + 1);
  }

  let effectiveLeaveDays: number;
  let sandwichedDaysCount = 0;

  if (sandwichRuleEnabled) {
    // Under sandwich rule, intervening weekends/holidays count as leave
    effectiveLeaveDays = totalCalendarDays;
    sandwichedDaysCount = nonWorkingDaysBetween;
  } else {
    // Normal rule: deduct weekends and holidays
    effectiveLeaveDays = Math.max(0, totalCalendarDays - nonWorkingDaysBetween);
  }

  return {
    totalCalendarDays,
    holidaysCount,
    weekendsCount,
    effectiveLeaveDays,
    sandwichedDaysCount,
    isHalfDay: false,
  };
}

/**
 * Calculates pro-rated leave entitlement for employees joining mid-year.
 */
export function calculateProRatedEntitlement(
  entitlementPerYear: number,
  joiningDateStr: string,
  allocationFrequency: "Yearly" | "Monthly" | "Quarterly" = "Yearly",
  targetYear: number = new Date().getFullYear(),
): number {
  if (entitlementPerYear <= 0) return 0;

  const joinDate = parseDateKey(joiningDateStr);
  if (isNaN(joinDate.getTime())) return entitlementPerYear;

  const joinYear = joinDate.getFullYear();

  // If joined before target year, full entitlement applies
  if (joinYear < targetYear) {
    return entitlementPerYear;
  }

  // If joined after target year, no entitlement for target year
  if (joinYear > targetYear) {
    return 0;
  }

  const joinMonth = joinDate.getMonth(); // 0 to 11

  if (allocationFrequency === "Monthly") {
    // Remaining months in the year including current month if joined before 15th
    const effectiveRemainingMonths =
      joinDate.getDate() <= 15 ? 12 - joinMonth : Math.max(0, 11 - joinMonth);
    const monthlyRate = entitlementPerYear / 12;
    return Math.round(monthlyRate * effectiveRemainingMonths * 10) / 10;
  }

  if (allocationFrequency === "Quarterly") {
    const currentQuarter = Math.floor(joinMonth / 3); // 0, 1, 2, 3
    const remainingQuarters = 4 - currentQuarter;
    const quarterlyRate = entitlementPerYear / 4;
    return Math.round(quarterlyRate * remainingQuarters * 10) / 10;
  }

  // Yearly pro-rata: fraction of remaining days in year
  const startOfYear = new Date(targetYear, 0, 1);
  const endOfYear = new Date(targetYear, 11, 31);
  const totalDaysInYear = Math.round((endOfYear.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const remainingDays = Math.round((endOfYear.getTime() - joinDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  const proRated = (entitlementPerYear * Math.max(0, remainingDays)) / totalDaysInYear;
  return Math.round(proRated * 2) / 2; // Round to nearest 0.5 day
}

/**
 * Calculates carry forward rollover and lapsed leaves at year-end based on policy limits.
 */
export function calculateCarryForward(
  balance: number,
  policy: Pick<LeavePolicy, "carryForwardAllowed" | "maxCarryForwardDays">,
): CarryForwardResult {
  if (balance <= 0) {
    return {
      currentBalance: 0,
      carriedForward: 0,
      lapsed: 0,
      capApplied: false,
    };
  }

  if (!policy.carryForwardAllowed) {
    return {
      currentBalance: balance,
      carriedForward: 0,
      lapsed: balance,
      capApplied: false,
    };
  }

  const maxCap = Math.max(0, policy.maxCarryForwardDays || 0);
  const carriedForward = Math.min(balance, maxCap);
  const lapsed = Math.max(0, balance - carriedForward);

  return {
    currentBalance: balance,
    carriedForward,
    lapsed,
    capApplied: balance > maxCap,
  };
}

/**
 * Calculates statutory leave encashment value.
 */
export function calculateLeaveEncashment(
  eligibleDays: number,
  dailyBasicRate: number,
  policy: Pick<LeavePolicy, "encashmentAllowed" | "maxEncashmentDays">,
): EncashmentResult {
  if (!policy.encashmentAllowed || eligibleDays <= 0 || dailyBasicRate <= 0) {
    return {
      eligibleDays,
      encashableDays: 0,
      dailyRate: dailyBasicRate,
      totalEncashmentAmount: 0,
    };
  }

  const maxCap = Math.max(0, policy.maxEncashmentDays || 0);
  const encashableDays = Math.min(eligibleDays, maxCap);
  const totalEncashmentAmount = Math.round(encashableDays * dailyBasicRate);

  return {
    eligibleDays,
    encashableDays,
    dailyRate: dailyBasicRate,
    totalEncashmentAmount,
  };
}
