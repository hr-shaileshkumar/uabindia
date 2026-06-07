"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, FileText } from "lucide-react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { hrApi } from "@/services/hrApi";
import { notifyError } from "@/lib/notifications";
import { getApiErrorMessage } from "@/lib/api-errors";

type QuotationRow = {
  id: string;
  quoteNumber?: string;
  customerId?: string;
  customerName?: string;
  amount?: number;
  validUntil?: string;
  createdDate?: string;
  status?: string;
  notes?: string;
  soNumber?: string;
  totalAmount?: number;
  expectedDeliveryDate?: string;
  soDate?: string;
};

type QuoteForm = {
  customerId: string;
  amount: number;
  validUntil: string;
  notes: string;
};

const STATUS_CONFIG: Record<string, { chip: string; label: string }> = {
  Draft:    { chip: "erp-chip erp-chip-neutral", label: "Draft"    },
  Sent:     { chip: "erp-chip erp-chip-info",    label: "Sent"     },
  Pending:  { chip: "erp-chip erp-chip-warning", label: "Pending"  },
  Accepted: { chip: "erp-chip erp-chip-success", label: "Accepted" },
  Rejected: { chip: "erp-chip erp-chip-danger",  label: "Rejected" },
  Expired:  { chip: "erp-chip erp-chip-neutral", label: "Expired"  },
};

const formatCurrency = (v?: number) => v != null ? `₹${v.toLocaleString("en-IN")}` : "—";

export default function QuotationsPage() {
  const [records, setRecords] = useState<QuotationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [form, setForm] = useState<QuoteForm>({
    customerId: "", amount: 0, validUntil: "", notes: "",
  });

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // Use customers as base, create quote-like view from sales orders
      const res = await hrApi.erp.salesOrders.getAll(1, 50);
      const raw = res.data;
      const list = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];
      const mapped: QuotationRow[] = list
        .filter((so: QuotationRow) => so.status === "Draft")
        .map((so: QuotationRow) => ({
          id: so.id,
          quoteNumber: `QT-${(so.soNumber || so.id?.slice(0, 8) || "").replace("SO-", "")}`,
          customerId: so.customerId,
          customerName: so.customerName || so.customerId,
          amount: so.totalAmount,
          validUntil: so.expectedDeliveryDate,
          createdDate: so.soDate,
          status: "Pending",
          notes: so.notes,
        }));
      setRecords(mapped);
    } catch (err) {
      const msg = getApiErrorMessage(err, "Failed to load quotations.");
      setError(msg);
      notifyError(msg, "Quotations");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customerId || form.amount <= 0) return;
    try {
      setSaving(true);
      await hrApi.erp.salesOrders.create({
        soNumber: `QT-${Date.now()}`,
        customerId: form.customerId,
        soDate: new Date().toISOString(),
        expectedDeliveryDate: form.validUntil,
        totalAmount: form.amount,
        status: "Draft",
        notes: form.notes,
      });
      setShowForm(false);
      setForm({ customerId: "", amount: 0, validUntil: "", notes: "" });
      void load();
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to create quotation."), "Quotation");
    } finally {
      setSaving(false);
    }
  };

  const filtered = records.filter((r) => {
    const q = search.toLowerCase();
    const matchSearch = !q || (r.quoteNumber || "").toLowerCase().includes(q) || (r.customerName || "").toLowerCase().includes(q);
    const matchStatus = !statusFilter || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const accepted    = filtered.filter((r) => r.status === "Accepted").length;
  const pending     = filtered.filter((r) => r.status === "Pending" || r.status === "Sent").length;
  const pipelineVal = filtered.filter((r) => ["Pending", "Sent"].includes(r.status || "")).reduce((s, r) => s + (r.amount || 0), 0);
  const convRate    = filtered.length ? Math.round((accepted / filtered.length) * 100) : 0;

  return (
    <StandardPageLayout
      title="Quotations"
      subtitle="Create and manage sales quotations, pricing proposals, and track conversion to confirmed sales orders."
      eyebrow="Sales / Sales Process"
      icon="file"
      actions={
        <button type="button" onClick={() => setShowForm((p) => !p)} className="erp-action-btn erp-action-btn-primary">
          <Plus className="h-4 w-4" />
          New Quotation
        </button>
      }
      filters={
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-48">
            <label className="erp-label">Search</label>
            <input className="erp-input" placeholder="Quote # or customer…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div>
            <label className="erp-label">Status</label>
            <select className="erp-select w-36" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All Status</option>
              <option value="Draft">Draft</option>
              <option value="Sent">Sent</option>
              <option value="Pending">Pending</option>
              <option value="Accepted">Accepted</option>
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
          <p className="erp-kpi-label">Total Quotations</p>
          <p className="erp-kpi-value">{filtered.length}</p>
          <p className="erp-kpi-meta">All active proposals</p>
        </div>
        <div className="erp-kpi-card erp-kpi-card-success">
          <p className="erp-kpi-label">Accepted</p>
          <p className="erp-kpi-value erp-kpi-value-success">{accepted}</p>
          <p className="erp-kpi-meta">Converted to sales orders</p>
        </div>
        <div className="erp-kpi-card erp-kpi-card-warning">
          <p className="erp-kpi-label">Pending ({pending})</p>
          <p className="erp-kpi-value">{formatCurrency(pipelineVal)}</p>
          <p className="erp-kpi-meta">Open quote pipeline value</p>
        </div>
        <div className="erp-kpi-card erp-kpi-card-info">
          <p className="erp-kpi-label">Conversion Rate</p>
          <p className="erp-kpi-value">{convRate}%</p>
          <p className="erp-kpi-meta">Quote to order conversion</p>
        </div>
      </div>

      {error && <div className="erp-alert-error">{error}</div>}

      {showForm && (
        <div className="erp-panel">
          <div className="erp-panel-header">
            <div>
              <h2 className="erp-panel-title">Create Quotation</h2>
              <p className="mt-1 text-sm text-slate-500">Prepare a pricing proposal for a customer with validity period.</p>
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
                  <label className="erp-label">Quote Amount (₹)</label>
                  <input className="erp-input" type="number" min={0} step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} required />
                </div>
                <div>
                  <label className="erp-label">Valid Until</label>
                  <input className="erp-input" type="date" value={form.validUntil} onChange={(e) => setForm({ ...form, validUntil: e.target.value })} required />
                </div>
                <div className="md:col-span-2">
                  <label className="erp-label">Notes / Terms</label>
                  <textarea className="erp-input" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                </div>
              </div>
              <div className="erp-form-actions">
                <button type="button" onClick={() => setShowForm(false)} className="erp-action-btn erp-action-btn-secondary">Cancel</button>
                <button type="submit" disabled={saving} className="erp-action-btn erp-action-btn-primary">{saving ? "Creating…" : "Create Quotation"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="erp-panel">
        <div className="erp-panel-header">
          <div>
            <h2 className="erp-panel-title">Quotation Register</h2>
            <p className="mt-1 text-sm text-slate-500">{filtered.length} quotations</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="erp-table">
            <thead className="erp-thead">
              <tr>
                <th className="erp-th">Quote #</th>
                <th className="erp-th">Customer</th>
                <th className="erp-th">Amount</th>
                <th className="erp-th">Created</th>
                <th className="erp-th">Valid Until</th>
                <th className="erp-th">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}><td colSpan={6} className="erp-td"><div className="h-4 animate-pulse rounded bg-slate-100" /></td></tr>
                ))
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="erp-td py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <FileText className="h-10 w-10 text-slate-300" />
                    <p className="text-sm text-slate-400">No quotations found. Create one to get started.</p>
                    <button type="button" onClick={() => setShowForm(true)} className="erp-action-btn erp-action-btn-secondary text-xs">New Quotation</button>
                  </div>
                </td></tr>
              ) : (
                filtered.map((r) => {
                  const cfg = STATUS_CONFIG[r.status || "Draft"] || STATUS_CONFIG.Draft;
                  const isExpired = r.validUntil && new Date(r.validUntil) < new Date();
                  return (
                    <tr key={r.id} className="erp-tr">
                      <td className="erp-td font-mono text-sm font-semibold text-slate-900">{r.quoteNumber || "—"}</td>
                      <td className="erp-td text-slate-700">{r.customerName || r.customerId || "—"}</td>
                      <td className="erp-td font-semibold text-slate-900">{formatCurrency(r.amount)}</td>
                      <td className="erp-td text-slate-600">{r.createdDate ? new Date(r.createdDate).toLocaleDateString("en-IN") : "—"}</td>
                      <td className="erp-td">
                        <span className={isExpired ? "text-red-600 font-semibold" : "text-slate-600"}>
                          {r.validUntil ? new Date(r.validUntil).toLocaleDateString("en-IN") : "—"}
                          {isExpired && <span className="ml-1 text-xs">⚠ Expired</span>}
                        </span>
                      </td>
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
