"use client";

import { useEffect, useState } from "react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { hrApi } from "@/services/hrApi";
import { notifyError } from "@/lib/notifications";
import { getApiErrorMessage } from "@/lib/api-errors";

type Payslip = {
  id: string;
  employeeName?: string;
  employeeCode?: string;
  month?: string;
  grossSalary?: number;
  deductions?: number;
  netSalary?: number;
  status?: string;
  paymentDate?: string;
  runId?: string;
};

const STATUS_CHIP: Record<string, string> = {
  paid: "erp-chip erp-chip-success",
  pending: "erp-chip erp-chip-warning",
  processing: "erp-chip erp-chip-info",
  failed: "erp-chip erp-chip-danger",
};

const formatCurrency = (v?: number) =>
  v != null ? `₹${v.toLocaleString("en-IN")}` : "—";

export default function PayrollPayslipsPage() {
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [downloading, setDownloading] = useState<string | null>(null);
  const [runFilter] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await hrApi.payroll.payslips.list({ runId: runFilter || undefined });
        const raw = res.data;
        setPayslips(Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : []);
      } catch (err) {
        const msg = getApiErrorMessage(err, "Failed to load payslips.");
        setError(msg);
        notifyError(msg, "Payslips");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [runFilter]);

  const handleDownload = async (id: string) => {
    try {
      setDownloading(id);
      const res = await hrApi.payroll.payslips.download(id);
      const blob = new Blob([res.data as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `payslip-${id}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to download payslip."), "Download");
    } finally {
      setDownloading(null);
    }
  };

  const filtered = payslips.filter((p) => {
    const q = search.toLowerCase();
    const matchesSearch = !q || (p.employeeName || "").toLowerCase().includes(q) || (p.employeeCode || "").toLowerCase().includes(q);
    const matchesStatus = !statusFilter || (p.status || "").toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const totalNet = filtered.reduce((s, p) => s + (p.netSalary || 0), 0);
  const paidCount = filtered.filter((p) => (p.status || "").toLowerCase() === "paid").length;
  const pendingCount = filtered.filter((p) => (p.status || "").toLowerCase() !== "paid").length;

  return (
    <StandardPageLayout
      title="Payslips"
      subtitle="View, download, and manage employee payslips across all payroll cycles."
      eyebrow="Payroll / Output"
      icon="file"
      filters={
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-48">
            <label className="erp-label">Search</label>
            <input className="erp-input" placeholder="Employee name or code…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div>
            <label className="erp-label">Status</label>
            <select className="erp-select w-36" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="failed">Failed</option>
            </select>
          </div>
          {(search || statusFilter) && (
            <button type="button" onClick={() => { setSearch(""); setStatusFilter(""); }} className="erp-action-btn erp-action-btn-secondary">Clear</button>
          )}
        </div>
      }
    >
      {/* KPIs */}
      <div className="erp-kpi-grid">
        <div className="erp-kpi-card">
          <p className="erp-kpi-label">Total Payslips</p>
          <p className="erp-kpi-value">{filtered.length}</p>
          <p className="erp-kpi-meta">Matching current filters</p>
        </div>
        <div className="erp-kpi-card erp-kpi-card-success">
          <p className="erp-kpi-label">Paid</p>
          <p className="erp-kpi-value erp-kpi-value-success">{paidCount}</p>
          <p className="erp-kpi-meta">Disbursed payslips</p>
        </div>
        <div className="erp-kpi-card erp-kpi-card-warning">
          <p className="erp-kpi-label">Pending / Other</p>
          <p className="erp-kpi-value">{pendingCount}</p>
          <p className="erp-kpi-meta">Awaiting payment or processing</p>
        </div>
        <div className="erp-kpi-card erp-kpi-card-info">
          <p className="erp-kpi-label">Total Net Salary</p>
          <p className="erp-kpi-value">{formatCurrency(totalNet)}</p>
          <p className="erp-kpi-meta">Sum of filtered net salaries</p>
        </div>
      </div>

      {error && <div className="erp-alert-error">{error}</div>}

      <div className="erp-panel">
        <div className="erp-panel-header">
          <div>
            <h2 className="erp-panel-title">Payslip Ledger</h2>
            <p className="mt-1 text-sm text-slate-500">{filtered.length} payslips shown</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="erp-table">
            <thead className="erp-thead">
              <tr>
                <th className="erp-th">Employee</th>
                <th className="erp-th">Period</th>
                <th className="erp-th">Gross</th>
                <th className="erp-th">Deductions</th>
                <th className="erp-th">Net Salary</th>
                <th className="erp-th">Payment Date</th>
                <th className="erp-th">Status</th>
                <th className="erp-th text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}><td colSpan={8} className="erp-td"><div className="h-4 animate-pulse rounded bg-slate-100" /></td></tr>
                ))
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="erp-td py-12 text-center text-slate-400">No payslips found.</td></tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.id} className="erp-tr">
                    <td className="erp-td">
                      <div>
                        <p className="font-medium text-slate-900">{p.employeeName || "—"}</p>
                        {p.employeeCode && <p className="text-xs text-slate-500">{p.employeeCode}</p>}
                      </div>
                    </td>
                    <td className="erp-td text-slate-600">{p.month || "—"}</td>
                    <td className="erp-td text-slate-700">{formatCurrency(p.grossSalary)}</td>
                    <td className="erp-td text-red-600">{formatCurrency(p.deductions)}</td>
                    <td className="erp-td font-semibold text-slate-900">{formatCurrency(p.netSalary)}</td>
                    <td className="erp-td text-slate-600">{p.paymentDate ? new Date(p.paymentDate).toLocaleDateString("en-IN") : "—"}</td>
                    <td className="erp-td">
                      <span className={STATUS_CHIP[(p.status || "").toLowerCase()] || "erp-chip erp-chip-neutral"}>
                        {p.status || "Pending"}
                      </span>
                    </td>
                    <td className="erp-td text-right">
                      <button
                        type="button"
                        onClick={() => void handleDownload(p.id)}
                        disabled={downloading === p.id}
                        className="erp-action-btn erp-action-btn-secondary text-xs px-3"
                      >
                        {downloading === p.id ? "…" : "Download PDF"}
                      </button>
                    </td>
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
