import { z } from "zod";

export const payrollPolicySchema = z.object({
  name: z.string().min(2, "Policy name must be at least 2 characters").max(100),
  description: z.string().optional(),
  isDefault: z.boolean().default(false),
  payCycle: z.enum(["CalendarMonth", "Fixed30Days", "WorkingDaysOnly"]).default("Fixed30Days"),
  basicPercentageOfGross: z
    .number()
    .min(10, "Basic salary must be at least 10% of gross")
    .max(100, "Basic salary cannot exceed 100% of gross")
    .default(50),
  hraPercentageOfBasic: z
    .number()
    .min(0, "HRA cannot be negative")
    .max(100, "HRA cannot exceed 100% of basic")
    .default(40),
  pfCalculationBasis: z
    .enum(["StatutoryWageCeiling", "ActualBasic", "Disabled"])
    .default("StatutoryWageCeiling"),
  pfWageCeiling: z.number().min(0, "PF ceiling cannot be negative").default(15000),
  pfEmployeeRate: z.number().min(0).max(100).default(12),
  pfEmployerRate: z.number().min(0).max(100).default(12),
  isEsiEnabled: z.boolean().default(true),
  esiWageCeiling: z.number().min(0, "ESI ceiling cannot be negative").default(21000),
  esiEmployeeRate: z.number().min(0).max(100).default(0.75),
  esiEmployerRate: z.number().min(0).max(100).default(3.25),
  professionalTaxMonthly: z.number().min(0).default(200),
  payDayOfMonth: z.number().min(1).max(31).default(1),
  allowNegativeTakeHome: z.boolean().default(false),
  status: z.enum(["Active", "Draft", "Archived"]).default("Active"),
  companyId: z.string().optional(),
  projectId: z.string().optional(),
});

export type PayrollPolicyInput = z.infer<typeof payrollPolicySchema>;

export function validatePayrollPolicy(payload: unknown): {
  success: boolean;
  data?: PayrollPolicyInput;
  error?: string;
  errors?: string[];
} {
  const result = payrollPolicySchema.safeParse(payload);
  if (result.success) {
    return { success: true, data: result.data };
  }

  const issues = result.error.issues;
  const errors = issues.map((i) => i.message);
  return {
    success: false,
    error: errors[0] ?? "Validation failed",
    errors,
  };
}
