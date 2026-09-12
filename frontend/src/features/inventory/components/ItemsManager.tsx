"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Package,
  Layers,
  Tag,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Boxes,
  FileText,
  CreditCard,
  Scale,
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
import { formatCurrency } from "@/lib/formatters";
import { useLocalization } from "@/context/LocalizationContext";
import { getApiErrorMessage } from "@/lib/api-errors";
import { notifyError, notifySuccess } from "@/lib/notifications";
import { cn } from "@/lib/utils";

type Item = {
  id: string;
  itemCode: string;
  itemName: string;
  category: string;
  unitOfMeasure: string;
  sellingPrice: number;
  purchasePrice: number;
  hsnCode?: string;
  currentStock?: number;
  minStockLevel?: number;
  maxStockLevel?: number;
  reorderLevel?: number;
};

const COMMON_UOMS = [
  "Nos",
  "Kg",
  "Mtr",
  "Box",
  "Ltr",
  "Set",
  "Roll",
  "Pack",
  "Unit",
  "SqFt",
];

const INITIAL_FORM = () => ({
  itemCode: "",
  itemName: "",
  category: "General",
  unitOfMeasure: "Nos",
  sellingPrice: 0,
  purchasePrice: 0,
  hsnCode: "",
  minStockLevel: 0,
  maxStockLevel: 0,
  reorderLevel: 0,
});

const itemsApi = inventoryApi.items;

export default function ItemsManager() {
  const { activeCountry } = useLocalization();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [uomFilter, setUomFilter] = useState("all");

  // Drawer inspector states
  const [mode, setMode] = useState<"closed" | "create" | "edit" | "view">("closed");
  const [editing, setEditing] = useState<Item | null>(null);
  const [form, setForm] = useState(INITIAL_FORM());
  const [activeTab, setActiveTab] = useState<"basic" | "pricing" | "stock">("basic");
  const [isSaving, setIsSaving] = useState(false);

  // Delete dialog state
  const [deleteTarget, setDeleteTarget] = useState<Item | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch Items
  const fetchItems = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await itemsApi.getAll(1, 200);
      const list = res.data?.data || res.data?.items || (Array.isArray(res.data) ? res.data : []);
      setItems(list);
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to fetch inventory items"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchItems();
  }, []);

  // Unique categories list
  const categoryOptions = useMemo(() => {
    const set = new Set<string>();
    items.forEach((i) => i.category && set.add(i.category));
    return Array.from(set).sort();
  }, [items]);

  // Unique UOMs list
  const uomOptions = useMemo(() => {
    const set = new Set<string>(COMMON_UOMS);
    items.forEach((i) => i.unitOfMeasure && set.add(i.unitOfMeasure));
    return Array.from(set).sort();
  }, [items]);

  // Filtered items
  const filteredItems = useMemo(() => {
    const q = search.toLowerCase().trim();
    return items.filter((item) => {
      const matchesSearch =
        !q ||
        (item.itemName || "").toLowerCase().includes(q) ||
        (item.itemCode || "").toLowerCase().includes(q) ||
        (item.category || "").toLowerCase().includes(q) ||
        (item.hsnCode || "").toLowerCase().includes(q);

      const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
      const matchesUom = uomFilter === "all" || item.unitOfMeasure === uomFilter;

      return matchesSearch && matchesCategory && matchesUom;
    });
  }, [items, search, categoryFilter, uomFilter]);

  // KPI Calculations
  const reorderAlertCount = useMemo(
    () => items.filter((i) => (i.reorderLevel || 0) > 0).length,
    [items]
  );
  const totalCatalogValue = useMemo(
    () => items.reduce((sum, i) => sum + (Number(i.sellingPrice) || 0), 0),
    [items]
  );

  const kpis: KpiMetricItem[] = [
    {
      label: "Total Products / SKUs",
      value: items.length,
      tone: "info",
      icon: <Package className="h-3.5 w-3.5" />,
      subtext: "Master catalog SKUs",
    },
    {
      label: "Product Categories",
      value: categoryOptions.length,
      tone: "positive",
      icon: <Tag className="h-3.5 w-3.5" />,
      subtext: "Classification groups",
    },
    {
      label: "Reorder Thresholds",
      value: reorderAlertCount,
      tone: "warning",
      icon: <AlertCircle className="h-3.5 w-3.5" />,
      subtext: "Stock safety levels",
    },
    {
      label: "Combined Value",
      value: formatCurrency(totalCatalogValue),
      tone: "neutral",
      icon: <DollarSign className="h-3.5 w-3.5" />,
      subtext: "Unit list sum",
    },
  ];

  // Drawer Openers
  const openCreate = () => {
    setEditing(null);
    setForm(INITIAL_FORM());
    setActiveTab("basic");
    setMode("create");
  };

  const openEdit = (item: Item) => {
    setEditing(item);
    setForm({
      itemCode: item.itemCode || "",
      itemName: item.itemName || "",
      category: item.category || "General",
      unitOfMeasure: item.unitOfMeasure || "Nos",
      sellingPrice: item.sellingPrice || 0,
      purchasePrice: item.purchasePrice || 0,
      hsnCode: item.hsnCode || "",
      minStockLevel: item.minStockLevel || 0,
      maxStockLevel: item.maxStockLevel || 0,
      reorderLevel: item.reorderLevel || 0,
    });
    setActiveTab("basic");
    setMode("edit");
  };

  const openView = (item: Item) => {
    setEditing(item);
    setMode("view");
  };

  // Save Item
  const handleSave = async () => {
    if (!form.itemName.trim()) {
      notifyError("Item Name / Description is required.");
      return;
    }
    if (!form.itemCode.trim()) {
      notifyError("Item / SKU Code is required.");
      return;
    }

    const payload = {
      itemCode: form.itemCode.trim().toUpperCase(),
      itemName: form.itemName.trim(),
      category: form.category.trim() || "General",
      unitOfMeasure: form.unitOfMeasure || "Nos",
      hsnCode: form.hsnCode.trim() || undefined,
      purchasePrice: Number(form.purchasePrice) || 0,
      sellingPrice: Number(form.sellingPrice) || 0,
      minStockLevel: Number(form.minStockLevel) || 0,
      maxStockLevel: Number(form.maxStockLevel) || 0,
      reorderLevel: Number(form.reorderLevel) || 0,
    };

    try {
      setIsSaving(true);
      if (mode === "edit" && editing) {
        await itemsApi.update(editing.id, payload);
        notifySuccess(`Item "${form.itemName}" updated successfully.`);
      } else {
        await itemsApi.create(payload);
        notifySuccess(`Item "${form.itemName}" created successfully.`);
      }
      setMode("closed");
      await fetchItems();
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to save item."));
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Item
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      await itemsApi.delete(deleteTarget.id);
      notifySuccess(`Item "${deleteTarget.itemName}" deleted successfully.`);
      setDeleteTarget(null);
      await fetchItems();
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to delete item."));
    } finally {
      setIsDeleting(false);
    }
  };

  // CSV Export
  const handleExportCsv = () => {
    if (filteredItems.length === 0) {
      notifyError("No catalog items to export.");
      return;
    }
    const headers = [
      "SKU Code",
      "Item Name",
      "Category",
      "UOM",
      "HSN Code",
      "Purchase Price",
      "Selling Price",
      "Min Stock",
      "Reorder Level",
      "Max Stock",
    ];
    const rows = filteredItems.map((i) => [
      `"${(i.itemCode || "").replace(/"/g, '""')}"`,
      `"${(i.itemName || "").replace(/"/g, '""')}"`,
      `"${(i.category || "").replace(/"/g, '""')}"`,
      `"${(i.unitOfMeasure || "").replace(/"/g, '""')}"`,
      `"${(i.hsnCode || "").replace(/"/g, '""')}"`,
      `"${i.purchasePrice ?? 0}"`,
      `"${i.sellingPrice ?? 0}"`,
      `"${i.minStockLevel ?? 0}"`,
      `"${i.reorderLevel ?? 0}"`,
      `"${i.maxStockLevel ?? 0}"`,
    ]);
    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `items_catalog_master_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    notifySuccess(`Exported ${filteredItems.length} catalog SKU(s) to CSV.`);
  };

  // Table Columns
  const listColumns: PlatformListColumn[] = [
    { key: "code", label: "SKU / Code" },
    { key: "name", label: "Item Description", dataType: "string" },
    { key: "category", label: "Category" },
    { key: "uom", label: "UOM" },
    { key: "hsn", label: "HSN / SAC" },
    { key: "purchasePrice", label: "Cost Price", dataType: "currency" },
    { key: "sellingPrice", label: "Selling Price", dataType: "currency" },
    { key: "actions", label: "Actions", locked: true },
  ];

  // Drawer Form Content
  const drawerForm = (
    <div className="space-y-0">
      {/* Tabs Header */}
      <div className="flex border-b border-slate-100 dark:border-slate-800 mb-5">
        {(
          [
            { id: "basic", label: "Classification", icon: <Tag className="h-3.5 w-3.5 mr-1.5" /> },
            { id: "pricing", label: "Pricing & Valuation", icon: <DollarSign className="h-3.5 w-3.5 mr-1.5" /> },
            { id: "stock", label: "Stock & Reorder", icon: <Layers className="h-3.5 w-3.5 mr-1.5" /> },
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
              Item / SKU Code *
            </label>
            <input
              className="erp-input h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs font-mono uppercase dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              value={form.itemCode}
              placeholder="e.g. SKU-5001"
              onChange={(e) => setForm((f) => ({ ...f, itemCode: e.target.value.toUpperCase() }))}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Product Category
            </label>
            <input
              className="erp-input h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              value={form.category}
              placeholder="e.g. Raw Materials, Finished Goods, Spares"
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Item Description / Title *
            </label>
            <input
              className="erp-input h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              value={form.itemName}
              placeholder="Full item name, model, or technical specification"
              onChange={(e) => setForm((f) => ({ ...f, itemName: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Unit of Measure (UOM)
            </label>
            <select
              className="erp-input h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              value={form.unitOfMeasure}
              onChange={(e) => setForm((f) => ({ ...f, unitOfMeasure: e.target.value }))}
            >
              {uomOptions.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              HSN / SAC Tax Code
            </label>
            <input
              className="erp-input h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs font-mono dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              value={form.hsnCode}
              placeholder="e.g. 84713010 (GST Schedule)"
              onChange={(e) => setForm((f) => ({ ...f, hsnCode: e.target.value }))}
            />
          </div>
        </div>
      )}

      {activeTab === "pricing" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Purchase Cost Price ({activeCountry.currencySymbol})
            </label>
            <input
              type="number"
              min={0}
              className="erp-input h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              value={form.purchasePrice}
              placeholder="0"
              onChange={(e) => setForm((f) => ({ ...f, purchasePrice: Number(e.target.value) }))}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Standard Selling Price / MRP ({activeCountry.currencySymbol})
            </label>
            <input
              type="number"
              min={0}
              className="erp-input h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              value={form.sellingPrice}
              placeholder="0"
              onChange={(e) => setForm((f) => ({ ...f, sellingPrice: Number(e.target.value) }))}
            />
          </div>

          <div className="md:col-span-2 rounded-xl border border-blue-100 bg-blue-50 p-4 dark:border-blue-900/60 dark:bg-blue-950/40">
            <p className="text-xs font-semibold text-blue-800 dark:text-blue-300 mb-1">
              Gross Margin Estimation
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-200 leading-relaxed">
              Unit Profit Margin:{" "}
              <span className="font-bold">
                {formatCurrency(Math.max(0, form.sellingPrice - form.purchasePrice))}
              </span>{" "}
              ({form.purchasePrice > 0
                ? `${Math.round(((form.sellingPrice - form.purchasePrice) / form.purchasePrice) * 100)}% Markup`
                : "Standard baseline"}
              ). Prices flow automatically to Quotations, Sales Orders, and PO creation.
            </p>
          </div>
        </div>
      )}

      {activeTab === "stock" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Minimum Safety Stock
            </label>
            <input
              type="number"
              min={0}
              className="erp-input h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              value={form.minStockLevel}
              placeholder="0"
              onChange={(e) => setForm((f) => ({ ...f, minStockLevel: Number(e.target.value) }))}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Reorder Trigger Level
            </label>
            <input
              type="number"
              min={0}
              className="erp-input h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              value={form.reorderLevel}
              placeholder="0"
              onChange={(e) => setForm((f) => ({ ...f, reorderLevel: Number(e.target.value) }))}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Maximum Stock Capacity
            </label>
            <input
              type="number"
              min={0}
              className="erp-input h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              value={form.maxStockLevel}
              placeholder="0"
              onChange={(e) => setForm((f) => ({ ...f, maxStockLevel: Number(e.target.value) }))}
            />
          </div>

          <div className="md:col-span-3 rounded-xl border border-amber-100 bg-amber-50 p-4 dark:border-amber-900/60 dark:bg-amber-950/40">
            <p className="text-xs font-semibold text-amber-800 dark:text-amber-300 mb-1">
              Automated Replenishment & MRP Integration
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-200 leading-relaxed">
              When current inventory in any warehouse drops below the Reorder Level, the system automatically triggers a Purchase Request (PR) alert in the Procurement module to avoid production or fulfillment stock-outs.
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
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Catalog SKU</span>
          <span className="inline-flex items-center rounded-md bg-purple-50 px-2 py-0.5 text-xs font-semibold text-purple-700 border border-purple-200/60 dark:bg-purple-950/50 dark:text-purple-300">
            {editing.category || "General"}
          </span>
        </div>
        <h3 className="text-base font-bold text-slate-900 dark:text-white">{editing.itemName}</h3>
        <p className="text-xs font-mono text-slate-500">SKU: {editing.itemCode}</p>
      </div>

      <div className="space-y-2.5">
        <div className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900">
          <Scale className="h-4 w-4 text-slate-400 shrink-0" />
          <div>
            <p className="text-[11px] text-slate-400">Unit of Measure & HSN</p>
            <p className="text-xs font-medium text-slate-800 dark:text-slate-200">
              {editing.unitOfMeasure} (HSN: {editing.hsnCode || "—"})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900">
          <DollarSign className="h-4 w-4 text-emerald-600 shrink-0" />
          <div>
            <p className="text-[11px] text-slate-400">Pricing Breakdown</p>
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              Selling: {formatCurrency(editing.sellingPrice)} · Cost: {formatCurrency(editing.purchasePrice)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900">
          <Layers className="h-4 w-4 text-amber-600 shrink-0" />
          <div>
            <p className="text-[11px] text-slate-400">Stock Thresholds</p>
            <p className="text-xs font-medium text-slate-800 dark:text-slate-200">
              Min: {editing.minStockLevel || 0} · Reorder: {editing.reorderLevel || 0} · Max: {editing.maxStockLevel || 0}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
        <button
          type="button"
          onClick={() => setMode("closed")}
          className="inline-flex h-8 items-center rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
        >
          Close
        </button>
        <button
          type="button"
          onClick={() => openEdit(editing)}
          className="inline-flex h-8 items-center rounded-lg bg-blue-600 px-3 text-xs font-semibold text-white hover:bg-blue-700"
        >
          Edit SKU Record
        </button>
      </div>
    </div>
  );

  return (
    <>
      <AdministrationGlobalPageShell
        title="Items & Product Catalog Master"
        subtitle="Manage inventory SKUs, HSN/SAC codes, purchasing & selling prices, unit of measures, and safety reorder thresholds."
        categoryTag="Inventory & Warehouse / Masters"
        icon="package"
        kpiMetrics={kpis}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search item name, code, category, HSN..."
        filterOptions={[
          {
            key: "category",
            label: "All Categories",
            value: categoryFilter,
            onChange: setCategoryFilter,
            options: [
              { label: "All Categories", value: "all" },
              ...categoryOptions.map((c) => ({ label: c, value: c })),
            ],
          },
          {
            key: "uom",
            label: "All Units",
            value: uomFilter,
            onChange: setUomFilter,
            options: [
              { label: "All Units", value: "all" },
              ...uomOptions.map((u) => ({ label: u, value: u })),
            ],
          },
        ]}
        onClearFilters={() => {
          setSearch("");
          setCategoryFilter("all");
          setUomFilter("all");
        }}
        primaryActionLabel="Add Item"
        onPrimaryAction={openCreate}
        onRefresh={() => void fetchItems()}
        onExportCsv={handleExportCsv}
        isLoading={loading}
        listKey="inventory-items"
        listRows={filteredItems}
        getRowId={(row) => row.id}
        emptyMessage="No catalog items found. Click Add Item to register your first product or raw material."
        listColumns={listColumns}
        renderListRow={(item) => (
          <tr key={item.id} className="erp-tr">
            <td className="erp-td font-mono text-xs font-semibold text-slate-900 dark:text-white">
              <div className="flex items-center gap-1.5">
                <span>{item.itemCode}</span>
                <QuickCopyButton text={item.itemCode} label="SKU" />
              </div>
            </td>
            <td className="erp-td">
              <button
                type="button"
                onClick={() => openView(item)}
                className="text-sm font-semibold text-slate-900 hover:text-blue-600 dark:text-white dark:hover:text-blue-400 truncate text-left block cursor-pointer transition-colors"
              >
                {item.itemName}
              </button>
            </td>
            <td className="erp-td">
              <span className="inline-flex items-center rounded-md bg-purple-50 px-2 py-0.5 text-xs font-semibold text-purple-700 border border-purple-200/60 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800/60">
                {item.category || "General"}
              </span>
            </td>
            <td className="erp-td text-xs text-slate-600 dark:text-slate-300 font-medium">
              {item.unitOfMeasure}
            </td>
            <td className="erp-td font-mono text-xs text-slate-600 dark:text-slate-300">
              {item.hsnCode || "—"}
            </td>
            <td className="erp-td text-xs text-slate-700 dark:text-slate-300 font-medium">
              {formatCurrency(item.purchasePrice)}
            </td>
            <td className="erp-td text-xs font-bold text-slate-900 dark:text-white">
              {formatCurrency(item.sellingPrice)}
            </td>
            <td className="erp-td text-right">
              <ErpRowActions
                onView={{ label: "View Details", onClick: () => openView(item) }}
                onEdit={{ label: "Edit SKU", onClick: () => openEdit(item) }}
                onDelete={{ label: "Delete Item", onClick: () => setDeleteTarget(item) }}
              />
            </td>
          </tr>
        )}
        isInspectorOpen={mode !== "closed"}
        onInspectorClose={() => setMode("closed")}
        inspectorTitle={
          mode === "edit"
            ? `Edit SKU: ${editing?.itemCode}`
            : mode === "view"
              ? `Catalog Item: ${editing?.itemName}`
              : "Register New Catalog Item"
        }
        inspectorSubTitle={
          mode === "view"
            ? "SKU specifications, pricing, and safety reorder levels"
            : "Configure item attributes across Classification, Pricing, and Reorder tabs"
        }
        inspectorWidth="xl"
        inspectorContent={mode === "view" ? viewInspectorContent : drawerForm}
      >
        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-300 flex items-center justify-between">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => void fetchItems()}
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
        title="Delete Catalog Item"
        entityName={deleteTarget?.itemName || deleteTarget?.itemCode}
        description={`Are you sure you want to delete SKU "${deleteTarget?.itemCode}" (${deleteTarget?.itemName})? Historical purchase and sales line items will preserve record references.`}
        isHardDelete
        loading={isDeleting}
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
}
