"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Layers,
  MapPin,
  Phone,
  Star,
  UserCheck,
  Warehouse,
} from "lucide-react";
import {
  AdministrationGlobalPageShell,
  type KpiMetricItem,
  type PlatformListColumn,
} from "@/components/administration/AdministrationGlobalPageShell";
import { ErpDrawerFooter, ErpRowActions } from "@/components/workspace/page-kit";
import { UniversalDeleteDialog } from "@/components/workspace/templates/UniversalDeleteDialog";
import { QuickCopyButton } from "@/components/workspace/quick-copy";
import { inventoryApi } from "@/services/modules";
import { getApiErrorMessage } from "@/lib/api-errors";
import { notifyError, notifySuccess } from "@/lib/notifications";
import { cn } from "@/lib/utils";
import {
  emptyWarehouseForm,
  type WarehouseRow,
} from "../types/warehouse.types";

export function WarehouseManager() {
  const [rows, setRows] = useState<WarehouseRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [regionFilter, setRegionFilter] = useState("all");

  // Drawer inspector states
  const [mode, setMode] = useState<"closed" | "create" | "edit" | "view">("closed");
  const [editing, setEditing] = useState<WarehouseRow | null>(null);
  const [form, setForm] = useState(emptyWarehouseForm());
  const [activeTab, setActiveTab] = useState<"basic" | "location" | "operations">("basic");
  const [isSaving, setIsSaving] = useState(false);

  // Delete dialog state
  const [deleteTarget, setDeleteTarget] = useState<WarehouseRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadWarehouses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await inventoryApi.warehouses.list(1, 100);
      const data = (res.data?.data as WarehouseRow[]) || [];
      setRows(data);
      setError(null);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Failed to load warehouses."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadWarehouses();
  }, [loadWarehouses]);

  // Unique state regions
  const stateOptions = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((r) => r.state && set.add(r.state));
    return Array.from(set).sort();
  }, [rows]);

  // Filtered rows
  const filteredRows = useMemo(() => {
    const q = search.toLowerCase().trim();
    return rows.filter((r) => {
      const matchesSearch =
        !q ||
        (r.warehouseName || "").toLowerCase().includes(q) ||
        (r.warehouseCode || "").toLowerCase().includes(q) ||
        (r.city || "").toLowerCase().includes(q) ||
        (r.state || "").toLowerCase().includes(q) ||
        (r.contactPerson || "").toLowerCase().includes(q) ||
        (r.email || "").toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && r.isActive) ||
        (statusFilter === "inactive" && !r.isActive) ||
        (statusFilter === "default" && r.isDefault);

      const matchesRegion = regionFilter === "all" || r.state === regionFilter;

      return matchesSearch && matchesStatus && matchesRegion;
    });
  }, [rows, search, statusFilter, regionFilter]);

  // KPI Calculations
  const activeCount = useMemo(() => rows.filter((r) => r.isActive).length, [rows]);
  const defaultWarehouse = useMemo(() => rows.find((r) => r.isDefault), [rows]);

  const kpis: KpiMetricItem[] = [
    {
      label: "Total Warehouses",
      value: rows.length,
      tone: "info",
      icon: <Warehouse className="h-3.5 w-3.5" />,
      subtext: "Logistics facilities",
    },
    {
      label: "Operating Facilities",
      value: activeCount,
      tone: "positive",
      icon: <CheckCircle2 className="h-3.5 w-3.5" />,
      subtext: "Active dispatch sites",
    },
    {
      label: "Default Fulfillment",
      value: defaultWarehouse?.warehouseCode || "None",
      tone: "warning",
      icon: <Star className="h-3.5 w-3.5" />,
      subtext: defaultWarehouse ? defaultWarehouse.warehouseName : "No default set",
    },
    {
      label: "Regional Jurisdictions",
      value: stateOptions.length,
      tone: "neutral",
      icon: <MapPin className="h-3.5 w-3.5" />,
      subtext: "State territories",
    },
  ];

  // Drawer Openers
  const openCreate = () => {
    setEditing(null);
    setForm(emptyWarehouseForm());
    setActiveTab("basic");
    setMode("create");
  };

  const openEdit = (wh: WarehouseRow) => {
    setEditing(wh);
    setForm({
      warehouseCode: wh.warehouseCode || "",
      warehouseName: wh.warehouseName || "",
      address: wh.address || "",
      city: wh.city || "",
      state: wh.state || "",
      country: wh.country || "India",
      postalCode: wh.postalCode || "",
      contactPerson: wh.contactPerson || "",
      phoneNumber: wh.phoneNumber || "",
      email: wh.email || "",
      isDefault: wh.isDefault || false,
      isActive: wh.isActive !== false,
    });
    setActiveTab("basic");
    setMode("edit");
  };

  const openView = (wh: WarehouseRow) => {
    setEditing(wh);
    setMode("view");
  };

  // Save Warehouse
  const handleSave = async () => {
    if (!form.warehouseCode.trim() || !form.warehouseName.trim()) {
      notifyError("Warehouse code and warehouse name are required.");
      return;
    }

    const payload = {
      warehouseCode: form.warehouseCode.trim().toUpperCase(),
      warehouseName: form.warehouseName.trim(),
      address: form.address.trim() || undefined,
      city: form.city.trim() || undefined,
      state: form.state.trim() || undefined,
      country: form.country.trim() || "India",
      postalCode: form.postalCode.trim() || undefined,
      contactPerson: form.contactPerson.trim() || undefined,
      phoneNumber: form.phoneNumber.trim() || undefined,
      email: form.email.trim() || undefined,
      isDefault: form.isDefault,
      isActive: form.isActive,
    };

    try {
      setIsSaving(true);
      if (mode === "edit" && editing) {
        await inventoryApi.warehouses.update(editing.id, payload);
        notifySuccess(`Warehouse "${form.warehouseName}" updated successfully.`);
      } else {
        await inventoryApi.warehouses.create(payload);
        notifySuccess(`Warehouse "${form.warehouseName}" created successfully.`);
      }
      setMode("closed");
      await loadWarehouses();
    } catch (err: unknown) {
      notifyError(getApiErrorMessage(err, "Save failed. Admin access may be required."));
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Warehouse
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      await inventoryApi.warehouses.delete(deleteTarget.id);
      notifySuccess(`Warehouse "${deleteTarget.warehouseName}" removed.`);
      setDeleteTarget(null);
      await loadWarehouses();
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to delete warehouse."));
    } finally {
      setIsDeleting(false);
    }
  };

  // CSV Export
  const handleExportCsv = () => {
    if (filteredRows.length === 0) {
      notifyError("No warehouse records to export.");
      return;
    }
    const headers = [
      "Warehouse Code",
      "Warehouse Name",
      "City",
      "State",
      "Country",
      "Contact Person",
      "Phone",
      "Email",
      "Is Default",
      "Is Active",
    ];
    const csvRows = filteredRows.map((r) => [
      `"${(r.warehouseCode || "").replace(/"/g, '""')}"`,
      `"${(r.warehouseName || "").replace(/"/g, '""')}"`,
      `"${(r.city || "").replace(/"/g, '""')}"`,
      `"${(r.state || "").replace(/"/g, '""')}"`,
      `"${(r.country || "India").replace(/"/g, '""')}"`,
      `"${(r.contactPerson || "").replace(/"/g, '""')}"`,
      `"${(r.phoneNumber || "").replace(/"/g, '""')}"`,
      `"${(r.email || "").replace(/"/g, '""')}"`,
      `"${r.isDefault ? "Yes" : "No"}"`,
      `"${r.isActive ? "Active" : "Inactive"}"`,
    ]);
    const csvContent = [headers.join(","), ...csvRows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `warehouses_facilities_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    notifySuccess(`Exported ${filteredRows.length} warehouse facility record(s) to CSV.`);
  };

  // Table Columns
  const listColumns: PlatformListColumn[] = [
    { key: "code", label: "Facility Code" },
    { key: "name", label: "Warehouse Name", dataType: "string" },
    { key: "location", label: "Location" },
    { key: "contact", label: "Facility In-Charge" },
    { key: "default", label: "Default Site" },
    { key: "status", label: "Status" },
    { key: "actions", label: "Actions", locked: true },
  ];

  // Drawer Form Content
  const drawerForm = (
    <div className="space-y-0">
      {/* Tabs Header */}
      <div className="flex border-b border-slate-100 dark:border-slate-800 mb-5">
        {(
          [
            { id: "basic", label: "Basic Info", icon: <UserCheck className="h-3.5 w-3.5 mr-1.5" /> },
            { id: "location", label: "Location & Campus", icon: <MapPin className="h-3.5 w-3.5 mr-1.5" /> },
            { id: "operations", label: "Logistics & Scope", icon: <Layers className="h-3.5 w-3.5 mr-1.5" /> },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`inline-flex items-center px-4 py-2.5 text-xs font-semibold transition-colors border-b-2 cursor-pointer ${
              activeTab === tab.id
                ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "basic" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Facility Code *
            </label>
            <input
              className="erp-input h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs font-mono uppercase dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              value={form.warehouseCode}
              placeholder="e.g. WH-MUM-01"
              onChange={(e) => setForm((f) => ({ ...f, warehouseCode: e.target.value.toUpperCase() }))}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Operating Status
            </label>
            <select
              className="erp-input h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white cursor-pointer"
              value={form.isActive ? "active" : "inactive"}
              onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.value === "active" }))}
            >
              <option value="active">Active Facility</option>
              <option value="inactive">Decommissioned / Inactive</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Warehouse / Facility Name *
            </label>
            <input
              className="erp-input h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              value={form.warehouseName}
              placeholder="e.g. Central Logistics Hub - Bhiwandi"
              onChange={(e) => setForm((f) => ({ ...f, warehouseName: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Facility In-Charge / Manager
            </label>
            <input
              className="erp-input h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              value={form.contactPerson}
              placeholder="e.g. Anand Varma"
              onChange={(e) => setForm((f) => ({ ...f, contactPerson: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Helpline / Phone
            </label>
            <input
              className="erp-input h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              value={form.phoneNumber}
              placeholder="+91 98765 43210"
              onChange={(e) => setForm((f) => ({ ...f, phoneNumber: e.target.value }))}
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Dispatch Notification Email
            </label>
            <input
              type="email"
              className="erp-input h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              value={form.email}
              placeholder="warehouse.mumbai@company.com"
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
          </div>

          <div className="md:col-span-2">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 accent-blue-600"
                checked={form.isDefault}
                onChange={(e) => setForm((f) => ({ ...f, isDefault: e.target.checked }))}
              />
              <span>Set as Default Fulfillment Warehouse (auto-assigned to PO & SO when location is omitted)</span>
            </label>
          </div>
        </div>
      )}

      {activeTab === "location" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              City
            </label>
            <input
              className="erp-input h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              value={form.city}
              placeholder="e.g. Mumbai, Delhi, Bangalore"
              onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              State / Province
            </label>
            <input
              className="erp-input h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              value={form.state}
              placeholder="e.g. Maharashtra, Karnataka"
              onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Country
            </label>
            <input
              className="erp-input h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              value={form.country}
              placeholder="India"
              onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Postal / PIN Code
            </label>
            <input
              className="erp-input h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              value={form.postalCode}
              placeholder="e.g. 421302"
              onChange={(e) => setForm((f) => ({ ...f, postalCode: e.target.value }))}
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Full Campus & Gate Address
            </label>
            <textarea
              className="erp-input w-full min-h-[80px] rounded-lg border border-slate-200 bg-white p-3 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              value={form.address}
              placeholder="Plot number, industrial estate, landmark, and gate intake address"
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
            />
          </div>
        </div>
      )}

      {activeTab === "operations" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 dark:border-blue-900/60 dark:bg-blue-950/40">
            <p className="text-xs font-semibold text-blue-800 dark:text-blue-300 mb-1">
              Multi-Warehouse Stock Accountability & WMS Integration
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-200 leading-relaxed">
              Warehouse facilities serve as physical inventory roots for Goods Receipts (GRN), inter-warehouse stock transfers, physical count reconciliations, and barcoded bin/rack putaway workflows.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-900/50 space-y-2">
            <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              Automated Document Assignment Policy
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              When sales invoices or purchase orders are created without an explicit location selected, the facility designated as <span className="font-semibold text-blue-600 dark:text-blue-400">Default Site</span> is selected automatically to ensure zero unallocated inventory.
            </p>
          </div>
        </div>
      )}

      {/* Drawer Footer */}
      <div className="mt-5 border-t border-slate-100 dark:border-slate-800 pt-4">
        <ErpDrawerFooter
          onCancel={() => setMode("closed")}
          onSave={() => void handleSave()}
          saving={isSaving}
          isEdit={mode === "edit"}
        />
      </div>
    </div>
  );

  // Read-only View Content
  const viewInspectorContent = editing && (
    <div className="space-y-4 py-2">
      <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-2 dark:border-slate-800 dark:bg-slate-900/50">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Facility Profile</span>
          <div className="flex items-center gap-1.5">
            {editing.isDefault && (
              <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700 border border-blue-200 dark:bg-blue-950/50 dark:text-blue-300">
                Default Site
              </span>
            )}
            <span
              className={cn(
                "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold border",
                editing.isActive
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300"
                  : "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300"
              )}
            >
              {editing.isActive ? "Active" : "Inactive"}
            </span>
          </div>
        </div>
        <h3 className="text-base font-bold text-slate-900 dark:text-white">{editing.warehouseName}</h3>
        <p className="text-xs font-mono text-slate-500">Code: {editing.warehouseCode}</p>
      </div>

      <div className="space-y-2.5">
        <div className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900">
          <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
          <div>
            <p className="text-[11px] text-slate-400">Campus Location</p>
            <p className="text-xs font-medium text-slate-800 dark:text-slate-200">
              {[editing.city, editing.state, editing.country].filter(Boolean).join(", ") || "—"}
            </p>
            {editing.address && (
              <p className="text-[11px] text-slate-500 mt-0.5">{editing.address}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900">
          <UserCheck className="h-4 w-4 text-slate-400 shrink-0" />
          <div>
            <p className="text-[11px] text-slate-400">Facility Manager / In-Charge</p>
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              {editing.contactPerson || "Not Assigned"}
            </p>
          </div>
        </div>

        {(editing.phoneNumber || editing.email) && (
          <div className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900">
            <Phone className="h-4 w-4 text-emerald-600 shrink-0" />
            <div>
              <p className="text-[11px] text-slate-400">Contact & Dispatch Notifications</p>
              <p className="text-xs font-medium text-slate-800 dark:text-slate-200">
                {[editing.phoneNumber, editing.email].filter(Boolean).join(" · ")}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
        <button
          type="button"
          onClick={() => setMode("closed")}
          className="inline-flex h-8 items-center rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 cursor-pointer"
        >
          Close
        </button>
        <button
          type="button"
          onClick={() => openEdit(editing)}
          className="inline-flex h-8 items-center rounded-lg bg-blue-600 px-3 text-xs font-semibold text-white hover:bg-blue-700 cursor-pointer"
        >
          Edit Facility
        </button>
      </div>
    </div>
  );

  return (
    <>
      <AdministrationGlobalPageShell
        title="Warehouses & Storage Facilities"
        subtitle="Manage central logistics hubs, regional distribution centers, bin locations, and inventory holding sites."
        categoryTag="Inventory & Warehouse / Masters"
        icon="warehouse"
        kpiMetrics={kpis}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search warehouse name, code, city, state, manager…"
        filterOptions={[
          {
            key: "status",
            label: "All Statuses",
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { label: "All Statuses", value: "all" },
              { label: "Active Only", value: "active" },
              { label: "Inactive Only", value: "inactive" },
              { label: "Default Site Only", value: "default" },
            ],
          },
          {
            key: "region",
            label: "All Regions",
            value: regionFilter,
            onChange: setRegionFilter,
            options: [
              { label: "All Regions", value: "all" },
              ...stateOptions.map((s) => ({ label: s, value: s })),
            ],
          },
        ]}
        onClearFilters={() => {
          setSearch("");
          setStatusFilter("all");
          setRegionFilter("all");
        }}
        primaryActionLabel="New Warehouse"
        onPrimaryAction={openCreate}
        onRefresh={() => void loadWarehouses()}
        onExportCsv={handleExportCsv}
        isLoading={loading}
        listKey="inventory-warehouses"
        listRows={filteredRows}
        getRowId={(row) => row.id}
        emptyMessage="No warehouses found. Click New Warehouse to register your first storage location."
        listColumns={listColumns}
        renderListRow={(row) => (
          <tr key={row.id} className="erp-tr">
            <td className="erp-td font-mono text-xs font-semibold text-slate-900 dark:text-white">
              <div className="flex items-center gap-1.5">
                <span>{row.warehouseCode}</span>
                <QuickCopyButton text={row.warehouseCode} label="Code" />
              </div>
            </td>
            <td className="erp-td">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-600 to-orange-600 text-xs font-bold text-white shadow-sm">
                  {(row.warehouseName || "W").slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <button
                    type="button"
                    onClick={() => openView(row)}
                    className="text-sm font-semibold text-slate-900 hover:text-blue-600 dark:text-white dark:hover:text-blue-400 truncate text-left block cursor-pointer transition-colors"
                  >
                    {row.warehouseName}
                  </button>
                </div>
              </div>
            </td>
            <td className="erp-td">
              {row.city || row.state ? (
                <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-300">
                  <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                  {[row.city, row.state].filter(Boolean).join(", ")}
                </div>
              ) : (
                <span className="text-xs text-slate-400">—</span>
              )}
            </td>
            <td className="erp-td">
              <div className="space-y-0.5 text-xs">
                <p className="font-medium text-slate-800 dark:text-slate-200">
                  {row.contactPerson || "—"}
                </p>
                {row.phoneNumber && (
                  <p className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                    {row.phoneNumber}
                  </p>
                )}
              </div>
            </td>
            <td className="erp-td">
              {row.isDefault ? (
                <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700 border border-blue-200/60 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800/60">
                  <Star className="h-3 w-3 fill-blue-600 text-blue-600 dark:fill-blue-400 dark:text-blue-400" />
                  Default Site
                </span>
              ) : (
                <span className="text-xs text-slate-400">—</span>
              )}
            </td>
            <td className="erp-td">
              <span
                className={cn(
                  "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold border",
                  row.isActive
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/60"
                    : "bg-slate-100 text-slate-600 border-slate-200/80 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
                )}
              >
                {row.isActive ? "Active" : "Inactive"}
              </span>
            </td>
            <td className="erp-td text-right">
              <ErpRowActions
                onView={{ label: "View Details", onClick: () => openView(row) }}
                onEdit={{ label: "Edit Warehouse", onClick: () => openEdit(row) }}
                onDelete={{ label: "Delete Location", onClick: () => setDeleteTarget(row) }}
              />
            </td>
          </tr>
        )}
        isInspectorOpen={mode !== "closed"}
        onInspectorClose={() => setMode("closed")}
        inspectorTitle={
          mode === "edit"
            ? `Edit: ${editing?.warehouseName}`
            : mode === "view"
              ? `Facility: ${editing?.warehouseName}`
              : "Register New Warehouse"
        }
        inspectorSubTitle={
          mode === "view"
            ? "Logistics site overview, manager, and gate address"
            : "Fill details across Basic Info, Location & Campus, and Logistics Scope tabs"
        }
        inspectorWidth="xl"
        inspectorContent={mode === "view" ? viewInspectorContent : drawerForm}
      >
        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-300 flex items-center justify-between">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => void loadWarehouses()}
              className="font-bold text-rose-800 underline hover:text-rose-900 cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}
      </AdministrationGlobalPageShell>

      {/* Universal Delete Dialog */}
      <UniversalDeleteDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete Warehouse Facility"
        entityName={deleteTarget?.warehouseName || deleteTarget?.warehouseCode}
        description={`Are you sure you want to delete warehouse facility "${deleteTarget?.warehouseName}"? Physical inventory movements will retain archived facility reference.`}
        isHardDelete
        loading={isDeleting}
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
}

export default WarehouseManager;
