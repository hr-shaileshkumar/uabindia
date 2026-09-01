"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import type { PlanName, TenantFormValues, TenantStatus } from "@/features/tenants/types";
import {
  buildTenantCreatePayload,
  buildTenantUpdatePayload,
  formatDate,
  getDefaultTenantForm,
  moduleOptions,
  planPolicies,
  wizardSteps,
} from "@/features/tenants/utils/tenant-utils";

export { buildTenantCreatePayload, buildTenantUpdatePayload, getDefaultTenantForm };

export type TenantWizardProps = {
  mode: "create" | "edit";
  initialValues?: TenantFormValues;
  onCancel: () => void;
  onSubmit: (values: TenantFormValues) => Promise<void>;
  onSaveDraft?: (values: TenantFormValues) => Promise<void> | void;
  disabled?: boolean;
  submitLabel?: string;
  lockSystemFields?: boolean;
  systemMeta?: {
    tenantId?: string;
    createdAt?: string;
  };
};

type StepId = (typeof wizardSteps)[number]["id"];

const statusOptions: TenantStatus[] = ["active", "trial", "inactive", "suspended"];
const planOptions: PlanName[] = ["Basic", "Premium", "Enterprise"];

function labelClass() {
  return "mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400";
}

function cardTitleClass() {
  return "text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400";
}

export function TenantWizard({
  mode,
  initialValues,
  onCancel,
  onSubmit,
  onSaveDraft,
  disabled,
  submitLabel,
  lockSystemFields = mode === "edit",
  systemMeta,
}: TenantWizardProps) {
  const [form, setForm] = useState<TenantFormValues>(initialValues ?? getDefaultTenantForm());
  const [step, setStep] = useState<StepId>(1);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);

  useEffect(() => {
    if (initialValues) {
      setForm(initialValues);
    }
  }, [initialValues]);

  const planPolicy = useMemo(() => planPolicies[form.subscriptionPlan], [form.subscriptionPlan]);

  const updateForm = <K extends keyof TenantFormValues>(key: K, value: TenantFormValues[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const syncContactToAdmin = () => {
    setForm((prev) => ({
      ...prev,
      adminName: prev.contactPersonName.trim() || prev.adminName,
      adminEmail: prev.contactPersonEmail.trim() || prev.adminEmail,
    }));
  };

  const toggleModule = (moduleKey: string) => {
    setForm((prev) => {
      const exists = prev.selectedModules.includes(moduleKey);
      return {
        ...prev,
        selectedModules: exists ? prev.selectedModules.filter((item) => item !== moduleKey) : [...prev.selectedModules, moduleKey],
      };
    });
  };

  const validateStep = (targetStep: StepId): string | null => {
    switch (targetStep) {
      case 1:
        if (!form.name.trim()) return "Tenant name is required.";
        if (!form.subdomain.trim()) return "Tenant code is required.";
        if (!/^[a-z0-9-]+$/.test(form.subdomain.trim())) return "Tenant code can only contain lowercase letters, numbers, and hyphens.";
        return null;
      case 2:
        if (!form.contactPersonName.trim()) return "Contact person is required.";
        if (!form.contactPersonEmail.trim()) return "Contact email is required.";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactPersonEmail.trim())) return "Contact email format is invalid.";
        if (!form.contactNumber.trim()) return "Contact mobile is required.";
        if (!form.address.trim()) return "Address is required.";
        if (!form.state.trim()) return "State is required.";
        if (!form.district.trim()) return "City is required.";
        if (!form.pincode.trim()) return "PIN is required.";
        return null;
      case 3: {
        const employeeLimit = Number(form.employeeLimit);
        if (!form.billingStartDate) return "Subscription start date is required.";
        if (form.employeeLimit && (Number.isNaN(employeeLimit) || employeeLimit <= 0)) return "User limit must be a positive number.";
        if (form.employeeLimit && employeeLimit > planPolicy.maxUsers) return `User limit cannot exceed ${planPolicy.maxUsers} on ${planPolicy.name}.`;
        const storageLimit = Number(form.storageLimitGb);
        if (form.storageLimitGb && (Number.isNaN(storageLimit) || storageLimit <= 0)) return "Storage limit must be a positive number.";
        if (form.storageLimitGb && storageLimit > planPolicy.maxStorageGb) return `Storage limit cannot exceed ${planPolicy.maxStorageGb} GB on ${planPolicy.name}.`;
        return null;
      }
      case 4:
        if (!planPolicy.allowedModules.some((moduleKey) => form.selectedModules.includes(moduleKey))) {
          return `At least one module available on the ${planPolicy.name} plan is required.`;
        }
        return null;
      case 5:
        if (!form.adminName.trim()) return "Admin name is required.";
        if (!form.adminEmail.trim()) return "Admin email is required.";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.adminEmail.trim())) return "Admin email format is invalid.";
        if (mode === "create" && !form.sendInviteLink && form.adminPassword.trim().length < 8) {
          return "Temporary password must be at least 8 characters.";
        }
        return null;
      case 6:
        return [1, 2, 3, 4, 5].map((stepId) => validateStep(stepId as StepId)).find(Boolean) ?? null;
      default:
        return null;
    }
  };

  const handleNext = () => {
    const validation = validateStep(step);
    if (validation) {
      setError(validation);
      return;
    }
    setError(null);
    setStep((prev) => Math.min(6, prev + 1) as StepId);
  };

  const handlePrevious = () => {
    setError(null);
    setStep((prev) => Math.max(1, prev - 1) as StepId);
  };

  const handleSubmit = async () => {
    const validation = validateStep(6);
    if (validation) {
      setError(validation);
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      await onSubmit(form);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save tenant.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!onSaveDraft) return;
    setSavingDraft(true);
    setError(null);
    try {
      await onSaveDraft(form);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save draft.");
    } finally {
      setSavingDraft(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className={labelClass()}>Tenant Name *</span>
              <input value={form.name} onChange={(e) => updateForm("name", e.target.value)} className="erp-input h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white" placeholder="ABC Pvt Ltd" />
            </label>
            <label className="block">
              <span className={labelClass()}>Tenant Code *</span>
              <input
                value={form.subdomain}
                onChange={(e) => updateForm("subdomain", e.target.value.toLowerCase())}
                className="erp-input h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                placeholder="abc-pvt-ltd"
                disabled={lockSystemFields}
              />
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Used in the tenant URL and schema identity. Locked after creation.</p>
            </label>
            <label className="block">
              <span className={labelClass()}>Logo URL</span>
              <input value={form.logoUrl} onChange={(e) => updateForm("logoUrl", e.target.value)} className="erp-input h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white" placeholder="https://..." />
            </label>
            <label className="block">
              <span className={labelClass()}>Custom Domain</span>
              <input value={form.customDomain} onChange={(e) => updateForm("customDomain", e.target.value)} className="erp-input h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white" placeholder="erp.abcpvt.com" />
            </label>
            <label className="block">
              <span className={labelClass()}>Timezone</span>
              <input value={form.timezone} onChange={(e) => updateForm("timezone", e.target.value)} className="erp-input h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white" placeholder="Asia/Kolkata" />
            </label>
            <label className="block">
              <span className={labelClass()}>Currency</span>
              <input value={form.currency} onChange={(e) => updateForm("currency", e.target.value.toUpperCase())} className="erp-input h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white" placeholder="INR" />
            </label>
            <label className="block md:col-span-2">
              <span className={labelClass()}>Language</span>
              <input value={form.language} onChange={(e) => updateForm("language", e.target.value)} className="erp-input h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white" placeholder="en" />
            </label>
          </div>
        );
      case 2:
        return (
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className={labelClass()}>Contact Person *</span>
              <input value={form.contactPersonName} onChange={(e) => updateForm("contactPersonName", e.target.value)} className="erp-input h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white" placeholder="Rahul Kumar" />
            </label>
            <label className="block">
              <span className={labelClass()}>Contact Email *</span>
              <input value={form.contactPersonEmail} onChange={(e) => updateForm("contactPersonEmail", e.target.value)} className="erp-input h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white" placeholder="ops@tenant.com" />
            </label>
            <label className="block">
              <span className={labelClass()}>Mobile *</span>
              <input value={form.contactNumber} onChange={(e) => updateForm("contactNumber", e.target.value)} className="erp-input h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white" placeholder="+91 98xxxxxxx" />
            </label>
            <label className="block">
              <span className={labelClass()}>State *</span>
              <input value={form.state} onChange={(e) => updateForm("state", e.target.value)} className="erp-input h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white" placeholder="Maharashtra" />
            </label>
            <label className="block">
              <span className={labelClass()}>City *</span>
              <input value={form.district} onChange={(e) => updateForm("district", e.target.value)} className="erp-input h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white" placeholder="Pune" />
            </label>
            <label className="block">
              <span className={labelClass()}>PIN *</span>
              <input value={form.pincode} onChange={(e) => updateForm("pincode", e.target.value)} className="erp-input h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white" placeholder="411001" />
            </label>
            <label className="block md:col-span-2">
              <span className={labelClass()}>Address *</span>
              <textarea value={form.address} onChange={(e) => updateForm("address", e.target.value)} className="erp-input min-h-28 w-full rounded-lg border border-slate-200 bg-white p-3 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white" placeholder="123 Business Park, City" />
            </label>
            <div className="md:col-span-2">
              <Button type="button" variant="outline" onClick={syncContactToAdmin}>
                Use Contact Details For Admin Setup
              </Button>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className={labelClass()}>Plan *</span>
              <select
                value={form.subscriptionPlan}
                onChange={(e) => {
                  const plan = e.target.value as PlanName;
                  const next = planPolicies[plan];
                  updateForm("subscriptionPlan", plan);
                  updateForm("employeeLimit", String(next.maxUsers));
                  updateForm("storageLimitGb", String(next.maxStorageGb));
                  updateForm("selectedModules", next.allowedModules);
                }}
                className="erp-select h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                {planOptions.map((plan) => (
                  <option key={plan} value={plan}>
                    {plan}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className={labelClass()}>Status</span>
              <select value={form.status} onChange={(e) => updateForm("status", e.target.value as TenantStatus)} className="erp-select h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white">
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className={labelClass()}>Start Date *</span>
              <input type="date" value={form.billingStartDate} onChange={(e) => updateForm("billingStartDate", e.target.value)} className="erp-input h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
            </label>
            <label className="block">
              <span className={labelClass()}>Expiry Date</span>
              <input type="date" value={form.billingEndDate} onChange={(e) => updateForm("billingEndDate", e.target.value)} className="erp-input h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
            </label>
            <label className="block">
              <span className={labelClass()}>Trial Expiry</span>
              <input type="date" value={form.trialExpiryDate} onChange={(e) => updateForm("trialExpiryDate", e.target.value)} className="erp-input h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
            </label>
            <label className="block">
              <span className={labelClass()}>User Limit</span>
              <input value={form.employeeLimit} onChange={(e) => updateForm("employeeLimit", e.target.value)} className="erp-input h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white" placeholder={String(planPolicy.maxUsers)} />
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Plan max: {planPolicy.maxUsers} users.</p>
            </label>
            <label className="block">
              <span className={labelClass()}>Storage Limit (GB)</span>
              <input value={form.storageLimitGb} onChange={(e) => updateForm("storageLimitGb", e.target.value)} className="erp-input h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white" placeholder={String(planPolicy.maxStorageGb)} />
            </label>
            <label className="block">
              <span className={labelClass()}>SMS Credits</span>
              <input value={form.smsCredits} onChange={(e) => updateForm("smsCredits", e.target.value)} className="erp-input h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white" placeholder="0" />
            </label>
          </div>
        );
      case 4:
        return (
          <div className="space-y-4">
            <div className="rounded-3xl border border-emerald-200 bg-emerald-50/70 dark:border-emerald-900/60 dark:bg-emerald-950/40 p-4 text-sm text-emerald-900 dark:text-emerald-200">
              {form.subscriptionPlan} plan allows {planPolicy.allowedModules.length} module{planPolicy.allowedModules.length === 1 ? "" : "s"} and up to {planPolicy.maxUsers} users.
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {moduleOptions.map((module) => {
                const allowed = planPolicy.allowedModules.includes(module.key);
                const selected = form.selectedModules.includes(module.key);
                return (
                  <button
                    key={module.key}
                    type="button"
                    disabled={!allowed || disabled}
                    onClick={() => allowed && toggleModule(module.key)}
                    className={`rounded-3xl border p-4 text-left transition cursor-pointer ${
                      !allowed
                        ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-600"
                        : selected
                          ? "border-emerald-300 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-950/60"
                          : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">{module.label}</p>
                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{module.desc}</p>
                        <p className="mt-2 text-xs uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">{module.group}</p>
                      </div>
                      <span className={`text-xs font-semibold ${selected ? "text-emerald-700 dark:text-emerald-300" : "text-slate-500 dark:text-slate-400"}`}>
                        {selected ? "Enabled" : allowed ? "Select" : "Upgrade"}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );
      case 5:
        return (
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className={labelClass()}>Admin Name *</span>
              <input value={form.adminName} onChange={(e) => updateForm("adminName", e.target.value)} className="erp-input h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white" placeholder="Rahul Kumar" />
            </label>
            <label className="block">
              <span className={labelClass()}>Admin Email *</span>
              <input value={form.adminEmail} onChange={(e) => updateForm("adminEmail", e.target.value)} className="erp-input h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white" placeholder="admin@tenant.com" />
            </label>
            <label className="block">
              <span className={labelClass()}>Admin Role</span>
              <select value={form.adminRole} onChange={(e) => updateForm("adminRole", e.target.value as "Admin" | "SuperAdmin")} className="erp-select h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white">
                <option value="Admin">Admin</option>
                <option value="SuperAdmin">SuperAdmin</option>
              </select>
            </label>
            <label className="block">
              <span className={labelClass()}>Access Setup</span>
              <div className="flex h-[46px] items-center rounded-[0.95rem] border border-slate-200 bg-white px-3.5 dark:border-slate-700 dark:bg-slate-800">
                <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input type="checkbox" checked={form.sendInviteLink} onChange={(e) => updateForm("sendInviteLink", e.target.checked)} />
                  Send invite instead of temporary password
                </label>
              </div>
            </label>
            {!form.sendInviteLink && (
              <label className="block md:col-span-2">
                <span className={labelClass()}>Temporary Password *</span>
                <input type="password" value={form.adminPassword} onChange={(e) => updateForm("adminPassword", e.target.value)} className="erp-input h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white" placeholder="Minimum 8 characters" />
              </label>
            )}
          </div>
        );
      case 6:
        return (
          <div className="space-y-4">
            <div className="grid gap-4 xl:grid-cols-3">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900 p-5">
                <p className={cardTitleClass()}>Tenant</p>
                <div className="mt-3 space-y-2 text-sm text-slate-700 dark:text-slate-300">
                  <p><span className="font-semibold text-slate-900 dark:text-white">Name:</span> {form.name || "-"}</p>
                  <p><span className="font-semibold text-slate-900 dark:text-white">Code:</span> {form.subdomain || "-"}</p>
                  <p><span className="font-semibold text-slate-900 dark:text-white">Domain:</span> {form.customDomain || `${form.subdomain || "tenant"}.yourdomain.com`}</p>
                  <p><span className="font-semibold text-slate-900 dark:text-white">Status:</span> {form.status}</p>
                </div>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900 p-5">
                <p className={cardTitleClass()}>Contact</p>
                <div className="mt-3 space-y-2 text-sm text-slate-700 dark:text-slate-300">
                  <p><span className="font-semibold text-slate-900 dark:text-white">Person:</span> {form.contactPersonName || "-"}</p>
                  <p><span className="font-semibold text-slate-900 dark:text-white">Email:</span> {form.contactPersonEmail || "-"}</p>
                  <p><span className="font-semibold text-slate-900 dark:text-white">Mobile:</span> {form.contactNumber || "-"}</p>
                  <p><span className="font-semibold text-slate-900 dark:text-white">Location:</span> {[form.district, form.state, form.pincode].filter(Boolean).join(", ") || "-"}</p>
                </div>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900 p-5">
                <p className={cardTitleClass()}>Subscription</p>
                <div className="mt-3 space-y-2 text-sm text-slate-700 dark:text-slate-300">
                  <p><span className="font-semibold text-slate-900 dark:text-white">Plan:</span> {form.subscriptionPlan}</p>
                  <p><span className="font-semibold text-slate-900 dark:text-white">Users:</span> {form.employeeLimit || "-"}</p>
                  <p><span className="font-semibold text-slate-900 dark:text-white">Storage:</span> {form.storageLimitGb || "-"} GB</p>
                  <p><span className="font-semibold text-slate-900 dark:text-white">Billing:</span> {formatDate(form.billingStartDate)} to {formatDate(form.billingEndDate)}</p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-[1.3fr_0.9fr]">
              <div className="rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-5">
                <p className={cardTitleClass()}>Enabled Modules</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {form.selectedModules.length > 0 ? (
                    form.selectedModules.map((moduleKey) => (
                      <span key={moduleKey} className="rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-700 dark:text-slate-300">
                        {moduleOptions.find((module) => module.key === moduleKey)?.label ?? moduleKey}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-slate-500 dark:text-slate-400">No modules selected.</span>
                  )}
                </div>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-5">
                <p className={cardTitleClass()}>Admin User</p>
                <div className="mt-3 space-y-2 text-sm text-slate-700 dark:text-slate-300">
                  <p><span className="font-semibold text-slate-900 dark:text-white">Name:</span> {form.adminName || "-"}</p>
                  <p><span className="font-semibold text-slate-900 dark:text-white">Email:</span> {form.adminEmail || "-"}</p>
                  <p><span className="font-semibold text-slate-900 dark:text-white">Role:</span> {form.adminRole}</p>
                  <p><span className="font-semibold text-slate-900 dark:text-white">Invite Mode:</span> {form.sendInviteLink ? "Send invite" : "Temporary password"}</p>
                </div>
              </div>
            </div>

            {systemMeta?.tenantId || systemMeta?.createdAt ? (
              <div className="rounded-3xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900 p-5 text-sm text-slate-700 dark:text-slate-300">
                <p className={cardTitleClass()}>System Fields</p>
                <div className="mt-3 grid gap-2 md:grid-cols-2">
                  <p><span className="font-semibold text-slate-900 dark:text-white">Tenant ID:</span> {systemMeta.tenantId || "-"}</p>
                  <p><span className="font-semibold text-slate-900 dark:text-white">Created Date:</span> {formatDate(systemMeta.createdAt)}</p>
                </div>
              </div>
            ) : null}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-5">
      <div className="rounded-[1.5rem] border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-5 shadow-sm">
        <div className="grid gap-3 xl:grid-cols-6">
          {wizardSteps.map((wizardStep) => (
            <button
              key={wizardStep.id}
              type="button"
              onClick={() => setStep(wizardStep.id)}
              className={`rounded-2xl border px-4 py-3 text-left transition cursor-pointer ${
                step === wizardStep.id ? "border-emerald-500 bg-emerald-600 text-white" : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
              }`}
            >
              <p className="text-sm font-semibold">{wizardStep.id}. {wizardStep.title}</p>
              <p className={`mt-1 text-xs ${step === wizardStep.id ? "text-emerald-50" : "text-slate-500 dark:text-slate-400"}`}>{wizardStep.caption}</p>
            </button>
          ))}
        </div>
      </div>

      {error ? <div className="rounded-3xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">{error}</div> : null}

      <div className="rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-6 shadow-sm">{renderStep()}</div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={handlePrevious} disabled={step === 1 || submitting || disabled || savingDraft}>
            Previous
          </Button>
          <Button variant="secondary" onClick={onCancel} disabled={submitting || disabled || savingDraft}>
            Cancel
          </Button>
          {onSaveDraft ? (
            <Button variant="outline" onClick={handleSaveDraft} disabled={submitting || disabled || savingDraft}>
              {savingDraft ? "Saving Draft..." : "Save Draft"}
            </Button>
          ) : null}
        </div>

        <div className="flex gap-2">
          {step < 6 ? (
            <Button variant="default" onClick={handleNext} disabled={submitting || disabled || savingDraft}>
              Next
            </Button>
          ) : (
            <Button variant="success" onClick={handleSubmit} disabled={submitting || disabled || savingDraft}>
              {submitting ? "Saving..." : submitLabel ?? (mode === "create" ? "Create Tenant" : "Update Tenant")}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default TenantWizard;
