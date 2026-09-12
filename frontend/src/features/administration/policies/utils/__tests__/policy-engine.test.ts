import { describe, expect, it } from "vitest";
import {
  isScopeApplicable,
  resolveActivePolicyVersion,
  simulatePolicyImpact,
} from "../policy-engine";
import type { PolicyMaster, PolicyVersion } from "../../types/policy-matrix.types";

describe("Universal Policy Engine & Simulation Tests", () => {
  describe("isScopeApplicable", () => {
    it("returns true when scope is unrestricted (empty)", () => {
      const applicable = isScopeApplicable(
        { id: "E1", name: "Ramesh", departmentName: "Diagnostics", employmentType: "Permanent" },
        {},
      );
      expect(applicable).toBe(true);
    });

    it("returns false if employee is in excluded list", () => {
      const applicable = isScopeApplicable(
        { id: "E-EXCLUDED", name: "Excluded Employee", departmentName: "Administration" },
        { excludedEmployeeIds: ["E-EXCLUDED"] },
      );
      expect(applicable).toBe(false);
    });

    it("matches specific department scope correctly", () => {
      const scope = { departmentIds: ["Clinical", "ICU"] };

      expect(
        isScopeApplicable({ id: "E1", name: "Doctor", departmentName: "Clinical" }, scope),
      ).toBe(true);

      expect(
        isScopeApplicable({ id: "E2", name: "Billing Clerk", departmentName: "Finance" }, scope),
      ).toBe(false);
    });
  });

  describe("resolveActivePolicyVersion (Temporal Time-Travel & Specificity)", () => {
    const v1: PolicyVersion = {
      id: "v1",
      policyId: "pol-1",
      version: "1.0",
      effectiveFrom: "2025-01-01",
      effectiveTo: "2026-03-31",
      status: "Active",
      changeLogReason: "Old rate",
      authorName: "HR",
      applicability: {},
      ruleConfig: { rate: 10 },
      approvalWorkflow: { workflowType: "AutoApprove", levels: [], allowEmployeeDispute: false },
    };

    const v2: PolicyVersion = {
      id: "v2",
      policyId: "pol-1",
      version: "2.0",
      effectiveFrom: "2026-04-01",
      effectiveTo: null,
      status: "Active",
      changeLogReason: "New rate",
      authorName: "HR",
      applicability: {},
      ruleConfig: { rate: 15 },
      approvalWorkflow: { workflowType: "AutoApprove", levels: [], allowEmployeeDispute: false },
    };

    const policy: PolicyMaster = {
      id: "pol-1",
      code: "TEST_POL",
      category: "HR_CORE",
      name: "Test Policy",
      description: "Test",
      isMandatoryAcknowledgment: false,
      isSystemCritical: false,
      priority: 10,
      status: "Active",
      totalVersions: 2,
      activeVersion: v2,
      createdAt: "2025-01-01",
      updatedAt: "2026-04-01",
    };

    it("resolves v1 for historical date in February 2026 (preventing retro-payroll corruption)", () => {
      const resolved = resolveActivePolicyVersion(
        policy,
        { id: "E1", name: "Test" },
        "2026-02-15",
        [v1, v2],
      );
      expect(resolved?.version).toBe("1.0");
      expect(resolved?.ruleConfig.rate).toBe(10);
    });

    it("resolves v2 for current date in May 2026", () => {
      const resolved = resolveActivePolicyVersion(
        policy,
        { id: "E1", name: "Test" },
        "2026-05-15",
        [v1, v2],
      );
      expect(resolved?.version).toBe("2.0");
      expect(resolved?.ruleConfig.rate).toBe(15);
    });
  });

  describe("simulatePolicyImpact (What-If Analysis Engine)", () => {
    it("simulates late coming policy tightening and identifies impacted employees", () => {
      const result = simulatePolicyImpact({
        policyCode: "ATT_LATE_COMING",
        proposedRuleConfig: {
          gracePeriodMinutes: 10, // tightened grace
          maxAllowedPerMonth: 3,
        },
        evaluationMonth: "2026-08",
      });

      expect(result.totalEvaluatedEmployees).toBeGreaterThan(0);
      expect(result.totalImpactedEmployees).toBeGreaterThan(0);
      expect(result.sampleComparisons.length).toBe(result.totalEvaluatedEmployees);
      expect(result.keyFindings.length).toBeGreaterThan(0);
    });

    it("simulates mileage rate increase for local conveyance", () => {
      const result = simulatePolicyImpact({
        policyCode: "EXP_LOCAL_CONVEYANCE",
        proposedRuleConfig: {
          twoWheelerRatePerKm: 6.0, // increased from 4.5
        },
        evaluationMonth: "2026-08",
      });

      expect(result.totalImpactedEmployees).toBeGreaterThan(0);
      expect(result.financialVarianceEstimate).toBeGreaterThan(0); // Company cost increases
    });
  });
});
