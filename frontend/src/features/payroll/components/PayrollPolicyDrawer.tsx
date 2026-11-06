"use client";

import { useState, useEffect } from "react";
import { SideDrawer } from "@/components/ui/side-drawer";
import { ErpDrawerFooter } from "@/components/workspace/page-kit";
import {
  erpFormInputClassName,
  erpFormLabelClassName,
} from "@/components/workspace/styles";
import { Switch } from "@/components/ui/switch";
import { Plus, DollarSign, Percent, ShieldCheck, Building2, Briefcase } from "lucide-react";
import { payrollApi } from "@/services/modules/payroll";
import { orgApi } from "@/services/modules/org";
import type { PayrollPolicy } from "../types/payroll-policy.types";
import type { PayrollPolicyInput } from "../schemas/payroll-policy.schema";

interface PayrollPolicyDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  policies: PayrollPolicy[];
  activePolicy: PayrollPolicy | null;
  saving: boolean;
  onSave: (policyData: PayrollPolicyInput, policyId?: string) => Promise<boolean>;
  onSetDefault: (policyId: string) => Promise<boolean>;
}

export function PayrollPolicyDrawer({
  open,
  onOpenChange,
  policies,
  activePolicy,
  saving,
  onSave,
  onSetDefault,
}: PayrollPolicyDrawerProps) {
  const [selectedPolicyId, setSelectedPolicyId] = useState<string>(activePolicy?.id ?? "");
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [schemaDefaults, setSchemaDefaults] = useState<Record<string, any> | null>(null);

  // Scope Hierarchy State
  const [companyId, setCompanyId] = useState<string>(activePolicy?.companyId ?? "");
  const [projectId, setProjectId] = useState<string>(activePolicy?.projectId ?? "");
  const [companiesList, setCompaniesList] = useState<Array<{ id: string; name: string }>>([]);
  const [projectsList, setProjectsList] = useState<Array<{ id: string; name: string }>>([]);

  // Form State
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [payCycle, setPayCycle] = useState<"CalendarMonth" | "Fixed30Days" | "WorkingDaysOnly">("Fixed30Days");
  const [basicPercentageOfGross, setBasicPercentageOfGross] = useState(50);
  const [hraPercentageOfBasic, setHraPercentageOfBasic] = useState(40);
  const [pfCalculationBasis, setPfCalculationBasis] = useState<"StatutoryWageCeiling" | "ActualBasic" | "Disabled">("StatutoryWageCeiling");
  const [pfWageCeiling, setPfWageCeiling] = useState(15000);
  const [pfEmployeeRate, setPfEmployeeRate] = useState(12);
  const [pfEmployerRate, setPfEmployerRate] = useState(12);
  const [isEsiEnabled, setIsEsiEnabled] = useState(true);
  const [esiWageCeiling, setEsiWageCeiling] = useState(21000);
  const [esiEmployeeRate, setEsiEmployeeRate] = useState(0.75);
  const [esiEmployerRate, setEsiEmployerRate] = useState(3.25);
  const [professionalTaxMonthly, setProfessionalTaxMonthly] = useState(200);
  const [payDayOfMonth, setPayDayOfMonth] = useState(1);
  const [allowNegativeTakeHome, setAllowNegativeTakeHome] = useState(false);
  const [isDefault, setIsDefault] = useState(false);

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

  // Fetch backend UI schema & statutory defaults on open or scope change
  useEffect(() => {
    if (!open) return;
    void payrollApi.policies.getSchema?.(companyId || undefined, projectId || undefined)
      .then((res: any) => {
        if (res?.data?.defaults) {
          setSchemaDefaults(res.data.defaults);
        }
      })
      .catch(() => {
        // Fallback gracefully if offline
      });
  }, [open, companyId, projectId]);

  const loadPolicyIntoForm = (policy: PayrollPolicy) => {
    setName(policy.name);
    setDescription(policy.description ?? "");
    setCompanyId(policy.companyId ?? "");
    setProjectId(policy.projectId ?? "");
    setPayCycle(policy.payCycle);
    setBasicPercentageOfGross(policy.basicPercentageOfGross);
    setHraPercentageOfBasic(policy.hraPercentageOfBasic);
    setPfCalculationBasis(policy.pfCalculationBasis);
    setPfWageCeiling(policy.pfWageCeiling);
    setPfEmployeeRate(policy.pfEmployeeRate);
    setPfEmployerRate(policy.pfEmployerRate);
    setIsEsiEnabled(policy.isEsiEnabled);
    setEsiWageCeiling(policy.esiWageCeiling);
    setEsiEmployeeRate(policy.esiEmployeeRate);
    setEsiEmployerRate(policy.esiEmployerRate);
    setProfessionalTaxMonthly(policy.professionalTaxMonthly);
    setPayDayOfMonth(policy.payDayOfMonth);
    setAllowNegativeTakeHome(policy.allowNegativeTakeHome);
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
    setName(schemaDefaults?.name || "Standard Statutory Payroll Policy (India)");
    setDescription(schemaDefaults?.description || "Standard statutory compensation policy compliant with Indian PF, ESI, and Tax regulations.");
    setPayCycle(schemaDefaults?.payCycle || "CalendarMonth");
    setBasicPercentageOfGross(schemaDefaults?.basicPercentageOfGross ?? 50);
    setHraPercentageOfBasic(schemaDefaults?.hraPercentageOfBasic ?? 40);
    setPfCalculationBasis(schemaDefaults?.pfCalculationBasis || "StatutoryWageCeiling");
    setPfWageCeiling(schemaDefaults?.pfWageCeiling ?? 15000);
    setPfEmployeeRate(schemaDefaults?.pfEmployeeRate ?? 12);
    setPfEmployerRate(schemaDefaults?.pfEmployerRate ?? 12);
    setIsEsiEnabled(schemaDefaults?.isEsiEnabled ?? true);
    setEsiWageCeiling(schemaDefaults?.esiWageCeiling ?? 21000);
    setEsiEmployeeRate(schemaDefaults?.esiEmployeeRate ?? 0.75);
    setEsiEmployerRate(schemaDefaults?.esiEmployerRate ?? 3.25);
    setProfessionalTaxMonthly(schemaDefaults?.professionalTaxMonthly ?? 200);
    setPayDayOfMonth(schemaDefaults?.payDayOfMonth ?? 1);
    setAllowNegativeTakeHome(schemaDefaults?.allowNegativeTakeHome ?? false);
    setIsDefault(schemaDefaults?.isDefault ?? false);
  };

  const handleSubmit = async () => {
    const payload: PayrollPolicyInput = {
      name,
      description,
      companyId: companyId ? companyId : undefined,
      projectId: projectId ? projectId : undefined,
      payCycle,
      basicPercentageOfGross: Number(basicPercentageOfGross),
      hraPercentageOfBasic: Number(hraPercentageOfBasic),
      pfCalculationBasis,
      pfWageCeiling: Number(pfWageCeiling),
      pfEmployeeRate: Number(pfEmployeeRate),
      pfEmployerRate: Number(pfEmployerRate),
      isEsiEnabled,
      esiWageCeiling: Number(esiWageCeiling),
      esiEmployeeRate: Number(esiEmployeeRate),
      esiEmployerRate: Number(esiEmployerRate),
      professionalTaxMonthly: Number(professionalTaxMonthly),
      payDayOfMonth: Number(payDayOfMonth),
      allowNegativeTakeHome,
      isDefault,
      status: "Active",
    };

    const ok = await onSave(payload, isCreatingNew ? undefined : selectedPolicyId);
    if (ok) {
      setIsCreatingNew(false);
    }
  };

  return (
    <SideDrawer
      open={open}
      onClose={() => onOpenChange(false)}
      title="Payroll & Compensation Policy Studio"
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
        {/* Policy Selector & Creation Bar */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-900">Configured Compensation Policies</span>
            <button
              type="button"
              onClick={handleStartCreateNew}
              className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
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
                      ? "border-indigo-600 bg-indigo-50 text-indigo-700 font-bold"
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 rounded-xl border border-indigo-100 bg-indigo-50/50 p-3">
            <div>
              <label className={erpFormLabelClassName}>Applicable Company (Optional)</label>
              <select
                value={companyId}
                onChange={(e) => {
                  setCompanyId(e.target.value);
                  setProjectId(""); // Reset project when company changes
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
              <label className={erpFormLabelClassName}>Policy Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={erpFormInputClassName}
                placeholder="e.g. Standard Corporate Wage Policy"
              />
            </div>
            <div>
              <label className={erpFormLabelClassName}>Description</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={erpFormInputClassName}
                placeholder="Brief description of application scope"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={erpFormLabelClassName}>Pay Cycle Basis</label>
              <select
                value={payCycle}
                onChange={(e) => setPayCycle(e.target.value as typeof payCycle)}
                className={erpFormInputClassName}
              >
                <option value="Fixed30Days">Fixed 30 Days Basis (Standard Indian Payroll)</option>
                <option value="CalendarMonth">Actual Days in Month (28/29/30/31)</option>
                <option value="WorkingDaysOnly">Working Days Only (Excluding Sundays/Holidays)</option>
              </select>
            </div>
            <div>
              <label className={erpFormLabelClassName}>Disbursement Day of Month</label>
              <input
                type="number"
                min="1"
                max="31"
                value={payDayOfMonth}
                onChange={(e) => setPayDayOfMonth(Number(e.target.value))}
                className={erpFormInputClassName}
              />
            </div>
          </div>

          {/* CTC Component Split */}
          <div className="rounded-xl border border-slate-200 p-4 space-y-4">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Percent className="h-3.5 w-3.5 text-indigo-600" />
              CTC Salary Structure Split Rules
            </h4>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={erpFormLabelClassName}>Basic Salary (% of Gross CTC)</label>
                <input
                  type="number"
                  min="10"
                  max="100"
                  value={basicPercentageOfGross}
                  onChange={(e) => setBasicPercentageOfGross(Number(e.target.value))}
                  className={erpFormInputClassName}
                />
                <p className="text-[10px] text-slate-400 mt-1">Code on Wages recommends 50% minimum basic.</p>
              </div>
              <div>
                <label className={erpFormLabelClassName}>HRA Allowance (% of Basic)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={hraPercentageOfBasic}
                  onChange={(e) => setHraPercentageOfBasic(Number(e.target.value))}
                  className={erpFormInputClassName}
                />
                <p className="text-[10px] text-slate-400 mt-1">40% for non-metro, 50% for metro cities.</p>
              </div>
            </div>
          </div>

          {/* Statutory Social Security (PF & ESI) */}
          <div className="rounded-xl border border-slate-200 p-4 space-y-4">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              Statutory Social Security (PF & ESI) Enforcement
            </h4>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={erpFormLabelClassName}>PF Calculation Basis</label>
                <select
                  value={pfCalculationBasis}
                  onChange={(e) => setPfCalculationBasis(e.target.value as typeof pfCalculationBasis)}
                  className={erpFormInputClassName}
                >
                  <option value="StatutoryWageCeiling">Capped at Statutory Ceiling (₹15,000 / ₹1,800 max)</option>
                  <option value="ActualBasic">Uncapped on Actual Basic Wage (12%)</option>
                  <option value="Disabled">Disabled / Exempt</option>
                </select>
              </div>
              <div>
                <label className={erpFormLabelClassName}>Statutory PF Wage Ceiling (₹)</label>
                <input
                  type="number"
                  value={pfWageCeiling}
                  onChange={(e) => setPfWageCeiling(Number(e.target.value))}
                  className={erpFormInputClassName}
                />
              </div>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <div>
                <p className="text-xs font-semibold text-slate-800">Enable Employee State Insurance (ESI)</p>
                <p className="text-[11px] text-slate-500">Statutory 0.75% employee + 3.25% employer contribution</p>
              </div>
              <Switch checked={isEsiEnabled} onCheckedChange={setIsEsiEnabled} />
            </div>

            {isEsiEnabled && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className={erpFormLabelClassName}>ESI Monthly Wage Ceiling (₹)</label>
                  <input
                    type="number"
                    value={esiWageCeiling}
                    onChange={(e) => setEsiWageCeiling(Number(e.target.value))}
                    className={erpFormInputClassName}
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Current statutory limit: ₹21,000/month.</p>
                </div>
                <div>
                  <label className={erpFormLabelClassName}>Monthly Professional Tax (₹)</label>
                  <input
                    type="number"
                    value={professionalTaxMonthly}
                    onChange={(e) => setProfessionalTaxMonthly(Number(e.target.value))}
                    className={erpFormInputClassName}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </SideDrawer>
  );
}
