"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { DynamicPage } from "@/components/dynamic/DynamicPage";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { CrudCard, CrudHeaderStats } from "@/components/workspace/crud-workspace";
import { SideDrawer } from "@/components/ui/side-drawer";
import { ErpCreateButton, ErpDrawerFooter, ErpRefreshButton } from "@/components/workspace/page-kit";
import { useErpListView } from "@/components/workspace/list-view";
import { inventoryApi } from "@/services/modules";

type MovementRow = {
  id: string;
  movementNumber: string;
  movementDate: string;
  movementType: string;
  itemCode: string;
  itemName: string;
  quantity: number;
  warehouseName?: string | null;
};

type ItemOption = { id: string; itemCode: string; itemName: string };
type WarehouseOption = { id: string; warehouseName: string };

function LegacyStockMovementsView() {
  const [rows, setRows] = useState<MovementRow[]>([]);
  const [items, setItems] = useState<ItemOption[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [form, setForm] = useState({
    movementDate: new Date().toISOString().slice(0, 10),
    movementType: "In",
    itemId: "",
    warehouseId: "",
    quantity: "",
    remarks: "",
  });

  const loadRefs = useCallback(async () => {
    const [itemsResponse, warehousesResponse] = await Promise.all([
      inventoryApi.items.getAll(1, 200),
      inventoryApi.warehouses.list(1, 100),
    ]);
    setItems((itemsResponse.data?.data as ItemOption[]) || []);
    setWarehouses((warehousesResponse.data?.data as WarehouseOption[]) || []);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await inventoryApi.stockMovements.list(1, 50);
      setRows((response.data?.data as MovementRow[]) || []);
      setError(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load movements.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRefs();
    void load();
  }, [load, loadRefs]);

  const save = async () => {
    if (!form.itemId) {
      setError("Select an item.");
      return;
    }

    const quantityValue = Number(form.quantity);
    if (!quantityValue) {
      setError("Enter a non-zero quantity.");
      return;
    }

    setError(null);

    try {
      setLoading(true);
      const quantity = form.movementType === "Adjustment" ? quantityValue : Math.abs(quantityValue);
      await inventoryApi.stockMovements.create({
        movementDate: new Date(form.movementDate).toISOString(),
        movementType: form.movementType,
        itemId: form.itemId,
        warehouseId: form.warehouseId || undefined,
        quantity,
        remarks: form.remarks || undefined,
      });
      setDrawerOpen(false);
      setForm((current) => ({ ...current, quantity: "", remarks: "" }));
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Save failed. Admin access may be required.");
    } finally {
      setLoading(false);
    }
  };

  const movementSummary = useMemo(() => {
    const goodsIn = rows.filter((row) => (row.movementType || "").toLowerCase().includes("in")).length;
    const goodsOut = rows.filter((row) => (row.movementType || "").toLowerCase().includes("out")).length;
    const itemCount = new Set(rows.map((row) => row.itemCode).filter(Boolean)).size;
    return { goodsIn, goodsOut, itemCount };
  }, [rows]);

  const list = useErpListView({
    listKey: "stock-movements",
    rows,
    columns: [
      { key: "movementNumber", label: "Movement" },
      { key: "movementDate", label: "Date", dataType: "date" },
      { key: "movementType", label: "Type" },
      { key: "itemCode", label: "Item" },
      { key: "quantity", label: "Qty", className: "text-right", dataType: "number" },
      { key: "warehouseName", label: "Warehouse" },
    ],
    getRowId: (row) => row.id,
    loading,
    emptyMessage: "No stock movements yet. Use New movement to post the first entry.",
    onCreate: () => setDrawerOpen(true),
    createLabel: "New movement",
    onRefresh: () => void load(),
    renderRow: (row) => (
      <tr key={row.id} className="erp-tr">
        <td className="erp-td font-medium text-slate-900">{row.movementNumber}</td>
        <td className="erp-td">{String(row.movementDate).slice(0, 10)}</td>
        <td className="erp-td">
          <span className="erp-chip erp-chip-neutral">{row.movementType}</span>
        </td>
        <td className="erp-td">
          <p className="font-semibold text-slate-900">{row.itemCode}</p>
          <p className="text-xs text-slate-500">{row.itemName}</p>
        </td>
        <td className="erp-td text-right tabular-nums">{Number(row.quantity).toFixed(3)}</td>
        <td className="erp-td">{row.warehouseName ?? "-"}</td>
      </tr>
    ),
  });

  return (
    <StandardPageLayout
      title="Stock Movements"
      subtitle="Record inward, outward, and adjustment entries with one clean movement history and one clean posting form."
      eyebrow="Inventory / Stock Ledger"
      icon="warehouse"
      meta={
        <CrudHeaderStats
          items={[
            { label: "Moves", value: rows.length, helper: "ledger" },
            { label: "Inward", value: movementSummary.goodsIn, tone: "positive" },
            { label: "Outward", value: movementSummary.goodsOut, tone: "danger" },
            { label: "Items", value: movementSummary.itemCount, tone: "info" },
          ]}
        />
      }
      actions={
        <>
          <ErpRefreshButton onClick={() => void load()} loading={loading} />
          {list.headerTools}
          <ErpCreateButton label="New movement" onClick={() => setDrawerOpen(true)} />
        </>
      }
      filters={list.filterBar}
    >
      {error ? <div className="erp-alert-error text-sm">{error}</div> : null}

      <CrudCard>{list.table}</CrudCard>

      <SideDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="New movement"
        subtitle="Post an inward, outward, or adjustment against an item."
        width="md"
        footer={
          <ErpDrawerFooter onCancel={() => setDrawerOpen(false)} onSave={() => void save()} saving={loading} saveLabel="Save movement" />
        }
      >
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="erp-label">Movement date</label>
            <input
              type="date"
              value={form.movementDate}
              onChange={(event) => setForm((current) => ({ ...current, movementDate: event.target.value }))}
              className="erp-input mt-1"
            />
          </div>
          <div>
            <label className="erp-label">Type</label>
            <select
              value={form.movementType}
              onChange={(event) => setForm((current) => ({ ...current, movementType: event.target.value }))}
              className="erp-select mt-1"
            >
              <option value="In">In (receipt)</option>
              <option value="Out">Out (issue)</option>
              <option value="Adjustment">Adjustment (+ or -)</option>
            </select>
          </div>
          <div>
            <label className="erp-label">Item</label>
            <select
              value={form.itemId}
              onChange={(event) => setForm((current) => ({ ...current, itemId: event.target.value }))}
              className="erp-select mt-1"
            >
              <option value="">Select item</option>
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
              value={form.warehouseId}
              onChange={(event) => setForm((current) => ({ ...current, warehouseId: event.target.value }))}
              className="erp-select mt-1"
            >
              <option value="">Optional warehouse</option>
              {warehouses.map((warehouse) => (
                <option key={warehouse.id} value={warehouse.id}>
                  {warehouse.warehouseName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="erp-label">Quantity</label>
            <input
              value={form.quantity}
              onChange={(event) => setForm((current) => ({ ...current, quantity: event.target.value }))}
              className="erp-input mt-1"
              inputMode="decimal"
            />
          </div>
          <div>
            <label className="erp-label">Remarks</label>
            <input
              value={form.remarks}
              onChange={(event) => setForm((current) => ({ ...current, remarks: event.target.value }))}
              className="erp-input mt-1"
            />
          </div>
        </div>
      </SideDrawer>
    </StandardPageLayout>
  );
}

export default function StockMovementsPage() {
  return (
    <DynamicPage
      pageKey="inventory.stock-movements"
      fallback={<LegacyStockMovementsView />}
      renderMode="auto"
    />
  );
}
