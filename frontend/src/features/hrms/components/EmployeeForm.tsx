"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import {
  erpButtonClassName,
  erpFormInputClassName,
  erpFormLabelClassName,
  erpPanelBodyClassName,
  erpPanelClassName,
  erpPanelHeaderClassName,
  erpPanelTitleClassName,
} from "@/components/erp/erpStyles";
import { hrmsApi, orgApi } from "@/services/modules";
import { ROUTES } from "@/constants/routes";

type OptionRow = { id: string; name: string };

function asOptionRows(raw: unknown): OptionRow[] {
  const list = Array.isArray(raw)
    ? raw
    : raw && typeof raw === "object"
      ? (() => {
          const rec = raw as Record<string, unknown>;
          return rec.companies ?? rec.projects ?? rec.departments ?? rec.designations ?? rec.data ?? [];
        })()
      : [];
  if (!Array.isArray(list)) return [];

  const seen = new Set<string>();
  const rows: OptionRow[] = [];
  list.forEach((item, index) => {
    if (!item || typeof item !== "object") return;
    const rec = item as Record<string, unknown>;
    const id = String(rec.id ?? rec.Id ?? rec.companyId ?? rec.projectId ?? "").trim();
    if (!id || seen.has(id)) return;
    seen.add(id);
    const name = String(rec.name ?? rec.Name ?? rec.title ?? rec.Title ?? id).trim() || `Item ${index + 1}`;
    rows.push({ id, name });
  });
  return rows;
}

export type EmployeeFormValues = {
  fullName: string;
  employeeCode: string;
  companyId: string;
  projectId: string;
  status: string;
  workEmail: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  dateOfJoining: string;
  employmentType: string;
  departmentId: string;
  designationId: string;
  pan: string;
  uan: string;
  aadhaar: string;
  esiNumber: string;
  monthlyCtc: string;
  basicSalary: string;
  bankName: string;
  bankIfsc: string;
  bankAccountNumber: string;
  city: string;
  state: string;
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
  workEmail: "",
  phone: "",
  dateOfBirth: "",
  gender: "",
  dateOfJoining: "",
  employmentType: "Permanent",
  departmentId: "",
  designationId: "",
  pan: "",
  uan: "",
  aadhaar: "",
  esiNumber: "",
  monthlyCtc: "",
  basicSalary: "",
  bankName: "",
  bankIfsc: "",
  bankAccountNumber: "",
  city: "",
  state: "",
};

export default function EmployeeForm({ initialValues, employeeId, title }: EmployeeFormProps) {
  const router = useRouter();
  const isEdit = Boolean(employeeId);

  const [values, setValues] = useState<EmployeeFormValues>({ ...EMPTY, ...initialValues });
  const [companies, setCompanies] = useState<OptionRow[]>([]);
  const [projects, setProjects] = useState<OptionRow[]>([]);
  const [departments, setDepartments] = useState<OptionRow[]>([]);
  const [designations, setDesignations] = useState<OptionRow[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<EmployeeFormValues>>({});
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await orgApi.company.getAll(1, 100);
        setCompanies(asOptionRows(res.data?.companies ?? res.data));
      } catch {
        setCompanies([]);
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
        const res = await orgApi.project.getByCompany(values.companyId);
        setProjects(asOptionRows(res.data?.projects ?? res.data));
        try {
          const dept = await orgApi.orgStructure.departments.list(values.companyId);
          setDepartments(asOptionRows(dept.data));
        } catch {
          setDepartments([]);
        }
        try {
          const des = await orgApi.orgStructure.designations.list(values.companyId);
          setDesignations(asOptionRows(des.data));
        } catch {
          setDesignations([]);
        }
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
        workEmail: values.workEmail || undefined,
        phone: values.phone || undefined,
        dateOfBirth: values.dateOfBirth || undefined,
        gender: values.gender || undefined,
        dateOfJoining: values.dateOfJoining || undefined,
        employmentType: values.employmentType || "Permanent",
        departmentId: values.departmentId || undefined,
        designationId: values.designationId || undefined,
        pan: values.pan || undefined,
        uan: values.uan || undefined,
        aadhaar: values.aadhaar || undefined,
        esiNumber: values.esiNumber || undefined,
        monthlyCtc: Number(values.monthlyCtc) || 0,
        basicSalary: Number(values.basicSalary) || 0,
        bankName: values.bankName || undefined,
        bankIfsc: values.bankIfsc || undefined,
        bankAccountNumber: values.bankAccountNumber || undefined,
        city: values.city || undefined,
        state: values.state || undefined,
      };

      if (isEdit && employeeId) {
        await hrmsApi.hrms.employees.update(employeeId, payload);
      } else {
        await hrmsApi.hrms.employees.create(payload);
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

  const formTitle = title ?? (isEdit ? "Edit employee" : "Add employee");
  const inputErrorClass = "border-rose-400 focus:border-rose-400 focus:ring-rose-100";

  return (
    <StandardPageLayout
      title={formTitle}
      subtitle={isEdit ? "Update employee master record." : "Create a new employee record."}
      eyebrow="HRMS"
      icon="user"
      actions={
        <button type="button" onClick={() => router.back()} className={erpButtonClassName.secondary}>
          Back
        </button>
      }
    >
      <form onSubmit={(e) => void handleSubmit(e)} className="mx-auto w-full max-w-3xl space-y-4">
        {serverError ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {serverError}
          </div>
        ) : null}

        <section className={erpPanelClassName}>
          <div className={erpPanelHeaderClassName}>
            <h2 className={erpPanelTitleClassName}>Basic information</h2>
          </div>
          <div className={`${erpPanelBodyClassName} grid gap-4 sm:grid-cols-2`}>
            <div>
              <label htmlFor="employee-full-name" className={erpFormLabelClassName}>
                Full name <span className="text-rose-600">*</span>
              </label>
              <input
                id="employee-full-name"
                type="text"
                value={values.fullName}
                onChange={(e) => set("fullName", e.target.value)}
                placeholder="e.g. Priya Sharma"
                aria-invalid={Boolean(errors.fullName)}
                className={`${erpFormInputClassName} mt-1 ${errors.fullName ? inputErrorClass : ""}`}
              />
              {errors.fullName ? <p className="mt-1 text-xs text-rose-600">{errors.fullName}</p> : null}
            </div>

            <div>
              <label htmlFor="employee-code" className={erpFormLabelClassName}>
                Employee code
              </label>
              <input
                id="employee-code"
                type="text"
                value={values.employeeCode}
                onChange={(e) => set("employeeCode", e.target.value)}
                placeholder="Optional"
                className={`${erpFormInputClassName} mt-1`}
              />
            </div>

            <div>
              <label htmlFor="employee-company" className={erpFormLabelClassName}>
                Company <span className="text-rose-600">*</span>
              </label>
              <select
                id="employee-company"
                value={values.companyId}
                onChange={(e) => {
                  set("companyId", e.target.value);
                  set("projectId", "");
                }}
                disabled={loadingCompanies}
                aria-invalid={Boolean(errors.companyId)}
                className={`${erpFormInputClassName} mt-1 ${errors.companyId ? inputErrorClass : ""}`}
              >
                <option key="company-empty" value="">
                  {loadingCompanies ? "Loading…" : "Select company"}
                </option>
                {companies.map((c) => (
                  <option key={`company-${c.id}`} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {errors.companyId ? <p className="mt-1 text-xs text-rose-600">{errors.companyId}</p> : null}
              {!loadingCompanies && companies.length === 0 ? (
                <p className="mt-1 text-xs text-slate-500">No companies available.</p>
              ) : null}
            </div>

            <div>
              <label htmlFor="employee-project" className={erpFormLabelClassName}>
                Project
              </label>
              <select
                id="employee-project"
                value={values.projectId}
                onChange={(e) => set("projectId", e.target.value)}
                disabled={!values.companyId || loadingProjects}
                className={`${erpFormInputClassName} mt-1 disabled:bg-slate-50 disabled:text-slate-400`}
              >
                <option key="project-empty" value="">
                  {!values.companyId
                    ? "Select a company first"
                    : loadingProjects
                      ? "Loading…"
                      : "No project (optional)"}
                </option>
                {projects.map((p) => (
                  <option key={`project-${p.id}`} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="employee-status" className={erpFormLabelClassName}>
                Status
              </label>
              <select
                id="employee-status"
                value={values.status}
                onChange={(e) => set("status", e.target.value)}
                className={`${erpFormInputClassName} mt-1`}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <section className={erpPanelClassName}>
          <div className={erpPanelHeaderClassName}>
            <h2 className={erpPanelTitleClassName}>Job, contact and statutory</h2>
          </div>
          <div className={`${erpPanelBodyClassName} grid gap-4 sm:grid-cols-2`}>
            <div>
              <label className={erpFormLabelClassName}>Work email</label>
              <input className={`${erpFormInputClassName} mt-1`} value={values.workEmail} onChange={(e) => set("workEmail", e.target.value)} />
            </div>
            <div>
              <label className={erpFormLabelClassName}>Phone</label>
              <input className={`${erpFormInputClassName} mt-1`} value={values.phone} onChange={(e) => set("phone", e.target.value)} />
            </div>
            <div>
              <label className={erpFormLabelClassName}>Date of joining</label>
              <input type="date" className={`${erpFormInputClassName} mt-1`} value={values.dateOfJoining} onChange={(e) => set("dateOfJoining", e.target.value)} />
            </div>
            <div>
              <label className={erpFormLabelClassName}>Date of birth</label>
              <input type="date" className={`${erpFormInputClassName} mt-1`} value={values.dateOfBirth} onChange={(e) => set("dateOfBirth", e.target.value)} />
            </div>
            <div>
              <label className={erpFormLabelClassName}>Gender</label>
              <select className={`${erpFormInputClassName} mt-1`} value={values.gender} onChange={(e) => set("gender", e.target.value)}>
                <option key="gender-empty" value="">Select</option>
                <option key="gender-female" value="Female">Female</option>
                <option key="gender-male" value="Male">Male</option>
                <option key="gender-other" value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className={erpFormLabelClassName}>Employment type</label>
              <select className={`${erpFormInputClassName} mt-1`} value={values.employmentType} onChange={(e) => set("employmentType", e.target.value)}>
                <option key="emp-permanent" value="Permanent">Permanent</option>
                <option key="emp-contract" value="Contract">Contract</option>
                <option key="emp-intern" value="Intern">Intern</option>
              </select>
            </div>
            <div>
              <label className={erpFormLabelClassName}>Department</label>
              <select className={`${erpFormInputClassName} mt-1`} value={values.departmentId} onChange={(e) => set("departmentId", e.target.value)}>
                <option key="dept-empty" value="">Select department</option>
                {departments.map((d) => (
                  <option key={`dept-${d.id}`} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={erpFormLabelClassName}>Designation</label>
              <select className={`${erpFormInputClassName} mt-1`} value={values.designationId} onChange={(e) => set("designationId", e.target.value)}>
                <option key="desig-empty" value="">Select designation</option>
                {designations.map((d) => (
                  <option key={`desig-${d.id}`} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={erpFormLabelClassName}>PAN</label>
              <input className={`${erpFormInputClassName} mt-1`} value={values.pan} onChange={(e) => set("pan", e.target.value)} />
            </div>
            <div>
              <label className={erpFormLabelClassName}>UAN</label>
              <input className={`${erpFormInputClassName} mt-1`} value={values.uan} onChange={(e) => set("uan", e.target.value)} />
            </div>
            <div>
              <label className={erpFormLabelClassName}>Aadhaar</label>
              <input className={`${erpFormInputClassName} mt-1`} value={values.aadhaar} onChange={(e) => set("aadhaar", e.target.value)} />
            </div>
            <div>
              <label className={erpFormLabelClassName}>ESI number</label>
              <input className={`${erpFormInputClassName} mt-1`} value={values.esiNumber} onChange={(e) => set("esiNumber", e.target.value)} />
            </div>
            <div>
              <label className={erpFormLabelClassName}>Monthly CTC</label>
              <input type="number" className={`${erpFormInputClassName} mt-1`} value={values.monthlyCtc} onChange={(e) => set("monthlyCtc", e.target.value)} />
            </div>
            <div>
              <label className={erpFormLabelClassName}>Basic salary</label>
              <input type="number" className={`${erpFormInputClassName} mt-1`} value={values.basicSalary} onChange={(e) => set("basicSalary", e.target.value)} />
            </div>
            <div>
              <label className={erpFormLabelClassName}>Bank name</label>
              <input className={`${erpFormInputClassName} mt-1`} value={values.bankName} onChange={(e) => set("bankName", e.target.value)} />
            </div>
            <div>
              <label className={erpFormLabelClassName}>IFSC</label>
              <input className={`${erpFormInputClassName} mt-1`} value={values.bankIfsc} onChange={(e) => set("bankIfsc", e.target.value)} />
            </div>
            <div>
              <label className={erpFormLabelClassName}>Account number</label>
              <input className={`${erpFormInputClassName} mt-1`} value={values.bankAccountNumber} onChange={(e) => set("bankAccountNumber", e.target.value)} />
            </div>
            <div>
              <label className={erpFormLabelClassName}>State (PT / GST)</label>
              <input className={`${erpFormInputClassName} mt-1`} value={values.state} onChange={(e) => set("state", e.target.value)} placeholder="KA" />
            </div>
          </div>
        </section>

        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-4">
          <button type="submit" disabled={saving} className={erpButtonClassName.primary}>
            {saving ? "Saving…" : isEdit ? "Save changes" : "Create employee"}
          </button>
          <button type="button" onClick={() => router.back()} disabled={saving} className={erpButtonClassName.secondary}>
            Cancel
          </button>
        </div>
      </form>
    </StandardPageLayout>
  );
}
