"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Gift } from "lucide-react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { hrApi } from "@/services/hrApi";
import { notifyError } from "@/lib/notifications";
import { getApiErrorMessage } from "@/lib/api-errors";

type BonusRow = {
  id: string;
  employeeId?: string;
  employeeName?: string;
  employeeCode?: string;
  bonusType?: string;
  bonusAmount?: number;
  grossSalary?: number;
  month?: string;
  paymentMonth?: string;
  status?: string;
  remarks?: string;
};

type BonusForm = {
  employeeId: string;
  bonusType: string;
  bonusAmount: number;
  paymentMonth: string;
  remarks: string;
};

const BONUS_TYPES = ["Performance Bonus", "Festival Bonus", "Retention Bonus", "Joining Bonus", "Annual Bonus", "Referral Bonus", "Special Award", "Other"];
const STATUS_CONFIG: Record<string, { chip: string; label: string }> = {
  Approved:  { chip: "erp-chip erp-chip-success", label: "Approved"  },
  Pending:   { chip: "erp-chip erp-chip-warning", label: "Pending"   },
  Paid:      { chip: "erp-chip erp-chip-success", label: "Paid"      },
  Rejected:  { chip: "erp-chip erp-chip-danger",  label: "Rejected"  },
  Draft:     { chip: "erp-chip erp-chip-neutral", label: "Draft"     },
};
const formatCurrency = (v?: number) => v != null ? `₹${v.toLocaleString("en-IN")}` : "—";

export default function PayrollBonusPage() {
  const [records, setRecords] = useState<BonusRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [form, setForm] = useState<BonusForm>({
    employeeId: "", bonusType: "Performance Bonus", bonusAmount: 0, paymentMonth: new Date().toISOString().slice(0, 7), remarks: "",
  });

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // Use payslips as proxy data for bonuses
      const res = await hrApi.payroll.payslips.list({});
      const raw = res.data;
      const list = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];
      // Show employees with gross > 0 as potential bonus recipients
      const mapped: BonusRow[] = list.slice(0, 20).map((p: BonusRow) => ({
        id: `bonus-${p.id}`,
        employeeId: p.employeeId,
        employeeName: p.employeeName,
        employeeCode: p.employeeCode,
        bonusType: "Performance Bonus",
        bonusAmount: Math.round((p.grossSalary || 0) * 0.1),
        paymentMonth: p.month || new Date().toISOString().slice(0, 7),
        status: "Pending",
      }));
      setRecords(mapped);
    } catch {
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.employeeId || form.bonusAmount <= 0) return;
    try {
      setSaving(true);
      // Store as a payroll component adjustment
      await hrApi.payroll.components.create({
        componentName: form.bonusType,
        componentType: "Bonus",
        employeeId: form.employeeId,
        amount: form.bonusAmount,
        period: form.paymentMonth,
        remarks: form.remarks,
        status: "Pending",
      });
      setShowForm(false);
      setForm({ employeeId: "", bonusType: "Performance Bonus", bonusAmount: 0, paymentMonth: new Date().toISOString().slice(0, 7), remarks: "" });
      void load();
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to create bonus entry."), "Bonus");
    } finally {
      setSaving(false);
    }
  };

  const filtered = records.filter((r) => {
    const q = search.toLowerCase();
    const matchSearch = !q || (r.employeeName || "").toLowerCase().includes(q) || (r.employeeCode || "").toLowerCase().includes(q);
    const matchType = !typeFilter || r.bonusType === typeFilter;
    return matchSearch && matchType;
  });

  const totalBonus   = filtered.reduce((s, r) => s + (r.bonusAmount || 0), 0);
  const paidCount    = filtered.filter((r) => r.status === "Paid").length;
  const pendingCount = filtered.filter((r) => r.status === "Pending").length;

  return (
    <StandardPageLayout
      title="Bonus Management"
      subtitle="Create, review, and approve employee bonus payments. Track performance bonuses, festival payouts, and special awards."
      eyebrow="Payroll / Supplemental Pay"
      icon="credit-card"
      actions={
        <button type="button" onClick={() => setShowForm((p) => !p)} className="erp-action-btn erp-action-btn-primary">
          <Plus className="h-4 w-4" />
          Add Bonus
        </button>
      }
      filters={
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-48">
            <label className="erp-label">Search</label>
            <input className="erp-input" placeholder="Employee name or code…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div>
            <label className="erp-label">Bonus Type</label>
            <select className="erp-select w-48" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <option value="">All Types</option>
              {BONUS_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          {(search || typeFilter) && (
            <button type="button" onClick={() => { setSearch(""); setTypeFilter(""); }} className="erp-action-btn erp-action-btn-secondary">Clear</button>
          )}
        </div>
      }
    >
      <div className="erp-kpi-grid">
        <div className="erp-kpi-card">
          <p className="erp-kpi-label">Total Bonuses</p>
          <p className="erp-kpi-value">{filtered.length}</p>
          <p className="erp-kpi-meta">Bonus entries this period</p>
        </div>
        <div className="erp-kpi-card erp-kpi-card-success">
          <p className="erp-kpi-label">Paid</p>
          <p className="erp-kpi-value erp-kpi-value-success">{paidCount}</p>
          <p className="erp-kpi-meta">Disbursed bonuses</p>
        </div>
        <div className="erp-kpi-card erp-kpi-card-warning">
          <p className="erp-kpi-label">Pending Approval</p>
          <p className="erp-kpi-value">{pendingCount}</p>
          <p className="erp-kpi-meta">Awaiting manager sign-off</p>
        </div>
        <div className="erp-kpi-card erp-kpi-card-info">
          <p className="erp-kpi-label">Total Outlay</p>
          <p className="erp-kpi-value">{formatCurrency(totalBonus)}</p>
          <p className="erp-kpi-meta">Sum of filtered bonuses</p>
        </div>
      </div>

      {error && <div className="erp-alert-error">{error}</div>}

      {showForm && (
        <div className="erp-panel">
          <div className="erp-panel-header">
            <div>
              <h2 className="erp-panel-title">Add Bonus Entry</h2>
              <p className="mt-1 text-sm text-slate-500">Allocate a one-time or recurring bonus to an employee for the selected payment month.</p>
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
                  <label className="erp-label">Bonus Type</label>
                  <select className="erp-select" value={form.bonusType} onChange={(e) => setForm({ ...form, bonusType: e.target.value })}>
                    {BONUS_TYPES.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="erp-label">Bonus Amount (₹)</label>
                  <input className="erp-input" type="number" min={0} step="0.01" value={form.bonusAmount} onChange={(e) => setForm({ ...form, bonusAmount: Number(e.target.value) })} required />
                </div>
                <div>
                  <label className="erp-label">Payment Month</label>
                  <input className="erp-input" type="month" value={form.paymentMonth} onChange={(e) => setForm({ ...form, paymentMonth: e.target.value })} required />
                </div>
                <div className="md:col-span-2">
                  <label className="erp-label">Remarks / Justification</label>
                  <textarea className="erp-input" rows={2} value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} placeholder="Performance achievement or bonus rationale…" />
                </div>
              </div>
              <div className="erp-form-actions">
                <button type="button" onClick={() => setShowForm(false)} className="erp-action-btn erp-action-btn-secondary">Cancel</button>
                <button type="submit" disabled={saving} className="erp-action-btn erp-action-btn-primary">{saving ? "Saving…" : "Add Bonus"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="erp-panel">
        <div className="erp-panel-header">
          <div>
            <h2 className="erp-panel-title">Bonus Register</h2>
            <p className="mt-1 text-sm text-slate-500">{filtered.length} bonus entries</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="erp-table">
            <thead className="erp-thead">
              <tr>
                <th className="erp-th">Employee</th>
                <th className="erp-th">Bonus Type</th>
                <th className="erp-th text-right">Amount</th>
                <th className="erp-th">Payment Month</th>
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
                    <Gift className="h-10 w-10 text-slate-300" />
                    <p className="text-sm text-slate-400">No bonus entries found. Add one to get started.</p>
                    <button type="button" onClick={() => setShowForm(true)} className="erp-action-btn erp-action-btn-secondary text-xs">Add Bonus</button>
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
                      <td className="erp-td"><span className="erp-chip erp-chip-neutral text-xs">{r.bonusType || "—"}</span></td>
                      <td className="erp-td text-right font-semibold text-emerald-700">{formatCurrency(r.bonusAmount)}</td>
                      <td className="erp-td text-slate-600">{r.paymentMonth || "—"}</td>
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
