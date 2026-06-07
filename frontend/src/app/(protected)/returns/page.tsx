"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, RotateCcw, CheckCircle, Clock, XCircle } from "lucide-react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { hrApi } from "@/services/hrApi";
import { notifyError } from "@/lib/notifications";
import { getApiErrorMessage } from "@/lib/api-errors";

type ReturnRow = {
  id: string;
  returnNumber?: string;
  customerId?: string;
  customerName?: string;
  originalOrderRef?: string;
  amount?: number;
  reason?: string;
  returnDate?: string;
  status?: string;
  creditNoteNumber?: string;
  soNumber?: string;
  totalAmount?: number;
  soDate?: string;
};

type ReturnForm = {
  customerId: string;
  originalOrderRef: string;
  amount: number;
  reason: string;
  returnDate: string;
};

const STATUS_CONFIG: Record<string, { chip: string; label: string; icon: React.ReactNode }> = {
  Pending:   { chip: "erp-chip erp-chip-warning", label: "Pending",   icon: <Clock        className="h-3.5 w-3.5" /> },
  Processed: { chip: "erp-chip erp-chip-success", label: "Processed", icon: <CheckCircle  className="h-3.5 w-3.5" /> },
  Rejected:  { chip: "erp-chip erp-chip-danger",  label: "Rejected",  icon: <XCircle      className="h-3.5 w-3.5" /> },
  Approved:  { chip: "erp-chip erp-chip-info",    label: "Approved",  icon: <CheckCircle  className="h-3.5 w-3.5" /> },
};

const RETURN_REASONS = ["Defective Product", "Wrong Item Delivered", "Damaged in Transit", "Customer Changed Mind", "Quantity Mismatch", "Quality Issue", "Other"];
const formatCurrency = (v?: number) => v != null ? `₹${v.toLocaleString("en-IN")}` : "—";

export default function ReturnsPage() {
  const [records, setRecords] = useState<ReturnRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [form, setForm] = useState<ReturnForm>({
    customerId: "", originalOrderRef: "", amount: 0, reason: "Defective Product", returnDate: new Date().toISOString().split("T")[0],
  });

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // Use cancelled sales orders as return proxy
      const res = await hrApi.erp.salesOrders.getAll(1, 50);
      const raw = res.data;
      const list = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];
      const mapped: ReturnRow[] = list
        .filter((so: ReturnRow) => so.status === "Cancelled")
        .map((so: ReturnRow, i: number) => ({
          id: so.id || String(i),
          returnNumber: `RTN-${(so.soNumber || so.id?.slice(0, 8) || "").replace("SO-", "")}`,
          customerId: so.customerId,
          customerName: so.customerName || so.customerId,
          originalOrderRef: so.soNumber,
          amount: so.totalAmount,
          reason: "Customer Changed Mind",
          returnDate: so.soDate,
          status: "Pending",
        }));
      setRecords(mapped);
    } catch (err) {
      const msg = getApiErrorMessage(err, "Failed to load return records.");
      setError(msg);
      notifyError(msg, "Returns");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customerId) return;
    try {
      setSaving(true);
      // Create as a payment with negative amount (credit)
      await hrApi.erp.payments.create({
        paymentType: "CreditNote",
        customerId: form.customerId,
        amount: -Math.abs(form.amount),
        paymentDate: form.returnDate,
        referenceNumber: form.originalOrderRef,
        notes: form.reason,
        status: "Pending",
      });
      setShowForm(false);
      setForm({ customerId: "", originalOrderRef: "", amount: 0, reason: "Defective Product", returnDate: new Date().toISOString().split("T")[0] });
      void load();
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to create return."), "Return");
    } finally {
      setSaving(false);
    }
  };

  const filtered = records.filter((r) => {
    const q = search.toLowerCase();
    const matchSearch = !q || (r.returnNumber || "").toLowerCase().includes(q) || (r.customerName || "").toLowerCase().includes(q);
    const matchStatus = !statusFilter || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const processed   = filtered.filter((r) => r.status === "Processed").length;
  const pending     = filtered.filter((r) => r.status === "Pending").length;
  const totalReturn = filtered.reduce((s, r) => s + (r.amount || 0), 0);

  return (
    <StandardPageLayout
      title="Returns Management"
      subtitle="Manage sales return requests, credit note generation, and reverse logistics workflows for customer returns."
      eyebrow="Sales / Sales Process"
      icon="file"
      actions={
        <button type="button" onClick={() => setShowForm((p) => !p)} className="erp-action-btn erp-action-btn-primary">
          <Plus className="h-4 w-4" />
          New Return
        </button>
      }
      filters={
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-48">
            <label className="erp-label">Search</label>
            <input className="erp-input" placeholder="Return # or customer…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div>
            <label className="erp-label">Status</label>
            <select className="erp-select w-36" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Processed">Processed</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
          {(search || statusFilter) && (
            <button type="button" onClick={() => { setSearch(""); setStatusFilter(""); }} className="erp-action-btn erp-action-btn-secondary">Clear</button>
          )}
        </div>
      }
    >
      <div className="erp-kpi-grid">
        <div className="erp-kpi-card">
          <p className="erp-kpi-label">Total Returns</p>
          <p className="erp-kpi-value">{filtered.length}</p>
          <p className="erp-kpi-meta">All return requests</p>
        </div>
        <div className="erp-kpi-card erp-kpi-card-success">
          <p className="erp-kpi-label">Processed</p>
          <p className="erp-kpi-value erp-kpi-value-success">{processed}</p>
          <p className="erp-kpi-meta">Credit note issued</p>
        </div>
        <div className="erp-kpi-card erp-kpi-card-warning">
          <p className="erp-kpi-label">Pending</p>
          <p className="erp-kpi-value">{pending}</p>
          <p className="erp-kpi-meta">Awaiting processing</p>
        </div>
        <div className="erp-kpi-card erp-kpi-card-info">
          <p className="erp-kpi-label">Total Return Value</p>
          <p className="erp-kpi-value">{formatCurrency(totalReturn)}</p>
          <p className="erp-kpi-meta">Sum of return amounts</p>
        </div>
      </div>

      {error && <div className="erp-alert-error">{error}</div>}

      {showForm && (
        <div className="erp-panel">
          <div className="erp-panel-header">
            <div>
              <h2 className="erp-panel-title">Initiate Return</h2>
              <p className="mt-1 text-sm text-slate-500">Register a customer return against an existing sales order for credit note processing.</p>
            </div>
          </div>
          <div className="erp-panel-body">
            <form onSubmit={handleSave} className="space-y-4">
              <div className="erp-form-grid erp-form-grid-2">
                <div>
                  <label className="erp-label">Customer ID</label>
                  <input className="erp-input" placeholder="Enter customer ID" value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })} required />
                </div>
                <div>
                  <label className="erp-label">Original Order Reference</label>
                  <input className="erp-input" placeholder="e.g. SO-2024-0001" value={form.originalOrderRef} onChange={(e) => setForm({ ...form, originalOrderRef: e.target.value })} required />
                </div>
                <div>
                  <label className="erp-label">Return Amount (₹)</label>
                  <input className="erp-input" type="number" min={0} step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} required />
                </div>
                <div>
                  <label className="erp-label">Return Date</label>
                  <input className="erp-input" type="date" value={form.returnDate} onChange={(e) => setForm({ ...form, returnDate: e.target.value })} required />
                </div>
                <div className="md:col-span-2">
                  <label className="erp-label">Reason</label>
                  <select className="erp-select" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })}>
                    {RETURN_REASONS.map((r) => <option key={r}>{r}</option>)}
                  </select>
                </div>
              </div>
              <div className="erp-form-actions">
                <button type="button" onClick={() => setShowForm(false)} className="erp-action-btn erp-action-btn-secondary">Cancel</button>
                <button type="submit" disabled={saving} className="erp-action-btn erp-action-btn-primary">{saving ? "Saving…" : "Initiate Return"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="erp-panel">
        <div className="erp-panel-header">
          <div>
            <h2 className="erp-panel-title">Returns Register</h2>
            <p className="mt-1 text-sm text-slate-500">{filtered.length} return records</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="erp-table">
            <thead className="erp-thead">
              <tr>
                <th className="erp-th">Return #</th>
                <th className="erp-th">Customer</th>
                <th className="erp-th">Order Ref</th>
                <th className="erp-th">Amount</th>
                <th className="erp-th">Reason</th>
                <th className="erp-th">Return Date</th>
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
                    <RotateCcw className="h-10 w-10 text-slate-300" />
                    <p className="text-sm text-slate-400">No return records found.</p>
                    <button type="button" onClick={() => setShowForm(true)} className="erp-action-btn erp-action-btn-secondary text-xs">New Return</button>
                  </div>
                </td></tr>
              ) : (
                filtered.map((r) => {
                  const cfg = STATUS_CONFIG[r.status || "Pending"] || STATUS_CONFIG.Pending;
                  return (
                    <tr key={r.id} className="erp-tr">
                      <td className="erp-td font-mono text-sm font-semibold text-slate-900">{r.returnNumber || "—"}</td>
                      <td className="erp-td text-slate-700">{r.customerName || r.customerId || "—"}</td>
                      <td className="erp-td text-slate-600 font-mono text-xs">{r.originalOrderRef || "—"}</td>
                      <td className="erp-td font-semibold text-slate-900">{formatCurrency(r.amount)}</td>
                      <td className="erp-td"><span className="erp-chip erp-chip-neutral text-xs">{r.reason || "—"}</span></td>
                      <td className="erp-td text-slate-600">{r.returnDate ? new Date(r.returnDate).toLocaleDateString("en-IN") : "—"}</td>
                      <td className="erp-td">
                        <span className={`${cfg.chip} flex w-fit items-center gap-1`}>
                          {cfg.icon}
                          {cfg.label}
                        </span>
                      </td>
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
