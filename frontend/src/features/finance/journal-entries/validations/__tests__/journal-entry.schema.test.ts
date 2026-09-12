import { describe, expect, it } from "vitest";
import {
  journalEntrySchema,
  validateJournalEntry,
} from "../journal-entry.schema";

describe("journalEntrySchema - Double-Entry Bookkeeping Validation", () => {
  it("should validate a valid, balanced double-entry journal voucher", () => {
    const validEntry = {
      entryDate: "2026-09-08",
      referenceNumber: "JV-2026-001",
      narration: "Office supplies payment via HDFC Bank",
      lines: [
        {
          accountId: "acc-expense-office",
          debitAmount: 1500,
          creditAmount: 0,
          description: "Printer paper and ink cartridges",
        },
        {
          accountId: "acc-asset-bank-hdfc",
          debitAmount: 0,
          creditAmount: 1500,
          description: "HDFC current account payment",
        },
      ],
    };

    const result = validateJournalEntry(validEntry);
    expect(result.success).toBe(true);
    expect(result.data?.lines.length).toBe(2);
    expect(result.error).toBeUndefined();
  });

  it("should reject an unbalanced journal entry where debits do not equal credits", () => {
    const unbalancedEntry = {
      entryDate: "2026-09-08",
      lines: [
        { accountId: "acc-1", debitAmount: 2000, creditAmount: 0 },
        { accountId: "acc-2", debitAmount: 0, creditAmount: 1500 },
      ],
    };

    const result = validateJournalEntry(unbalancedEntry);
    expect(result.success).toBe(false);
    expect(result.error).toContain("unbalanced");
  });

  it("should reject a line with both debit and credit populated", () => {
    const invalidLineEntry = {
      entryDate: "2026-09-08",
      lines: [
        { accountId: "acc-1", debitAmount: 500, creditAmount: 200 },
        { accountId: "acc-2", debitAmount: 0, creditAmount: 300 },
      ],
    };

    const result = validateJournalEntry(invalidLineEntry);
    expect(result.success).toBe(false);
    expect(result.error).toContain("either debit or credit");
  });

  it("should reject an entry with fewer than 2 lines", () => {
    const singleLineEntry = {
      entryDate: "2026-09-08",
      lines: [{ accountId: "acc-1", debitAmount: 1000, creditAmount: 0 }],
    };

    const result = validateJournalEntry(singleLineEntry);
    expect(result.success).toBe(false);
    expect(result.error).toContain("At least two lines are required");
  });

  it("should reject when debits and credits are both zero", () => {
    const zeroEntry = {
      entryDate: "2026-09-08",
      lines: [
        { accountId: "acc-1", debitAmount: 0, creditAmount: 0 },
        { accountId: "acc-2", debitAmount: 0, creditAmount: 0 },
      ],
    };

    const result = validateJournalEntry(zeroEntry);
    expect(result.success).toBe(false);
  });

  it("should validate multi-line compound journal entries with matching totals", () => {
    const compoundEntry = {
      entryDate: "2026-09-08",
      referenceNumber: "JV-COMPOUND-01",
      lines: [
        { accountId: "acc-salary-expense", debitAmount: 50000, creditAmount: 0 },
        { accountId: "acc-tax-payable", debitAmount: 0, creditAmount: 5000 },
        { accountId: "acc-pf-payable", debitAmount: 0, creditAmount: 6000 },
        { accountId: "acc-bank-payout", debitAmount: 0, creditAmount: 39000 },
      ],
    };

    const result = validateJournalEntry(compoundEntry);
    expect(result.success).toBe(true);
    expect(result.data?.lines.length).toBe(4);
  });
});
