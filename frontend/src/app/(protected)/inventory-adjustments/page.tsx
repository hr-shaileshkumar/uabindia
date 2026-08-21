"use client";

import { useCallback, useEffect, useState } from "react";
import { Settings } from "lucide-react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { CrudHeaderStats } from "@/components/erp/crud-workspace";
import { SideDrawer } from "@/components/ui/side-drawer";
import { ErpCreateButton, ErpDrawerFooter } from "@/components/erp/erp-page-kit";
import { inventoryApi } from "@/services/modules";
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
  adjustmentType?: "Positive" | "Negative" | "WriteOff" | "Damage" | "Expiry";
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
  Pending: { chip: "erp-chip erp-chip-warning", label: "Pending" },
  Rejected: { chip: "erp-chip erp-chip-danger", label: "Rejected" },
  Draft: { chip: "erp-chip erp-chip-neutral", label: "Draft" },
};

const ADJUSTMENT_TYPES = [
  { value: "Positive", label: "Positive Adjustment" },
  { value: "Negative", label: "Negative Adjustment" },
  { value: "WriteOff", label: "Write-Off" },
  { value: "Damage", label: "Damage" },
  { value: "Expiry", label: "Expiry" },
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
    itemId: "",
    warehouseId: "",
    adjustmentType: "Positive",
    quantity: 1,
    reason: "Physical Count Discrepancy",
    adjustmentDate: new Date().toISOString().split("T")[0],
  });

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [movementResponse, itemsResponse, warehousesResponse] = await Promise.all([
        inventoryApi.stockMovements.list(1, 50),
        inventoryApi.items.getAll(1, 100),
        inventoryApi.warehouses.list(1, 50),
      ]);

      const movementList = Array.isArray(movementResponse.data)
        ? movementResponse.data
        : Array.isArray(movementResponse.data?.data)
          ? movementResponse.data.data
          : [];
      const itemList = Array.isArray(itemsResponse.data)
        ? itemsResponse.data
        : Array.isArray(itemsResponse.data?.data)
          ? itemsResponse.data.data
          : [];
      const warehouseList = Array.isArray(warehousesResponse.data)
        ? warehousesResponse.data
        : Array.isArray(warehousesResponse.data?.data)
          ? warehousesResponse.data.data
          : [];

      setItems(itemList);
      setWarehouses(warehouseList);

      const adjustments: AdjustmentRow[] = movementList
        .filter(
          (movement: AdjustmentRow) =>
            movement.movementType === "Adjustment" || movement.movementType === "WriteOff",
        )
        .map((movement: AdjustmentRow) => ({
          id: movement.id,
          adjustmentNumber: movement.referenceNumber || `ADJ-${movement.id?.slice(0, 8)}`,
          itemId: movement.itemId,
          itemName:
            itemList.find((item: AdjustmentRow) => item.id === movement.itemId)?.itemName ||
            movement.itemName,
          itemCode: itemList.find((item: AdjustmentRow) => item.id === movement.itemId)?.itemCode,
          warehouseId: movement.warehouseId,
          warehouseName:
            warehouseList.find((warehouse: AdjustmentRow) => warehouse.id === movement.warehouseId)
              ?.warehouseName || movement.warehouseName,
          adjustmentType:
            movement.adjustmentType || ((movement.quantity || 0) > 0 ? "Positive" : "Negative"),
          quantity: movement.quantity,
          reason: movement.remarks || movement.reason,
          adjustmentDate: movement.movementDate || movement.createdAt,
          status: "Approved",
        }));

      setRecords(adjustments);
    } catch (err) {
      const message = getApiErrorMessage(err, "Failed to load inventory adjustments.");
      setError(message);
      notifyError(message, "Inventory Adjustments");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSave = async () => {
    if (!form.itemId || !form.warehouseId || form.quantity <= 0) {
      return;
    }

    try {
      setSaving(true);
      await inventoryApi.stockMovements.create({
        movementType: "Adjustment",
        itemId: form.itemId,
        warehouseId: form.warehouseId,
        quantity:
          form.adjustmentType === "Negative" ||
          form.adjustmentType === "WriteOff" ||
          form.adjustmentType === "Damage" ||
          form.adjustmentType === "Expiry"
            ? -form.quantity
            : form.quantity,
        movementDate: form.adjustmentDate,
        remarks: form.reason,
        adjustmentType: form.adjustmentType,
        referenceNumber: `ADJ-${Date.now()}`,
      });
      setShowForm(false);
      setForm({
        itemId: "",
        warehouseId: "",
        adjustmentType: "Positive",
        quantity: 1,
        reason: "Physical Count Discrepancy",
        adjustmentDate: new Date().toISOString().split("T")[0],
      });
      void load();
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to create adjustment."), "Adjustment");
    } finally {
      setSaving(false);
    }
  };

  const filtered = records.filter((record) => !typeFilter || record.adjustmentType === typeFilter);
  const positiveCount = filtered.filter((record) => record.adjustmentType === "Positive").length;
  const negativeCount = filtered.filter((record) =>
    ["Negative", "WriteOff", "Damage", "Expiry"].includes(record.adjustmentType || ""),
  ).length;
  const totalQuantity = filtered.reduce((sum, record) => sum + Math.abs(record.quantity || 0), 0);

  return (
    <StandardPageLayout
      title="Inventory Adjustments"
      subtitle="Record stock corrections with reason codes so physical counts, damage, expiry, and write-offs stay auditable."
      eyebrow="Inventory / Adjustment Control"
      icon="warehouse"
      meta={
        <CrudHeaderStats
          items={[
            { label: "Adjustments", value: filtered.length, helper: "visible" },
            { label: "Positive", value: positiveCount, tone: "positive" },
            { label: "Negative", value: negativeCount, tone: "danger" },
            { label: "Units", value: totalQuantity.toLocaleString("en-IN"), tone: "info" },
          ]}
        />
      }
      actions={<ErpCreateButton label="New adjustment" onClick={() => setShowForm(true)} />}
      filters={
        <div className="grid gap-3 sm:grid-cols-[minmax(0,16rem)_auto] sm:items-end">
          <div>
            <label className="erp-label">Adjustment Type</label>
            <select
              className="erp-select"
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value)}
            >
              <option value="">All Types</option>
              {ADJUSTMENT_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
          {typeFilter && (
            <button
              type="button"
              onClick={() => setTypeFilter("")}
              className="erp-action-btn erp-action-btn-secondary"
            >
              Clear
            </button>
          )}
        </div>
      }
    >
      {error && <div className="erp-alert-error">{error}</div>}

      <div className="erp-panel">
        <div className="erp-panel-header">
          <div>
            <h2 className="erp-panel-title">Adjustment Log</h2>
            <p className="mt-1 text-sm text-slate-500">
              View adjustment history by item, warehouse, quantity direction, and reason code.
            </p>
          </div>
        </div>
        <div className="erp-table-wrap">
          <table className="erp-table">
            <thead className="erp-thead">
              <tr>
                <th className="erp-th">Reference</th>
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
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={index}>
                    <td colSpan={8} className="erp-td">
                      <div className="h-4 animate-pulse rounded bg-slate-100" />
                    </td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="erp-td py-10 text-center">
                    <div className="mx-auto flex max-w-lg flex-col items-center gap-2 text-center" role="status">
                      <Settings className="h-9 w-9 text-slate-300" />
                      <p className="text-sm font-semibold text-slate-900">No inventory adjustments found.</p>
                      <p className="text-sm leading-6 text-slate-500">
                        Use New adjustment in the header or broaden the filter to review historical entries.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((record) => {
                  const status = STATUS_CONFIG[record.status || "Approved"] || STATUS_CONFIG.Approved;
                  const isNegative = ["Negative", "WriteOff", "Damage", "Expiry"].includes(
                    record.adjustmentType || "",
                  );
                  return (
                    <tr key={record.id} className="erp-tr">
                      <td className="erp-td font-mono text-xs text-slate-700">
                        {record.adjustmentNumber || "-"}
                      </td>
                      <td className="erp-td">
                        <p className="font-semibold text-slate-900">{record.itemName || "-"}</p>
                        {record.itemCode && <p className="text-xs text-slate-500">{record.itemCode}</p>}
                      </td>
                      <td className="erp-td text-slate-600">{record.warehouseName || "-"}</td>
                      <td className="erp-td">
                        <span
                          className={`erp-chip ${isNegative ? "erp-chip-danger" : "erp-chip-success"}`}
                        >
                          {isNegative ? "Outflow" : "Inflow"} {record.adjustmentType}
                        </span>
                      </td>
                      <td
                        className={`erp-td text-right font-semibold ${
                          isNegative ? "text-red-600" : "text-emerald-600"
                        }`}
                      >
                        {isNegative ? "-" : "+"}
                        {Math.abs(record.quantity || 0)}
                      </td>
                      <td className="erp-td text-xs text-slate-600">{record.reason || "-"}</td>
                      <td className="erp-td text-slate-600">
                        {record.adjustmentDate
                          ? new Date(record.adjustmentDate).toLocaleDateString("en-IN")
                          : "-"}
                      </td>
                      <td className="erp-td">
                        <span className={status.chip}>{status.label}</span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <SideDrawer
        open={showForm}
        onClose={() => setShowForm(false)}
        title="New adjustment"
        subtitle="Record the warehouse, item, adjustment type, quantity, and reason."
        width="md"
        footer={
          <ErpDrawerFooter
            onCancel={() => setShowForm(false)}
            onSave={() => void handleSave()}
            saving={saving}
            saveLabel="Create adjustment"
          />
        }
      >
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="erp-label">Item</label>
            <select
              className="erp-select mt-1"
              value={form.itemId}
              onChange={(event) => setForm({ ...form, itemId: event.target.value })}
            >
              <option value="">Select item...</option>
              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.itemCode} - {item.itemName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="erp-label">Warehouse</label>
            <select
              className="erp-select mt-1"
              value={form.warehouseId}
              onChange={(event) => setForm({ ...form, warehouseId: event.target.value })}
            >
              <option value="">Select warehouse...</option>
              {warehouses.map((warehouse) => (
                <option key={warehouse.id} value={warehouse.id}>
                  {warehouse.warehouseName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="erp-label">Adjustment Type</label>
            <select
              className="erp-select mt-1"
              value={form.adjustmentType}
              onChange={(event) => setForm({ ...form, adjustmentType: event.target.value })}
            >
              {ADJUSTMENT_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="erp-label">Quantity</label>
            <input
              className="erp-input mt-1"
              type="number"
              min={1}
              value={form.quantity}
              onChange={(event) => setForm({ ...form, quantity: Number(event.target.value) })}
            />
          </div>
          <div>
            <label className="erp-label">Adjustment Date</label>
            <input
              className="erp-input mt-1"
              type="date"
              value={form.adjustmentDate}
              onChange={(event) => setForm({ ...form, adjustmentDate: event.target.value })}
            />
          </div>
          <div>
            <label className="erp-label">Reason</label>
            <select
              className="erp-select mt-1"
              value={form.reason}
              onChange={(event) => setForm({ ...form, reason: event.target.value })}
            >
              {ADJUSTMENT_REASONS.map((reason) => (
                <option key={reason}>{reason}</option>
              ))}
            </select>
          </div>
        </div>
      </SideDrawer>
    </StandardPageLayout>
  );
}
