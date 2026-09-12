import type { PayrollPolicy } from "../types/payroll-policy.types";

export interface SalaryStructureInput {
  grossSalary: number;
  basicSalary?: number;
  totalMonthDays?: number;
  lopDays?: number;
  pfOptOut?: boolean;
  pfCappedAtStatutoryLimit?: boolean; // Cap PF calculation at statutory wage ceiling Rs 15,000 (Rs 1,800/mo)
  isEsiApplicable?: boolean;
  professionalTaxMonthly?: number;
  monthlyTdsDeduction?: number;
  additionalEarnings?: number;
  additionalDeductions?: number;
  policy?: Partial<PayrollPolicy>;
}

export interface PayrollBreakdown {
  grossSalary: number;
  basicSalary: number;
  hra: number;
  specialAllowance: number;
  lopDays: number;
  lopDeduction: number;
  adjustedGrossEarnings: number;
  employeePf: number;
  employerPf: number;
  employeeEsi: number;
  employerEsi: number;
  professionalTax: number;
  tdsDeduction: number;
  totalDeductions: number;
  netSalary: number;
  isNegativeNetPay: boolean;
  anomalies: string[];
}

export const STATUTORY_CONSTANTS = {
  PF_EMPLOYEE_RATE: 0.12,
  PF_EMPLOYER_RATE: 0.12,
  PF_WAGE_CEILING: 15000,
  PF_MAX_MONTHLY_CONTRIBUTION: 1800, // 15,000 * 12%
  ESI_WAGE_CEILING: 21000,
  ESI_EMPLOYEE_RATE: 0.0075, // 0.75%
  ESI_EMPLOYER_RATE: 0.0325, // 3.25%
  DEFAULT_PROFESSIONAL_TAX: 200,
};

/**
 * Calculates itemized salary components, statutory social security, and net take-home pay.
 * Dynamically prioritizes active database-backed PayrollPolicy when provided.
 */
export function calculateSalaryBreakdown(input: SalaryStructureInput): PayrollBreakdown {
  const {
    grossSalary,
    basicSalary: customBasic,
    totalMonthDays = 30,
    lopDays = 0,
    pfOptOut = false,
    pfCappedAtStatutoryLimit = true,
    isEsiApplicable,
    professionalTaxMonthly,
    monthlyTdsDeduction = 0,
    additionalEarnings = 0,
    additionalDeductions = 0,
    policy,
  } = input;

  const anomalies: string[] = [];

  // Dynamic policy resolution
  const basicRatio = (policy?.basicPercentageOfGross ?? 50) / 100;
  const basicSalary = customBasic !== undefined ? customBasic : Math.round(grossSalary * basicRatio);

  const hraRatio = (policy?.hraPercentageOfBasic ?? 40) / 100;
  const hra = Math.round(basicSalary * hraRatio);

  // Special allowance is balancing figure
  const specialAllowance = Math.max(0, grossSalary - (basicSalary + hra));

  // Loss of Pay (LOP) calculation
  const lopDeduction =
    lopDays > 0 && totalMonthDays > 0
      ? Math.round((grossSalary / totalMonthDays) * Math.min(lopDays, totalMonthDays))
      : 0;

  if (lopDays > totalMonthDays) {
    anomalies.push(`LOP days (${lopDays}) exceed total month days (${totalMonthDays}).`);
  }

  const adjustedGrossEarnings = Math.max(0, grossSalary - lopDeduction + additionalEarnings);

  // Pro-rata adjusted basic for statutory calculations
  const adjustedBasic = Math.max(
    0,
    lopDays > 0 && totalMonthDays > 0
      ? Math.round((basicSalary / totalMonthDays) * Math.max(0, totalMonthDays - lopDays))
      : basicSalary,
  );

  // Provident Fund (PF) calculation
  let employeePf = 0;
  let employerPf = 0;
  const pfBasis = policy?.pfCalculationBasis ?? (pfCappedAtStatutoryLimit ? "StatutoryWageCeiling" : "ActualBasic");
  const pfEmployeeRate = (policy?.pfEmployeeRate ?? 12) / 100;
  const pfEmployerRate = (policy?.pfEmployerRate ?? 12) / 100;
  const pfCeiling = policy?.pfWageCeiling ?? STATUTORY_CONSTANTS.PF_WAGE_CEILING;

  if (!pfOptOut && pfBasis !== "Disabled") {
    if (pfBasis === "StatutoryWageCeiling") {
      const eligiblePfWage = Math.min(adjustedBasic, pfCeiling);
      employeePf = Math.round(eligiblePfWage * pfEmployeeRate);
      employerPf = Math.round(eligiblePfWage * pfEmployerRate);
    } else {
      employeePf = Math.round(adjustedBasic * pfEmployeeRate);
      employerPf = Math.round(adjustedBasic * pfEmployerRate);
    }
  }

  // Employee State Insurance (ESI) calculation
  const esiEnabled = policy?.isEsiEnabled ?? true;
  const esiCeiling = policy?.esiWageCeiling ?? STATUTORY_CONSTANTS.ESI_WAGE_CEILING;
  const esiEmployeeRate = (policy?.esiEmployeeRate ?? 0.75) / 100;
  const esiEmployerRate = (policy?.esiEmployerRate ?? 3.25) / 100;

  const eligibleForEsi =
    esiEnabled &&
    (isEsiApplicable !== undefined
      ? isEsiApplicable
      : adjustedGrossEarnings <= esiCeiling);

  let employeeEsi = 0;
  let employerEsi = 0;
  if (eligibleForEsi && adjustedGrossEarnings > 0) {
    employeeEsi = Math.round(adjustedGrossEarnings * esiEmployeeRate);
    employerEsi = Math.round(adjustedGrossEarnings * esiEmployerRate);
  }

  const ptDeduction =
    policy?.professionalTaxMonthly ??
    professionalTaxMonthly ??
    STATUTORY_CONSTANTS.DEFAULT_PROFESSIONAL_TAX;

  // Total Employee Deductions
  const totalDeductions =
    employeePf +
    employeeEsi +
    ptDeduction +
    monthlyTdsDeduction +
    additionalDeductions;

  const netSalary = Math.round((adjustedGrossEarnings - totalDeductions) * 100) / 100;
  const isNegativeNetPay = netSalary < 0;

  if (isNegativeNetPay) {
    anomalies.push(`Net take-home salary is negative (${netSalary}). Deductions exceed earnings.`);
  }

  return {
    grossSalary,
    basicSalary,
    hra,
    specialAllowance,
    lopDays,
    lopDeduction,
    adjustedGrossEarnings,
    employeePf,
    employerPf,
    employeeEsi,
    employerEsi,
    professionalTax: ptDeduction,
    tdsDeduction: monthlyTdsDeduction,
    totalDeductions,
    netSalary,
    isNegativeNetPay,
    anomalies,
  };
}
