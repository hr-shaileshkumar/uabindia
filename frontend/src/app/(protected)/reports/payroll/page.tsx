"use client";

import { useCallback, useEffect, useState } from "react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import HeaderSummary from "@/components/layout/HeaderSummary";
import { CrudCard } from "@/components/workspace/crud-workspace";
import { ErpRefreshButton } from "@/components/workspace/page-kit";
import { useErpListView } from "@/components/workspace/list-view";
import { reportsApi } from "@/services/modules";

type PayrollOverview = {
  totalRuns?: number;
  completedRuns?: number;
  draftRuns?: number;
  totalPayslips?: number;
  totalPayout?: number;
  totalDisbursed?: number;
  avgNetSalary?: number;
  processedCount?: number;
};
type MonthlyRow = {
  month?: number | string;
  runsCount?: number;
  payslipsCount?: number;
  totalGross?: number;
  totalNet?: number;
  totalDeductions?: number;
  employeeCount?: number;
};

const formatCurrency = (v?: number) => (v != null ? `Rs${v.toLocaleString("en-IN")}` : "-");

export default function PayrollReportsPage() {
  const [overview, setOverview] = useState<PayrollOverview | null>(null);
  const [monthly, setMonthly] = useState<MonthlyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [year, setYear] = useState(new Date().getFullYear());

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [overviewRes, monthlyRes] = await Promise.all([
        reportsApi.payroll.overview(),
        reportsApi.payroll.monthly(year),
      ]);
      setOverview(overviewRes.data ?? null);
      const monthlyPayload = monthlyRes.data as { monthly?: MonthlyRow[] } | MonthlyRow[] | undefined;
      setMonthly(Array.isArray(monthlyPayload) ? monthlyPayload : monthlyPayload?.monthly ?? []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load payroll reports");
    } finally {
      setLoading(false);
    }
  }, [year]);

  useEffect(() => {
    void load();
  }, [load]);

  const monthlyList = useErpListView({
    listKey: "reports-payroll-monthly",
    rows: monthly,
    loading,
    emptyMessage: `No payroll data for ${year}.`,
    getRowId: (row) => String(row.month ?? row.payslipsCount ?? "month-unknown"),
    onRefresh: () => void load(),
    columns: [
      { key: "month", label: "Month", dataType: "string" },
      { key: "employeeCount", label: "Employees", dataType: "number" },
      { key: "totalGross", label: "Gross Salary", dataType: "number" },
      { key: "totalDeductions", label: "Deductions", dataType: "number" },
      { key: "totalNet", label: "Net Salary", dataType: "number" },
    ],
    renderRow: (row) => (
      <>
        <td className="erp-td font-medium text-slate-900">
          {row.month != null
            ? typeof row.month === "number"
              ? new Date(year, row.month - 1, 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" })
              : new Date(`${row.month}-01`).toLocaleDateString("en-IN", { month: "long", year: "numeric" })
            : "-"}
        </td>
        <td className="erp-td text-slate-600">{row.employeeCount ?? row.payslipsCount ?? "-"}</td>
        <td className="erp-td text-slate-700">{formatCurrency(row.totalGross)}</td>
        <td className="erp-td text-red-600">{formatCurrency(row.totalDeductions)}</td>
        <td className="erp-td font-semibold text-slate-900">{formatCurrency(row.totalNet)}</td>
      </>
    ),
  });

  return (
    <StandardPageLayout
      title="Payroll Reports"
      subtitle="Monthly payroll breakdowns, disbursement trends, and component analysis."
      eyebrow="Reports / Payroll Analytics"
      icon="bar-chart"
      meta={
        <HeaderSummary
          items={[
            { label: "Runs", value: overview?.totalRuns ?? "-", tone: "info" },
            { label: "Completed", value: overview?.completedRuns ?? "-", tone: "success" },
            { label: "Payslips", value: overview?.totalPayslips ?? "-", tone: "info" },
            {
              label: "Total Payout",
              value: formatCurrency(overview?.totalPayout ?? overview?.totalDisbursed),
              tone: "warning",
            },
          ]}
        />
      }
      actions={
        <>
          <ErpRefreshButton onClick={() => void load()} loading={loading} />
          {monthlyList.headerTools}
        </>
      }
      filters={
        <>
          <div className="flex items-end gap-3">
            <div>
              <label className="erp-label">Financial Year</label>
              <select className="erp-select w-36" value={year} onChange={(e) => setYear(Number(e.target.value))}>
                {[2024, 2025, 2026].map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {monthlyList.filterBar}
        </>
      }
    >
      {error ? <div className="erp-alert-error">{error}</div> : null}

      <CrudCard>
        <div className="border-b border-slate-200 px-4 py-3">
          <h2 className="erp-panel-title">Monthly Breakdown - {year}</h2>
          <p className="mt-1 text-sm text-slate-500">Month-by-month payroll summary</p>
        </div>
        {monthlyList.table}
      </CrudCard>
    </StandardPageLayout>
  );
}
