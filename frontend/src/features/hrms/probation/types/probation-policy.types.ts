/**
 * HR Core Confirmation & Probation Policy Type Definitions
 * Enterprise Governance for Bavya Health Services Pvt. Ltd.
 */

export interface ProbationPolicy {
  id: string;
  name: string;
  description?: string;
  isDefault: boolean;
  defaultProbationMonths: number;
  maxExtensionMonths: number;
  noticePeriodDaysProbation: number;
  noticePeriodDaysConfirmed: number;
  evaluationReminderDaysBeforeEnd: number;
  requiresManagerReview: boolean;
  requiresHodApproval: boolean;
  autoConfirmationAllowed: boolean;
  minimumReviewScoreForConfirmation: number;
  companyId?: string;
  projectId?: string;
  status: "Active" | "Draft" | "Archived";
  createdAt?: string;
  updatedAt?: string;
}
