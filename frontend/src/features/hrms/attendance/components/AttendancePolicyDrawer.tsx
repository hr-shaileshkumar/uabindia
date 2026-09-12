"use client";

import { useState, useEffect } from "react";
import { SideDrawer } from "@/components/ui/side-drawer";
import { ErpDrawerFooter } from "@/components/workspace/page-kit";
import {
  erpButtonClassName,
  erpFormInputClassName,
  erpFormLabelClassName,
  erpPanelBodyClassName,
  erpPanelClassName,
} from "@/components/workspace/styles";
import { Switch } from "@/components/ui/switch";
import { ShieldCheck, Plus, CheckCircle2, Clock, MapPin, Sparkles } from "lucide-react";
import { hrmsApi } from "@/services/modules";
import { orgApi } from "@/services/modules/org";
import type { AttendancePolicy } from "../types/attendance-policy.types";
import type { AttendancePolicyInput } from "../schemas/attendance-policy.schema";

interface AttendancePolicyDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  policies: AttendancePolicy[];
  activePolicy: AttendancePolicy | null;
  saving: boolean;
  onSave: (policyData: AttendancePolicyInput, policyId?: string) => Promise<boolean>;
  onSetDefault: (policyId: string) => Promise<boolean>;
}

export function AttendancePolicyDrawer({
  open,
  onOpenChange,
  policies,
  activePolicy,
  saving,
  onSave,
  onSetDefault,
}: AttendancePolicyDrawerProps) {
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
  const [standardShiftHours, setStandardShiftHours] = useState(8);
  const [minHalfDayHours, setMinHalfDayHours] = useState(4);
  const [gracePeriodMinutes, setGracePeriodMinutes] = useState(15);
  const [overtimeThresholdHours, setOvertimeThresholdHours] = useState(8);
  const [maxContinuousHours, setMaxContinuousHours] = useState(16);
  const [autoDeductBreakMinutes, setAutoDeductBreakMinutes] = useState(60);
  const [requireGeofence, setRequireGeofence] = useState(false);
  const [allowedRadiusMeters, setAllowedRadiusMeters] = useState(250);
  const [requireFacialVerification, setRequireFacialVerification] = useState(false);
  const [minFacialConfidenceScore, setMinFacialConfidenceScore] = useState(75);
  const [allowManualRegularization, setAllowManualRegularization] = useState(true);
  const [maxRegularizationsPerMonth, setMaxRegularizationsPerMonth] = useState(3);
  const [isDefault, setIsDefault] = useState(false);

  // Fetch backend UI schema & statutory defaults on open or scope change
  useEffect(() => {
    if (!open) return;
    void hrmsApi.hrms.attendance.policies.getSchema(companyId || undefined, projectId || undefined)
      .then((res: any) => {
        if (res?.data?.defaults) {
          setSchemaDefaults(res.data.defaults);
        }
      })
      .catch(() => {
        // Fallback gracefully if offline
      });
  }, [open, companyId, projectId]);

  const loadPolicyIntoForm = (policy: AttendancePolicy) => {
    setName(policy.name);
    setDescription(policy.description ?? "");
    setCompanyId(policy.companyId ?? "");
    setProjectId(policy.projectId ?? "");
    setStandardShiftHours(policy.standardShiftHours);
    setMinHalfDayHours(policy.minHalfDayHours);
    setGracePeriodMinutes(policy.gracePeriodMinutes);
    setOvertimeThresholdHours(policy.overtimeThresholdHours);
    setMaxContinuousHours(policy.maxContinuousHours);
    setAutoDeductBreakMinutes(policy.autoDeductBreakMinutes);
    setRequireGeofence(policy.requireGeofence);
    setAllowedRadiusMeters(policy.allowedRadiusMeters ?? 250);
    setRequireFacialVerification(policy.requireFacialVerification);
    setMinFacialConfidenceScore(policy.minFacialConfidenceScore ?? 75);
    setAllowManualRegularization(policy.allowManualRegularization);
    setMaxRegularizationsPerMonth(policy.maxRegularizationsPerMonth ?? 3);
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
    setName(schemaDefaults?.name || "Standard Hospital Shift Policy");
    setDescription(schemaDefaults?.description || "Configurable shift timings and geofencing governed by backend rules.");
    setStandardShiftHours(schemaDefaults?.standardShiftHours ?? 8.0);
    setMinHalfDayHours(schemaDefaults?.minHalfDayHours ?? 4.0);
    setGracePeriodMinutes(schemaDefaults?.gracePeriodMinutes ?? 15);
    setOvertimeThresholdHours(schemaDefaults?.overtimeThresholdHours ?? 8.0);
    setMaxContinuousHours(schemaDefaults?.maxContinuousHours ?? 16.0);
    setAutoDeductBreakMinutes(schemaDefaults?.autoDeductBreakMinutes ?? 60);
    setRequireGeofence(schemaDefaults?.requireGeofence ?? false);
    setAllowedRadiusMeters(schemaDefaults?.allowedRadiusMeters ?? 250);
    setRequireFacialVerification(schemaDefaults?.requireFacialVerification ?? false);
    setMinFacialConfidenceScore(schemaDefaults?.minFacialConfidenceScore ?? 75);
    setAllowManualRegularization(schemaDefaults?.allowManualRegularization ?? true);
    setMaxRegularizationsPerMonth(schemaDefaults?.maxRegularizationsPerMonth ?? 3);
    setIsDefault(false);
  };

  const handleSubmit = async () => {
    const payload: AttendancePolicyInput = {
      name,
      description,
      companyId: companyId || undefined,
      projectId: projectId || undefined,
      standardShiftHours: Number(standardShiftHours),
      minHalfDayHours: Number(minHalfDayHours),
      gracePeriodMinutes: Number(gracePeriodMinutes),
      overtimeThresholdHours: Number(overtimeThresholdHours),
      maxContinuousHours: Number(maxContinuousHours),
      autoDeductBreakMinutes: Number(autoDeductBreakMinutes),
      requireGeofence,
      allowedRadiusMeters: Number(allowedRadiusMeters),
      requireFacialVerification,
      minFacialConfidenceScore: Number(minFacialConfidenceScore),
      allowManualRegularization,
      maxRegularizationsPerMonth: Number(maxRegularizationsPerMonth),
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
      title="Attendance & Shift Policy Studio"
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

        {/* Policy Details Form */}
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
              <label className={erpFormLabelClassName}>Policy Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={erpFormInputClassName}
                placeholder="e.g. Standard General Shift"
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

          <div className="rounded-xl border border-slate-200 p-4 space-y-4">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-blue-600" />
              Working Hours & Overtime Rules
            </h4>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className={erpFormLabelClassName}>Standard Shift (Hours)</label>
                <input
                  type="number"
                  step="0.5"
                  value={standardShiftHours}
                  onChange={(e) => setStandardShiftHours(Number(e.target.value))}
                  className={erpFormInputClassName}
                />
              </div>
              <div>
                <label className={erpFormLabelClassName}>Half-Day Minimum (Hours)</label>
                <input
                  type="number"
                  step="0.5"
                  value={minHalfDayHours}
                  onChange={(e) => setMinHalfDayHours(Number(e.target.value))}
                  className={erpFormInputClassName}
                />
              </div>
              <div>
                <label className={erpFormLabelClassName}>Late Punch Grace (Mins)</label>
                <input
                  type="number"
                  value={gracePeriodMinutes}
                  onChange={(e) => setGracePeriodMinutes(Number(e.target.value))}
                  className={erpFormInputClassName}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className={erpFormLabelClassName}>Overtime Starts After (Hours)</label>
                <input
                  type="number"
                  step="0.5"
                  value={overtimeThresholdHours}
                  onChange={(e) => setOvertimeThresholdHours(Number(e.target.value))}
                  className={erpFormInputClassName}
                />
              </div>
              <div>
                <label className={erpFormLabelClassName}>Auto Break Deduction (Mins)</label>
                <input
                  type="number"
                  value={autoDeductBreakMinutes}
                  onChange={(e) => setAutoDeductBreakMinutes(Number(e.target.value))}
                  className={erpFormInputClassName}
                />
              </div>
              <div>
                <label className={erpFormLabelClassName}>Max Shift Anomaly Limit (Hours)</label>
                <input
                  type="number"
                  value={maxContinuousHours}
                  onChange={(e) => setMaxContinuousHours(Number(e.target.value))}
                  className={erpFormInputClassName}
                />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 p-4 space-y-4">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-emerald-600" />
              Geofence GPS & Biometric Enforcement
            </h4>
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <div>
                <p className="text-xs font-semibold text-slate-800">Require GPS Geofencing</p>
                <p className="text-[11px] text-slate-500">Punches only allowed within office radius coordinates</p>
              </div>
              <Switch checked={requireGeofence} onCheckedChange={setRequireGeofence} />
            </div>

            {requireGeofence && (
              <div>
                <label className={erpFormLabelClassName}>Allowed Radius (Meters)</label>
                <input
                  type="number"
                  value={allowedRadiusMeters}
                  onChange={(e) => setAllowedRadiusMeters(Number(e.target.value))}
                  className={erpFormInputClassName}
                />
              </div>
            )}

            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <div>
                <p className="text-xs font-semibold text-slate-800">Require Facial Recognition (FRS)</p>
                <p className="text-[11px] text-slate-500">Validate live webcam/mobile selfie against registered vector</p>
              </div>
              <Switch checked={requireFacialVerification} onCheckedChange={setRequireFacialVerification} />
            </div>

            {requireFacialVerification && (
              <div>
                <label className={erpFormLabelClassName}>Minimum Face Match Confidence (%)</label>
                <input
                  type="number"
                  value={minFacialConfidenceScore}
                  onChange={(e) => setMinFacialConfidenceScore(Number(e.target.value))}
                  className={erpFormInputClassName}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </SideDrawer>
  );
}
