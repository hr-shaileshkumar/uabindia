/**
 * Travel & Expense Policy Type Definitions
 * Enterprise Governance for Bavya Health Services Pvt. Ltd.
 */

export interface TravelExpensePolicy {
  id: string;
  name: string;
  description?: string;
  isDefault: boolean;
  maxDailyLodgingAllowance: number;
  maxDailyMealsAllowance: number;
  mileageRatePerKmCar: number;
  mileageRatePerKmBike: number;
  requiresAdvanceApproval: boolean;
  approvalThresholdAmount: number;
  maxAdvancePercentage: number;
  receiptRequiredAboveAmount: number;
  expenseSubmissionWindowDays: number;
  companyId?: string;
  projectId?: string;
  status: "Active" | "Draft" | "Archived";
  createdAt?: string;
  updatedAt?: string;
}
