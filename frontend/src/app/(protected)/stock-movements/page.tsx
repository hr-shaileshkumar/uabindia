"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { CrudCard, CrudHeaderStats } from "@/components/erp/crud-workspace";
import { hrApi } from "@/services/hrApi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

export default function StockMovementsPage() {
  const [rows, setRows] = useState<MovementRow[]>([]);
  const [items, setItems] = useState<ItemOption[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState("list");
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
      hrApi.erp.items.getAll(1, 200),
      hrApi.erp.warehouses.list(1, 100),
    ]);
    setItems((itemsResponse.data?.data as ItemOption[]) || []);
    setWarehouses((warehousesResponse.data?.data as WarehouseOption[]) || []);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await hrApi.erp.stockMovements.list(1, 50);
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
      await hrApi.erp.stockMovements.create({
        movementDate: new Date(form.movementDate).toISOString(),
        movementType: form.movementType,
        itemId: form.itemId,
        warehouseId: form.warehouseId || undefined,
        quantity,
        remarks: form.remarks || undefined,
      });
      setTab("list");
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
    >
      {error && <div className="erp-alert-error text-sm">{error}</div>}

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="erp-tabs-list">
          <TabsTrigger
            value="list"
            className="erp-tab-trigger data-[state=active]:erp-tab-trigger-active"
          >
            Movement History
          </TabsTrigger>
          <TabsTrigger
            value="new"
            className="erp-tab-trigger data-[state=active]:erp-tab-trigger-active"
          >
            New Movement
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          <CrudCard title="Movement History" description="Use the stock ledger as the primary movement review surface for inward, outward, and adjustment entries.">
              {loading && rows.length === 0 ? (
                <div className="erp-loading">Loading...</div>
              ) : rows.length === 0 ? (
                <div className="erp-empty">No stock movements posted yet.</div>
              ) : (
                <div className="erp-table-wrap border-0 bg-white/80 shadow-none">
                  <table className="erp-table">
                    <thead className="erp-thead">
                      <tr>
                        <th className="erp-th">Movement</th>
                        <th className="erp-th">Date</th>
                        <th className="erp-th">Type</th>
                        <th className="erp-th">Item</th>
                        <th className="erp-th text-right">Qty</th>
                        <th className="erp-th">Warehouse</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row) => (
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
                          <td className="erp-td text-right tabular-nums">
                            {Number(row.quantity).toFixed(3)}
                          </td>
                          <td className="erp-td">{row.warehouseName ?? "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
          </CrudCard>
        </TabsContent>

        <TabsContent value="new">
          <Card className="erp-panel">
            <CardHeader className="border-b border-slate-100 bg-white/75">
              <CardTitle>Record Movement</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="erp-label">Movement Date</label>
                <input
                  type="date"
                  value={form.movementDate}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, movementDate: event.target.value }))
                  }
                  className="erp-input mt-1"
                />
              </div>
              <div>
                <label className="erp-label">Movement Type</label>
                <select
                  value={form.movementType}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, movementType: event.target.value }))
                  }
                  className="erp-select mt-1"
                >
                  <option value="In">In (receipt)</option>
                  <option value="Out">Out (issue)</option>
                  <option value="Adjustment">Adjustment (+ or -)</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="erp-label">Item</label>
                <select
                  value={form.itemId}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, itemId: event.target.value }))
                  }
                  className="erp-select mt-1"
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
                  value={form.warehouseId}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, warehouseId: event.target.value }))
                  }
                  className="erp-select mt-1"
                >
                  <option value="">Optional warehouse...</option>
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
                  onChange={(event) =>
                    setForm((current) => ({ ...current, quantity: event.target.value }))
                  }
                  className="erp-input mt-1"
                  inputMode="decimal"
                  placeholder={
                    form.movementType === "Adjustment"
                      ? "Use negative quantity to reduce"
                      : "Enter positive quantity"
                  }
                />
              </div>
              <div className="md:col-span-2">
                <label className="erp-label">Remarks</label>
                <input
                  value={form.remarks}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, remarks: event.target.value }))
                  }
                  className="erp-input mt-1"
                  placeholder="Reference, narrative, or reason"
                />
              </div>
              <div className="erp-form-actions md:col-span-2">
                <Button type="button" variant="outline" onClick={() => setTab("list")}>
                  Cancel
                </Button>
                <Button type="button" onClick={() => void save()} disabled={loading}>
                  Save Movement
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </StandardPageLayout>
  );
}
