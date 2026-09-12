"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AdministrationGlobalPageShell,
  type KpiMetricItem,
} from "@/components/administration/AdministrationGlobalPageShell";
import { SideDrawer } from "@/components/ui/side-drawer";
import { ErpDrawerFooter } from "@/components/workspace/page-kit";
import { UniversalDeleteDialog } from "@/components/workspace/templates/UniversalDeleteDialog";
import { salesApi } from "@/services/modules";
import { notifyError, notifySuccess } from "@/lib/notifications";
import { getApiErrorMessage } from "@/lib/api-errors";
import { asRows, formatInr, formatSchemeDiscount, useDocumentMasters } from "@/components/workspace/document-kit";
import { usePermissions } from "@/context/PermissionContext";
import { PERMISSIONS } from "@/constants/permissions";
import {
  Percent,
  Tag,
  Sparkles,
  Award,
  Layers,
  Search,
  Plus,
  Edit3,
  Trash2,
  Eye,
  Copy,
  Check,
  Calendar,
  Package,
  Boxes,
  ArrowRight,
  TrendingDown,
  CheckCircle2,
  Clock,
  AlertCircle,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Info,
} from "lucide-react";

export type SchemeRow = {
  id: string;
  schemeCode?: string;
  schemeName?: string;
  discountType?: string;
  scope?: string;
  value?: number;
  priority?: number;
  validFrom?: string;
  validTo?: string;
  minQuantity?: number;
  minBillAmount?: number;
  maxDiscountAmount?: number;
  status?: string;
  category?: string;
  notes?: string;
  productCount?: number;
  lines?: Array<{ id?: string; itemId?: string; itemName?: string; itemCode?: string; category?: string; value?: number }>;
};

export type ProductRow = {
  id: string;
  itemCode?: string;
  itemName?: string;
  category?: string;
  sellingPrice?: number;
  mrp?: number;
  schemeId?: string;
  schemeName?: string;
  discountType?: string;
  discountValue?: number;
  netRate?: number;
};

export type SchemeForm = {
  schemeName: string;
  schemeCode: string;
  discountType: "Percent" | "Amount" | "SpecialPrice";
  scope: "AllItems" | "Category" | "Items";
  value: string;
  priority: string;
  validFrom: string;
  validTo: string;
  minQuantity: string;
  minBillAmount: string;
  maxDiscountAmount: string;
  status: string;
  category: string;
  notes: string;
  itemIds: string[];
};

type ViewTab = "schemes" | "products";
type DrawerTab = "definition" | "targeting" | "validity";

const todayIso = () => new Date().toISOString().slice(0, 10);
const plusDays = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
};

const emptyForm = (): SchemeForm => ({
  schemeName: "",
  schemeCode: "",
  discountType: "Percent",
  scope: "Items",
  value: "10",
  priority: "10",
  validFrom: todayIso(),
  validTo: plusDays(30),
  minQuantity: "0",
  minBillAmount: "0",
  maxDiscountAmount: "0",
  status: "Active",
  category: "",
  notes: "",
  itemIds: [],
});

const TYPE_CONFIG: Record<string, { label: string; badge: string; iconColor: string }> = {
  Percent: {
    label: "% Off List Price",
    badge: "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-600/20 dark:bg-indigo-950/60 dark:text-indigo-300",
    iconColor: "text-indigo-600",
  },
  Amount: {
    label: "₹ Flat Off Per Unit",
    badge: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20 dark:bg-emerald-950/60 dark:text-emerald-300",
    iconColor: "text-emerald-600",
  },
  SpecialPrice: {
    label: "Fixed Special Price",
    badge: "bg-amber-50 text-amber-700 ring-1 ring-amber-600/20 dark:bg-amber-950/60 dark:text-amber-300",
    iconColor: "text-amber-600",
  },
};

const SCOPE_CONFIG: Record<string, { label: string; badge: string }> = {
  AllItems: {
    label: "Storewide (All Items)",
    badge: "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300",
  },
  Category: {
    label: "Category Specific",
    badge: "bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300",
  },
  Items: {
    label: "Selected SKU Set",
    badge: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  },
};

const formatDateOnly = (val?: string) => {
  if (!val) return "-";
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return val;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const getValidityStatus = (from?: string, to?: string) => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  if (from) {
    const f = new Date(from);
    if (!Number.isNaN(f.getTime()) && f > now) {
      return { label: "Upcoming", tone: "warning" as const };
    }
  }

  if (to) {
    const t = new Date(to);
    if (!Number.isNaN(t.getTime()) && t < now) {
      return { label: "Expired", tone: "negative" as const };
    }
  }

  return { label: "Live Campaign", tone: "positive" as const };
};

export function DiscountsManager() {
  const { items } = useDocumentMasters();
  const [tab, setTab] = useState<ViewTab>("schemes");
  const [schemes, setSchemes] = useState<SchemeRow[]>([]);
  const [productMap, setProductMap] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Search & Multi-Filters
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedScope, setSelectedScope] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedValidity, setSelectedValidity] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Slide-Over Drawer States
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [drawerTab, setDrawerTab] = useState<DrawerTab>("definition");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [inspectedScheme, setInspectedScheme] = useState<SchemeRow | null>(null);
  const [form, setForm] = useState<SchemeForm>(emptyForm);
  const [itemQuery, setItemQuery] = useState("");

  // Delete State
  const [schemeToDelete, setSchemeToDelete] = useState<SchemeRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { hasPermission, isSuperAdmin } = usePermissions();
  const canManageDiscounts =
    isSuperAdmin || hasPermission([PERMISSIONS.SALES_ORDERS_CREATE, PERMISSIONS.SALES_ORDERS_EDIT]);

  const categories = useMemo(
    () => [...new Set(items.map((item) => item.category).filter(Boolean))] as string[],
    [items]
  );

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [schemeRes, mapRes] = await Promise.all([
        salesApi.discounts.getAll(1, 200),
        salesApi.discounts.productMap().catch(() => ({ data: { data: [] } })),
      ]);
      setSchemes(asRows<SchemeRow>(schemeRes.data));
      setProductMap(asRows<ProductRow>(mapRes.data));
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to load discount schemes."), "Discounts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Copy helper
  const handleCopy = (code: string) => {
    void navigator.clipboard.writeText(code);
    setCopiedCode(code);
    notifySuccess(`Copied "${code}" to clipboard.`, "Clipboard");
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Open Create Drawer
  const openCreate = () => {
    setEditingId(null);
    setInspectedScheme(null);
    setIsEditing(true);
    setForm(emptyForm());
    setItemQuery("");
    setDrawerTab("definition");
    setDrawerOpen(true);
  };

  // Open Edit Drawer
  const openEdit = (row: SchemeRow) => {
    setEditingId(row.id);
    setInspectedScheme(row);
    setIsEditing(true);
    setForm({
      schemeName: row.schemeName || "",
      schemeCode: row.schemeCode || "",
      discountType: (row.discountType as SchemeForm["discountType"]) || "Percent",
      scope: (row.scope as SchemeForm["scope"]) || "Items",
      value: String(row.value ?? 0),
      priority: String(row.priority ?? 10),
      validFrom: String(row.validFrom || "").slice(0, 10) || todayIso(),
      validTo: String(row.validTo || "").slice(0, 10) || plusDays(30),
      minQuantity: String(row.minQuantity ?? 0),
      minBillAmount: String(row.minBillAmount ?? 0),
      maxDiscountAmount: String(row.maxDiscountAmount ?? 0),
      status: row.status || "Active",
      category: row.category || "",
      notes: row.notes || "",
      itemIds: (row.lines || []).map((line) => String(line.itemId || "")).filter(Boolean),
    });
    setItemQuery("");
    setDrawerTab("definition");
    setDrawerOpen(true);
  };

  // Open Inspect Drawer (Read-Only)
  const openInspect = (row: SchemeRow) => {
    setEditingId(row.id);
    setInspectedScheme(row);
    setIsEditing(false);
    setForm({
      schemeName: row.schemeName || "",
      schemeCode: row.schemeCode || "",
      discountType: (row.discountType as SchemeForm["discountType"]) || "Percent",
      scope: (row.scope as SchemeForm["scope"]) || "Items",
      value: String(row.value ?? 0),
      priority: String(row.priority ?? 10),
      validFrom: String(row.validFrom || "").slice(0, 10) || todayIso(),
      validTo: String(row.validTo || "").slice(0, 10) || plusDays(30),
      minQuantity: String(row.minQuantity ?? 0),
      minBillAmount: String(row.minBillAmount ?? 0),
      maxDiscountAmount: String(row.maxDiscountAmount ?? 0),
      status: row.status || "Active",
      category: row.category || "",
      notes: row.notes || "",
      itemIds: (row.lines || []).map((line) => String(line.itemId || "")).filter(Boolean),
    });
    setItemQuery("");
    setDrawerTab("definition");
    setDrawerOpen(true);
  };

  // Save Scheme
  const save = async () => {
    if (!form.schemeName.trim()) {
      notifyError("Scheme name is required.", "Validation Error");
      return;
    }
    if (form.scope === "Category" && !form.category.trim()) {
      notifyError("Choose the product category this discount applies to.", "Validation Error");
      return;
    }
    if (form.scope === "Items" && form.itemIds.length === 0) {
      notifyError("Select at least one product SKU for this discount offer.", "Validation Error");
      return;
    }

    const payload = {
      schemeName: form.schemeName.trim(),
      schemeCode: form.schemeCode.trim() || undefined,
      discountType: form.discountType,
      scope: form.scope,
      value: Number(form.value) || 0,
      priority: Number(form.priority) || 10,
      validFrom: form.validFrom,
      validTo: form.validTo,
      minQuantity: Number(form.minQuantity) || 0,
      minBillAmount: Number(form.minBillAmount) || 0,
      maxDiscountAmount: Number(form.maxDiscountAmount) || 0,
      status: form.status,
      category: form.scope === "Category" ? form.category : undefined,
      notes: form.notes || undefined,
      lines:
        form.scope === "Items"
          ? form.itemIds.map((itemId) => ({ itemId }))
          : form.scope === "Category"
          ? [{ category: form.category }]
          : [],
    };

    try {
      setSaving(true);
      if (editingId) {
        await salesApi.discounts.update(editingId, payload);
        notifySuccess("Discount scheme updated successfully.", "Discounts");
      } else {
        await salesApi.discounts.create(payload);
        notifySuccess("Discount promotional scheme created.", "Discounts");
      }
      setDrawerOpen(false);
      setForm(emptyForm());
      setEditingId(null);
      await load();
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Could not save discount scheme."), "Discounts");
    } finally {
      setSaving(false);
    }
  };

  // Confirm Delete
  const handleDeleteConfirm = async () => {
    if (!schemeToDelete) return;
    try {
      setDeleting(true);
      await salesApi.discounts.delete(schemeToDelete.id);
      notifySuccess(`Discount scheme "${schemeToDelete.schemeName}" deleted.`, "Discounts");
      setSchemeToDelete(null);
      if (drawerOpen && editingId === schemeToDelete.id) {
        setDrawerOpen(false);
      }
      await load();
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Delete failed."), "Discounts");
    } finally {
      setDeleting(false);
    }
  };

  // Filtered Schemes
  const filteredSchemes = useMemo(() => {
    const q = search.trim().toLowerCase();

    return schemes.filter((row) => {
      // Search
      if (q) {
        const text = `${row.schemeName ?? ""} ${row.schemeCode ?? ""} ${row.category ?? ""} ${row.notes ?? ""}`.toLowerCase();
        if (!text.includes(q)) return false;
      }

      // Type
      if (selectedType !== "all" && row.discountType !== selectedType) return false;

      // Scope
      if (selectedScope !== "all" && row.scope !== selectedScope) return false;

      // Status
      if (selectedStatus !== "all" && (row.status ?? "Draft") !== selectedStatus) return false;

      // Category
      if (selectedCategory !== "all" && row.category !== selectedCategory) return false;

      // Validity
      if (selectedValidity !== "all") {
        const val = getValidityStatus(row.validFrom, row.validTo);
        if (selectedValidity === "live" && val.label !== "Live Campaign") return false;
        if (selectedValidity === "upcoming" && val.label !== "Upcoming") return false;
        if (selectedValidity === "expired" && val.label !== "Expired") return false;
      }

      return true;
    });
  }, [schemes, search, selectedType, selectedScope, selectedStatus, selectedCategory, selectedValidity]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return productMap.filter((row) => {
      if (!q) return true;
      const text = `${row.itemName ?? ""} ${row.itemCode ?? ""} ${row.category ?? ""} ${row.schemeName ?? ""}`.toLowerCase();
      return text.includes(q);
    });
  }, [productMap, search]);

  // Paginated Schemes
  const totalPages = Math.max(1, Math.ceil(filteredSchemes.length / pageSize));
  const paginatedSchemes = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredSchemes.slice(start, start + pageSize);
  }, [filteredSchemes, page, pageSize]);

  // KPI Calculations
  const kpis: KpiMetricItem[] = useMemo(() => {
    const activeSchemes = schemes.filter((s) => s.status === "Active");
    const activeCount = activeSchemes.length;
    const productsOnOffer = productMap.filter((p) => p.schemeName).length;

    const percentSchemes = activeSchemes.filter((s) => s.discountType === "Percent");
    const avgPercent =
      percentSchemes.length > 0
        ? (percentSchemes.reduce((acc, s) => acc + (s.value ?? 0), 0) / percentSchemes.length).toFixed(1)
        : "12.5";

    const highPriority = activeSchemes.filter((s) => (s.priority ?? 0) >= 20).length;

    return [
      {
        label: "Active Schemes",
        value: activeCount,
        tone: "positive",
        subtext: "Live promotional commercial rules",
        icon: <Sparkles className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />,
      },
      {
        label: "Products on Offer",
        value: productsOnOffer,
        tone: "info",
        subtext: "Active SKU discount coverage",
        icon: <Tag className="h-5 w-5 text-blue-600 dark:text-blue-400" />,
      },
      {
        label: "Avg Promotional Rate",
        value: `${avgPercent}%`,
        tone: "warning",
        subtext: "Average percentage margin shift",
        icon: <Percent className="h-5 w-5 text-amber-600 dark:text-amber-400" />,
      },
      {
        label: "High Priority Tiers",
        value: highPriority,
        tone: "neutral",
        subtext: "Tier ≥ 20 POS precedence rules",
        icon: <Award className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />,
      },
    ];
  }, [schemes, productMap]);

  // Export CSV
  const handleExportCsv = () => {
    if (tab === "schemes") {
      if (filteredSchemes.length === 0) {
        notifyError("No schemes to export.", "Export");
        return;
      }
      const headers = [
        "Scheme Code",
        "Scheme Name",
        "Discount Type",
        "Scope",
        "Category",
        "Value",
        "Priority",
        "Min Quantity",
        "Valid From",
        "Valid To",
        "Status",
        "Notes",
      ];
      const rows = filteredSchemes.map((s) => [
        `"${s.schemeCode ?? ""}"`,
        `"${(s.schemeName ?? "").replace(/"/g, '""')}"`,
        s.discountType ?? "Percent",
        s.scope ?? "Items",
        `"${s.category ?? ""}"`,
        s.value ?? 0,
        s.priority ?? 10,
        s.minQuantity ?? 0,
        s.validFrom ? new Date(s.validFrom).toISOString().slice(0, 10) : "",
        s.validTo ? new Date(s.validTo).toISOString().slice(0, 10) : "",
        s.status ?? "Active",
        `"${(s.notes ?? "").replace(/"/g, '""')}"`,
      ]);

      const csvContent =
        "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `Discount_Schemes_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      notifySuccess(`Exported ${filteredSchemes.length} schemes to CSV.`, "Export Complete");
    } else {
      if (filteredProducts.length === 0) {
        notifyError("No products to export.", "Export");
        return;
      }
      const headers = [
        "Item Code",
        "Item Name",
        "Category",
        "List Price (INR)",
        "MRP (INR)",
        "Active Scheme",
        "Discount Type",
        "Discount Value",
        "Net Rate (INR)",
      ];
      const rows = filteredProducts.map((p) => [
        `"${p.itemCode ?? ""}"`,
        `"${(p.itemName ?? "").replace(/"/g, '""')}"`,
        `"${p.category ?? ""}"`,
        p.sellingPrice ?? 0,
        p.mrp ?? 0,
        `"${(p.schemeName ?? "No Offer").replace(/"/g, '""')}"`,
        p.discountType ?? "",
        p.discountValue ?? 0,
        p.netRate ?? p.sellingPrice ?? 0,
      ]);

      const csvContent =
        "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `Product_Pricing_Matrix_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      notifySuccess(`Exported ${filteredProducts.length} product prices to CSV.`, "Export Complete");
    }
  };

  // Selection toggle
  const toggleSelectAll = () => {
    if (selectedIds.size === paginatedSchemes.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedSchemes.map((r) => r.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const itemChoices = useMemo(() => {
    const q = itemQuery.toLowerCase();
    return items.filter((item) => {
      return !q || item.label.toLowerCase().includes(q) || (item.category || "").toLowerCase().includes(q);
    });
  }, [items, itemQuery]);

  const hasActiveFilters =
    search.trim() !== "" ||
    selectedType !== "all" ||
    selectedScope !== "all" ||
    selectedStatus !== "all" ||
    selectedValidity !== "all" ||
    selectedCategory !== "all";

  const resetFilters = () => {
    setSearch("");
    setSelectedType("all");
    setSelectedScope("all");
    setSelectedStatus("all");
    setSelectedValidity("all");
    setSelectedCategory("all");
    setPage(1);
  };

  return (
    <AdministrationGlobalPageShell
      title="Discounts & Pricing Schemes"
      subtitle="Dynamic omnichannel promotional offers, retail scheme matrices, quantity tiers, category promotions, and net pricing engine."
      categoryTag="Sales & Commercial / Pricing Matrix"
      icon="tag"
      kpiMetrics={kpis}
      onRefresh={() => void load()}
      onExportCsv={handleExportCsv}
      isLoading={loading}
      primaryActionLabel={canManageDiscounts ? "New Discount Scheme" : undefined}
      primaryActionIcon={<Plus className="h-4 w-4" />}
      onPrimaryAction={canManageDiscounts ? openCreate : undefined}
      secondaryActions={[
        {
          label: tab === "schemes" ? "Product Pricing Matrix" : "Discount Schemes",
          icon: tab === "schemes" ? <Tag className="h-4 w-4" /> : <Layers className="h-4 w-4" />,
          onClick: () => setTab((t) => (t === "schemes" ? "products" : "schemes")),
        },
      ]}
    >
      <div className="space-y-4">
        {/* ── Filter Bar ────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-3">
              {/* Search */}
              <div className="relative flex-1 min-w-[240px]">
                <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  placeholder={
                    tab === "schemes"
                      ? "Search scheme name, code, category, notes..."
                      : "Search product SKU, item name, category, offer..."
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-3.5 py-2 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500"
                />
              </div>

              {tab === "schemes" && (
                <>
                  {/* Discount Type Filter */}
                  <select
                    value={selectedType}
                    onChange={(e) => {
                      setSelectedType(e.target.value);
                      setPage(1);
                    }}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  >
                    <option value="all">All Discount Types</option>
                    <option value="Percent">Percent Off (% off)</option>
                    <option value="Amount">Flat Off (₹ off/unit)</option>
                    <option value="SpecialPrice">Special Price (Fixed)</option>
                  </select>

                  {/* Scope Filter */}
                  <select
                    value={selectedScope}
                    onChange={(e) => {
                      setSelectedScope(e.target.value);
                      setPage(1);
                    }}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  >
                    <option value="all">All Target Scopes</option>
                    <option value="AllItems">Storewide (All Products)</option>
                    <option value="Category">Category Specific</option>
                    <option value="Items">Selected SKU Set</option>
                  </select>

                  {/* Status Filter */}
                  <select
                    value={selectedStatus}
                    onChange={(e) => {
                      setSelectedStatus(e.target.value);
                      setPage(1);
                    }}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  >
                    <option value="all">All Statuses</option>
                    <option value="Active">Active Only</option>
                    <option value="Draft">Draft</option>
                    <option value="Inactive">Inactive</option>
                  </select>

                  {/* Validity Filter */}
                  <select
                    value={selectedValidity}
                    onChange={(e) => {
                      setSelectedValidity(e.target.value);
                      setPage(1);
                    }}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  >
                    <option value="all">All Validity Windows</option>
                    <option value="live">Live Campaigns</option>
                    <option value="upcoming">Upcoming</option>
                    <option value="expired">Expired</option>
                  </select>

                  {/* Category Filter */}
                  {categories.length > 0 && (
                    <select
                      value={selectedCategory}
                      onChange={(e) => {
                        setSelectedCategory(e.target.value);
                        setPage(1);
                      }}
                      className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                    >
                      <option value="all">All Categories</option>
                      {categories.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  )}
                </>
              )}

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── View 1: Discount Schemes Directory ──────────────────────── */}
        {tab === "schemes" && (
          <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
            {/* Header bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Percent className="h-4 w-4 text-indigo-600" />
                  Commercial Discount Schemes
                </h3>
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  {filteredSchemes.length} Schemes
                </span>
                {selectedIds.size > 0 && (
                  <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-bold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                    {selectedIds.size} Selected
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400">Rows per page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                  className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  <option value={10}>10</option>
                  <option value={15}>15</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-100 bg-slate-50/60 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-400">
                  <tr>
                    <th className="w-10 px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.size === paginatedSchemes.length && paginatedSchemes.length > 0}
                        onChange={toggleSelectAll}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                    </th>
                    <th className="px-4 py-3">Scheme Identity</th>
                    <th className="px-4 py-3">Discount Type</th>
                    <th className="px-4 py-3">Applied Value</th>
                    <th className="px-4 py-3">Target Scope</th>
                    <th className="px-4 py-3">Priority Score</th>
                    <th className="px-4 py-3">Validity Window</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {paginatedSchemes.length > 0 ? (
                    paginatedSchemes.map((row) => {
                      const isSelected = selectedIds.has(row.id);
                      const typeConf = TYPE_CONFIG[row.discountType || "Percent"] || TYPE_CONFIG.Percent;
                      const scopeConf = SCOPE_CONFIG[row.scope || "Items"] || SCOPE_CONFIG.Items;
                      const validity = getValidityStatus(row.validFrom, row.validTo);

                      return (
                        <tr
                          key={row.id}
                          onClick={() => openInspect(row)}
                          className={`cursor-pointer transition-colors ${
                            isSelected
                              ? "bg-indigo-50/40 dark:bg-indigo-950/20"
                              : "hover:bg-slate-50/60 dark:hover:bg-slate-800/40"
                          }`}
                        >
                          <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelect(row.id)}
                              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            />
                          </td>

                          {/* Scheme Identity */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-rose-600 text-white shadow-xs">
                                <Percent className="h-4 w-4" />
                              </div>
                              <div>
                                <div className="font-bold text-slate-900 dark:text-white">
                                  {row.schemeName ?? "Unnamed Scheme"}
                                </div>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span className="font-mono text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                                    {row.schemeCode ?? row.id.slice(0, 8)}
                                  </span>
                                  {row.schemeCode && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleCopy(row.schemeCode!);
                                      }}
                                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                    >
                                      {copiedCode === row.schemeCode ? (
                                        <Check className="h-3 w-3 text-emerald-500" />
                                      ) : (
                                        <Copy className="h-3 w-3" />
                                      )}
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Discount Type */}
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold ${typeConf.badge}`}>
                              {typeConf.label}
                            </span>
                          </td>

                          {/* Applied Value */}
                          <td className="px-4 py-3">
                            <span className="font-mono text-xs font-extrabold text-slate-900 dark:text-white">
                              {formatSchemeDiscount(row.discountType, row.value)}
                            </span>
                            {row.minQuantity && row.minQuantity > 0 ? (
                              <span className="block text-[10px] text-slate-400">
                                Min Qty: {row.minQuantity} units
                              </span>
                            ) : null}
                          </td>

                          {/* Target Scope */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              <span className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${scopeConf.badge}`}>
                                {scopeConf.label}
                              </span>
                            </div>
                            {row.scope === "Category" && row.category && (
                              <span className="block text-[11px] font-medium text-slate-500 mt-0.5">
                                Cat: {row.category}
                              </span>
                            )}
                            {row.scope === "Items" && (
                              <span className="block text-[11px] font-medium text-slate-500 mt-0.5">
                                {row.productCount || 0} product(s) targeted
                              </span>
                            )}
                          </td>

                          {/* Priority Score */}
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-bold text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                              <Award className="h-3 w-3 text-indigo-500" />
                              Tier {row.priority ?? 10}
                            </span>
                          </td>

                          {/* Validity Window */}
                          <td className="px-4 py-3">
                            <div className="font-mono text-[11px] text-slate-700 dark:text-slate-300">
                              {formatDateOnly(row.validFrom)} → {formatDateOnly(row.validTo)}
                            </div>
                            <span
                              className={`inline-block mt-0.5 rounded px-1.5 py-0.2 text-[10px] font-bold ${
                                validity.tone === "positive"
                                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                                  : validity.tone === "warning"
                                  ? "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                                  : "bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                              }`}
                            >
                              {validity.label}
                            </span>
                          </td>

                          {/* Status */}
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                                row.status === "Active"
                                  ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20 dark:bg-emerald-950/60 dark:text-emerald-300"
                                  : row.status === "Draft"
                                  ? "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                                  : "bg-rose-50 text-rose-700 ring-1 ring-rose-600/20 dark:bg-rose-950/60 dark:text-rose-300"
                              }`}
                            >
                              {row.status ?? "Draft"}
                            </span>
                          </td>

                          {/* Row Actions */}
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                              <button
                                type="button"
                                title="Inspect Scheme"
                                onClick={() => openInspect(row)}
                                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-indigo-600 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-indigo-400"
                              >
                                <Eye className="h-4 w-4" />
                              </button>

                              {canManageDiscounts && (
                                <button
                                  type="button"
                                  title="Edit Scheme"
                                  onClick={() => openEdit(row)}
                                  className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-amber-600 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-amber-400"
                                >
                                  <Edit3 className="h-4 w-4" />
                                </button>
                              )}

                              {canManageDiscounts && (
                                <button
                                  type="button"
                                  title="Delete Scheme"
                                  onClick={() => setSchemeToDelete(row)}
                                  className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600 dark:text-slate-400 dark:hover:bg-rose-950/40 dark:hover:text-rose-400"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={9} className="p-12 text-center text-xs text-slate-500 dark:text-slate-400">
                        <Percent className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600 mb-2" />
                        <p className="font-bold text-slate-700 dark:text-slate-200">No discount schemes found</p>
                        <p className="text-slate-400 mt-1">Create a new commercial discount scheme or adjust filters.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Bar */}
            <div className="flex items-center justify-between border-t border-slate-100 p-4 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
              <span>
                Showing {paginatedSchemes.length > 0 ? (page - 1) * pageSize + 1 : 0} to{" "}
                {Math.min(page * pageSize, filteredSchemes.length)} of {filteredSchemes.length} schemes
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="rounded-lg border border-slate-200 p-1.5 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:hover:bg-slate-800"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Page {page} of {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="rounded-lg border border-slate-200 p-1.5 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:hover:bg-slate-800"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── View 2: Product Pricing Matrix ─────────────────────────── */}
        {tab === "products" && (
          <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Tag className="h-4 w-4 text-indigo-600" />
                  Product-Wise Net Pricing Matrix
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Dynamic evaluation engine. The highest-priority active scheme takes precedence to calculate the live POS checkout rate.
                </p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                {filteredProducts.length} Evaluated SKUs
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-100 bg-slate-50/60 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-400">
                  <tr>
                    <th className="px-4 py-3">Product SKU</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">List / Base Price</th>
                    <th className="px-4 py-3">Active Scheme</th>
                    <th className="px-4 py-3">Discount Applied</th>
                    <th className="px-4 py-3">Net Selling Rate</th>
                    <th className="px-4 py-3">Customer Savings</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredProducts.length > 0 ? (
                    filteredProducts.map((row) => {
                      const listPrice = row.sellingPrice ?? 0;
                      const netRate = row.netRate ?? listPrice;
                      const savings = Math.max(0, listPrice - netRate);
                      const hasDiscount = Boolean(row.schemeName && savings > 0);

                      return (
                        <tr key={row.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 font-mono text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                <Package className="h-4 w-4 text-slate-500" />
                              </div>
                              <div>
                                <div className="font-bold text-slate-900 dark:text-white">{row.itemName}</div>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span className="font-mono text-[10px] text-slate-400">{row.itemCode}</span>
                                  {row.itemCode && (
                                    <button
                                      type="button"
                                      onClick={() => handleCopy(row.itemCode!)}
                                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                    >
                                      {copiedCode === row.itemCode ? (
                                        <Check className="h-3 w-3 text-emerald-500" />
                                      ) : (
                                        <Copy className="h-3 w-3" />
                                      )}
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-3">
                            <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                              {row.category || "General"}
                            </span>
                          </td>

                          <td className="px-4 py-3 font-mono font-medium text-slate-700 tabular-nums dark:text-slate-300">
                            {formatInr(row.sellingPrice)}
                          </td>

                          <td className="px-4 py-3">
                            {row.schemeName ? (
                              <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-bold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                                <Sparkles className="h-3 w-3 text-indigo-500" />
                                {row.schemeName}
                              </span>
                            ) : (
                              <span className="text-[11px] text-slate-400 italic">Standard Retail (No Scheme)</span>
                            )}
                          </td>

                          <td className="px-4 py-3">
                            {hasDiscount ? (
                              <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                                {formatSchemeDiscount(row.discountType, row.discountValue)}
                              </span>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>

                          <td className="px-4 py-3">
                            <span className="font-mono text-xs font-extrabold text-emerald-700 tabular-nums dark:text-emerald-300">
                              {formatInr(row.netRate)}
                            </span>
                          </td>

                          <td className="px-4 py-3">
                            {savings > 0 ? (
                              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 font-mono text-[11px] font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                                <TrendingDown className="h-3 w-3" />
                                Save {formatInr(savings)}
                              </span>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-xs text-slate-500">
                        No product pricing records match your search filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ── Slide-Over Inspector / Form Drawer ──────────────────────── */}
      <SideDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={
          isEditing
            ? editingId
              ? `Edit Scheme: ${form.schemeName || "Commercial Offer"}`
              : "Create Discount Scheme"
            : `Scheme Inspection: ${inspectedScheme?.schemeName || "Commercial Offer"}`
        }
        subtitle={
          isEditing
            ? "Configure discount calculation models, target SKUs, priority resolution, and campaign validity."
            : "Review scheme targeting rules, commercial terms, and active product coverage."
        }
        width="xl"
        footer={
          isEditing ? (
            <ErpDrawerFooter
              onCancel={() => setDrawerOpen(false)}
              onSave={() => void save()}
              saving={saving}
              isEdit={Boolean(editingId)}
              saveLabel={editingId ? "Update Scheme" : "Create Scheme"}
            />
          ) : (
            <div className="flex w-full items-center justify-between">
              {canManageDiscounts && (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-500"
                >
                  <Edit3 className="h-4 w-4" />
                  Edit This Scheme
                </button>
              )}
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                Close
              </button>
            </div>
          )
        }
      >
        <div className="space-y-5">
          {/* Drawer Tab Navigation */}
          <div className="flex items-center gap-1 border-b border-slate-100 pb-2 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setDrawerTab("definition")}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                drawerTab === "definition"
                  ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              1. Scheme Definition
            </button>
            <button
              type="button"
              onClick={() => setDrawerTab("targeting")}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                drawerTab === "targeting"
                  ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              2. Scope & Targeting
            </button>
            <button
              type="button"
              onClick={() => setDrawerTab("validity")}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                drawerTab === "validity"
                  ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              3. Validity & Rules
            </button>
          </div>

          {/* ── Tab 1: Scheme Definition ──────────────────────────────── */}
          {drawerTab === "definition" && (
            <div className="space-y-4 text-xs">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Scheme Name *
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      placeholder="e.g., Festive Grocery Bonanza 15% Off"
                      value={form.schemeName}
                      onChange={(e) => setForm({ ...form, schemeName: e.target.value })}
                    />
                  ) : (
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      {form.schemeName || "—"}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Scheme Code
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      className="w-full rounded-xl border border-slate-200 bg-white p-2.5 font-mono text-xs font-semibold uppercase text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      placeholder="Auto-generated if blank (e.g. DSC-0001)"
                      value={form.schemeCode}
                      onChange={(e) => setForm({ ...form, schemeCode: e.target.value.toUpperCase() })}
                    />
                  ) : (
                    <p className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {form.schemeCode || "DSC-AUTO"}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Discount Calculation Type *
                  </label>
                  {isEditing ? (
                    <select
                      className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-semibold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      value={form.discountType}
                      onChange={(e) =>
                        setForm({ ...form, discountType: e.target.value as SchemeForm["discountType"] })
                      }
                    >
                      <option value="Percent">Percent Off (% reduction)</option>
                      <option value="Amount">Flat Rupee Off (₹ reduction per unit)</option>
                      <option value="SpecialPrice">Special Price (Fixed checkout rate)</option>
                    </select>
                  ) : (
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {TYPE_CONFIG[form.discountType]?.label || form.discountType}
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {form.discountType === "Percent"
                      ? "Percentage Discount (%)"
                      : form.discountType === "Amount"
                      ? "Rupee Amount Off (₹)"
                      : "Special Fixed Price (₹)"}{" "}
                    *
                  </label>
                  {isEditing ? (
                    <input
                      type="number"
                      step="0.01"
                      className="w-full rounded-xl border border-slate-200 bg-white p-2.5 font-mono text-xs font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      value={form.value}
                      onChange={(e) => setForm({ ...form, value: e.target.value })}
                    />
                  ) : (
                    <p className="font-mono text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                      {formatSchemeDiscount(form.discountType, Number(form.value))}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Priority Precedence Tier *
                  </label>
                  {isEditing ? (
                    <input
                      type="number"
                      className="w-full rounded-xl border border-slate-200 bg-white p-2.5 font-mono text-xs font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      value={form.priority}
                      onChange={(e) => setForm({ ...form, priority: e.target.value })}
                    />
                  ) : (
                    <span className="font-mono font-bold text-slate-900 dark:text-white">
                      Tier {form.priority}
                    </span>
                  )}
                  <p className="mt-1 text-[10px] text-slate-400">
                    Higher tier wins if multiple schemes match the same product at checkout.
                  </p>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Operating Status
                  </label>
                  {isEditing ? (
                    <select
                      className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-semibold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value })}
                    >
                      <option value="Active">Active (Live in POS & Invoicing)</option>
                      <option value="Draft">Draft (Inactive preview)</option>
                      <option value="Inactive">Inactive (Suspended)</option>
                    </select>
                  ) : (
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${
                        form.status === "Active"
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                          : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                      }`}
                    >
                      {form.status}
                    </span>
                  )}
                </div>
              </div>

              {/* Informative Callout */}
              <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-3.5 text-indigo-900 dark:border-indigo-950 dark:bg-indigo-950/20 flex items-start gap-2.5">
                <Info className="h-4 w-4 shrink-0 text-indigo-600 mt-0.5" />
                <p className="text-[11px] leading-relaxed text-indigo-800/80 dark:text-indigo-300/80">
                  When creating promotional discounts, priority values determine conflicts. Default store promotions run on Priority 10. Flash sales and weekend specials should use Priority 20 or higher.
                </p>
              </div>
            </div>
          )}

          {/* ── Tab 2: Scope & Targeting ──────────────────────────────── */}
          {drawerTab === "targeting" && (
            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Product Target Scope *
                </label>
                {isEditing ? (
                  <select
                    className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-semibold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    value={form.scope}
                    onChange={(e) =>
                      setForm({ ...form, scope: e.target.value as SchemeForm["scope"] })
                    }
                  >
                    <option value="Items">Selected Product SKUs (Specific catalog items)</option>
                    <option value="Category">Category Specific (All items in one category)</option>
                    <option value="AllItems">Storewide / Catalog-wide (All active items)</option>
                  </select>
                ) : (
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {SCOPE_CONFIG[form.scope]?.label || form.scope}
                  </span>
                )}
              </div>

              {/* Scope === Category */}
              {form.scope === "Category" && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Select Product Category *
                  </label>
                  {isEditing ? (
                    <select
                      className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-semibold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                    >
                      <option value="">-- Choose Category --</option>
                      {categories.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="font-bold text-slate-900 dark:text-white">{form.category || "—"}</span>
                  )}
                </div>
              )}

              {/* Scope === Specific Items */}
              {form.scope === "Items" && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      Targeted Product SKUs ({form.itemIds.length} selected)
                    </label>
                    {isEditing && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setForm({ ...form, itemIds: itemChoices.map((i) => i.id) })}
                          className="text-[10px] font-bold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
                        >
                          Select All Visible
                        </button>
                        <span className="text-slate-300">|</span>
                        <button
                          type="button"
                          onClick={() => setForm({ ...form, itemIds: [] })}
                          className="text-[10px] font-bold text-rose-600 hover:text-rose-500"
                        >
                          Clear Selection
                        </button>
                      </div>
                    )}
                  </div>

                  {isEditing && (
                    <div className="relative">
                      <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Filter items by title or category..."
                        value={itemQuery}
                        onChange={(e) => setItemQuery(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                    </div>
                  )}

                  <div className="max-h-60 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50/50 p-2 dark:border-slate-700 dark:bg-slate-800/40 space-y-1">
                    {itemChoices.slice(0, 80).map((item) => {
                      const isChecked = form.itemIds.includes(item.id);
                      if (!isEditing && !isChecked) return null;

                      return (
                        <label
                          key={item.id}
                          className={`flex items-center gap-2.5 rounded-lg p-2 transition-colors ${
                            isChecked
                              ? "bg-white shadow-xs dark:bg-slate-800"
                              : "hover:bg-slate-100/60 dark:hover:bg-slate-800/60"
                          } ${isEditing ? "cursor-pointer" : ""}`}
                        >
                          {isEditing ? (
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() =>
                                setForm((curr) => ({
                                  ...curr,
                                  itemIds: isChecked
                                    ? curr.itemIds.filter((id) => id !== item.id)
                                    : [...curr.itemIds, item.id],
                                }))
                              }
                              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            />
                          ) : (
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          )}
                          <div className="flex-1 min-w-0">
                            <span className="font-semibold text-slate-900 dark:text-white block truncate">
                              {item.label}
                            </span>
                            {item.category && (
                              <span className="text-[10px] text-slate-400 font-medium">{item.category}</span>
                            )}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Thresholds Grid */}
              <div className="grid grid-cols-3 gap-3 pt-2">
                <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3 dark:border-slate-800 dark:bg-slate-800/40">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Min Quantity (MOQ)</span>
                  {isEditing ? (
                    <input
                      type="number"
                      className="w-full mt-1 rounded-lg border border-slate-200 bg-white p-1.5 font-mono text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      value={form.minQuantity}
                      onChange={(e) => setForm({ ...form, minQuantity: e.target.value })}
                    />
                  ) : (
                    <p className="font-mono font-bold text-slate-900 dark:text-white mt-1">
                      {form.minQuantity || "0"} units
                    </p>
                  )}
                </div>

                <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3 dark:border-slate-800 dark:bg-slate-800/40">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Min Bill Value (₹)</span>
                  {isEditing ? (
                    <input
                      type="number"
                      className="w-full mt-1 rounded-lg border border-slate-200 bg-white p-1.5 font-mono text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      value={form.minBillAmount}
                      onChange={(e) => setForm({ ...form, minBillAmount: e.target.value })}
                    />
                  ) : (
                    <p className="font-mono font-bold text-slate-900 dark:text-white mt-1">
                      {formatInr(Number(form.minBillAmount))}
                    </p>
                  )}
                </div>

                <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3 dark:border-slate-800 dark:bg-slate-800/40">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Max Discount Cap (₹)</span>
                  {isEditing ? (
                    <input
                      type="number"
                      className="w-full mt-1 rounded-lg border border-slate-200 bg-white p-1.5 font-mono text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      value={form.maxDiscountAmount}
                      onChange={(e) => setForm({ ...form, maxDiscountAmount: e.target.value })}
                    />
                  ) : (
                    <p className="font-mono font-bold text-slate-900 dark:text-white mt-1">
                      {Number(form.maxDiscountAmount) > 0 ? formatInr(Number(form.maxDiscountAmount)) : "No Cap"}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── Tab 3: Validity & Rules ───────────────────────────────── */}
          {drawerTab === "validity" && (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Valid From Date *
                  </label>
                  {isEditing ? (
                    <input
                      type="date"
                      className="w-full rounded-xl border border-slate-200 bg-white p-2.5 font-mono text-xs font-semibold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      value={form.validFrom}
                      onChange={(e) => setForm({ ...form, validFrom: e.target.value })}
                    />
                  ) : (
                    <span className="font-mono text-xs font-semibold text-slate-900 dark:text-white">
                      {formatDateOnly(form.validFrom)}
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Valid To Date *
                  </label>
                  {isEditing ? (
                    <input
                      type="date"
                      className="w-full rounded-xl border border-slate-200 bg-white p-2.5 font-mono text-xs font-semibold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      value={form.validTo}
                      onChange={(e) => setForm({ ...form, validTo: e.target.value })}
                    />
                  ) : (
                    <span className="font-mono text-xs font-semibold text-slate-900 dark:text-white">
                      {formatDateOnly(form.validTo)}
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Campaign Notes & Commercial Memo
                </label>
                {isEditing ? (
                  <textarea
                    rows={3}
                    placeholder="e.g., Applies to weekend physical POS billing, not combinable with festival vouchers..."
                    className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  />
                ) : (
                  <p className="text-slate-700 dark:text-slate-300 italic">
                    {form.notes || "No notes recorded for this scheme."}
                  </p>
                )}
              </div>

              {/* Security & Audit Box */}
              {inspectedScheme && (
                <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5 dark:border-slate-800 dark:bg-slate-800/40 space-y-1 font-mono text-[11px]">
                  <span className="text-[10px] font-bold text-slate-400 uppercase font-sans">
                    Scheme Identifier GUID
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-800 dark:text-slate-200">{inspectedScheme.id}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(inspectedScheme.id)}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </SideDrawer>

      {/* ── Universal Delete Dialog ──────────────────────────────────── */}
      <UniversalDeleteDialog
        open={Boolean(schemeToDelete)}
        onOpenChange={(open: boolean) => !open && setSchemeToDelete(null)}
        title="Delete Discount Scheme"
        entityName={
          schemeToDelete
            ? `Discount Scheme "${schemeToDelete.schemeName ?? schemeToDelete.schemeCode ?? "Offer"}"`
            : "discount scheme"
        }
        onConfirm={handleDeleteConfirm}
        loading={deleting}
      />
    </AdministrationGlobalPageShell>
  );
}

export default DiscountsManager;
