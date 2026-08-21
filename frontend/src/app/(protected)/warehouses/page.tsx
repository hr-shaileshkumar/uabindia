"use client";

import { useCallback, useEffect, useState } from "react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { CrudCard, CrudHeaderStats } from "@/components/erp/crud-workspace";
import { SideDrawer } from "@/components/ui/side-drawer";
import { ErpCreateButton, ErpDrawerFooter, ErpRefreshButton } from "@/components/erp/erp-page-kit";
import { useErpListView } from "@/components/erp/erp-list-view";
import { inventoryApi } from "@/services/modules";

type WarehouseRow = {
  id: string;
  warehouseCode: string;
  warehouseName: string;
  city?: string;
  state?: string;
  isDefault: boolean;
  isActive: boolean;
};

const emptyForm = () => ({
  warehouseCode: "",
  warehouseName: "",
  city: "",
  state: "",
  isDefault: false,
});

export default function WarehousesPage() {
  const [rows, setRows] = useState<WarehouseRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [form, setForm] = useState(emptyForm());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await inventoryApi.warehouses.list(1, 100);
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
      setSaving(true);
      await inventoryApi.warehouses.create({
        warehouseCode: form.warehouseCode.trim(),
        warehouseName: form.warehouseName.trim(),
        city: form.city || undefined,
        state: form.state || undefined,
        isDefault: form.isDefault,
      });
      setDrawerOpen(false);
      setForm(emptyForm());
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Save failed. Admin access may be required.");
    } finally {
      setSaving(false);
    }
  };

  const activeCount = rows.filter((row) => row.isActive).length;
  const defaultCount = rows.filter((row) => row.isDefault).length;

  const list = useErpListView({
    listKey: "warehouses",
    rows: rows.map((row) => ({ ...row, location: [row.city, row.state].filter(Boolean).join(", ") })),
    columns: [
      { key: "warehouseCode", label: "Code" },
      { key: "warehouseName", label: "Warehouse" },
      { key: "location", label: "Location" },
      { key: "isDefault", label: "Default", dataType: "boolean" },
      { key: "isActive", label: "Status", dataType: "boolean" },
    ],
    getRowId: (row) => row.id,
    loading,
    emptyMessage: "No warehouses yet. Use New warehouse to add the first location.",
    onCreate: () => setDrawerOpen(true),
    createLabel: "New warehouse",
    onRefresh: () => void load(),
    renderRow: (row) => (
      <tr key={row.id} className="erp-tr">
        <td className="erp-td font-medium text-slate-900">{row.warehouseCode}</td>
        <td className="erp-td">{row.warehouseName}</td>
        <td className="erp-td">{row.location || "—"}</td>
        <td className="erp-td">
          {row.isDefault ? <span className="erp-chip erp-chip-info">Default</span> : "—"}
        </td>
        <td className="erp-td">
          <span className={row.isActive ? "erp-chip erp-chip-success" : "erp-chip erp-chip-neutral"}>
            {row.isActive ? "Active" : "Inactive"}
          </span>
        </td>
      </tr>
    ),
  });

  return (
    <StandardPageLayout
      title="Warehouses"
      subtitle="Storage locations used by receipts, transfers, issues, and stock accountability."
      eyebrow="Inventory"
      icon="warehouse"
      meta={
        <CrudHeaderStats
          items={[
            { label: "Warehouses", value: rows.length, helper: "locations" },
            { label: "Active", value: activeCount, tone: "positive" },
            { label: "Default", value: defaultCount, tone: "info" },
            { label: "Inactive", value: rows.length - activeCount, tone: "warning" },
          ]}
        />
      }
      actions={
        <>
          <ErpRefreshButton onClick={() => void load()} loading={loading} />
          {list.headerTools}
          <ErpCreateButton label="New warehouse" onClick={() => setDrawerOpen(true)} />
        </>
      }
      filters={list.filterBar}
    >
      {error ? <div className="erp-alert-error text-sm">{error}</div> : null}

      <CrudCard>{list.table}</CrudCard>

      <SideDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="New warehouse"
        subtitle="Code and name are required. Default warehouse is used when a document has no location."
        width="md"
        footer={
          <ErpDrawerFooter
            onCancel={() => setDrawerOpen(false)}
            onSave={() => void save()}
            saving={saving}
            saveLabel="Save warehouse"
          />
        }
      >
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="erp-label">Warehouse code</label>
            <input
              value={form.warehouseCode}
              onChange={(event) => setForm((current) => ({ ...current, warehouseCode: event.target.value }))}
              className="erp-input mt-1"
              placeholder="WH-DEL-01"
            />
          </div>
          <div>
            <label className="erp-label">Warehouse name</label>
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
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={form.isDefault}
              onChange={(event) => setForm((current) => ({ ...current, isDefault: event.target.checked }))}
              className="h-4 w-4 rounded border-slate-300"
            />
            Set as default warehouse
          </label>
        </div>
      </SideDrawer>
    </StandardPageLayout>
  );
}
