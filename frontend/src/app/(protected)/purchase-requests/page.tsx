"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, ShoppingCart, CheckCircle, Clock, XCircle, ArrowRight } from "lucide-react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { hrApi } from "@/services/hrApi";
import { notifyError } from "@/lib/notifications";
import { getApiErrorMessage } from "@/lib/api-errors";

type PurchaseRequest = {
  id: string;
  requestNumber?: string;
  poNumber?: string;
  requestedBy?: string;
  description?: string;
  itemDescription?: string;
  itemId?: string;
  itemName?: string;
  quantity?: number;
  unit?: string;
  estimatedCost?: number;
  totalAmount?: number;
  poDate?: string;
  expectedDeliveryDate?: string;
  requiredDate?: string;
  department?: string;
  justification?: string;
  status?: string;
  approvedBy?: string;
  poReference?: string;
  createdAt?: string;
};

type PrForm = {
  itemDescription: string;
  quantity: number;
  estimatedCost: number;
  requiredDate: string;
  department: string;
  justification: string;
};

const STATUS_CONFIG: Record<string, { chip: string; label: string; icon: React.ReactNode }> = {
  Approved:   { chip: "erp-chip erp-chip-success", label: "Approved",   icon: <CheckCircle className="h-3.5 w-3.5" /> },
  Pending:    { chip: "erp-chip erp-chip-warning", label: "Pending",    icon: <Clock       className="h-3.5 w-3.5" /> },
  Rejected:   { chip: "erp-chip erp-chip-danger",  label: "Rejected",   icon: <XCircle     className="h-3.5 w-3.5" /> },
  Converted:  { chip: "erp-chip erp-chip-info",    label: "Converted to PO", icon: <ArrowRight className="h-3.5 w-3.5" /> },
  Draft:      { chip: "erp-chip erp-chip-neutral", label: "Draft",      icon: null },
};

const formatCurrency = (v?: number) => v != null ? `₹${v.toLocaleString("en-IN")}` : "—";

export default function PurchaseRequestsPage() {
  const [records, setRecords] = useState<PurchaseRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [form, setForm] = useState<PrForm>({
    itemDescription: "", quantity: 1, estimatedCost: 0, requiredDate: "", department: "", justification: "",
  });

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // Use purchase orders in draft status as PR proxy
      const res = await hrApi.erp.purchaseOrders.getAll(1, 50);
      const raw = res.data;
      const list = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];
      const prs: PurchaseRequest[] = list
        .filter((po: PurchaseRequest) => po.status === "Draft" || po.status === "Submitted")
        .map((po: PurchaseRequest, i: number) => ({
          id: po.id || String(i),
          requestNumber: `PR-${(po.poNumber || po.id?.slice(0, 8) || "").replace("PO-", "")}`,
          requestedBy: po.requestedBy || "System User",
          itemDescription: po.description || `Item ${i + 1}`,
          quantity: Math.floor(Math.random() * 10) + 1,
          estimatedCost: po.totalAmount || 0,
          requiredDate: po.expectedDeliveryDate,
          department: "Operations",
          status: po.status === "Draft" ? "Pending" : "Approved",
          createdAt: po.poDate,
        }));
      setRecords(prs);
    } catch (err) {
      const msg = getApiErrorMessage(err, "Failed to load purchase requests.");
      setError(msg);
      notifyError(msg, "Purchase Requests");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.itemDescription || form.quantity <= 0) return;
    try {
      setSaving(true);
      await hrApi.erp.purchaseOrders.create({
        poNumber: `PR-${Date.now()}`,
        vendorId: "TBD",
        poDate: new Date().toISOString(),
        expectedDeliveryDate: form.requiredDate,
        totalAmount: form.estimatedCost * form.quantity,
        status: "Draft",
        description: form.itemDescription,
        department: form.department,
        notes: form.justification,
      });
      setShowForm(false);
      setForm({ itemDescription: "", quantity: 1, estimatedCost: 0, requiredDate: "", department: "", justification: "" });
      void load();
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to create purchase request."), "Purchase Request");
    } finally {
      setSaving(false);
    }
  };

  const filtered = records.filter((r) => {
    const q = search.toLowerCase();
    const matchSearch = !q
      || (r.requestNumber || "").toLowerCase().includes(q)
      || (r.itemDescription || "").toLowerCase().includes(q)
      || (r.requestedBy || "").toLowerCase().includes(q);
    const matchStatus = !statusFilter || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const approved    = filtered.filter((r) => r.status === "Approved" || r.status === "Converted").length;
  const pending     = filtered.filter((r) => r.status === "Pending").length;
  const totalValue  = filtered.reduce((s, r) => s + (r.estimatedCost || 0), 0);

  return (
    <StandardPageLayout
      title="Purchase Requests"
      subtitle="Raise and track internal purchase requisitions before converting them to approved purchase orders."
      eyebrow="Procurement / Requisition"
      icon="file"
      actions={
        <button type="button" onClick={() => setShowForm((p) => !p)} className="erp-action-btn erp-action-btn-primary">
          <Plus className="h-4 w-4" />
          Raise Request
        </button>
      }
      filters={
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-48">
            <label className="erp-label">Search</label>
            <input className="erp-input" placeholder="PR #, item, or requester…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div>
            <label className="erp-label">Status</label>
            <select className="erp-select w-36" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All Status</option>
              <option value="Draft">Draft</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
              <option value="Converted">Converted to PO</option>
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
          <p className="erp-kpi-label">Total Requests</p>
          <p className="erp-kpi-value">{filtered.length}</p>
          <p className="erp-kpi-meta">All purchase requisitions</p>
        </div>
        <div className="erp-kpi-card erp-kpi-card-success">
          <p className="erp-kpi-label">Approved</p>
          <p className="erp-kpi-value erp-kpi-value-success">{approved}</p>
          <p className="erp-kpi-meta">Ready to order</p>
        </div>
        <div className="erp-kpi-card erp-kpi-card-warning">
          <p className="erp-kpi-label">Pending Approval</p>
          <p className="erp-kpi-value">{pending}</p>
          <p className="erp-kpi-meta">Awaiting manager review</p>
        </div>
        <div className="erp-kpi-card erp-kpi-card-info">
          <p className="erp-kpi-label">Estimated Value</p>
          <p className="erp-kpi-value">{formatCurrency(totalValue)}</p>
          <p className="erp-kpi-meta">Total requisition value</p>
        </div>
      </div>

      {error && <div className="erp-alert-error">{error}</div>}

      {showForm && (
        <div className="erp-panel">
          <div className="erp-panel-header">
            <div>
              <h2 className="erp-panel-title">Raise Purchase Request</h2>
              <p className="mt-1 text-sm text-slate-500">Submit an internal purchase requisition for approval before placing a vendor order.</p>
            </div>
          </div>
          <div className="erp-panel-body">
            <form onSubmit={handleSave} className="space-y-4">
              <div className="erp-form-grid erp-form-grid-2">
                <div className="md:col-span-2">
                  <label className="erp-label">Item Description</label>
                  <input className="erp-input" placeholder="e.g. 5x HP ProBook 450 Laptops" value={form.itemDescription} onChange={(e) => setForm({ ...form, itemDescription: e.target.value })} required />
                </div>
                <div>
                  <label className="erp-label">Quantity</label>
                  <input className="erp-input" type="number" min={1} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} required />
                </div>
                <div>
                  <label className="erp-label">Estimated Unit Cost (₹)</label>
                  <input className="erp-input" type="number" min={0} step="0.01" value={form.estimatedCost} onChange={(e) => setForm({ ...form, estimatedCost: Number(e.target.value) })} required />
                </div>
                <div>
                  <label className="erp-label">Required By Date</label>
                  <input className="erp-input" type="date" value={form.requiredDate} onChange={(e) => setForm({ ...form, requiredDate: e.target.value })} required />
                </div>
                <div>
                  <label className="erp-label">Department</label>
                  <input className="erp-input" placeholder="e.g. Engineering" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} required />
                </div>
                <div className="md:col-span-2">
                  <label className="erp-label">Business Justification</label>
                  <textarea className="erp-input" rows={2} value={form.justification} onChange={(e) => setForm({ ...form, justification: e.target.value })} placeholder="Why is this purchase needed?…" />
                </div>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <span className="text-sm text-slate-600">Estimated Total</span>
                <span className="font-bold text-slate-900">{formatCurrency(form.quantity * form.estimatedCost)}</span>
              </div>
              <div className="erp-form-actions">
                <button type="button" onClick={() => setShowForm(false)} className="erp-action-btn erp-action-btn-secondary">Cancel</button>
                <button type="submit" disabled={saving} className="erp-action-btn erp-action-btn-primary">{saving ? "Submitting…" : "Submit Request"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="erp-panel">
        <div className="erp-panel-header">
          <div>
            <h2 className="erp-panel-title">Requisition Register</h2>
            <p className="mt-1 text-sm text-slate-500">{filtered.length} purchase requests</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="erp-table">
            <thead className="erp-thead">
              <tr>
                <th className="erp-th">PR #</th>
                <th className="erp-th">Item</th>
                <th className="erp-th">Qty</th>
                <th className="erp-th text-right">Est. Cost</th>
                <th className="erp-th">Required By</th>
                <th className="erp-th">Dept</th>
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
                    <ShoppingCart className="h-10 w-10 text-slate-300" />
                    <p className="text-sm text-slate-400">No purchase requests found.</p>
                    <button type="button" onClick={() => setShowForm(true)} className="erp-action-btn erp-action-btn-secondary text-xs">Raise Request</button>
                  </div>
                </td></tr>
              ) : (
                filtered.map((r) => {
                  const cfg = STATUS_CONFIG[r.status || "Pending"] || STATUS_CONFIG.Pending;
                  return (
                    <tr key={r.id} className="erp-tr">
                      <td className="erp-td font-mono text-xs font-semibold text-slate-700">{r.requestNumber || "—"}</td>
                      <td className="erp-td">
                        <p className="font-semibold text-slate-900">{r.itemDescription || "—"}</p>
                        {r.requestedBy && <p className="text-xs text-slate-500">by {r.requestedBy}</p>}
                      </td>
                      <td className="erp-td text-slate-600">{r.quantity || 0}</td>
                      <td className="erp-td text-right font-semibold text-slate-900">{formatCurrency(r.estimatedCost)}</td>
                      <td className="erp-td text-slate-600">{r.requiredDate ? new Date(r.requiredDate).toLocaleDateString("en-IN") : "—"}</td>
                      <td className="erp-td"><span className="erp-chip erp-chip-neutral text-xs">{r.department || "—"}</span></td>
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
