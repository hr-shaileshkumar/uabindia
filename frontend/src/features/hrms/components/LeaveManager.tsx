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
import { hrmsApi } from "@/services/modules";

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
  const [policies, setPolicies] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [approvals, setApprovals] = useState<any[]>([]);
  const [balances, setBalances] = useState<any[]>([]);
  const [holidays, setHolidays] = useState<any[]>([]);
  const [allocations, setAllocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create form state
  const [holidayDrawer, setHolidayDrawer] = useState(false);
  const [allocationDrawer, setAllocationDrawer] = useState(false);
  const [typeDrawer, setTypeDrawer] = useState(false);
  const [policyDrawer, setPolicyDrawer] = useState(false);
  const [requestDrawer, setRequestDrawer] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form data
  const [holidayForm, setHolidayForm] = useState({ name: "", date: "", description: "" });
  const [allocationForm, setAllocationForm] = useState({ employeeId: "", leaveTypeId: "", year: String(new Date().getFullYear()), days: "" });
  const [typeForm, setTypeForm] = useState({ code: "", name: "", description: "" });
  const [policyForm, setPolicyForm] = useState({ name: "", type: "Casual Leave", entitlementPerYear: "12", carryForwardAllowed: false, allocationFrequency: "Yearly" });
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
      const [typesRes, policiesRes, requestsRes, approvalsRes, balancesRes, holidaysRes, allocationsRes, empRes] =
        await Promise.all([
          leaveApi.types.list(),
          leaveApi.policies.list(),
          leaveApi.list(1, 100),
          leaveApi.approvals.list("Pending"),
          leaveApi.balances.list(),
          leaveApi.holidays.list(currentYear),
          leaveApi.allocations.list({ year: currentYear }),
          hrmsApi.hrms.employees.list(1, 200),
        ]);

      setLeaveTypes(toArray(typesRes.data));
      setPolicies(toArray(policiesRes.data));
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

  useEffect(() => { void loadAll(); }, [currentYear]);

  // ── Actions ─────────────────────────────────────────────────────────────
  const handleApproveRequest = async (id: string) => {
    try { await leaveApi.approveLeave(id); await loadAll(); }
    catch (err) { setError(getApiErrorMessage(err, "Failed to approve leave")); }
  };

  const handleRejectRequest = async (id: string) => {
    try { await leaveApi.rejectLeave(id); await loadAll(); }
    catch (err) { setError(getApiErrorMessage(err, "Failed to reject leave")); }
  };

  // ── Create handlers ──────────────────────────────────────────────────────
  const saveHoliday = async () => {
    if (!holidayForm.name.trim() || !holidayForm.date) { notifyError("Name and date are required."); return; }
    try {
      setSaving(true);
      await leaveApi.holidays.create({ name: holidayForm.name.trim(), date: holidayForm.date, description: holidayForm.description || undefined });
      notifySuccess("Holiday added.");
      setHolidayDrawer(false);
      setHolidayForm({ name: "", date: "", description: "" });
      void loadAll();
    } catch (err) { notifyError(getApiErrorMessage(err, "Failed to add holiday.")); }
    finally { setSaving(false); }
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
    } catch (err) { notifyError(getApiErrorMessage(err, "Failed to create allocation.")); }
    finally { setSaving(false); }
  };

  const saveLeaveType = async () => {
    if (!typeForm.code.trim() || !typeForm.name.trim()) { notifyError("Code and name are required."); return; }
    try {
      setSaving(true);
      await leaveApi.types.create({ code: typeForm.code.trim(), name: typeForm.name.trim(), description: typeForm.description || undefined });
      notifySuccess("Leave type created.");
      setTypeDrawer(false);
      setTypeForm({ code: "", name: "", description: "" });
      void loadAll();
    } catch (err) { notifyError(getApiErrorMessage(err, "Failed to create leave type.")); }
    finally { setSaving(false); }
  };

  const savePolicy = async () => {
    if (!policyForm.name.trim()) { notifyError("Policy name is required."); return; }
    try {
      setSaving(true);
      await leaveApi.policies.create({
        name: policyForm.name.trim(),
        type: policyForm.type,
        entitlementPerYear: Number(policyForm.entitlementPerYear) || 12,
        carryForwardAllowed: policyForm.carryForwardAllowed,
        allocationFrequency: policyForm.allocationFrequency,
      });
      notifySuccess("Leave policy created.");
      setPolicyDrawer(false);
      setPolicyForm({ name: "", type: "Casual Leave", entitlementPerYear: "12", carryForwardAllowed: false, allocationFrequency: "Yearly" });
      void loadAll();
    } catch (err) { notifyError(getApiErrorMessage(err, "Failed to create policy.")); }
    finally { setSaving(false); }
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
    } catch (err) { notifyError(getApiErrorMessage(err, "Failed to submit request.")); }
    finally { setSaving(false); }
  };

  // ── List views ───────────────────────────────────────────────────────────
  const requestsList = useErpListView({
    listKey: "hrms-leave-requests",
    rows: requests,
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
        <td className="erp-td text-xs">{req.days}</td>
        <td className="erp-td">
          <span className={erpStatusBadgeTone.info}>{req.status}</span>
        </td>
      </>
    ),
  });

  const approvalsList = useErpListView({
    listKey: "hrms-leave-approvals",
    rows: pendingApprovals,
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
        <td className="erp-td text-xs">{req.days}</td>
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
    { key: "requests", label: "Requests", count: requests.length },
    { key: "approvals", label: "Pending approvals", count: pendingApprovals.length },
    { key: "balances", label: "Balances", count: balances.length },
    { key: "policies", label: "Policies", count: policies.length },
    { key: "types", label: "Leave types", count: leaveTypes.length },
    { key: "holidays", label: "Holidays", count: holidays.length },
    { key: "allocations", label: "Allocations", count: allocations.length },
  ];

  const activeCreateBtn = () => {
    if (activeTab === "requests") return <ErpCreateButton label="New request" onClick={() => setRequestDrawer(true)} />;
    if (activeTab === "holidays") return <ErpCreateButton label="Add holiday" onClick={() => setHolidayDrawer(true)} />;
    if (activeTab === "allocations") return <ErpCreateButton label="New allocation" onClick={() => setAllocationDrawer(true)} />;
    if (activeTab === "types") return <ErpCreateButton label="New type" onClick={() => setTypeDrawer(true)} />;
    if (activeTab === "policies") return <ErpCreateButton label="New policy" onClick={() => setPolicyDrawer(true)} />;
    return null;
  };

  return (
    <>
      <StandardPageLayout
        title="Leave Management"
        subtitle="Leave requests, approvals, balances, policies, leave types, holidays, and annual allocations."
        eyebrow="HRMS / Leave"
        icon="calendar"
        meta={
          <CrudHeaderStats
            items={[
              { label: "Requests", value: requests.length, tone: "info" },
              { label: "Pending", value: pendingApprovals.length, tone: "warning" },
              { label: "Approved", value: approvedRequests, tone: "positive" },
              { label: "Balance days", value: leaveBalanceTotal, tone: "info" },
            ]}
          />
        }
        actions={
          <>
            <ErpRefreshButton onClick={() => void loadAll()} loading={loading} />
            {activeTab === "requests" ? requestsList.headerTools : null}
            {activeTab === "approvals" ? approvalsList.headerTools : null}
            {activeCreateBtn()}
          </>
        }
        filters={
          activeTab === "requests" ? requestsList.filterBar : activeTab === "approvals" ? approvalsList.filterBar : undefined
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
            ) : balances.length === 0 ? (
              <p className="p-4 text-sm text-slate-500">No leave balances available.</p>
            ) : (
              <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-3">
                {balances.map((b, i) => (
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
          <CrudCard title="Leave policies">
            {policies.length === 0 ? (
              <p className="p-4 text-sm text-slate-500">No leave policies configured. Click <strong>New policy</strong> to add one.</p>
            ) : (
              <div className="erp-table-wrap">
                <table className="erp-table">
                  <thead className="erp-thead">
                    <tr>
                      {["Name", "Type", "Entitlement/yr", "Carry forward", "Frequency", "Auto-allocate"].map((h) => (
                        <th key={h} className="erp-th">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {policies.map((p, i) => (
                      <tr key={p.id || i} className={erpTableRowHoverClassName}>
                        <td className={`${erpTableTdClassName} font-semibold text-slate-900`}>{p.name || p.policyName || "Policy"}</td>
                        <td className={`${erpTableTdClassName} text-xs text-slate-600`}>{p.type || "—"}</td>
                        <td className={`${erpTableTdClassName} text-xs text-slate-600`}>{p.entitlementPerYear ?? "—"} days</td>
                        <td className={`${erpTableTdClassName} text-xs`}>{p.carryForwardAllowed ? "Yes" : "No"}</td>
                        <td className={`${erpTableTdClassName} text-xs text-slate-600`}>{p.allocationFrequency || "Yearly"}</td>
                        <td className={`${erpTableTdClassName} text-xs`}>{p.autoAllocate ? "Yes" : "No"}</td>
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

      {/* ── Create Policy Drawer ──────────────────────────────────────────── */}
      <SideDrawer open={policyDrawer} onClose={() => setPolicyDrawer(false)} title="New leave policy"
        footer={<ErpDrawerFooter onCancel={() => setPolicyDrawer(false)} onSave={() => void savePolicy()} saving={saving} saveLabel="Create policy" />}
      >
        <div className="space-y-4">
          <div>
            <label className="erp-label">Policy name *</label>
            <input className="erp-input mt-1" value={policyForm.name} onChange={(e) => setPolicyForm({ ...policyForm, name: e.target.value })} placeholder="Casual Leave Policy 2026" />
          </div>
          <div>
            <label className="erp-label">Leave type</label>
            <input className="erp-input mt-1" value={policyForm.type} onChange={(e) => setPolicyForm({ ...policyForm, type: e.target.value })} placeholder="Casual Leave" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="erp-label">Entitlement / year</label>
              <input type="number" min={0} className="erp-input mt-1" value={policyForm.entitlementPerYear} onChange={(e) => setPolicyForm({ ...policyForm, entitlementPerYear: e.target.value })} />
            </div>
            <div>
              <label className="erp-label">Frequency</label>
              <select className="erp-input mt-1" value={policyForm.allocationFrequency} onChange={(e) => setPolicyForm({ ...policyForm, allocationFrequency: e.target.value })}>
                {["Yearly", "Monthly", "Quarterly"].map((f) => <option key={f}>{f}</option>)}
              </select>
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={policyForm.carryForwardAllowed} onChange={(e) => setPolicyForm({ ...policyForm, carryForwardAllowed: e.target.checked })} />
            Allow carry-forward
          </label>
        </div>
      </SideDrawer>

      {/* ── New Leave Request Drawer ──────────────────────────────────────────── */}
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
            <select className="erp-input mt-1" value={requestForm.leavePolicyId} onChange={(e) => setRequestForm({ ...requestForm, leavePolicyId: e.target.value })}>
              <option value="">Select policy</option>
              {policies.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="erp-label">From date *</label>
              <input type="date" className="erp-input mt-1" value={requestForm.fromDate} onChange={(e) => setRequestForm({ ...requestForm, fromDate: e.target.value })} />
            </div>
            <div>
              <label className="erp-label">To date *</label>
              <input type="date" className="erp-input mt-1" value={requestForm.toDate} onChange={(e) => setRequestForm({ ...requestForm, toDate: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="erp-label">Days *</label>
            <input type="number" min={0.5} step={0.5} className="erp-input mt-1" value={requestForm.days} onChange={(e) => setRequestForm({ ...requestForm, days: e.target.value })} />
          </div>
          <div>
            <label className="erp-label">Reason</label>
            <textarea className="erp-input mt-1 min-h-20" value={requestForm.reason} onChange={(e) => setRequestForm({ ...requestForm, reason: e.target.value })} />
          </div>
        </div>
      </SideDrawer>
    </>
  );
}
