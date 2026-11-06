import { describe, expect, it } from "vitest";
import {
  calculateEffectiveLeaveDays,
  calculateProRatedEntitlement,
  calculateCarryForward,
  calculateLeaveEncashment,
} from "../leave-calculator";

describe("Leave Calculation Engine", () => {
  describe("calculateEffectiveLeaveDays", () => {
    it("returns 0.5 for half-day requests", () => {
      const res = calculateEffectiveLeaveDays({
        fromDate: "2026-05-10",
        toDate: "2026-05-10",
        isHalfDay: true,
      });
      expect(res.effectiveLeaveDays).toBe(0.5);
      expect(res.isHalfDay).toBe(true);
    });

    it("calculates normal weekday leave days accurately", () => {
      // 2026-05-04 is Monday, 2026-05-06 is Wednesday (3 days)
      const res = calculateEffectiveLeaveDays({
        fromDate: "2026-05-04",
        toDate: "2026-05-06",
      });
      expect(res.totalCalendarDays).toBe(3);
      expect(res.weekendsCount).toBe(0);
      expect(res.holidaysCount).toBe(0);
      expect(res.effectiveLeaveDays).toBe(3);
    });

    it("excludes weekends when sandwich rule is disabled", () => {
      // 2026-05-08 (Friday) to 2026-05-11 (Monday) -> 4 calendar days (Fri, Sat, Sun, Mon)
      const res = calculateEffectiveLeaveDays({
        fromDate: "2026-05-08",
        toDate: "2026-05-11",
        sandwichRuleEnabled: false,
      });
      expect(res.totalCalendarDays).toBe(4);
      expect(res.weekendsCount).toBe(2);
      expect(res.effectiveLeaveDays).toBe(2); // Friday and Monday only
    });

    it("includes weekends when sandwich rule is enabled", () => {
      // 2026-05-08 (Friday) to 2026-05-11 (Monday) -> 4 calendar days (Fri, Sat, Sun, Mon)
      const res = calculateEffectiveLeaveDays({
        fromDate: "2026-05-08",
        toDate: "2026-05-11",
        sandwichRuleEnabled: true,
      });
      expect(res.totalCalendarDays).toBe(4);
      expect(res.effectiveLeaveDays).toBe(4); // All 4 days count
      expect(res.sandwichedDaysCount).toBe(2);
    });

    it("deducts public holidays during normal calculation", () => {
      // 2026-05-04 (Mon) to 2026-05-06 (Wed) with holiday on 2026-05-05 (Tue)
      const res = calculateEffectiveLeaveDays({
        fromDate: "2026-05-04",
        toDate: "2026-05-06",
        holidays: ["2026-05-05"],
        sandwichRuleEnabled: false,
      });
      expect(res.totalCalendarDays).toBe(3);
      expect(res.holidaysCount).toBe(1);
      expect(res.effectiveLeaveDays).toBe(2);
    });
  });

  describe("calculateProRatedEntitlement", () => {
    it("returns full entitlement if employee joined before target year", () => {
      const quota = calculateProRatedEntitlement(18, "2024-01-15", "Yearly", 2026);
      expect(quota).toBe(18);
    });

    it("pro-rates monthly accrual for mid-year joiner", () => {
      // Joined July 1st (month index 6) -> 6 remaining months in the year (July to Dec)
      // 18 days / 12 months = 1.5 days/month * 6 = 9 days
      const quota = calculateProRatedEntitlement(18, "2026-07-01", "Monthly", 2026);
      expect(quota).toBe(9);
    });

    it("returns 0 if employee joins in a future year", () => {
      const quota = calculateProRatedEntitlement(18, "2027-01-01", "Monthly", 2026);
      expect(quota).toBe(0);
    });
  });

  describe("calculateCarryForward", () => {
    it("caps carry forward and calculates lapsed days", () => {
      const res = calculateCarryForward(45, {
        carryForwardAllowed: true,
        maxCarryForwardDays: 30,
      });
      expect(res.carriedForward).toBe(30);
      expect(res.lapsed).toBe(15);
      expect(res.capApplied).toBe(true);
    });

    it("lapses all remaining balance when carry forward is disabled", () => {
      const res = calculateCarryForward(20, {
        carryForwardAllowed: false,
        maxCarryForwardDays: 0,
      });
      expect(res.carriedForward).toBe(0);
      expect(res.lapsed).toBe(20);
      expect(res.capApplied).toBe(false);
    });
  });

  describe("calculateLeaveEncashment", () => {
    it("calculates encashment amount capped by maxEncashmentDays", () => {
      const res = calculateLeaveEncashment(20, 1500, {
        encashmentAllowed: true,
        maxEncashmentDays: 10,
      });
      expect(res.encashableDays).toBe(10);
      expect(res.dailyRate).toBe(1500);
      expect(res.totalEncashmentAmount).toBe(15000);
    });

    it("returns 0 when encashment is not allowed", () => {
      const res = calculateLeaveEncashment(20, 1500, {
        encashmentAllowed: false,
        maxEncashmentDays: 10,
      });
      expect(res.encashableDays).toBe(0);
      expect(res.totalEncashmentAmount).toBe(0);
    });
  });
});
