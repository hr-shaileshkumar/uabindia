"use client";

import { useEffect, useMemo, useState } from "react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { CrudCard, CrudHeaderStats } from "@/components/workspace/crud-workspace";
import { SideDrawer } from "@/components/ui/side-drawer";
import {
  ErpApproveRejectButtons,
  ErpCreateButton,
  ErpDrawerFooter,
  ErpRefreshButton,
  ErpTabBar,
  ErpTabPanel,
} from "@/components/workspace/page-kit";
import { useErpListView } from "@/components/workspace/list-view";
import { erpStatusBadgeTone, erpTableRowHoverClassName, erpTableTdClassName } from "@/components/workspace/styles";
import { getApiErrorMessage } from "@/lib/api-errors";
import { notifyError, notifySuccess } from "@/lib/notifications";
import { hrmsApi, orgApi } from "@/services/modules";
import { Settings, ShieldCheck, Sparkles, Check, Trash2, Edit3, Calendar, Building2, Briefcase, CheckCircle2 } from "lucide-react";
import { useLeavePolicy } from "../hooks/useLeavePolicy";
import { LeavePolicyDrawer } from "./LeavePolicyDrawer";
import { calculateEffectiveLeaveDays } from "../utils/leave-calculator";
import type { LeavePolicy } from "../types/leave-policy.types";

type TabKey = "requests" | "approvals" | "balances" | "policies" | "types" | "holidays" | "allocations";

const leaveApi = hrmsApi.hrms.leave;

// ── helper ─────────────────────────────────────────────────────────────────
const toArray = <T,>(raw: unknown): T[] => {
  if (Array.isArray(raw)) return raw as T[];
  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    for (const key of ["requests", "data", "items", "records"]) {
      if (Array.isArray(obj[key])) return obj[key] as T[];
    }
  }
  return [];
};

export default function LeaveManager() {
  const [activeTab, setActiveTab] = useState<TabKey>("requests");
  const [leaveTypes, setLeaveTypes] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [approvals, setApprovals] = useState<any[]>([]);
  const [balances, setBalances] = useState<any[]>([]);
  const [holidays, setHolidays] = useState<any[]>([]);
  const [allocations, setAllocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Multi-Scope filtering state
  const [companyFilter, setCompanyFilter] = useState<string>("");
  const [projectFilter, setProjectFilter] = useState<string>("");
  const [companiesList, setCompaniesList] = useState<{ id: string; name: string }[]>([]);
  const [projectsList, setProjectsList] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    orgApi.company.getAll(1, 100)
      .then((res: any) => {
        const comps = res?.data?.items || res?.data?.companies || [];
        setCompaniesList(comps.map((c: any) => ({ id: c.id, name: c.name })));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    orgApi.project.getAll(companyFilter || undefined)
      .then((res: any) => {
        const projs = res?.data?.items || res?.data?.projects || [];
        setProjectsList(projs.map((p: any) => ({ id: p.id, name: p.name })));
      })
      .catch(() => {});
  }, [companyFilter]);

  const companyMap = useMemo(() => new Map(companiesList.map((c) => [c.id, c.name])), [companiesList]);
  const projectMap = useMemo(() => new Map(projectsList.map((p) => [p.id, p.name])), [projectsList]);

  // Database-backed dynamic policy studio hook
  const {
    policies,
    activePolicy,
    saving: policySaving,
    createPolicy,
    updatePolicy,
    deletePolicy,
    setDefaultPolicy,
    fetchPolicies,
  } = useLeavePolicy(companyFilter || undefined, projectFilter || undefined);

  // Create form state
  const [holidayDrawer, setHolidayDrawer] = useState(false);
  const [allocationDrawer, setAllocationDrawer] = useState(false);
  const [typeDrawer, setTypeDrawer] = useState(false);
  const [policyStudioOpen, setPolicyStudioOpen] = useState(false);
  const [requestDrawer, setRequestDrawer] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form data
  const [holidayForm, setHolidayForm] = useState({ name: "", date: "", description: "" });
  const [allocationForm, setAllocationForm] = useState({ employeeId: "", leaveTypeId: "", year: String(new Date().getFullYear()), days: "" });
  const [typeForm, setTypeForm] = useState({ code: "", name: "", description: "" });
  const [requestForm, setRequestForm] = useState({ employeeId: "", leavePolicyId: "", fromDate: "", toDate: "", days: "1", reason: "" });

  const [employees, setEmployees] = useState<any[]>([]);

  const currentYear = new Date().getFullYear();

  const pendingApprovals = useMemo(
    () => approvals.filter((r) => (r.status || "").toLowerCase() === "pending"),
    [approvals],
  );
  const approvedRequests = useMemo(
    () => requests.filter((r) => (r.status || "").toLowerCase() === "approved").length,
    [requests],
  );
  const leaveBalanceTotal = useMemo(
    () => balances.reduce((sum, r) => sum + Number(r.balance || r.remaining || 0), 0),
    [balances],
  );

  const loadAll = async () => {
    try {
      setLoading(true);
      setError(null);
      const [typesRes, requestsRes, approvalsRes, balancesRes, holidaysRes, allocationsRes, empRes] =
        await Promise.all([
          leaveApi.types.list(),
          leaveApi.list(1, 100),
          leaveApi.approvals.list("Pending"),
          leaveApi.balances.list(),
          leaveApi.holidays.list(currentYear),
          leaveApi.allocations.list({ year: currentYear }),
          hrmsApi.hrms.employees.list(1, 200),
        ]);

      setLeaveTypes(toArray(typesRes.data));
      const reqData = requestsRes.data;
      setRequests(
        Array.isArray(reqData)
          ? reqData
          : toArray((reqData as any)?.requests ?? (reqData as any)?.data ?? reqData),
      );
      setApprovals(toArray(approvalsRes.data));
      setBalances(toArray(balancesRes.data));
      setHolidays(toArray(holidaysRes.data));
      setAllocations(toArray(allocationsRes.data));
      const empRaw = (empRes.data as any)?.employees ?? empRes.data ?? [];
      setEmployees(Array.isArray(empRaw) ? empRaw : []);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Failed to load leave data"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAll();
    void fetchPolicies();
  }, [currentYear, fetchPolicies]);

  // ── Actions ─────────────────────────────────────────────────────────────
  const handleApproveRequest = async (id: string) => {
    try {
      await leaveApi.approveLeave(id);
      notifySuccess("Leave request approved.");
      await loadAll();
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to approve leave"));
    }
  };

  const handleRejectRequest = async (id: string) => {
    try {
      await leaveApi.rejectLeave(id);
      notifySuccess("Leave request rejected.");
      await loadAll();
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to reject leave"));
    }
  };

  // ── Create handlers ──────────────────────────────────────────────────────
  const saveHoliday = async () => {
    if (!holidayForm.name.trim() || !holidayForm.date) {
      notifyError("Name and date are required.");
      return;
    }
    try {
      setSaving(true);
      await leaveApi.holidays.create({
        name: holidayForm.name.trim(),
        date: holidayForm.date,
        description: holidayForm.description || undefined,
      });
      notifySuccess("Holiday added.");
      setHolidayDrawer(false);
      setHolidayForm({ name: "", date: "", description: "" });
      void loadAll();
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to add holiday."));
    } finally {
      setSaving(false);
    }
  };

  const saveAllocation = async () => {
    if (!allocationForm.employeeId || !allocationForm.leaveTypeId || !allocationForm.days) {
      notifyError("Employee, leave type, and days are required.");
      return;
    }
    try {
      setSaving(true);
      await leaveApi.allocations.create({
        employeeId: allocationForm.employeeId,
        leaveTypeId: allocationForm.leaveTypeId,
        year: Number(allocationForm.year),
        allocated: Number(allocationForm.days),
      });
      notifySuccess("Allocation created.");
      setAllocationDrawer(false);
      setAllocationForm({ employeeId: "", leaveTypeId: "", year: String(currentYear), days: "" });
      void loadAll();
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to create allocation."));
    } finally {
      setSaving(false);
    }
  };

  const saveLeaveType = async () => {
    if (!typeForm.code.trim() || !typeForm.name.trim()) {
      notifyError("Code and name are required.");
      return;
    }
    try {
      setSaving(true);
      await leaveApi.types.create({
        code: typeForm.code.trim(),
        name: typeForm.name.trim(),
        description: typeForm.description || undefined,
      });
      notifySuccess("Leave type created.");
      setTypeDrawer(false);
      setTypeForm({ code: "", name: "", description: "" });
      void loadAll();
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to create leave type."));
    } finally {
      setSaving(false);
    }
  };

  const handleDatesChange = (fromDate: string, toDate: string, selectedPolicyId: string) => {
    if (!fromDate || !toDate) return;
    const targetPolicy = policies.find((p) => p.id === selectedPolicyId) || activePolicy;
    const holidayDates = holidays.map((h) => h.date || h.holidayDate).filter(Boolean);
    const result = calculateEffectiveLeaveDays({
      fromDate,
      toDate,
      holidays: holidayDates,
      sandwichRuleEnabled: targetPolicy?.sandwichRuleEnabled ?? false,
    });
    setRequestForm((prev) => ({
      ...prev,
      fromDate,
      toDate,
      days: String(result.effectiveLeaveDays),
    }));
  };

  const saveRequest = async () => {
    if (!requestForm.employeeId || !requestForm.leavePolicyId || !requestForm.fromDate || !requestForm.toDate) {
      notifyError("Employee, policy, and dates are required.");
      return;
    }
    try {
      setSaving(true);
      await leaveApi.requestLeave({
        employeeId: requestForm.employeeId,
        leavePolicyId: requestForm.leavePolicyId,
        fromDate: requestForm.fromDate,
        toDate: requestForm.toDate,
        days: Number(requestForm.days) || 1,
        reason: requestForm.reason || undefined,
      });
      notifySuccess("Leave request submitted.");
      setRequestDrawer(false);
      setRequestForm({ employeeId: "", leavePolicyId: "", fromDate: "", toDate: "", days: "1", reason: "" });
      void loadAll();
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to submit request."));
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePolicy = async (id: string) => {
    if (!confirm("Are you sure you want to delete this leave policy from the database?")) return;
    await deletePolicy(id);
  };

  const filteredRequests = useMemo(() => {
    if (!companyFilter && !projectFilter) return requests;
    return requests.filter((r) => {
      const emp = employees.find((e) => String(e.id) === String(r.employeeId));
      if (companyFilter && r.companyId !== companyFilter && emp?.companyId !== companyFilter) return false;
      if (projectFilter && r.projectId !== projectFilter && emp?.projectId !== projectFilter) return false;
      return true;
    });
  }, [requests, employees, companyFilter, projectFilter]);

  const filteredApprovals = useMemo(() => {
    return pendingApprovals.filter((r) => {
      const emp = employees.find((e) => String(e.id) === String(r.employeeId));
      if (companyFilter && r.companyId !== companyFilter && emp?.companyId !== companyFilter) return false;
      if (projectFilter && r.projectId !== projectFilter && emp?.projectId !== projectFilter) return false;
      return true;
    });
  }, [pendingApprovals, employees, companyFilter, projectFilter]);

  const filteredBalances = useMemo(() => {
    if (!companyFilter && !projectFilter) return balances;
    return balances.filter((b) => {
      const emp = employees.find((e) => String(e.id) === String(b.employeeId));
      if (companyFilter && b.companyId !== companyFilter && emp?.companyId !== companyFilter) return false;
      if (projectFilter && b.projectId !== projectFilter && emp?.projectId !== projectFilter) return false;
      return true;
    });
  }, [balances, employees, companyFilter, projectFilter]);

  const filteredPolicies = useMemo(() => {
    if (!companyFilter && !projectFilter) return policies;
    return policies.filter((p) => {
      if (companyFilter && p.companyId && p.companyId !== companyFilter) return false;
      if (projectFilter && p.projectId && p.projectId !== projectFilter) return false;
      return true;
    });
  }, [policies, companyFilter, projectFilter]);

  // ── List views ───────────────────────────────────────────────────────────
  const requestsList = useErpListView({
    listKey: "hrms-leave-requests",
    rows: filteredRequests,
    loading: loading && activeTab === "requests",
    emptyMessage: "No leave requests found.",
    getRowId: (row) => String(row.id),
    columns: [
      { key: "employee", label: "Employee" },
      { key: "leaveType", label: "Type" },
      { key: "fromDate", label: "From" },
      { key: "toDate", label: "To" },
      { key: "days", label: "Days", dataType: "number" },
      { key: "status", label: "Status" },
    ],
    onRefresh: () => void loadAll(),
    renderRow: (req) => (
      <>
        <td className="erp-td text-xs font-medium">{req.employeeName || req.employeeId}</td>
        <td className="erp-td text-xs text-slate-600">{req.leavePolicyName || req.leaveType || "—"}</td>
        <td className="erp-td text-xs">{req.fromDate}</td>
        <td className="erp-td text-xs">{req.toDate}</td>
        <td className="erp-td text-xs font-semibold">{req.days}</td>
        <td className="erp-td">
          <span className={erpStatusBadgeTone.info}>{req.status}</span>
        </td>
      </>
    ),
  });

  const approvalsList = useErpListView({
    listKey: "hrms-leave-approvals",
    rows: filteredApprovals,
    loading: loading && activeTab === "approvals",
    emptyMessage: "No pending approvals.",
    getRowId: (row) => String(row.id),
    columns: [
      { key: "employee", label: "Employee" },
      { key: "period", label: "Period" },
      { key: "days", label: "Days", dataType: "number" },
      { key: "actions", label: "Actions", locked: true },
    ],
    onRefresh: () => void loadAll(),
    renderRow: (req) => (
      <>
        <td className="erp-td text-xs font-medium">{req.employeeName || req.employeeId}</td>
        <td className="erp-td text-xs text-slate-500">{req.fromDate} → {req.toDate}</td>
        <td className="erp-td text-xs font-semibold">{req.days}</td>
        <td className="erp-td">
          <ErpApproveRejectButtons
            onApprove={() => void handleApproveRequest(req.id)}
            onReject={() => void handleRejectRequest(req.id)}
          />
        </td>
      </>
    ),
  });

  const tabItems = [
    { key: "requests", label: "Requests", count: filteredRequests.length },
    {
      key: "approvals",
      label: "Pending approvals",
      count: filteredApprovals.length,
      tone: filteredApprovals.length > 0 ? ("warning" as const) : undefined,
    },
    { key: "balances", label: "Balances", count: filteredBalances.length },
    { key: "policies", label: "Policies", count: filteredPolicies.length },
    { key: "types", label: "Leave types", count: leaveTypes.length },
    { key: "holidays", label: "Holidays", count: holidays.length },
    { key: "allocations", label: "Allocations", count: allocations.length },
  ];

  const activeCreateBtn = () => {
    if (activeTab === "requests") return <ErpCreateButton label="New request" onClick={() => setRequestDrawer(true)} />;
    if (activeTab === "holidays") return <ErpCreateButton label="Add holiday" onClick={() => setHolidayDrawer(true)} />;
    if (activeTab === "allocations") return <ErpCreateButton label="New allocation" onClick={() => setAllocationDrawer(true)} />;
    if (activeTab === "types") return <ErpCreateButton label="New type" onClick={() => setTypeDrawer(true)} />;
    if (activeTab === "policies") return <ErpCreateButton label="Policy Studio" onClick={() => setPolicyStudioOpen(true)} />;
    return null;
  };

  return (
    <>
      <StandardPageLayout
        title="Leave Management"
        subtitle="Dynamic database-backed leave policies, requests, approvals, balances, holidays, and statutory encashment."
        eyebrow="HRMS / Leave & Time-Off"
        icon="calendar"
        meta={
          <CrudHeaderStats
            items={[
              { label: "Requests", value: filteredRequests.length, tone: "info" },
              { label: "Pending", value: filteredApprovals.length, tone: "warning" },
              { label: "Approved", value: approvedRequests, tone: "positive" },
              { label: "Balance days", value: leaveBalanceTotal, tone: "info" },
            ]}
          />
        }
        actions={
          <>
            <button
              type="button"
              onClick={() => setPolicyStudioOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <Settings className="h-3.5 w-3.5 text-blue-600" />
              Policy Studio
            </button>
            <ErpRefreshButton onClick={() => void loadAll()} loading={loading} />
            {activeTab === "requests" ? requestsList.headerTools : null}
            {activeTab === "approvals" ? approvalsList.headerTools : null}
            {activeCreateBtn()}
          </>
        }
        filters={
          <div className="flex flex-wrap items-center gap-3 w-full">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-slate-400" />
              <select
                value={companyFilter}
                onChange={(e) => {
                  setCompanyFilter(e.target.value);
                  setProjectFilter("");
                }}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 shadow-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">All Companies (Tenant Scope)</option>
                {companiesList.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-slate-400" />
              <select
                value={projectFilter}
                onChange={(e) => setProjectFilter(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 shadow-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">All Projects / Sites</option>
                {projectsList.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            {activeTab === "requests" ? requestsList.filterBar : activeTab === "approvals" ? approvalsList.filterBar : null}
          </div>
        }
      >
        {error && <div className="erp-alert-error">{error}</div>}

        <ErpTabBar tabs={tabItems} active={activeTab} onChange={(k) => setActiveTab(k as TabKey)} />

        <ErpTabPanel hidden={activeTab !== "requests"}>
          <CrudCard>{requestsList.table}</CrudCard>
        </ErpTabPanel>

        <ErpTabPanel hidden={activeTab !== "approvals"}>
          <CrudCard>{approvalsList.table}</CrudCard>
        </ErpTabPanel>

        <ErpTabPanel hidden={activeTab !== "balances"}>
          <CrudCard title="Leave balances">
            {loading ? (
              <p className="p-4 text-sm text-slate-500">Loading…</p>
            ) : filteredBalances.length === 0 ? (
              <p className="p-4 text-sm text-slate-500">No leave balances available for selected scope.</p>
            ) : (
              <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-3">
                {filteredBalances.map((b, i) => (
                  <div key={b.id || i} className="rounded-lg border border-slate-200 bg-slate-50/70 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {b.leaveTypeName || b.leaveType || "Leave balance"}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">{b.employeeName || b.employeeId || "Employee"}</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-950">{Number(b.balance || b.remaining || 0)}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      Allocated {Number(b.allocated || 0)} · Used {Number(b.used || 0)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CrudCard>
        </ErpTabPanel>

        <ErpTabPanel hidden={activeTab !== "policies"}>
          <CrudCard
            title="Database-Backed Leave Policies"
            actions={
              <button
                type="button"
                onClick={() => setPolicyStudioOpen(true)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
              >
                <Settings className="h-3.5 w-3.5" />
                Open Policy Studio
              </button>
            }
          >
            {filteredPolicies.length === 0 ? (
              <p className="p-4 text-sm text-slate-500">
                No leave policies configured in database for selected scope. Click <strong>Policy Studio</strong> to add one.
              </p>
            ) : (
              <div className="erp-table-wrap">
                <table className="erp-table">
                  <thead className="erp-thead">
                    <tr>
                      {["Policy Name", "Scope", "Type", "Quota / Year", "Frequency", "Carry Forward", "Sandwich Rule", "Probation", "Status", "Actions"].map((h) => (
                        <th key={h} className="erp-th">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPolicies.map((p) => (
                      <tr key={p.id} className={erpTableRowHoverClassName}>
                        <td className={`${erpTableTdClassName} font-semibold text-slate-900`}>
                          <div className="flex items-center gap-2">
                            <span>{p.name}</span>
                            {p.isDefault && (
                              <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">
                                Default
                              </span>
                            )}
                          </div>
                          {p.description && <p className="text-[11px] text-slate-400 font-normal">{p.description}</p>}
                        </td>
                        <td className={erpTableTdClassName}>
                          {p.projectId ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 border border-purple-200 px-2 py-0.5 text-[11px] font-medium text-purple-800">
                              <Briefcase className="h-3 w-3" />
                              {projectMap.get(p.projectId) || "Site Override"}
                            </span>
                          ) : p.companyId ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-200 px-2 py-0.5 text-[11px] font-medium text-blue-800">
                              <Building2 className="h-3 w-3" />
                              {companyMap.get(p.companyId) || "Company Override"}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[11px] font-medium text-emerald-800">
                              <CheckCircle2 className="h-3 w-3" />
                              Tenant Baseline
                            </span>
                          )}
                        </td>
                        <td className={`${erpTableTdClassName} text-xs text-slate-600`}>
                          {p.type} {p.leaveTypeCode ? `(${p.leaveTypeCode})` : ""}
                        </td>
                        <td className={`${erpTableTdClassName} text-xs font-semibold text-slate-800`}>
                          {p.entitlementPerYear} days
                        </td>
                        <td className={`${erpTableTdClassName} text-xs text-slate-600`}>
                          {p.allocationFrequency || "Yearly"}
                        </td>
                        <td className={`${erpTableTdClassName} text-xs`}>
                          {p.carryForwardAllowed ? (
                            <span className="text-emerald-700 font-medium">Max {p.maxCarryForwardDays}d</span>
                          ) : (
                            <span className="text-slate-400">No</span>
                          )}
                        </td>
                        <td className={`${erpTableTdClassName} text-xs`}>
                          {p.sandwichRuleEnabled ? (
                            <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">Enforced</span>
                          ) : (
                            <span className="text-slate-400">Disabled</span>
                          )}
                        </td>
                        <td className={`${erpTableTdClassName} text-xs`}>
                          {p.allowDuringProbation ? (
                            <span className="text-emerald-700 font-medium">Allowed</span>
                          ) : (
                            <span className="text-slate-400">Restricted</span>
                          )}
                        </td>
                        <td className={erpTableTdClassName}>
                          <span
                            className={
                              p.status === "Active"
                                ? "erp-chip erp-chip-success"
                                : p.status === "Draft"
                                  ? "erp-chip erp-chip-warning"
                                  : "erp-chip erp-chip-neutral"
                            }
                          >
                            {p.status || "Active"}
                          </span>
                        </td>
                        <td className={`${erpTableTdClassName} text-right space-x-1`}>
                          {!p.isDefault && (
                            <button
                              type="button"
                              onClick={() => void setDefaultPolicy(p.id)}
                              className="rounded px-2 py-1 text-[11px] font-medium text-emerald-700 hover:bg-emerald-50"
                              title="Set as organization default"
                            >
                              Set Default
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setPolicyStudioOpen(true)}
                            className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-blue-600"
                            title="Edit policy"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDeletePolicy(p.id)}
                            className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                            title="Delete policy"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CrudCard>
        </ErpTabPanel>

        <ErpTabPanel hidden={activeTab !== "types"}>
          <CrudCard title="Leave types">
            {leaveTypes.length === 0 ? (
              <p className="p-4 text-sm text-slate-500">No leave types configured. Click <strong>New type</strong> to add one.</p>
            ) : (
              <div className="erp-table-wrap">
                <table className="erp-table">
                  <thead className="erp-thead">
                    <tr>
                      {["Code", "Name", "Description", "Active", "Order"].map((h) => <th key={h} className="erp-th">{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {leaveTypes.map((t, i) => (
                      <tr key={t.id || i} className={erpTableRowHoverClassName}>
                        <td className={`${erpTableTdClassName} font-mono text-xs font-semibold text-indigo-700`}>{t.code || "—"}</td>
                        <td className={`${erpTableTdClassName} font-semibold text-slate-900`}>{t.name || t.leaveTypeName || "Type"}</td>
                        <td className={`${erpTableTdClassName} text-xs text-slate-500`}>{t.description || "—"}</td>
                        <td className={erpTableTdClassName}>
                          <span className={t.isActive !== false ? "erp-chip erp-chip-success" : "erp-chip erp-chip-neutral"}>
                            {t.isActive !== false ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className={`${erpTableTdClassName} text-xs text-slate-500`}>{t.displayOrder ?? 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CrudCard>
        </ErpTabPanel>

        <ErpTabPanel hidden={activeTab !== "holidays"}>
          <CrudCard title={`Holidays ${currentYear}`}>
            {holidays.length === 0 ? (
              <p className="p-4 text-sm text-slate-500">No holidays for {currentYear}. Click <strong>Add holiday</strong> to add one.</p>
            ) : (
              <div className="erp-table-wrap">
                <table className="erp-table">
                  <thead className="erp-thead">
                    <tr>
                      {["Date", "Holiday", "Description"].map((h) => <th key={h} className="erp-th">{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {holidays
                      .slice()
                      .sort((a, b) => (a.date || a.holidayDate || "").localeCompare(b.date || b.holidayDate || ""))
                      .map((h, i) => (
                        <tr key={h.id || i} className={erpTableRowHoverClassName}>
                          <td className={`${erpTableTdClassName} font-semibold text-slate-900`}>
                            {h.date || h.holidayDate
                              ? new Date(h.date || h.holidayDate).toLocaleDateString("en-IN", { day: "numeric", month: "long" })
                              : "—"}
                          </td>
                          <td className={`${erpTableTdClassName} text-slate-800`}>{h.name || h.holidayName || "Holiday"}</td>
                          <td className={`${erpTableTdClassName} text-xs text-slate-500`}>{h.description || "—"}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </CrudCard>
        </ErpTabPanel>

        <ErpTabPanel hidden={activeTab !== "allocations"}>
          <CrudCard title="Annual leave allocations">
            {allocations.length === 0 ? (
              <p className="p-4 text-sm text-slate-500">No allocations for {currentYear}. Click <strong>New allocation</strong> to allocate leaves.</p>
            ) : (
              <div className="erp-table-wrap">
                <table className="erp-table">
                  <thead className="erp-thead">
                    <tr>
                      {["Employee", "Leave type", "Year", "Allocated", "Used", "Balance"].map((h) => <th key={h} className="erp-th">{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {allocations.map((a, i) => (
                      <tr key={a.id || i} className={erpTableRowHoverClassName}>
                        <td className={`${erpTableTdClassName} font-semibold text-slate-900`}>{a.employeeName || a.employeeId || "—"}</td>
                        <td className={`${erpTableTdClassName} text-xs text-slate-600`}>{a.leaveTypeName || a.leaveType || "—"}</td>
                        <td className={`${erpTableTdClassName} text-xs text-slate-600`}>{a.year || currentYear}</td>
                        <td className={`${erpTableTdClassName} text-xs font-semibold`}>{Number(a.allocated || 0)} days</td>
                        <td className={`${erpTableTdClassName} text-xs text-rose-600`}>{Number(a.used || 0)} days</td>
                        <td className={`${erpTableTdClassName} text-xs font-semibold text-emerald-700`}>
                          {Number(a.balance || a.remaining || (a.allocated - a.used) || 0)} days
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CrudCard>
        </ErpTabPanel>
      </StandardPageLayout>

      {/* ── Policy Studio Drawer ────────────────────────────────────────────── */}
      <LeavePolicyDrawer
        open={policyStudioOpen}
        onOpenChange={setPolicyStudioOpen}
        policies={policies}
        activePolicy={activePolicy}
        saving={policySaving}
        onSave={async (data, id) => {
          if (id) {
            return await updatePolicy(id, data);
          }
          return await createPolicy(data);
        }}
        onSetDefault={setDefaultPolicy}
      />

      {/* ── Create Holiday Drawer ──────────────────────────────────────────── */}
      <SideDrawer open={holidayDrawer} onClose={() => setHolidayDrawer(false)} title="Add holiday"
        footer={<ErpDrawerFooter onCancel={() => setHolidayDrawer(false)} onSave={() => void saveHoliday()} saving={saving} saveLabel="Add holiday" />}
      >
        <div className="space-y-4">
          <div>
            <label className="erp-label">Holiday name *</label>
            <input className="erp-input mt-1" value={holidayForm.name} onChange={(e) => setHolidayForm({ ...holidayForm, name: e.target.value })} placeholder="Diwali" />
          </div>
          <div>
            <label className="erp-label">Date *</label>
            <input type="date" className="erp-input mt-1" value={holidayForm.date} onChange={(e) => setHolidayForm({ ...holidayForm, date: e.target.value })} />
          </div>
          <div>
            <label className="erp-label">Description</label>
            <input className="erp-input mt-1" value={holidayForm.description} onChange={(e) => setHolidayForm({ ...holidayForm, description: e.target.value })} placeholder="Festival of lights" />
          </div>
        </div>
      </SideDrawer>

      {/* ── Create Allocation Drawer ─────────────────────────────────────────── */}
      <SideDrawer open={allocationDrawer} onClose={() => setAllocationDrawer(false)} title="New leave allocation"
        footer={<ErpDrawerFooter onCancel={() => setAllocationDrawer(false)} onSave={() => void saveAllocation()} saving={saving} saveLabel="Create allocation" />}
      >
        <div className="space-y-4">
          <div>
            <label className="erp-label">Employee *</label>
            <select className="erp-input mt-1" value={allocationForm.employeeId} onChange={(e) => setAllocationForm({ ...allocationForm, employeeId: e.target.value })}>
              <option value="">Select employee</option>
              {employees.map((e) => <option key={e.id} value={e.id}>{e.fullName || e.firstName || e.id}</option>)}
            </select>
          </div>
          <div>
            <label className="erp-label">Leave type *</label>
            <select className="erp-input mt-1" value={allocationForm.leaveTypeId} onChange={(e) => setAllocationForm({ ...allocationForm, leaveTypeId: e.target.value })}>
              <option value="">Select leave type</option>
              {leaveTypes.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="erp-label">Year *</label>
              <input type="number" className="erp-input mt-1" value={allocationForm.year} onChange={(e) => setAllocationForm({ ...allocationForm, year: e.target.value })} />
            </div>
            <div>
              <label className="erp-label">Days to allocate *</label>
              <input type="number" min={0} className="erp-input mt-1" value={allocationForm.days} onChange={(e) => setAllocationForm({ ...allocationForm, days: e.target.value })} placeholder="12" />
            </div>
          </div>
        </div>
      </SideDrawer>

      {/* ── Create Leave Type Drawer ──────────────────────────────────────────── */}
      <SideDrawer open={typeDrawer} onClose={() => setTypeDrawer(false)} title="New leave type"
        footer={<ErpDrawerFooter onCancel={() => setTypeDrawer(false)} onSave={() => void saveLeaveType()} saving={saving} saveLabel="Create type" />}
      >
        <div className="space-y-4">
          <div>
            <label className="erp-label">Code *</label>
            <input className="erp-input mt-1 font-mono" value={typeForm.code} onChange={(e) => setTypeForm({ ...typeForm, code: e.target.value.toUpperCase() })} placeholder="CL" maxLength={10} />
          </div>
          <div>
            <label className="erp-label">Name *</label>
            <input className="erp-input mt-1" value={typeForm.name} onChange={(e) => setTypeForm({ ...typeForm, name: e.target.value })} placeholder="Casual Leave" />
          </div>
          <div>
            <label className="erp-label">Description</label>
            <textarea className="erp-input mt-1 min-h-20" value={typeForm.description} onChange={(e) => setTypeForm({ ...typeForm, description: e.target.value })} />
          </div>
        </div>
      </SideDrawer>

      {/* ── New Leave Request Drawer with Dynamic Calculator ────────────────────── */}
      <SideDrawer open={requestDrawer} onClose={() => setRequestDrawer(false)} title="New leave request"
        footer={<ErpDrawerFooter onCancel={() => setRequestDrawer(false)} onSave={() => void saveRequest()} saving={saving} saveLabel="Submit request" />}
      >
        <div className="space-y-4">
          <div>
            <label className="erp-label">Employee *</label>
            <select className="erp-input mt-1" value={requestForm.employeeId} onChange={(e) => setRequestForm({ ...requestForm, employeeId: e.target.value })}>
              <option value="">Select employee</option>
              {employees.map((e) => <option key={e.id} value={e.id}>{e.fullName || e.firstName || e.id}</option>)}
            </select>
          </div>
          <div>
            <label className="erp-label">Leave policy *</label>
            <select
              className="erp-input mt-1"
              value={requestForm.leavePolicyId}
              onChange={(e) => {
                const polId = e.target.value;
                setRequestForm({ ...requestForm, leavePolicyId: polId });
                handleDatesChange(requestForm.fromDate, requestForm.toDate, polId);
              }}
            >
              <option value="">Select policy</option>
              {policies.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.sandwichRuleEnabled ? "(Sandwich rule enforced)" : ""}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="erp-label">From date *</label>
              <input
                type="date"
                className="erp-input mt-1"
                value={requestForm.fromDate}
                onChange={(e) => handleDatesChange(e.target.value, requestForm.toDate, requestForm.leavePolicyId)}
              />
            </div>
            <div>
              <label className="erp-label">To date *</label>
              <input
                type="date"
                className="erp-input mt-1"
                value={requestForm.toDate}
                onChange={(e) => handleDatesChange(requestForm.fromDate, e.target.value, requestForm.leavePolicyId)}
              />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between">
              <label className="erp-label">Calculated Leave Days *</label>
              <span className="text-[11px] text-slate-500">Auto-calculated using policy rules</span>
            </div>
            <input
              type="number"
              min={0.5}
              step={0.5}
              className="erp-input mt-1"
              value={requestForm.days}
              onChange={(e) => setRequestForm({ ...requestForm, days: e.target.value })}
            />
          </div>
          <div>
            <label className="erp-label">Reason</label>
            <textarea className="erp-input mt-1 min-h-20" value={requestForm.reason} onChange={(e) => setRequestForm({ ...requestForm, reason: e.target.value })} placeholder="Reason for time off" />
          </div>
        </div>
      </SideDrawer>
    </>
  );
}
