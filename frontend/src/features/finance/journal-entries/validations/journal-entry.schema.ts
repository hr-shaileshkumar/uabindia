import { z } from "zod";

export const journalLineSchema = z
  .object({
    accountId: z.string().min(1, "Account is required"),
    debitAmount: z.number().min(0, "Debit amount cannot be negative").default(0),
    creditAmount: z.number().min(0, "Credit amount cannot be negative").default(0),
    description: z.string().optional(),
  })
  .refine(
    (line) =>
      (line.debitAmount > 0 && line.creditAmount === 0) ||
      (line.creditAmount > 0 && line.debitAmount === 0),
    {
      message: "A line must have either debit or credit greater than 0, but not both.",
      path: ["debitAmount"],
    },
  );

export type JournalLineInput = z.infer<typeof journalLineSchema>;

export const journalEntrySchema = z
  .object({
    entryDate: z.string().min(1, "Entry date is required"),
    referenceNumber: z.string().optional(),
    narration: z.string().optional(),
    description: z.string().optional(),
    lines: z.array(journalLineSchema).min(2, "At least two lines are required"),
  })
  .refine(
    (entry) => {
      const totalDebit = entry.lines.reduce((sum, line) => sum + (Number(line.debitAmount) || 0), 0);
      const totalCredit = entry.lines.reduce((sum, line) => sum + (Number(line.creditAmount) || 0), 0);
      return Math.abs(totalDebit - totalCredit) < 0.01 && totalDebit > 0;
    },
    {
      message: "Journal entry is unbalanced: Total Debits must equal Total Credits and be greater than zero.",
      path: ["lines"],
    },
  );

export type JournalEntryInput = z.infer<typeof journalEntrySchema>;

export function validateJournalEntry(payload: unknown): {
  success: boolean;
  data?: JournalEntryInput;
  error?: string;
  errors?: string[];
} {
  const result = journalEntrySchema.safeParse(payload);
  if (result.success) {
    return { success: true, data: result.data };
  }

  const issues = result.error.issues;
  const errors = issues.map((issue) => issue.message);
  return {
    success: false,
    error: errors[0] ?? "Validation failed",
    errors,
  };
}
