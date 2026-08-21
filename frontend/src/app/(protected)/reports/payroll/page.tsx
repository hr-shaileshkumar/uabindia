"use client";

import { useEffect, useState } from "react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import ErpHeaderSummary from "@/components/layout/ErpHeaderSummary";
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

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
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
    };
    void load();
  }, [year]);

  const totalNet = monthly.reduce((sum, row) => sum + (row.totalNet || 0), 0);

  return (
    <StandardPageLayout
      title="Payroll Reports"
      subtitle="Monthly payroll breakdowns, disbursement trends, and component analysis."
      eyebrow="Reports / Payroll Analytics"
      icon="bar-chart"
      meta={
        <ErpHeaderSummary
          items={[
            { label: "Runs", value: overview?.totalRuns ?? "-", tone: "info" },
            { label: "Completed", value: overview?.completedRuns ?? "-", tone: "success" },
            { label: "Payslips", value: overview?.totalPayslips ?? "-", tone: "info" },
            { label: "Total Payout", value: formatCurrency(overview?.totalPayout ?? overview?.totalDisbursed), tone: "warning" },
          ]}
        />
      }
      filters={
        <div className="flex items-end gap-3">
          <div>
            <label className="erp-label">Financial Year</label>
            <select className="erp-select w-36" value={year} onChange={(e) => setYear(Number(e.target.value))}>
              {[2024, 2025, 2026].map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
        </div>
      }
    >
      {error && <div className="erp-alert-error">{error}</div>}

      <div className="erp-panel">
        <div className="erp-panel-header">
          <div>
            <h2 className="erp-panel-title">Monthly Breakdown - {year}</h2>
            <p className="mt-1 text-sm text-slate-500">Month-by-month payroll summary</p>
          </div>
        </div>
        <div className="overflow-x-auto bg-white/80">
          <table className="erp-table">
            <thead className="erp-thead">
              <tr>
                <th className="erp-th">Month</th>
                <th className="erp-th">Employees</th>
                <th className="erp-th">Gross Salary</th>
                <th className="erp-th">Deductions</th>
                <th className="erp-th">Net Salary</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, index) => (
                  <tr key={index}><td colSpan={5} className="erp-td"><div className="h-4 animate-pulse rounded bg-slate-100" /></td></tr>
                ))
              ) : monthly.length === 0 ? (
                <tr><td colSpan={5} className="erp-td py-10 text-center text-slate-400">No payroll data for {year}.</td></tr>
              ) : (
                monthly.map((row, index) => (
                  <tr key={index} className="erp-tr">
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
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </StandardPageLayout>
  );
}
