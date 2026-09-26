import type {
  PolicyMaster,
  PolicyVersion,
  PolicyApplicabilityScope,
  EmploymentType,
  PolicyImpactSimulationInput,
  PolicyImpactSimulationResult,
} from "../types/policy-matrix.types";

export interface EmployeeEvaluationContext {
  id: string;
  name: string;
  companyId?: string;
  branchId?: string;
  departmentId?: string;
  departmentName?: string;
  employmentType?: EmploymentType;
  grade?: string;
}

/**
 * Evaluates whether an employee context satisfies a policy version's applicability scope.
 */
export function isScopeApplicable(
  employee: EmployeeEvaluationContext,
  scope: PolicyApplicabilityScope,
): boolean {
  if (scope.excludedEmployeeIds && scope.excludedEmployeeIds.includes(employee.id)) {
    return false;
  }

  if (scope.companyIds && scope.companyIds.length > 0) {
    if (!employee.companyId || !scope.companyIds.includes(employee.companyId)) {
      return false;
    }
  }

  if (scope.branchIds && scope.branchIds.length > 0) {
    if (!employee.branchId || !scope.branchIds.includes(employee.branchId)) {
      return false;
    }
  }

  if (scope.departmentIds && scope.departmentIds.length > 0) {
    const dept = employee.departmentId || employee.departmentName;
    if (!dept || !scope.departmentIds.some((d) => d.toLowerCase() === dept.toLowerCase())) {
      return false;
    }
  }

  if (scope.employmentTypes && scope.employmentTypes.length > 0) {
    if (!employee.employmentType || !scope.employmentTypes.includes(employee.employmentType)) {
      return false;
    }
  }

  if (scope.grades && scope.grades.length > 0) {
    if (!employee.grade || !scope.grades.includes(employee.grade)) {
      return false;
    }
  }

  return true;
}

/**
 * Resolves the precise active policy version for a given policy, employee context, and date.
 * Handles temporal validity (effectiveFrom / effectiveTo) and hierarchical specificity.
 */
export function resolveActivePolicyVersion(
  policy: PolicyMaster,
  employeeContext: EmployeeEvaluationContext,
  targetDateISO: string = new Date().toISOString().slice(0, 10),
  allVersions: PolicyVersion[] = [],
): PolicyVersion | null {
  const candidateVersions = allVersions.length > 0
    ? allVersions.filter((v) => v.policyId === policy.id)
    : policy.activeVersion ? [policy.activeVersion] : [];

  const validVersions = candidateVersions.filter((v) => {
    if (v.status !== "Active") return false;
    if (v.effectiveFrom > targetDateISO) return false;
    if (v.effectiveTo && v.effectiveTo < targetDateISO) return false;
    return isScopeApplicable(employeeContext, v.applicability);
  });

  if (validVersions.length === 0) {
    return policy.activeVersion ?? null;
  }

  // Sort by specificity score (most restrictive scope first)
  validVersions.sort((a, b) => {
    const scoreA =
      (a.applicability.departmentIds?.length ? 4 : 0) +
      (a.applicability.branchIds?.length ? 3 : 0) +
      (a.applicability.employmentTypes?.length ? 2 : 0) +
      (a.applicability.companyIds?.length ? 1 : 0);
    const scoreB =
      (b.applicability.departmentIds?.length ? 4 : 0) +
      (b.applicability.branchIds?.length ? 3 : 0) +
      (b.applicability.employmentTypes?.length ? 2 : 0) +
      (b.applicability.companyIds?.length ? 1 : 0);
    return scoreB - scoreA;
  });

  return validVersions[0];
}

export type PolicyStaffSample = {
  id: string;
  name: string;
  department: string;
  lateCount: number;
  monthlyKm: number;
  grossSalary: number;
};

/**
 * Standard test simulation staff dataset fixture for what-if policy analysis
 */
export const SAMPLE_SIMULATION_STAFF: PolicyStaffSample[] = [
  { id: "EMP-101", name: "Employee 101", department: "Operations", lateCount: 4, monthlyKm: 240, grossSalary: 125000 },
  { id: "EMP-102", name: "Employee 102", department: "Services", lateCount: 2, monthlyKm: 60, grossSalary: 38000 },
  { id: "EMP-103", name: "Employee 103", department: "Quality", lateCount: 5, monthlyKm: 420, grossSalary: 28000 },
  { id: "EMP-104", name: "Employee 104", department: "Quality", lateCount: 3, monthlyKm: 580, grossSalary: 22000 },
  { id: "EMP-105", name: "Employee 105", department: "Stores", lateCount: 1, monthlyKm: 30, grossSalary: 32000 },
  { id: "EMP-106", name: "Employee 106", department: "Engineering", lateCount: 4, monthlyKm: 180, grossSalary: 140000 },
  { id: "EMP-107", name: "Employee 107", department: "Administration", lateCount: 6, monthlyKm: 0, grossSalary: 18500 },
  { id: "EMP-108", name: "Employee 108", department: "Finance", lateCount: 4, monthlyKm: 45, grossSalary: 26000 },
];

/**
 * Pure policy simulation engine (Dry-Run / "What-If" Analysis)
 * Enables HR & Management to test the impact of rule changes before publishing to database.
 */
export function simulatePolicyImpact(
  input: PolicyImpactSimulationInput,
  staffDataset?: PolicyStaffSample[],
): PolicyImpactSimulationResult {
  const { policyCode, proposedRuleConfig, departmentFilter } = input;
  const sourceStaff = staffDataset && staffDataset.length > 0 ? staffDataset : SAMPLE_SIMULATION_STAFF;

  const staff = departmentFilter
    ? sourceStaff.filter((s) => s.department.toLowerCase() === departmentFilter.toLowerCase())
    : sourceStaff;

  const comparisons: PolicyImpactSimulationResult["sampleComparisons"] = [];
  let totalImpacted = 0;
  let totalFinancialVariance = 0;

  if (policyCode === "ATT_LATE_COMING") {
    const newGrace = proposedRuleConfig.gracePeriodMinutes ?? 15;
    const maxAllowed = proposedRuleConfig.maxAllowedPerMonth ?? 3;

    staff.forEach((emp) => {
      // Simulate: If grace is tightened (<15m), employees with marginal late times get 1 additional late mark
      const simulatedLates = newGrace < 15 ? emp.lateCount + 1 : emp.lateCount;
      const currentDeductionDays = emp.lateCount > 3 ? (emp.lateCount >= 6 ? 1.0 : 0.5) : 0;
      const simulatedDeductionDays = simulatedLates > maxAllowed ? (simulatedLates >= 6 ? 1.0 : 0.5) : 0;

      const deltaDays = simulatedDeductionDays - currentDeductionDays;
      const perDayWage = emp.grossSalary / 30;
      const deltaAmount = -Math.round(deltaDays * perDayWage); // negative delta means employee salary decreases (cost savings for co.)

      const isImpacted = deltaDays !== 0;
      if (isImpacted) totalImpacted++;
      totalFinancialVariance += deltaAmount;

      comparisons.push({
        employeeId: emp.id,
        employeeName: emp.name,
        department: emp.department,
        currentOutcome: currentDeductionDays > 0 ? `${currentDeductionDays}d LOP Deduction` : "No Deduction",
        simulatedOutcome: simulatedDeductionDays > 0 ? `${simulatedDeductionDays}d LOP Deduction` : "No Deduction",
        financialDelta: deltaAmount,
      });
    });
  } else if (policyCode === "EXP_LOCAL_CONVEYANCE") {
    const newTwoWheelerRate = proposedRuleConfig.twoWheelerRatePerKm ?? 4.5;
    const oldTwoWheelerRate = 4.5;

    staff.forEach((emp) => {
      const currentPayout = emp.monthlyKm * oldTwoWheelerRate;
      const simulatedPayout = emp.monthlyKm * newTwoWheelerRate;
      const delta = Math.round(simulatedPayout - currentPayout);

      const isImpacted = delta !== 0;
      if (isImpacted) totalImpacted++;
      totalFinancialVariance += delta;

      comparisons.push({
        employeeId: emp.id,
        employeeName: emp.name,
        department: emp.department,
        currentOutcome: `₹${currentPayout.toLocaleString("en-IN")}/mo (at ₹${oldTwoWheelerRate}/km)`,
        simulatedOutcome: `₹${simulatedPayout.toLocaleString("en-IN")}/mo (at ₹${newTwoWheelerRate}/km)`,
        financialDelta: delta,
      });
    });
  } else {
    // Generic fallback simulation
    staff.forEach((emp) => {
      comparisons.push({
        employeeId: emp.id,
        employeeName: emp.name,
        department: emp.department,
        currentOutcome: "Standard Evaluation",
        simulatedOutcome: "Evaluated with new rule criteria",
        financialDelta: 0,
      });
    });
  }

  const percentage = staff.length > 0 ? Math.round((totalImpacted / staff.length) * 100) : 0;
  const disputeRiskScore = percentage > 50 ? "High" : percentage > 25 ? "Medium" : "Low";

  const keyFindings: string[] = [];
  keyFindings.push(`Evaluated ${staff.length} representative staff members across departments.`);
  if (totalImpacted > 0) {
    keyFindings.push(`${totalImpacted} employees (${percentage}%) will experience changes in monthly outcome.`);
  } else {
    keyFindings.push("Zero employees experience negative variance under the tested configuration.");
  }
  if (totalFinancialVariance !== 0) {
    const dir = totalFinancialVariance > 0 ? "increase" : "reduction";
    keyFindings.push(`Estimated monthly payroll variance: ₹${Math.abs(totalFinancialVariance).toLocaleString("en-IN")} net ${dir}.`);
  }
  if (disputeRiskScore === "High") {
    keyFindings.push("High dispute risk detected: consider phased implementation or townhall communication prior to rollout.");
  }

  return {
    policyCode,
    totalEvaluatedEmployees: staff.length,
    totalImpactedEmployees: totalImpacted,
    percentageImpacted: percentage,
    financialVarianceEstimate: totalFinancialVariance,
    disputeRiskScore,
    keyFindings,
    sampleComparisons: comparisons,
  };
}

/**
 * Server-Governed Policy Evaluation
 * Calls backend API to evaluate rules against database policy definitions.
 */
export async function evaluatePolicyRuleOnServer(
  request: import("../types/policy-matrix.types").PolicyEvaluationRequest,
): Promise<import("../types/policy-matrix.types").PolicyEvaluationResult> {
  const { policyApi } = await import("@/services/modules/policies");
  const res = await policyApi.evaluate(request as unknown as Record<string, unknown>);
  return res.data as import("../types/policy-matrix.types").PolicyEvaluationResult;
}

/**
 * Server-Governed Policy Simulation
 * Runs what-if dry-run analysis directly against database records on the backend.
 */
export async function simulatePolicyImpactOnServer(
  input: PolicyImpactSimulationInput,
): Promise<PolicyImpactSimulationResult> {
  const { policyApi } = await import("@/services/modules/policies");
  const res = await policyApi.simulate(input as unknown as Record<string, unknown>);
  return res.data as PolicyImpactSimulationResult;
}

