"use client";

import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Clock, BarChart2, ClipboardList } from "lucide-react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { CrudCard, CrudHeaderStats } from "@/components/workspace/crud-workspace";
import {
  ErpApproveRejectButtons,
  ErpRefreshButton,
  ErpRowActions,
  ErpTabBar,
  ErpTabPanel,
} from "@/components/workspace/page-kit";
import { useErpListView } from "@/components/workspace/list-view";
import { ListSearchInput, ListStatusFilter } from "@/components/workspace/list-toolbar";
import { StatusBadge } from "@/components/workspace/status-badge";
import { erpTableRowHoverClassName, erpTableTdClassName } from "@/components/workspace/styles";
import { getApiErrorMessage } from "@/lib/api-errors";
import { hrmsApi } from "@/services/modules";
import type { OvertimeRequest } from "@/types";

type TabKey = "requests" | "logs" | "pending";

type OvertimeRecord = {
  id: string;
  employeeId?: string;
  employeeName?: string;
  employee?: { fullName?: string; firstName?: string; lastName?: string };
  date?: string;
  overtimeDate?: string;
  hours?: number;
  overtimeHours?: number;
  reason?: string;
  status?: string;
};

type OvertimeLog = {
  id: string;
  employeeId?: string;
  employeeName?: string;
  date?: string;
  hours?: number;
  overtimeHours?: number;
  rate?: number;
  amount?: number;
  isProcessed?: boolean;
};

const parseRequests = (raw: unknown): OvertimeRecord[] => {
  if (Array.isArray(raw)) return raw as OvertimeRecord[];
  if (raw && typeof raw === "object") {
    const obj = raw as { requests?: OvertimeRecord[]; data?: OvertimeRecord[] };
    return obj.requests ?? obj.data ?? [];
  }
  return [];
};

const parseLogs = (raw: unknown): OvertimeLog[] => {
  if (Array.isArray(raw)) return raw as OvertimeLog[];
  if (raw && typeof raw === "object") {
    const obj = raw as { logs?: OvertimeLog[]; data?: OvertimeLog[] };
    return obj.logs ?? obj.data ?? [];
  }
  return [];
};

const normalizeStatus = (status?: string): OvertimeRequest["status"] => {
  const value = (status ?? "Pending").toLowerCase();
  if (value.includes("approve")) return "Approved";
  if (value.includes("reject")) return "Rejected";
  return "Pending";
};

const mapRequest = (record: OvertimeRecord): OvertimeRequest => {
  const fallback = `${record.employee?.firstName ?? ""} ${record.employee?.lastName ?? ""}`.trim();
  return {
    id: record.id,
    employeeId: record.employeeId ?? "",
    employeeName: record.employeeName ?? record.employee?.fullName ?? (fallback || "Employee"),
    date: record.date ?? record.overtimeDate ?? "—",
    hours: record.hours ?? record.overtimeHours ?? 0,
    reason: record.reason,
    status: normalizeStatus(record.status),
  };
};

const overtimeTone = (status: string) => {
  if (status === "Approved") return "positive" as const;
  if (status === "Pending") return "warning" as const;
  return "neutral" as const;
};

export function OvertimeList() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [activeTab, setActiveTab] = useState<TabKey>("requests");
  const queryClient = useQueryClient();

  const {
    data: rawRequests,
    isLoading: loadingRequests,
    isError: isErrorRequests,
    error: errorRequests,
    refetch: refetchRequests,
    isFetching: fetchingRequests,
  } = useQuery({
    queryKey: ["hrms", "overtime-requests"],
    queryFn: async () => {
      const { data } = await hrmsApi.hrms.overtime.requests.list({ take: 200 });
      return data;
    },
    staleTime: 30_000,
  });

  const {
    data: rawLogs,
    isLoading: loadingLogs,
    refetch: refetchLogs,
    isFetching: fetchingLogs,
  } = useQuery({
    queryKey: ["hrms", "overtime-logs"],
    queryFn: async () => {
      const { data } = await hrmsApi.hrms.overtime.logs.list({ take: 200 });
      return data;
    },
    staleTime: 30_000,
    enabled: activeTab === "logs",
  });

  const {
    data: rawPending,
    isLoading: loadingPending,
    refetch: refetchPending,
    isFetching: fetchingPending,
  } = useQuery({
    queryKey: ["hrms", "overtime-pending"],
    queryFn: async () => {
      const { data } = await hrmsApi.hrms.overtime.requests.pending();
      return data;
    },
    staleTime: 30_000,
    enabled: activeTab === "pending",
  });

  const requests = useMemo(() => parseRequests(rawRequests).map(mapRequest), [rawRequests]);
  const logs = useMemo(() => parseLogs(rawLogs), [rawLogs]);
  const pendingRequests = useMemo(() => parseRequests(rawPending).map(mapRequest), [rawPending]);

  const filtered = useMemo(
    () =>
      requests.filter((r) => {
        const matchSearch = (r.employeeName || "").toLowerCase().includes(search.toLowerCase())
          || r.reason?.toLowerCase().includes(search.toLowerCase());
        const matchStatus = !statusFilter || r.status === statusFilter;
        return matchSearch && matchStatus;
      }),
    [requests, search, statusFilter],
  );

  const handleAction = async (id: string, newStatus: "Approved" | "Rejected") => {
    try {
      await hrmsApi.hrms.overtime.approvals.create({ overtimeRequestId: id, status: newStatus });
      await queryClient.invalidateQueries({ queryKey: ["hrms", "overtime-requests"] });
      await queryClient.invalidateQueries({ queryKey: ["hrms", "overtime-pending"] });
    } catch {
      // Silent — user can refresh
    }
  };

  const isLoading = activeTab === "requests" ? loadingRequests : activeTab === "logs" ? loadingLogs : loadingPending;
  const isFetching = activeTab === "requests" ? fetchingRequests : activeTab === "logs" ? fetchingLogs : fetchingPending;

  const handleRefresh = () => {
    if (activeTab === "requests") void refetchRequests();
    else if (activeTab === "logs") void refetchLogs();
    else void refetchPending();
  };

  const requestsList = useErpListView({
    listKey: "hrms-overtime-requests",
    rows: filtered,
    columns: [
      { key: "employeeName", label: "Employee" },
      { key: "date", label: "Date" },
      { key: "hours", label: "Hours" },
      { key: "reason", label: "Reason" },
      { key: "status", label: "Status" },
      { key: "actions", label: "Actions", className: "text-right", locked: true },
    ],
    getRowId: (req) => req.id,
    loading: loadingRequests,
    emptyMessage: "No overtime requests. Employees submit extra hours through the ESS portal.",
    onRefresh: () => void refetchRequests(),
    extraFilters: (
      <>
        <ListSearchInput value={search} onChange={setSearch} placeholder="Search employee or reason…" />
        <ListStatusFilter
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { label: "All statuses", value: "" },
            { label: "Pending", value: "Pending" },
            { label: "Approved", value: "Approved" },
            { label: "Rejected", value: "Rejected" },
          ]}
        />
      </>
    ),
    renderRow: (req) => (
      <tr key={req.id} className={erpTableRowHoverClassName}>
        <td className={`${erpTableTdClassName} font-semibold text-slate-900`}>{req.employeeName}</td>
        <td className={erpTableTdClassName}>{req.date}</td>
        <td className={erpTableTdClassName}>{req.hours} hrs</td>
        <td className={`${erpTableTdClassName} text-xs italic text-slate-600`}>
          {req.reason ? `"${req.reason}"` : "—"}
        </td>
        <td className={erpTableTdClassName}>
          <StatusBadge tone={overtimeTone(req.status)}>{req.status}</StatusBadge>
        </td>
        <td className={`${erpTableTdClassName} text-right`}>
          <ErpRowActions
            extra={
              req.status === "Pending" ? (
                <ErpApproveRejectButtons
                  onApprove={() => void handleAction(req.id, "Approved")}
                  onReject={() => void handleAction(req.id, "Rejected")}
                />
              ) : null
            }
          />
        </td>
      </tr>
    ),
  });

  const totalApprovedHrs = requests.filter((r) => r.status === "Approved").reduce((s, r) => s + r.hours, 0);
  const totalProcessedLogs = logs.filter((l) => l.isProcessed).length;

  const tabs = [
    { key: "requests" as TabKey, label: "Requests", count: requests.length, icon: ClipboardList },
    { key: "pending" as TabKey, label: "Pending approval", count: pendingRequests.length, icon: Clock },
    { key: "logs" as TabKey, label: "OT Logs", count: logs.length, icon: BarChart2 },
  ];

  return (
    <StandardPageLayout
      title="Overtime Management"
      subtitle="Review, approve, and track extra hours. Monitor logged overtime and process payments."
      eyebrow="HRMS / Overtime"
      icon="clock"
      meta={
        <CrudHeaderStats
          items={[
            { label: "Pending", value: requests.filter((r) => r.status === "Pending").length, tone: "warning" },
            { label: "Approved", value: requests.filter((r) => r.status === "Approved").length, tone: "positive" },
            { label: "Approved hrs", value: `${totalApprovedHrs} hrs`, tone: "info" },
            { label: "OT logs", value: logs.length, tone: "neutral" },
          ]}
        />
      }
      actions={
        <>
          <ErpRefreshButton onClick={handleRefresh} loading={isLoading || isFetching} />
          {activeTab === "requests" && requestsList.headerTools}
        </>
      }
      filters={activeTab === "requests" ? requestsList.filterBar : undefined}
    >
      {isErrorRequests && (
        <div className="erp-alert-error text-sm mb-3">
          {getApiErrorMessage(errorRequests, "Failed to load overtime requests.")}
        </div>
      )}

      <ErpTabBar
        tabs={tabs.map((t) => ({ key: t.key, label: t.label, count: t.count }))}
        active={activeTab}
        onChange={(k) => setActiveTab(k as TabKey)}
      />

      {/* Requests Tab */}
      <ErpTabPanel hidden={activeTab !== "requests"}>
        <CrudCard>{requestsList.table}</CrudCard>
      </ErpTabPanel>

      {/* Pending Approvals Tab */}
      <ErpTabPanel hidden={activeTab !== "pending"}>
        <CrudCard title="Pending approvals">
          {loadingPending ? (
            <p className="p-4 text-sm text-slate-500">Loading…</p>
          ) : pendingRequests.length === 0 ? (
            <p className="p-4 text-sm text-slate-500">No pending overtime requests.</p>
          ) : (
            <div className="erp-table-wrap">
              <table className="erp-table">
                <thead className="erp-thead">
                  <tr>
                    {["Employee", "Date", "Hours", "Reason", "Actions"].map((h) => (
                      <th key={h} className="erp-th">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pendingRequests.map((req) => (
                    <tr key={req.id} className={erpTableRowHoverClassName}>
                      <td className={`${erpTableTdClassName} font-semibold text-slate-900`}>{req.employeeName}</td>
                      <td className={erpTableTdClassName}>{req.date}</td>
                      <td className={erpTableTdClassName}>{req.hours} hrs</td>
                      <td className={`${erpTableTdClassName} text-xs italic text-slate-600`}>
                        {req.reason ? `"${req.reason}"` : "—"}
                      </td>
                      <td className={`${erpTableTdClassName} text-right`}>
                        <ErpApproveRejectButtons
                          onApprove={() => void handleAction(req.id, "Approved")}
                          onReject={() => void handleAction(req.id, "Rejected")}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CrudCard>
      </ErpTabPanel>

      {/* OT Logs Tab */}
      <ErpTabPanel hidden={activeTab !== "logs"}>
        <CrudCard title="Overtime logs">
          {loadingLogs ? (
            <p className="p-4 text-sm text-slate-500">Loading logs…</p>
          ) : logs.length === 0 ? (
            <p className="p-4 text-sm text-slate-500">No overtime logs yet. Logs are created when approved requests are processed.</p>
          ) : (
            <>
              {/* Summary bar */}
              <div className="flex gap-4 border-b border-slate-100 px-4 py-3">
                <div className="text-center">
                  <p className="text-xs text-slate-500">Total logs</p>
                  <p className="text-lg font-bold text-slate-900">{logs.length}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-slate-500">Processed</p>
                  <p className="text-lg font-bold text-emerald-700">{totalProcessedLogs}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-slate-500">Unprocessed</p>
                  <p className="text-lg font-bold text-amber-600">{logs.length - totalProcessedLogs}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-slate-500">Total hours</p>
                  <p className="text-lg font-bold text-indigo-700">
                    {logs.reduce((s, l) => s + (l.hours ?? l.overtimeHours ?? 0), 0)} hrs
                  </p>
                </div>
              </div>
              <div className="erp-table-wrap">
                <table className="erp-table">
                  <thead className="erp-thead">
                    <tr>
                      {["Employee", "Date", "Hours", "Rate", "Amount", "Processed"].map((h) => (
                        <th key={h} className="erp-th">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log, idx) => (
                      <tr key={log.id ?? idx} className={erpTableRowHoverClassName}>
                        <td className={`${erpTableTdClassName} font-semibold text-slate-900`}>{log.employeeName || log.employeeId || "—"}</td>
                        <td className={erpTableTdClassName}>{log.date ?? "—"}</td>
                        <td className={erpTableTdClassName}>{log.hours ?? log.overtimeHours ?? 0} hrs</td>
                        <td className={`${erpTableTdClassName} text-slate-600`}>
                          {log.rate != null ? `₹${log.rate.toLocaleString("en-IN")}` : "—"}
                        </td>
                        <td className={`${erpTableTdClassName} font-semibold text-emerald-700`}>
                          {log.amount != null ? `₹${log.amount.toLocaleString("en-IN")}` : "—"}
                        </td>
                        <td className={erpTableTdClassName}>
                          <StatusBadge tone={log.isProcessed ? "positive" : "warning"}>
                            {log.isProcessed ? "Processed" : "Pending"}
                          </StatusBadge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CrudCard>
      </ErpTabPanel>
    </StandardPageLayout>
  );
}
