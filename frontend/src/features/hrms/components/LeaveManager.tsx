"use client";

import { useEffect, useMemo, useState } from "react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { CrudCard, CrudHeaderStats } from "@/components/workspace/crud-workspace";
import {
  ErpApproveRejectButtons,
  ErpRefreshButton,
  ErpTabBar,
  ErpTabPanel,
} from "@/components/workspace/page-kit";
import { useErpListView } from "@/components/workspace/list-view";
import { erpStatusBadgeTone } from "@/components/workspace/styles";
import { hrmsApi } from "@/services/modules";

type TabKey = "policies" | "balances" | "requests" | "approvals" | "holidays" | "allocations" | "types";

const leaveApi = hrmsApi.hrms.leave;

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

  const currentYear = new Date().getFullYear();

  const pendingApprovals = useMemo(
    () => approvals.filter((record) => (record.status || "").toLowerCase() === "pending"),
    [approvals],
  );
  const approvedRequests = useMemo(
    () => requests.filter((record) => (record.status || "").toLowerCase() === "approved").length,
    [requests],
  );
  const leaveBalanceTotal = useMemo(
    () => balances.reduce((sum, record) => sum + Number(record.balance || record.remaining || 0), 0),
    [balances],
  );

  const loadAll = async () => {
    try {
      setLoading(true);
      setError(null);
      const [typesRes, policiesRes, requestsRes, approvalsRes, balancesRes, holidaysRes, allocationsRes] =
        await Promise.all([
          leaveApi.types.list(),
          leaveApi.policies.list(),
          leaveApi.list(1, 50),
          leaveApi.approvals.list("Pending"),
          leaveApi.balances.list(),
          leaveApi.holidays.list(currentYear),
          leaveApi.allocations.list({ year: currentYear }),
        ]);

      setLeaveTypes(typesRes.data || []);
      setPolicies(policiesRes.data || []);
      setRequests(requestsRes.data?.requests ?? requestsRes.data ?? []);
      setApprovals(approvalsRes.data || []);
      setBalances(balancesRes.data || []);
      setHolidays(holidaysRes.data || []);
      setAllocations(allocationsRes.data || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load leave data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAll();
  }, [currentYear]);

  const handleApproveRequest = async (id: string) => {
    setError(null);
    try {
      await leaveApi.approveLeave(id);
      await loadAll();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to approve leave request");
    }
  };

  const handleRejectRequest = async (id: string) => {
    setError(null);
    try {
      await leaveApi.rejectLeave(id);
      await loadAll();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to reject leave request");
    }
  };

  const requestsList = useErpListView({
    listKey: "hrms-leave-requests",
    rows: requests,
    loading: loading && activeTab === "requests",
    emptyMessage: "No leave requests found.",
    getRowId: (row) => String(row.id),
    columns: [
      { key: "employee", label: "Employee" },
      { key: "fromDate", label: "From" },
      { key: "toDate", label: "To" },
      { key: "days", label: "Days", dataType: "number" },
      { key: "status", label: "Status" },
    ],
    onRefresh: () => void loadAll(),
    renderRow: (req) => (
      <>
        <td className="erp-td text-xs font-medium">{req.employeeName || req.employeeId}</td>
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
        <td className="erp-td text-xs text-slate-500">
          {req.fromDate} → {req.toDate}
        </td>
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
    { key: "approvals", label: "Approvals", count: pendingApprovals.length },
    { key: "balances", label: "Balances", count: balances.length },
    { key: "policies", label: "Policies", count: policies.length },
    { key: "types", label: "Types", count: leaveTypes.length },
    { key: "holidays", label: "Holidays", count: holidays.length },
    { key: "allocations", label: "Allocations", count: allocations.length },
  ];

  return (
    <StandardPageLayout
      title="Leave Management"
      subtitle="Leave requests, approvals, balances, policies, types, and annual allocations."
      eyebrow="HRMS / Leave"
      icon="calendar"
      meta={
        <CrudHeaderStats
          items={[
            { label: "Requests", value: requests.length, tone: "info" },
            { label: "Pending", value: pendingApprovals.length, tone: "warning" },
            { label: "Approved", value: approvedRequests, tone: "positive" },
            { label: "Balance", value: leaveBalanceTotal, tone: "info" },
          ]}
        />
      }
      actions={
        <>
          <ErpRefreshButton onClick={() => void loadAll()} loading={loading} />
          {activeTab === "requests" ? requestsList.headerTools : null}
          {activeTab === "approvals" ? approvalsList.headerTools : null}
        </>
      }
      filters={
        activeTab === "requests" ? requestsList.filterBar : activeTab === "approvals" ? approvalsList.filterBar : undefined
      }
    >
      {error ? <div className="erp-alert-error">{error}</div> : null}

      <ErpTabBar tabs={tabItems} active={activeTab} onChange={(key) => setActiveTab(key as TabKey)} />

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
              {balances.map((balance, index) => (
                <div key={balance.id || index} className="rounded-lg border border-slate-200 bg-slate-50/70 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {balance.leaveTypeName || balance.leaveType || "Leave balance"}
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-slate-950">{Number(balance.balance || balance.remaining || 0)}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    Allocated {Number(balance.allocated || 0)} · Used {Number(balance.used || 0)}
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
            <p className="p-4 text-sm text-slate-500">No leave policies configured.</p>
          ) : (
            <div className="grid gap-3 p-4 md:grid-cols-2">
              {policies.map((policy, index) => (
                <div key={policy.id || index} className="rounded-lg border border-slate-200 bg-white p-4">
                  <p className="font-semibold text-slate-900">{policy.name || policy.policyName || "Leave policy"}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {policy.description || `${policy.leaveTypeName || "General"} policy setup`}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CrudCard>
      </ErpTabPanel>

      <ErpTabPanel hidden={activeTab !== "types"}>
        <CrudCard title="Leave types">
          {leaveTypes.length === 0 ? (
            <p className="p-4 text-sm text-slate-500">No leave types configured.</p>
          ) : (
            <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-3">
              {leaveTypes.map((type, index) => (
                <div key={type.id || index} className="rounded-lg border border-slate-200 bg-slate-50/70 p-4">
                  <p className="font-semibold text-slate-900">{type.name || type.leaveTypeName || "Leave type"}</p>
                  <p className="mt-1 text-sm text-slate-500">{type.description || "Configured leave category."}</p>
                </div>
              ))}
            </div>
          )}
        </CrudCard>
      </ErpTabPanel>

      <ErpTabPanel hidden={activeTab !== "holidays"}>
        <CrudCard title={`Holidays ${currentYear}`}>
          {holidays.length === 0 ? (
            <p className="p-4 text-sm text-slate-500">No holidays configured.</p>
          ) : (
            <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-3">
              {holidays.map((holiday, index) => (
                <div key={holiday.id || index} className="rounded-lg border border-slate-200 bg-white p-4">
                  <p className="font-semibold text-slate-900">{holiday.name || holiday.holidayName || "Holiday"}</p>
                  <p className="mt-1 text-sm text-slate-500">{holiday.date || holiday.holidayDate || "—"}</p>
                </div>
              ))}
            </div>
          )}
        </CrudCard>
      </ErpTabPanel>

      <ErpTabPanel hidden={activeTab !== "allocations"}>
        <CrudCard title="Annual allocations">
          {allocations.length === 0 ? (
            <p className="p-4 text-sm text-slate-500">No annual allocations available.</p>
          ) : (
            <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-3">
              {allocations.map((allocation, index) => (
                <div key={allocation.id || index} className="rounded-lg border border-slate-200 bg-slate-50/70 p-4">
                  <p className="font-semibold text-slate-900">{allocation.employeeName || allocation.employeeId || "Allocation"}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {allocation.leaveTypeName || allocation.leaveType || "Leave type"} · {Number(allocation.allocated || 0)} allocated
                  </p>
                </div>
              ))}
            </div>
          )}
        </CrudCard>
      </ErpTabPanel>
    </StandardPageLayout>
  );
}
