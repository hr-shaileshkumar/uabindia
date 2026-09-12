"use client";

import { useState, useEffect } from "react";
import { SideDrawer } from "@/components/ui/side-drawer";
import { ErpDrawerFooter } from "@/components/workspace/page-kit";
import {
  erpButtonClassName,
  erpFormInputClassName,
  erpFormLabelClassName,
} from "@/components/workspace/styles";
import { Switch } from "@/components/ui/switch";
import { Calendar, Plus, CheckCircle2, ShieldCheck, FileText, Sparkles, RefreshCw } from "lucide-react";
import { hrmsApi } from "@/services/modules";
import { orgApi } from "@/services/modules/org";
import type { LeavePolicy } from "../types/leave-policy.types";
import type { LeavePolicyFormValues } from "../schemas/leave-policy.schema";

interface LeavePolicyDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  policies: LeavePolicy[];
  activePolicy: LeavePolicy | null;
  saving: boolean;
  onSave: (policyData: LeavePolicyFormValues, policyId?: string) => Promise<boolean>;
  onSetDefault: (policyId: string) => Promise<boolean>;
}

export function LeavePolicyDrawer({
  open,
  onOpenChange,
  policies,
  activePolicy,
  saving,
  onSave,
  onSetDefault,
}: LeavePolicyDrawerProps) {
  const [selectedPolicyId, setSelectedPolicyId] = useState<string>(activePolicy?.id ?? "");
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [schemaDefaults, setSchemaDefaults] = useState<Record<string, any> | null>(null);

  const [companyId, setCompanyId] = useState<string>("");
  const [projectId, setProjectId] = useState<string>("");
  const [companiesList, setCompaniesList] = useState<Array<{ id: string; name: string }>>([]);
  const [projectsList, setProjectsList] = useState<Array<{ id: string; name: string }>>([]);

  // Load companies on open
  useEffect(() => {
    if (!open) return;
    orgApi.company.getAll(1, 100)
      .then((res: any) => {
        const comps = res?.data?.items || res?.data?.companies || [];
        setCompaniesList(comps.map((c: any) => ({ id: c.id, name: c.name })));
      })
      .catch(() => {});
  }, [open]);

  // Load projects when company changes
  useEffect(() => {
    if (!open) return;
    orgApi.project.getAll(companyId || undefined)
      .then((res: any) => {
        const projs = res?.data?.items || res?.data?.projects || [];
        setProjectsList(projs.map((p: any) => ({ id: p.id, name: p.name })));
      })
      .catch(() => {});
  }, [open, companyId]);

  // Form State (initialized from activePolicy or backend statutory defaults)
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("Privilege / Earned Leave");
  const [leaveTypeCode, setLeaveTypeCode] = useState("PL");
  const [entitlementPerYear, setEntitlementPerYear] = useState(18);
  const [allocationFrequency, setAllocationFrequency] = useState<"Yearly" | "Monthly" | "Quarterly">("Yearly");
  const [carryForwardAllowed, setCarryForwardAllowed] = useState(true);
  const [maxCarryForwardDays, setMaxCarryForwardDays] = useState(30);
  const [encashmentAllowed, setEncashmentAllowed] = useState(true);
  const [maxEncashmentDays, setMaxEncashmentDays] = useState(15);
  const [sandwichRuleEnabled, setSandwichRuleEnabled] = useState(false);
  const [allowDuringProbation, setAllowDuringProbation] = useState(false);
  const [minServiceDaysRequired, setMinServiceDaysRequired] = useState(90);
  const [maxConsecutiveDays, setMaxConsecutiveDays] = useState(15);
  const [noticePeriodDays, setNoticePeriodDays] = useState(3);
  const [requiresProofDocument, setRequiresProofDocument] = useState(false);
  const [proofRequiredAfterDays, setProofRequiredAfterDays] = useState(2);
  const [status, setStatus] = useState<"Active" | "Draft" | "Archived">("Active");
  const [isDefault, setIsDefault] = useState(false);

  // Fetch backend UI schema & statutory defaults on open or scope change
  useEffect(() => {
    if (!open) return;
    void hrmsApi.hrms.leave.policies.getSchema(companyId || undefined, projectId || undefined)
      .then((res: any) => {
        if (res?.data?.defaults) {
          setSchemaDefaults(res.data.defaults);
        }
      })
      .catch(() => {
        // Fallback gracefully if offline
      });
  }, [open, companyId, projectId]);

  const loadPolicyIntoForm = (policy: LeavePolicy) => {
    setName(policy.name);
    setDescription(policy.description ?? "");
    setCompanyId(policy.companyId ?? "");
    setProjectId(policy.projectId ?? "");
    setType(policy.type);
    setLeaveTypeCode(policy.leaveTypeCode ?? "");
    setEntitlementPerYear(policy.entitlementPerYear);
    setAllocationFrequency(policy.allocationFrequency);
    setCarryForwardAllowed(policy.carryForwardAllowed);
    setMaxCarryForwardDays(policy.maxCarryForwardDays);
    setEncashmentAllowed(policy.encashmentAllowed);
    setMaxEncashmentDays(policy.maxEncashmentDays);
    setSandwichRuleEnabled(policy.sandwichRuleEnabled);
    setAllowDuringProbation(policy.allowDuringProbation);
    setMinServiceDaysRequired(policy.minServiceDaysRequired);
    setMaxConsecutiveDays(policy.maxConsecutiveDays);
    setNoticePeriodDays(policy.noticePeriodDays);
    setRequiresProofDocument(policy.requiresProofDocument);
    setProofRequiredAfterDays(policy.proofRequiredAfterDays);
    setStatus(policy.status);
    setIsDefault(policy.isDefault);
  };

  useEffect(() => {
    if (activePolicy && !isCreatingNew) {
      setSelectedPolicyId(activePolicy.id);
      loadPolicyIntoForm(activePolicy);
    }
  }, [activePolicy, isCreatingNew]);

  const handleSelectPolicy = (id: string) => {
    const target = policies.find((p) => p.id === id);
    if (target) {
      setSelectedPolicyId(id);
      setIsCreatingNew(false);
      loadPolicyIntoForm(target);
    }
  };

  const handleStartCreateNew = () => {
    setIsCreatingNew(true);
    setSelectedPolicyId("");
    setCompanyId("");
    setProjectId("");
    setName(schemaDefaults?.name || "Casual & Personal Leave Policy");
    setDescription(schemaDefaults?.description || "Configurable leave quotas governed by backend rules.");
    setType(schemaDefaults?.type || "Casual Leave");
    setLeaveTypeCode("CL");
    setEntitlementPerYear(schemaDefaults?.entitlementPerYear ?? 12);
    setAllocationFrequency(schemaDefaults?.allocationFrequency || "Yearly");
    setCarryForwardAllowed(schemaDefaults?.carryForwardAllowed ?? false);
    setMaxCarryForwardDays(schemaDefaults?.maxCarryForward ?? 0);
    setEncashmentAllowed(schemaDefaults?.encashmentAllowed ?? false);
    setMaxEncashmentDays(10);
    setSandwichRuleEnabled(false);
    setAllowDuringProbation(true);
    setMinServiceDaysRequired(30);
    setMaxConsecutiveDays(3);
    setNoticePeriodDays(1);
    setRequiresProofDocument(false);
    setProofRequiredAfterDays(2);
    setStatus("Active");
    setIsDefault(false);
  };

  const handleSubmit = async () => {
    const payload: LeavePolicyFormValues = {
      name,
      description,
      companyId: companyId || undefined,
      projectId: projectId || undefined,
      type,
      leaveTypeCode: leaveTypeCode.trim().toUpperCase() || undefined,
      entitlementPerYear: Number(entitlementPerYear),
      allocationFrequency,
      carryForwardAllowed,
      maxCarryForwardDays: carryForwardAllowed ? Number(maxCarryForwardDays) : 0,
      encashmentAllowed,
      maxEncashmentDays: encashmentAllowed ? Number(maxEncashmentDays) : 0,
      sandwichRuleEnabled,
      allowDuringProbation,
      minServiceDaysRequired: Number(minServiceDaysRequired),
      maxConsecutiveDays: Number(maxConsecutiveDays),
      noticePeriodDays: Number(noticePeriodDays),
      requiresProofDocument,
      proofRequiredAfterDays: Number(proofRequiredAfterDays),
      status,
      isDefault,
    };

    const ok = await onSave(payload, isCreatingNew ? undefined : selectedPolicyId);
    if (ok) {
      setIsCreatingNew(false);
    }
  };

  const currentPolicy = policies.find((p) => p.id === selectedPolicyId);

  return (
    <SideDrawer
      open={open}
      onClose={() => onOpenChange(false)}
      title="Leave & Time-Off Policy Studio"
      subtitle="Administrator configuration saved to backend database"
      width="lg"
      footer={
        <ErpDrawerFooter
          onCancel={() => onOpenChange(false)}
          saveLabel={saving ? "Saving to Database..." : isCreatingNew ? "Save Policy in Database" : "Update Database Policy"}
          onSave={handleSubmit}
          saving={saving}
        />
      }
    >
      <div className="space-y-6">
        {/* Policy Selector Bar */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-900">Configured Policies in Database</span>
            <button
              type="button"
              onClick={handleStartCreateNew}
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              <Plus className="h-3.5 w-3.5" />
              New Policy
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {policies.map((p) => {
              const active = !isCreatingNew && (p.id === selectedPolicyId || p.id === activePolicy?.id);
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSelectPolicy(p.id)}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium border transition-colors ${
                    active
                      ? "border-blue-600 bg-blue-50 text-blue-700 font-bold"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {p.name}
                  {p.isDefault && (
                    <span className="rounded bg-emerald-100 px-1.5 py-0.2 text-[10px] text-emerald-800">
                      Default
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Form Fields */}
        <div className="space-y-4">
          {/* Scope Hierarchy (Tenant -> Company -> Project) */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 rounded-xl border border-blue-100 bg-blue-50/50 p-3">
            <div>
              <label className={erpFormLabelClassName}>Applicable Company (Optional)</label>
              <select
                value={companyId}
                onChange={(e) => {
                  setCompanyId(e.target.value);
                  setProjectId("");
                }}
                className={erpFormInputClassName}
              >
                <option value="">All Companies (Tenant Default)</option>
                {companiesList.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={erpFormLabelClassName}>Applicable Project / Site (Optional)</label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className={erpFormInputClassName}
              >
                <option value="">All Projects (Company Default)</option>
                {projectsList.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={erpFormLabelClassName}>Policy Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={erpFormInputClassName}
                placeholder="e.g. Annual Privilege Leave Policy"
              />
            </div>
            <div>
              <label className={erpFormLabelClassName}>Leave Type *</label>
              <input
                type="text"
                value={type}
                onChange={(e) => setType(e.target.value)}
                className={erpFormInputClassName}
                placeholder="e.g. Privilege / Earned Leave"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className={erpFormLabelClassName}>Type Code</label>
              <input
                type="text"
                value={leaveTypeCode}
                onChange={(e) => setLeaveTypeCode(e.target.value.toUpperCase())}
                className={erpFormInputClassName}
                placeholder="PL"
                maxLength={10}
              />
            </div>
            <div>
              <label className={erpFormLabelClassName}>Annual Entitlement (Days) *</label>
              <input
                type="number"
                min={0}
                max={365}
                value={entitlementPerYear}
                onChange={(e) => setEntitlementPerYear(Number(e.target.value))}
                className={erpFormInputClassName}
              />
            </div>
            <div>
              <label className={erpFormLabelClassName}>Accrual Frequency</label>
              <select
                value={allocationFrequency}
                onChange={(e) => setAllocationFrequency(e.target.value as "Yearly" | "Monthly" | "Quarterly")}
                className={erpFormInputClassName}
              >
                <option value="Yearly">Yearly (Annual lump-sum)</option>
                <option value="Monthly">Monthly (Pro-rata per month)</option>
                <option value="Quarterly">Quarterly (Pro-rata per quarter)</option>
              </select>
            </div>
          </div>

          <div>
            <label className={erpFormLabelClassName}>Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={erpFormInputClassName}
              placeholder="Scope, statutory eligibility, and organization rules"
            />
          </div>

          {/* Section: Rollover & Encashment Rules */}
          <div className="rounded-xl border border-slate-200 p-4 space-y-4">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <RefreshCw className="h-3.5 w-3.5 text-blue-600" />
              Year-End Carry-Forward & Encashment
            </h4>
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <div>
                <p className="text-xs font-semibold text-slate-800">Allow Carry-Forward to Next Year</p>
                <p className="text-[11px] text-slate-500">Unused leave balance rolls over into the next financial year</p>
              </div>
              <Switch checked={carryForwardAllowed} onCheckedChange={setCarryForwardAllowed} />
            </div>

            {carryForwardAllowed && (
              <div>
                <label className={erpFormLabelClassName}>Max Carry-Forward Cap (Days)</label>
                <input
                  type="number"
                  min={1}
                  value={maxCarryForwardDays}
                  onChange={(e) => setMaxCarryForwardDays(Number(e.target.value))}
                  className={erpFormInputClassName}
                  placeholder="30"
                />
              </div>
            )}

            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <div>
                <p className="text-xs font-semibold text-slate-800">Allow Leave Encashment</p>
                <p className="text-[11px] text-slate-500">Unused leaves can be encashed during annual payroll processing</p>
              </div>
              <Switch checked={encashmentAllowed} onCheckedChange={setEncashmentAllowed} />
            </div>

            {encashmentAllowed && (
              <div>
                <label className={erpFormLabelClassName}>Max Encashable Days per Year</label>
                <input
                  type="number"
                  min={1}
                  value={maxEncashmentDays}
                  onChange={(e) => setMaxEncashmentDays(Number(e.target.value))}
                  className={erpFormInputClassName}
                  placeholder="15"
                />
              </div>
            )}
          </div>

          {/* Section: Statutory Sandwich & Application Restrictions */}
          <div className="rounded-xl border border-slate-200 p-4 space-y-4">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              Statutory Controls & Application Rules
            </h4>
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <div>
                <p className="text-xs font-semibold text-slate-800">Enforce Sandwich Rule</p>
                <p className="text-[11px] text-slate-500">
                  Intervening public holidays and weekends are treated as leaves if sandwiched between leave days
                </p>
              </div>
              <Switch checked={sandwichRuleEnabled} onCheckedChange={setSandwichRuleEnabled} />
            </div>

            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <div>
                <p className="text-xs font-semibold text-slate-800">Allow During Probation Period</p>
                <p className="text-[11px] text-slate-500">New joiners on probation are allowed to apply for this leave</p>
              </div>
              <Switch checked={allowDuringProbation} onCheckedChange={setAllowDuringProbation} />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className={erpFormLabelClassName}>Min Service (Days)</label>
                <input
                  type="number"
                  min={0}
                  value={minServiceDaysRequired}
                  onChange={(e) => setMinServiceDaysRequired(Number(e.target.value))}
                  className={erpFormInputClassName}
                />
              </div>
              <div>
                <label className={erpFormLabelClassName}>Max Consecutive (Days)</label>
                <input
                  type="number"
                  min={1}
                  value={maxConsecutiveDays}
                  onChange={(e) => setMaxConsecutiveDays(Number(e.target.value))}
                  className={erpFormInputClassName}
                />
              </div>
              <div>
                <label className={erpFormLabelClassName}>Notice Period (Days)</label>
                <input
                  type="number"
                  min={0}
                  value={noticePeriodDays}
                  onChange={(e) => setNoticePeriodDays(Number(e.target.value))}
                  className={erpFormInputClassName}
                />
              </div>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <div>
                <p className="text-xs font-semibold text-slate-800">Require Supporting Document</p>
                <p className="text-[11px] text-slate-500">Medical certificate or proof required when exceeding threshold</p>
              </div>
              <Switch checked={requiresProofDocument} onCheckedChange={setRequiresProofDocument} />
            </div>

            {requiresProofDocument && (
              <div>
                <label className={erpFormLabelClassName}>Proof Required After (Days of Leave)</label>
                <input
                  type="number"
                  min={1}
                  value={proofRequiredAfterDays}
                  onChange={(e) => setProofRequiredAfterDays(Number(e.target.value))}
                  className={erpFormInputClassName}
                />
              </div>
            )}
          </div>

          {/* Section: Status & Default Policy Action */}
          <div className="rounded-xl border border-slate-200 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-800">Policy Lifecycle Status</p>
                <p className="text-[11px] text-slate-500">Draft policies cannot be availed by employees</p>
              </div>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as "Active" | "Draft" | "Archived")}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-800"
              >
                <option value="Active">Active</option>
                <option value="Draft">Draft</option>
                <option value="Archived">Archived</option>
              </select>
            </div>

            {!isCreatingNew && currentPolicy && !currentPolicy.isDefault && (
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-600">Make this the organization-wide default policy</span>
                <button
                  type="button"
                  onClick={() => onSetDefault(currentPolicy.id)}
                  className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100"
                >
                  Set as Default Policy
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </SideDrawer>
  );
}
