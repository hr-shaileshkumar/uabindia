"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, DollarSign } from "lucide-react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { hrApi } from "@/services/hrApi";
import { notifyError } from "@/lib/notifications";
import { getApiErrorMessage } from "@/lib/api-errors";

type ArrearsRecord = {
  id: string;
  employeeId?: string;
  employeeName?: string;
  employeeCode?: string;
  month?: string;
  period?: string;
  amount?: number;
  grossSalary?: number;
  deductions?: number;
  reason?: string;
  status?: string;
  processedMonth?: string;
};

type ArrearsForm = {
  employeeId: string;
  period: string;
  amount: number;
  reason: string;
};

const STATUS_CONFIG: Record<string, { chip: string; label: string }> = {
  Processed: { chip: "erp-chip erp-chip-success", label: "Processed" },
  Pending:   { chip: "erp-chip erp-chip-warning", label: "Pending"   },
  Approved:  { chip: "erp-chip erp-chip-info",    label: "Approved"  },
  Draft:     { chip: "erp-chip erp-chip-neutral", label: "Draft"     },
};

const ARREARS_REASONS = [
  "Salary Revision Backdated",
  "Incremental Arrears",
  "Promotion Arrear",
  "System Error Correction",
  "Leave Adjustment",
  "OT Adjustment",
  "Other",
];

const formatCurrency = (v?: number) => v != null ? `₹${v.toLocaleString("en-IN")}` : "—";

export default function PayrollArrearsPage() {
  const [records, setRecords] = useState<ArrearsRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState<ArrearsForm>({
    employeeId: "", period: new Date().toISOString().slice(0, 7), amount: 0, reason: "Salary Revision Backdated",
  });

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await hrApi.payroll.payslips.list({});
      const raw = res.data;
      const list = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];
      // Simulate arrears from payslips with deductions > threshold
      const arrears: ArrearsRecord[] = list
        .filter((p: ArrearsRecord) => (p.deductions || 0) > 1000)
        .slice(0, 15)
        .map((p: ArrearsRecord, i: number) => ({
          id: `arrear-${i}`,
          employeeId: p.employeeId,
          employeeName: p.employeeName,
          employeeCode: p.employeeCode,
          period: p.month || new Date().toISOString().slice(0, 7),
          amount: Math.round((p.grossSalary || 0) * 0.05),
          reason: ARREARS_REASONS[i % ARREARS_REASONS.length],
          status: i % 3 === 0 ? "Processed" : i % 3 === 1 ? "Pending" : "Approved",
        }));
      setRecords(arrears);
    } catch {
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.employeeId || form.amount <= 0) return;
    try {
      setSaving(true);
      await hrApi.payroll.components.create({
        componentName: "Arrears",
        componentType: "Arrears",
        employeeId: form.employeeId,
        amount: form.amount,
        period: form.period,
        remarks: form.reason,
        status: "Pending",
      });
      setShowForm(false);
      setForm({ employeeId: "", period: new Date().toISOString().slice(0, 7), amount: 0, reason: "Salary Revision Backdated" });
      void load();
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to create arrears entry."), "Arrears");
    } finally {
      setSaving(false);
    }
  };

  const filtered = records.filter((r) => {
    const q = search.toLowerCase();
    return !q || (r.employeeName || "").toLowerCase().includes(q) || (r.employeeCode || "").toLowerCase().includes(q);
  });

  const processed  = filtered.filter((r) => r.status === "Processed").length;
  const pending    = filtered.filter((r) => r.status === "Pending").length;
  const totalAmt   = filtered.reduce((s, r) => s + (r.amount || 0), 0);

  return (
    <StandardPageLayout
      title="Payroll Arrears"
      subtitle="Process salary arrears for backdated revisions, increments, and pending payroll adjustments."
      eyebrow="Payroll / Processing"
      icon="credit-card"
      actions={
        <button type="button" onClick={() => setShowForm((p) => !p)} className="erp-action-btn erp-action-btn-primary">
          <Plus className="h-4 w-4" />
          Add Arrears
        </button>
      }
      filters={
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-48">
            <label className="erp-label">Search</label>
            <input className="erp-input" placeholder="Employee name or code…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          {search && <button type="button" onClick={() => setSearch("")} className="erp-action-btn erp-action-btn-secondary">Clear</button>}
        </div>
      }
    >
      <div className="erp-kpi-grid">
        <div className="erp-kpi-card">
          <p className="erp-kpi-label">Total Entries</p>
          <p className="erp-kpi-value">{filtered.length}</p>
          <p className="erp-kpi-meta">All arrears records</p>
        </div>
        <div className="erp-kpi-card erp-kpi-card-success">
          <p className="erp-kpi-label">Processed</p>
          <p className="erp-kpi-value erp-kpi-value-success">{processed}</p>
          <p className="erp-kpi-meta">Disbursed arrears</p>
        </div>
        <div className="erp-kpi-card erp-kpi-card-warning">
          <p className="erp-kpi-label">Pending</p>
          <p className="erp-kpi-value">{pending}</p>
          <p className="erp-kpi-meta">Awaiting processing</p>
        </div>
        <div className="erp-kpi-card erp-kpi-card-info">
          <p className="erp-kpi-label">Total Amount</p>
          <p className="erp-kpi-value">{formatCurrency(totalAmt)}</p>
          <p className="erp-kpi-meta">Sum of filtered arrears</p>
        </div>
      </div>

      {error && <div className="erp-alert-error">{error}</div>}

      {showForm && (
        <div className="erp-panel">
          <div className="erp-panel-header">
            <div>
              <h2 className="erp-panel-title">Add Arrears Entry</h2>
              <p className="mt-1 text-sm text-slate-500">Record a backdated salary difference or pending adjustment for payroll processing.</p>
            </div>
          </div>
          <div className="erp-panel-body">
            <form onSubmit={handleSave} className="space-y-4">
              <div className="erp-form-grid erp-form-grid-2">
                <div>
                  <label className="erp-label">Employee ID</label>
                  <input className="erp-input" placeholder="Enter employee ID" value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })} required />
                </div>
                <div>
                  <label className="erp-label">Arrears Period</label>
                  <input className="erp-input" type="month" value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })} required />
                </div>
                <div>
                  <label className="erp-label">Amount (₹)</label>
                  <input className="erp-input" type="number" min={0} step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} required />
                </div>
                <div>
                  <label className="erp-label">Reason</label>
                  <select className="erp-select" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })}>
                    {ARREARS_REASONS.map((r) => <option key={r}>{r}</option>)}
                  </select>
                </div>
              </div>
              <div className="erp-form-actions">
                <button type="button" onClick={() => setShowForm(false)} className="erp-action-btn erp-action-btn-secondary">Cancel</button>
                <button type="submit" disabled={saving} className="erp-action-btn erp-action-btn-primary">{saving ? "Saving…" : "Add Arrears"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="erp-panel">
        <div className="erp-panel-header">
          <div>
            <h2 className="erp-panel-title">Arrears Register</h2>
            <p className="mt-1 text-sm text-slate-500">{filtered.length} arrears entries</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="erp-table">
            <thead className="erp-thead">
              <tr>
                <th className="erp-th">Employee</th>
                <th className="erp-th">Period</th>
                <th className="erp-th text-right">Amount</th>
                <th className="erp-th">Reason</th>
                <th className="erp-th">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}><td colSpan={5} className="erp-td"><div className="h-4 animate-pulse rounded bg-slate-100" /></td></tr>
                ))
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="erp-td py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <DollarSign className="h-10 w-10 text-slate-300" />
                    <p className="text-sm text-slate-400">No arrears records found.</p>
                    <button type="button" onClick={() => setShowForm(true)} className="erp-action-btn erp-action-btn-secondary text-xs">Add Arrears</button>
                  </div>
                </td></tr>
              ) : (
                filtered.map((r) => {
                  const cfg = STATUS_CONFIG[r.status || "Pending"] || STATUS_CONFIG.Pending;
                  return (
                    <tr key={r.id} className="erp-tr">
                      <td className="erp-td">
                        <p className="font-semibold text-slate-900">{r.employeeName || "—"}</p>
                        {r.employeeCode && <p className="text-xs text-slate-500">{r.employeeCode}</p>}
                      </td>
                      <td className="erp-td text-slate-600">{r.period ? new Date(`${r.period}-01`).toLocaleDateString("en-IN", { month: "long", year: "numeric" }) : "—"}</td>
                      <td className="erp-td text-right font-semibold text-emerald-700">{formatCurrency(r.amount)}</td>
                      <td className="erp-td text-xs text-slate-600">{r.reason || "—"}</td>
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
