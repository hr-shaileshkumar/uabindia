"use client";

import { useCallback, useEffect, useState } from "react";
import { hrApi } from "@/services/hrApi";
import PageShell from "@/features/erp/components/PageShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type MvRow = {
  id: string;
  movementNumber: string;
  movementDate: string;
  movementType: string;
  itemCode: string;
  itemName: string;
  quantity: number;
  warehouseName?: string | null;
};

type ItemOpt = { id: string; itemCode: string; itemName: string };
type WhOpt = { id: string; warehouseName: string };

export default function StockMovementsPage() {
  const [rows, setRows] = useState<MvRow[]>([]);
  const [items, setItems] = useState<ItemOpt[]>([]);
  const [warehouses, setWarehouses] = useState<WhOpt[]>([]);
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
    const [it, wh] = await Promise.all([
      hrApi.erp.items.getAll(1, 200),
      hrApi.erp.warehouses.list(1, 100),
    ]);
    setItems((it.data?.data as ItemOpt[]) || []);
    setWarehouses((wh.data?.data as WhOpt[]) || []);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await hrApi.erp.stockMovements.list(1, 50);
      setRows((res.data?.data as MvRow[]) || []);
      setError(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load movements");
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
    const qty = Number(form.quantity);
    if (!qty) {
      setError("Enter a non-zero quantity.");
      return;
    }
    setError(null);
    try {
      setLoading(true);
      const quantity =
        form.movementType === "Adjustment" ? qty : Math.abs(qty);
      await hrApi.erp.stockMovements.create({
        movementDate: new Date(form.movementDate).toISOString(),
        movementType: form.movementType,
        itemId: form.itemId,
        warehouseId: form.warehouseId || undefined,
        quantity,
        remarks: form.remarks || undefined,
      });
      setTab("list");
      setForm((f) => ({ ...f, quantity: "", remarks: "" }));
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Save failed (Admin may be required).");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageShell
      title="Stock movements"
      subtitle="Goods in, out, and adjustments (updates item on-hand stock)"
    >
      {error && <div className="erp-alert-error text-sm">{error}</div>}

      {/* KPI summary cards */}
      <div className="erp-kpi-grid mb-4">
        <div className="erp-kpi-card"><p className="erp-kpi-label">Total Movements</p><p className="erp-kpi-value">{rows.length}</p><p className="erp-kpi-meta">Stock transactions</p></div>
        <div className="erp-kpi-card erp-kpi-card-success"><p className="erp-kpi-label">Goods In</p><p className="erp-kpi-value erp-kpi-value-success">{rows.filter(r => (r.movementType || '').toLowerCase().includes('in')).length}</p><p className="erp-kpi-meta">Inbound movements</p></div>
        <div className="erp-kpi-card erp-kpi-card-danger"><p className="erp-kpi-label">Goods Out</p><p className="erp-kpi-value erp-kpi-value-danger">{rows.filter(r => (r.movementType || '').toLowerCase().includes('out')).length}</p><p className="erp-kpi-meta">Outbound movements</p></div>
        <div className="erp-kpi-card erp-kpi-card-info"><p className="erp-kpi-label">Items</p><p className="erp-kpi-value">{new Set(rows.map(r => r.itemCode).filter(Boolean)).size}</p><p className="erp-kpi-meta">Distinct item SKUs</p></div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="list">History</TabsTrigger>
          <TabsTrigger value="new">New movement</TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          <Card>
            <CardHeader>
              <CardTitle>Movements</CardTitle>
            </CardHeader>
            <CardContent>
              {loading && rows.length === 0 ? (
                <div className="erp-loading">Loading…</div>
              ) : rows.length === 0 ? (
                <div className="erp-empty">No movements yet.</div>
              ) : (
                <div className="erp-table-wrap border-0 shadow-none">
                  <table className="erp-table">
                    <thead className="erp-thead">
                      <tr>
                        <th className="erp-th">Number</th>
                        <th className="erp-th">Date</th>
                        <th className="erp-th">Type</th>
                        <th className="erp-th">Item</th>
                        <th className="erp-th text-right">Qty</th>
                        <th className="erp-th">Warehouse</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r) => (
                        <tr key={r.id} className="erp-tr">
                          <td className="erp-td font-medium text-slate-900">{r.movementNumber}</td>
                          <td className="erp-td">{String(r.movementDate).slice(0, 10)}</td>
                          <td className="erp-td">{r.movementType}</td>
                          <td className="erp-td">
                            {r.itemCode} — {r.itemName}
                          </td>
                          <td className="erp-td text-right tabular-nums">{Number(r.quantity).toFixed(3)}</td>
                          <td className="erp-td">{r.warehouseName ?? "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="new">
          <Card>
            <CardHeader>
              <CardTitle>Record movement</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-600">Date</label>
                <input
                  type="date"
                  value={form.movementDate}
                  onChange={(e) => setForm((f) => ({ ...f, movementDate: e.target.value }))}
                  className="erp-input mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600">Type</label>
                <select
                  value={form.movementType}
                  onChange={(e) => setForm((f) => ({ ...f, movementType: e.target.value }))}
                  className="erp-select mt-1"
                >
                  <option value="In">In (receipt)</option>
                  <option value="Out">Out (issue)</option>
                  <option value="Adjustment">Adjustment (+/−)</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-slate-600">Item</label>
                <select
                  value={form.itemId}
                  onChange={(e) => setForm((f) => ({ ...f, itemId: e.target.value }))}
                  className="erp-select mt-1"
                >
                  <option value="">Select…</option>
                  {items.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.itemCode} — {i.itemName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600">Warehouse (optional)</label>
                <select
                  value={form.warehouseId}
                  onChange={(e) => setForm((f) => ({ ...f, warehouseId: e.target.value }))}
                  className="erp-select mt-1"
                >
                  <option value="">—</option>
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.warehouseName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600">Quantity</label>
                <input
                  value={form.quantity}
                  onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
                  className="erp-input mt-1"
                  inputMode="decimal"
                  placeholder={form.movementType === "Adjustment" ? "Use negative to reduce" : "Positive number"}
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-slate-600">Remarks</label>
                <input
                  value={form.remarks}
                  onChange={(e) => setForm((f) => ({ ...f, remarks: e.target.value }))}
                  className="erp-input mt-1"
                />
              </div>
              <div className="md:col-span-2 erp-form-actions">
                <Button type="button" variant="outline" onClick={() => setTab("list")}>Cancel</Button>
                <Button type="button" onClick={() => void save()} disabled={loading}>
                  Save movement
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageShell>
  );
}
