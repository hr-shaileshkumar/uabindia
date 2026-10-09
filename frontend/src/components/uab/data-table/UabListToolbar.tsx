"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  List,
  Kanban,
  LayoutGrid,
  FileSpreadsheet,
  RefreshCw,
  MoreHorizontal,
  Plus,
  SlidersHorizontal,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  X,
  Check,
  Search,
  CheckSquare,
  Shield,
  Upload,
  Settings,
  Sidebar as SidebarIcon,
  ChevronDown,
  Download,
  Bookmark,
  BookmarkCheck,
  Trash2,
  Printer,
  Calendar as CalendarIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { UniversalFilterBuilderModal } from "./UniversalFilterBuilderModal";
import {
  type FilterGroup,
  filterAstToHumanReadable,
} from "@/lib/filter-engine/filter-ast";

export type ErpViewMode = "list" | "kanban" | "image" | "report" | "calendar";
export type UabViewMode = ErpViewMode;

export interface FilterRule {
  id: string;
  field: string;
  operator: string;
  value: string;
}

export interface SortOption {
  key: string;
  label: string;
}

export interface QuickFilterField {
  key: string;
  label: string;
  placeholder?: string;
  options?: Array<{ label: string; value: string }>;
}

export interface UabListToolbarProps {
  viewMode: ErpViewMode;
  onViewModeChange: (mode: ErpViewMode) => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  onImport?: () => void;
  onExportCsv?: () => void;
  onPrintList?: () => void;
  onCustomize?: () => void;
  density?: "compact" | "normal" | "comfortable";
  onDensityChange?: (density: "compact" | "normal" | "comfortable") => void;
  onToggleSidebar?: () => void;
  onOpenPermissions?: () => void;
  primaryActionLabel?: string;
  onPrimaryAction?: () => void;
  primaryActionIcon?: React.ReactNode;
  columns: Array<{ key: string; label: string; dataType?: string }>;
  quickFilterFields?: QuickFilterField[];
  quickFilterValues: Record<string, string>;
  onQuickFilterChange: (key: string, value: string) => void;
  onClearQuickFilters?: () => void;
  advancedFilters: FilterRule[];
  onApplyAdvancedFilters: (filters: FilterRule[]) => void;
  onClearAdvancedFilters: () => void;
  filterAst?: FilterGroup | null;
  onApplyFilterAst?: (ast: FilterGroup | null) => void;
  sortKey: string;
  sortDirection: "asc" | "desc";
  onSortChange: (key: string, direction: "asc" | "desc") => void;
  savedViews?: Array<{ id: string; name: string; scope?: "Personal" | "Role" | "Tenant"; isDefault?: boolean }>;
  activeViewId?: string | null;
  onSelectView?: (viewId: string) => void;
  onSaveCurrentView?: (name: string, scope?: "Personal" | "Role" | "Tenant") => void;
  onDeleteView?: (viewId: string) => void;
  className?: string;
}

const FILTER_OPERATORS = [
  { value: "equals", label: "Equals" },
  { value: "contains", label: "Like" },
  { value: "not_equals", label: "Not Equals" },
  { value: "starts_with", label: "Starts With" },
  { value: "greater_than", label: "Greater Than" },
  { value: "less_than", label: "Less Than" },
  { value: "in", label: "In" },
];

export function UabListToolbar({
  viewMode,
  onViewModeChange,
  onRefresh,
  isRefreshing = false,
  onImport,
  onExportCsv,
  onPrintList,
  onCustomize,
  density = "normal",
  onDensityChange,
  onToggleSidebar,
  onOpenPermissions,
  primaryActionLabel,
  onPrimaryAction,
  primaryActionIcon,
  columns,
  quickFilterFields = [],
  quickFilterValues,
  onQuickFilterChange,
  onClearQuickFilters,
  advancedFilters,
  onApplyAdvancedFilters,
  onClearAdvancedFilters,
  filterAst,
  onApplyFilterAst,
  sortKey,
  sortDirection,
  onSortChange,
  savedViews,
  activeViewId,
  onSelectView,
  onSaveCurrentView,
  onDeleteView,
  className,
}: UabListToolbarProps) {
  // Popover & dropdown states
  const [viewMenuOpen, setViewMenuOpen] = useState(false);
  const [savedViewsMenuOpen, setSavedViewsMenuOpen] = useState(false);
  const [newViewName, setNewViewName] = useState("");
  const [newViewScope, setNewViewScope] = useState<"Personal" | "Role" | "Tenant">("Personal");
  const [actionsMenuOpen, setActionsMenuOpen] = useState(false);
  const [filterPopoverOpen, setFilterPopoverOpen] = useState(false);
  const [astModalOpen, setAstModalOpen] = useState(false);
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const [sortSearch, setSortSearch] = useState("");

  // Draft advanced filter state for the popover
  const [draftFilters, setDraftFilters] = useState<FilterRule[]>(advancedFilters);

  // Sync draft filters when opened
  useEffect(() => {
    setDraftFilters(advancedFilters);
  }, [advancedFilters, filterPopoverOpen]);

  // Click outside handlers
  const viewMenuRef = useRef<HTMLDivElement>(null);
  const savedViewsRef = useRef<HTMLDivElement>(null);
  const actionsMenuRef = useRef<HTMLDivElement>(null);
  const filterPopoverRef = useRef<HTMLDivElement>(null);
  const sortMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (viewMenuRef.current && !viewMenuRef.current.contains(target)) {
        setViewMenuOpen(false);
      }
      if (savedViewsRef.current && !savedViewsRef.current.contains(target)) {
        setSavedViewsMenuOpen(false);
      }
      if (actionsMenuRef.current && !actionsMenuRef.current.contains(target)) {
        setActionsMenuOpen(false);
      }
      if (filterPopoverRef.current && !filterPopoverRef.current.contains(target)) {
        setFilterPopoverOpen(false);
      }
      if (sortMenuRef.current && !sortMenuRef.current.contains(target)) {
        setSortMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Keyboard shortcut listener (Ctrl+J = Customize, Ctrl+K = Toggle Sidebar)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "j") {
        e.preventDefault();
        onCustomize?.();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onToggleSidebar?.();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onCustomize, onToggleSidebar]);

  // Default filterable columns
  const filterableColumns = useMemo(
    () => columns.filter((c) => c.key !== "actions" && c.key !== "_"),
    [columns]
  );

  // Available sort columns
  const sortableColumns = useMemo(() => {
    const list = columns.filter((c) => c.key !== "actions" && c.key !== "_");
    if (!sortSearch.trim()) return list;
    return list.filter((c) => c.label.toLowerCase().includes(sortSearch.toLowerCase()));
  }, [columns, sortSearch]);

  const activeSortCol = useMemo(
    () => columns.find((c) => c.key === sortKey) || { key: sortKey, label: sortKey || "Sort By" },
    [columns, sortKey]
  );

  // Add rule in draft
  const handleAddDraftRule = () => {
    const defaultField = filterableColumns[0]?.key || "id";
    setDraftFilters((prev) => [
      ...prev,
      {
        id: `flt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        field: defaultField,
        operator: "equals",
        value: "",
      },
    ]);
  };

  const handleApplyDraft = () => {
    onApplyAdvancedFilters(draftFilters.filter((f) => f.value.trim() !== ""));
    setFilterPopoverOpen(false);
  };

  const handleClearDraft = () => {
    setDraftFilters([]);
    onClearAdvancedFilters();
    setFilterPopoverOpen(false);
  };

  // Active filter count
  const activeFiltersCount =
    advancedFilters.filter((f) => f.value.trim() !== "").length +
    Object.values(quickFilterValues).filter((v) => v && v.trim() !== "" && v !== "all").length;

  return (
    <div className={cn("space-y-3 w-full", className)}>
      {/* ── TOP ACTION ROW: View Switcher, Refresh, More (...), Add Record ── */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          {/* View Switcher Dropdown */}
          <div className="relative" ref={viewMenuRef}>
            <button
              type="button"
              onClick={() => setViewMenuOpen((prev) => !prev)}
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200/90 bg-white px-3 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 cursor-pointer"
              title="Switch display view"
            >
              {viewMode === "list" && <List className="h-3.5 w-3.5 text-slate-500" />}
              {viewMode === "kanban" && <Kanban className="h-3.5 w-3.5 text-indigo-500" />}
              {viewMode === "image" && <LayoutGrid className="h-3.5 w-3.5 text-emerald-500" />}
              {viewMode === "report" && <FileSpreadsheet className="h-3.5 w-3.5 text-amber-500" />}
              <span className="capitalize">
                {viewMode === "list"
                  ? "List View"
                  : viewMode === "kanban"
                  ? "Kanban View"
                  : viewMode === "image"
                  ? "Image View"
                  : "Report View"}
              </span>
              <ChevronDown className="h-3 w-3 text-slate-400" />
            </button>

            {viewMenuOpen && (
              <div className="absolute left-0 top-10.5 z-50 w-48 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-slate-800 dark:bg-slate-900 animate-in fade-in zoom-in-95 duration-100">
                <button
                  type="button"
                  onClick={() => {
                    onViewModeChange("list");
                    setViewMenuOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium transition-colors text-left",
                    viewMode === "list"
                      ? "bg-indigo-50 font-bold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300"
                      : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                  )}
                >
                  <List className="h-3.5 w-3.5" />
                  <span>List View</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onViewModeChange("kanban");
                    setViewMenuOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium transition-colors text-left",
                    viewMode === "kanban"
                      ? "bg-indigo-50 font-bold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300"
                      : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                  )}
                >
                  <Kanban className="h-3.5 w-3.5" />
                  <span>Kanban View</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onViewModeChange("image");
                    setViewMenuOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium transition-colors text-left",
                    viewMode === "image"
                      ? "bg-indigo-50 font-bold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300"
                      : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                  )}
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                  <span>Image View</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onViewModeChange("report");
                    setViewMenuOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium transition-colors text-left",
                    viewMode === "report"
                      ? "bg-indigo-50 font-bold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300"
                      : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                  )}
                >
                  <FileSpreadsheet className="h-3.5 w-3.5" />
                  <span>Report View</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onViewModeChange("calendar");
                    setViewMenuOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium transition-colors text-left",
                    viewMode === "calendar"
                      ? "bg-indigo-50 font-bold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300"
                      : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                  )}
                >
                  <CalendarIcon className="h-3.5 w-3.5" />
                  <span>Calendar View</span>
                </button>
              </div>
            )}
          </div>

          {/* Saved Views Dropdown */}
          <div className="relative" ref={savedViewsRef}>
            <button
              type="button"
              onClick={() => setSavedViewsMenuOpen((prev) => !prev)}
              className={cn(
                "inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-xs font-semibold shadow-2xs transition-colors cursor-pointer",
                activeViewId
                  ? "border-indigo-300 bg-indigo-50/70 text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300"
                  : "border-slate-200/90 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              )}
              title="Manage and select saved views"
            >
              {activeViewId ? (
                <BookmarkCheck className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
              ) : (
                <Bookmark className="h-3.5 w-3.5 text-slate-500" />
              )}
              <span className="max-w-[120px] truncate">
                {activeViewId && savedViews?.find((v) => v.id === activeViewId)?.name
                  ? savedViews.find((v) => v.id === activeViewId)!.name
                  : "Views"}
              </span>
              <ChevronDown className="h-3 w-3 text-slate-400" />
            </button>

            {savedViewsMenuOpen && (
              <div className="absolute left-0 top-10.5 z-50 w-64 rounded-xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-800 dark:bg-slate-900 animate-in fade-in zoom-in-95 duration-100">
                <div className="flex items-center justify-between px-2 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  <span>Saved Views</span>
                  <span className="text-[10px] font-mono text-slate-500">
                    {savedViews?.length || 0}
                  </span>
                </div>

                <div className="mt-1 space-y-0.5 max-h-48 overflow-y-auto">
                  {/* Default / Standard View */}
                  <button
                    type="button"
                    onClick={() => {
                      onSelectView?.("default");
                      setSavedViewsMenuOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors text-left cursor-pointer",
                      !activeViewId || activeViewId === "default"
                        ? "bg-indigo-50 font-bold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300"
                        : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                    )}
                  >
                    <span className="flex items-center gap-2">
                      {(!activeViewId || activeViewId === "default") && (
                        <Check className="h-3 w-3 text-indigo-600 dark:text-indigo-400" />
                      )}
                      <span>Standard View</span>
                    </span>
                    <span className="text-[10px] text-slate-400">Default</span>
                  </button>

                  {/* List of custom views */}
                  {savedViews && savedViews.length > 0 ? (
                    savedViews.map((view) => (
                      <div
                        key={view.id}
                        className={cn(
                          "group flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors",
                          activeViewId === view.id
                            ? "bg-indigo-50 font-bold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300"
                            : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                        )}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            onSelectView?.(view.id);
                            setSavedViewsMenuOpen(false);
                          }}
                          className="flex flex-1 items-center gap-2 truncate text-left cursor-pointer"
                        >
                          {activeViewId === view.id && (
                            <Check className="h-3 w-3 text-indigo-600 dark:text-indigo-400 shrink-0" />
                          )}
                          <span className="truncate">{view.name}</span>
                          {view.scope && view.scope !== "Personal" && (
                            <span className={cn(
                              "text-[9px] px-1 py-0.5 rounded font-mono font-normal uppercase tracking-wider shrink-0",
                              view.scope === "Tenant"
                                ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                                : "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300"
                            )}>
                              {view.scope === "Tenant" ? "Org" : "Role"}
                            </span>
                          )}
                        </button>
                        {onDeleteView && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteView(view.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-opacity cursor-pointer"
                            title="Delete view"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="px-2.5 py-2 text-[11px] text-slate-400 text-center italic">
                      No custom views yet
                    </div>
                  )}
                </div>

                {/* Save Current View Form */}
                {onSaveCurrentView && (
                  <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                    <p className="text-[10px] text-slate-500 font-medium px-1">
                      Save current filters & sorting:
                    </p>
                    <div className="flex items-center justify-between gap-1 text-[10px] px-0.5">
                      <span className="text-slate-400">Audience / Scope:</span>
                      <select
                        value={newViewScope}
                        onChange={(e) => setNewViewScope(e.target.value as any)}
                        className="h-5.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-1 text-[10px] text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                      >
                        <option value="Personal">Personal (Me only)</option>
                        <option value="Role">Role Shared</option>
                        <option value="Tenant">Organization</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={newViewName}
                        onChange={(e) => setNewViewName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && newViewName.trim()) {
                            onSaveCurrentView(newViewName.trim(), newViewScope);
                            setNewViewName("");
                            setSavedViewsMenuOpen(false);
                          }
                        }}
                        placeholder="View name…"
                        className="h-7 w-full rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                      <button
                        type="button"
                        disabled={!newViewName.trim()}
                        onClick={() => {
                          if (newViewName.trim()) {
                            onSaveCurrentView(newViewName.trim(), newViewScope);
                            setNewViewName("");
                            setSavedViewsMenuOpen(false);
                          }
                        }}
                        className="h-7 px-2.5 rounded bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors shrink-0 cursor-pointer"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Refresh Button */}
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200/90 bg-white text-slate-600 shadow-2xs hover:bg-slate-50 active:scale-95 transition-all dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer disabled:opacity-50"
              title="Refresh records"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", isRefreshing && "animate-spin text-blue-600")} />
            </button>
          )}

          {/* More Actions Menu (...) */}
          <div className="relative" ref={actionsMenuRef}>
            <button
              type="button"
              onClick={() => setActionsMenuOpen((prev) => !prev)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200/90 bg-white text-slate-600 shadow-2xs hover:bg-slate-50 transition-colors dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
              title="More actions"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>

            {actionsMenuOpen && (
              <div className="absolute left-0 top-10.5 z-50 w-56 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-slate-800 dark:bg-slate-900 animate-in fade-in zoom-in-95 duration-100 text-xs">
                {onImport && (
                  <button
                    type="button"
                    onClick={() => {
                      onImport();
                      setActionsMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <Upload className="h-3.5 w-3.5 text-slate-400" />
                    <span>Import</span>
                  </button>
                )}
                {onExportCsv && (
                  <button
                    type="button"
                    onClick={() => {
                      onExportCsv();
                      setActionsMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <Download className="h-3.5 w-3.5 text-slate-400" />
                    <span>Export CSV</span>
                  </button>
                )}
                {onPrintList && (
                  <button
                    type="button"
                    onClick={() => {
                      onPrintList();
                      setActionsMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <Printer className="h-3.5 w-3.5 text-slate-400" />
                    <span>Print List / Report</span>
                  </button>
                )}
                {onOpenPermissions && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        onOpenPermissions();
                        setActionsMenuOpen(false);
                      }}
                      className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      <Shield className="h-3.5 w-3.5 text-slate-400" />
                      <span>User Permissions</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onOpenPermissions();
                        setActionsMenuOpen(false);
                      }}
                      className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      <CheckSquare className="h-3.5 w-3.5 text-slate-400" />
                      <span>Role Permissions Manager</span>
                    </button>
                  </>
                )}
                {onCustomize && (
                  <button
                    type="button"
                    onClick={() => {
                      onCustomize();
                      setActionsMenuOpen(false);
                    }}
                    className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-2.5">
                      <Settings className="h-3.5 w-3.5 text-slate-400" />
                      <span>Customize</span>
                    </span>
                    <kbd className="rounded bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 text-[10px] font-mono text-slate-500">
                      Ctrl+J
                    </kbd>
                  </button>
                )}

                {onDensityChange && (
                  <div className="border-t border-slate-100 dark:border-slate-800 pt-1 mt-1">
                    <div className="px-2.5 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                      Row Density
                    </div>
                    {(["compact", "normal", "comfortable"] as const).map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => {
                          onDensityChange(d);
                          setActionsMenuOpen(false);
                        }}
                        className={cn(
                          "flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors text-left cursor-pointer capitalize",
                          density === d
                            ? "bg-indigo-50 font-bold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300"
                            : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                        )}
                      >
                        <span>{d}</span>
                        {density === d && <Check className="h-3 w-3 text-indigo-600 dark:text-indigo-400" />}
                      </button>
                    ))}
                  </div>
                )}
                {onToggleSidebar && (
                  <button
                    type="button"
                    onClick={() => {
                      onToggleSidebar();
                      setActionsMenuOpen(false);
                    }}
                    className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-2.5">
                      <SidebarIcon className="h-3.5 w-3.5 text-slate-400" />
                      <span>Toggle Sidebar</span>
                    </span>
                    <kbd className="rounded bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 text-[10px] font-mono text-slate-500">
                      Ctrl+K
                    </kbd>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {primaryActionLabel && onPrimaryAction && (
          <button
            type="button"
            onClick={onPrimaryAction}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 text-xs font-bold shadow-xs transition-colors cursor-pointer active:scale-97"
          >
            {primaryActionIcon ?? <Plus className="h-3.5 w-3.5" />}
            <span>{primaryActionLabel.replace(/^\+\s*/, "")}</span>
          </button>
        )}
      </div>

      {/* ── UAB INDIA DYNAMIC FILTER & SORT CONTROLS ── */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
        {/* Left Side: Quick Filter Input Chips */}
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
          {quickFilterFields.map((field) => {
            const val = quickFilterValues[field.key] || "";
            return (
              <div key={field.key} className="relative min-w-[120px] max-w-[180px] flex-1">
                <input
                  id={`quick-filter-${field.key}`}
                  name={`quick_filter_${field.key}`}
                  type="text"
                  value={val}
                  onChange={(e) => onQuickFilterChange(field.key, e.target.value)}
                  placeholder={field.placeholder || field.label}
                  className="h-8.5 w-full rounded-lg border border-slate-200/90 bg-white px-2.5 pr-6 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:placeholder-slate-500 transition-colors shadow-2xs"
                />
                {val && (
                  <button
                    type="button"
                    onClick={() => onQuickFilterChange(field.key, "")}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    title="Clear"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Right Side: Filter Popover Button + Sort Menu Button */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Floating Filter Popover Button */}
          <div className="relative" ref={filterPopoverRef}>
            <button
              type="button"
              onClick={() => setFilterPopoverOpen((prev) => !prev)}
              className={cn(
                "inline-flex h-8.5 items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold shadow-2xs transition-colors cursor-pointer",
                activeFiltersCount > 0
                  ? "border-indigo-300 bg-indigo-50/80 text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300"
                  : "border-slate-200/90 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
              )}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span>Filter</span>
              {activeFiltersCount > 0 ? (
                <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-indigo-600 px-1 text-[9px] font-bold text-white">
                  {activeFiltersCount}
                </span>
              ) : null}
              {activeFiltersCount > 0 && (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    onClearQuickFilters?.();
                    onClearAdvancedFilters();
                  }}
                  className="ml-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                  title="Clear all filters"
                >
                  <X className="h-3 w-3" />
                </span>
              )}
            </button>

            {/* Filter Popover Dialog (Matching Image 1) */}
            {filterPopoverOpen && (
              <div className="absolute right-0 top-10.5 z-50 w-[min(380px,94vw)] rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xl dark:border-slate-800 dark:bg-slate-900 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5 mb-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
                    <SlidersHorizontal className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>Filter Records</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFilterPopoverOpen(false)}
                    className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="mb-3">
                  <button
                    type="button"
                    onClick={() => {
                      setFilterPopoverOpen(false);
                      setAstModalOpen(true);
                    }}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 text-xs font-semibold hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors cursor-pointer"
                  >
                    <SlidersHorizontal className="h-3.5 w-3.5" />
                    <span>Open Compound (AND/OR) Builder...</span>
                  </button>
                </div>

                <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-0.5 scrollbar-thin">
                  {draftFilters.length === 0 ? (
                    <div className="py-4 text-center text-xs text-slate-400">
                      No active filters. Click &quot;+ Add a Filter&quot; to build rules.
                    </div>
                  ) : (
                    draftFilters.map((rule, idx) => (
                      <div
                        key={rule.id}
                        className="flex flex-col gap-1.5 rounded-xl border border-slate-100 bg-slate-50/70 p-2.5 dark:border-slate-800 dark:bg-slate-800/40"
                      >
                        <div className="flex items-center gap-1.5">
                          {/* Field Selector */}
                          <select
                            id={`filter-field-${rule.id || idx}`}
                            name={`filter_field_${rule.id || idx}`}
                            value={rule.field}
                            onChange={(e) =>
                              setDraftFilters((prev) =>
                                prev.map((r, i) => (i === idx ? { ...r, field: e.target.value } : r))
                              )
                            }
                            className="h-8 flex-1 min-w-0 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 focus:outline-none"
                          >
                            {filterableColumns.map((col) => (
                              <option key={col.key} value={col.key}>
                                {col.label}
                              </option>
                            ))}
                          </select>

                          {/* Operator Selector */}
                          <select
                            id={`filter-op-${rule.id || idx}`}
                            name={`filter_op_${rule.id || idx}`}
                            value={rule.operator}
                            onChange={(e) =>
                              setDraftFilters((prev) =>
                                prev.map((r, i) => (i === idx ? { ...r, operator: e.target.value } : r))
                              )
                            }
                            className="h-8 w-28 shrink-0 rounded-lg border border-slate-200 bg-white px-1.5 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 focus:outline-none"
                          >
                            {FILTER_OPERATORS.map((op) => (
                              <option key={op.value} value={op.value}>
                                {op.label}
                              </option>
                            ))}
                          </select>

                          {/* Remove rule */}
                          <button
                            type="button"
                            onClick={() =>
                              setDraftFilters((prev) => prev.filter((_, i) => i !== idx))
                            }
                            className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                            title="Remove filter"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        {/* Value Input */}
                        <input
                          id={`draft-filter-val-${rule.id || idx}`}
                          name={`draft_filter_val_${idx}`}
                          type="text"
                          value={rule.value}
                          onChange={(e) =>
                            setDraftFilters((prev) =>
                              prev.map((r, i) => (i === idx ? { ...r, value: e.target.value } : r))
                            )
                          }
                          placeholder="Filter value…"
                          className="h-8 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none"
                        />
                      </div>
                    ))
                  )}
                </div>

                {/* Popover Footer: Add filter, Clear, Apply */}
                <div className="mt-3 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-3">
                  <button
                    type="button"
                    onClick={handleAddDraftRule}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add a Filter</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleClearDraft}
                      className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
                    >
                      Clear Filters
                    </button>
                    <button
                      type="button"
                      onClick={handleApplyDraft}
                      className="rounded-lg bg-indigo-600 hover:bg-indigo-700 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs transition-colors cursor-pointer"
                    >
                      Apply Filters
                    </button>
                  </div>
                </div>
              </div>
            )}

            <UniversalFilterBuilderModal
              isOpen={astModalOpen}
              onClose={() => setAstModalOpen(false)}
              columns={columns.map((c) => ({ key: c.key, label: c.label, type: (c as any).type || "string" }))}
              initialAst={filterAst}
              onApply={(ast) => {
                onApplyFilterAst?.(ast);
              }}
            />
          </div>

          {/* Sort Menu Controller (Matching Image 2) */}
          <div className="relative flex items-center" ref={sortMenuRef}>
            <div className="inline-flex items-center rounded-lg border border-slate-200/90 bg-white shadow-2xs dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
              <button
                type="button"
                onClick={() => setSortMenuOpen((prev) => !prev)}
                className="inline-flex h-8.5 items-center gap-1.5 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors border-r border-slate-200 dark:border-slate-800 cursor-pointer"
                title="Select sort column"
              >
                <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
                <span className="max-w-[130px] truncate">{activeSortCol.label}</span>
                <ChevronDown className="h-3 w-3 text-slate-400" />
              </button>

              {/* Order flip button (Asc / Desc) */}
              <button
                type="button"
                onClick={() => onSortChange(sortKey, sortDirection === "asc" ? "desc" : "asc")}
                className="inline-flex h-8.5 w-8.5 items-center justify-center text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title={sortDirection === "asc" ? "Ascending order. Click to change to Descending" : "Descending order. Click to change to Ascending"}
              >
                {sortDirection === "asc" ? (
                  <ArrowUp className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                ) : (
                  <ArrowDown className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                )}
              </button>
            </div>

            {/* Sort Columns Dropdown (Matching Image 2) */}
            {sortMenuOpen && (
              <div className="absolute right-0 top-10.5 z-50 w-56 rounded-xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-800 dark:bg-slate-900 animate-in fade-in zoom-in-95 duration-100">
                <div className="relative mb-2">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
                  <input
                    id="sort-field-search"
                    name="sort_field_search"
                    type="text"
                    value={sortSearch}
                    onChange={(e) => setSortSearch(e.target.value)}
                    placeholder="Search field…"
                    className="h-7 w-full rounded-md border border-slate-200 bg-slate-50 pl-7 pr-2 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  />
                </div>

                <div className="max-h-60 overflow-y-auto space-y-0.5 scrollbar-thin">
                  {sortableColumns.map((col) => {
                    const isSelected = col.key === sortKey;
                    return (
                      <button
                        key={col.key}
                        type="button"
                        onClick={() => {
                          onSortChange(col.key, sortDirection);
                          setSortMenuOpen(false);
                        }}
                        className={cn(
                          "flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs text-left transition-colors cursor-pointer",
                          isSelected
                            ? "bg-indigo-50 font-bold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300"
                            : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                        )}
                      >
                        <span className="truncate">{col.label}</span>
                        {isSelected && <Check className="h-3 w-3 text-indigo-600 dark:text-indigo-400" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
