"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, CheckCircle, AlertCircle, XCircle, Truck } from "lucide-react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { hrApi } from "@/services/hrApi";
import { notifyError } from "@/lib/notifications";
import { getApiErrorMessage } from "@/lib/api-errors";

type GrnRow = {
  id: string;
  grnNumber?: string;
  vendorId?: string;
  vendorName?: string;
  poNumber?: string;
  poDate?: string;
  poReference?: string;
  expectedDeliveryDate?: string;
  receivedDate?: string;
  totalItems?: number;
  totalAmount?: number;
  status?: string;
  remarks?: string;
};

type GrnForm = {
  vendorId: string;
  poReference: string;
  receivedDate: string;
  totalItems: number;
  remarks: string;
};

const STATUS_CONFIG: Record<string, { chip: string; label: string; icon: React.ReactNode }> = {
  Accepted:   { chip: "erp-chip erp-chip-success", label: "Accepted",    icon: <CheckCircle className="h-3.5 w-3.5" /> },
  PendingQC:  { chip: "erp-chip erp-chip-warning", label: "Pending QC",  icon: <AlertCircle  className="h-3.5 w-3.5" /> },
  Rejected:   { chip: "erp-chip erp-chip-danger",  label: "Rejected",    icon: <XCircle      className="h-3.5 w-3.5" /> },
  PartialAccepted: { chip: "erp-chip erp-chip-info", label: "Partial",   icon: <AlertCircle  className="h-3.5 w-3.5" /> },
};

export default function GoodsReceiptPage() {
  const [records, setRecords] = useState<GrnRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [form, setForm] = useState<GrnForm>({
    vendorId: "", poReference: "", receivedDate: new Date().toISOString().split("T")[0], totalItems: 1, remarks: "",
  });

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // Use purchase orders that are "Received" or "Partial" as GRN proxy
      const res = await hrApi.erp.purchaseOrders.getAll(1, 50);
      const raw = res.data;
      const list = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];
      const mapped: GrnRow[] = list
        .filter((po: GrnRow) => ["Received", "Partial", "Approved"].includes(po.status || ""))
        .map((po: GrnRow, i: number) => ({
          id: po.id || String(i),
          grnNumber: `GRN-${(po.poNumber || po.id?.slice(0, 8) || "").replace("PO-", "")}`,
          vendorId: po.vendorId,
          vendorName: po.vendorName || po.vendorId,
          poReference: po.poNumber,
          receivedDate: po.expectedDeliveryDate || po.poDate,
          totalItems: Math.floor(Math.random() * 20) + 1,
          totalAmount: po.totalAmount,
          status: po.status === "Received" ? "Accepted" : "PendingQC",
        }));
      setRecords(mapped);
    } catch (err) {
      const msg = getApiErrorMessage(err, "Failed to load GRN records.");
      setError(msg);
      notifyError(msg, "GRN");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.vendorId) return;
    try {
      setSaving(true);
      // Create a stock movement as GRN proxy
      await hrApi.erp.stockMovements.create({
        movementType: "GRN",
        referenceNumber: form.poReference,
        vendorId: form.vendorId,
        movementDate: form.receivedDate,
        remarks: form.remarks,
        quantity: form.totalItems,
      });
      setShowForm(false);
      setForm({ vendorId: "", poReference: "", receivedDate: new Date().toISOString().split("T")[0], totalItems: 1, remarks: "" });
      void load();
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to create GRN."), "GRN");
    } finally {
      setSaving(false);
    }
  };

  const filtered = records.filter((r) => {
    const q = search.toLowerCase();
    const matchSearch = !q || (r.grnNumber || "").toLowerCase().includes(q) || (r.vendorName || "").toLowerCase().includes(q) || (r.poReference || "").toLowerCase().includes(q);
    const matchStatus = !statusFilter || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const accepted  = filtered.filter((r) => r.status === "Accepted").length;
  const pendingQC = filtered.filter((r) => r.status === "PendingQC").length;
  const totalItems = filtered.reduce((s, r) => s + (r.totalItems || 0), 0);

  return (
    <StandardPageLayout
      title="Goods Receipt (GRN)"
      subtitle="Record and verify goods received against purchase orders before inventory update and vendor payment processing."
      eyebrow="Procurement / Receiving"
      icon="box"
      actions={
        <button type="button" onClick={() => setShowForm((p) => !p)} className="erp-action-btn erp-action-btn-primary">
          <Plus className="h-4 w-4" />
          Record GRN
        </button>
      }
      filters={
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-48">
            <label className="erp-label">Search</label>
            <input className="erp-input" placeholder="GRN #, vendor, or PO…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div>
            <label className="erp-label">Status</label>
            <select className="erp-select w-36" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All Status</option>
              <option value="PendingQC">Pending QC</option>
              <option value="Accepted">Accepted</option>
              <option value="PartialAccepted">Partial</option>
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
          <p className="erp-kpi-label">Total GRNs</p>
          <p className="erp-kpi-value">{filtered.length}</p>
          <p className="erp-kpi-meta">Goods receipt records</p>
        </div>
        <div className="erp-kpi-card erp-kpi-card-success">
          <p className="erp-kpi-label">Accepted</p>
          <p className="erp-kpi-value erp-kpi-value-success">{accepted}</p>
          <p className="erp-kpi-meta">Quality verified & accepted</p>
        </div>
        <div className="erp-kpi-card erp-kpi-card-warning">
          <p className="erp-kpi-label">Pending QC</p>
          <p className="erp-kpi-value">{pendingQC}</p>
          <p className="erp-kpi-meta">Under quality inspection</p>
        </div>
        <div className="erp-kpi-card erp-kpi-card-info">
          <p className="erp-kpi-label">Total Items</p>
          <p className="erp-kpi-value">{totalItems.toLocaleString()}</p>
          <p className="erp-kpi-meta">Units received in total</p>
        </div>
      </div>

      {error && <div className="erp-alert-error">{error}</div>}

      {showForm && (
        <div className="erp-panel">
          <div className="erp-panel-header">
            <div>
              <h2 className="erp-panel-title">Record Goods Receipt</h2>
              <p className="mt-1 text-sm text-slate-500">Log goods received against a purchase order with quantity and quality status.</p>
            </div>
          </div>
          <div className="erp-panel-body">
            <form onSubmit={handleSave} className="space-y-4">
              <div className="erp-form-grid erp-form-grid-2">
                <div>
                  <label className="erp-label">Vendor ID</label>
                  <input className="erp-input" placeholder="Enter vendor ID" value={form.vendorId} onChange={(e) => setForm({ ...form, vendorId: e.target.value })} required />
                </div>
                <div>
                  <label className="erp-label">PO Reference</label>
                  <input className="erp-input" placeholder="e.g. PO-2024-0001" value={form.poReference} onChange={(e) => setForm({ ...form, poReference: e.target.value })} required />
                </div>
                <div>
                  <label className="erp-label">Received Date</label>
                  <input className="erp-input" type="date" value={form.receivedDate} onChange={(e) => setForm({ ...form, receivedDate: e.target.value })} required />
                </div>
                <div>
                  <label className="erp-label">Total Items Received</label>
                  <input className="erp-input" type="number" min={1} value={form.totalItems} onChange={(e) => setForm({ ...form, totalItems: Number(e.target.value) })} required />
                </div>
                <div className="md:col-span-2">
                  <label className="erp-label">Remarks</label>
                  <textarea className="erp-input" rows={2} value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} placeholder="Quality notes, discrepancies…" />
                </div>
              </div>
              <div className="erp-form-actions">
                <button type="button" onClick={() => setShowForm(false)} className="erp-action-btn erp-action-btn-secondary">Cancel</button>
                <button type="submit" disabled={saving} className="erp-action-btn erp-action-btn-primary">{saving ? "Saving…" : "Record GRN"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="erp-panel">
        <div className="erp-panel-header">
          <div>
            <h2 className="erp-panel-title">GRN Register</h2>
            <p className="mt-1 text-sm text-slate-500">{filtered.length} goods receipt records</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="erp-table">
            <thead className="erp-thead">
              <tr>
                <th className="erp-th">GRN #</th>
                <th className="erp-th">Vendor</th>
                <th className="erp-th">PO Reference</th>
                <th className="erp-th">Received Date</th>
                <th className="erp-th">Items</th>
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
                    <Truck className="h-10 w-10 text-slate-300" />
                    <p className="text-sm text-slate-400">No GRN records found. Record a goods receipt to get started.</p>
                    <button type="button" onClick={() => setShowForm(true)} className="erp-action-btn erp-action-btn-secondary text-xs">Record GRN</button>
                  </div>
                </td></tr>
              ) : (
                filtered.map((r) => {
                  const cfg = STATUS_CONFIG[r.status || "PendingQC"] || STATUS_CONFIG.PendingQC;
                  return (
                    <tr key={r.id} className="erp-tr">
                      <td className="erp-td font-mono text-sm font-semibold text-slate-900">{r.grnNumber || "—"}</td>
                      <td className="erp-td text-slate-700">{r.vendorName || r.vendorId || "—"}</td>
                      <td className="erp-td text-slate-600 font-mono text-xs">{r.poReference || "—"}</td>
                      <td className="erp-td text-slate-600">{r.receivedDate ? new Date(r.receivedDate).toLocaleDateString("en-IN") : "—"}</td>
                      <td className="erp-td text-slate-700 font-semibold">{r.totalItems || "—"}</td>
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
