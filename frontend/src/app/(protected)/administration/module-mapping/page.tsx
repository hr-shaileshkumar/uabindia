"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Layers,
  Save,
  RotateCcw,
  Search,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  Building2,
  Sparkles,
  ArrowUpDown,
  MoveRight,
  HelpCircle,
  FolderTree,
  CheckCircle2,
  Filter,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { appApi } from "@/services/modules";
import { useUiSchema } from "@/context/UiSchemaContext";
import { notifyError, notifySuccess } from "@/lib/notifications";
import { cn } from "@/lib/utils";
import ModuleIcon from "@/components/ModuleIcon";

interface PageMappingItem {
  id?: string;
  pageKey: string;
  entityName?: string;
  title: string;
  subTitle?: string;
  moduleKey: string;
  routePath: string;
  icon?: string;
  navGroup?: string;
  navSortOrder: number;
  addToNavigation: boolean;
  status?: string;
  allowedRoles?: string[];
}

interface ModuleMappingItem {
  key: string;
  defaultName: string;
  displayName: string;
  customDisplayName?: string | null;
  defaultSortOrder: number;
  sortOrder: number;
  customSortOrder?: number | null;
  defaultIcon: string;
  icon: string;
  customIcon?: string | null;
  customSection?: string | null;
  basePath?: string;
  description?: string;
  isEnabled: boolean;
  pageCount: number;
  pages: PageMappingItem[];
}

interface TenantItem {
  id: string;
  name: string;
  subdomain?: string;
}

const SECTION_OPTIONS = [
  { id: "", label: "Default Section" },
  { id: "work", label: "My Work" },
  { id: "people", label: "People & Talent" },
  { id: "commerce", label: "Supply Chain & Sales" },
  { id: "finance", label: "Finance & Accounts" },
  { id: "ops", label: "Operations & Delivery" },
  { id: "administration", label: "Administration" },
];

const AVAILABLE_ICONS = [
  "users",
  "calculator",
  "receipt",
  "shopping-bag",
  "shopping-cart",
  "box",
  "folder",
  "ticket",
  "megaphone",
  "bot",
  "file-text",
  "sliders",
  "shield",
  "bank",
  "building",
  "clock",
  "award",
  "chart-bar",
  "activity",
  "layers",
];

export default function ModuleMappingPage() {
  const { refresh: refreshUiSchema } = useUiSchema();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);

  const [tenantId, setTenantId] = useState<string>("");
  const [tenantName, setTenantName] = useState<string>("");
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [tenants, setTenants] = useState<TenantItem[]>([]);

  const [modules, setModules] = useState<ModuleMappingItem[]>([]);
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set(["hrms", "finance"]));
  const [searchQuery, setSearchQuery] = useState("");
  const [sectionFilter, setSectionFilter] = useState("all");

  const [dirty, setDirty] = useState(false);

  const loadMapping = async (selectedTenantId?: string) => {
    try {
      setLoading(true);
      const res: any = await appApi.modules.getMapping(selectedTenantId || undefined);
      if (res) {
        setTenantId(res.tenantId || "");
        setTenantName(res.tenantName || "Default Organization");
        setIsSuperAdmin(Boolean(res.isSuperAdmin));
        if (res.tenants) {
          setTenants(res.tenants);
        }
        setModules(res.modules || []);
        setDirty(false);
      }
    } catch (err: any) {
      notifyError(err?.message || "Failed to load module mapping.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMapping();
  }, []);

  const handleTenantChange = (newTenantId: string) => {
    if (dirty) {
      if (!confirm("You have unsaved changes. Switching tenant will discard unsaved modifications. Continue?")) {
        return;
      }
    }
    loadMapping(newTenantId);
  };

  const toggleExpand = (key: string) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleModuleChange = (
    key: string,
    field: keyof ModuleMappingItem,
    val: any
  ) => {
    setModules((prev) =>
      prev.map((mod) => {
        if (mod.key !== key) return mod;
        const updated = { ...mod, [field]: val };
        // Sync effective displayName / sortOrder
        if (field === "customDisplayName") {
          updated.displayName = val?.trim() || mod.defaultName;
        }
        if (field === "customSortOrder") {
          updated.sortOrder = typeof val === "number" ? val : mod.defaultSortOrder;
        }
        if (field === "customIcon") {
          updated.icon = val?.trim() || mod.defaultIcon;
        }
        return updated;
      })
    );
    setDirty(true);
  };

  const handlePageChange = (
    moduleKey: string,
    pageKey: string,
    field: keyof PageMappingItem,
    val: any
  ) => {
    setModules((prev) =>
      prev.map((mod) => {
        if (mod.key !== moduleKey) return mod;
        const updatedPages = mod.pages.map((page) => {
          if (page.pageKey !== pageKey) return page;
          return { ...page, [field]: val };
        });
        return { ...mod, pages: updatedPages };
      })
    );
    setDirty(true);
  };

  const handleMovePageToModule = (
    fromModuleKey: string,
    pageKey: string,
    targetModuleKey: string
  ) => {
    if (fromModuleKey === targetModuleKey) return;

    setModules((prev) => {
      let pageToMove: PageMappingItem | null = null;
      const step1 = prev.map((mod) => {
        if (mod.key === fromModuleKey) {
          const found = mod.pages.find((p) => p.pageKey === pageKey);
          if (found) {
            pageToMove = { ...found, moduleKey: targetModuleKey };
          }
          return {
            ...mod,
            pages: mod.pages.filter((p) => p.pageKey !== pageKey),
            pageCount: mod.pages.length - (found ? 1 : 0),
          };
        }
        return mod;
      });

      if (!pageToMove) return prev;

      return step1.map((mod) => {
        if (mod.key === targetModuleKey) {
          const newPages = [...mod.pages, pageToMove!];
          return {
            ...mod,
            pages: newPages,
            pageCount: newPages.length,
          };
        }
        return mod;
      });
    });

    setExpandedKeys((prev) => new Set([...prev, targetModuleKey]));
    setDirty(true);
    notifySuccess(`Page '${pageKey}' moved to '${targetModuleKey}' module.`);
  };

  const handleReorderModule = (moduleKey: string, direction: "up" | "down") => {
    setModules((prev) => {
      const sorted = [...prev].sort((a, b) => a.sortOrder - b.sortOrder);
      const index = sorted.findIndex((m) => m.key === moduleKey);
      if (index === -1) return prev;
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= sorted.length) return prev;

      const current = sorted[index];
      const other = sorted[targetIndex];

      const currentOrder = current.sortOrder;
      const otherOrder = other.sortOrder;
      const newCurrentOrder =
        otherOrder === currentOrder
          ? direction === "up"
            ? otherOrder - 10
            : otherOrder + 10
          : otherOrder;

      return prev.map((m) => {
        if (m.key === current.key) {
          return { ...m, customSortOrder: newCurrentOrder, sortOrder: newCurrentOrder };
        }
        if (m.key === other.key) {
          return { ...m, customSortOrder: currentOrder, sortOrder: currentOrder };
        }
        return m;
      });
    });
    setDirty(true);
  };

  const handleReorderPage = (moduleKey: string, pageKey: string, direction: "up" | "down") => {
    setModules((prev) => {
      return prev.map((m) => {
        if (m.key !== moduleKey) return m;
        const sortedPages = [...m.pages].sort((a, b) => a.navSortOrder - b.navSortOrder);
        const index = sortedPages.findIndex((p) => p.pageKey === pageKey);
        if (index === -1) return m;
        const targetIndex = direction === "up" ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= sortedPages.length) return m;

        const current = sortedPages[index];
        const other = sortedPages[targetIndex];

        const currentOrder = current.navSortOrder;
        const otherOrder = other.navSortOrder;
        const newCurrentOrder =
          otherOrder === currentOrder
            ? direction === "up"
              ? otherOrder - 5
              : otherOrder + 5
            : otherOrder;

        const updatedPages = m.pages.map((p) => {
          if (p.pageKey === current.pageKey) return { ...p, navSortOrder: newCurrentOrder };
          if (p.pageKey === other.pageKey) return { ...p, navSortOrder: currentOrder };
          return p;
        });

        return { ...m, pages: updatedPages };
      });
    });
    setDirty(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      // 1. Save module custom mapping
      const modulesPayload = {
        modules: modules.map((m) => ({
          key: m.key,
          customDisplayName: m.customDisplayName?.trim() || null,
          customSortOrder: typeof m.customSortOrder === "number" ? m.customSortOrder : null,
          customIcon: m.customIcon?.trim() || null,
          customSection: m.customSection?.trim() || null,
          isEnabled: m.isEnabled,
        })),
      };

      await appApi.modules.updateMapping(modulesPayload, tenantId || undefined);

      // 2. Save page hierarchy updates for each module
      for (const mod of modules) {
        if (mod.pages && mod.pages.length > 0) {
          await appApi.modules.updateModulePages(
            mod.key,
            {
              pages: mod.pages.map((p) => ({
                id: p.id,
                pageKey: p.pageKey,
                title: p.title,
                moduleKey: p.moduleKey,
                navGroup: p.navGroup,
                navSortOrder: p.navSortOrder,
                addToNavigation: p.addToNavigation,
                icon: p.icon,
                allowedRoles: p.allowedRoles,
              })),
            },
            tenantId || undefined
          );
        }
      }

      setDirty(false);
      notifySuccess("Module & page navigation mapping saved successfully!");

      // 3. Immediately refresh workspace UI schema so sidebar instantly updates!
      await refreshUiSchema();
    } catch (err: any) {
      notifyError(err?.message || "Failed to save module mapping.");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!confirm("Are you sure you want to reset all module custom names, icons, and sequence numbers to system defaults?")) {
      return;
    }
    try {
      setResetting(true);
      await appApi.modules.resetMapping(tenantId || undefined);
      notifySuccess("Module mappings reset to system defaults.");
      await loadMapping(tenantId || undefined);
      await refreshUiSchema();
    } catch (err: any) {
      notifyError(err?.message || "Failed to reset module mapping.");
    } finally {
      setResetting(false);
    }
  };

  const filteredModules = useMemo(() => {
    return modules
      .filter((mod) => {
        if (sectionFilter !== "all") {
          const modSection = mod.customSection || "";
          if (sectionFilter === "default" && modSection !== "") return false;
          if (sectionFilter !== "default" && modSection !== sectionFilter) return false;
        }

        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        const matchModule =
          mod.key.toLowerCase().includes(q) ||
          mod.displayName.toLowerCase().includes(q) ||
          mod.defaultName.toLowerCase().includes(q);
        const matchPages = mod.pages.some(
          (p) =>
            p.title.toLowerCase().includes(q) ||
            p.pageKey.toLowerCase().includes(q) ||
            p.routePath.toLowerCase().includes(q)
        );
        return matchModule || matchPages;
      })
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }, [modules, searchQuery, sectionFilter]);

  const stats = useMemo(() => {
    const active = modules.filter((m) => m.isEnabled).length;
    const totalPages = modules.reduce((acc, m) => acc + m.pages.length, 0);
    const customized = modules.filter(
      (m) => m.customDisplayName || m.customSortOrder || m.customIcon || m.customSection
    ).length;
    return { active, totalPages, customized };
  }, [modules]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center p-8 text-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        <p className="mt-4 text-sm font-medium text-slate-600 dark:text-slate-400">
          Loading module & navigation mapping schema...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Header Banner */}
      <div className="rounded-2xl border border-slate-200/80 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white shadow-xl dark:border-slate-800">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/20 text-blue-400 backdrop-blur-md">
                <Layers className="h-5 w-5" />
              </span>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                  Enterprise Module & Navigation Mapping
                </h1>
                <p className="text-xs text-slate-300">
                  Self-service module renaming, sequence ordering, icon styling, and page hierarchy configuration.
                </p>
              </div>
            </div>

            {/* Tenant badge & Superadmin switcher */}
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200">
                <Building2 className="h-3.5 w-3.5 text-blue-400" />
                <span>Tenant: <strong>{tenantName}</strong></span>
              </div>

              {isSuperAdmin && tenants.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-amber-300 font-semibold">SuperAdmin Scope:</span>
                  <select
                    value={tenantId}
                    onChange={(e) => handleTenantChange(e.target.value)}
                    className="rounded-lg border border-amber-400/40 bg-slate-800/90 px-2.5 py-1 text-xs font-medium text-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-400"
                  >
                    {tenants.map((t) => (
                      <option key={t.id} value={t.id} className="bg-slate-900 text-white">
                        {t.name} {t.subdomain ? `(${t.subdomain})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleReset}
              disabled={resetting || saving}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/20 disabled:opacity-50"
              title="Reset all module titles and order back to factory defaults"
            >
              <RotateCcw className={cn("h-3.5 w-3.5", resetting && "animate-spin")} />
              <span>Reset Defaults</span>
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className={cn(
                "inline-flex items-center gap-2 rounded-xl px-5 py-2 text-xs font-semibold shadow-lg transition-all",
                dirty
                  ? "bg-blue-500 text-white hover:bg-blue-400 ring-2 ring-blue-400/50 animate-pulse"
                  : "bg-blue-600 text-white hover:bg-blue-500"
              )}
            >
              <Save className={cn("h-4 w-4", saving && "animate-spin")} />
              <span>{saving ? "Saving Changes..." : dirty ? "Save Changes (Unsaved)" : "Saved to Database"}</span>
            </button>
          </div>
        </div>

        {/* Stats Metrics Strip */}
        <div className="mt-6 grid grid-cols-2 gap-3 border-t border-white/10 pt-4 sm:grid-cols-3">
          <div className="rounded-lg bg-white/5 px-3 py-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Active Modules</span>
            <p className="text-lg font-bold text-white">{stats.active} <span className="text-xs font-normal text-slate-400">/ {modules.length}</span></p>
          </div>
          <div className="rounded-lg bg-white/5 px-3 py-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Total Configured Pages</span>
            <p className="text-lg font-bold text-white">{stats.totalPages}</p>
          </div>
          <div className="rounded-lg bg-white/5 px-3 py-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Customized Modules</span>
            <p className="text-lg font-bold text-white">{stats.customized} <span className="text-xs font-normal text-slate-400">active overrides</span></p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search module name, key, or page route..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Filter className="h-3.5 w-3.5" />
            <span>Section:</span>
          </div>
          <select
            value={sectionFilter}
            onChange={(e) => setSectionFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <option value="all">All Sections</option>
            <option value="default">Default Section</option>
            <option value="work">My Work</option>
            <option value="people">People & Talent</option>
            <option value="commerce">Supply Chain & Sales</option>
            <option value="finance">Finance & Accounts</option>
            <option value="ops">Operations & Delivery</option>
            <option value="administration">Administration</option>
          </select>

          <button
            type="button"
            onClick={() => {
              if (expandedKeys.size === modules.length) setExpandedKeys(new Set());
              else setExpandedKeys(new Set(modules.map((m) => m.key)));
            }}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            {expandedKeys.size === modules.length ? "Collapse All" : "Expand All"}
          </button>
        </div>
      </div>

      {/* Modules List Container */}
      <div className="space-y-4">
        {filteredModules.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 p-12 text-center dark:border-slate-700">
            <p className="text-sm font-medium text-slate-500">No modules match your current filter.</p>
          </div>
        ) : (
          filteredModules.map((mod) => {
            const isExpanded = expandedKeys.has(mod.key);
            const isCustomized = Boolean(
              mod.customDisplayName ||
              mod.customSortOrder !== null && mod.customSortOrder !== undefined ||
              mod.customIcon ||
              mod.customSection
            );

            return (
              <div
                key={mod.key}
                className={cn(
                  "overflow-hidden rounded-xl border bg-white shadow-sm transition-all dark:bg-slate-900",
                  !mod.isEnabled
                    ? "border-slate-200 opacity-60 dark:border-slate-800"
                    : isCustomized
                    ? "border-blue-300 dark:border-blue-900/60 ring-1 ring-blue-500/20"
                    : "border-slate-200 dark:border-slate-800"
                )}
              >
                {/* Module Summary Bar */}
                <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between bg-slate-50/50 dark:bg-slate-800/30">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => toggleExpand(mod.key)}
                      className="rounded-lg p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-slate-700"
                      title={isExpanded ? "Collapse pages" : "Expand pages"}
                    >
                      {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </button>

                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                      <ModuleIcon name={mod.icon} className="h-5 w-5" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 dark:text-slate-100">
                          {mod.displayName}
                        </span>
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-mono font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                          {mod.key}
                        </span>
                        {isCustomized && (
                          <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-600 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800">
                            <Sparkles className="h-2.5 w-2.5" /> Customized
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-1">
                        Default name: <span className="font-medium">{mod.defaultName}</span> • Default order: {mod.defaultSortOrder}
                      </p>
                    </div>
                  </div>

                  {/* Module Level Inputs */}
                  <div className="flex flex-wrap items-center gap-2.5">
                    {/* Custom Display Name Input */}
                    <div className="flex flex-col">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Display Name
                      </label>
                      <input
                        type="text"
                        placeholder={mod.defaultName}
                        value={mod.customDisplayName ?? ""}
                        onChange={(e) => handleModuleChange(mod.key, "customDisplayName", e.target.value)}
                        className="w-40 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-800 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                        title="Name shown in sidebar navigation and across all workspace tabs"
                      />
                    </div>

                    {/* Sequence Number / Sort Order Input */}
                    <div className="flex flex-col">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Sequence (Order)
                      </label>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={mod.customSortOrder ?? mod.defaultSortOrder}
                          onChange={(e) =>
                            handleModuleChange(
                              mod.key,
                              "customSortOrder",
                              e.target.value ? parseInt(e.target.value, 10) : null
                            )
                          }
                          className="w-16 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-800 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                          title="Self-service numbering/sequence order in the navigation menu"
                        />
                        <div className="flex flex-col">
                          <button
                            type="button"
                            onClick={() => handleReorderModule(mod.key, "up")}
                            className="rounded p-0.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-slate-700"
                            title="Move module up in sequence"
                          >
                            <ArrowUp className="h-3 w-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleReorderModule(mod.key, "down")}
                            className="rounded p-0.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-slate-700"
                            title="Move module down in sequence"
                          >
                            <ArrowDown className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Section Assignment */}
                    <div className="flex flex-col">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Nav Section
                      </label>
                      <select
                        value={mod.customSection ?? ""}
                        onChange={(e) => handleModuleChange(mod.key, "customSection", e.target.value || null)}
                        className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-800 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                      >
                        {SECTION_OPTIONS.map((opt) => (
                          <option key={opt.id} value={opt.id}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Icon Picker */}
                    <div className="flex flex-col">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Icon
                      </label>
                      <select
                        value={mod.customIcon ?? mod.defaultIcon}
                        onChange={(e) => handleModuleChange(mod.key, "customIcon", e.target.value)}
                        className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-800 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                      >
                        {AVAILABLE_ICONS.map((ic) => (
                          <option key={ic} value={ic}>
                            {ic}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Enable/Disable Switch */}
                    <div className="flex flex-col items-center">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Status
                      </label>
                      <button
                        type="button"
                        onClick={() => handleModuleChange(mod.key, "isEnabled", !mod.isEnabled)}
                        className={cn(
                          "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                          mod.isEnabled ? "bg-emerald-600" : "bg-slate-300 dark:bg-slate-700"
                        )}
                        title={mod.isEnabled ? "Module is enabled in navigation" : "Module is disabled"}
                      >
                        <span
                          className={cn(
                            "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out",
                            mod.isEnabled ? "translate-x-5" : "translate-x-0"
                          )}
                        />
                      </button>
                    </div>

                    {/* Page counter & expand toggle button */}
                    <button
                      type="button"
                      onClick={() => toggleExpand(mod.key)}
                      className="ml-2 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                    >
                      <FolderTree className="h-3.5 w-3.5 text-blue-500" />
                      <span>{mod.pageCount} Pages</span>
                    </button>
                  </div>
                </div>

                {/* Child Pages Hierarchy Panel */}
                {isExpanded && (
                  <div className="border-t border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-900/40">
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                          Pages Assigned Under {mod.displayName}
                        </h4>
                        <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                          {mod.pages.length} total
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Tip: You can rename page titles, adjust menu sort numbers, or move pages to other modules.
                      </p>
                    </div>

                    {mod.pages.length === 0 ? (
                      <p className="py-4 text-center text-xs text-slate-400">
                        No individual dynamic pages configured directly under this module yet.
                      </p>
                    ) : (
                      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <table className="w-full text-left text-xs">
                          <thead className="border-b border-slate-200 bg-slate-100/70 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800">
                            <tr>
                              <th className="px-3 py-2">Menu Display Title</th>
                              <th className="px-3 py-2">Page Key / Route</th>
                              <th className="px-3 py-2 w-28">Nav Group</th>
                              <th className="px-3 py-2 w-20">Seq Order</th>
                              <th className="px-3 py-2 w-36">Role Access</th>
                              <th className="px-3 py-2 w-40">Move to Module</th>
                              <th className="px-3 py-2 w-24 text-center">In Menu</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {mod.pages.map((page) => (
                              <tr key={page.pageKey} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50">
                                {/* Page Display Title Input */}
                                <td className="px-3 py-2">
                                  <input
                                    type="text"
                                    value={page.title}
                                    onChange={(e) =>
                                      handlePageChange(mod.key, page.pageKey, "title", e.target.value)
                                    }
                                    className="w-full rounded border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-800 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                                  />
                                </td>

                                {/* Route Path & Key */}
                                <td className="px-3 py-2">
                                  <div className="flex flex-col">
                                    <span className="font-mono text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                                      {page.routePath}
                                    </span>
                                    <span className="font-mono text-[10px] text-slate-400">
                                      {page.pageKey}
                                    </span>
                                  </div>
                                </td>

                                {/* Nav Group Input */}
                                <td className="px-3 py-2">
                                  <input
                                    type="text"
                                    placeholder="e.g. Core HR"
                                    value={page.navGroup ?? ""}
                                    onChange={(e) =>
                                      handlePageChange(mod.key, page.pageKey, "navGroup", e.target.value)
                                    }
                                    className="w-full rounded border border-slate-200 bg-white px-2 py-1 text-xs text-slate-800 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                                  />
                                </td>

                                {/* Nav Sort Order Input */}
                                <td className="px-3 py-2">
                                  <div className="flex items-center gap-1">
                                    <input
                                      type="number"
                                      value={page.navSortOrder}
                                      onChange={(e) =>
                                        handlePageChange(
                                          mod.key,
                                          page.pageKey,
                                          "navSortOrder",
                                          parseInt(e.target.value, 10) || 0
                                        )
                                      }
                                      className="w-14 rounded border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-800 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                                    />
                                    <div className="flex flex-col">
                                      <button
                                        type="button"
                                        onClick={() => handleReorderPage(mod.key, page.pageKey, "up")}
                                        className="rounded p-0.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-slate-700"
                                        title="Move page up"
                                      >
                                        <ArrowUp className="h-2.5 w-2.5" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleReorderPage(mod.key, page.pageKey, "down")}
                                        className="rounded p-0.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-slate-700"
                                        title="Move page down"
                                      >
                                        <ArrowDown className="h-2.5 w-2.5" />
                                      </button>
                                    </div>
                                  </div>
                                </td>

                                {/* Role Access Dropdown */}
                                <td className="px-3 py-2">
                                  <select
                                    value={
                                      page.allowedRoles && page.allowedRoles.length > 0
                                        ? page.allowedRoles.join(",")
                                        : ""
                                    }
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      const roles = val ? val.split(",") : undefined;
                                      handlePageChange(mod.key, page.pageKey, "allowedRoles", roles);
                                    }}
                                    className="w-full rounded border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                                  >
                                    <option value="">All Roles (Default)</option>
                                    <option value="SuperAdmin,Admin">Admin Only</option>
                                    <option value="SuperAdmin,Admin,Manager">Admin & Manager</option>
                                    <option value="SuperAdmin,Admin,Manager,Employee">Employees & Above</option>
                                  </select>
                                </td>

                                {/* Move Page to another Module Dropdown */}
                                <td className="px-3 py-2">
                                  <select
                                    value={mod.key}
                                    onChange={(e) =>
                                      handleMovePageToModule(mod.key, page.pageKey, e.target.value)
                                    }
                                    className="w-full rounded border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                                  >
                                    {modules.map((targetMod) => (
                                      <option key={targetMod.key} value={targetMod.key}>
                                        Move to: {targetMod.displayName}
                                      </option>
                                    ))}
                                  </select>
                                </td>

                                {/* Add to navigation visibility toggle */}
                                <td className="px-3 py-2 text-center">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handlePageChange(
                                        mod.key,
                                        page.pageKey,
                                        "addToNavigation",
                                        !page.addToNavigation
                                      )
                                    }
                                    className={cn(
                                      "inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold transition",
                                      page.addToNavigation
                                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                                        : "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500"
                                    )}
                                    title={page.addToNavigation ? "Visible in menu" : "Hidden from menu"}
                                  >
                                    {page.addToNavigation ? (
                                      <>
                                        <Eye className="h-3 w-3" />
                                        <span>Shown</span>
                                      </>
                                    ) : (
                                      <>
                                        <EyeOff className="h-3 w-3" />
                                        <span>Hidden</span>
                                      </>
                                    )}
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Floating Save Dock when dirty */}
      {dirty && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl border border-slate-300 bg-white/95 px-5 py-3 shadow-2xl backdrop-blur-md dark:border-slate-700 dark:bg-slate-900/95">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-amber-500" />
            </span>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
              Unsaved mapping changes pending
            </span>
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-blue-500"
          >
            <Save className="h-4 w-4" />
            <span>{saving ? "Saving..." : "Save Now"}</span>
          </button>
        </div>
      )}
    </div>
  );
}