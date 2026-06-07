"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, ArrowRight, Package, Truck, CheckCircle, Clock } from "lucide-react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { hrApi } from "@/services/hrApi";
import { notifyError } from "@/lib/notifications";
import { getApiErrorMessage } from "@/lib/api-errors";

type TransferRow = {
  id: string;
  transferNumber?: string;
  fromWarehouseId?: string;
  fromWarehouseName?: string;
  toWarehouseId?: string;
  toWarehouseName?: string;
  itemId?: string;
  itemName?: string;
  itemCode?: string;
  movementType?: string;
  referenceNumber?: string;
  quantity?: number;
  movementDate?: string;
  transferDate?: string;
  createdAt?: string;
  status?: string;
  requestedBy?: string;
  remarks?: string;
  reason?: string;
};

type TransferForm = {
  itemId: string;
  fromWarehouseId: string;
  toWarehouseId: string;
  quantity: number;
  transferDate: string;
  reason: string;
};

const STATUS_CONFIG: Record<string, { chip: string; label: string; icon: React.ReactNode }> = {
  Completed:  { chip: "erp-chip erp-chip-success", label: "Completed",  icon: <CheckCircle className="h-3.5 w-3.5" /> },
  InTransit:  { chip: "erp-chip erp-chip-info",    label: "In Transit", icon: <Truck       className="h-3.5 w-3.5" /> },
  Pending:    { chip: "erp-chip erp-chip-warning",  label: "Pending",   icon: <Clock       className="h-3.5 w-3.5" /> },
  Cancelled:  { chip: "erp-chip erp-chip-danger",   label: "Cancelled", icon: null },
};

export default function InventoryTransfersPage() {
  const [records, setRecords] = useState<TransferRow[]>([]);
  const [items, setItems] = useState<Array<{ id: string; itemCode: string; itemName: string }>>([]);
  const [warehouses, setWarehouses] = useState<Array<{ id: string; warehouseName: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [form, setForm] = useState<TransferForm>({
    itemId: "", fromWarehouseId: "", toWarehouseId: "", quantity: 1, transferDate: new Date().toISOString().split("T")[0], reason: "",
  });

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [movRes, itemsRes, whRes] = await Promise.all([
        hrApi.erp.stockMovements.list(1, 50),
        hrApi.erp.items.getAll(1, 100),
        hrApi.erp.warehouses.list(1, 50),
      ]);
      const movList = Array.isArray(movRes.data) ? movRes.data : Array.isArray(movRes.data?.data) ? movRes.data.data : [];
      const itemList = Array.isArray(itemsRes.data) ? itemsRes.data : Array.isArray(itemsRes.data?.data) ? itemsRes.data.data : [];
      const whList = Array.isArray(whRes.data) ? whRes.data : Array.isArray(whRes.data?.data) ? whRes.data.data : [];

      setItems(itemList);
      setWarehouses(whList);

      // Filter transfer movements
      const transfers: TransferRow[] = movList
        .filter((m: TransferRow) => m.movementType === "Transfer" || (m.fromWarehouseId && m.toWarehouseId))
        .map((m: TransferRow) => ({
          id: m.id,
          transferNumber: m.referenceNumber || `TRF-${m.id?.slice(0, 8)}`,
          fromWarehouseId: m.fromWarehouseId,
          fromWarehouseName: whList.find((w: TransferRow) => w.id === m.fromWarehouseId)?.warehouseName || m.fromWarehouseName,
          toWarehouseId: m.toWarehouseId,
          toWarehouseName: whList.find((w: TransferRow) => w.id === m.toWarehouseId)?.warehouseName || m.toWarehouseName,
          itemId: m.itemId,
          itemName: itemList.find((i: TransferRow) => i.id === m.itemId)?.itemName || m.itemName,
          itemCode: itemList.find((i: TransferRow) => i.id === m.itemId)?.itemCode,
          quantity: m.quantity,
          transferDate: m.movementDate || m.createdAt,
          status: "Completed",
          reason: m.remarks,
        }));
      setRecords(transfers);
    } catch (err) {
      const msg = getApiErrorMessage(err, "Failed to load inventory transfers.");
      setError(msg);
      notifyError(msg, "Inventory Transfers");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.itemId || !form.fromWarehouseId || !form.toWarehouseId || form.quantity <= 0) return;
    if (form.fromWarehouseId === form.toWarehouseId) {
      notifyError("Source and destination warehouses must be different.", "Transfer");
      return;
    }
    try {
      setSaving(true);
      await hrApi.erp.stockMovements.create({
        movementType: "Transfer",
        itemId: form.itemId,
        fromWarehouseId: form.fromWarehouseId,
        warehouseId: form.toWarehouseId,
        quantity: form.quantity,
        movementDate: form.transferDate,
        remarks: form.reason,
        referenceNumber: `TRF-${Date.now()}`,
      });
      setShowForm(false);
      setForm({ itemId: "", fromWarehouseId: "", toWarehouseId: "", quantity: 1, transferDate: new Date().toISOString().split("T")[0], reason: "" });
      void load();
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to create transfer."), "Transfer");
    } finally {
      setSaving(false);
    }
  };

  const filtered = records.filter((r) => {
    const q = search.toLowerCase();
    const matchSearch = !q
      || (r.transferNumber || "").toLowerCase().includes(q)
      || (r.itemName || "").toLowerCase().includes(q)
      || (r.fromWarehouseName || "").toLowerCase().includes(q)
      || (r.toWarehouseName || "").toLowerCase().includes(q);
    const matchStatus = !statusFilter || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const completed = filtered.filter((r) => r.status === "Completed").length;
  const inTransit = filtered.filter((r) => r.status === "InTransit").length;
  const pending   = filtered.filter((r) => r.status === "Pending").length;
  const totalQty  = filtered.reduce((s, r) => s + (r.quantity || 0), 0);

  return (
    <StandardPageLayout
      title="Inventory Transfers"
      subtitle="Move stock between warehouses and locations. Track transfer requests, in-transit quantities, and completion status."
      eyebrow="Inventory / Operations"
      icon="warehouse"
      actions={
        <button type="button" onClick={() => setShowForm((p) => !p)} className="erp-action-btn erp-action-btn-primary">
          <Plus className="h-4 w-4" />
          Create Transfer
        </button>
      }
      filters={
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-48">
            <label className="erp-label">Search</label>
            <input className="erp-input" placeholder="Transfer #, item, warehouse…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div>
            <label className="erp-label">Status</label>
            <select className="erp-select w-36" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All Status</option>
              <option value="Pending">Pending</option>
              <option value="InTransit">In Transit</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
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
          <p className="erp-kpi-label">Total Transfers</p>
          <p className="erp-kpi-value">{filtered.length}</p>
          <p className="erp-kpi-meta">All stock movement records</p>
        </div>
        <div className="erp-kpi-card erp-kpi-card-success">
          <p className="erp-kpi-label">Completed</p>
          <p className="erp-kpi-value erp-kpi-value-success">{completed}</p>
          <p className="erp-kpi-meta">Transfers finalized</p>
        </div>
        <div className="erp-kpi-card erp-kpi-card-info">
          <p className="erp-kpi-label">In Transit</p>
          <p className="erp-kpi-value">{inTransit}</p>
          <p className="erp-kpi-meta">Currently being moved</p>
        </div>
        <div className="erp-kpi-card erp-kpi-card-warning">
          <p className="erp-kpi-label">Pending / Total Qty</p>
          <p className="erp-kpi-value">{pending} / {totalQty.toLocaleString()}</p>
          <p className="erp-kpi-meta">Pending requests and total units</p>
        </div>
      </div>

      {error && <div className="erp-alert-error">{error}</div>}

      {showForm && (
        <div className="erp-panel">
          <div className="erp-panel-header">
            <div>
              <h2 className="erp-panel-title">Create Stock Transfer</h2>
              <p className="mt-1 text-sm text-slate-500">Transfer inventory between warehouses or storage locations.</p>
            </div>
          </div>
          <div className="erp-panel-body">
            <form onSubmit={handleSave} className="space-y-4">
              <div className="erp-form-grid erp-form-grid-2">
                <div className="md:col-span-2">
                  <label className="erp-label">Item</label>
                  <select className="erp-select" value={form.itemId} onChange={(e) => setForm({ ...form, itemId: e.target.value })} required>
                    <option value="">Select item to transfer…</option>
                    {items.map((i) => <option key={i.id} value={i.id}>{i.itemCode} — {i.itemName}</option>)}
                  </select>
                </div>
                <div>
                  <label className="erp-label">From Warehouse</label>
                  <select className="erp-select" value={form.fromWarehouseId} onChange={(e) => setForm({ ...form, fromWarehouseId: e.target.value })} required>
                    <option value="">Source warehouse…</option>
                    {warehouses.map((w) => <option key={w.id} value={w.id}>{w.warehouseName}</option>)}
                  </select>
                </div>
                <div>
                  <label className="erp-label">To Warehouse</label>
                  <select className="erp-select" value={form.toWarehouseId} onChange={(e) => setForm({ ...form, toWarehouseId: e.target.value })} required>
                    <option value="">Destination warehouse…</option>
                    {warehouses.filter((w) => w.id !== form.fromWarehouseId).map((w) => <option key={w.id} value={w.id}>{w.warehouseName}</option>)}
                  </select>
                </div>
                <div>
                  <label className="erp-label">Quantity</label>
                  <input className="erp-input" type="number" min={1} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} required />
                </div>
                <div>
                  <label className="erp-label">Transfer Date</label>
                  <input className="erp-input" type="date" value={form.transferDate} onChange={(e) => setForm({ ...form, transferDate: e.target.value })} required />
                </div>
                <div className="md:col-span-2">
                  <label className="erp-label">Reason / Notes</label>
                  <textarea className="erp-input" rows={2} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="Business reason for transfer…" />
                </div>
              </div>
              <div className="erp-form-actions">
                <button type="button" onClick={() => setShowForm(false)} className="erp-action-btn erp-action-btn-secondary">Cancel</button>
                <button type="submit" disabled={saving} className="erp-action-btn erp-action-btn-primary">{saving ? "Creating…" : "Create Transfer"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="erp-panel">
        <div className="erp-panel-header">
          <div>
            <h2 className="erp-panel-title">Transfer Log</h2>
            <p className="mt-1 text-sm text-slate-500">{filtered.length} transfer records</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="erp-table">
            <thead className="erp-thead">
              <tr>
                <th className="erp-th">Transfer #</th>
                <th className="erp-th">Item</th>
                <th className="erp-th">Route</th>
                <th className="erp-th text-right">Qty</th>
                <th className="erp-th">Date</th>
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
                    <Package className="h-10 w-10 text-slate-300" />
                    <p className="text-sm text-slate-400">No inventory transfers found.</p>
                    <button type="button" onClick={() => setShowForm(true)} className="erp-action-btn erp-action-btn-secondary text-xs">Create Transfer</button>
                  </div>
                </td></tr>
              ) : (
                filtered.map((r) => {
                  const cfg = STATUS_CONFIG[r.status || "Completed"] || STATUS_CONFIG.Completed;
                  return (
                    <tr key={r.id} className="erp-tr">
                      <td className="erp-td font-mono text-xs font-semibold text-slate-700">{r.transferNumber || "—"}</td>
                      <td className="erp-td">
                        <p className="font-semibold text-slate-900">{r.itemName || "—"}</p>
                        {r.itemCode && <p className="text-xs text-slate-500">{r.itemCode}</p>}
                      </td>
                      <td className="erp-td">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-slate-700">{r.fromWarehouseName || "—"}</span>
                          <ArrowRight className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                          <span className="rounded-md bg-blue-50 px-2 py-0.5 text-blue-700">{r.toWarehouseName || "—"}</span>
                        </div>
                      </td>
                      <td className="erp-td text-right font-semibold text-slate-900">{r.quantity || 0}</td>
                      <td className="erp-td text-slate-600">{r.transferDate ? new Date(r.transferDate).toLocaleDateString("en-IN") : "—"}</td>
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
