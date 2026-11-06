"use client";

import { useState, useEffect } from "react";
import { SideDrawer } from "@/components/ui/side-drawer";
import { ErpDrawerFooter } from "@/components/workspace/page-kit";
import {
  erpFormInputClassName,
  erpFormLabelClassName,
  erpPanelBodyClassName,
  erpPanelClassName,
} from "@/components/workspace/styles";
import { Switch } from "@/components/ui/switch";
import { Plus, ShieldCheck, MapPin, IndianRupee, Car, Utensils, Hotel, Clock, CheckCircle2 } from "lucide-react";
import { travelApi } from "@/services/modules";
import { orgApi } from "@/services/modules/org";
import type { TravelExpensePolicy } from "../types/travel-policy.types";
import type { TravelExpensePolicyInput } from "../schemas/travel-policy.schema";

interface TravelPolicyDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  policies: TravelExpensePolicy[];
  activePolicy: TravelExpensePolicy | null;
  saving: boolean;
  onSave: (policyData: TravelExpensePolicyInput, policyId?: string) => Promise<boolean>;
  onSetDefault: (policyId: string) => Promise<boolean>;
}

export function TravelPolicyDrawer({
  open,
  onOpenChange,
  policies,
  activePolicy,
  saving,
  onSave,
  onSetDefault,
}: TravelPolicyDrawerProps) {
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
  const [maxDailyLodgingAllowance, setMaxDailyLodgingAllowance] = useState(3500);
  const [maxDailyMealsAllowance, setMaxDailyMealsAllowance] = useState(800);
  const [mileageRatePerKmCar, setMileageRatePerKmCar] = useState(12);
  const [mileageRatePerKmBike, setMileageRatePerKmBike] = useState(6);
  const [requiresAdvanceApproval, setRequiresAdvanceApproval] = useState(true);
  const [approvalThresholdAmount, setApprovalThresholdAmount] = useState(5000);
  const [maxAdvancePercentage, setMaxAdvancePercentage] = useState(80);
  const [receiptRequiredAboveAmount, setReceiptRequiredAboveAmount] = useState(200);
  const [expenseSubmissionWindowDays, setExpenseSubmissionWindowDays] = useState(15);
  const [isDefault, setIsDefault] = useState(false);

  // Fetch backend UI schema & statutory defaults on open or scope change
  useEffect(() => {
    if (!open) return;
    void travelApi.policies.getSchema(companyId || undefined, projectId || undefined)
      .then((res: any) => {
        if (res?.data?.defaults) {
          setSchemaDefaults(res.data.defaults);
        }
      })
      .catch(() => {
        // Fallback gracefully if offline
      });
  }, [open, companyId, projectId]);

  const loadPolicyIntoForm = (policy: TravelExpensePolicy) => {
    setName(policy.name);
    setDescription(policy.description ?? "");
    setCompanyId(policy.companyId ?? "");
    setProjectId(policy.projectId ?? "");
    setMaxDailyLodgingAllowance(policy.maxDailyLodgingAllowance);
    setMaxDailyMealsAllowance(policy.maxDailyMealsAllowance);
    setMileageRatePerKmCar(policy.mileageRatePerKmCar);
    setMileageRatePerKmBike(policy.mileageRatePerKmBike);
    setRequiresAdvanceApproval(policy.requiresAdvanceApproval);
    setApprovalThresholdAmount(policy.approvalThresholdAmount);
    setMaxAdvancePercentage(policy.maxAdvancePercentage);
    setReceiptRequiredAboveAmount(policy.receiptRequiredAboveAmount);
    setExpenseSubmissionWindowDays(policy.expenseSubmissionWindowDays);
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
    setName(schemaDefaults?.name || "Corporate Domestic Travel Policy");
    setDescription(schemaDefaults?.description || "Configurable per diem and local conveyance allowances governed by backend rules.");
    setMaxDailyLodgingAllowance(schemaDefaults?.maxDailyLodgingAllowance ?? 3500);
    setMaxDailyMealsAllowance(schemaDefaults?.maxDailyMealsAllowance ?? 800);
    setMileageRatePerKmCar(schemaDefaults?.mileageRatePerKmCar ?? 12);
    setMileageRatePerKmBike(schemaDefaults?.mileageRatePerKmBike ?? 6);
    setRequiresAdvanceApproval(schemaDefaults?.requiresAdvanceApproval ?? true);
    setApprovalThresholdAmount(schemaDefaults?.approvalThresholdAmount ?? 5000);
    setMaxAdvancePercentage(schemaDefaults?.maxAdvancePercentage ?? 80);
    setReceiptRequiredAboveAmount(schemaDefaults?.receiptRequiredAboveAmount ?? 200);
    setExpenseSubmissionWindowDays(schemaDefaults?.expenseSubmissionWindowDays ?? 15);
    setIsDefault(false);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const payload: TravelExpensePolicyInput = {
      name,
      description,
      companyId: companyId || undefined,
      projectId: projectId || undefined,
      isDefault,
      maxDailyLodgingAllowance,
      maxDailyMealsAllowance,
      mileageRatePerKmCar,
      mileageRatePerKmBike,
      requiresAdvanceApproval,
      approvalThresholdAmount,
      maxAdvancePercentage,
      receiptRequiredAboveAmount,
      expenseSubmissionWindowDays,
      status: "Active",
    };

    const success = await onSave(payload, isCreatingNew ? undefined : selectedPolicyId);
    if (success) {
      onOpenChange(false);
      setIsCreatingNew(false);
    }
  };

  return (
    <SideDrawer
      open={open}
      onClose={() => onOpenChange(false)}
      title="Travel & Expense Policy Studio"
      subtitle="Configure statutory domestic travel per diems, vehicle mileage, and advance approvals"
      width="2xl"
      footer={
        <ErpDrawerFooter
          onCancel={() => onOpenChange(false)}
          saveLabel={saving ? "Saving to Database..." : isCreatingNew ? "Save Policy in Database" : "Update Database Policy"}
          onSave={handleSubmit}
          saving={saving}
        />
      }
    >
      <div className="space-y-6 pb-6 text-slate-800">
        {/* Policy Selector Chips */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-900">Database-Configured Policies</span>
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
                  <MapPin className="h-3 w-3 text-slate-400" />
                  <span>{p.name}</span>
                  {p.isDefault && (
                    <span className="rounded bg-emerald-100 px-1.5 py-0.2 text-[10px] text-emerald-800 font-semibold">
                      Default
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 1: Basic Information */}
        <div className={erpPanelClassName}>
          <div className="border-b border-slate-100 px-4 py-3 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-blue-600" />
              Policy Identification
            </h3>
            {selectedPolicyId && !isCreatingNew && (
              <button
                type="button"
                onClick={() => void onSetDefault(selectedPolicyId)}
                className="text-xs font-semibold text-emerald-700 hover:underline"
              >
                Set as Enterprise Default
              </button>
            )}
          </div>
          <div className={erpPanelBodyClassName}>
            {/* Scope Hierarchy (Tenant -> Company -> Project) */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 rounded-xl border border-blue-100 bg-blue-50/50 p-3 mb-4">
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className={erpFormLabelClassName}>Policy Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={erpFormInputClassName}
                  placeholder="e.g. Standard Domestic Travel Policy"
                />
              </div>
              <div className="sm:col-span-2">
                <label className={erpFormLabelClassName}>Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={erpFormInputClassName}
                  placeholder="Summarize the coverage and applicability of this travel policy"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Daily Lodging & Meal Allowances */}
        <div className={erpPanelClassName}>
          <div className="border-b border-slate-100 px-4 py-3">
            <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2">
              <Hotel className="h-4 w-4 text-indigo-600" />
              Per Diem & Lodging Allowances
            </h3>
          </div>
          <div className={erpPanelBodyClassName}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={erpFormLabelClassName}>Max Daily Lodging Allowance (₹) *</label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-2.5 text-xs text-slate-400">₹</span>
                  <input
                    type="number"
                    min={0}
                    step={100}
                    required
                    value={maxDailyLodgingAllowance}
                    onChange={(e) => setMaxDailyLodgingAllowance(Number(e.target.value))}
                    className={`${erpFormInputClassName} pl-7`}
                  />
                </div>
                <p className="mt-1 text-[11px] text-slate-500">Max allowable hotel tariff per overnight stay.</p>
              </div>

              <div>
                <label className={erpFormLabelClassName}>Max Daily Meals Allowance (₹) *</label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-2.5 text-xs text-slate-400">₹</span>
                  <input
                    type="number"
                    min={0}
                    step={50}
                    required
                    value={maxDailyMealsAllowance}
                    onChange={(e) => setMaxDailyMealsAllowance(Number(e.target.value))}
                    className={`${erpFormInputClassName} pl-7`}
                  />
                </div>
                <p className="mt-1 text-[11px] text-slate-500">Per diem food reimbursement allowance.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Vehicle Mileage Reimbursements */}
        <div className={erpPanelClassName}>
          <div className="border-b border-slate-100 px-4 py-3">
            <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2">
              <Car className="h-4 w-4 text-emerald-600" />
              Vehicle Mileage Rates (Per Km)
            </h3>
          </div>
          <div className={erpPanelBodyClassName}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={erpFormLabelClassName}>Four-Wheeler / Car Rate (₹ / km) *</label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-2.5 text-xs text-slate-400">₹</span>
                  <input
                    type="number"
                    min={0}
                    step={0.5}
                    required
                    value={mileageRatePerKmCar}
                    onChange={(e) => setMileageRatePerKmCar(Number(e.target.value))}
                    className={`${erpFormInputClassName} pl-7`}
                  />
                </div>
                <p className="mt-1 text-[11px] text-slate-500">Fuel & wear reimbursement for personal car.</p>
              </div>

              <div>
                <label className={erpFormLabelClassName}>Two-Wheeler / Bike Rate (₹ / km) *</label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-2.5 text-xs text-slate-400">₹</span>
                  <input
                    type="number"
                    min={0}
                    step={0.5}
                    required
                    value={mileageRatePerKmBike}
                    onChange={(e) => setMileageRatePerKmBike(Number(e.target.value))}
                    className={`${erpFormInputClassName} pl-7`}
                  />
                </div>
                <p className="mt-1 text-[11px] text-slate-500">Fuel reimbursement for two-wheeler field visits.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: Travel Advance Approvals & Claim Window */}
        <div className={erpPanelClassName}>
          <div className="border-b border-slate-100 px-4 py-3">
            <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2">
              <Clock className="h-4 w-4 text-violet-600" />
              Advance Approvals & Expense Submission Governance
            </h3>
          </div>
          <div className={erpPanelBodyClassName}>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-800">Mandatory Travel Advance Approval</p>
                  <p className="text-[11px] text-slate-500">Requires manager sign-off when advance exceeds threshold.</p>
                </div>
                <Switch checked={requiresAdvanceApproval} onCheckedChange={setRequiresAdvanceApproval} />
              </div>

              {requiresAdvanceApproval && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                  <div>
                    <label className={erpFormLabelClassName}>Advance Approval Threshold (₹) *</label>
                    <input
                      type="number"
                      min={0}
                      step={500}
                      value={approvalThresholdAmount}
                      onChange={(e) => setApprovalThresholdAmount(Number(e.target.value))}
                      className={erpFormInputClassName}
                    />
                  </div>
                  <div>
                    <label className={erpFormLabelClassName}>Max Advance Percentage (%) *</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={maxAdvancePercentage}
                      onChange={(e) => setMaxAdvancePercentage(Number(e.target.value))}
                      className={erpFormInputClassName}
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                <div>
                  <label className={erpFormLabelClassName}>Receipt Required Above (₹) *</label>
                  <input
                    type="number"
                    min={0}
                    value={receiptRequiredAboveAmount}
                    onChange={(e) => setReceiptRequiredAboveAmount(Number(e.target.value))}
                    className={erpFormInputClassName}
                  />
                  <p className="mt-1 text-[11px] text-slate-500">GST bill or voucher mandatory above this amount.</p>
                </div>

                <div>
                  <label className={erpFormLabelClassName}>Submission Window (Days) *</label>
                  <input
                    type="number"
                    min={1}
                    max={90}
                    value={expenseSubmissionWindowDays}
                    onChange={(e) => setExpenseSubmissionWindowDays(Number(e.target.value))}
                    className={erpFormInputClassName}
                  />
                  <p className="mt-1 text-[11px] text-slate-500">Days from trip completion to submit claim.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SideDrawer>
  );
}
