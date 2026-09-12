"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Briefcase,
  Building2,
  Mail,
  Phone,
  MapPin,
  Sparkles,
  CreditCard,
  UserCheck,
  ShieldCheck,
  KeyRound,
  FileSpreadsheet,
} from "lucide-react";
import {
  AdministrationGlobalPageShell,
  type KpiMetricItem,
  type PlatformListColumn,
} from "@/components/administration/AdministrationGlobalPageShell";
import { ErpDrawerFooter, ErpRowActions } from "@/components/workspace/page-kit";
import { TableActionMenu, type ActionMenuItem } from "@/components/table/TableActionMenu";
import { UniversalDeleteDialog } from "@/components/workspace/templates/UniversalDeleteDialog";
import { RecordAiDrawer } from "@/components/ai/RecordAiDrawer";
import { hrmsApi, orgApi } from "@/services/modules";
import { ROUTES } from "@/constants/routes";
import { PERMISSIONS } from "@/constants/permissions";
import { usePermissions } from "@/context/PermissionContext";
import { useOrgContext } from "@/context/OrgContext";
import { getApiErrorMessage } from "@/lib/api-errors";
import { notifyError, notifySuccess } from "@/lib/notifications";
import { cn } from "@/lib/utils";
import type { Employee } from "@/types";

export type { Employee };

type OptionItem = { id: string; name: string };

const EMPLOYMENT_TYPES = [
  "Permanent",
  "Probation",
  "Contract",
  "Intern",
  "Temporary",
  "Consultant",
];

const emptyEmployeeForm = () => ({
  fullName: "",
  employeeCode: "",
  workEmail: "",
  personalEmail: "",
  phone: "",
  gender: "Male",
  dateOfBirth: "",
  companyId: "",
  departmentId: "",
  departmentName: "",
  designationId: "",
  designationName: "",
  employmentType: "Permanent",
  dateOfJoining: "",
  workLocation: "",
  city: "",
  state: "",
  status: "Active",
  createLogin: false,
  loginRole: "EMPLOYEE",
  initialPassword: "",
  pan: "",
  aadhaar: "",
  uan: "",
  esiNumber: "",
  bankName: "",
  bankAccountNumber: "",
  bankIfsc: "",
  monthlyCtc: "",
  basicSalary: "",
});

export default function EmployeeList() {
  const router = useRouter();
  const { hasPermission, isSuperAdmin } = usePermissions();
  const { companyId: currentCompanyId } = useOrgContext();

  // Permission guards
  const canCreateEmployee = isSuperAdmin || hasPermission([PERMISSIONS.EMPLOYEE_CREATE]);
  const canEditEmployee = isSuperAdmin || hasPermission([PERMISSIONS.EMPLOYEE_EDIT]);
  const canDeleteEmployee = isSuperAdmin || hasPermission([PERMISSIONS.EMPLOYEE_DELETE]);
  const canApproveLeave = isSuperAdmin || hasPermission([PERMISSIONS.LEAVE_APPROVE]);
  const canPunchAttendance = isSuperAdmin || hasPermission([PERMISSIONS.ATTENDANCE_CREATE]);
  const canAccessDocuments = isSuperAdmin || hasPermission([PERMISSIONS.DOCUMENTS_VIEW]);
  const canViewPayslip = isSuperAdmin || hasPermission([PERMISSIONS.PAYROLL_PAYSLIPS_VIEW]);

  // Data states
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [employmentTypeFilter, setEmploymentTypeFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  // Metadata options
  const [companies, setCompanies] = useState<OptionItem[]>([]);
  const [departments, setDepartments] = useState<OptionItem[]>([]);
  const [designations, setDesignations] = useState<OptionItem[]>([]);

  // Drawer modal states
  const [mode, setMode] = useState<"closed" | "create" | "edit">("closed");
  const [editing, setEditing] = useState<Employee | null>(null);
  const [form, setForm] = useState(emptyEmployeeForm());
  const [activeTab, setActiveTab] = useState<"basic" | "job" | "compliance">("basic");
  const [isSaving, setIsSaving] = useState(false);

  // Dialog & AI states
  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [aiEmployee, setAiEmployee] = useState<Employee | null>(null);

  // Load Companies & Structure Catalogs
  useEffect(() => {
    let isMounted = true;
    const loadCatalogs = async () => {
      try {
        const res = await orgApi.company.getAll(1, 100);
        const raw = res.data?.companies ?? res.data;
        if (Array.isArray(raw) && isMounted) {
          const mapped = raw.map((c: any) => ({
            id: String(c.id || c.companyId),
            name: String(c.name || c.legalName || "Unnamed Entity"),
          }));
          setCompanies(mapped);
        }
      } catch {
        if (isMounted) setCompanies([]);
      }
    };
    void loadCatalogs();
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch Employees from API
  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await hrmsApi.hrms.employees.list(page, 100, {
        search: search.trim() || undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
      });
      const raw = res.data;
      const list: Employee[] = Array.isArray(raw)
        ? raw
        : Array.isArray(raw?.employees)
          ? raw.employees
          : [];
      setEmployees(list);
      setTotal(raw?.total ?? list.length);
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to load employees"));
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    void fetchEmployees();
  }, [fetchEmployees]);

  // Load Departments & Designations when selected company changes in drawer
  useEffect(() => {
    const targetCompId = form.companyId || currentCompanyId;
    if (!targetCompId) return;

    let isMounted = true;
    const loadStructure = async () => {
      try {
        const [deptRes, desigRes] = await Promise.allSettled([
          orgApi.orgStructure.departments.list(targetCompId),
          orgApi.orgStructure.designations.list(targetCompId),
        ]);

        if (isMounted && deptRes.status === "fulfilled") {
          const list = Array.isArray(deptRes.value.data) ? deptRes.value.data : [];
          setDepartments(list.map((d: any) => ({ id: d.id, name: d.name })));
        }
        if (isMounted && desigRes.status === "fulfilled") {
          const list = Array.isArray(desigRes.value.data) ? desigRes.value.data : [];
          setDesignations(list.map((d: any) => ({ id: d.id, name: d.name })));
        }
      } catch {
        // Fallback gracefully
      }
    };
    void loadStructure();
    return () => {
      isMounted = false;
    };
  }, [form.companyId, currentCompanyId]);

  // Dynamic Departments from fetched records + catalog
  const departmentOptions = useMemo(() => {
    const set = new Set<string>();
    departments.forEach((d) => d.name && set.add(d.name));
    employees.forEach((e) => e.departmentName && set.add(e.departmentName));
    return Array.from(set).sort();
  }, [departments, employees]);

  // Filtered employees list based on client criteria
  const filteredEmployees = useMemo(() => {
    const q = search.toLowerCase().trim();
    return employees.filter((e) => {
      const matchesSearch =
        !q ||
        (e.fullName || "").toLowerCase().includes(q) ||
        (e.employeeCode || "").toLowerCase().includes(q) ||
        (e.email || "").toLowerCase().includes(q) ||
        (e.departmentName || "").toLowerCase().includes(q) ||
        (e.designationName || "").toLowerCase().includes(q) ||
        (e.phone || "").toLowerCase().includes(q) ||
        (e.city || "").toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "Active" && e.status === "Active") ||
        (statusFilter === "OnLeave" && e.status === "OnLeave") ||
        (statusFilter === "Inactive" && (e.status === "Inactive" || e.status === "Terminated")) ||
        (statusFilter === "Terminated" && e.status === "Terminated");

      const matchesDepartment =
        departmentFilter === "all" || e.departmentName === departmentFilter;

      const matchesEmploymentType =
        employmentTypeFilter === "all" || e.employmentType === employmentTypeFilter;

      return matchesSearch && matchesStatus && matchesDepartment && matchesEmploymentType;
    });
  }, [employees, search, statusFilter, departmentFilter, employmentTypeFilter]);

  // KPI Metrics calculations
  const activeCount = useMemo(
    () => employees.filter((e) => e.status === "Active").length,
    [employees]
  );
  const onLeaveCount = useMemo(
    () => employees.filter((e) => e.status === "OnLeave").length,
    [employees]
  );
  const inactiveCount = useMemo(
    () => employees.filter((e) => e.status === "Inactive" || e.status === "Terminated").length,
    [employees]
  );

  const kpis: KpiMetricItem[] = [
    {
      label: "Total Workforce",
      value: total || employees.length,
      tone: "info",
      icon: <Users className="h-3.5 w-3.5" />,
      subtext: "Master headcount",
    },
    {
      label: "Active Personnel",
      value: activeCount,
      tone: "positive",
      icon: <CheckCircle2 className="h-3.5 w-3.5" />,
      subtext: "On active payroll",
    },
    {
      label: "On Leave / Notice",
      value: onLeaveCount,
      tone: "warning",
      icon: <Clock className="h-3.5 w-3.5" />,
      subtext: "Temporary status",
    },
    {
      label: "Departments",
      value: departmentOptions.length,
      tone: "neutral",
      icon: <Briefcase className="h-3.5 w-3.5" />,
      subtext: "Operating units",
    },
  ];

  // Drawer Controls
  const openCreate = () => {
    setEditing(null);
    const initialCompanyId = currentCompanyId || (companies[0]?.id ?? "");
    setForm({
      ...emptyEmployeeForm(),
      companyId: initialCompanyId,
    });
    setActiveTab("basic");
    setMode("create");
  };

  const openEdit = (emp: Employee) => {
    setEditing(emp);
    setForm({
      fullName: emp.fullName || "",
      employeeCode: emp.employeeCode || "",
      workEmail: emp.email || "",
      personalEmail: (emp as any).personalEmail || "",
      phone: emp.phone || "",
      gender: emp.gender || "Male",
      dateOfBirth: emp.dateOfBirth ? emp.dateOfBirth.slice(0, 10) : "",
      companyId: emp.companyId || currentCompanyId || (companies[0]?.id ?? ""),
      departmentId: emp.departmentId || "",
      departmentName: emp.departmentName || "",
      designationId: emp.designationId || "",
      designationName: emp.designationName || "",
      employmentType: emp.employmentType || "Permanent",
      dateOfJoining: (emp as any).dateOfJoining
        ? (emp as any).dateOfJoining.slice(0, 10)
        : emp.joiningDate
          ? emp.joiningDate.slice(0, 10)
          : "",
      workLocation: emp.workLocation || "",
      city: emp.city || "",
      state: emp.state || "",
      status: emp.status || "Active",
      createLogin: false,
      loginRole: "EMPLOYEE",
      initialPassword: "",
      pan: (emp as any).pan || "",
      aadhaar: (emp as any).aadhaar || "",
      uan: (emp as any).uan || "",
      esiNumber: (emp as any).esiNumber || "",
      bankName: (emp as any).bankName || "",
      bankAccountNumber: (emp as any).bankAccountNumber || "",
      bankIfsc: (emp as any).bankIfsc || "",
      monthlyCtc: emp.monthlyCtc ? String(emp.monthlyCtc) : "",
      basicSalary: emp.basicSalary ? String(emp.basicSalary) : "",
    });
    setActiveTab("basic");
    setMode("edit");
  };

  // Form Save Handler
  const handleSave = async () => {
    if (!form.fullName.trim()) {
      notifyError("Full name is required.");
      return;
    }
    if (!form.companyId) {
      notifyError("Please select an organization entity.");
      return;
    }

    const payload: Record<string, any> = {
      fullName: form.fullName.trim(),
      employeeCode: form.employeeCode.trim() || undefined,
      companyId: form.companyId,
      status: form.status,
      workEmail: form.workEmail.trim() || undefined,
      personalEmail: form.personalEmail.trim() || undefined,
      phone: form.phone.trim() || undefined,
      gender: form.gender || undefined,
      dateOfBirth: form.dateOfBirth || undefined,
      dateOfJoining: form.dateOfJoining || undefined,
      employmentType: form.employmentType || "Permanent",
      departmentId: form.departmentId || undefined,
      designationId: form.designationId || undefined,
      workLocation: form.workLocation.trim() || undefined,
      city: form.city.trim() || undefined,
      state: form.state.trim() || undefined,
      pan: form.pan.trim().toUpperCase() || undefined,
      aadhaar: form.aadhaar.trim() || undefined,
      uan: form.uan.trim() || undefined,
      esiNumber: form.esiNumber.trim() || undefined,
      bankName: form.bankName.trim() || undefined,
      bankAccountNumber: form.bankAccountNumber.trim() || undefined,
      bankIfsc: form.bankIfsc.trim().toUpperCase() || undefined,
      monthlyCtc: Number(form.monthlyCtc) || 0,
      basicSalary: Number(form.basicSalary) || 0,
    };

    if (mode === "create" && form.createLogin) {
      payload.createLogin = true;
      payload.loginRole = form.loginRole;
      if (form.initialPassword.trim()) {
        payload.initialPassword = form.initialPassword.trim();
      }
    }

    try {
      setIsSaving(true);
      if (mode === "edit" && editing) {
        await hrmsApi.hrms.employees.update(editing.id, payload);
        notifySuccess("Employee updated successfully.");
      } else {
        await hrmsApi.hrms.employees.create(payload);
        notifySuccess("Employee registered successfully.");
      }
      setMode("closed");
      await fetchEmployees();
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to save employee."));
    } finally {
      setIsSaving(false);
    }
  };

  // Status toggle handler
  const handleStatusToggle = async (emp: Employee) => {
    try {
      const nextStatus = emp.status === "Active" ? "Inactive" : "Active";
      await hrmsApi.hrms.employees.update(emp.id, { status: nextStatus });
      notifySuccess(`Employee status marked as ${nextStatus}.`);
      await fetchEmployees();
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to update status."));
    }
  };

  // Delete handler
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      await hrmsApi.hrms.employees.delete(deleteTarget.id);
      notifySuccess(`Employee "${deleteTarget.fullName || "record"}" deleted successfully.`);
      setDeleteTarget(null);
      await fetchEmployees();
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to delete employee record."));
    } finally {
      setIsDeleting(false);
    }
  };

  // CSV Export
  const handleExportCsv = () => {
    if (filteredEmployees.length === 0) {
      notifyError("No employee records to export.");
      return;
    }
    const headers = [
      "Full Name",
      "Employee Code",
      "Work Email",
      "Phone",
      "Department",
      "Designation",
      "Employment Type",
      "Status",
      "Joining Date",
      "City",
      "Monthly CTC",
    ];
    const rows = filteredEmployees.map((e) => [
      `"${(e.fullName || "").replace(/"/g, '""')}"`,
      `"${(e.employeeCode || "").replace(/"/g, '""')}"`,
      `"${(e.email || "").replace(/"/g, '""')}"`,
      `"${(e.phone || "").replace(/"/g, '""')}"`,
      `"${(e.departmentName || "").replace(/"/g, '""')}"`,
      `"${(e.designationName || "").replace(/"/g, '""')}"`,
      `"${(e.employmentType || "").replace(/"/g, '""')}"`,
      `"${(e.status || "").replace(/"/g, '""')}"`,
      `"${(e.joiningDate || (e as any).dateOfJoining || "").replace(/"/g, '""')}"`,
      `"${(e.city || "").replace(/"/g, '""')}"`,
      `"${e.monthlyCtc ?? ""}"`,
    ]);
    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `employees_master_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    notifySuccess(`Exported ${filteredEmployees.length} employee record(s) to CSV.`);
  };

  // Row Action Menu items
  const getEmployeeActions = (employee: Employee): ActionMenuItem[] => {
    const actions: ActionMenuItem[] = [
      {
        label: "View 360 Profile",
        onClick: () => router.push(`${ROUTES.EMPLOYEES}/${employee.id}`),
      },
      {
        label: "Ask AI Assistant",
        onClick: () => setAiEmployee(employee),
      },
    ];

    if (canPunchAttendance) {
      actions.push({
        label: "Mark Attendance",
        onClick: () => router.push(`${ROUTES.ATTENDANCE}?employeeId=${employee.id}`),
      });
    }

    if (canApproveLeave) {
      actions.push({
        label: "Review Leave Requests",
        onClick: () => router.push(`${ROUTES.LEAVE}?employeeId=${employee.id}`),
      });
    }

    if (canAccessDocuments) {
      actions.push({
        label: "Upload & Verify Documents",
        onClick: () => router.push(`${ROUTES.ADMINISTRATION_DOCUMENTS}?employeeId=${employee.id}&module=hrms`),
      });
    }

    if (canViewPayslip) {
      actions.push({
        label: "View Salary Payslips",
        onClick: () => router.push(`${ROUTES.PAYROLL_PAYSLIPS}?employeeId=${employee.id}`),
      });
    }

    if (canEditEmployee) {
      actions.push({
        label: employee.status === "Active" ? "Mark Inactive" : "Reactivate Employee",
        onClick: () => void handleStatusToggle(employee),
      });
    }

    actions.push({
      label: "View Org Hierarchy",
      onClick: () => router.push(ROUTES.ORG_CHART),
    });

    return actions;
  };

  // Table Columns Definition
  const listColumns: PlatformListColumn[] = [
    { key: "name", label: "Employee", dataType: "string" },
    { key: "code", label: "Emp Code" },
    { key: "department", label: "Department" },
    { key: "designation", label: "Designation" },
    { key: "manager", label: "Reporting Manager" },
    { key: "contact", label: "Contact" },
    { key: "status", label: "Status" },
    { key: "actions", label: "Actions", locked: true },
  ];

  // Side-Drawer Form Component
  const drawerForm = (
    <div className="space-y-0">
      {/* Tab Navigation Header */}
      <div className="flex border-b border-slate-100 dark:border-slate-800 mb-5">
        {(
          [
            { id: "basic", label: "Basic Info", icon: <UserCheck className="h-3.5 w-3.5 mr-1.5" /> },
            { id: "job", label: "Job & Organization", icon: <Briefcase className="h-3.5 w-3.5 mr-1.5" /> },
            { id: "compliance", label: "Statutory & Payroll", icon: <CreditCard className="h-3.5 w-3.5 mr-1.5" /> },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`inline-flex items-center px-4 py-2.5 text-xs font-semibold transition-colors border-b-2 cursor-pointer ${
              activeTab === tab.id
                ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Basic Info */}
      {activeTab === "basic" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Full Legal Name *
            </label>
            <input
              className="erp-input h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              value={form.fullName}
              placeholder="e.g. Rahul Sharma"
              onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Employee Code
            </label>
            <input
              className="erp-input h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs font-mono uppercase dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              value={form.employeeCode}
              placeholder="e.g. EMP-1001 (auto-generated if empty)"
              onChange={(e) => setForm((f) => ({ ...f, employeeCode: e.target.value.toUpperCase() }))}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Work Email Address *
            </label>
            <input
              type="email"
              className="erp-input h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              value={form.workEmail}
              placeholder="rahul.sharma@uabindia.com"
              onChange={(e) => setForm((f) => ({ ...f, workEmail: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Primary Phone Number
            </label>
            <input
              className="erp-input h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              value={form.phone}
              placeholder="+91 98765 43210"
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Personal Email
            </label>
            <input
              type="email"
              className="erp-input h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              value={form.personalEmail}
              placeholder="rahul.personal@gmail.com"
              onChange={(e) => setForm((f) => ({ ...f, personalEmail: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Gender
            </label>
            <select
              className="erp-input h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              value={form.gender}
              onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))}
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
              <option value="Prefer not to say">Prefer not to say</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Date of Birth
            </label>
            <input
              type="date"
              className="erp-input h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              value={form.dateOfBirth}
              onChange={(e) => setForm((f) => ({ ...f, dateOfBirth: e.target.value }))}
            />
          </div>
        </div>
      )}

      {/* Tab 2: Job & Organization */}
      {activeTab === "job" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Company / Legal Entity *
            </label>
            <select
              className="erp-input h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              value={form.companyId}
              onChange={(e) => setForm((f) => ({ ...f, companyId: e.target.value }))}
            >
              <option value="">Select Company Entity</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Department
            </label>
            <select
              className="erp-input h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              value={form.departmentId}
              onChange={(e) => {
                const sel = departments.find((d) => d.id === e.target.value);
                setForm((f) => ({
                  ...f,
                  departmentId: e.target.value,
                  departmentName: sel?.name || f.departmentName,
                }));
              }}
            >
              <option value="">Select Department</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Designation / Title
            </label>
            <select
              className="erp-input h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              value={form.designationId}
              onChange={(e) => {
                const sel = designations.find((d) => d.id === e.target.value);
                setForm((f) => ({
                  ...f,
                  designationId: e.target.value,
                  designationName: sel?.name || f.designationName,
                }));
              }}
            >
              <option value="">Select Designation</option>
              {designations.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Employment Type
            </label>
            <select
              className="erp-input h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              value={form.employmentType}
              onChange={(e) => setForm((f) => ({ ...f, employmentType: e.target.value }))}
            >
              {EMPLOYMENT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Date of Joining
            </label>
            <input
              type="date"
              className="erp-input h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              value={form.dateOfJoining}
              onChange={(e) => setForm((f) => ({ ...f, dateOfJoining: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Work Location / Facility
            </label>
            <input
              className="erp-input h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              value={form.workLocation}
              placeholder="e.g. Bangalore Headquarters / Remote"
              onChange={(e) => setForm((f) => ({ ...f, workLocation: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Workforce Status
            </label>
            <select
              className="erp-input h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
            >
              <option value="Active">Active</option>
              <option value="OnLeave">On Leave</option>
              <option value="Inactive">Inactive</option>
              <option value="Terminated">Terminated</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              City
            </label>
            <input
              className="erp-input h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              value={form.city}
              placeholder="e.g. Mumbai, Bangalore, Delhi"
              onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              State / Province
            </label>
            <input
              className="erp-input h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              value={form.state}
              placeholder="e.g. Maharashtra, Karnataka"
              onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
            />
          </div>

          {mode === "create" && (
            <div className="md:col-span-2 rounded-xl border border-slate-200 bg-slate-50/60 p-4 dark:border-slate-700 dark:bg-slate-800/40">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300 accent-blue-600"
                  checked={form.createLogin}
                  onChange={(e) => setForm((f) => ({ ...f, createLogin: e.target.checked }))}
                />
                <span>Provision System Login Access for this Employee</span>
              </label>

              {form.createLogin && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 pt-3 border-t border-slate-200/80 dark:border-slate-700">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      System Role
                    </label>
                    <select
                      className="erp-input h-8 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      value={form.loginRole}
                      onChange={(e) => setForm((f) => ({ ...f, loginRole: e.target.value }))}
                    >
                      <option value="EMPLOYEE">Employee (ESS Self-Service)</option>
                      <option value="HR Manager">HR Manager</option>
                      <option value="Admin">Administrator</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Initial Password (Optional)
                    </label>
                    <input
                      type="password"
                      className="erp-input h-8 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      value={form.initialPassword}
                      placeholder="Leave empty to auto-generate"
                      onChange={(e) => setForm((f) => ({ ...f, initialPassword: e.target.value }))}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Statutory & Payroll */}
      {activeTab === "compliance" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              PAN Number (Income Tax)
            </label>
            <input
              maxLength={10}
              className="erp-input h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs font-mono uppercase dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              value={form.pan}
              placeholder="e.g. ABCDE1234F"
              onChange={(e) => setForm((f) => ({ ...f, pan: e.target.value.toUpperCase() }))}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Aadhaar Card Number
            </label>
            <input
              maxLength={12}
              className="erp-input h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs font-mono dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              value={form.aadhaar}
              placeholder="12-digit UIDAI number"
              onChange={(e) => setForm((f) => ({ ...f, aadhaar: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              UAN Number (Provident Fund)
            </label>
            <input
              className="erp-input h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs font-mono dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              value={form.uan}
              placeholder="12-digit EPFO UAN"
              onChange={(e) => setForm((f) => ({ ...f, uan: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              ESIC Insurance Number
            </label>
            <input
              className="erp-input h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs font-mono dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              value={form.esiNumber}
              placeholder="17-digit ESIC IP number"
              onChange={(e) => setForm((f) => ({ ...f, esiNumber: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Bank Name
            </label>
            <input
              className="erp-input h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              value={form.bankName}
              placeholder="e.g. HDFC Bank, SBI, ICICI"
              onChange={(e) => setForm((f) => ({ ...f, bankName: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Bank Account Number
            </label>
            <input
              className="erp-input h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs font-mono dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              value={form.bankAccountNumber}
              placeholder="Salary credit account number"
              onChange={(e) => setForm((f) => ({ ...f, bankAccountNumber: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Bank IFSC Code
            </label>
            <input
              maxLength={11}
              className="erp-input h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs font-mono uppercase dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              value={form.bankIfsc}
              placeholder="e.g. HDFC0001234"
              onChange={(e) => setForm((f) => ({ ...f, bankIfsc: e.target.value.toUpperCase() }))}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Monthly Gross CTC (₹)
            </label>
            <input
              type="number"
              className="erp-input h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs font-mono dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              value={form.monthlyCtc}
              placeholder="e.g. 75000"
              onChange={(e) => setForm((f) => ({ ...f, monthlyCtc: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Basic Salary (₹)
            </label>
            <input
              type="number"
              className="erp-input h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs font-mono dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              value={form.basicSalary}
              placeholder="e.g. 37500 (approx. 50% of CTC)"
              onChange={(e) => setForm((f) => ({ ...f, basicSalary: e.target.value }))}
            />
          </div>

          <div className="md:col-span-2 rounded-xl border border-blue-100 bg-blue-50 p-4 dark:border-blue-900/60 dark:bg-blue-950/40">
            <p className="text-xs font-semibold text-blue-800 dark:text-blue-300 mb-1">
              Statutory Compliance & Automated Payroll Integration
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-200 leading-relaxed">
              Employee tax numbers (PAN, Aadhaar, UAN, ESI) and banking information directly power monthly payroll generation, EPF/ESIC ECR exports, TDS computation, and automated salary slip generation.
            </p>
          </div>
        </div>
      )}

      {/* Drawer Footer Actions */}
      <div className="mt-5 border-t border-slate-100 dark:border-slate-800 pt-4">
        <ErpDrawerFooter
          onCancel={() => setMode("closed")}
          onSave={() => void handleSave()}
          saving={isSaving}
          isEdit={mode === "edit"}
        />
      </div>
    </div>
  );

  return (
    <>
      <AdministrationGlobalPageShell
        title="Employees & Workforce Directory"
        subtitle="Manage complete employee master records, organizational hierarchy, statutory parameters, and directory overview."
        categoryTag="Human Resources (HRMS)"
        icon="users"
        kpiMetrics={kpis}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search employee name, code, email, department, phone…"
        filterOptions={[
          {
            key: "status",
            label: "All Statuses",
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { label: "All Statuses", value: "all" },
              { label: "Active Only", value: "Active" },
              { label: "On Leave", value: "OnLeave" },
              { label: "Inactive Only", value: "Inactive" },
              { label: "Terminated", value: "Terminated" },
            ],
          },
          {
            key: "department",
            label: "All Departments",
            value: departmentFilter,
            onChange: setDepartmentFilter,
            options: [
              { label: "All Departments", value: "all" },
              ...departmentOptions.map((dept) => ({ label: dept, value: dept })),
            ],
          },
          {
            key: "employmentType",
            label: "All Types",
            value: employmentTypeFilter,
            onChange: setEmploymentTypeFilter,
            options: [
              { label: "All Types", value: "all" },
              ...EMPLOYMENT_TYPES.map((t) => ({ label: t, value: t })),
            ],
          },
        ]}
        onClearFilters={() => {
          setSearch("");
          setStatusFilter("all");
          setDepartmentFilter("all");
          setEmploymentTypeFilter("all");
        }}
        primaryActionLabel={canCreateEmployee ? "Add Employee" : undefined}
        onPrimaryAction={canCreateEmployee ? openCreate : undefined}
        onRefresh={() => void fetchEmployees()}
        onExportCsv={handleExportCsv}
        isLoading={loading}
        currentPage={page}
        totalPages={Math.max(1, Math.ceil(total / 15))}
        totalRecords={total || employees.length}
        onPageChange={setPage}
        listKey="hrms-employees"
        listRows={filteredEmployees}
        getRowId={(row) => row.id}
        emptyMessage="No employees found. Register your first workforce member to get started."
        listColumns={listColumns}
        renderListRow={(employee) => {
          const initials = (employee.fullName || "E")
            .split(" ")
            .map((p) => p[0])
            .filter(Boolean)
            .slice(0, 2)
            .join("")
            .toUpperCase();

          return (
            <tr key={employee.id} className="erp-tr">
              <td className="erp-td">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-xs font-bold text-white shadow-sm">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <button
                      type="button"
                      onClick={() => router.push(`${ROUTES.EMPLOYEES}/${employee.id}`)}
                      className="text-sm font-semibold text-slate-900 hover:text-blue-600 dark:text-white dark:hover:text-blue-400 truncate text-left block cursor-pointer transition-colors"
                    >
                      {employee.fullName || "—"}
                    </button>
                    {employee.email && (
                      <div className="text-xs text-slate-500 dark:text-slate-400 truncate flex items-center gap-1">
                        <Mail className="h-3 w-3 text-slate-400 shrink-0" />
                        {employee.email}
                      </div>
                    )}
                  </div>
                </div>
              </td>
              <td className="erp-td font-mono text-xs text-slate-600 dark:text-slate-300">
                {employee.employeeCode || "—"}
              </td>
              <td className="erp-td">
                {employee.departmentName ? (
                  <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700 border border-blue-200/60 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800/60">
                    {employee.departmentName}
                  </span>
                ) : (
                  <span className="text-xs text-slate-400">—</span>
                )}
              </td>
              <td className="erp-td text-xs font-medium text-slate-700 dark:text-slate-300">
                {employee.designationName || "—"}
              </td>
              <td className="erp-td text-xs font-medium text-slate-700 dark:text-slate-300">
                {(employee as any).reportingManagerName || (employee.managerId ? "Assigned" : "Org Head (Top Tier)")}
              </td>
              <td className="erp-td">
                {employee.phone ? (
                  <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-300">
                    <Phone className="h-3 w-3 text-slate-400 shrink-0" />
                    {employee.phone}
                  </div>
                ) : (
                  <span className="text-xs text-slate-400">—</span>
                )}
              </td>
              <td className="erp-td">
                <span
                  className={cn(
                    "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold border",
                    employee.status === "Active"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/60"
                      : employee.status === "OnLeave"
                        ? "bg-amber-50 text-amber-700 border-amber-200/60 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/60"
                        : "bg-slate-100 text-slate-600 border-slate-200/80 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
                  )}
                >
                  {employee.status || "Active"}
                </span>
              </td>
              <td className="erp-td text-right">
                <ErpRowActions
                  onView={{
                    label: "View Profile",
                    onClick: () => router.push(`${ROUTES.EMPLOYEES}/${employee.id}`),
                  }}
                  onEdit={
                    canEditEmployee
                      ? {
                          label: "Edit Employee",
                          onClick: () => openEdit(employee),
                        }
                      : undefined
                  }
                  onDelete={
                    canDeleteEmployee
                      ? {
                          label: "Delete Record",
                          onClick: () => setDeleteTarget(employee),
                        }
                      : undefined
                  }
                  extra={<TableActionMenu items={getEmployeeActions(employee)} label="More" />}
                />
              </td>
            </tr>
          );
        }}
        isInspectorOpen={mode !== "closed"}
        onInspectorClose={() => setMode("closed")}
        inspectorTitle={
          mode === "edit"
            ? `Edit: ${editing?.fullName || editing?.employeeCode}`
            : "Register New Employee"
        }
        inspectorSubTitle="Fill details across Basic Info, Job & Organization, and Statutory & Payroll tabs"
        inspectorWidth="xl"
        inspectorContent={drawerForm}
      >
        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-300 flex items-center justify-between">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => void fetchEmployees()}
              className="font-bold text-rose-800 underline hover:text-rose-900 cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}
      </AdministrationGlobalPageShell>

      {/* Universal Delete Dialog */}
      <UniversalDeleteDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete Employee Record"
        entityName={deleteTarget?.fullName || deleteTarget?.employeeCode || "this employee"}
        description={`Are you sure you want to delete employee "${deleteTarget?.fullName || "this record"}"? This will archive the record from the active enterprise directory.`}
        isHardDelete
        loading={isDeleting}
        onConfirm={handleDeleteConfirm}
      />

      {/* AI Assistant Drawer */}
      <RecordAiDrawer
        open={Boolean(aiEmployee)}
        onClose={() => setAiEmployee(null)}
        recordType="employee"
        recordId={aiEmployee?.id ?? ""}
        title={
          aiEmployee
            ? `Ask AI · ${aiEmployee.fullName || aiEmployee.employeeCode || "Employee"}`
            : "Ask AI"
        }
        suggestedPrompt="Summarize this employee's status, department role, and attendance risk."
      />
    </>
  );
}
