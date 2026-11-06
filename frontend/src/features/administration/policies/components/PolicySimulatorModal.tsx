"use client";

import { useState } from "react";
import { SideDrawer } from "@/components/ui/side-drawer";
import { ErpDrawerFooter } from "@/components/workspace/page-kit";
import { erpFormInputClassName, erpFormLabelClassName } from "@/components/workspace/styles";
import { Sparkles, AlertTriangle, CheckCircle, TrendingDown, TrendingUp, Users } from "lucide-react";
import type { PolicyMaster, PolicyImpactSimulationResult } from "../types/policy-matrix.types";

interface PolicySimulatorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  policies: PolicyMaster[];
  simulationResult: PolicyImpactSimulationResult | null;
  isSimulating: boolean;
  onRunSimulation: (policyCode: string, proposedConfig: Record<string, any>, deptFilter?: string) => void;
}

export function PolicySimulatorModal({
  open,
  onOpenChange,
  policies,
  simulationResult,
  isSimulating,
  onRunSimulation,
}: PolicySimulatorModalProps) {
  const [selectedCode, setSelectedCode] = useState(policies[0]?.code || "ATT_LATE_COMING");
  const [deptFilter, setDeptFilter] = useState("");
  const [proposedGrace, setProposedGrace] = useState(10);
  const [proposedAllowed, setProposedAllowed] = useState(3);
  const [proposedMileageRate, setProposedMileageRate] = useState(5.5);

  const activePolicy = policies.find((p) => p.code === selectedCode);

  const handleSimulate = () => {
    let config: Record<string, any> = {};
    if (selectedCode === "ATT_LATE_COMING") {
      config = {
        gracePeriodMinutes: Number(proposedGrace),
        maxAllowedPerMonth: Number(proposedAllowed),
      };
    } else if (selectedCode === "EXP_LOCAL_CONVEYANCE") {
      config = {
        twoWheelerRatePerKm: Number(proposedMileageRate),
      };
    }
    onRunSimulation(selectedCode, config, deptFilter || undefined);
  };

  return (
    <SideDrawer
      open={open}
      onClose={() => onOpenChange(false)}
      title="Policy Impact Simulator (What-If Analysis)"
      subtitle="Simulate financial and operational impact before publishing to production database"
      width="xl"
      footer={
        <ErpDrawerFooter
          onCancel={() => onOpenChange(false)}
          saveLabel={isSimulating ? "Simulating..." : "Run Impact Simulation"}
          onSave={handleSimulate}
          saving={isSimulating}
        />
      }
    >
      <div className="space-y-6">
        {/* Simulation Controls */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={erpFormLabelClassName}>Target Policy for Simulation</label>
              <select
                value={selectedCode}
                onChange={(e) => setSelectedCode(e.target.value)}
                className={erpFormInputClassName}
              >
                {policies.map((p) => (
                  <option key={p.code} value={p.code}>
                    {p.name} ({p.code})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={erpFormLabelClassName}>Department Scope Filter (Optional)</label>
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className={erpFormInputClassName}
              >
                <option value="">All Hospital Departments</option>
                <option value="Clinical">Clinical & Doctors</option>
                <option value="Nursing">Nursing Staff</option>
                <option value="Diagnostics">Diagnostics & Lab</option>
                <option value="Administration">Hospital Administration</option>
              </select>
            </div>
          </div>

          {/* Dynamic parameter knobs */}
          {selectedCode === "ATT_LATE_COMING" && (
            <div className="pt-2 border-t border-slate-200/80 grid grid-cols-2 gap-4">
              <div>
                <label className={erpFormLabelClassName}>Proposed Grace Period (Mins)</label>
                <input
                  type="number"
                  value={proposedGrace}
                  onChange={(e) => setProposedGrace(Number(e.target.value))}
                  className={erpFormInputClassName}
                />
              </div>
              <div>
                <label className={erpFormLabelClassName}>Allowed Occurrences / Month</label>
                <input
                  type="number"
                  value={proposedAllowed}
                  onChange={(e) => setProposedAllowed(Number(e.target.value))}
                  className={erpFormInputClassName}
                />
              </div>
            </div>
          )}

          {selectedCode === "EXP_LOCAL_CONVEYANCE" && (
            <div className="pt-2 border-t border-slate-200/80 grid grid-cols-2 gap-4">
              <div>
                <label className={erpFormLabelClassName}>Proposed 2-Wheeler Rate (₹/km)</label>
                <input
                  type="number"
                  step="0.5"
                  value={proposedMileageRate}
                  onChange={(e) => setProposedMileageRate(Number(e.target.value))}
                  className={erpFormInputClassName}
                />
              </div>
            </div>
          )}
        </div>

        {/* Simulation Results View */}
        {simulationResult ? (
          <div className="space-y-4">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
                <p className="text-[11px] font-semibold text-slate-500 uppercase">Evaluated Staff</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{simulationResult.totalEvaluatedEmployees}</p>
                <p className="text-[10px] text-slate-400">Sample active dataset</p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
                <p className="text-[11px] font-semibold text-slate-500 uppercase">Staff Impacted</p>
                <p className="mt-1 text-2xl font-bold text-amber-600">
                  {simulationResult.totalImpactedEmployees}{" "}
                  <span className="text-xs font-normal text-slate-500">({simulationResult.percentageImpacted}%)</span>
                </p>
                <p className="text-[10px] text-slate-400">Variance in outcome</p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
                <p className="text-[11px] font-semibold text-slate-500 uppercase">Monthly Payroll Delta</p>
                <p
                  className={`mt-1 text-xl font-bold ${
                    simulationResult.financialVarianceEstimate > 0 ? "text-emerald-700" : "text-blue-700"
                  }`}
                >
                  ₹{Math.abs(simulationResult.financialVarianceEstimate).toLocaleString("en-IN")}
                </p>
                <p className="text-[10px] text-slate-400">
                  {simulationResult.financialVarianceEstimate >= 0 ? "Cost Increase" : "Cost Reduction"}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
                <p className="text-[11px] font-semibold text-slate-500 uppercase">Dispute Risk</p>
                <div className="mt-1 flex items-center gap-1.5">
                  <span
                    className={`rounded px-2 py-0.5 text-xs font-bold ${
                      simulationResult.disputeRiskScore === "High"
                        ? "bg-rose-100 text-rose-800"
                        : simulationResult.disputeRiskScore === "Medium"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-emerald-100 text-emerald-800"
                    }`}
                  >
                    {simulationResult.disputeRiskScore} Risk
                  </span>
                </div>
                <p className="text-[10px] text-slate-400">Employee grievance rating</p>
              </div>
            </div>

            {/* Key Findings */}
            <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4">
              <h5 className="text-xs font-bold text-blue-950 flex items-center gap-1.5 mb-2">
                <Sparkles className="h-4 w-4 text-blue-600" />
                Executive HR Findings & Recommendations
              </h5>
              <ul className="space-y-1 text-xs text-blue-900">
                {simulationResult.keyFindings.map((finding, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-blue-500">•</span>
                    <span>{finding}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Granular Employee Comparison Table */}
            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100">
                <h5 className="text-xs font-bold text-slate-900">Sample Staff Variance Breakdown</h5>
              </div>
              <div className="erp-table-wrap">
                <table className="erp-table">
                  <thead className="erp-thead">
                    <tr>
                      <th className="erp-th">Employee</th>
                      <th className="erp-th">Department</th>
                      <th className="erp-th">Current Outcome</th>
                      <th className="erp-th">Simulated Outcome</th>
                      <th className="erp-th text-right">Financial Delta</th>
                    </tr>
                  </thead>
                  <tbody>
                    {simulationResult.sampleComparisons.map((c) => (
                      <tr key={c.employeeId} className="hover:bg-slate-50">
                        <td className="erp-td text-xs font-medium text-slate-900">{c.employeeName}</td>
                        <td className="erp-td text-xs text-slate-500">{c.department}</td>
                        <td className="erp-td text-xs text-slate-600">{c.currentOutcome}</td>
                        <td className="erp-td text-xs font-semibold text-slate-800">{c.simulatedOutcome}</td>
                        <td
                          className={`erp-td text-xs font-bold text-right ${
                            c.financialDelta !== 0 ? (c.financialDelta > 0 ? "text-emerald-700" : "text-rose-600") : "text-slate-400"
                          }`}
                        >
                          {c.financialDelta === 0
                            ? "—"
                            : `${c.financialDelta > 0 ? "+" : ""}₹${c.financialDelta.toLocaleString("en-IN")}`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center">
            <Sparkles className="h-8 w-8 text-blue-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-800">No simulation run yet</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Select parameters and click <strong>Run Impact Simulation</strong> to test outcomes against live representative datasets.
            </p>
          </div>
        )}
      </div>
    </SideDrawer>
  );
}
