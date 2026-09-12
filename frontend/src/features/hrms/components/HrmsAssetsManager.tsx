"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Plus,
  Search,
  Download,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Trash2,
  Edit,
  Eye,
  ShieldCheck,
  UserCheck,
  UserX,
  Users,
  Copy,
  Check,
  Coins,
  Cpu,
  Laptop,
  Smartphone,
  Monitor,
  Server,
  Car,
  Armchair,
  Wrench,
  Package,
} from "lucide-react";
import {
  AdministrationGlobalPageShell,
  type KpiMetricItem,
} from "@/components/administration/AdministrationGlobalPageShell";
import { SideDrawer } from "@/components/ui/side-drawer";
import { ErpDrawerFooter } from "@/components/workspace/page-kit";
import { UniversalDeleteDialog } from "@/components/workspace/templates/UniversalDeleteDialog";
import { useAssets } from "@/features/hrms/assets";
import { hrmsApi } from "@/services/modules";
import { notifyError, notifySuccess } from "@/lib/notifications";
import { getApiErrorMessage } from "@/lib/api-errors";
import { usePermissions } from "@/context/PermissionContext";

export type AssetRow = {
  id: string;
  assetCode?: string;
  name?: string;
  assetName?: string;
  category?: string;
  assetCategory?: string;
  status?: string;
  serialNumber?: string;
  location?: string;
  purchaseDate?: string;
  purchaseValue?: number;
  currentValue?: number;
  usefulLifeYears?: number;
  supplier?: string;
  warrantyInfo?: string;
  warrantyExpiryDate?: string;
  isUnderWarranty?: boolean;
  allocatedToEmployeeId?: string | null;
  allocationDate?: string | null;
  createdAt?: string;
};

export type AllocationRow = {
  id: string;
  assetId?: string;
  assetName?: string;
  employeeId?: string;
  employeeName?: string;
  allocationDate?: string;
  purpose?: string;
  status?: string;
  allocationNotes?: string;
  createdAt?: string;
};

const CATEGORIES = [
  "Laptop",
  "Desktop",
  "Mobile",
  "Tablet",
  "Monitor",
  "Server",
  "Networking",
  "Vehicle",
  "Office Furniture",
  "Tools & Machinery",
  "Other",
] as const;

function getCategoryIcon(cat?: string) {
  switch (cat?.toLowerCase()) {
    case "laptop":
      return Laptop;
    case "desktop":
      return Cpu;
    case "mobile":
    case "tablet":
      return Smartphone;
    case "monitor":
      return Monitor;
    case "server":
    case "networking":
      return Server;
    case "vehicle":
      return Car;
    case "office furniture":
    case "furniture":
      return Armchair;
    case "tools & machinery":
    case "tools":
      return Wrench;
    default:
      return Box;
  }
}

const emptyAsset = () => ({
  assetCode: "",
  name: "",
  category: "Laptop",
  serialNumber: "",
  location: "",
  purchaseDate: new Date().toISOString().slice(0, 10),
  purchaseValue: 0,
  usefulLifeYears: 3,
  supplier: "",
  warrantyInfo: "",
  warrantyExpiryDate: "",
});

export function HrmsAssetsManager() {
  const { hasPermission, isSuperAdmin } = usePermissions();
  const canManage =
    isSuperAdmin ||
    hasPermission(["hr.assets.create", "hr.assets.edit", "hr.assets.manage", "hrms.admin"]);

  const {
    getAssets,
    createAsset,
    updateAsset,
    deleteAsset,
    getAllocations,
    allocateAsset,
    returnAsset,
    loading,
    error,
  } = useAssets();

  const [assets, setAssets] = useState<AssetRow[]>([]);
  const [allocations, setAllocations] = useState<AllocationRow[]>([]);
  const [employees, setEmployees] = useState<{ id: string; fullName: string; employeeCode?: string }[]>([]);

  // Navigation & Tabs
  const [activeTab, setActiveTab] = useState<"inventory" | "custody">("inventory");

  // Filters
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Drawer States
  const [isAssetDrawerOpen, setIsAssetDrawerOpen] = useState(false);
  const [assetDrawerMode, setAssetDrawerMode] = useState<"view" | "create" | "edit">("create");
  const [selectedAsset, setSelectedAsset] = useState<AssetRow | null>(null);
  const [assetFormTab, setAssetFormTab] = useState<"basic" | "financial" | "warranty">("basic");
  const [assetForm, setAssetForm] = useState(emptyAsset());
  const [savingAsset, setSavingAsset] = useState(false);

  // Allocation Drawer
  const [isAllocateDrawerOpen, setIsAllocateDrawerOpen] = useState(false);
  const [allocationForm, setAllocationForm] = useState({
    assetId: "",
    employeeId: "",
    allocationReason: "Standard Equipment Issue",
  });
  const [savingAllocation, setSavingAllocation] = useState(false);

  // Return Dialog
  const [returnAllocation, setReturnAllocation] = useState<AllocationRow | null>(null);
  const [returnReason, setReturnReason] = useState("Employee Offboarding / Return");
  const [savingReturn, setSavingReturn] = useState(false);

  // Delete Dialog
  const [deleteAssetRecord, setDeleteAssetRecord] = useState<AssetRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Quick-copy
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const assetsData = await getAssets();
      const rawAssets = (Array.isArray(assetsData) ? assetsData : []) as Record<string, unknown>[];
      const assetList: AssetRow[] = rawAssets.map((a) => ({
        id: String(a.id),
        assetCode: String(a.assetCode ?? ""),
        name: String(a.name ?? a.assetName ?? ""),
        assetName: String(a.assetName ?? a.name ?? ""),
        category: String(a.category ?? a.assetCategory ?? "Other"),
        assetCategory: String(a.assetCategory ?? a.category ?? "Other"),
        status: String(a.status ?? "Available"),
        serialNumber: a.serialNumber ? String(a.serialNumber) : undefined,
        location: a.location ? String(a.location) : undefined,
        purchaseDate: a.purchaseDate ? String(a.purchaseDate) : undefined,
        purchaseValue: Number(a.purchaseValue ?? 0),
        currentValue: a.currentValue !== undefined ? Number(a.currentValue) : Number(a.purchaseValue ?? 0),
        usefulLifeYears: a.usefulLifeYears ? Number(a.usefulLifeYears) : 3,
        supplier: a.supplier ? String(a.supplier) : undefined,
        warrantyInfo: a.warrantyInfo ? String(a.warrantyInfo) : undefined,
        warrantyExpiryDate: a.warrantyExpiryDate ? String(a.warrantyExpiryDate) : undefined,
        isUnderWarranty: Boolean(a.isUnderWarranty),
        allocatedToEmployeeId: a.allocatedToEmployeeId ? String(a.allocatedToEmployeeId) : null,
        allocationDate: a.allocationDate ? String(a.allocationDate) : null,
        createdAt: a.createdAt ? String(a.createdAt) : undefined,
      }));

      // Fetch allocations
      const allocationGroups = await Promise.all(
        assetList
          .map((asset) => asset.id)
          .filter((assetId): assetId is string => Boolean(assetId))
          .map(async (assetId) => {
            try {
              return await getAllocations(undefined, assetId);
            } catch {
              return [];
            }
          })
      );
      const allocationsData = allocationGroups.flatMap((group) => (Array.isArray(group) ? group : [])) as AllocationRow[];

      setAssets(assetList);
      setAllocations(allocationsData);
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to load assets."), "Assets");
    }
  }, [getAssets, getAllocations]);

  // Load Employees for Allocation
  const loadEmployees = useCallback(async () => {
    try {
      const res = await hrmsApi.hrms.employees.list(1, 200);
      const raw = res.data;
      const list = Array.isArray(raw)
        ? raw
        : Array.isArray((raw as { data?: unknown })?.data)
        ? ((raw as { data: unknown[] }).data)
        : [];
      setEmployees(
        (list as Record<string, unknown>[]).map((e) => ({
          id: String(e.id),
          fullName: String(
            e.fullName ?? (`${e.firstName ?? ""} ${e.lastName ?? ""}`.trim() || e.employeeCode || e.id)
          ),
          employeeCode: e.employeeCode ? String(e.employeeCode) : undefined,
        }))
      );
    } catch {
      setEmployees([]);
    }
  }, []);

  useEffect(() => {
    void loadData();
    void loadEmployees();
  }, [loadData, loadEmployees]);

  // Employee lookup map
  const employeeMap = useMemo(() => {
    const map = new Map<string, string>();
    employees.forEach((e) => map.set(e.id, e.fullName));
    return map;
  }, [employees]);

  // Asset lookup map
  const assetMap = useMemo(() => {
    const map = new Map<string, AssetRow>();
    assets.forEach((a) => map.set(a.id, a));
    return map;
  }, [assets]);

  // Available assets for allocation
  const availableAssetsForAllocation = useMemo(() => {
    return assets.filter((a) => !a.allocatedToEmployeeId && a.status?.toLowerCase() !== "retired");
  }, [assets]);

  // KPIs
  const totalAssetsCount = assets.length;
  const allocatedAssetsCount = useMemo(
    () => assets.filter((a) => a.allocatedToEmployeeId || a.status?.toLowerCase() === "inuse").length,
    [assets]
  );
  const availableAssetsCount = totalAssetsCount - allocatedAssetsCount;
  const totalValuation = useMemo(
    () => assets.reduce((sum, a) => sum + (Number(a.purchaseValue) || 0), 0),
    [assets]
  );

  const kpis: KpiMetricItem[] = [
    {
      label: "Total Hardware Assets",
      value: `${totalAssetsCount} Items`,
      tone: "info",
      subtext: `${CATEGORIES.length} categorized classes`,
    },
    {
      label: "Allocated to Staff",
      value: `${allocatedAssetsCount} Issued`,
      tone: "positive",
      subtext: `${totalAssetsCount > 0 ? Math.round((allocatedAssetsCount / totalAssetsCount) * 100) : 0}% utilization rate`,
    },
    {
      label: "Available in Pool",
      value: `${availableAssetsCount} Stocked`,
      tone: "neutral",
      subtext: "Ready for immediate deployment",
    },
    {
      label: "Total Asset Valuation",
      value: `₹${totalValuation.toLocaleString("en-IN")}`,
      tone: "warning",
      subtext: "Capitalized acquisition value",
    },
  ];

  // Filtering
  const filteredAssets = useMemo(() => {
    return assets.filter((a) => {
      const q = search.trim().toLowerCase();
      if (categoryFilter !== "ALL" && (a.category ?? a.assetCategory) !== categoryFilter) return false;
      if (statusFilter === "allocated" && !a.allocatedToEmployeeId) return false;
      if (statusFilter === "available" && a.allocatedToEmployeeId) return false;

      if (q) {
        const nameMatch = (a.name ?? a.assetName ?? "").toLowerCase().includes(q);
        const codeMatch = (a.assetCode ?? "").toLowerCase().includes(q);
        const catMatch = (a.category ?? a.assetCategory ?? "").toLowerCase().includes(q);
        const serialMatch = (a.serialNumber ?? "").toLowerCase().includes(q);
        const custodianMatch = a.allocatedToEmployeeId
          ? (employeeMap.get(a.allocatedToEmployeeId) ?? "").toLowerCase().includes(q)
          : false;
        return nameMatch || codeMatch || catMatch || serialMatch || custodianMatch;
      }
      return true;
    });
  }, [assets, categoryFilter, statusFilter, search, employeeMap]);

  // Copy code
  const handleCopyCode = (code: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 1800);
  };

  // Open Create Asset Drawer
  const handleOpenAssetCreate = () => {
    setSelectedAsset(null);
    setAssetForm(emptyAsset());
    setAssetFormTab("basic");
    setAssetDrawerMode("create");
    setIsAssetDrawerOpen(true);
  };

  // Open Edit Asset Drawer
  const handleOpenAssetEdit = (asset: AssetRow) => {
    setSelectedAsset(asset);
    setAssetForm({
      assetCode: asset.assetCode ?? "",
      name: asset.name ?? asset.assetName ?? "",
      category: asset.category ?? asset.assetCategory ?? "Laptop",
      serialNumber: asset.serialNumber ?? "",
      location: asset.location ?? "",
      purchaseDate: asset.purchaseDate ? asset.purchaseDate.slice(0, 10) : new Date().toISOString().slice(0, 10),
      purchaseValue: Number(asset.purchaseValue) || 0,
      usefulLifeYears: Number(asset.usefulLifeYears) || 3,
      supplier: asset.supplier ?? "",
      warrantyInfo: asset.warrantyInfo ?? "",
      warrantyExpiryDate: asset.warrantyExpiryDate ? asset.warrantyExpiryDate.slice(0, 10) : "",
    });
    setAssetFormTab("basic");
    setAssetDrawerMode("edit");
    setIsAssetDrawerOpen(true);
  };

  // Open View Asset Drawer
  const handleOpenAssetView = (asset: AssetRow) => {
    setSelectedAsset(asset);
    setAssetDrawerMode("view");
    setIsAssetDrawerOpen(true);
  };

  // Submit Asset Form
  const handleSaveAsset = async () => {
    if (!assetForm.name.trim()) {
      notifyError("Asset Name is required.", "Validation");
      return;
    }
    if (!assetForm.assetCode.trim()) {
      notifyError("Asset Code is required.", "Validation");
      return;
    }

    try {
      setSavingAsset(true);
      const payload = {
        name: assetForm.name.trim(),
        assetName: assetForm.name.trim(),
        assetCode: assetForm.assetCode.trim().toUpperCase(),
        category: assetForm.category,
        assetCategory: assetForm.category,
        serialNumber: assetForm.serialNumber.trim() || undefined,
        location: assetForm.location.trim() || undefined,
        purchaseDate: assetForm.purchaseDate,
        purchaseValue: Number(assetForm.purchaseValue) || 0,
        usefulLifeYears: Number(assetForm.usefulLifeYears) || 3,
        supplier: assetForm.supplier.trim() || undefined,
        warrantyInfo: assetForm.warrantyInfo.trim() || undefined,
        warrantyExpiryDate: assetForm.warrantyExpiryDate || undefined,
      };

      if (assetDrawerMode === "edit" && selectedAsset) {
        if (updateAsset) {
          await updateAsset(selectedAsset.id, payload);
        }
        notifySuccess(`Asset '${payload.assetCode}' updated successfully.`, "Asset Master");
      } else {
        await createAsset(payload);
        notifySuccess(`Asset '${payload.assetCode}' created successfully.`, "Asset Master");
      }

      setIsAssetDrawerOpen(false);
      await loadData();
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to save asset."), "Asset Master");
    } finally {
      setSavingAsset(false);
    }
  };

  // Delete Asset
  const handleConfirmDelete = async () => {
    if (!deleteAssetRecord) return;
    try {
      setDeleting(true);
      if (deleteAsset) {
        await deleteAsset(deleteAssetRecord.id);
      }
      notifySuccess(`Asset '${deleteAssetRecord.assetCode}' deleted.`, "Asset Master");
      setDeleteAssetRecord(null);
      if (selectedAsset?.id === deleteAssetRecord.id) {
        setIsAssetDrawerOpen(false);
      }
      await loadData();
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to delete asset."), "Asset Master");
    } finally {
      setDeleting(false);
    }
  };

  // Open Allocate Modal
  const openAllocate = (targetAssetId?: string) => {
    setAllocationForm({
      assetId: targetAssetId || "",
      employeeId: "",
      allocationReason: "Standard Equipment Issue",
    });
    setIsAllocateDrawerOpen(true);
  };

  // Submit Allocation
  const handleSaveAllocation = async () => {
    if (!allocationForm.assetId) {
      notifyError("Please select an asset to allocate.", "Validation");
      return;
    }
    if (!allocationForm.employeeId) {
      notifyError("Please select an employee custodian.", "Validation");
      return;
    }

    try {
      setSavingAllocation(true);
      await allocateAsset({
        assetId: allocationForm.assetId,
        employeeId: allocationForm.employeeId,
        purpose: allocationForm.allocationReason,
        allocationDate: new Date().toISOString(),
      });
      notifySuccess("Asset custody allocated successfully.", "Asset Allocation");
      setIsAllocateDrawerOpen(false);
      await loadData();
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to allocate asset."), "Asset Allocation");
    } finally {
      setSavingAllocation(false);
    }
  };

  // Return Asset
  const handleConfirmReturn = async () => {
    if (!returnAllocation) return;
    try {
      setSavingReturn(true);
      await returnAsset(returnAllocation.id, {
        deallocationReason: returnReason,
        deallocationDate: new Date().toISOString(),
      });
      notifySuccess("Asset returned to inventory pool.", "Asset Custody");
      setReturnAllocation(null);
      await loadData();
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to return asset."), "Asset Custody");
    } finally {
      setSavingReturn(false);
    }
  };

  // Export CSV
  const handleExportCsv = () => {
    if (assets.length === 0) {
      notifyError("No assets to export.", "Export");
      return;
    }

    const headers = [
      "Asset Code",
      "Asset Name",
      "Category",
      "Serial Number",
      "Location",
      "Purchase Date",
      "Purchase Value (INR)",
      "Custodian Employee",
      "Status",
    ];

    const rows = filteredAssets.map((a) => [
      `"${a.assetCode ?? ""}"`,
      `"${(a.name ?? a.assetName ?? "").replace(/"/g, '""')}"`,
      `"${a.category ?? a.assetCategory ?? ""}"`,
      `"${a.serialNumber ?? ""}"`,
      `"${a.location ?? ""}"`,
      `"${a.purchaseDate ? a.purchaseDate.slice(0, 10) : ""}"`,
      a.purchaseValue ?? 0,
      `"${a.allocatedToEmployeeId ? employeeMap.get(a.allocatedToEmployeeId) ?? a.allocatedToEmployeeId : "Unassigned"}"`,
      `"${a.allocatedToEmployeeId ? "Allocated" : "Available"}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Asset_Inventory_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    notifySuccess("Asset inventory exported successfully.", "CSV Export");
  };

  return (
    <>
      <AdministrationGlobalPageShell
        title="Asset Management & Hardware Custody"
        subtitle="Track organizational IT hardware, employee custody allocations, depreciation schedules, and return life-cycles."
        categoryTag="HRMS & Operations / Assets"
        icon="box"
        kpiMetrics={kpis}
        onRefresh={() => void loadData()}
        onExportCsv={handleExportCsv}
        primaryActionLabel={canManage ? "Add Asset" : undefined}
        onPrimaryAction={canManage ? handleOpenAssetCreate : undefined}
        secondaryActions={[
          {
            label: "Allocate Custody",
            onClick: () => openAllocate(),
            icon: <UserCheck className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />,
          },
        ]}
      >
        {/* Error state */}
        {error ? (
          <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 flex items-start gap-3 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300">
            <AlertCircle className="h-5 w-5 shrink-0 text-rose-600 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">Unable to complete asset operation</p>
              <p className="text-xs mt-0.5 text-rose-600 dark:text-rose-400">{error}</p>
            </div>
            <button
              type="button"
              onClick={() => void loadData()}
              className="text-xs font-semibold text-rose-700 underline hover:no-underline"
            >
              Retry
            </button>
          </div>
        ) : null}

        {/* View Switcher & Filters */}
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by asset code, model name, serial number, or employee custodian..."
                className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
              {search ? (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600"
                >
                  Clear
                </button>
              ) : null}
            </div>

            {/* View Tab Switcher */}
            <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 self-start md:self-auto shrink-0 dark:bg-slate-800">
              <button
                type="button"
                onClick={() => setActiveTab("inventory")}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                  activeTab === "inventory"
                    ? "bg-white text-indigo-600 shadow-sm dark:bg-slate-700 dark:text-indigo-400"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-400"
                }`}
              >
                <Package className="h-3.5 w-3.5" />
                Hardware Inventory ({assets.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("custody")}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                  activeTab === "custody"
                    ? "bg-white text-indigo-600 shadow-sm dark:bg-slate-700 dark:text-indigo-400"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-400"
                }`}
              >
                <Users className="h-3.5 w-3.5" />
                Staff Custody Records ({allocations.length})
              </button>
            </div>
          </div>

          {/* Sub Filters */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value="ALL">All Categories</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value="ALL">All Custody Status</option>
                <option value="available">Available in Stock</option>
                <option value="allocated">Allocated to Staff</option>
              </select>

              {search || categoryFilter !== "ALL" || statusFilter !== "ALL" ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setCategoryFilter("ALL");
                    setStatusFilter("ALL");
                  }}
                  className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold px-2 py-1 dark:text-indigo-400"
                >
                  Reset Filters
                </button>
              ) : null}
            </div>

            <span className="text-xs text-slate-500 font-medium">
              Showing {filteredAssets.length} of {assets.length} assets
            </span>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === "inventory" ? (
          /* Inventory Table */
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden dark:border-slate-800 dark:bg-slate-900">
            {loading && assets.length === 0 ? (
              <div className="p-6 space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-12 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
                ))}
              </div>
            ) : filteredAssets.length === 0 ? (
              <div className="py-16 text-center px-4">
                <div className="inline-flex p-4 rounded-full bg-indigo-50 text-indigo-600 mb-3 dark:bg-indigo-950/50 dark:text-indigo-400">
                  <Box className="h-8 w-8" />
                </div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">No assets match your search</h3>
                <p className="max-w-md mx-auto mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {assets.length === 0
                    ? "Get started by recording your enterprise IT assets, office hardware, and fleet equipment."
                    : "No hardware items match the selected filter criteria. Try clearing your filters."}
                </p>
                {assets.length === 0 && canManage ? (
                  <button
                    type="button"
                    onClick={handleOpenAssetCreate}
                    className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition"
                  >
                    <Plus className="h-4 w-4" />
                    Add First Asset
                  </button>
                ) : null}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/75 text-xs font-semibold text-slate-500 uppercase tracking-wider dark:border-slate-800 dark:bg-slate-800/60">
                      <th className="py-3.5 pl-6 pr-3">Asset Code</th>
                      <th className="px-3 py-3.5">Hardware & Model</th>
                      <th className="px-3 py-3.5">Category</th>
                      <th className="px-3 py-3.5">Capitalized Value</th>
                      <th className="px-3 py-3.5">Assigned Custodian</th>
                      <th className="px-3 py-3.5 text-center">Status</th>
                      <th className="py-3.5 pl-3 pr-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredAssets.map((asset) => {
                      const CatIcon = getCategoryIcon(asset.category ?? asset.assetCategory);
                      const isAllocated = Boolean(asset.allocatedToEmployeeId);
                      const custodianName = asset.allocatedToEmployeeId
                        ? employeeMap.get(asset.allocatedToEmployeeId) ?? "Assigned Staff"
                        : null;

                      return (
                        <tr key={asset.id} className="hover:bg-slate-50/70 transition dark:hover:bg-slate-800/50">
                          <td className="py-3.5 pl-6 pr-3 whitespace-nowrap">
                            <button
                              type="button"
                              onClick={(e) => handleCopyCode(asset.assetCode ?? "", e)}
                              className="inline-flex items-center gap-1 font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 hover:bg-indigo-50 hover:text-indigo-700 transition dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                            >
                              {asset.assetCode || "—"}
                              {copiedCode === asset.assetCode ? (
                                <Check className="h-3 w-3 text-emerald-600" />
                              ) : (
                                <Copy className="h-2.5 w-2.5 text-slate-400" />
                              )}
                            </button>
                          </td>

                          <td className="px-3 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white font-semibold text-xs shadow-sm">
                                <CatIcon className="h-4 w-4" />
                              </div>
                              <div className="min-w-0">
                                <span
                                  onClick={() => handleOpenAssetView(asset)}
                                  className="font-medium text-slate-900 cursor-pointer hover:text-indigo-600 transition truncate block dark:text-white dark:hover:text-indigo-400"
                                >
                                  {asset.name ?? asset.assetName}
                                </span>
                                {asset.serialNumber ? (
                                  <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                                    SN: {asset.serialNumber}
                                  </p>
                                ) : null}
                              </div>
                            </div>
                          </td>

                          <td className="px-3 py-3.5 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                              {asset.category ?? asset.assetCategory ?? "Asset"}
                            </span>
                          </td>

                          <td className="px-3 py-3.5 whitespace-nowrap font-mono font-semibold text-slate-900 dark:text-white">
                            ₹{(asset.purchaseValue || 0).toLocaleString("en-IN")}
                          </td>

                          <td className="px-3 py-3.5 whitespace-nowrap">
                            {isAllocated ? (
                              <div className="flex items-center gap-2">
                                <div className="h-6 w-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-bold">
                                  {custodianName?.charAt(0) ?? "U"}
                                </div>
                                <span className="text-xs font-medium text-slate-800 dark:text-slate-200">
                                  {custodianName}
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400 italic">Unassigned (In Pool)</span>
                            )}
                          </td>

                          <td className="px-3 py-3.5 whitespace-nowrap text-center">
                            {isAllocated ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800/60">
                                <UserCheck className="h-3 w-3" /> In Use
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60">
                                <CheckCircle2 className="h-3 w-3" /> Available
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 pl-3 pr-6 whitespace-nowrap text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {!isAllocated && canManage ? (
                                <button
                                  type="button"
                                  onClick={() => openAllocate(asset.id)}
                                  className="px-2 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-md transition dark:bg-indigo-950/60 dark:text-indigo-300"
                                  title="Allocate to staff"
                                >
                                  Allocate
                                </button>
                              ) : null}

                              <button
                                type="button"
                                onClick={() => handleOpenAssetView(asset)}
                                className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                                title="Inspect details"
                              >
                                <Eye className="h-4 w-4" />
                              </button>

                              {canManage ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenAssetEdit(asset)}
                                    className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-blue-400"
                                    title="Edit asset"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => setDeleteAssetRecord(asset)}
                                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition dark:hover:bg-rose-950/40 dark:hover:text-rose-400"
                                    title="Delete asset"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          /* Custody Allocations Register */
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden dark:border-slate-800 dark:bg-slate-900">
            {allocations.length === 0 ? (
              <div className="py-16 text-center px-4">
                <div className="inline-flex p-4 rounded-full bg-indigo-50 text-indigo-600 mb-3 dark:bg-indigo-950/50 dark:text-indigo-400">
                  <Users className="h-8 w-8" />
                </div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">No hardware allocations recorded</h3>
                <p className="max-w-md mx-auto mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Assign enterprise hardware, laptops, and mobile devices to employees with official custody tracking.
                </p>
                {canManage ? (
                  <button
                    type="button"
                    onClick={() => openAllocate()}
                    className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition"
                  >
                    <UserCheck className="h-4 w-4" />
                    Allocate First Hardware
                  </button>
                ) : null}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/75 text-xs font-semibold text-slate-500 uppercase tracking-wider dark:border-slate-800 dark:bg-slate-800/60">
                      <th className="py-3.5 pl-6 pr-3">Hardware Item</th>
                      <th className="px-3 py-3.5">Custodian Employee</th>
                      <th className="px-3 py-3.5">Allocation Date</th>
                      <th className="px-3 py-3.5">Purpose / Notes</th>
                      <th className="px-3 py-3.5 text-center">Custody Status</th>
                      <th className="py-3.5 pl-3 pr-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {allocations.map((alloc) => {
                      const matchedAsset = alloc.assetId ? assetMap.get(alloc.assetId) : null;
                      const employeeName = alloc.employeeName ?? (alloc.employeeId ? employeeMap.get(alloc.employeeId) : "Staff Member");
                      const isReturned = alloc.status?.toLowerCase() === "returned";

                      return (
                        <tr key={alloc.id} className="hover:bg-slate-50/70 transition dark:hover:bg-slate-800/50">
                          <td className="py-3.5 pl-6 pr-3">
                            <div className="flex items-center gap-2.5">
                              <Box className="h-4 w-4 text-indigo-500 shrink-0" />
                              <div>
                                <p className="font-semibold text-slate-900 text-xs dark:text-white">
                                  {alloc.assetName || matchedAsset?.name || alloc.assetId}
                                </p>
                                {matchedAsset?.assetCode ? (
                                  <span className="font-mono text-[10px] text-slate-400">
                                    {matchedAsset.assetCode}
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          </td>

                          <td className="px-3 py-3.5">
                            <div className="flex items-center gap-2">
                              <div className="h-6 w-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-bold">
                                {employeeName?.charAt(0) ?? "U"}
                              </div>
                              <span className="text-xs font-medium text-slate-800 dark:text-slate-200">
                                {employeeName}
                              </span>
                            </div>
                          </td>

                          <td className="px-3 py-3.5 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                            {alloc.allocationDate
                              ? new Date(alloc.allocationDate).toLocaleDateString("en-IN")
                              : "—"}
                          </td>

                          <td className="px-3 py-3.5 text-xs text-slate-600 dark:text-slate-300">
                            {alloc.purpose || alloc.allocationNotes || "Standard Custody Issue"}
                          </td>

                          <td className="px-3 py-3.5 text-center whitespace-nowrap">
                            {isReturned ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-medium rounded-full bg-slate-100 text-slate-600 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
                                <UserX className="h-3 w-3" /> Returned
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-medium rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60">
                                <UserCheck className="h-3 w-3" /> Active Custody
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 pl-3 pr-6 text-right whitespace-nowrap">
                            {!isReturned && canManage ? (
                              <button
                                type="button"
                                onClick={() => setReturnAllocation(alloc)}
                                className="px-2.5 py-1 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-md border border-rose-200 transition dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/60"
                              >
                                Return Asset
                              </button>
                            ) : null}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </AdministrationGlobalPageShell>

      {/* Asset Create / Edit / Inspect Drawer */}
      <SideDrawer
        open={isAssetDrawerOpen}
        onClose={() => setIsAssetDrawerOpen(false)}
        title={
          assetDrawerMode === "view"
            ? selectedAsset?.name || selectedAsset?.assetName || "Asset Details"
            : assetDrawerMode === "edit"
            ? `Edit Asset: ${selectedAsset?.assetCode}`
            : "Create Hardware Asset"
        }
        subtitle={
          assetDrawerMode === "view"
            ? "Specification, capitalization valuation, and employee custody status."
            : "Configure asset identification, capital costs, useful life, and statutory warranty."
        }
        width="lg"
        footer={
          assetDrawerMode === "view" ? (
            <div className="flex items-center justify-between w-full p-4 border-t border-slate-200 dark:border-slate-800">
              {selectedAsset && !selectedAsset.allocatedToEmployeeId && canManage ? (
                <button
                  type="button"
                  onClick={() => {
                    setIsAssetDrawerOpen(false);
                    openAllocate(selectedAsset.id);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition dark:bg-indigo-950/40 dark:text-indigo-300"
                >
                  <UserCheck className="h-3.5 w-3.5" />
                  Allocate to Staff
                </button>
              ) : <div />}

              <div className="flex items-center gap-2">
                {canManage && selectedAsset ? (
                  <button
                    type="button"
                    onClick={() => handleOpenAssetEdit(selectedAsset)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition"
                  >
                    <Edit className="h-3.5 w-3.5" />
                    Edit Asset
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => setIsAssetDrawerOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition dark:bg-slate-800 dark:text-slate-300"
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            <ErpDrawerFooter
              onCancel={() => setIsAssetDrawerOpen(false)}
              onSave={() => void handleSaveAsset()}
              saving={savingAsset}
              isEdit={assetDrawerMode === "edit"}
              saveLabel={assetDrawerMode === "edit" ? "Save Changes" : "Create Asset"}
            />
          )
        }
      >
        {assetDrawerMode === "view" && selectedAsset ? (
          /* View Mode */
          <div className="space-y-6 p-4">
            {/* Header card */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 space-y-3 dark:border-slate-800 dark:bg-slate-800/40">
              <div className="flex items-center justify-between gap-3">
                <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-800 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white">
                  {selectedAsset.assetCode}
                </span>
                <span className="inline-flex px-2.5 py-0.5 text-xs font-semibold rounded-full border bg-slate-100 text-slate-700 border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  {selectedAsset.category ?? selectedAsset.assetCategory ?? "Asset"}
                </span>
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {selectedAsset.name ?? selectedAsset.assetName}
                </h3>
                {selectedAsset.location ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Location: {selectedAsset.location}
                  </p>
                ) : null}
              </div>
            </div>

            {/* Valuation Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Capitalized Value</p>
                <p className="text-lg font-mono font-bold text-slate-900 mt-1 dark:text-white">
                  ₹{(selectedAsset.purchaseValue || 0).toLocaleString("en-IN")}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Acquisition cost on {selectedAsset.purchaseDate?.slice(0, 10) ?? "—"}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Current Custodian</p>
                <p className="text-sm font-semibold text-slate-900 mt-2 truncate dark:text-white">
                  {selectedAsset.allocatedToEmployeeId
                    ? employeeMap.get(selectedAsset.allocatedToEmployeeId) ?? "Assigned Staff"
                    : "Available (In Pool)"}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {selectedAsset.allocatedToEmployeeId ? "Active custody issuance" : "Unissued hardware"}
                </p>
              </div>
            </div>

            {/* Detailed Spec List */}
            <div className="rounded-xl border border-slate-200 bg-white divide-y divide-slate-100 text-xs dark:border-slate-800 dark:bg-slate-900 dark:divide-slate-800">
              <div className="p-3.5 flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Serial Number:</span>
                <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                  {selectedAsset.serialNumber || "Not recorded"}
                </span>
              </div>

              <div className="p-3.5 flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Useful Life Span:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {selectedAsset.usefulLifeYears ?? 3} Years
                </span>
              </div>

              <div className="p-3.5 flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Supplier / Vendor:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {selectedAsset.supplier || "Direct Procurement"}
                </span>
              </div>

              <div className="p-3.5 flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Warranty Expiry:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {selectedAsset.warrantyExpiryDate ? selectedAsset.warrantyExpiryDate.slice(0, 10) : "Not configured"}
                </span>
              </div>
            </div>

            {/* Compliance Note */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
              <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                IT Security & Device Governance
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                All issued hardware must comply with organizational endpoint security guidelines, full disk encryption, and periodic inventory reconciliation.
              </p>
            </div>
          </div>
        ) : (
          /* Create / Edit Form */
          <div className="space-y-5 p-4">
            {/* Form Tabs */}
            <div className="flex border-b border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setAssetFormTab("basic")}
                className={`flex-1 py-2.5 text-xs font-semibold border-b-2 transition ${
                  assetFormTab === "basic"
                    ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
                    : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400"
                }`}
              >
                1. Basic Info
              </button>
              <button
                type="button"
                onClick={() => setAssetFormTab("financial")}
                className={`flex-1 py-2.5 text-xs font-semibold border-b-2 transition ${
                  assetFormTab === "financial"
                    ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
                    : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400"
                }`}
              >
                2. Valuation & Life
              </button>
              <button
                type="button"
                onClick={() => setAssetFormTab("warranty")}
                className={`flex-1 py-2.5 text-xs font-semibold border-b-2 transition ${
                  assetFormTab === "warranty"
                    ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
                    : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400"
                }`}
              >
                3. Warranty & Terms
              </button>
            </div>

            {assetFormTab === "basic" ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Asset Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={assetForm.assetCode}
                    onChange={(e) => setAssetForm({ ...assetForm, assetCode: e.target.value })}
                    placeholder="e.g. AST-LAP-001, AST-DSK-042"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 uppercase font-mono dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Asset Name & Model <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={assetForm.name}
                    onChange={(e) => setAssetForm({ ...assetForm, name: e.target.value })}
                    placeholder="e.g. Dell Latitude 7440, Apple MacBook Pro 14 M3"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Hardware Category
                    </label>
                    <select
                      value={assetForm.category}
                      onChange={(e) => setAssetForm({ ...assetForm, category: e.target.value })}
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Serial Number / Service Tag
                    </label>
                    <input
                      type="text"
                      value={assetForm.serialNumber}
                      onChange={(e) => setAssetForm({ ...assetForm, serialNumber: e.target.value })}
                      placeholder="e.g. 8CG2345ABC"
                      className="w-full px-3 py-2 text-sm font-mono bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Operating Campus / Location
                  </label>
                  <input
                    type="text"
                    value={assetForm.location}
                    onChange={(e) => setAssetForm({ ...assetForm, location: e.target.value })}
                    placeholder="e.g. Bangalore Tech Center, Floor 4, Bay 12"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>
            ) : assetFormTab === "financial" ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Purchase Date
                    </label>
                    <input
                      type="date"
                      value={assetForm.purchaseDate}
                      onChange={(e) => setAssetForm({ ...assetForm, purchaseDate: e.target.value })}
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Purchase Cost (INR)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={assetForm.purchaseValue}
                      onChange={(e) =>
                        setAssetForm({ ...assetForm, purchaseValue: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full px-3 py-2 text-sm font-mono bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Useful Life (Years)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="30"
                      value={assetForm.usefulLifeYears}
                      onChange={(e) =>
                        setAssetForm({ ...assetForm, usefulLifeYears: parseInt(e.target.value) || 3 })
                      }
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Supplier / Vendor
                    </label>
                    <input
                      type="text"
                      value={assetForm.supplier}
                      onChange={(e) => setAssetForm({ ...assetForm, supplier: e.target.value })}
                      placeholder="e.g. Dell India, Redington Ltd"
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Warranty Scope & Coverage
                  </label>
                  <input
                    type="text"
                    value={assetForm.warrantyInfo}
                    onChange={(e) => setAssetForm({ ...assetForm, warrantyInfo: e.target.value })}
                    placeholder="e.g. 3 Years ProSupport Next Business Day Onsite"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Warranty Expiry Date
                  </label>
                  <input
                    type="date"
                    value={assetForm.warrantyExpiryDate}
                    onChange={(e) => setAssetForm({ ...assetForm, warrantyExpiryDate: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-4 dark:border-indigo-900/50 dark:bg-indigo-950/40">
                  <div className="flex items-center gap-2 text-indigo-800 dark:text-indigo-300 text-xs font-bold mb-1">
                    <ShieldCheck className="h-4 w-4" />
                    Acceptable Use & Statutory Compliance
                  </div>
                  <p className="text-xs text-indigo-700 dark:text-indigo-300 leading-relaxed">
                    Assets are mapped to corporate inventory for Companies Act Schedule II depreciation and insurance coverage.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </SideDrawer>

      {/* Allocate Custody Drawer */}
      <SideDrawer
        open={isAllocateDrawerOpen}
        onClose={() => setIsAllocateDrawerOpen(false)}
        title="Allocate Hardware Custody"
        subtitle="Assign an enterprise device to an employee with official acceptance tracking."
        width="md"
        footer={
          <ErpDrawerFooter
            onCancel={() => setIsAllocateDrawerOpen(false)}
            onSave={() => void handleSaveAllocation()}
            saving={savingAllocation}
            saveLabel="Issue Hardware"
          />
        }
      >
        <div className="space-y-4 p-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Select Hardware Item <span className="text-rose-500">*</span>
            </label>
            <select
              value={allocationForm.assetId}
              onChange={(e) => setAllocationForm({ ...allocationForm, assetId: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              <option value="">Select available asset from pool...</option>
              {availableAssetsForAllocation.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.assetCode} — {a.name ?? a.assetName} ({a.category ?? a.assetCategory})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Custodian Employee <span className="text-rose-500">*</span>
            </label>
            <select
              value={allocationForm.employeeId}
              onChange={(e) => setAllocationForm({ ...allocationForm, employeeId: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              <option value="">Select workforce employee...</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.fullName} {emp.employeeCode ? `(${emp.employeeCode})` : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Issuance Purpose / Reason
            </label>
            <input
              type="text"
              value={allocationForm.allocationReason}
              onChange={(e) =>
                setAllocationForm({ ...allocationForm, allocationReason: e.target.value })
              }
              placeholder="e.g. New Joiner Onboarding Kit, Technical Replacement"
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>
        </div>
      </SideDrawer>

      {/* Return Asset Modal */}
      {returnAllocation ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-6 space-y-4 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-rose-50 rounded-xl text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
                <UserX className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Return Hardware to Pool</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Release custody from {returnAllocation.employeeName || "employee"} and restore device to stock.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Return Reason / Device Condition
              </label>
              <textarea
                rows={3}
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
                placeholder="e.g. Offboarding return, device condition verified in good working order..."
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setReturnAllocation(null)}
                disabled={savingReturn}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition dark:bg-slate-800 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReturn}
                disabled={savingReturn}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 rounded-lg hover:bg-rose-700 transition disabled:opacity-60"
              >
                {savingReturn ? "Processing..." : "Confirm Return"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Universal Delete Dialog */}
      <UniversalDeleteDialog
        open={Boolean(deleteAssetRecord)}
        onOpenChange={(open) => {
          if (!open) setDeleteAssetRecord(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Hardware Asset"
        entityName={deleteAssetRecord ? `${deleteAssetRecord.assetCode} - ${deleteAssetRecord.name ?? deleteAssetRecord.assetName}` : ""}
        loading={deleting}
      />
    </>
  );
}
