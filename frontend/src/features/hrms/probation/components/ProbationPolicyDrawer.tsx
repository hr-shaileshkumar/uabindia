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
import {
  Plus,
  ShieldCheck,
  Calendar,
  Clock,
  Award,
  Users,
  CheckCircle2,
  FileCheck2,
} from "lucide-react";
import { hrmsApi } from "@/services/modules";
import { orgApi } from "@/services/modules/org";
import type { ProbationPolicy } from "../types/probation-policy.types";
import type { ProbationPolicyInput } from "../schemas/probation-policy.schema";

interface ProbationPolicyDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  policies: ProbationPolicy[];
  activePolicy: ProbationPolicy | null;
  saving: boolean;
  onSave: (policyData: ProbationPolicyInput, policyId?: string) => Promise<boolean>;
  onSetDefault: (policyId: string) => Promise<boolean>;
}

export function ProbationPolicyDrawer({
  open,
  onOpenChange,
  policies,
  activePolicy,
  saving,
  onSave,
  onSetDefault,
}: ProbationPolicyDrawerProps) {
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
  const [defaultProbationMonths, setDefaultProbationMonths] = useState(3);
  const [maxExtensionMonths, setMaxExtensionMonths] = useState(3);
  const [noticePeriodDaysProbation, setNoticePeriodDaysProbation] = useState(15);
  const [noticePeriodDaysConfirmed, setNoticePeriodDaysConfirmed] = useState(60);
  const [evaluationReminderDaysBeforeEnd, setEvaluationReminderDaysBeforeEnd] = useState(15);
  const [requiresManagerReview, setRequiresManagerReview] = useState(true);
  const [requiresHodApproval, setRequiresHodApproval] = useState(true);
  const [autoConfirmationAllowed, setAutoConfirmationAllowed] = useState(false);
  const [minimumReviewScoreForConfirmation, setMinimumReviewScoreForConfirmation] = useState(70);
  const [isDefault, setIsDefault] = useState(false);

  // Fetch backend UI schema & statutory defaults on open or scope change
  useEffect(() => {
    if (!open) return;
    void hrmsApi.hrms.probation.policies.getSchema(companyId || undefined, projectId || undefined)
      .then((res: any) => {
        if (res?.data?.defaults) {
          setSchemaDefaults(res.data.defaults);
        }
      })
      .catch(() => {
        // Fallback gracefully if offline
      });
  }, [open, companyId, projectId]);

  const loadPolicyIntoForm = (policy: ProbationPolicy) => {
    setName(policy.name);
    setDescription(policy.description ?? "");
    setCompanyId(policy.companyId ?? "");
    setProjectId(policy.projectId ?? "");
    setDefaultProbationMonths(policy.defaultProbationMonths);
    setMaxExtensionMonths(policy.maxExtensionMonths);
    setNoticePeriodDaysProbation(policy.noticePeriodDaysProbation);
    setNoticePeriodDaysConfirmed(policy.noticePeriodDaysConfirmed);
    setEvaluationReminderDaysBeforeEnd(policy.evaluationReminderDaysBeforeEnd);
    setRequiresManagerReview(policy.requiresManagerReview);
    setRequiresHodApproval(policy.requiresHodApproval);
    setAutoConfirmationAllowed(policy.autoConfirmationAllowed);
    setMinimumReviewScoreForConfirmation(policy.minimumReviewScoreForConfirmation);
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
    setName(schemaDefaults?.name || "Corporate Grade Confirmation Policy");
    setDescription(schemaDefaults?.description || "Configurable confirmation and probation policy governed by backend rules.");
    setDefaultProbationMonths(schemaDefaults?.defaultProbationMonths ?? 3);
    setMaxExtensionMonths(schemaDefaults?.maxExtensionMonths ?? 3);
    setNoticePeriodDaysProbation(schemaDefaults?.noticePeriodDaysProbation ?? 15);
    setNoticePeriodDaysConfirmed(schemaDefaults?.noticePeriodDaysConfirmed ?? 60);
    setEvaluationReminderDaysBeforeEnd(schemaDefaults?.evaluationReminderDaysBeforeEnd ?? 15);
    setRequiresManagerReview(schemaDefaults?.requiresManagerReview ?? true);
    setRequiresHodApproval(schemaDefaults?.requiresHodApproval ?? true);
    setAutoConfirmationAllowed(schemaDefaults?.autoConfirmationAllowed ?? false);
    setMinimumReviewScoreForConfirmation(schemaDefaults?.minimumReviewScoreForConfirmation ?? 70);
    setIsDefault(false);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const payload: ProbationPolicyInput = {
      name,
      description,
      companyId: companyId || undefined,
      projectId: projectId || undefined,
      isDefault,
      defaultProbationMonths,
      maxExtensionMonths,
      noticePeriodDaysProbation,
      noticePeriodDaysConfirmed,
      evaluationReminderDaysBeforeEnd,
      requiresManagerReview,
      requiresHodApproval,
      autoConfirmationAllowed,
      minimumReviewScoreForConfirmation,
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
      title="Confirmation & Probation Policy Studio"
      subtitle="Configure statutory probation durations, notice periods, review reminders, and approval workflows"
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
      <div className="space-y-6 pb-6 text-slate-800 dark:text-slate-200">
        {/* Policy Selector Chips */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/60">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-900 dark:text-white">Database-Configured Policies</span>
            <button
              type="button"
              onClick={handleStartCreateNew}
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
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
                      ? "border-blue-600 bg-blue-50 text-blue-700 font-bold dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-500"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                  }`}
                >
                  <FileCheck2 className="h-3 w-3 text-slate-400" />
                  <span>{p.name}</span>
                  {p.isDefault && (
                    <span className="rounded bg-emerald-100 px-1.5 py-0.2 text-[10px] text-emerald-800 font-semibold dark:bg-emerald-950 dark:text-emerald-300">
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
          <div className="border-b border-slate-100 px-4 py-3 flex items-center justify-between dark:border-slate-800">
            <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2 dark:text-white">
              <ShieldCheck className="h-4 w-4 text-blue-600" />
              Policy Identification
            </h3>
            {selectedPolicyId && !isCreatingNew && (
              <button
                type="button"
                onClick={() => void onSetDefault(selectedPolicyId)}
                className="text-xs font-semibold text-emerald-700 hover:underline dark:text-emerald-400"
              >
                Set as Enterprise Default
              </button>
            )}
          </div>
          <div className={erpPanelBodyClassName}>
            {/* Scope Hierarchy (Tenant -> Company -> Project) */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 rounded-xl border border-blue-100 bg-blue-50/50 p-3 mb-4 dark:border-blue-900/40 dark:bg-blue-950/20">
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
                  placeholder="e.g. Standard Statutory Confirmation & Probation Policy"
                />
              </div>
              <div className="sm:col-span-2">
                <label className={erpFormLabelClassName}>Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={erpFormInputClassName}
                  placeholder="Describe the scope, applicability, and probation milestones"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Probation Durations & Extensions */}
        <div className={erpPanelClassName}>
          <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-800">
            <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2 dark:text-white">
              <Calendar className="h-4 w-4 text-indigo-600" />
              Probation Durations & Extension Governance
            </h3>
          </div>
          <div className={erpPanelBodyClassName}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={erpFormLabelClassName}>Standard Probation Period (Months) *</label>
                <input
                  type="number"
                  min={1}
                  max={24}
                  required
                  value={defaultProbationMonths}
                  onChange={(e) => setDefaultProbationMonths(Number(e.target.value))}
                  className={erpFormInputClassName}
                />
                <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">Default evaluation period for newly joined personnel.</p>
              </div>

              <div>
                <label className={erpFormLabelClassName}>Max Allowed Extension (Months) *</label>
                <input
                  type="number"
                  min={0}
                  max={12}
                  required
                  value={maxExtensionMonths}
                  onChange={(e) => setMaxExtensionMonths(Number(e.target.value))}
                  className={erpFormInputClassName}
                />
                <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">Upper cap on probation extension if performance is borderline.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Statutory Notice Periods */}
        <div className={erpPanelClassName}>
          <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-800">
            <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2 dark:text-white">
              <Clock className="h-4 w-4 text-emerald-600" />
              Statutory Notice Periods
            </h3>
          </div>
          <div className={erpPanelBodyClassName}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={erpFormLabelClassName}>Notice Period During Probation (Days) *</label>
                <input
                  type="number"
                  min={0}
                  max={180}
                  required
                  value={noticePeriodDaysProbation}
                  onChange={(e) => setNoticePeriodDaysProbation(Number(e.target.value))}
                  className={erpFormInputClassName}
                />
                <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">Notice days required if employee resigns/terminates during probation.</p>
              </div>

              <div>
                <label className={erpFormLabelClassName}>Notice Period After Confirmation (Days) *</label>
                <input
                  type="number"
                  min={0}
                  max={180}
                  required
                  value={noticePeriodDaysConfirmed}
                  onChange={(e) => setNoticePeriodDaysConfirmed(Number(e.target.value))}
                  className={erpFormInputClassName}
                />
                <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">Notice days applicable for confirmed permanent employees.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: Evaluation Workflow & Review Gate */}
        <div className={erpPanelClassName}>
          <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-800">
            <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2 dark:text-white">
              <Award className="h-4 w-4 text-violet-600" />
              Evaluation Thresholds & Confirmation Workflow
            </h3>
          </div>
          <div className={erpPanelBodyClassName}>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={erpFormLabelClassName}>Review Reminder (Days Before End) *</label>
                  <input
                    type="number"
                    min={1}
                    max={90}
                    required
                    value={evaluationReminderDaysBeforeEnd}
                    onChange={(e) => setEvaluationReminderDaysBeforeEnd(Number(e.target.value))}
                    className={erpFormInputClassName}
                  />
                  <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">Automated notification to Line Manager before probation expiry.</p>
                </div>

                <div>
                  <label className={erpFormLabelClassName}>Minimum Review Score For Confirmation (%) *</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    required
                    value={minimumReviewScoreForConfirmation}
                    onChange={(e) => setMinimumReviewScoreForConfirmation(Number(e.target.value))}
                    className={erpFormInputClassName}
                  />
                  <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">Benchmark percentage required to confirm without extension.</p>
                </div>
              </div>

              <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">Mandatory Line Manager Review</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Line manager must submit score and recommendation comments.</p>
                  </div>
                  <Switch checked={requiresManagerReview} onCheckedChange={setRequiresManagerReview} />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">Mandatory Department Head (HOD) Approval</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Requires secondary sign-off from HOD before confirmation letter issue.</p>
                  </div>
                  <Switch checked={requiresHodApproval} onCheckedChange={setRequiresHodApproval} />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">Allow Auto-Confirmation on Due Date</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">If enabled, employee automatically becomes Confirmed if no action is taken by due date.</p>
                  </div>
                  <Switch checked={autoConfirmationAllowed} onCheckedChange={setAutoConfirmationAllowed} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SideDrawer>
  );
}
