"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Play, Search, Sparkles } from "lucide-react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { CrudCard, CrudHeaderStats } from "@/components/erp/crud-workspace";
import { StatusBadge } from "@/components/erp/status-badge";
import { EmptyState } from "@/components/erp/empty-state";
import { erpButtonClassName, erpFormInputClassName } from "@/components/erp/erpStyles";
import { RecordAiDrawer } from "@/components/ai/RecordAiDrawer";
import { getApiErrorMessage } from "@/lib/api-errors";
import { notifyError, notifySuccess } from "@/lib/notifications";
import { payrollApi } from "@/services/modules";
import type { PayrollRunSummary } from "@/types";

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
  const queryClient = useQueryClient();

  const { data: runs = [], isLoading, isError, error, refetch } = useQuery({
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

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return runs;
    return runs.filter((run) =>
      `${run.id} ${run.status ?? ""} ${run.runDate} ${run.companyId ?? ""}`.toLowerCase().includes(q),
    );
  }, [runs, search]);

  const approvedCount = runs.filter((r) => {
    const s = (r.status ?? "").toLowerCase();
    return s === "approved" || s === "completed" || s === "paid";
  }).length;

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
        <button
          type="button"
          className={`${erpButtonClassName.primary} gap-1.5`}
          disabled={createMutation.isPending}
          onClick={() => createMutation.mutate()}
        >
          <Play className="h-4 w-4" />
          {createMutation.isPending ? "Creating…" : "Process New Run"}
        </button>
      }
      filters={
        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search runs by date, status, or ID…"
            className={`${erpFormInputClassName} pl-9`}
          />
        </div>
      }
    >
      {isError && (
        <div className="erp-alert-error text-sm">{getApiErrorMessage(error, "Failed to load payroll runs.")}</div>
      )}

      <CrudCard
        title="Payroll run history"
        description="Completing a draft run auto-generates payslips for active employees."
        actions={
          <button type="button" onClick={() => void refetch()} className={erpButtonClassName.secondary}>
            Refresh
          </button>
        }
      >
        {isLoading ? (
          <div className="erp-loading">Loading payroll runs…</div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No payroll runs found"
            description="Create a draft run, then complete it to generate payslips."
            ctaLabel="Process New Run"
            onClick={() => createMutation.mutate()}
          />
        ) : (
          <div className="space-y-3">
            {filtered.map((run) => {
              const isDraft = (run.status ?? "Draft").toLowerCase() === "draft";
              return (
                <div
                  key={run.id}
                  className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 transition hover:border-slate-300 md:flex-row md:items-center md:justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-semibold text-slate-900">
                        Payroll Run — {formatShortDate(run.runDate)}
                      </h3>
                      <StatusBadge tone={runStatusTone(run.status)}>{run.status?.trim() || "Draft"}</StatusBadge>
                    </div>
                    <p className="text-xs text-slate-500">
                      Run ID: {run.id.slice(0, 8)}…
                      {run.companyId ? ` • Company: ${run.companyId}` : " • Tenant-wide run"}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      className={`${erpButtonClassName.secondary} h-8 gap-1.5 px-3 text-xs`}
                      onClick={() => setAiRunId(run.id)}
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      Ask AI
                    </button>
                    {isDraft ? (
                      <button
                        type="button"
                        className={`${erpButtonClassName.primary} h-8 gap-1.5 px-3 text-xs`}
                        disabled={completeMutation.isPending}
                        onClick={() => completeMutation.mutate(run.id)}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Complete & generate payslips
                      </button>
                    ) : (
                      <button
                        type="button"
                        className={`${erpButtonClassName.secondary} h-8 gap-1.5 px-3 text-xs`}
                        onClick={async () => {
                          try {
                            const response = await payrollApi.runs.bankFile(run.id);
                            const blob = new Blob([response.data], { type: "text/csv" });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement("a");
                            a.href = url;
                            a.download = `salary-neft-${run.id.slice(0, 8)}.csv`;
                            a.click();
                            URL.revokeObjectURL(url);
                          } catch (err) {
                            notifyError(getApiErrorMessage(err, "Failed to download bank file."), "Payroll");
                          }
                        }}
                      >
                        Download NEFT file
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CrudCard>

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
