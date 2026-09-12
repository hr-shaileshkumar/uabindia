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
import { Sliders, ShieldCheck, Plus, CheckCircle2, HelpCircle } from "lucide-react";
import { orgApi } from "@/services/modules/org";
import { policyApi } from "@/services/modules/policies";
import { notifyError, notifySuccess } from "@/lib/notifications";
import { getApiErrorMessage } from "@/lib/api-errors";
import { POLICY_CATEGORIES, type PolicyCategory, type PolicyRuleDefinition } from "../types/policy-matrix.types";

interface RuleDefinitionDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rule: PolicyRuleDefinition | null;
  onSaved: () => void;
}

export function RuleDefinitionDrawer({
  open,
  onOpenChange,
  rule,
  onSaved,
}: RuleDefinitionDrawerProps) {
  const isEditing = !!rule?.id;

  const [companiesList, setCompaniesList] = useState<Array<{ id: string; name: string }>>([]);
  const [projectsList, setProjectsList] = useState<Array<{ id: string; name: string }>>([]);
  const [saving, setSaving] = useState(false);

  // Form State
  const [companyId, setCompanyId] = useState<string>("");
  const [projectId, setProjectId] = useState<string>("");
  const [category, setCategory] = useState<PolicyCategory>("PAYROLL_COMPENSATION");
  const [policyCode, setPolicyCode] = useState("");
  const [fieldKey, setFieldKey] = useState("");
  const [fieldLabel, setFieldLabel] = useState("");
  const [fieldType, setFieldType] = useState<"number" | "text" | "select" | "boolean">("number");
  const [section, setSection] = useState("General Rules");
  const [defaultValue, setDefaultValue] = useState("");
  const [minValue, setMinValue] = useState<string>("");
  const [maxValue, setMaxValue] = useState<string>("");
  const [step, setStep] = useState<string>("1");
  const [unit, setUnit] = useState("");
  const [optionsJson, setOptionsJson] = useState("");
  const [helpText, setHelpText] = useState("");
  const [isRequired, setIsRequired] = useState(true);
  const [isVisible, setIsVisible] = useState(true);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [displayOrder, setDisplayOrder] = useState<number>(10);
  const [status, setStatus] = useState<"Active" | "Inactive">("Active");

  // Load companies
  useEffect(() => {
    if (!open) return;
    orgApi.company.getAll(1, 100)
      .then((res: any) => {
        const comps = res?.data?.items || res?.data?.companies || [];
        setCompaniesList(comps.map((c: any) => ({ id: c.id, name: c.name })));
      })
      .catch(() => {});
  }, [open]);

  // Load projects
  useEffect(() => {
    if (!open) return;
    orgApi.project.getAll(companyId || undefined)
      .then((res: any) => {
        const projs = res?.data?.items || res?.data?.projects || [];
        setProjectsList(projs.map((p: any) => ({ id: p.id, name: p.name })));
      })
      .catch(() => {});
  }, [open, companyId]);

  // Load rule into form
  useEffect(() => {
    if (rule && open) {
      setCompanyId(rule.companyId || "");
      setProjectId(rule.projectId || "");
      setCategory((rule.category as PolicyCategory) || "PAYROLL_COMPENSATION");
      setPolicyCode(rule.policyCode || "");
      setFieldKey(rule.fieldKey || "");
      setFieldLabel(rule.fieldLabel || "");
      setFieldType((rule.fieldType as any) || "number");
      setSection(rule.section || "General Rules");
      setDefaultValue(rule.defaultValue ?? "");
      setMinValue(rule.minValue !== null && rule.minValue !== undefined ? String(rule.minValue) : "");
      setMaxValue(rule.maxValue !== null && rule.maxValue !== undefined ? String(rule.maxValue) : "");
      setStep(rule.step !== null && rule.step !== undefined ? String(rule.step) : "1");
      setUnit(rule.unit || "");
      setOptionsJson(rule.optionsJson || "");
      setHelpText(rule.helpText || "");
      setIsRequired(rule.isRequired ?? true);
      setIsVisible(rule.isVisible ?? true);
      setIsReadOnly(rule.isReadOnly ?? false);
      setDisplayOrder(rule.displayOrder ?? 10);
      setStatus(rule.status === "Inactive" ? "Inactive" : "Active");
    } else if (!rule && open) {
      // Defaults for brand new rule
      setCompanyId("");
      setProjectId("");
      setCategory("PAYROLL_COMPENSATION");
      setPolicyCode("");
      setFieldKey("");
      setFieldLabel("");
      setFieldType("number");
      setSection("Statutory Ratios");
      setDefaultValue("");
      setMinValue("");
      setMaxValue("");
      setStep("1");
      setUnit("%");
      setOptionsJson("");
      setHelpText("");
      setIsRequired(true);
      setIsVisible(true);
      setIsReadOnly(false);
      setDisplayOrder(10);
      setStatus("Active");
    }
  }, [rule, open]);

  const handleSubmit = async () => {
    if (!policyCode.trim() || !fieldKey.trim() || !fieldLabel.trim()) {
      notifyError("Policy Code, Field Key, and Field Label are required.", "Validation Error");
      return;
    }

    try {
      setSaving(true);
      const payload: Partial<PolicyRuleDefinition> = {
        companyId: companyId || undefined,
        projectId: projectId || undefined,
        category,
        policyCode: policyCode.trim().toUpperCase(),
        fieldKey: fieldKey.trim(),
        fieldLabel: fieldLabel.trim(),
        fieldType,
        section: section.trim() || "General Rules",
        defaultValue: defaultValue.trim(),
        minValue: minValue.trim() !== "" ? Number(minValue) : undefined,
        maxValue: maxValue.trim() !== "" ? Number(maxValue) : undefined,
        step: step.trim() !== "" ? Number(step) : 1,
        unit: unit.trim() || undefined,
        optionsJson: optionsJson.trim() || undefined,
        helpText: helpText.trim() || undefined,
        isRequired,
        isVisible,
        isReadOnly,
        displayOrder: Number(displayOrder) || 10,
        status,
      };

      if (isEditing && rule?.id) {
        await policyApi.definitions.update(rule.id, payload);
        notifySuccess(`Rule definition '${payload.fieldLabel}' updated in database.`, "Rule Updated");
      } else {
        await policyApi.definitions.create(payload);
        notifySuccess(`Rule definition '${payload.fieldLabel}' registered in database.`, "Rule Created");
      }

      onSaved();
      onOpenChange(false);
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to persist rule definition in database."), "Rule Error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SideDrawer
      open={open}
      onClose={() => onOpenChange(false)}
      title={isEditing ? "Edit Database Rule Definition" : "New Database Rule Definition"}
      subtitle="Admin control of validation constraints, statutory ratios, and form structures in dbo.PolicyRuleDefinitions"
      width="xl"
      footer={
        <ErpDrawerFooter
          onCancel={() => onOpenChange(false)}
          saveLabel={saving ? "Persisting in Database..." : isEditing ? "Update Rule in DB" : "Register Rule in DB"}
          onSave={handleSubmit}
          saving={saving}
        />
      }
    >
      <div className="space-y-6 pb-6 text-slate-800">
        {/* Scope Hierarchy */}
        <div className="rounded-xl border border-indigo-200 bg-indigo-50/60 p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-900">
            <Sliders className="h-4 w-4 text-indigo-600" />
            <span>Scope Hierarchy Override</span>
          </div>
          <p className="text-xs text-indigo-700">
            Leave company and project empty to create a <strong>Tenant Baseline</strong>. Select a company for a subsidiary override, or a project for a site-specific ratio.
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                <option value="">Tenant Baseline (All Companies)</option>
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
                <option value="">Company Baseline (All Projects)</option>
                {projectsList.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Section 1: Identification */}
        <div className={erpPanelClassName}>
          <div className="border-b border-slate-100 px-4 py-3">
            <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-blue-600" />
              Rule Identity & Classification
            </h3>
          </div>
          <div className={erpPanelBodyClassName}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={erpFormLabelClassName}>Policy Category *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as PolicyCategory)}
                  className={erpFormInputClassName}
                >
                  {POLICY_CATEGORIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={erpFormLabelClassName}>Policy Code *</label>
                <input
                  type="text"
                  required
                  value={policyCode}
                  onChange={(e) => setPolicyCode(e.target.value.toUpperCase())}
                  className={`${erpFormInputClassName} font-mono`}
                  placeholder="e.g. PAY_BASIC_PCT"
                />
              </div>
              <div>
                <label className={erpFormLabelClassName}>Field Key (Payload Key) *</label>
                <input
                  type="text"
                  required
                  value={fieldKey}
                  onChange={(e) => setFieldKey(e.target.value)}
                  className={`${erpFormInputClassName} font-mono`}
                  placeholder="e.g. basicPercentageOfGross"
                />
              </div>
              <div>
                <label className={erpFormLabelClassName}>Field UI Label *</label>
                <input
                  type="text"
                  required
                  value={fieldLabel}
                  onChange={(e) => setFieldLabel(e.target.value)}
                  className={erpFormInputClassName}
                  placeholder="e.g. Basic Salary % of Gross"
                />
              </div>
              <div>
                <label className={erpFormLabelClassName}>UI Section Grouping</label>
                <input
                  type="text"
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                  className={erpFormInputClassName}
                  placeholder="e.g. Statutory Ratios & Percentages"
                />
              </div>
              <div>
                <label className={erpFormLabelClassName}>Field Data Type *</label>
                <select
                  value={fieldType}
                  onChange={(e) => setFieldType(e.target.value as any)}
                  className={erpFormInputClassName}
                >
                  <option value="number">Number / Ratio</option>
                  <option value="text">Text String</option>
                  <option value="select">Select Dropdown</option>
                  <option value="boolean">Boolean Switch</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Values & Constraints */}
        <div className={erpPanelClassName}>
          <div className="border-b border-slate-100 px-4 py-3">
            <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2">
              <Sliders className="h-4 w-4 text-emerald-600" />
              Values, Ceilings & Validation Bounds
            </h3>
          </div>
          <div className={erpPanelBodyClassName}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className={erpFormLabelClassName}>Default Value</label>
                <input
                  type="text"
                  value={defaultValue}
                  onChange={(e) => setDefaultValue(e.target.value)}
                  className={erpFormInputClassName}
                  placeholder="e.g. 50"
                />
              </div>
              <div>
                <label className={erpFormLabelClassName}>Minimum Bound</label>
                <input
                  type="number"
                  value={minValue}
                  onChange={(e) => setMinValue(e.target.value)}
                  className={erpFormInputClassName}
                  placeholder="e.g. 10"
                />
              </div>
              <div>
                <label className={erpFormLabelClassName}>Maximum Bound</label>
                <input
                  type="number"
                  value={maxValue}
                  onChange={(e) => setMaxValue(e.target.value)}
                  className={erpFormInputClassName}
                  placeholder="e.g. 100"
                />
              </div>
              <div>
                <label className={erpFormLabelClassName}>Numeric Step</label>
                <input
                  type="number"
                  value={step}
                  onChange={(e) => setStep(e.target.value)}
                  className={erpFormInputClassName}
                  placeholder="e.g. 0.5 or 1"
                />
              </div>
              <div>
                <label className={erpFormLabelClassName}>Display Unit</label>
                <input
                  type="text"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className={erpFormInputClassName}
                  placeholder="e.g. %, days, INR, mins"
                />
              </div>
              <div>
                <label className={erpFormLabelClassName}>Display Order</label>
                <input
                  type="number"
                  value={displayOrder}
                  onChange={(e) => setDisplayOrder(Number(e.target.value))}
                  className={erpFormInputClassName}
                  placeholder="10"
                />
              </div>
            </div>

            {fieldType === "select" && (
              <div className="mt-4">
                <label className={erpFormLabelClassName}>Dropdown Options (JSON Array of Strings)</label>
                <textarea
                  rows={2}
                  value={optionsJson}
                  onChange={(e) => setOptionsJson(e.target.value)}
                  className={`${erpFormInputClassName} font-mono text-xs`}
                  placeholder='["Yearly", "Monthly", "Quarterly"]'
                />
              </div>
            )}

            <div className="mt-4">
              <label className={erpFormLabelClassName}>Help Text / Tooltip Guidance</label>
              <textarea
                rows={2}
                value={helpText}
                onChange={(e) => setHelpText(e.target.value)}
                className={erpFormInputClassName}
                placeholder="Statutory compliance guideline or tooltip shown to HR admins"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Flags & Status */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-4">
          <h3 className="text-xs font-bold text-slate-900">Behavioral Flags & System Status</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
              <div>
                <span className="text-xs font-semibold text-slate-900">Mandatory / Required</span>
                <p className="text-[11px] text-slate-500">Enforces field presence in policy submissions</p>
              </div>
              <Switch checked={isRequired} onCheckedChange={setIsRequired} />
            </label>
            <label className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
              <div>
                <span className="text-xs font-semibold text-slate-900">Visible in UI</span>
                <p className="text-[11px] text-slate-500">Displays field in operational policy drawers</p>
              </div>
              <Switch checked={isVisible} onCheckedChange={setIsVisible} />
            </label>
            <label className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
              <div>
                <span className="text-xs font-semibold text-slate-900">Read-Only Statutory Field</span>
                <p className="text-[11px] text-slate-500">Locks field to prevent unintended changes</p>
              </div>
              <Switch checked={isReadOnly} onCheckedChange={setIsReadOnly} />
            </label>
            <div className="rounded-lg border border-slate-200 p-3 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-900">Rule Active Status</span>
                <p className="text-[11px] text-slate-500">Active rules are applied by the policy engine</p>
              </div>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="rounded-md border border-slate-300 px-2 py-1 text-xs font-semibold"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </SideDrawer>
  );
}
