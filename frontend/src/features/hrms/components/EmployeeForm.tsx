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
} from "@/components/workspace/styles";
import { hrmsApi, orgApi } from "@/services/modules";
import { fetchBatchLookups } from "@/services/lookup";
import { ROUTES } from "@/constants/routes";
import { DynamicCustomFieldsForm } from "@/components/workspace/DynamicCustomFieldsForm";
import { useOrgContext } from "@/context/OrgContext";
import { User, Briefcase, CreditCard, Building2, AlertCircle, Sparkles } from "lucide-react";

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
  const { companyId: currentCompanyId } = useOrgContext();
  const isEdit = Boolean(employeeId);

  const [values, setValues] = useState<EmployeeFormValues>({ ...EMPTY, ...initialValues });
  const [customValues, setCustomValues] = useState<Record<string, string | undefined>>({});
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
    let isMounted = true;
    const load = async () => {
      try {
        setLoadingCompanies(true);
        const res = await orgApi.company.getAll(1, 100);
        const rows = asOptionRows(res.data?.companies ?? res.data);
        if (isMounted) {
          setCompanies(rows);
          // Auto-select company if not set
          setValues((prev) => {
            if (prev.companyId) return prev;
            if (currentCompanyId && rows.some((r) => r.id === currentCompanyId)) {
              return { ...prev, companyId: currentCompanyId };
            }
            if (rows.length > 0) {
              return { ...prev, companyId: rows[0].id };
            }
            return prev;
          });
        }
      } catch {
        if (isMounted) setCompanies([]);
      } finally {
        if (isMounted) setLoadingCompanies(false);
      }
    };
    void load();
    return () => { isMounted = false; };
  }, [currentCompanyId]);

  useEffect(() => {
    if (!values.companyId) {
      setProjects([]);
      setDepartments([]);
      setDesignations([]);
      return;
    }
    let isMounted = true;
    const load = async () => {
      try {
        setLoadingProjects(true);
        // Unified batch lookup: retrieves projects, departments, and designations in 1 call
        const batch = await fetchBatchLookups(["projects", "departments", "designations"], values.companyId);
        if (isMounted) {
          if (batch.projects && batch.projects.length > 0) {
            setProjects(batch.projects.map((p) => ({ id: p.id, name: p.name })));
          } else {
            try {
              const res = await orgApi.project.getByCompany(values.companyId);
              setProjects(asOptionRows(res.data?.projects ?? res.data));
            } catch {
              setProjects([]);
            }
          }

          if (batch.departments && batch.departments.length > 0) {
            setDepartments(batch.departments.map((d) => ({ id: d.id, name: d.name })));
          } else {
            try {
              const dept = await orgApi.orgStructure.departments.list(values.companyId);
              setDepartments(asOptionRows(dept.data));
            } catch {
              setDepartments([]);
            }
          }

          if (batch.designations && batch.designations.length > 0) {
            setDesignations(batch.designations.map((d) => ({ id: d.id, name: d.name })));
          } else {
            try {
              const des = await orgApi.orgStructure.designations.list(values.companyId);
              setDesignations(asOptionRows(des.data));
            } catch {
              setDesignations([]);
            }
          }
        }
      } catch {
        if (isMounted) {
          setProjects([]);
          setDepartments([]);
          setDesignations([]);
        }
      } finally {
        if (isMounted) setLoadingProjects(false);
      }
    };
    void load();
    return () => { isMounted = false; };
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
      subtitle={isEdit ? "Update employee master record, organizational assignment, and payroll parameters." : "Register a new employee into the enterprise directory."}
      eyebrow="HRMS / People"
      icon="users"
      actions={
        <button type="button" onClick={() => router.back()} className={erpButtonClassName.secondary}>
          Back to Directory
        </button>
      }
    >
      <form onSubmit={(e) => void handleSubmit(e)} className="mx-auto w-full max-w-4xl space-y-6 pb-16">
        {serverError ? (
          <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 shadow-2xs">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{serverError}</span>
          </div>
        ) : null}

        {/* Section 1: Organizational & Employment Profile */}
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
          <div className="flex items-center gap-2.5 border-b border-slate-100 bg-slate-50/70 px-5 py-3.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100/80">
              <Building2 className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Organizational & Employment Profile</h2>
              <p className="text-[11px] text-slate-500">Core identity, company assignment, department, and work status.</p>
            </div>
          </div>
          <div className="p-5 sm:p-6 grid gap-4 sm:grid-cols-2">
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
                onChange={(e) => set("employeeCode", e.target.value.toUpperCase())}
                placeholder="e.g. EMP-00102"
                className={`${erpFormInputClassName} mt-1 font-mono`}
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
                  {loadingCompanies ? "Loading companies…" : "Select company"}
                </option>
                {companies.map((c) => (
                  <option key={`company-${c.id}`} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {errors.companyId ? <p className="mt-1 text-xs text-rose-600">{errors.companyId}</p> : null}
            </div>

            <div>
              <label htmlFor="employee-project" className={erpFormLabelClassName}>
                Project assignment
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
                      ? "Loading projects…"
                      : "No project assigned (General)"}
                </option>
                {projects.map((p) => (
                  <option key={`project-${p.id}`} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={erpFormLabelClassName}>Department</label>
              <select
                className={`${erpFormInputClassName} mt-1 disabled:bg-slate-50 disabled:text-slate-400`}
                value={values.departmentId}
                onChange={(e) => set("departmentId", e.target.value)}
                disabled={!values.companyId}
              >
                <option key="dept-empty" value="">Select department</option>
                {departments.map((d) => (
                  <option key={`dept-${d.id}`} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={erpFormLabelClassName}>Designation / Role</label>
              <select
                className={`${erpFormInputClassName} mt-1 disabled:bg-slate-50 disabled:text-slate-400`}
                value={values.designationId}
                onChange={(e) => set("designationId", e.target.value)}
                disabled={!values.companyId}
              >
                <option key="desig-empty" value="">Select designation</option>
                {designations.map((d) => (
                  <option key={`desig-${d.id}`} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={erpFormLabelClassName}>Employment type</label>
              <select className={`${erpFormInputClassName} mt-1`} value={values.employmentType} onChange={(e) => set("employmentType", e.target.value)}>
                <option key="emp-permanent" value="Permanent">Permanent / Full-Time</option>
                <option key="emp-contract" value="Contract">Contract / Consultant</option>
                <option key="emp-intern" value="Intern">Intern / Trainee</option>
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
                    {s === "Active" ? "Active (Operational)" : s === "OnLeave" ? "On Leave" : s}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* Section 2: Contact & Personal Details */}
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
          <div className="flex items-center gap-2.5 border-b border-slate-100 bg-slate-50/70 px-5 py-3.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100/80">
              <User className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Personal & Contact Information</h2>
              <p className="text-[11px] text-slate-500">Corporate communication channels and personal demographic data.</p>
            </div>
          </div>
          <div className="p-5 sm:p-6 grid gap-4 sm:grid-cols-2">
            <div>
              <label className={erpFormLabelClassName}>Corporate work email</label>
              <input type="email" placeholder="name@company.com" className={`${erpFormInputClassName} mt-1`} value={values.workEmail} onChange={(e) => set("workEmail", e.target.value)} />
            </div>
            <div>
              <label className={erpFormLabelClassName}>Contact phone number</label>
              <input type="tel" placeholder="+91 98765 43210" className={`${erpFormInputClassName} mt-1`} value={values.phone} onChange={(e) => set("phone", e.target.value)} />
            </div>
            <div>
              <label className={erpFormLabelClassName}>Date of birth</label>
              <input type="date" className={`${erpFormInputClassName} mt-1`} value={values.dateOfBirth} onChange={(e) => set("dateOfBirth", e.target.value)} />
            </div>
            <div>
              <label className={erpFormLabelClassName}>Gender</label>
              <select className={`${erpFormInputClassName} mt-1`} value={values.gender} onChange={(e) => set("gender", e.target.value)}>
                <option key="gender-empty" value="">Select gender</option>
                <option key="gender-female" value="Female">Female</option>
                <option key="gender-male" value="Male">Male</option>
                <option key="gender-other" value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className={erpFormLabelClassName}>City / Location</label>
              <input className={`${erpFormInputClassName} mt-1`} value={values.city} onChange={(e) => set("city", e.target.value)} placeholder="e.g. Bengaluru" />
            </div>
            <div>
              <label className={erpFormLabelClassName}>State (PT / Tax Circle)</label>
              <input className={`${erpFormInputClassName} mt-1`} value={values.state} onChange={(e) => set("state", e.target.value.toUpperCase())} placeholder="e.g. Karnataka (KA)" />
            </div>
          </div>
        </section>

        {/* Section 3: Statutory & Joining Details */}
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
          <div className="flex items-center gap-2.5 border-b border-slate-100 bg-slate-50/70 px-5 py-3.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-50 text-violet-600 border border-violet-100/80">
              <Briefcase className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Statutory & Compliance Registrations</h2>
              <p className="text-[11px] text-slate-500">MCA, EPFO, ESIC, and Income Tax statutory identifiers.</p>
            </div>
          </div>
          <div className="p-5 sm:p-6 grid gap-4 sm:grid-cols-2">
            <div>
              <label className={erpFormLabelClassName}>Official date of joining</label>
              <input type="date" className={`${erpFormInputClassName} mt-1`} value={values.dateOfJoining} onChange={(e) => set("dateOfJoining", e.target.value)} />
            </div>
            <div>
              <label className={erpFormLabelClassName}>Permanent Account Number (PAN)</label>
              <input className={`${erpFormInputClassName} mt-1 font-mono uppercase`} placeholder="ABCDE1234F" value={values.pan} onChange={(e) => set("pan", e.target.value.toUpperCase())} />
            </div>
            <div>
              <label className={erpFormLabelClassName}>Aadhaar number</label>
              <input className={`${erpFormInputClassName} mt-1 font-mono`} placeholder="12-digit Aadhaar" value={values.aadhaar} onChange={(e) => set("aadhaar", e.target.value)} />
            </div>
            <div>
              <label className={erpFormLabelClassName}>Universal Account Number (UAN / PF)</label>
              <input className={`${erpFormInputClassName} mt-1 font-mono`} placeholder="12-digit UAN" value={values.uan} onChange={(e) => set("uan", e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <label className={erpFormLabelClassName}>ESI insurance number</label>
              <input className={`${erpFormInputClassName} mt-1 font-mono`} placeholder="17-digit IP Number" value={values.esiNumber} onChange={(e) => set("esiNumber", e.target.value)} />
            </div>
          </div>
        </section>

        {/* Section 4: Compensation & Banking */}
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
          <div className="flex items-center gap-2.5 border-b border-slate-100 bg-slate-50/70 px-5 py-3.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600 border border-amber-100/80">
              <CreditCard className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Payroll & Banking Master</h2>
              <p className="text-[11px] text-slate-500">Direct salary disbursement details and monthly compensation.</p>
            </div>
          </div>
          <div className="p-5 sm:p-6 grid gap-4 sm:grid-cols-2">
            <div>
              <label className={erpFormLabelClassName}>Monthly CTC (₹)</label>
              <input type="number" min={0} placeholder="0" className={`${erpFormInputClassName} mt-1 font-mono`} value={values.monthlyCtc} onChange={(e) => set("monthlyCtc", e.target.value)} />
            </div>
            <div>
              <label className={erpFormLabelClassName}>Basic salary (₹)</label>
              <input type="number" min={0} placeholder="0" className={`${erpFormInputClassName} mt-1 font-mono`} value={values.basicSalary} onChange={(e) => set("basicSalary", e.target.value)} />
            </div>
            <div>
              <label className={erpFormLabelClassName}>Bank name</label>
              <input className={`${erpFormInputClassName} mt-1`} placeholder="e.g. HDFC Bank" value={values.bankName} onChange={(e) => set("bankName", e.target.value)} />
            </div>
            <div>
              <label className={erpFormLabelClassName}>Bank IFSC code</label>
              <input className={`${erpFormInputClassName} mt-1 font-mono uppercase`} placeholder="HDFC0001234" value={values.bankIfsc} onChange={(e) => set("bankIfsc", e.target.value.toUpperCase())} />
            </div>
            <div className="sm:col-span-2">
              <label className={erpFormLabelClassName}>Disbursement account number</label>
              <input className={`${erpFormInputClassName} mt-1 font-mono`} placeholder="Account Number" value={values.bankAccountNumber} onChange={(e) => set("bankAccountNumber", e.target.value)} />
            </div>
          </div>
        </section>

        {/* Section 5: Custom Fields */}
        <section>
          <DynamicCustomFieldsForm
            entityName="Employee"
            recordId={employeeId}
            valueMap={customValues}
            onChange={(fieldKey, val) => setCustomValues((prev) => ({ ...prev, [fieldKey]: val }))}
          />
        </section>

        {/* Action Buttons Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <button type="button" onClick={() => router.back()} disabled={saving} className={erpButtonClassName.secondary}>
            Cancel
          </button>
          <button type="submit" disabled={saving} className={erpButtonClassName.primary}>
            {saving ? "Saving…" : isEdit ? "Save changes" : "Create employee"}
          </button>
        </div>
      </form>
    </StandardPageLayout>
  );
}
