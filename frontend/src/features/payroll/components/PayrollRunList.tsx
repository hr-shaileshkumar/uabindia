"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Sparkles } from "lucide-react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { CrudCard, CrudHeaderStats } from "@/components/workspace/crud-workspace";
import { ErpCreateButton, ErpRefreshButton, ErpRowActions } from "@/components/workspace/page-kit";
import { useErpListView } from "@/components/workspace/list-view";
import { ListSearchInput } from "@/components/workspace/list-toolbar";
import { StatusBadge } from "@/components/workspace/status-badge";
import {
  erpButtonClassName,
  erpTableRowHoverClassName,
  erpTableTdClassName,
} from "@/components/workspace/styles";
import { RecordAiDrawer } from "@/components/ai/RecordAiDrawer";
import { PayrollExecutionWizard } from "./PayrollExecutionWizard";
import { getApiErrorMessage } from "@/lib/api-errors";
import { notifyError, notifySuccess } from "@/lib/notifications";
import { payrollApi } from "@/services/modules";
import type { PayrollRunSummary } from "@/types";

type PayrollRunRow = PayrollRunSummary & {
  runDateLabel?: string;
  companyLabel?: string;
};

const formatShortDate = (value?: string) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("en-IN");
};

const runStatusTone = (status?: string | null) => {
  const normalized = (status ?? "").toLowerCase();
  if (normalized === "completed" || normalized === "paid" || normalized === "approved") return "positive" as const;
  if (normalized === "processing" || normalized === "draft") return "warning" as const;
  if (normalized === "cancelled") return "danger" as const;
  return "neutral" as const;
};

export function PayrollRunList() {
  const [search, setSearch] = useState("");
  const [aiRunId, setAiRunId] = useState<string | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: runs = [], isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["payroll", "runs"],
    queryFn: async () => {
      const { data } = await payrollApi.runs.list();
      return (Array.isArray(data) ? data : []) as PayrollRunSummary[];
    },
    staleTime: 30_000,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { data } = await payrollApi.runs.create({
        runDate: new Date().toISOString(),
      });
      return data;
    },
    onSuccess: () => {
      notifySuccess("Draft payroll run created.", "Payroll");
      void queryClient.invalidateQueries({ queryKey: ["payroll", "runs"] });
    },
    onError: (err) => notifyError(getApiErrorMessage(err, "Failed to create payroll run."), "Payroll"),
  });

  const completeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await payrollApi.runs.complete(id);
      return data;
    },
    onSuccess: (data) => {
      const count = data?.payslipsGenerated ?? data?.PayslipsGenerated;
      notifySuccess(
        typeof count === "number"
          ? `Run completed. ${count} payslip(s) generated.`
          : "Payroll run completed.",
        "Payroll",
      );
      void queryClient.invalidateQueries({ queryKey: ["payroll", "runs"] });
      void queryClient.invalidateQueries({ queryKey: ["payroll", "payslips"] });
    },
    onError: (err) => notifyError(getApiErrorMessage(err, "Failed to complete payroll run."), "Payroll"),
  });

  const rows = useMemo<PayrollRunRow[]>(() => {
    const q = search.toLowerCase();
    return runs
      .filter((run) =>
        !q || `${run.id} ${run.status ?? ""} ${run.runDate} ${run.companyId ?? ""}`.toLowerCase().includes(q),
      )
      .map((run) => ({
        ...run,
        runDateLabel: formatShortDate(run.runDate),
        companyLabel: run.companyId ? String(run.companyId) : "Tenant-wide run",
      }));
  }, [runs, search]);

  const approvedCount = runs.filter((r) => {
    const s = (r.status ?? "").toLowerCase();
    return s === "approved" || s === "completed" || s === "paid";
  }).length;

  const handleDownloadBankFile = async (runId: string) => {
    try {
      const response = await payrollApi.runs.bankFile(runId);
      const blob = new Blob([response.data], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `salary-neft-${runId.slice(0, 8)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to download bank file."), "Payroll");
    }
  };

  const list = useErpListView({
    listKey: "payroll-runs",
    rows,
    columns: [
      { key: "runDateLabel", label: "Run date" },
      { key: "status", label: "Status" },
      { key: "id", label: "Run ID" },
      { key: "companyLabel", label: "Company" },
      { key: "actions", label: "Actions", className: "text-right", locked: true },
    ],
    getRowId: (run) => run.id,
    loading: isLoading,
    emptyMessage: "Create a draft run, then complete it to generate payslips.",
    onCreate: () => createMutation.mutate(),
    createLabel: "Process New Run",
    onRefresh: () => void refetch(),
    extraFilters: (
      <ListSearchInput value={search} onChange={setSearch} placeholder="Search runs by date, status, or ID…" />
    ),
    renderRow: (run) => {
      const isDraft = (run.status ?? "Draft").toLowerCase() === "draft";
      return (
        <tr key={run.id} className={erpTableRowHoverClassName}>
          <td className={`${erpTableTdClassName} font-semibold text-slate-900`}>{run.runDateLabel}</td>
          <td className={erpTableTdClassName}>
            <StatusBadge tone={runStatusTone(run.status)}>{run.status?.trim() || "Draft"}</StatusBadge>
          </td>
          <td className={`${erpTableTdClassName} text-xs text-slate-500`}>{run.id.slice(0, 8)}…</td>
          <td className={erpTableTdClassName}>{run.companyLabel}</td>
          <td className={`${erpTableTdClassName} text-right`}>
            <ErpRowActions
              extra={
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    title="Ask AI"
                    className={`${erpButtonClassName.secondary} h-8 gap-1.5 px-2 text-xs`}
                    onClick={() => setAiRunId(run.id)}
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    AI
                  </button>
                  {isDraft ? (
                    <button
                      type="button"
                      title="Complete run"
                      className={`${erpButtonClassName.primary} h-8 gap-1.5 px-2 text-xs`}
                      disabled={completeMutation.isPending}
                      onClick={() => completeMutation.mutate(run.id)}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Complete
                    </button>
                  ) : (
                    <button
                      type="button"
                      title="Download NEFT file"
                      className={`${erpButtonClassName.secondary} h-8 px-2 text-xs`}
                      onClick={() => void handleDownloadBankFile(run.id)}
                    >
                      NEFT
                    </button>
                  )}
                </div>
              }
            />
          </td>
        </tr>
      );
    },
  });

  return (
    <StandardPageLayout
      title="Payroll Execution Runs"
      subtitle="Initiate, review, approve, and finalize monthly salary processing runs."
      eyebrow="Payroll / Runs"
      icon="bank"
      meta={
        <CrudHeaderStats
          items={[
            { label: "Runs", value: runs.length, helper: "execution" },
            { label: "Completed", value: approvedCount, tone: "positive" },
            { label: "In Progress", value: runs.length - approvedCount, tone: "warning" },
          ]}
        />
      }
      actions={
        <>
          <ErpRefreshButton onClick={() => void refetch()} loading={isLoading || isFetching} />
          {list.headerTools}
          <button
            type="button"
            onClick={() => setWizardOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-500"
          >
            <Sparkles className="h-4 w-4" />
            Launch 10-Step Payroll Wizard
          </button>
        </>
      }
      filters={list.filterBar}
    >
      {isError ? (
        <div className="erp-alert-error text-sm">{getApiErrorMessage(error, "Failed to load payroll runs.")}</div>
      ) : null}

      <CrudCard>{list.table}</CrudCard>

      {wizardOpen && (
        <PayrollExecutionWizard
          onClose={() => setWizardOpen(false)}
          onComplete={() => {
            void queryClient.invalidateQueries({ queryKey: ["payroll", "runs"] });
            void refetch();
          }}
        />
      )}

      <RecordAiDrawer
        open={Boolean(aiRunId)}
        onClose={() => setAiRunId(null)}
        recordType="payrollrun"
        recordId={aiRunId ?? ""}
        title="Ask AI · Payroll run"
        suggestedPrompt="Summarize this payroll run and payslip coverage."
      />
    </StandardPageLayout>
  );
}
