import { z } from "zod";

export const travelExpensePolicySchema = z.object({
  name: z.string().min(2, "Policy name must be at least 2 characters").max(200),
  description: z.string().max(1000).optional().default(""),
  isDefault: z.boolean().default(false),
  maxDailyLodgingAllowance: z.coerce.number().min(0, "Lodging allowance cannot be negative"),
  maxDailyMealsAllowance: z.coerce.number().min(0, "Meals allowance cannot be negative"),
  mileageRatePerKmCar: z.coerce.number().min(0, "Car mileage rate cannot be negative"),
  mileageRatePerKmBike: z.coerce.number().min(0, "Bike mileage rate cannot be negative"),
  requiresAdvanceApproval: z.boolean().default(true),
  approvalThresholdAmount: z.coerce.number().min(0, "Approval threshold cannot be negative"),
  maxAdvancePercentage: z.coerce.number().min(0).max(100, "Advance percentage must be between 0 and 100"),
  receiptRequiredAboveAmount: z.coerce.number().min(0, "Receipt requirement threshold cannot be negative"),
  expenseSubmissionWindowDays: z.coerce.number().int().min(1, "Submission window must be at least 1 day").max(365),
  status: z.enum(["Active", "Draft", "Archived"]).default("Active"),
  companyId: z.string().optional().nullable(),
  projectId: z.string().optional().nullable(),
});

export type TravelExpensePolicyInput = z.infer<typeof travelExpensePolicySchema>;

export function validateTravelExpensePolicy(data: unknown) {
  const result = travelExpensePolicySchema.safeParse(data);
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
