"use client";

import { useMemo, useState } from "react";
import { Check, Search, X } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { CrudCard, CrudHeaderStats } from "@/components/erp/crud-workspace";
import { EmptyState } from "@/components/erp/empty-state";
import { StatusBadge } from "@/components/erp/status-badge";
import {
  erpButtonClassName,
  erpFormInputClassName,
  erpFormLabelClassName,
  erpPanelClassName,
} from "@/components/erp/erpStyles";
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

  const { data: raw, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["hrms", "overtime-requests"],
    queryFn: async () => {
      const { data } = await hrmsApi.hrms.overtime.requests.list({ take: 100 });
      return data;
    },
    staleTime: 30_000,
  });

  const requests = useMemo(() => parseOvertimeRequests(raw).map(mapOvertimeRequest), [raw]);

  const filtered = requests.filter((r) => {
    const matchesSearch =
      (r.employeeName || "").toLowerCase().includes(search.toLowerCase()) ||
      r.reason?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !statusFilter || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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

  return (
    <StandardPageLayout
      title="Overtime Requests"
      subtitle="Review, approve, and track extra hours logged by team members."
      eyebrow="HRMS"
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
        <button type="button" onClick={() => void refetch()} className={erpButtonClassName.secondary}>
          Refresh
        </button>
      }
      filters={
        <div className="flex flex-wrap items-end gap-3">
          <div className="relative min-w-[16rem] flex-1 max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search employee or reason…"
              className={`${erpFormInputClassName} pl-9`}
            />
          </div>
          <div>
            <label htmlFor="overtime-status" className={erpFormLabelClassName}>
              Status
            </label>
            <select
              id="overtime-status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={`${erpFormInputClassName} mt-1 min-w-[10rem]`}
            >
              <option value="">All</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        </div>
      }
    >
      {isError && (
        <div className="erp-alert-error text-sm">{getApiErrorMessage(error, "Failed to load overtime requests.")}</div>
      )}

      <CrudCard title="Overtime queue" description="Live overtime requests from the HRMS API.">
        {isLoading ? (
          <div className="erp-loading">Loading requests…</div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No overtime requests found"
            description="Overtime requests will appear here once employees submit extra hours through the HRMS API."
            ctaLabel="Refresh list"
            onClick={() => void refetch()}
          />
        ) : (
          <div className="space-y-3">
            {filtered.map((req) => (
              <article key={req.id} className={`${erpPanelClassName} flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between`}>
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-slate-900">{req.employeeName}</span>
                    <StatusBadge tone={overtimeStatusTone(req.status)}>{req.status}</StatusBadge>
                  </div>
                  <p className="text-xs text-slate-500">
                    Date: {req.date} · Hours: <span className="font-semibold text-slate-800">{req.hours} hrs</span>
                  </p>
                  {req.reason ? <p className="text-xs italic text-slate-600">&ldquo;{req.reason}&rdquo;</p> : null}
                </div>
                {req.status === "Pending" && (
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() => void handleAction(req.id, "Approved")}
                      className={`${erpButtonClassName.secondary} h-8 gap-1 px-2 text-xs text-emerald-700`}
                    >
                      <Check className="h-3.5 w-3.5" /> Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleAction(req.id, "Rejected")}
                      className={`${erpButtonClassName.secondary} h-8 gap-1 px-2 text-xs text-rose-700`}
                    >
                      <X className="h-3.5 w-3.5" /> Reject
                    </button>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </CrudCard>
    </StandardPageLayout>
  );
}
