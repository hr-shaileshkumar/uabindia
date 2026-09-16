"use client";

import { useState, useEffect } from "react";
import { SideDrawer } from "@/components/ui/side-drawer";
import { ErpDrawerFooter } from "@/components/workspace/page-kit";
import {
  erpFormInputClassName,
  erpFormLabelClassName,
} from "@/components/workspace/styles";
import { Switch } from "@/components/ui/switch";
import {
  ShieldCheck,
  Plus,
  Clock,
  MapPin,
  ArrowLeftRight,
  TrendingDown,
  CalendarDays,
  Zap,
  CheckCircle2,
} from "lucide-react";
import { hrmsApi } from "@/services/modules";
import { orgApi } from "@/services/modules/org";
import type {
  AttendancePolicy,
  PunchPolicyMode,
  DeductionBasis,
  LatePenaltyAction,
  WeekOffPattern,
} from "../types/attendance-policy.types";
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
  const [shiftsList, setShiftsList] = useState<Array<{ id: string; name: string; code?: string }>>([]);

  // Load companies & shifts on open
  useEffect(() => {
    if (!open) return;
    orgApi.company.getAll(1, 100)
      .then((res: any) => {
        const comps = res?.data?.items || res?.data?.companies || [];
        setCompaniesList(comps.map((c: any) => ({ id: c.id, name: c.name })));
      })
      .catch(() => {});

    hrmsApi.hrms.shifts.list()
      .then((res: any) => {
        const shifts = res?.data?.items || res?.data || [];
        setShiftsList(shifts.map((s: any) => ({ id: s.id, name: s.name, code: s.code })));
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

  // ── Form State ──
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
  const [punchMode, setPunchMode] = useState<PunchPolicyMode>("TwoPunchFirstInLastOut");
  const [minPunchesRequiredPerDay, setMinPunchesRequiredPerDay] = useState(2);
  const [earlyExitToleranceMinutes, setEarlyExitToleranceMinutes] = useState(15);
  const [missingPunchPenalty, setMissingPunchPenalty] = useState("HalfDay");
  const [missingPunchGraceDays, setMissingPunchGraceDays] = useState(3);
  const [defaultShiftId, setDefaultShiftId] = useState<string>("");
  const [isDefault, setIsDefault] = useState(false);

  // Dynamic Deduction & Late Matrices
  const [deductionBasis, setDeductionBasis] = useState<DeductionBasis>("MonthlyAccumulatedSlabs");
  const [allowDailyShortfallOffsetWithOt, setAllowDailyShortfallOffsetWithOt] = useState(false);
  const [monthlyFreeLateDays, setMonthlyFreeLateDays] = useState(3);
  const [latePenaltyStepFrequency, setLatePenaltyStepFrequency] = useState(1);
  const [latePenaltyAction, setLatePenaltyAction] = useState<LatePenaltyAction>("HalfDay");
  const [minorLateWindowMinutes, setMinorLateWindowMinutes] = useState(15);
  const [majorLateThresholdMinutes, setMajorLateThresholdMinutes] = useState(45);

  // Early Exit
  const [earlyExitThresholdMinutes, setEarlyExitThresholdMinutes] = useState(60);
  const [earlyExitPenaltyAction, setEarlyExitPenaltyAction] = useState<LatePenaltyAction>("HalfDay");

  // Overtime & Week-Off
  const [minMinutesForOvertime, setMinMinutesForOvertime] = useState(30);
  const [requireOvertimeApproval, setRequireOvertimeApproval] = useState(false);
  const [normalDayOtMultiplier, setNormalDayOtMultiplier] = useState(1.5);
  const [weekendOtMultiplier, setWeekendOtMultiplier] = useState(2.0);
  const [holidayOtMultiplier, setHolidayOtMultiplier] = useState(2.5);
  const [allowCompOffInsteadOfPay, setAllowCompOffInsteadOfPay] = useState(true);
  const [weekOffPattern, setWeekOffPattern] = useState<WeekOffPattern>("SundayOnly");

  // Fetch statutory defaults on open or scope change
  useEffect(() => {
    if (!open) return;
    void hrmsApi.hrms.attendance.policies.getSchema(companyId || undefined, projectId || undefined)
      .then((res: any) => {
        if (res?.data?.defaults) {
          setSchemaDefaults(res.data.defaults);
        }
      })
      .catch(() => {});
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
    setPunchMode(policy.punchMode ?? "TwoPunchFirstInLastOut");
    setMinPunchesRequiredPerDay(policy.minPunchesRequiredPerDay ?? 2);
    setEarlyExitToleranceMinutes(policy.earlyExitToleranceMinutes ?? 15);
    setMissingPunchPenalty(policy.missingPunchPenalty ?? "HalfDay");
    setMissingPunchGraceDays(policy.missingPunchGraceDays ?? 3);
    setDefaultShiftId(policy.defaultShiftId ?? "");
    setIsDefault(policy.isDefault);

    // New Dynamic Policy Fields
    setDeductionBasis(policy.deductionBasis ?? "MonthlyAccumulatedSlabs");
    setAllowDailyShortfallOffsetWithOt(policy.allowDailyShortfallOffsetWithOt ?? false);
    setMonthlyFreeLateDays(policy.monthlyFreeLateDays ?? 3);
    setLatePenaltyStepFrequency(policy.latePenaltyStepFrequency ?? 1);
    setLatePenaltyAction(policy.latePenaltyAction ?? "HalfDay");
    setMinorLateWindowMinutes(policy.minorLateWindowMinutes ?? 15);
    setMajorLateThresholdMinutes(policy.majorLateThresholdMinutes ?? 45);
    setEarlyExitThresholdMinutes(policy.earlyExitThresholdMinutes ?? 60);
    setEarlyExitPenaltyAction(policy.earlyExitPenaltyAction ?? "HalfDay");
    setMinMinutesForOvertime(policy.minMinutesForOvertime ?? 30);
    setRequireOvertimeApproval(policy.requireOvertimeApproval ?? false);
    setNormalDayOtMultiplier(policy.normalDayOtMultiplier ?? 1.5);
    setWeekendOtMultiplier(policy.weekendOtMultiplier ?? 2.0);
    setHolidayOtMultiplier(policy.holidayOtMultiplier ?? 2.5);
    setAllowCompOffInsteadOfPay(policy.allowCompOffInsteadOfPay ?? true);
    setWeekOffPattern(policy.weekOffPattern ?? "SundayOnly");
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
    setName(schemaDefaults?.name || "Standard Organization Policy");
    setDescription(schemaDefaults?.description || "Dynamic database-stored attendance calculation policy.");
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
    setPunchMode("TwoPunchFirstInLastOut");
    setMinPunchesRequiredPerDay(2);
    setEarlyExitToleranceMinutes(15);
    setMissingPunchPenalty("HalfDay");
    setMissingPunchGraceDays(3);
    setDefaultShiftId("");
    setIsDefault(false);
    setDeductionBasis("MonthlyAccumulatedSlabs");
    setAllowDailyShortfallOffsetWithOt(false);
    setMonthlyFreeLateDays(3);
    setLatePenaltyStepFrequency(1);
    setLatePenaltyAction("HalfDay");
    setMinorLateWindowMinutes(15);
    setMajorLateThresholdMinutes(45);
    setEarlyExitThresholdMinutes(60);
    setEarlyExitPenaltyAction("HalfDay");
    setMinMinutesForOvertime(30);
    setRequireOvertimeApproval(false);
    setNormalDayOtMultiplier(1.5);
    setWeekendOtMultiplier(2.0);
    setHolidayOtMultiplier(2.5);
    setAllowCompOffInsteadOfPay(true);
    setWeekOffPattern("SundayOnly");
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
      punchMode,
      minPunchesRequiredPerDay: Number(minPunchesRequiredPerDay),
      earlyExitToleranceMinutes: Number(earlyExitToleranceMinutes),
      missingPunchPenalty,
      missingPunchGraceDays: Number(missingPunchGraceDays),
      defaultShiftId: defaultShiftId || undefined,
      isDefault,
      status: "Active",

      // Dynamic Deduction & Late Matrices
      deductionBasis,
      allowDailyShortfallOffsetWithOt,
      monthlyFreeLateDays: Number(monthlyFreeLateDays),
      latePenaltyStepFrequency: Number(latePenaltyStepFrequency),
      latePenaltyAction,
      minorLateWindowMinutes: Number(minorLateWindowMinutes),
      majorLateThresholdMinutes: Number(majorLateThresholdMinutes),
      earlyExitThresholdMinutes: Number(earlyExitThresholdMinutes),
      earlyExitPenaltyAction,
      minMinutesForOvertime: Number(minMinutesForOvertime),
      requireOvertimeApproval,
      normalDayOtMultiplier: Number(normalDayOtMultiplier),
      weekendOtMultiplier: Number(weekendOtMultiplier),
      holidayOtMultiplier: Number(holidayOtMultiplier),
      allowCompOffInsteadOfPay,
      weekOffPattern,
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
      subtitle="Enterprise policy configuration dynamically stored in and verified from the database"
      width="lg"
      footer={
        <ErpDrawerFooter
          onCancel={() => onOpenChange(false)}
          saveLabel={saving ? "Saving to Database..." : isCreatingNew ? "Save Policy to Database" : "Update Database Policy"}
          onSave={handleSubmit}
          saving={saving}
        />
      }
    >
      <div className="space-y-6">
        {/* Policy Selector & Creation Bar */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-900">Database Policies</span>
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

        {/* Form Container */}
        <div className="space-y-5">
          {/* Scope Hierarchy */}
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
                placeholder="e.g. Standard 8h Shift Policy"
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

          {/* Section 1: Deduction Basis Engine */}
          <div className="rounded-xl border border-rose-200 bg-rose-50/20 p-4 space-y-4">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingDown className="h-3.5 w-3.5 text-rose-600" />
              Deduction Basis &amp; Shortfall Calculation Engine
            </h4>
            <p className="text-[11px] text-slate-500">
              Determines how check-in shortfalls and late arrivals are penalized mathematically in the database.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                {
                  id: "HourlyPayAsYouGo",
                  title: "Hourly Pay-As-You-Go",
                  desc: "Deduct salary per minute/hour worked below shift target (no step penalty)",
                },
                {
                  id: "MonthlyAccumulatedSlabs",
                  title: "Monthly Slabs (Default)",
                  desc: "3 Free grace days. 4th late = 0.5 Day cut. 7th late = 0.5 Day cut.",
                },
                {
                  id: "HybridBoth",
                  title: "Hybrid (Both)",
                  desc: "Daily hourly shortfall tracking combined with recurring late marks escalation.",
                },
              ].map((opt) => (
                <label
                  key={opt.id}
                  className={`flex flex-col p-3 rounded-xl border cursor-pointer transition-all ${
                    deductionBasis === opt.id
                      ? "border-rose-600 bg-white ring-2 ring-rose-500/20 shadow-sm"
                      : "border-slate-200 bg-white/60 hover:bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-900">{opt.title}</span>
                    <input
                      type="radio"
                      name="deductionBasis"
                      value={opt.id}
                      checked={deductionBasis === opt.id}
                      onChange={() => setDeductionBasis(opt.id as DeductionBasis)}
                      className="text-rose-600 focus:ring-rose-500 h-3.5 w-3.5"
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 leading-tight">{opt.desc}</span>
                </label>
              ))}
            </div>

            <div className="flex items-center justify-between py-2 border-t border-rose-100">
              <div>
                <p className="text-xs font-semibold text-slate-800">Daily Shortfall Offset with Overtime</p>
                <p className="text-[11px] text-slate-500">Allow employee to compensate late arrival or early exit with overtime on the same day</p>
              </div>
              <Switch checked={allowDailyShortfallOffsetWithOt} onCheckedChange={setAllowDailyShortfallOffsetWithOt} />
            </div>
          </div>

          {/* Section 2: Progressive Late Coming & Early Departure Matrix */}
          <div className="rounded-xl border border-amber-200 bg-amber-50/20 p-4 space-y-4">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-amber-600" />
              Late Coming &amp; Early Exit Penalty Matrix
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className={erpFormLabelClassName}>Monthly Free Late Days</label>
                <input
                  type="number"
                  min={0}
                  max={31}
                  value={monthlyFreeLateDays}
                  onChange={(e) => setMonthlyFreeLateDays(Number(e.target.value))}
                  className={erpFormInputClassName}
                />
                <span className="text-[10px] text-slate-400">e.g. 1st to 3rd late: 0 penalty</span>
              </div>
              <div>
                <label className={erpFormLabelClassName}>Penalty Step Frequency</label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={latePenaltyStepFrequency}
                  onChange={(e) => setLatePenaltyStepFrequency(Number(e.target.value))}
                  className={erpFormInputClassName}
                />
                <span className="text-[10px] text-slate-400">e.g. Every 1 or 3 lates thereafter</span>
              </div>
              <div>
                <label className={erpFormLabelClassName}>Late Penalty Action</label>
                <select
                  value={latePenaltyAction}
                  onChange={(e) => setLatePenaltyAction(e.target.value as LatePenaltyAction)}
                  className={erpFormInputClassName}
                >
                  <option value="QuarterDay">0.25 Day Cut (Quarter-Day)</option>
                  <option value="HalfDay">0.50 Day Cut (Half-Day)</option>
                  <option value="FullDay">1.00 Day Cut (Full-Day LOP)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-amber-100">
              <div>
                <label className={erpFormLabelClassName}>Minor Late Window (Mins)</label>
                <input
                  type="number"
                  value={minorLateWindowMinutes}
                  onChange={(e) => setMinorLateWindowMinutes(Number(e.target.value))}
                  className={erpFormInputClassName}
                />
                <span className="text-[10px] text-slate-400">e.g. 15m grace</span>
              </div>
              <div>
                <label className={erpFormLabelClassName}>Major Late Cutoff (Mins)</label>
                <input
                  type="number"
                  value={majorLateThresholdMinutes}
                  onChange={(e) => setMajorLateThresholdMinutes(Number(e.target.value))}
                  className={erpFormInputClassName}
                />
                <span className="text-[10px] text-slate-400">&gt;45m = Half-Day; &gt;120m = Absent</span>
              </div>
              <div>
                <label className={erpFormLabelClassName}>Early Exit Cutoff (Mins)</label>
                <input
                  type="number"
                  value={earlyExitThresholdMinutes}
                  onChange={(e) => setEarlyExitThresholdMinutes(Number(e.target.value))}
                  className={erpFormInputClassName}
                />
                <span className="text-[10px] text-slate-400">&gt;60m early triggers penalty</span>
              </div>
            </div>
          </div>

          {/* Section 3: Overtime Multipliers & Week-Off Rules */}
          <div className="rounded-xl border border-purple-200 bg-purple-50/20 p-4 space-y-4">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-purple-600" />
              Overtime Multipliers &amp; Weekly-Off Pattern
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className={erpFormLabelClassName}>Normal Working Day OT Rate</label>
                <input
                  type="number"
                  step="0.1"
                  value={normalDayOtMultiplier}
                  onChange={(e) => setNormalDayOtMultiplier(Number(e.target.value))}
                  className={erpFormInputClassName}
                />
                <span className="text-[10px] text-slate-400">Standard statutory 1.5x</span>
              </div>
              <div>
                <label className={erpFormLabelClassName}>Weekend / Rest Day OT Rate</label>
                <input
                  type="number"
                  step="0.1"
                  value={weekendOtMultiplier}
                  onChange={(e) => setWeekendOtMultiplier(Number(e.target.value))}
                  className={erpFormInputClassName}
                />
                <span className="text-[10px] text-slate-400">Standard statutory 2.0x</span>
              </div>
              <div>
                <label className={erpFormLabelClassName}>Public Holiday OT Rate</label>
                <input
                  type="number"
                  step="0.1"
                  value={holidayOtMultiplier}
                  onChange={(e) => setHolidayOtMultiplier(Number(e.target.value))}
                  className={erpFormInputClassName}
                />
                <span className="text-[10px] text-slate-400">Standard statutory 2.5x</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-purple-100">
              <div>
                <label className={erpFormLabelClassName}>Weekly-Off Schedule Pattern</label>
                <select
                  value={weekOffPattern}
                  onChange={(e) => setWeekOffPattern(e.target.value as WeekOffPattern)}
                  className={erpFormInputClassName}
                >
                  <option value="SundayOnly">Sunday Only (Standard 6-day week)</option>
                  <option value="AlternateSaturdaySunday">Sunday + 2nd &amp; 4th Saturday</option>
                  <option value="AllSaturdaysSunday">Saturday &amp; Sunday (5-day week)</option>
                  <option value="Custom">Custom / Dynamic Shift Roster</option>
                </select>
              </div>
              <div>
                <label className={erpFormLabelClassName}>Min Overtime Required (Mins)</label>
                <input
                  type="number"
                  value={minMinutesForOvertime}
                  onChange={(e) => setMinMinutesForOvertime(Number(e.target.value))}
                  className={erpFormInputClassName}
                />
                <span className="text-[10px] text-slate-400">Minimum continuous OT span to trigger calculation</span>
              </div>
            </div>

            <div className="flex items-center justify-between py-2 border-t border-purple-100">
              <div>
                <p className="text-xs font-semibold text-slate-800">Allow Comp-Off Banking</p>
                <p className="text-[11px] text-slate-500">Convert holiday or weekend overtime into compensatory off leave balance</p>
              </div>
              <Switch checked={allowCompOffInsteadOfPay} onCheckedChange={setAllowCompOffInsteadOfPay} />
            </div>
          </div>

          {/* Section 4: Punch Modes & Hardware Verification */}
          <div className="rounded-xl border border-indigo-200 bg-indigo-50/20 p-4 space-y-4">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <ArrowLeftRight className="h-3.5 w-3.5 text-indigo-600" />
              Punch Tracking Modes &amp; Missing Punch Penalties
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                {
                  id: "TwoPunchFirstInLastOut",
                  title: "Standard 2-Punch",
                  desc: "First IN & Last OUT of the day. Ideal for corporate desks.",
                },
                {
                  id: "MultiPunchPairwise",
                  title: "Multi-Punch Interval",
                  desc: "Exact break & work sessions. Recommended for hospital shifts & factory floors.",
                },
                {
                  id: "SplitShiftFourPunch",
                  title: "Split Shift (4-Punch)",
                  desc: "Two distinct slots: Morning & Evening. Both required for full-day credit.",
                },
                {
                  id: "ContinuousRoaming",
                  title: "Continuous Field Roaming",
                  desc: "Mobile patrol & site inspection checkpoints. Validates field presence.",
                },
              ].map((m) => (
                <label
                  key={m.id}
                  className={`flex flex-col p-3 rounded-xl border cursor-pointer transition-all ${
                    punchMode === m.id
                      ? "border-indigo-600 bg-white ring-2 ring-indigo-500/20 shadow-sm"
                      : "border-slate-200 bg-white/60 hover:bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-900">{m.title}</span>
                    <input
                      type="radio"
                      name="punchMode"
                      value={m.id}
                      checked={punchMode === m.id}
                      onChange={() => setPunchMode(m.id as PunchPolicyMode)}
                      className="text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 leading-tight">{m.desc}</span>
                </label>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-indigo-100">
              <div>
                <label className={erpFormLabelClassName}>Missing Punch Penalty Action</label>
                <select
                  value={missingPunchPenalty}
                  onChange={(e) => setMissingPunchPenalty(e.target.value)}
                  className={erpFormInputClassName}
                >
                  <option value="HalfDay">Mark Half-Day (0.5 Day Cut)</option>
                  <option value="Absent">Mark Absent (Full-Day LOP)</option>
                  <option value="FlagForReview">Flag For Manager Review Only</option>
                </select>
              </div>
              <div>
                <label className={erpFormLabelClassName}>Self-Service Regularization Window (Days)</label>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={missingPunchGraceDays}
                  onChange={(e) => setMissingPunchGraceDays(Number(e.target.value))}
                  className={erpFormInputClassName}
                />
                <span className="text-[10px] text-slate-400">Grace period before auto-penalty applies</span>
              </div>
            </div>
          </div>

          {/* Section 5: Geofence GPS & Facial Recognition */}
          <div className="rounded-xl border border-slate-200 p-4 space-y-4">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-emerald-600" />
              Geofence GPS &amp; Biometric Hardware Enforcement
            </h4>

            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <div>
                <p className="text-xs font-semibold text-slate-800">Require GPS Geofencing</p>
                <p className="text-[11px] text-slate-500">Punches only allowed within authorized office/site coordinates</p>
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
                <p className="text-[11px] text-slate-500">Validate live camera selfie against registered facial embedding vector</p>
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
