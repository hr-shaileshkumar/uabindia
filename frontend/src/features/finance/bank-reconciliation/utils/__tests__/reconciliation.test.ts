import { describe, expect, it } from "vitest";
import {
  currentPeriod,
  STATUS_CONFIG,
} from "../../types/reconciliation.types";
import { SAMPLE_FEEDS } from "../sample-feeds";

describe("bank-reconciliation utilities & models", () => {
  it("generates the current period in YYYY-MM format", () => {
    const period = currentPeriod();
    expect(period).toMatch(/^\d{4}-\d{2}$/);
    const now = new Date();
    const expectedMonth = String(now.getMonth() + 1).padStart(2, "0");
    expect(period.endsWith(expectedMonth)).toBe(true);
  });

  it("provides comprehensive status configurations for all recon states", () => {
    expect(STATUS_CONFIG.Matched.label).toBe("Zero-Delta Matched");
    expect(STATUS_CONFIG.Partial.label).toBe("Partial Match");
    expect(STATUS_CONFIG.Unmatched.label).toBe("Discrepancy / Unmatched");
    expect(STATUS_CONFIG.Pending.label).toBe("Pending Review");
  });

  it("calculates accurate reconciliation delta and determines match status", () => {
    const calculateDeltaStatus = (bookBalance: number, bankBalance: number) => {
      const difference = Math.round((bookBalance - bankBalance) * 100) / 100;
      let status: "Matched" | "Partial" | "Unmatched" = "Unmatched";
      if (Math.abs(difference) === 0) {
        status = "Matched";
      } else if (Math.abs(difference) < 100) {
        status = "Partial";
      }
      return { difference, status };
    };

    // Zero delta
    const zeroDelta = calculateDeltaStatus(500000, 500000);
    expect(zeroDelta.difference).toBe(0);
    expect(zeroDelta.status).toBe("Matched");

    // Small variance (<100)
    const minorVariance = calculateDeltaStatus(500045, 500000);
    expect(minorVariance.difference).toBe(45);
    expect(minorVariance.status).toBe("Partial");

    // Large discrepancy
    const largeVariance = calculateDeltaStatus(520000, 500000);
    expect(largeVariance.difference).toBe(20000);
    expect(largeVariance.status).toBe("Unmatched");
  });

  it("provides valid OFX and CSV sample feeds for testing", () => {
    expect(SAMPLE_FEEDS.ofx).toContain("<OFX>");
    expect(SAMPLE_FEEDS.ofx).toContain("50200012345678");
    expect(SAMPLE_FEEDS.csv).toContain("Date,Description,Reference,Type,Amount");
  });
});
