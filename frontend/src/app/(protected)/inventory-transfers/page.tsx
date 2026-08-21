"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { ArrowRight, CheckCircle, Clock, Package, Truck } from "lucide-react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { CrudHeaderStats } from "@/components/erp/crud-workspace";
import { SideDrawer } from "@/components/ui/side-drawer";
import { ErpCreateButton, ErpDrawerFooter } from "@/components/erp/erp-page-kit";
import { inventoryApi } from "@/services/modules";
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

const STATUS_CONFIG: Record<string, { chip: string; label: string; icon: ReactNode }> = {
  Completed: {
    chip: "erp-chip erp-chip-success",
    label: "Completed",
    icon: <CheckCircle className="h-3.5 w-3.5" />,
  },
  InTransit: {
    chip: "erp-chip erp-chip-info",
    label: "In Transit",
    icon: <Truck className="h-3.5 w-3.5" />,
  },
  Pending: {
    chip: "erp-chip erp-chip-warning",
    label: "Pending",
    icon: <Clock className="h-3.5 w-3.5" />,
  },
  Cancelled: {
    chip: "erp-chip erp-chip-danger",
    label: "Cancelled",
    icon: null,
  },
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
    itemId: "",
    fromWarehouseId: "",
    toWarehouseId: "",
    quantity: 1,
    transferDate: new Date().toISOString().split("T")[0],
    reason: "",
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

      const transfers: TransferRow[] = movementList
        .filter(
          (movement: TransferRow) =>
            movement.movementType === "Transfer" ||
            (movement.fromWarehouseId && movement.toWarehouseId),
        )
        .map((movement: TransferRow) => ({
          id: movement.id,
          transferNumber: movement.referenceNumber || `TRF-${movement.id?.slice(0, 8)}`,
          fromWarehouseId: movement.fromWarehouseId,
          fromWarehouseName:
            warehouseList.find((warehouse: TransferRow) => warehouse.id === movement.fromWarehouseId)
              ?.warehouseName || movement.fromWarehouseName,
          toWarehouseId: movement.toWarehouseId,
          toWarehouseName:
            warehouseList.find((warehouse: TransferRow) => warehouse.id === movement.toWarehouseId)
              ?.warehouseName || movement.toWarehouseName,
          itemId: movement.itemId,
          itemName:
            itemList.find((item: TransferRow) => item.id === movement.itemId)?.itemName ||
            movement.itemName,
          itemCode: itemList.find((item: TransferRow) => item.id === movement.itemId)?.itemCode,
          quantity: movement.quantity,
          transferDate: movement.movementDate || movement.createdAt,
          status: "Completed",
          reason: movement.remarks,
        }));

      setRecords(transfers);
    } catch (err) {
      const message = getApiErrorMessage(err, "Failed to load inventory transfers.");
      setError(message);
      notifyError(message, "Inventory Transfers");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSave = async () => {
    if (!form.itemId || !form.fromWarehouseId || !form.toWarehouseId || form.quantity <= 0) {
      return;
    }
    if (form.fromWarehouseId === form.toWarehouseId) {
      notifyError("Source and destination warehouses must be different.", "Transfer");
      return;
    }

    try {
      setSaving(true);
      await inventoryApi.stockMovements.create({
        movementType: "Transfer",
        itemId: form.itemId,
        fromWarehouseId: form.fromWarehouseId,
        toWarehouseId: form.toWarehouseId,
        warehouseId: form.toWarehouseId,
        quantity: form.quantity,
        movementDate: form.transferDate,
        remarks: form.reason,
        referenceNumber: `TRF-${Date.now()}`,
      });
      setShowForm(false);
      setForm({
        itemId: "",
        fromWarehouseId: "",
        toWarehouseId: "",
        quantity: 1,
        transferDate: new Date().toISOString().split("T")[0],
        reason: "",
      });
      void load();
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to create transfer."), "Transfer");
    } finally {
      setSaving(false);
    }
  };

  const filtered = records.filter((record) => {
    const query = search.toLowerCase();
    const matchSearch =
      !query ||
      (record.transferNumber || "").toLowerCase().includes(query) ||
      (record.itemName || "").toLowerCase().includes(query) ||
      (record.fromWarehouseName || "").toLowerCase().includes(query) ||
      (record.toWarehouseName || "").toLowerCase().includes(query);
    const matchStatus = !statusFilter || record.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const completed = filtered.filter((record) => record.status === "Completed").length;
  const inTransit = filtered.filter((record) => record.status === "InTransit").length;
  const _pending = filtered.filter((record) => record.status === "Pending").length;
  const totalQuantity = filtered.reduce((sum, record) => sum + (record.quantity || 0), 0);

  return (
    <StandardPageLayout
      title="Inventory Transfers"
      subtitle="Move stock between warehouses with a cleaner transfer log, clear route visibility, and one focused action flow."
      eyebrow="Inventory / Movement Control"
      icon="warehouse"
      meta={
        <CrudHeaderStats
          items={[
            { label: "Transfers", value: filtered.length, helper: "visible" },
            { label: "Completed", value: completed, tone: "positive" },
            { label: "In Transit", value: inTransit, tone: "info" },
            { label: "Units", value: totalQuantity.toLocaleString("en-IN"), tone: "warning" },
          ]}
        />
      }
      actions={<ErpCreateButton label="New transfer" onClick={() => setShowForm(true)} />}
      filters={
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-48 flex-1">
            <label className="erp-label">Search</label>
            <input
              className="erp-input"
              placeholder="Transfer number, item, or warehouse..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <div>
            <label className="erp-label">Status</label>
            <select
              className="erp-select w-36"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="">All Status</option>
              <option value="Pending">Pending</option>
              <option value="InTransit">In Transit</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
          {(search || statusFilter) && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setStatusFilter("");
              }}
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
            <h2 className="erp-panel-title">Transfer Log</h2>
            <p className="mt-1 text-sm text-slate-500">
              Review item movement routes, quantities, and transfer completion state.
            </p>
          </div>
        </div>
        <div className="overflow-x-auto bg-white/80">
          <table className="erp-table">
            <thead className="erp-thead">
              <tr>
                <th className="erp-th">Transfer</th>
                <th className="erp-th">Item</th>
                <th className="erp-th">Route</th>
                <th className="erp-th text-right">Qty</th>
                <th className="erp-th">Date</th>
                <th className="erp-th">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={index}>
                    <td colSpan={6} className="erp-td">
                      <div className="h-4 animate-pulse rounded bg-slate-100" />
                    </td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="erp-td py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Package className="h-10 w-10 text-slate-300" />
                      <p className="text-sm text-slate-400">No inventory transfers found. Use New transfer in the header to create one.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((record) => {
                  const status = STATUS_CONFIG[record.status || "Completed"] || STATUS_CONFIG.Completed;
                  return (
                    <tr key={record.id} className="erp-tr">
                      <td className="erp-td font-mono text-xs font-semibold text-slate-700">
                        {record.transferNumber || "-"}
                      </td>
                      <td className="erp-td">
                        <p className="font-semibold text-slate-900">{record.itemName || "-"}</p>
                        {record.itemCode && <p className="text-xs text-slate-500">{record.itemCode}</p>}
                      </td>
                      <td className="erp-td">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-slate-700">
                            {record.fromWarehouseName || "-"}
                          </span>
                          <ArrowRight className="h-3.5 w-3.5 flex-shrink-0 text-slate-400" />
                          <span className="rounded-md bg-blue-50 px-2 py-0.5 text-blue-700">
                            {record.toWarehouseName || "-"}
                          </span>
                        </div>
                      </td>
                      <td className="erp-td text-right font-semibold text-slate-900">
                        {record.quantity || 0}
                      </td>
                      <td className="erp-td text-slate-600">
                        {record.transferDate
                          ? new Date(record.transferDate).toLocaleDateString("en-IN")
                          : "-"}
                      </td>
                      <td className="erp-td">
                        <span className={`${status.chip} flex w-fit items-center gap-1`}>
                          {status.icon}
                          {status.label}
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

      <SideDrawer
        open={showForm}
        onClose={() => setShowForm(false)}
        title="New transfer"
        subtitle="Select the item, source warehouse, destination warehouse, and reason."
        width="md"
        footer={
          <ErpDrawerFooter
            onCancel={() => setShowForm(false)}
            onSave={() => void handleSave()}
            saving={saving}
            saveLabel="Create transfer"
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
            <label className="erp-label">From Warehouse</label>
            <select
              className="erp-select mt-1"
              value={form.fromWarehouseId}
              onChange={(event) => setForm({ ...form, fromWarehouseId: event.target.value })}
            >
              <option value="">Select source warehouse...</option>
              {warehouses.map((warehouse) => (
                <option key={warehouse.id} value={warehouse.id}>
                  {warehouse.warehouseName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="erp-label">To Warehouse</label>
            <select
              className="erp-select mt-1"
              value={form.toWarehouseId}
              onChange={(event) => setForm({ ...form, toWarehouseId: event.target.value })}
            >
              <option value="">Select destination warehouse...</option>
              {warehouses
                .filter((warehouse) => warehouse.id !== form.fromWarehouseId)
                .map((warehouse) => (
                  <option key={warehouse.id} value={warehouse.id}>
                    {warehouse.warehouseName}
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
            <label className="erp-label">Transfer Date</label>
            <input
              className="erp-input mt-1"
              type="date"
              value={form.transferDate}
              onChange={(event) => setForm({ ...form, transferDate: event.target.value })}
            />
          </div>
          <div>
            <label className="erp-label">Reason or Notes</label>
            <textarea
              className="erp-input mt-1"
              rows={3}
              value={form.reason}
              onChange={(event) => setForm({ ...form, reason: event.target.value })}
              placeholder="Reason for stock movement..."
            />
          </div>
        </div>
      </SideDrawer>
    </StandardPageLayout>
  );
}
