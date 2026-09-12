import { z } from "zod";

export const probationPolicySchema = z.object({
  name: z.string().min(2, "Policy name must be at least 2 characters").max(200),
  description: z.string().max(1000).optional().default(""),
  isDefault: z.boolean().default(false),
  defaultProbationMonths: z.coerce.number().int().min(1, "Probation period must be at least 1 month").max(24, "Probation period cannot exceed 24 months"),
  maxExtensionMonths: z.coerce.number().int().min(0, "Extension months cannot be negative").max(12, "Extension cannot exceed 12 months"),
  noticePeriodDaysProbation: z.coerce.number().int().min(0, "Notice period cannot be negative").max(180, "Notice period cannot exceed 180 days"),
  noticePeriodDaysConfirmed: z.coerce.number().int().min(0, "Confirmed notice period cannot be negative").max(180, "Notice period cannot exceed 180 days"),
  evaluationReminderDaysBeforeEnd: z.coerce.number().int().min(1, "Reminder must be at least 1 day prior").max(90, "Reminder cannot exceed 90 days"),
  requiresManagerReview: z.boolean().default(true),
  requiresHodApproval: z.boolean().default(true),
  autoConfirmationAllowed: z.boolean().default(false),
  minimumReviewScoreForConfirmation: z.coerce.number().int().min(0, "Score cannot be negative").max(100, "Score cannot exceed 100%"),
  status: z.enum(["Active", "Draft", "Archived"]).default("Active"),
  companyId: z.string().optional().nullable(),
  projectId: z.string().optional().nullable(),
});

export type ProbationPolicyInput = z.infer<typeof probationPolicySchema>;

export function validateProbationPolicy(data: unknown) {
  const result = probationPolicySchema.safeParse(data);
  if (!result.success) {
    return {
      success: false as const,
      error: result.error.issues.map((i) => i.message).join(", "),
      data: null,
    };
  }
  return {
    success: true as const,
    error: null,
    data: result.data,
  };
}
