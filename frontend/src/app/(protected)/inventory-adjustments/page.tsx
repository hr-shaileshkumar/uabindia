"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Settings } from "lucide-react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { hrApi } from "@/services/hrApi";
import { notifyError } from "@/lib/notifications";
import { getApiErrorMessage } from "@/lib/api-errors";

type AdjustmentRow = {
  id: string;
  adjustmentNumber?: string;
  itemId?: string;
  itemName?: string;
  itemCode?: string;
  warehouseId?: string;
  warehouseName?: string;
  movementType?: string;
  referenceNumber?: string;
  adjustmentType?: "Positive" | "Negative" | "WriteOff" | "Damage";
  quantity?: number;
  remarks?: string;
  reason?: string;
  movementDate?: string;
  adjustedBy?: string;
  adjustmentDate?: string;
  createdAt?: string;
  status?: string;
};

type AdjustmentForm = {
  itemId: string;
  warehouseId: string;
  adjustmentType: string;
  quantity: number;
  reason: string;
  adjustmentDate: string;
};

const STATUS_CONFIG: Record<string, { chip: string; label: string }> = {
  Approved: { chip: "erp-chip erp-chip-success", label: "Approved" },
  Pending:  { chip: "erp-chip erp-chip-warning", label: "Pending"  },
  Rejected: { chip: "erp-chip erp-chip-danger",  label: "Rejected" },
  Draft:    { chip: "erp-chip erp-chip-neutral", label: "Draft"    },
};

const ADJUSTMENT_TYPES = [
  { value: "Positive",  label: "Positive Adjustment (+)", icon: "↑" },
  { value: "Negative",  label: "Negative Adjustment (-)", icon: "↓" },
  { value: "WriteOff",  label: "Write-Off",               icon: "✕" },
  { value: "Damage",    label: "Damage",                  icon: "!" },
  { value: "Expiry",    label: "Expiry",                  icon: "⏱" },
];

const ADJUSTMENT_REASONS = [
  "Physical Count Discrepancy",
  "Damaged Goods",
  "Expired Stock",
  "Theft / Shrinkage",
  "System Error Correction",
  "Opening Stock Entry",
  "Quality Rejection",
  "Other",
];

export default function InventoryAdjustmentsPage() {
  const [records, setRecords] = useState<AdjustmentRow[]>([]);
  const [items, setItems] = useState<Array<{ id: string; itemCode: string; itemName: string }>>([]);
  const [warehouses, setWarehouses] = useState<Array<{ id: string; warehouseName: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [typeFilter, setTypeFilter] = useState("");
  const [form, setForm] = useState<AdjustmentForm>({
    itemId: "", warehouseId: "", adjustmentType: "Positive", quantity: 1, reason: "Physical Count Discrepancy", adjustmentDate: new Date().toISOString().split("T")[0],
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

      // Filter adjustments from stock movements
      const adjustments: AdjustmentRow[] = movList
        .filter((m: AdjustmentRow) => m.movementType === "Adjustment" || m.movementType === "WriteOff")
        .map((m: AdjustmentRow) => ({
          id: m.id,
          adjustmentNumber: m.referenceNumber || `ADJ-${m.id?.slice(0, 8)}`,
          itemId: m.itemId,
          itemName: itemList.find((i: AdjustmentRow) => i.id === m.itemId)?.itemName || m.itemName,
          itemCode: itemList.find((i: AdjustmentRow) => i.id === m.itemId)?.itemCode,
          warehouseId: m.warehouseId,
          warehouseName: whList.find((w: AdjustmentRow) => w.id === m.warehouseId)?.warehouseName || m.warehouseName,
          adjustmentType: m.adjustmentType || ((m.quantity || 0) > 0 ? "Positive" : "Negative"),
          quantity: m.quantity,
          reason: m.remarks || m.reason,
          adjustmentDate: m.movementDate || m.createdAt,
          status: "Approved",
        }));
      setRecords(adjustments);
    } catch (err) {
      const msg = getApiErrorMessage(err, "Failed to load inventory adjustments.");
      setError(msg);
      notifyError(msg, "Inventory Adjustments");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.itemId || !form.warehouseId || form.quantity <= 0) return;
    try {
      setSaving(true);
      await hrApi.erp.stockMovements.create({
        movementType: "Adjustment",
        itemId: form.itemId,
        warehouseId: form.warehouseId,
        quantity: form.adjustmentType === "Negative" || form.adjustmentType === "WriteOff" ? -form.quantity : form.quantity,
        movementDate: form.adjustmentDate,
        remarks: form.reason,
        adjustmentType: form.adjustmentType,
        referenceNumber: `ADJ-${Date.now()}`,
      });
      setShowForm(false);
      setForm({ itemId: "", warehouseId: "", adjustmentType: "Positive", quantity: 1, reason: "Physical Count Discrepancy", adjustmentDate: new Date().toISOString().split("T")[0] });
      void load();
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to create adjustment."), "Adjustment");
    } finally {
      setSaving(false);
    }
  };

  const filtered = records.filter((r) => !typeFilter || r.adjustmentType === typeFilter);
  const positiveAdj = filtered.filter((r) => r.adjustmentType === "Positive").length;
  const negativeAdj = filtered.filter((r) => ["Negative", "WriteOff", "Damage"].includes(r.adjustmentType || "")).length;
  const totalQty    = filtered.reduce((s, r) => s + Math.abs(r.quantity || 0), 0);

  return (
    <StandardPageLayout
      title="Inventory Adjustments"
      subtitle="Record stock adjustments for count discrepancies, damage, write-offs, and expiry. All adjustments require reason codes."
      eyebrow="Inventory / Operations"
      icon="warehouse"
      actions={
        <button type="button" onClick={() => setShowForm((p) => !p)} className="erp-action-btn erp-action-btn-primary">
          <Plus className="h-4 w-4" />
          New Adjustment
        </button>
      }
      filters={
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="erp-label">Adjustment Type</label>
            <select className="erp-select w-44" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <option value="">All Types</option>
              {ADJUSTMENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          {typeFilter && (
            <button type="button" onClick={() => setTypeFilter("")} className="erp-action-btn erp-action-btn-secondary">Clear</button>
          )}
        </div>
      }
    >
      <div className="erp-kpi-grid">
        <div className="erp-kpi-card">
          <p className="erp-kpi-label">Total Adjustments</p>
          <p className="erp-kpi-value">{filtered.length}</p>
          <p className="erp-kpi-meta">Stock correction events</p>
        </div>
        <div className="erp-kpi-card erp-kpi-card-success">
          <p className="erp-kpi-label">Positive</p>
          <p className="erp-kpi-value erp-kpi-value-success">{positiveAdj}</p>
          <p className="erp-kpi-meta">Stock additions</p>
        </div>
        <div className="erp-kpi-card erp-kpi-card-danger">
          <p className="erp-kpi-label">Negative / Write-Off</p>
          <p className="erp-kpi-value">{negativeAdj}</p>
          <p className="erp-kpi-meta">Stock reductions</p>
        </div>
        <div className="erp-kpi-card erp-kpi-card-info">
          <p className="erp-kpi-label">Total Qty Adjusted</p>
          <p className="erp-kpi-value">{totalQty.toLocaleString()}</p>
          <p className="erp-kpi-meta">Units across all adjustments</p>
        </div>
      </div>

      {error && <div className="erp-alert-error">{error}</div>}

      {showForm && (
        <div className="erp-panel">
          <div className="erp-panel-header">
            <div>
              <h2 className="erp-panel-title">Create Stock Adjustment</h2>
              <p className="mt-1 text-sm text-slate-500">Record a stock level correction with reason code and authorization.</p>
            </div>
          </div>
          <div className="erp-panel-body">
            <form onSubmit={handleSave} className="space-y-4">
              <div className="erp-form-grid erp-form-grid-2">
                <div>
                  <label className="erp-label">Item</label>
                  <select className="erp-select" value={form.itemId} onChange={(e) => setForm({ ...form, itemId: e.target.value })} required>
                    <option value="">Select item…</option>
                    {items.map((i) => <option key={i.id} value={i.id}>{i.itemCode} — {i.itemName}</option>)}
                  </select>
                </div>
                <div>
                  <label className="erp-label">Warehouse</label>
                  <select className="erp-select" value={form.warehouseId} onChange={(e) => setForm({ ...form, warehouseId: e.target.value })} required>
                    <option value="">Select warehouse…</option>
                    {warehouses.map((w) => <option key={w.id} value={w.id}>{w.warehouseName}</option>)}
                  </select>
                </div>
                <div>
                  <label className="erp-label">Adjustment Type</label>
                  <select className="erp-select" value={form.adjustmentType} onChange={(e) => setForm({ ...form, adjustmentType: e.target.value })}>
                    {ADJUSTMENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="erp-label">Quantity</label>
                  <input className="erp-input" type="number" min={1} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} required />
                </div>
                <div>
                  <label className="erp-label">Adjustment Date</label>
                  <input className="erp-input" type="date" value={form.adjustmentDate} onChange={(e) => setForm({ ...form, adjustmentDate: e.target.value })} required />
                </div>
                <div>
                  <label className="erp-label">Reason</label>
                  <select className="erp-select" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })}>
                    {ADJUSTMENT_REASONS.map((r) => <option key={r}>{r}</option>)}
                  </select>
                </div>
              </div>
              <div className="erp-form-actions">
                <button type="button" onClick={() => setShowForm(false)} className="erp-action-btn erp-action-btn-secondary">Cancel</button>
                <button type="submit" disabled={saving} className="erp-action-btn erp-action-btn-primary">{saving ? "Saving…" : "Create Adjustment"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="erp-panel">
        <div className="erp-panel-header">
          <div>
            <h2 className="erp-panel-title">Adjustment Log</h2>
            <p className="mt-1 text-sm text-slate-500">{filtered.length} adjustment records</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="erp-table">
            <thead className="erp-thead">
              <tr>
                <th className="erp-th">Ref #</th>
                <th className="erp-th">Item</th>
                <th className="erp-th">Warehouse</th>
                <th className="erp-th">Type</th>
                <th className="erp-th text-right">Qty</th>
                <th className="erp-th">Reason</th>
                <th className="erp-th">Date</th>
                <th className="erp-th">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}><td colSpan={8} className="erp-td"><div className="h-4 animate-pulse rounded bg-slate-100" /></td></tr>
                ))
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="erp-td py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <Settings className="h-10 w-10 text-slate-300" />
                    <p className="text-sm text-slate-400">No inventory adjustments found.</p>
                    <button type="button" onClick={() => setShowForm(true)} className="erp-action-btn erp-action-btn-secondary text-xs">Create Adjustment</button>
                  </div>
                </td></tr>
              ) : (
                filtered.map((r) => {
                  const cfg = STATUS_CONFIG[r.status || "Approved"] || STATUS_CONFIG.Approved;
                  const isNeg = ["Negative", "WriteOff", "Damage", "Expiry"].includes(r.adjustmentType || "");
                  return (
                    <tr key={r.id} className="erp-tr">
                      <td className="erp-td font-mono text-xs text-slate-700">{r.adjustmentNumber || "—"}</td>
                      <td className="erp-td">
                        <p className="font-semibold text-slate-900">{r.itemName || "—"}</p>
                        {r.itemCode && <p className="text-xs text-slate-500">{r.itemCode}</p>}
                      </td>
                      <td className="erp-td text-slate-600">{r.warehouseName || "—"}</td>
                      <td className="erp-td">
                        <span className={`erp-chip ${isNeg ? "erp-chip-danger" : "erp-chip-success"}`}>
                          {isNeg ? "▼" : "▲"} {r.adjustmentType}
                        </span>
                      </td>
                      <td className={`erp-td text-right font-semibold ${isNeg ? "text-red-600" : "text-emerald-600"}`}>
                        {isNeg ? "-" : "+"}{r.quantity || 0}
                      </td>
                      <td className="erp-td text-slate-600 text-xs">{r.reason || "—"}</td>
                      <td className="erp-td text-slate-600">{r.adjustmentDate ? new Date(r.adjustmentDate).toLocaleDateString("en-IN") : "—"}</td>
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
