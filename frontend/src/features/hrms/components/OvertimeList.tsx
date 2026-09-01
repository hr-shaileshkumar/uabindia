"use client";

import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { CrudCard, CrudHeaderStats } from "@/components/workspace/crud-workspace";
import { ErpApproveRejectButtons, ErpRefreshButton, ErpRowActions } from "@/components/workspace/page-kit";
import { useErpListView } from "@/components/workspace/list-view";
import { ListSearchInput, ListStatusFilter } from "@/components/workspace/list-toolbar";
import { StatusBadge } from "@/components/workspace/status-badge";
import { erpTableRowHoverClassName, erpTableTdClassName } from "@/components/workspace/styles";
import { getApiErrorMessage } from "@/lib/api-errors";
import { hrmsApi } from "@/services/modules";
import type { OvertimeRequest } from "@/types";

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

const parseOvertimeRequests = (raw: unknown): OvertimeRecord[] => {
  if (Array.isArray(raw)) return raw as OvertimeRecord[];
  if (raw && typeof raw === "object") {
    const obj = raw as { requests?: OvertimeRecord[]; data?: OvertimeRecord[] };
    return obj.requests ?? obj.data ?? [];
  }
  return [];
};

const normalizeStatus = (status?: string): OvertimeRequest["status"] => {
  const value = (status ?? "Pending").toLowerCase();
  if (value.includes("approve")) return "Approved";
  if (value.includes("reject")) return "Rejected";
  return "Pending";
};

const mapOvertimeRequest = (record: OvertimeRecord): OvertimeRequest => {
  const fallbackName = `${record.employee?.firstName ?? ""} ${record.employee?.lastName ?? ""}`.trim();
  const employeeName =
    record.employeeName ?? record.employee?.fullName ?? (fallbackName.length > 0 ? fallbackName : "Employee");

  return {
    id: record.id,
    employeeId: record.employeeId ?? "",
    employeeName,
    date: record.date ?? record.overtimeDate ?? "—",
    hours: record.hours ?? record.overtimeHours ?? 0,
    reason: record.reason,
    status: normalizeStatus(record.status),
  };
};

const overtimeStatusTone = (status: string) => {
  if (status === "Approved") return "positive" as const;
  if (status === "Pending") return "warning" as const;
  return "neutral" as const;
};

export function OvertimeList() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const queryClient = useQueryClient();

  const { data: raw, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["hrms", "overtime-requests"],
    queryFn: async () => {
      const { data } = await hrmsApi.hrms.overtime.requests.list({ take: 100 });
      return data;
    },
    staleTime: 30_000,
  });

  const requests = useMemo(() => parseOvertimeRequests(raw).map(mapOvertimeRequest), [raw]);

  const filtered = useMemo(
    () =>
      requests.filter((r) => {
        const matchesSearch =
          (r.employeeName || "").toLowerCase().includes(search.toLowerCase()) ||
          r.reason?.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = !statusFilter || r.status === statusFilter;
        return matchesSearch && matchesStatus;
      }),
    [requests, search, statusFilter],
  );

  const handleAction = async (id: string, newStatus: "Approved" | "Rejected") => {
    try {
      await hrmsApi.hrms.overtime.approvals.create({
        overtimeRequestId: id,
        status: newStatus,
      });
      await queryClient.invalidateQueries({ queryKey: ["hrms", "overtime-requests"] });
    } catch {
      // Keep UI stable; user can refresh if approval fails.
    }
  };

  const list = useErpListView({
    listKey: "hrms-overtime",
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
    loading: isLoading,
    emptyMessage: "Overtime requests will appear here once employees submit extra hours through the HRMS API.",
    onRefresh: () => void refetch(),
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
        <td className={`${erpTableTdClassName} text-xs italic text-slate-600`}>{req.reason ? `"${req.reason}"` : "—"}</td>
        <td className={erpTableTdClassName}>
          <StatusBadge tone={overtimeStatusTone(req.status)}>{req.status}</StatusBadge>
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

  return (
    <StandardPageLayout
      title="Overtime Requests"
      subtitle="Review, approve, and track extra hours logged by team members."
      eyebrow="HRMS / Overtime"
      icon="clock"
      meta={
        <CrudHeaderStats
          items={[
            { label: "Pending", value: requests.filter((r) => r.status === "Pending").length, tone: "warning" },
            { label: "Approved", value: requests.filter((r) => r.status === "Approved").length, tone: "positive" },
            { label: "Total", value: requests.length, tone: "info" },
          ]}
        />
      }
      actions={
        <>
          <ErpRefreshButton onClick={() => void refetch()} loading={isLoading || isFetching} />
          {list.headerTools}
        </>
      }
      filters={list.filterBar}
    >
      {isError ? (
        <div className="erp-alert-error text-sm">{getApiErrorMessage(error, "Failed to load overtime requests.")}</div>
      ) : null}

      <CrudCard>{list.table}</CrudCard>
    </StandardPageLayout>
  );
}
