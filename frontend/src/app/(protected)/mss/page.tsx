"use client";

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
};

export default function MssPage() {
  const queryClient = useQueryClient();
  const { data, isLoading, isError, error, refetch } = useMssDashboard();
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
      label: `${item.employeeName ?? "Employee"} · ${item.leaveType ?? "Leave"}`,
      kind: "Leave approval" as const,
      date: item.startDate,
    }));
    return [...workflow, ...leave];
  }, [data?.leaveApprovals, data?.workflowApprovals]);

  const filtered = pendingItems.filter((item) => {
    const q = search.toLowerCase();
    return !q || item.label.toLowerCase().includes(q) || item.kind.toLowerCase().includes(q);
  });

  return (
    <StandardPageLayout
      title="Manager Self-Service"
      subtitle="Approve or reject leave requests and workflow approvals from your team."
      eyebrow="People / My Team"
      icon="users"
      meta={
        <HeaderSummary
          items={[
            { label: "Team Size", value: data?.stats?.activeEmployees ?? 0, tone: "default" },
            {
              label: "Pending",
              value: data?.stats?.pendingLeaves ?? pendingItems.length,
              tone: "warning",
            },
            { label: "Present Today", value: data?.stats?.presentToday ?? 0, tone: "success" },
          ]}
        />
      }
      actions={
        <>
          <Link href={ROUTES.APPROVALS} className={erpButtonClassName.secondary}>
            All approvals
          </Link>
          <ErpRefreshButton onClick={() => void refetch()} loading={isLoading} />
        </>
      }
      filters={<ErpSearchFilter value={search} onChange={setSearch} placeholder="Filter pending approval…" />}
    >
      {isError && (
        <div className="erp-alert-error">{getApiErrorMessage(error, "Failed to load manager dashboard.")}</div>
      )}

      <CrudCard>
        <div className="erp-table-wrap">
          <table className="erp-table table-auto">
            <thead className="erp-thead">
              <tr>
                <th className="erp-th">Pending item</th>
                <th className="erp-th">Type</th>
                <th className="erp-th">Date</th>
                <th className="erp-th text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="erp-td py-8 text-center text-xs text-slate-500">
                    Loading…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="erp-td py-8 text-center text-xs text-slate-500">
                    No pending manager actions.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={`${item.kind}-${item.id}`} className="erp-tr">
                    <td className="erp-td">
                      <div className="erp-row-title">{item.label}</div>
                    </td>
                    <td className="erp-td">
                      <span className="erp-chip">{item.kind}</span>
                    </td>
                    <td className="erp-td text-xs text-slate-500">
                      {item.date ? new Date(item.date).toLocaleDateString("en-IN") : "—"}
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
    </StandardPageLayout>
  );
}
