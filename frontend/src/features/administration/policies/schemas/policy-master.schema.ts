import { z } from "zod";

export const policyCategorySchema = z.enum([
  "HR_CORE",
  "ATTENDANCE_TIMESHEET",
  "LEAVE",
  "PAYROLL_COMPENSATION",
  "STATUTORY_COMPLIANCE",
  "RECRUITMENT",
  "EMPLOYEE_LIFECYCLE",
  "TRAVEL_EXPENSE",
  "PERFORMANCE",
  "DISCIPLINE_RELATIONS",
  "ASSET_ADMIN",
  "DOCUMENT_KYC",
  "IT_ERP",
  "SEPARATION",
]);

export const workflowApprovalStepSchema = z.object({
  level: z.number().int().min(1),
  role: z.enum(["ReportingManager", "DepartmentHead", "HR", "Finance", "MedicalDirector", "ManagingDirector"]),
  slaHours: z.number().int().min(1).default(48),
  canReject: z.boolean().default(true),
  canRequestClarification: z.boolean().default(true),
});

export const policyApprovalWorkflowSchema = z.object({
  workflowType: z.enum(["AutoApprove", "SingleLevel", "MultiLevel", "ThresholdBased"]).default("SingleLevel"),
  thresholdAmount: z.number().optional(),
  thresholdDays: z.number().optional(),
  levels: z.array(workflowApprovalStepSchema).default([]),
  allowEmployeeDispute: z.boolean().default(true),
  disputeWindowDays: z.number().int().min(1).default(7),
  autoApproveOnSlaExpiry: z.boolean().default(false),
});

export const policyApplicabilityScopeSchema = z.object({
  companyIds: z.array(z.string()).optional().default([]),
  branchIds: z.array(z.string()).optional().default([]),
  departmentIds: z.array(z.string()).optional().default([]),
  employmentTypes: z
    .array(z.enum(["Permanent", "Contract", "Intern", "DoctorConsultant", "Probationary"]))
    .optional()
    .default([]),
  grades: z.array(z.string()).optional().default([]),
  excludedEmployeeIds: z.array(z.string()).optional().default([]),
});

export const policyVersionSchema = z
  .object({
    version: z.string().trim().min(1, "Version is required (e.g. 1.0)"),
    effectiveFrom: z.string().min(10, "Effective From date is required"),
    effectiveTo: z.string().nullable().optional(),
    status: z.enum(["Active", "Draft", "Archived"]).default("Draft"),
    changeLogReason: z.string().trim().min(3, "Changelog reason is required for audit"),
    authorName: z.string().trim().min(2, "Author name is required"),
    applicability: policyApplicabilityScopeSchema.default({
      companyIds: [],
      branchIds: [],
      departmentIds: [],
      employmentTypes: [],
      grades: [],
      excludedEmployeeIds: [],
    }),
    ruleConfig: z.record(z.string(), z.any()).default({}),
    approvalWorkflow: policyApprovalWorkflowSchema.default({
      workflowType: "SingleLevel",
      levels: [{ level: 1, role: "ReportingManager", slaHours: 48, canReject: true, canRequestClarification: true }],
      allowEmployeeDispute: true,
      disputeWindowDays: 7,
      autoApproveOnSlaExpiry: false,
    }),
  })
  .refine(
    (data) => {
      if (data.effectiveTo && data.effectiveTo < data.effectiveFrom) {
        return false;
      }
      return true;
    },
    {
      message: "Effective To date cannot be earlier than Effective From date",
      path: ["effectiveTo"],
    },
  );

export const policyMasterSchema = z.object({
  code: z
    .string()
    .trim()
    .min(3, "Code must be at least 3 characters")
    .max(50)
    .regex(/^[A-Z0-9_]+$/, "Code must be UPPERCASE letters, numbers, or underscores"),
  category: policyCategorySchema,
  name: z.string().trim().min(3, "Policy name is required").max(120),
  description: z.string().trim().min(5, "Description must be at least 5 characters"),
  companyId: z.string().optional(),
  projectId: z.string().optional(),
  isMandatoryAcknowledgment: z.boolean().default(false),
  isSystemCritical: z.boolean().default(false),
  priority: z.number().int().min(1).default(10),
  status: z.enum(["Active", "Draft", "Archived"]).default("Active"),
});

export type PolicyMasterFormValues = z.infer<typeof policyMasterSchema>;
export type PolicyVersionFormValues = z.infer<typeof policyVersionSchema>;
