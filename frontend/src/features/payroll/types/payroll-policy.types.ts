/**
 * Dynamic Payroll & Statutory Compensation Policy Types (Stored in DB via Backend API)
 */

export interface PayrollPolicy {
  id: string;
  name: string;
  description?: string;
  isDefault: boolean;
  payCycle: "CalendarMonth" | "Fixed30Days" | "WorkingDaysOnly";
  basicPercentageOfGross: number;      // Standard: 50%
  hraPercentageOfBasic: number;        // Standard: 40% (non-metro) or 50% (metro)
  pfCalculationBasis: "StatutoryWageCeiling" | "ActualBasic" | "Disabled";
  pfWageCeiling: number;               // Statutory ceiling: 15,000 INR
  pfEmployeeRate: number;              // 12%
  pfEmployerRate: number;              // 12%
  isEsiEnabled: boolean;               // ESI applicability toggle
  esiWageCeiling: number;              // Statutory ceiling: 21,000 INR
  esiEmployeeRate: number;             // 0.75%
  esiEmployerRate: number;             // 3.25%
  professionalTaxMonthly: number;      // e.g. 200 INR
  payDayOfMonth: number;               // e.g. 1st or 7th of month
  allowNegativeTakeHome: boolean;      // default false
  companyId?: string;
  projectId?: string;
  status: "Active" | "Draft" | "Archived";
  createdAt?: string;
  updatedAt?: string;
}

export const DEFAULT_FALLBACK_PAYROLL_POLICY: PayrollPolicy = {
  id: "default-system-payroll-policy",
  name: "Standard Indian Statutory Wage Policy",
  description: "Default statutory compensation policy compliant with Indian Code on Wages",
  isDefault: true,
  payCycle: "Fixed30Days",
  basicPercentageOfGross: 50,
  hraPercentageOfBasic: 40,
  pfCalculationBasis: "StatutoryWageCeiling",
  pfWageCeiling: 15000,
  pfEmployeeRate: 12,
  pfEmployerRate: 12,
  isEsiEnabled: true,
  esiWageCeiling: 21000,
  esiEmployeeRate: 0.75,
  esiEmployerRate: 3.25,
  professionalTaxMonthly: 200,
  payDayOfMonth: 1,
  allowNegativeTakeHome: false,
  status: "Active",
};
