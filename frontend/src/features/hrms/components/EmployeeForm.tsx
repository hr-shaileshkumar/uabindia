"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { hrApi } from "@/services/hrApi";
import { ROUTES } from "@/constants/routes";

type Company = { id: string; name: string };
type Project = { id: string; name: string };

export type EmployeeFormValues = {
  fullName: string;
  employeeCode: string;
  companyId: string;
  projectId: string;
  status: string;
};

type EmployeeFormProps = {
  initialValues?: Partial<EmployeeFormValues>;
  employeeId?: string;
  title?: string;
};

const STATUS_OPTIONS = ["Active", "Inactive", "OnLeave", "Terminated"];

const EMPTY: EmployeeFormValues = {
  fullName: "",
  employeeCode: "",
  companyId: "",
  projectId: "",
  status: "Active",
};

export default function EmployeeForm({ initialValues, employeeId, title }: EmployeeFormProps) {
  const router = useRouter();
  const isEdit = Boolean(employeeId);

  const [values, setValues] = useState<EmployeeFormValues>({ ...EMPTY, ...initialValues });
  const [companies, setCompanies] = useState<Company[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<EmployeeFormValues>>({});
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await hrApi.company.getAll(1, 100);
        setCompanies(res.data?.companies ?? []);
      } catch {
      } finally {
        setLoadingCompanies(false);
      }
    };
    void load();
  }, []);

  useEffect(() => {
    if (!values.companyId) {
      setProjects([]);
      return;
    }
    const load = async () => {
      try {
        setLoadingProjects(true);
        const res = await hrApi.project.getByCompany(values.companyId);
        setProjects(res.data?.projects ?? []);
      } catch {
        setProjects([]);
      } finally {
        setLoadingProjects(false);
      }
    };
    void load();
  }, [values.companyId]);

  const set = (field: keyof EmployeeFormValues, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = (): boolean => {
    const errs: Partial<EmployeeFormValues> = {};
    if (!values.fullName.trim()) errs.fullName = "Full name is required";
    if (!values.companyId) errs.companyId = "Company is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setSaving(true);
      setServerError(null);
      const payload = {
        fullName: values.fullName.trim(),
        employeeCode: values.employeeCode.trim() || undefined,
        companyId: values.companyId,
        projectId: values.projectId || undefined,
        status: values.status,
      };

      if (isEdit && employeeId) {
        await hrApi.hrms.employees.update(employeeId, payload);
      } else {
        await hrApi.hrms.employees.create(payload);
      }

      router.push(ROUTES.EMPLOYEES);
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Save failed";
      setServerError(msg);
    } finally {
      setSaving(false);
    }
  };

  const formTitle = title ?? (isEdit ? "Edit Employee" : "Add Employee");

  return (
    <StandardPageLayout
      title={formTitle}
      subtitle={isEdit ? `Editing employee record` : "Fill in details to create a new employee"}
      actions={
        <button
          type="button"
          onClick={() => router.back()}
          className="erp-action-btn erp-action-btn-secondary"
        >
          ← Back
        </button>
      }
    >
      <form onSubmit={(e) => void handleSubmit(e)} className="max-w-2xl space-y-6">
        {serverError && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {serverError}
          </div>
        )}

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-100 px-6 py-4">
            <h2 className="text-sm font-semibold text-slate-700">Basic Information</h2>
          </div>

          <div className="space-y-4 p-6">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={values.fullName}
                onChange={(e) => set("fullName", e.target.value)}
                placeholder="e.g. Priya Sharma"
                className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-1 ${
                  errors.fullName
                    ? "border-red-400 focus:border-red-400 focus:ring-red-200"
                    : "border-slate-200 focus:border-blue-400 focus:ring-blue-200"
                }`}
              />
              {errors.fullName && (
                <p className="mt-1 text-xs text-red-500">{errors.fullName}</p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Employee Code</label>
              <input
                type="text"
                value={values.employeeCode}
                onChange={(e) => set("employeeCode", e.target.value)}
                placeholder="e.g. EMP-001 (optional)"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Company <span className="text-red-500">*</span>
              </label>
              <select
                value={values.companyId}
                onChange={(e) => { set("companyId", e.target.value); set("projectId", ""); }}
                disabled={loadingCompanies}
                className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-1 ${
                  errors.companyId
                    ? "border-red-400 focus:border-red-400 focus:ring-red-200"
                    : "border-slate-200 focus:border-blue-400 focus:ring-blue-200"
                }`}
              >
                <option value="">{loadingCompanies ? "Loading…" : "Select company"}</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              {errors.companyId && (
                <p className="mt-1 text-xs text-red-500">{errors.companyId}</p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Project</label>
              <select
                value={values.projectId}
                onChange={(e) => set("projectId", e.target.value)}
                disabled={!values.companyId || loadingProjects}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200 disabled:bg-slate-50 disabled:text-slate-400"
              >
                <option value="">
                  {!values.companyId
                    ? "Select a company first"
                    : loadingProjects
                    ? "Loading…"
                    : "No project (optional)"}
                </option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Status</label>
              <select
                value={values.status}
                onChange={(e) => set("status", e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="erp-action-btn erp-action-btn-primary disabled:opacity-50"
          >
            {saving ? "Saving…" : isEdit ? "Save Changes" : "Create Employee"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            disabled={saving}
            className="erp-action-btn erp-action-btn-secondary disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </StandardPageLayout>
  );
}
