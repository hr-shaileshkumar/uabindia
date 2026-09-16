"use client";

import { DynamicPage } from "@/components/dynamic/DynamicPage";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import HeaderSummary from "@/components/layout/HeaderSummary";
import { ErpApproveRejectButtons, ErpRefreshButton, ErpSearchFilter } from "@/components/workspace/page-kit";
import { CrudCard } from "@/components/workspace/crud-workspace";
import { erpButtonClassName } from "@/components/workspace/styles";
import { getApiErrorMessage } from "@/lib/api-errors";
import { notifyError, notifySuccess } from "@/lib/notifications";
import { appApi, hrmsApi } from "@/services/modules";
import { useMssDashboard, mssDashboardQueryKey } from "@/features/hrms/hooks/useMssDashboard";
import { ROUTES } from "@/constants/routes";

type QueueItem = {
  id: string;
  label: string;
  kind: "Leave approval" | "Workflow approval";
  date?: string;
  days?: number;
  reason?: string;
  employeeName?: string;
};

function LegacyManagerSelfServicePage() {
  const queryClient = useQueryClient();
  const { data, isLoading, isError, error, refetch } = useMssDashboard();
  const [activeTab, setActiveTab] = useState<"attendance" | "approvals">("attendance");
  const [search, setSearch] = useState("");

  const decideLeave = useMutation({
    mutationFn: async ({ id, approve }: { id: string; approve: boolean }) => {
      if (approve) await hrmsApi.hrms.leave.approveLeave(id);
      else await hrmsApi.hrms.leave.rejectLeave(id);
    },
    onSuccess: (_, vars) => {
      notifySuccess(vars.approve ? "Leave approved." : "Leave rejected.");
      void queryClient.invalidateQueries({ queryKey: mssDashboardQueryKey });
    },
    onError: (err) => notifyError(getApiErrorMessage(err, "Could not update leave.")),
  });

  const decideWorkflow = useMutation({
    mutationFn: async ({ id, approve }: { id: string; approve: boolean }) => {
      if (approve) await appApi.approvals.approve(id, {});
      else await appApi.approvals.reject(id, {});
    },
    onSuccess: (_, vars) => {
      notifySuccess(vars.approve ? "Request approved." : "Request rejected.");
      void queryClient.invalidateQueries({ queryKey: mssDashboardQueryKey });
    },
    onError: (err) => notifyError(getApiErrorMessage(err, "Could not update approval.")),
  });

  const pendingItems: QueueItem[] = useMemo(() => {
    const workflow = (data?.workflowApprovals ?? []).map((item) => ({
      id: item.id,
      label: `${item.moduleKey ?? "Workflow"} · ${item.entityType ?? "Request"}`,
      kind: "Workflow approval" as const,
      date: item.requestedAt,
    }));
    const leave = (data?.leaveApprovals ?? []).map((item, index) => ({
      id: item.id ?? `leave-${index}`,
      label: `${item.employeeName ?? "Team Member"} · ${item.leaveType ?? "Leave"} (${item.days ?? 1}d)`,
      kind: "Leave approval" as const,
      date: item.startDate,
      days: item.days,
      reason: item.reason,
      employeeName: item.employeeName,
    }));
    return [...workflow, ...leave];
  }, [data?.leaveApprovals, data?.workflowApprovals]);

  const filteredApprovals = pendingItems.filter((item) => {
    const q = search.toLowerCase();
    return (
      !q ||
      item.label.toLowerCase().includes(q) ||
      item.kind.toLowerCase().includes(q) ||
      (item.reason && item.reason.toLowerCase().includes(q))
    );
  });

  const filteredMembers = useMemo(() => {
    const list = data?.teamMembers ?? [];
    const q = search.toLowerCase();
    if (!q) return list;
    return list.filter(
      (m) =>
        m.fullName.toLowerCase().includes(q) ||
        (m.employeeCode && m.employeeCode.toLowerCase().includes(q)) ||
        (m.designation && m.designation.toLowerCase().includes(q)) ||
        (m.department && m.department.toLowerCase().includes(q))
    );
  }, [data?.teamMembers, search]);

  const stats = data?.teamStats;

  return (
    <StandardPageLayout
      title="Manager Self-Service & My Team"
      subtitle={`Welcome, ${data?.managerInfo?.name ?? "Manager"}. Monitor your direct reports, live attendance, and approve team requests.`}
      eyebrow="People / Hierarchy Portal"
      icon="users"
      meta={
        <HeaderSummary
          items={[
            { label: "Total Team", value: stats?.total ?? 0, tone: "default" },
            { label: "Present Today", value: stats?.presentToday ?? 0, tone: "success" },
            { label: "On Leave", value: stats?.onLeaveToday ?? 0, tone: "warning" },
            {
              label: "Pending Approvals",
              value: stats?.pendingApprovals ?? pendingItems.length,
              tone: (stats?.pendingApprovals ?? pendingItems.length) > 0 ? "danger" : "default",
            },
          ]}
        />
      }
      actions={
        <>
          <Link href="/hrms/org-chart" className={erpButtonClassName.secondary}>
            View Org Chart
          </Link>
          <Link href={ROUTES.APPROVALS} className={erpButtonClassName.secondary}>
            All Approvals
          </Link>
          <ErpRefreshButton onClick={() => void refetch()} loading={isLoading} />
        </>
      }
      filters={
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 w-full">
          <div className="flex space-x-1 border border-slate-700/50 p-1 rounded-lg bg-slate-900/60">
            <button
              onClick={() => setActiveTab("attendance")}
              className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${
                activeTab === "attendance"
                  ? "bg-indigo-600 text-white shadow-sm shadow-indigo-500/20"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Team Directory & Attendance ({data?.teamMembers?.length ?? 0})
            </button>
            <button
              onClick={() => setActiveTab("approvals")}
              className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center space-x-1.5 ${
                activeTab === "approvals"
                  ? "bg-indigo-600 text-white shadow-sm shadow-indigo-500/20"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <span>Pending Approvals</span>
              {pendingItems.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-rose-500 text-white font-bold">
                  {pendingItems.length}
                </span>
              )}
            </button>
          </div>
          <div className="w-full sm:w-64">
            <ErpSearchFilter
              value={search}
              onChange={setSearch}
              placeholder={activeTab === "attendance" ? "Search team member…" : "Filter approvals…"}
            />
          </div>
        </div>
      }
    >
      {isError && (
        <div className="erp-alert-error">{getApiErrorMessage(error, "Failed to load manager dashboard.")}</div>
      )}

      {activeTab === "attendance" ? (
        <CrudCard>
          <div className="p-4 border-b border-slate-700/40 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-100">Direct Reports Directory</h3>
              <p className="text-xs text-slate-400">Live attendance check-ins and member contact details for today.</p>
            </div>
            <div className="text-xs text-slate-400">
              <span className="text-emerald-400 font-semibold">{stats?.presentToday ?? 0}</span> Present ·{" "}
              <span className="text-amber-400 font-semibold">{stats?.onLeaveToday ?? 0}</span> Leave ·{" "}
              <span className="text-slate-400 font-semibold">{stats?.notCheckedInToday ?? 0}</span> Not checked in
            </div>
          </div>

          <div className="erp-table-wrap">
            <table className="erp-table table-auto">
              <thead className="erp-thead">
                <tr>
                  <th className="erp-th">Employee</th>
                  <th className="erp-th">Department & Role</th>
                  <th className="erp-th">Today Status</th>
                  <th className="erp-th">Contact</th>
                  <th className="erp-th text-right">Leave Balance</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="erp-td py-8 text-center text-xs text-slate-500">
                      Loading team directory…
                    </td>
                  </tr>
                ) : filteredMembers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="erp-td py-8 text-center text-xs text-slate-500">
                      No direct reports found.
                    </td>
                  </tr>
                ) : (
                  filteredMembers.map((emp) => (
                    <tr key={emp.id} className="erp-tr hover:bg-slate-800/40 transition-colors">
                      <td className="erp-td">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white text-xs font-bold shadow-sm shadow-indigo-500/20">
                            {emp.fullName
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .slice(0, 2)
                              .toUpperCase()}
                          </div>
                          <div>
                            <div className="erp-row-title font-medium text-slate-200">{emp.fullName}</div>
                            <div className="text-[11px] text-slate-400">{emp.employeeCode || "—"}</div>
                          </div>
                        </div>
                      </td>
                      <td className="erp-td">
                        <div className="text-xs text-slate-300 font-medium">{emp.designation || "Specialist"}</div>
                        <div className="text-[11px] text-slate-400">{emp.department || "General"}</div>
                      </td>
                      <td className="erp-td">
                        {emp.todayAttendanceStatus === "Present" ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-950/70 text-emerald-300 border border-emerald-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse" />
                            Present {emp.firstPunchInTime ? `@ ${emp.firstPunchInTime}` : ""}
                          </span>
                        ) : emp.todayAttendanceStatus === "On Leave" ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-950/70 text-amber-300 border border-amber-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mr-1.5" />
                            On Leave
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700/50">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-500 mr-1.5" />
                            Not Checked In
                          </span>
                        )}
                      </td>
                      <td className="erp-td">
                        <div className="text-xs text-slate-300">{emp.workEmail || "—"}</div>
                        <div className="text-[11px] text-slate-400">{emp.phone || "—"}</div>
                      </td>
                      <td className="erp-td text-right">
                        <span className="text-xs font-bold text-indigo-300 bg-indigo-950/60 border border-indigo-500/30 px-2.5 py-1 rounded-md">
                          {emp.leaveBalance} days
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CrudCard>
      ) : (
        <CrudCard>
          <div className="p-4 border-b border-slate-700/40">
            <h3 className="text-sm font-semibold text-slate-100">Pending Approvals from Direct Reports</h3>
            <p className="text-xs text-slate-400">Review and approve team leave applications and workflow tasks.</p>
          </div>

          <div className="erp-table-wrap">
            <table className="erp-table table-auto">
              <thead className="erp-thead">
                <tr>
                  <th className="erp-th">Pending item</th>
                  <th className="erp-th">Type</th>
                  <th className="erp-th">Date & Duration</th>
                  <th className="erp-th text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="erp-td py-8 text-center text-xs text-slate-500">
                      Loading approvals…
                    </td>
                  </tr>
                ) : filteredApprovals.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="erp-td py-8 text-center text-xs text-slate-500">
                      No pending approval actions for your team.
                    </td>
                  </tr>
                ) : (
                  filteredApprovals.map((item) => (
                    <tr key={`${item.kind}-${item.id}`} className="erp-tr">
                      <td className="erp-td">
                        <div className="erp-row-title font-medium text-slate-200">{item.label}</div>
                        {item.reason && <div className="text-xs text-slate-400 mt-0.5 italic">"{item.reason}"</div>}
                      </td>
                      <td className="erp-td">
                        <span className="erp-chip">{item.kind}</span>
                      </td>
                      <td className="erp-td text-xs text-slate-400">
                        {item.date ? new Date(item.date).toLocaleDateString("en-IN") : "—"}
                        {item.days ? ` · ${item.days} day(s)` : ""}
                      </td>
                      <td className="erp-td">
                        <div className="flex justify-end">
                          <ErpApproveRejectButtons
                            disabled={decideLeave.isPending || decideWorkflow.isPending}
                            onApprove={() =>
                              item.kind === "Leave approval"
                                ? decideLeave.mutate({ id: item.id, approve: true })
                                : decideWorkflow.mutate({ id: item.id, approve: true })
                            }
                            onReject={() =>
                              item.kind === "Leave approval"
                                ? decideLeave.mutate({ id: item.id, approve: false })
                                : decideWorkflow.mutate({ id: item.id, approve: false })
                            }
                          />
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CrudCard>
      )}
    </StandardPageLayout>
  );
}

export default function ManagerSelfServicePage() {
  return (
    <DynamicPage
      pageKey="manager-self-service"
      fallback={<LegacyManagerSelfServicePage />}
      renderMode="auto"
    />
  );
}
