"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { useAuth } from "@/context/AuthContext";
import { getApiErrorMessage } from "@/lib/api-errors";
import { hrApi } from "@/services/hrApi";

type PayslipRecord = {
  id: string;
  employeeName: string;
  period: string;
  runName?: string;
  netSalary: number;
  status: string;
  generatedAt?: string;
};

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const formatDate = (value?: string) => {
  if (!value) return "Not generated";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
};

export default function PayslipsPage() {
  const { user } = useAuth();
  const [payslips, setPayslips] = useState<PayslipRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const loadPayslips = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await hrApi.payroll.payslips.list({});
      const raw = response.data;
      const items = Array.isArray(raw)
        ? raw
        : Array.isArray(raw?.payslips)
          ? raw.payslips
          : Array.isArray(raw?.records)
            ? raw.records
            : Array.isArray(raw?.data)
              ? raw.data
              : [];

      setPayslips(
        items.map((item: Record<string, unknown>, index: number) => ({
          id: String(item.id ?? item.payslipId ?? index),
          employeeName:
            typeof item.employeeName === "string"
              ? item.employeeName
              : typeof item.fullName === "string"
                ? item.fullName
                : user?.fullName || "Employee",
          period:
            typeof item.month === "string"
              ? item.month
              : typeof item.payPeriod === "string"
                ? item.payPeriod
                : typeof item.periodLabel === "string"
                  ? item.periodLabel
                  : "Current cycle",
          runName: typeof item.runName === "string" ? item.runName : undefined,
          netSalary: typeof item.netSalary === "number" ? item.netSalary : 0,
          status: typeof item.status === "string" ? item.status : "Generated",
          generatedAt:
            typeof item.generatedAt === "string"
              ? item.generatedAt
              : typeof item.createdAt === "string"
                ? item.createdAt
                : undefined,
        }))
      );
    } catch (loadError: unknown) {
      setError(getApiErrorMessage(loadError, "Failed to load payslips."));
    } finally {
      setLoading(false);
    }
  }, [user?.fullName]);

  useEffect(() => {
    void loadPayslips();
  }, [loadPayslips]);

  const handleDownload = async (payslip: PayslipRecord) => {
    try {
      setDownloadingId(payslip.id);
      const response = await hrApi.payroll.payslips.download(payslip.id);
      const blob = response.data instanceof Blob ? response.data : new Blob([response.data]);
      const objectUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = `${payslip.employeeName.replace(/\s+/g, "-").toLowerCase()}-${payslip.period.replace(/\s+/g, "-").toLowerCase()}-payslip.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(objectUrl);
    } catch (downloadError: unknown) {
      setError(getApiErrorMessage(downloadError, "Failed to download payslip."));
    } finally {
      setDownloadingId(null);
    }
  };

  const totalNetSalary = useMemo(() => payslips.reduce((sum, payslip) => sum + payslip.netSalary, 0), [payslips]);

  return (
    <StandardPageLayout
      title="Payslips"
      subtitle="A real payslip view with download support instead of a placeholder finance shell."
      eyebrow="Payroll / Employee Self Service"
      icon="payroll"
      actions={
        <button type="button" onClick={() => void loadPayslips()} className="erp-action-btn erp-action-btn-secondary">
          Refresh payslips
        </button>
      }
    >
      <div className="erp-kpi-grid">
        <div className="erp-kpi-card">
          <p className="erp-kpi-label">Payslips</p>
          <p className="erp-kpi-value">{payslips.length}</p>
          <p className="erp-kpi-meta">Accessible salary records</p>
        </div>
        <div className="erp-kpi-card erp-kpi-card-success">
          <p className="erp-kpi-label">Generated</p>
          <p className="erp-kpi-value erp-kpi-value-success">
            {payslips.filter((payslip) => payslip.status.toLowerCase() === "generated").length}
          </p>
          <p className="erp-kpi-meta">Ready to download</p>
        </div>
        <div className="erp-kpi-card erp-kpi-card-warning">
          <p className="erp-kpi-label">Pending</p>
          <p className="erp-kpi-value">
            {payslips.filter((payslip) => payslip.status.toLowerCase() !== "generated").length}
          </p>
          <p className="erp-kpi-meta">Not finalized yet</p>
        </div>
        <div className="erp-kpi-card erp-kpi-card-info">
          <p className="erp-kpi-label">Net Salary Total</p>
          <p className="erp-kpi-value">{currencyFormatter.format(totalNetSalary)}</p>
          <p className="erp-kpi-meta">Visible records only</p>
        </div>
      </div>

      {error ? <div className="erp-alert-error">{error}</div> : null}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Employee</th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Period</th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Run</th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Net Salary</th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Generated</th>
              <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <tr key={index}>
                  <td colSpan={7} className="px-5 py-4">
                    <div className="h-5 w-full animate-pulse rounded bg-slate-100" />
                  </td>
                </tr>
              ))
            ) : payslips.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center text-slate-500">
                  No payslips are currently available for this account.
                </td>
              </tr>
            ) : (
              payslips.map((payslip) => (
                <tr key={payslip.id} className="transition hover:bg-slate-50">
                  <td className="px-5 py-4">
                    <div className="font-medium text-slate-900">{payslip.employeeName}</div>
                  </td>
                  <td className="px-5 py-4 text-slate-600">{payslip.period}</td>
                  <td className="px-5 py-4 text-slate-600">{payslip.runName || "Standard payroll run"}</td>
                  <td className="px-5 py-4 font-medium text-slate-900">{currencyFormatter.format(payslip.netSalary)}</td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                        payslip.status.toLowerCase() === "generated"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {payslip.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-slate-600">{formatDate(payslip.generatedAt)}</td>
                  <td className="px-5 py-4 text-right">
                    <button
                      type="button"
                      onClick={() => void handleDownload(payslip)}
                      disabled={downloadingId === payslip.id}
                      className="erp-action-btn erp-action-btn-secondary"
                    >
                      {downloadingId === payslip.id ? "Downloading..." : "Download"}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </StandardPageLayout>
  );
}
