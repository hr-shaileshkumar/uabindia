import { z } from "zod";

export const leavePolicySchema = z
  .object({
    name: z.string().trim().min(2, "Policy name must be at least 2 characters").max(100),
    description: z.string().trim().optional(),
    isDefault: z.boolean().default(false),
    type: z.string().trim().min(1, "Leave type is required"),
    leaveTypeCode: z.string().trim().max(10).optional(),
    entitlementPerYear: z.coerce
      .number()
      .min(0, "Entitlement cannot be negative")
      .max(365, "Entitlement cannot exceed 365 days"),
    allocationFrequency: z.enum(["Yearly", "Monthly", "Quarterly"]),
    carryForwardAllowed: z.boolean().default(false),
    maxCarryForwardDays: z.coerce.number().min(0, "Max carry forward cannot be negative").default(0),
    encashmentAllowed: z.boolean().default(false),
    maxEncashmentDays: z.coerce.number().min(0, "Max encashment cannot be negative").default(0),
    sandwichRuleEnabled: z.boolean().default(false),
    allowDuringProbation: z.boolean().default(false),
    minServiceDaysRequired: z.coerce.number().min(0, "Minimum service days cannot be negative").default(0),
    maxConsecutiveDays: z.coerce.number().min(1, "Max consecutive days must be at least 1").default(30),
    noticePeriodDays: z.coerce.number().min(0, "Notice period days cannot be negative").default(0),
    requiresProofDocument: z.boolean().default(false),
    proofRequiredAfterDays: z.coerce.number().min(1, "Proof required after days must be at least 1").default(2),
    companyId: z.string().optional(),
    projectId: z.string().optional(),
    status: z.enum(["Active", "Draft", "Archived"]).default("Active"),
  })
  .refine(
    (data) => {
      if (data.carryForwardAllowed && data.maxCarryForwardDays <= 0) {
        return false;
      }
      return true;
    },
    {
      message: "Max carry-forward days must be greater than 0 when carry-forward is enabled",
      path: ["maxCarryForwardDays"],
    },
  )
  .refine(
    (data) => {
      if (data.encashmentAllowed && data.maxEncashmentDays <= 0) {
        return false;
      }
      return true;
    },
    {
      message: "Max encashment days must be greater than 0 when encashment is enabled",
      path: ["maxEncashmentDays"],
    },
  );

export type LeavePolicyFormValues = z.infer<typeof leavePolicySchema>;
