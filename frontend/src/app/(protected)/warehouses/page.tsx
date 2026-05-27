"use client";

import { useCallback, useEffect, useState } from "react";
import { hrApi } from "@/services/hrApi";
import PageShell from "@/features/erp/components/PageShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type WhRow = {
  id: string;
  warehouseCode: string;
  warehouseName: string;
  city?: string;
  state?: string;
  isDefault: boolean;
  isActive: boolean;
};

export default function WarehousesPage() {
  const [rows, setRows] = useState<WhRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState("list");
  const [form, setForm] = useState({
    warehouseCode: "",
    warehouseName: "",
    city: "",
    state: "",
    isDefault: false,
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await hrApi.erp.warehouses.list(1, 100);
      setRows((res.data?.data as WhRow[]) || []);
      setError(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load warehouses");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    if (!form.warehouseCode.trim() || !form.warehouseName.trim()) {
      setError("Code and name are required.");
      return;
    }
    setError(null);
    try {
      setLoading(true);
      await hrApi.erp.warehouses.create({
        warehouseCode: form.warehouseCode.trim(),
        warehouseName: form.warehouseName.trim(),
        city: form.city || undefined,
        state: form.state || undefined,
        isDefault: form.isDefault,
      });
      setTab("list");
      setForm({ warehouseCode: "", warehouseName: "", city: "", state: "", isDefault: false });
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Save failed (Admin may be required).");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageShell title="Warehouses" subtitle="Storage locations for inventory">
      {error && <div className="erp-alert-error text-sm">{error}</div>}

      {/* KPI summary cards */}
      <div className="erp-kpi-grid mb-4">
        <div className="erp-kpi-card"><p className="erp-kpi-label">Total Warehouses</p><p className="erp-kpi-value">{rows.length}</p><p className="erp-kpi-meta">Storage locations</p></div>
        <div className="erp-kpi-card erp-kpi-card-success"><p className="erp-kpi-label">Active</p><p className="erp-kpi-value erp-kpi-value-success">{rows.filter(r => r.isActive).length}</p><p className="erp-kpi-meta">Operational warehouses</p></div>
        <div className="erp-kpi-card erp-kpi-card-info"><p className="erp-kpi-label">Default</p><p className="erp-kpi-value">{rows.filter(r => r.isDefault).length}</p><p className="erp-kpi-meta">Default storage</p></div>
        <div className="erp-kpi-card erp-kpi-card-warning"><p className="erp-kpi-label">Inactive</p><p className="erp-kpi-value">{rows.filter(r => !r.isActive).length}</p><p className="erp-kpi-meta">Closed warehouses</p></div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="list">List</TabsTrigger>
          <TabsTrigger value="new">New warehouse</TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          <Card>
            <CardHeader>
              <CardTitle>Warehouses</CardTitle>
            </CardHeader>
            <CardContent>
              {loading && rows.length === 0 ? (
                <div className="erp-loading">Loading…</div>
              ) : rows.length === 0 ? (
                <div className="erp-empty">No warehouses yet.</div>
              ) : (
                <div className="erp-table-wrap border-0 shadow-none">
                  <table className="erp-table">
                    <thead className="erp-thead">
                      <tr>
                        <th className="erp-th">Code</th>
                        <th className="erp-th">Name</th>
                        <th className="erp-th">Location</th>
                        <th className="erp-th">Default</th>
                        <th className="erp-th">Active</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r) => (
                        <tr key={r.id} className="erp-tr">
                          <td className="erp-td font-medium text-slate-900">{r.warehouseCode}</td>
                          <td className="erp-td">{r.warehouseName}</td>
                          <td className="erp-td">{[r.city, r.state].filter(Boolean).join(", ") || "—"}</td>
                          <td className="erp-td">{r.isDefault ? "Yes" : "—"}</td>
                          <td className="erp-td">{r.isActive ? "Yes" : "No"}</td>
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
              <CardTitle>Create warehouse</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-600">Code</label>
                <input
                  value={form.warehouseCode}
                  onChange={(e) => setForm((f) => ({ ...f, warehouseCode: e.target.value }))}
                  className="erp-input mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600">Name</label>
                <input
                  value={form.warehouseName}
                  onChange={(e) => setForm((f) => ({ ...f, warehouseName: e.target.value }))}
                  className="erp-input mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600">City</label>
                <input
                  value={form.city}
                  onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                  className="erp-input mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600">State</label>
                <input
                  value={form.state}
                  onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
                  className="erp-input mt-1"
                />
              </div>
              <div className="md:col-span-2 flex items-center gap-2">
                <input
                  id="def"
                  type="checkbox"
                  checked={form.isDefault}
                  onChange={(e) => setForm((f) => ({ ...f, isDefault: e.target.checked }))}
                  className="h-4 w-4 rounded border-slate-300 text-(--erp-primary)"
                />
                <label htmlFor="def" className="text-sm text-slate-700">
                  Set as default warehouse
                </label>
              </div>
              <div className="md:col-span-2 erp-form-actions">
                <Button type="button" variant="outline" onClick={() => setTab("list")}>Cancel</Button>
                <Button type="button" onClick={() => void save()} disabled={loading}>
                  Save
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageShell>
  );
}
