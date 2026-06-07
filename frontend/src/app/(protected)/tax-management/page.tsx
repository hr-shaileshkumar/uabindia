"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw, Shield, AlertCircle } from "lucide-react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { hrApi } from "@/services/hrApi";
import { notifyError } from "@/lib/notifications";
import { getApiErrorMessage } from "@/lib/api-errors";

type TaxRecord = {
  id: string;
  taxType: string;
  period: string;
  taxableAmount?: number;
  taxAmount?: number;
  status?: string;
  dueDate?: string;
  filedDate?: string;
  reference?: string;
};

const STATUS_CONFIG: Record<string, { chip: string; label: string }> = {
  Filed:   { chip: "erp-chip erp-chip-success", label: "Filed"   },
  Pending: { chip: "erp-chip erp-chip-warning", label: "Pending" },
  Overdue: { chip: "erp-chip erp-chip-danger",  label: "Overdue" },
  Draft:   { chip: "erp-chip erp-chip-neutral", label: "Draft"   },
};

const TAX_TYPES = ["GST", "TDS", "Income Tax", "Professional Tax", "PF", "ESI", "VAT", "Custom Duty"];
const formatCurrency = (v?: number) => v != null ? `₹${v.toLocaleString("en-IN")}` : "—";

export default function TaxManagementPage() {
  const [records, setRecords] = useState<TaxRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [taxFilter, setTaxFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // Fetch statutory compliance data from payroll
      const [pfRes, esiRes, ptRes, tdsRes] = await Promise.all([
        hrApi.payroll.statutory.pf().catch(() => ({ data: {} })),
        hrApi.payroll.statutory.esi().catch(() => ({ data: {} })),
        hrApi.payroll.statutory.pt().catch(() => ({ data: {} })),
        hrApi.payroll.statutory.tds().catch(() => ({ data: {} })),
      ]);

      const now = new Date();
      const currentPeriod = now.toISOString().slice(0, 7);
      const dueDate = new Date(now.getFullYear(), now.getMonth() + 1, 15).toISOString().split("T")[0];

      const buildRecord = (type: string, data: Record<string, unknown>, totalKey: string): TaxRecord => ({
        id: type,
        taxType: type,
        period: currentPeriod,
        taxableAmount: (data?.taxableAmount as number) || 0,
        taxAmount: (data?.[totalKey] as number) || 0,
        status: Array.isArray(data?.records) && (data.records as unknown[]).length > 0 ? "Pending" : "Draft",
        dueDate,
        reference: `${type}-${currentPeriod}`,
      });

      const statutory: TaxRecord[] = [
        buildRecord("PF",  pfRes.data  as Record<string, unknown>, "totalPF"),
        buildRecord("ESI", esiRes.data as Record<string, unknown>, "totalESI"),
        buildRecord("Professional Tax", ptRes.data as Record<string, unknown>, "totalPT"),
        buildRecord("TDS", tdsRes.data as Record<string, unknown>, "totalTDS"),
      ];

      // Add placeholder GST record
      statutory.push({
        id: "GST",
        taxType: "GST",
        period: currentPeriod,
        taxableAmount: 0,
        taxAmount: 0,
        status: "Pending",
        dueDate,
        reference: `GST-${currentPeriod}`,
      });

      setRecords(statutory);
    } catch (err) {
      const msg = getApiErrorMessage(err, "Failed to load tax records.");
      setError(msg);
      notifyError(msg, "Tax Management");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const filtered = records.filter((r) => {
    const matchTax = !taxFilter || r.taxType === taxFilter;
    const matchStatus = !statusFilter || r.status === statusFilter;
    return matchTax && matchStatus;
  });

  const filed    = filtered.filter((r) => r.status === "Filed").length;
  const pending  = filtered.filter((r) => r.status === "Pending").length;
  const overdue  = filtered.filter((r) => r.status === "Overdue").length;
  const totalTax = filtered.reduce((s, r) => s + (r.taxAmount || 0), 0);

  return (
    <StandardPageLayout
      title="Tax Management"
      subtitle="Track GST, TDS, income tax, and all statutory filings. Monitor due dates, filing status, and liability amounts."
      eyebrow="Finance / Compliance"
      icon="shield"
      actions={
        <button type="button" onClick={() => void load()} className="erp-action-btn erp-action-btn-secondary gap-1">
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      }
      filters={
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="erp-label">Tax Type</label>
            <select className="erp-select w-44" value={taxFilter} onChange={(e) => setTaxFilter(e.target.value)}>
              <option value="">All Types</option>
              {TAX_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="erp-label">Status</label>
            <select className="erp-select w-36" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All Status</option>
              <option value="Draft">Draft</option>
              <option value="Pending">Pending</option>
              <option value="Filed">Filed</option>
              <option value="Overdue">Overdue</option>
            </select>
          </div>
          {(taxFilter || statusFilter) && (
            <button type="button" onClick={() => { setTaxFilter(""); setStatusFilter(""); }} className="erp-action-btn erp-action-btn-secondary">Clear</button>
          )}
        </div>
      }
    >
      <div className="erp-kpi-grid">
        <div className="erp-kpi-card">
          <p className="erp-kpi-label">Total Filings</p>
          <p className="erp-kpi-value">{filtered.length}</p>
          <p className="erp-kpi-meta">Tax compliance records</p>
        </div>
        <div className="erp-kpi-card erp-kpi-card-success">
          <p className="erp-kpi-label">Filed</p>
          <p className="erp-kpi-value erp-kpi-value-success">{filed}</p>
          <p className="erp-kpi-meta">Completed on time</p>
        </div>
        <div className="erp-kpi-card erp-kpi-card-warning">
          <p className="erp-kpi-label">Pending</p>
          <p className="erp-kpi-value">{pending}</p>
          <p className="erp-kpi-meta">Due for filing</p>
        </div>
        <div className="erp-kpi-card erp-kpi-card-info">
          <p className="erp-kpi-label">Total Liability</p>
          <p className="erp-kpi-value">{formatCurrency(totalTax)}</p>
          <p className="erp-kpi-meta">Current period tax due</p>
        </div>
      </div>

      {overdue > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-600" />
          <p className="text-sm font-medium text-red-800">
            {overdue} tax filing{overdue > 1 ? "s are" : " is"} overdue. File immediately to avoid penalties.
          </p>
        </div>
      )}

      {error && <div className="erp-alert-error">{error}</div>}

      {/* Compliance Calendar Banner */}
      <div className="rounded-2xl border border-amber-100 bg-gradient-to-r from-amber-50/80 to-orange-50/40 p-5">
        <p className="mb-3 text-xs font-bold uppercase tracking-widest text-amber-700">Key Compliance Deadlines</p>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            { label: "GST GSTR-1",   date: "11th of next month",  type: "GST"   },
            { label: "GST GSTR-3B",  date: "20th of next month",  type: "GST"   },
            { label: "TDS Filing",   date: "7th of next month",   type: "TDS"   },
            { label: "PF / ESI",     date: "15th of next month",  type: "PF"    },
          ].map((d) => (
            <div key={d.label} className="rounded-xl border border-amber-200/60 bg-white/80 p-3">
              <p className="text-xs font-bold text-amber-700">{d.label}</p>
              <p className="mt-1 text-xs text-slate-600">{d.date}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="erp-panel">
        <div className="erp-panel-header">
          <div>
            <h2 className="erp-panel-title">Tax Register</h2>
            <p className="mt-1 text-sm text-slate-500">{filtered.length} tax filing records for current period</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="erp-table">
            <thead className="erp-thead">
              <tr>
                <th className="erp-th">Tax Type</th>
                <th className="erp-th">Period</th>
                <th className="erp-th text-right">Taxable Amount</th>
                <th className="erp-th text-right">Tax Liability</th>
                <th className="erp-th">Due Date</th>
                <th className="erp-th">Reference</th>
                <th className="erp-th">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}><td colSpan={7} className="erp-td"><div className="h-4 animate-pulse rounded bg-slate-100" /></td></tr>
                ))
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="erp-td py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <Shield className="h-10 w-10 text-slate-300" />
                    <p className="text-sm text-slate-400">No tax records found for selected filters.</p>
                  </div>
                </td></tr>
              ) : (
                filtered.map((r) => {
                  const cfg = STATUS_CONFIG[r.status || "Pending"] || STATUS_CONFIG.Pending;
                  const isOverdue = r.dueDate && new Date(r.dueDate) < new Date() && r.status !== "Filed";
                  return (
                    <tr key={r.id} className="erp-tr">
                      <td className="erp-td">
                        <div className="flex items-center gap-2">
                          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-xs font-bold text-amber-700">{r.taxType.slice(0, 2)}</span>
                          <span className="font-semibold text-slate-900">{r.taxType}</span>
                        </div>
                      </td>
                      <td className="erp-td text-slate-600">{r.period || "—"}</td>
                      <td className="erp-td text-right text-slate-700">{formatCurrency(r.taxableAmount)}</td>
                      <td className="erp-td text-right font-semibold text-slate-900">{formatCurrency(r.taxAmount)}</td>
                      <td className="erp-td">
                        <span className={isOverdue ? "font-semibold text-red-600" : "text-slate-600"}>
                          {r.dueDate ? new Date(r.dueDate).toLocaleDateString("en-IN") : "—"}
                          {isOverdue && <span className="ml-1 text-xs">⚠</span>}
                        </span>
                      </td>
                      <td className="erp-td font-mono text-xs text-slate-600">{r.reference || "—"}</td>
                      <td className="erp-td"><span className={cfg.chip}>{cfg.label}</span></td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </StandardPageLayout>
  );
}
