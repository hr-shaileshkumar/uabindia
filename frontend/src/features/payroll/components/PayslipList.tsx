"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, Search } from "lucide-react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { CrudCard, CrudHeaderStats } from "@/components/erp/crud-workspace";
import { StatusBadge } from "@/components/erp/status-badge";
import { EmptyState } from "@/components/erp/empty-state";
import { erpButtonClassName, erpFormInputClassName, erpTableTdClassName, erpTableThClassName } from "@/components/erp/erpStyles";
import { getApiErrorMessage } from "@/lib/api-errors";
import { notifyError } from "@/lib/notifications";
import { payrollApi } from "@/services/modules";
import type { Payslip } from "@/types";

type PayslipRecord = Payslip & {
  employee?: { fullName?: string };
  gross?: number;
  net?: number;
  totalDeductions?: number;
};

const slipStatusTone = (status?: string) => {
  if (status === "Sent") return "positive" as const;
  if (status === "Generated") return "info" as const;
  return "neutral" as const;
};

const mapPayslip = (row: Record<string, unknown>): PayslipRecord => {
  const gross = Number(row.grossPay ?? row.gross ?? 0);
  const net = Number(row.netPay ?? row.net ?? 0);
  const deductions = Number(row.totalDeductions ?? Math.max(0, gross - net));
  return {
    id: String(row.id),
    employeeId: String(row.employeeId ?? ""),
    employeeName: row.employeeName ? String(row.employeeName) : undefined,
    month: Number(row.month ?? 0) || new Date().getMonth() + 1,
    year: Number(row.year ?? 0) || new Date().getFullYear(),
    grossPay: gross,
    totalDeductions: deductions,
    netPay: net,
    status: (String(row.status ?? "Generated") as Payslip["status"]),
  };
};

export function PayslipList() {
  const [search, setSearch] = useState("");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const { data: slips = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: ["payroll", "payslips"],
    queryFn: async () => {
      const { data } = await payrollApi.payslips.list();
      const rows = Array.isArray(data) ? data : (data as { data?: Record<string, unknown>[] })?.data;
      return (Array.isArray(rows) ? rows : []).map((row) => mapPayslip(row as Record<string, unknown>));
    },
    staleTime: 30_000,
  });

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return slips;
    return slips.filter((s) =>
      `${s.employeeName ?? s.employee?.fullName ?? ""} ${s.employeeId} ${s.status}`.toLowerCase().includes(q),
    );
  }, [slips, search]);

  const sentCount = slips.filter((s) => s.status === "Sent" || s.status === "Generated").length;

  const handleDownload = async (id: string) => {
    try {
      setDownloadingId(id);
      const response = await payrollApi.payslips.download(id);
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `payslip-${id}.pdf`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to download payslip."), "Payslips");
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <StandardPageLayout
      title="Employee Payslips"
      subtitle="Search, inspect, and download monthly salary slips for all employees."
      eyebrow="Payroll / Payslips"
      icon="file"
      meta={
        <CrudHeaderStats
          items={[
            { label: "Payslips", value: slips.length, helper: "records" },
            { label: "Generated", value: sentCount, tone: "positive" },
            { label: "Other", value: slips.length - sentCount, tone: "warning" },
          ]}
        />
      }
      filters={
        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by employee name or ID…"
            className={`${erpFormInputClassName} pl-9`}
          />
        </div>
      }
    >
      {isError && (
        <div className="erp-alert-error text-sm">{getApiErrorMessage(error, "Failed to load payslips.")}</div>
      )}

      <CrudCard
        title="Payslip register"
        description="Employee salary slips from completed payroll runs."
        actions={
          <button type="button" onClick={() => void refetch()} className={erpButtonClassName.secondary}>
            Refresh
          </button>
        }
      >
        {isLoading ? (
          <div className="erp-loading">Loading payslips…</div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No payslips found"
            description="Complete a draft payroll run to auto-generate payslips for active employees."
            ctaLabel="Refresh list"
            onClick={() => void refetch()}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr>
                  <th className={erpTableThClassName}>Employee</th>
                  <th className={erpTableThClassName}>Period</th>
                  <th className={`${erpTableThClassName} text-right`}>Gross</th>
                  <th className={`${erpTableThClassName} text-right`}>Deductions</th>
                  <th className={`${erpTableThClassName} text-right`}>Net Pay</th>
                  <th className={erpTableThClassName}>Status</th>
                  <th className={`${erpTableThClassName} text-right`}>Download</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((slip) => {
                  const name = slip.employeeName ?? slip.employee?.fullName ?? slip.employeeId;
                  return (
                    <tr key={slip.id} className="border-t border-slate-100 transition hover:bg-slate-50">
                      <td className={`${erpTableTdClassName} font-semibold text-slate-900`}>{name}</td>
                      <td className={erpTableTdClassName}>
                        {slip.month}/{slip.year}
                      </td>
                      <td className={`${erpTableTdClassName} text-right`}>₹{slip.grossPay.toLocaleString("en-IN")}</td>
                      <td className={`${erpTableTdClassName} text-right text-rose-700`}>
                        ₹{slip.totalDeductions.toLocaleString("en-IN")}
                      </td>
                      <td className={`${erpTableTdClassName} text-right font-semibold text-emerald-700`}>
                        ₹{slip.netPay.toLocaleString("en-IN")}
                      </td>
                      <td className={erpTableTdClassName}>
                        <StatusBadge tone={slipStatusTone(slip.status)}>{slip.status}</StatusBadge>
                      </td>
                      <td className={`${erpTableTdClassName} text-right`}>
                        <button
                          type="button"
                          className={`${erpButtonClassName.ghost} h-8 gap-1.5 px-2 text-xs`}
                          disabled={downloadingId === slip.id}
                          onClick={() => void handleDownload(slip.id)}
                        >
                          <Download className="h-3.5 w-3.5" />
                          {downloadingId === slip.id ? "…" : "PDF"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CrudCard>
    </StandardPageLayout>
  );
}
