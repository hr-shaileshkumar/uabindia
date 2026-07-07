"use client";

import { useEffect, useState } from "react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { hrApi } from "@/services/hrApi";

type PayrollOverview = { totalRuns?: number; totalDisbursed?: number; avgNetSalary?: number; processedCount?: number };
type MonthlyRow = { month?: string; totalGross?: number; totalNet?: number; totalDeductions?: number; employeeCount?: number };

const formatCurrency = (v?: number) => v != null ? `₹${v.toLocaleString("en-IN")}` : "—";

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
          hrApi.reports.payroll.overview(),
          hrApi.reports.payroll.monthly(year),
        ]);
        setOverview(overviewRes.data ?? null);
        setMonthly(Array.isArray(monthlyRes.data) ? monthlyRes.data : []);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load payroll reports");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [year]);

  const totalNet = monthly.reduce((s, r) => s + (r.totalNet || 0), 0);

  return (
    <StandardPageLayout
      title="Payroll Reports"
      subtitle="Monthly payroll breakdowns, disbursement trends, and component analysis."
      eyebrow="Reports / Payroll Analytics"
      icon="bar-chart"
      filters={
        <div className="flex items-end gap-3">
          <div>
            <label className="erp-label">Financial Year</label>
            <select className="erp-select w-36" value={year} onChange={(e) => setYear(Number(e.target.value))}>
              {[2024, 2025, 2026].map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>
      }
    >
      <div className="erp-kpi-grid">
        <div className="erp-kpi-card erp-kpi-card-info">
          <p className="erp-kpi-label">Total Runs</p>
          <p className="erp-kpi-value">{overview?.totalRuns ?? "—"}</p>
          <p className="erp-kpi-meta">Payroll cycles processed</p>
        </div>
        <div className="erp-kpi-card erp-kpi-card-success">
          <p className="erp-kpi-label">Total Disbursed</p>
          <p className="erp-kpi-value">{formatCurrency(overview?.totalDisbursed)}</p>
          <p className="erp-kpi-meta">All-time total net salary</p>
        </div>
        <div className="erp-kpi-card">
          <p className="erp-kpi-label">Avg Net Salary</p>
          <p className="erp-kpi-value">{formatCurrency(overview?.avgNetSalary)}</p>
          <p className="erp-kpi-meta">Per employee per run</p>
        </div>
        <div className="erp-kpi-card erp-kpi-card-info">
          <p className="erp-kpi-label">Year Net Total</p>
          <p className="erp-kpi-value">{formatCurrency(totalNet)}</p>
          <p className="erp-kpi-meta">Net salary for {year}</p>
        </div>
      </div>

      {error && <div className="erp-alert-error">{error}</div>}

      <div className="erp-panel">
        <div className="erp-panel-header">
          <div>
            <h2 className="erp-panel-title">Monthly Breakdown — {year}</h2>
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
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}><td colSpan={5} className="erp-td"><div className="h-4 animate-pulse rounded bg-slate-100" /></td></tr>
                ))
              ) : monthly.length === 0 ? (
                <tr><td colSpan={5} className="erp-td py-10 text-center text-slate-400">No payroll data for {year}.</td></tr>
              ) : (
                monthly.map((row, i) => (
                  <tr key={i} className="erp-tr">
                    <td className="erp-td font-medium text-slate-900">
                      {row.month ? new Date(`${row.month}-01`).toLocaleDateString("en-IN", { month: "long", year: "numeric" }) : "—"}
                    </td>
                    <td className="erp-td text-slate-600">{row.employeeCount ?? "—"}</td>
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
