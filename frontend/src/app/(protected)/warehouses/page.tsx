"use client";

import { useCallback, useEffect, useState } from "react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { hrApi } from "@/services/hrApi";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CrudCard, CrudHeaderStats } from "@/components/erp/crud-workspace";

type WarehouseRow = {
  id: string;
  warehouseCode: string;
  warehouseName: string;
  city?: string;
  state?: string;
  isDefault: boolean;
  isActive: boolean;
};

export default function WarehousesPage() {
  const [rows, setRows] = useState<WarehouseRow[]>([]);
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
      const response = await hrApi.erp.warehouses.list(1, 100);
      setRows((response.data?.data as WarehouseRow[]) || []);
      setError(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load warehouses.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    if (!form.warehouseCode.trim() || !form.warehouseName.trim()) {
      setError("Warehouse code and warehouse name are required.");
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
      setForm({
        warehouseCode: "",
        warehouseName: "",
        city: "",
        state: "",
        isDefault: false,
      });
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Save failed. Admin access may be required.");
    } finally {
      setLoading(false);
    }
  };

  const activeCount = rows.filter((row) => row.isActive).length;
  const defaultCount = rows.filter((row) => row.isDefault).length;

  return (
    <StandardPageLayout
      title="Warehouses"
      subtitle="Configure inventory storage points used by receipts, transfers, issue flows, and stock accountability."
      eyebrow="Inventory / Warehouse Setup"
      icon="warehouse"
      meta={
        <>
          <CrudHeaderStats
            items={[
              { label: "Warehouses", value: rows.length, helper: "locations" },
              { label: "Active", value: activeCount, tone: "positive" },
              { label: "Default", value: defaultCount, tone: "info" },
              { label: "Inactive", value: rows.length - activeCount, tone: "warning" },
            ]}
          />
        </>
      }
    >
      {error && <div className="erp-alert-error text-sm">{error}</div>}

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="erp-tabs-list">
          <TabsTrigger
            value="list"
            className="erp-tab-trigger data-[state=active]:erp-tab-trigger-active"
          >
            Warehouse Register
          </TabsTrigger>
          <TabsTrigger
            value="new"
            className="erp-tab-trigger data-[state=active]:erp-tab-trigger-active"
          >
            New Warehouse
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          <CrudCard title="Warehouse Register" description="Keep the listing dense and operational. Only show columns needed for stock flow decisions.">
              {loading && rows.length === 0 ? (
                <div className="erp-loading">Loading...</div>
              ) : rows.length === 0 ? (
                <div className="erp-empty">No warehouses created yet.</div>
              ) : (
                <div className="erp-table-wrap border-0 bg-white/80 shadow-none">
                  <table className="erp-table">
                    <thead className="erp-thead">
                      <tr>
                        <th className="erp-th">Code</th>
                        <th className="erp-th">Warehouse</th>
                        <th className="erp-th">Location</th>
                        <th className="erp-th">Default</th>
                        <th className="erp-th">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row) => (
                        <tr key={row.id} className="erp-tr">
                          <td className="erp-td font-medium text-slate-900">{row.warehouseCode}</td>
                          <td className="erp-td">{row.warehouseName}</td>
                          <td className="erp-td">
                            {[row.city, row.state].filter(Boolean).join(", ") || "-"}
                          </td>
                          <td className="erp-td">
                            {row.isDefault ? (
                              <span className="erp-chip erp-chip-info">Default</span>
                            ) : (
                              "-"
                            )}
                          </td>
                          <td className="erp-td">
                            <span
                              className={
                                row.isActive ? "erp-chip erp-chip-success" : "erp-chip erp-chip-neutral"
                              }
                            >
                              {row.isActive ? "Active" : "Inactive"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    </table>
                  </div>
                )}
          </CrudCard>
        </TabsContent>

        <TabsContent value="new">
          <CrudCard title="Create Warehouse" description="Capture only the location setup data needed for inventory operations.">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="erp-label">Warehouse Code</label>
                <input
                  value={form.warehouseCode}
                  onChange={(event) => setForm((current) => ({ ...current, warehouseCode: event.target.value }))}
                  className="erp-input mt-1"
                  placeholder="WH-DEL-01"
                />
              </div>
              <div>
                <label className="erp-label">Warehouse Name</label>
                <input
                  value={form.warehouseName}
                  onChange={(event) => setForm((current) => ({ ...current, warehouseName: event.target.value }))}
                  className="erp-input mt-1"
                  placeholder="Delhi Central Warehouse"
                />
              </div>
              <div>
                <label className="erp-label">City</label>
                <input
                  value={form.city}
                  onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))}
                  className="erp-input mt-1"
                />
              </div>
              <div>
                <label className="erp-label">State</label>
                <input
                  value={form.state}
                  onChange={(event) => setForm((current) => ({ ...current, state: event.target.value }))}
                  className="erp-input mt-1"
                />
              </div>
              <div className="md:col-span-2 flex items-center gap-2">
                <input
                  id="default-warehouse"
                  type="checkbox"
                  checked={form.isDefault}
                  onChange={(event) => setForm((current) => ({ ...current, isDefault: event.target.checked }))}
                  className="h-4 w-4 rounded border-slate-300 text-(--erp-primary)"
                />
                <label htmlFor="default-warehouse" className="text-sm text-slate-700">
                  Set as default warehouse
                </label>
              </div>
              <div className="erp-form-actions md:col-span-2">
                <Button type="button" variant="outline" onClick={() => setTab("list")}>
                  Cancel
                </Button>
                <Button type="button" onClick={() => void save()} disabled={loading}>
                  Save Warehouse
                </Button>
              </div>
            </div>
          </CrudCard>
        </TabsContent>
      </Tabs>
    </StandardPageLayout>
  );
}
