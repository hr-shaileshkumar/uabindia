"use client";

import { useState } from "react";
import { SideDrawer } from "@/components/ui/side-drawer";
import { ErpDrawerFooter } from "@/components/workspace/page-kit";
import {
  erpFormInputClassName,
  erpFormLabelClassName,
} from "@/components/workspace/styles";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, ShieldCheck, Clock, Layers } from "lucide-react";
import type {
  PolicyMaster,
  EmploymentType,
  WorkflowApprovalStep,
} from "../types/policy-matrix.types";
import type { PolicyVersionFormValues } from "../schemas/policy-master.schema";

interface PolicyVersionDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  policy: PolicyMaster | null;
  saving: boolean;
  onSave: (policyId: string, data: PolicyVersionFormValues) => Promise<boolean>;
}

export function PolicyVersionDrawer({
  open,
  onOpenChange,
  policy,
  saving,
  onSave,
}: PolicyVersionDrawerProps) {
  const [version, setVersion] = useState("2.0");
  const [effectiveFrom, setEffectiveFrom] = useState(new Date().toISOString().slice(0, 10));
  const [effectiveTo, setEffectiveTo] = useState<string>("");
  const [status, setStatus] = useState<"Active" | "Draft" | "Archived">("Active");
  const [changeLogReason, setChangeLogReason] = useState("");
  const [authorName, setAuthorName] = useState("Corporate HR Head");

  // Applicability Scope
  const [selectedDepts, setSelectedDepts] = useState<string[]>([]);
  const [deptInput, setDeptInput] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<EmploymentType[]>(["Permanent"]);

  // Rule Config (JSON)
  const [ruleJsonText, setRuleJsonText] = useState(
    JSON.stringify(policy?.activeVersion?.ruleConfig || { graceMinutes: 15, maxAllowed: 3 }, null, 2),
  );

  // Workflow
  const [workflowType, setWorkflowType] = useState<"AutoApprove" | "SingleLevel" | "MultiLevel" | "ThresholdBased">(
    policy?.activeVersion?.approvalWorkflow.workflowType || "SingleLevel",
  );
  const [allowEmployeeDispute, setAllowEmployeeDispute] = useState(true);
  const [disputeWindowDays, setDisputeWindowDays] = useState(7);
  const [steps, setSteps] = useState<WorkflowApprovalStep[]>(
    policy?.activeVersion?.approvalWorkflow.levels || [
      { level: 1, role: "ReportingManager", slaHours: 48, canReject: true, canRequestClarification: true },
    ],
  );

  const handleAddDept = () => {
    if (!deptInput.trim() || selectedDepts.includes(deptInput.trim())) return;
    setSelectedDepts([...selectedDepts, deptInput.trim()]);
    setDeptInput("");
  };

  const handleRemoveDept = (d: string) => {
    setSelectedDepts(selectedDepts.filter((x) => x !== d));
  };

  const toggleEmploymentType = (type: EmploymentType) => {
    if (selectedTypes.includes(type)) {
      setSelectedTypes(selectedTypes.filter((t) => t !== type));
    } else {
      setSelectedTypes([...selectedTypes, type]);
    }
  };

  const handleAddStep = () => {
    setSteps([
      ...steps,
      {
        level: steps.length + 1,
        role: "HR",
        slaHours: 48,
        canReject: true,
        canRequestClarification: true,
      },
    ]);
  };

  const handleRemoveStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!policy) return;

    let parsedConfig: Record<string, any> = {};
    try {
      parsedConfig = JSON.parse(ruleJsonText);
    } catch {
      alert("Rule Configuration must be valid JSON format.");
      return;
    }

    const payload: PolicyVersionFormValues = {
      version: version.trim(),
      effectiveFrom,
      effectiveTo: effectiveTo ? effectiveTo : null,
      status,
      changeLogReason: changeLogReason.trim(),
      authorName: authorName.trim(),
      applicability: {
        companyIds: [],
        branchIds: [],
        departmentIds: selectedDepts,
        employmentTypes: selectedTypes,
        grades: [],
        excludedEmployeeIds: [],
      },
      ruleConfig: parsedConfig,
      approvalWorkflow: {
        workflowType,
        levels: steps,
        allowEmployeeDispute,
        disputeWindowDays: Number(disputeWindowDays),
        autoApproveOnSlaExpiry: false,
      },
    };

    const ok = await onSave(policy.id, payload);
    if (ok) {
      onOpenChange(false);
    }
  };

  return (
    <SideDrawer
      open={open}
      onClose={() => onOpenChange(false)}
      title={`Publish New Version: ${policy?.name || "Policy"}`}
      subtitle={`Policy Code: ${policy?.code || "—"}`}
      width="xl"
      footer={
        <ErpDrawerFooter
          onCancel={() => onOpenChange(false)}
          saveLabel={saving ? "Publishing to DB..." : "Publish & Enforce Version"}
          onSave={handleSubmit}
          saving={saving}
        />
      }
    >
      <div className="space-y-5">
        {/* Section 1: Version Details */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-4">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5 text-blue-600" />
            Version & Temporal Validity
          </h4>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className={erpFormLabelClassName}>Version Number *</label>
              <input
                type="text"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                placeholder="2.0"
                className={erpFormInputClassName}
              />
            </div>
            <div>
              <label className={erpFormLabelClassName}>Effective From *</label>
              <input
                type="date"
                value={effectiveFrom}
                onChange={(e) => setEffectiveFrom(e.target.value)}
                className={erpFormInputClassName}
              />
            </div>
            <div>
              <label className={erpFormLabelClassName}>Effective To (Optional)</label>
              <input
                type="date"
                value={effectiveTo}
                onChange={(e) => setEffectiveTo(e.target.value)}
                className={erpFormInputClassName}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className={erpFormLabelClassName}>Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as "Active" | "Draft" | "Archived")}
                className={erpFormInputClassName}
              >
                <option value="Active">Active (Enforced across ERP)</option>
                <option value="Draft">Draft (Under Review)</option>
                <option value="Archived">Archived</option>
              </select>
            </div>
            <div>
              <label className={erpFormLabelClassName}>Author / HR Drafter</label>
              <input
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                className={erpFormInputClassName}
              />
            </div>
          </div>

          <div>
            <label className={erpFormLabelClassName}>Changelog / Executive Reason *</label>
            <input
              type="text"
              value={changeLogReason}
              onChange={(e) => setChangeLogReason(e.target.value)}
              placeholder="Why is this policy rule being revised? (Required for audit history)"
              className={erpFormInputClassName}
            />
          </div>
        </div>

        {/* Section 2: Applicability Scoping */}
        <div className="rounded-xl border border-slate-200 p-4 space-y-4">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Applicability Scope (Who does this apply to?)
          </h4>
          <div>
            <label className={erpFormLabelClassName}>Applicable Employment Types</label>
            <div className="flex flex-wrap gap-2 mt-1.5">
              {(["Permanent", "Contract", "DoctorConsultant", "Intern", "Probationary"] as EmploymentType[]).map((t) => {
                const checked = selectedTypes.includes(t);
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => toggleEmploymentType(t)}
                    className={`rounded-lg px-3 py-1 text-xs font-medium border transition-colors ${
                      checked
                        ? "border-blue-600 bg-blue-50 text-blue-700 font-bold"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {t === "DoctorConsultant" ? "Doctor / Consultant" : t}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className={erpFormLabelClassName}>Target Departments (Empty = All)</label>
            <div className="flex gap-2 mt-1">
              <input
                type="text"
                value={deptInput}
                onChange={(e) => setDeptInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddDept())}
                placeholder="e.g. Clinical, ICU, Diagnostics"
                className={erpFormInputClassName}
              />
              <button
                type="button"
                onClick={handleAddDept}
                className="rounded-lg border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs font-semibold hover:bg-slate-200"
              >
                Add
              </button>
            </div>
            {selectedDepts.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {selectedDepts.map((d) => (
                  <span
                    key={d}
                    className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-800"
                  >
                    {d}
                    <button type="button" onClick={() => handleRemoveDept(d)} className="text-slate-400 hover:text-rose-600">
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Section 3: Executable Rule Parameters (JSON) */}
        <div className="rounded-xl border border-slate-200 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Executable Rule Parameters (JSON Payload)
            </h4>
            <span className="text-[11px] text-slate-400 font-mono">Parsed by Domain Calculation Engine</span>
          </div>
          <textarea
            rows={5}
            value={ruleJsonText}
            onChange={(e) => setRuleJsonText(e.target.value)}
            className={`${erpFormInputClassName} font-mono text-xs`}
          />
        </div>

        {/* Section 4: Workflow & Approval Matrix */}
        <div className="rounded-xl border border-slate-200 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              Approval Workflow & Exception Matrix
            </h4>
            <select
              value={workflowType}
              onChange={(e) => setWorkflowType(e.target.value as any)}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium"
            >
              <option value="SingleLevel">Single-Level Approval</option>
              <option value="MultiLevel">Multi-Level Hierarchy</option>
              <option value="ThresholdBased">Value / Amount Threshold</option>
              <option value="AutoApprove">Auto-Approve (Audit Only)</option>
            </select>
          </div>

          <div className="space-y-2">
            {steps.map((step, idx) => (
              <div key={idx} className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-800">
                  {step.level}
                </span>
                <div className="flex-1 grid grid-cols-2 gap-2">
                  <select
                    value={step.role}
                    onChange={(e) => {
                      const updated = [...steps];
                      updated[idx].role = e.target.value as any;
                      setSteps(updated);
                    }}
                    className={erpFormInputClassName}
                  >
                    <option value="ReportingManager">Reporting Manager</option>
                    <option value="DepartmentHead">Department Head (HOD)</option>
                    <option value="HR">Corporate HR</option>
                    <option value="Finance">Finance Controller</option>
                    <option value="MedicalDirector">Medical Superintendent</option>
                    <option value="ManagingDirector">Managing Director</option>
                  </select>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min={1}
                      value={step.slaHours}
                      onChange={(e) => {
                        const updated = [...steps];
                        updated[idx].slaHours = Number(e.target.value);
                        setSteps(updated);
                      }}
                      className={erpFormInputClassName}
                    />
                    <span className="text-[11px] text-slate-500">hrs SLA</span>
                  </div>
                </div>
                {steps.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveStep(idx)}
                    className="p-1 text-slate-400 hover:text-rose-600"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))}

            <button
              type="button"
              onClick={handleAddStep}
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 mt-1"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Approval Level
            </button>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <div>
              <p className="text-xs font-semibold text-slate-800">Allow Employee Dispute / Grievance</p>
              <p className="text-[11px] text-slate-500">Employee can challenge automated deduction or decision</p>
            </div>
            <Switch checked={allowEmployeeDispute} onCheckedChange={setAllowEmployeeDispute} />
          </div>

          {allowEmployeeDispute && (
            <div>
              <label className={erpFormLabelClassName}>Dispute Window (Days after Incident)</label>
              <input
                type="number"
                min={1}
                value={disputeWindowDays}
                onChange={(e) => setDisputeWindowDays(Number(e.target.value))}
                className={erpFormInputClassName}
              />
            </div>
          )}
        </div>
      </div>
    </SideDrawer>
  );
}
