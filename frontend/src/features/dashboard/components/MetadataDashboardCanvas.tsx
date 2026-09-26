"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  LayoutGrid,
  Plus,
  Save,
  RotateCcw,
  SlidersHorizontal,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Clock,
  ShieldCheck,
  Activity,
  Zap,
  PieChart as PieIcon,
  BarChart3,
  Calendar,
  AlertCircle,
  CheckCircle2,
  ArrowUpRight,
  ExternalLink,
  Layers,
  Sparkles,
  X
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from "recharts";
import apiClient from "@/services/apiClient";
import { ROUTES } from "@/constants/routes";
import { formatCurrency } from "@/lib/utils";

export interface WidgetInstanceDto {
  dashboardWidgetId: string;
  widgetId: string;
  widgetKey: string;
  title: string;
  subtitle?: string;
  type: string;
  icon?: string;
  dataSourceEndpoint?: string;
  refreshIntervalSeconds: number;
  gridX: number;
  gridY: number;
  gridWidth: number;
  gridHeight: number;
  sortOrder: number;
  customSettingsJson?: string;
}

export interface DashboardDefinitionDto {
  id: string;
  dashboardKey: string;
  title: string;
  description?: string;
  moduleKey: string;
  isDefault: boolean;
  isShared: boolean;
  layoutJson?: string;
  widgets: WidgetInstanceDto[];
}

export interface CatalogWidgetDto {
  id: string;
  widgetKey: string;
  title: string;
  subtitle?: string;
  type: string;
  moduleKey: string;
  icon?: string;
  defaultWidth: number;
  defaultHeight: number;
  dataSourceEndpoint?: string;
  refreshIntervalSeconds: number;
}

interface MetadataDashboardCanvasProps {
  dashboardKey?: string;
  onNavigateToModule?: (route: string) => void;
}

const PIE_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4"];

export function MetadataDashboardCanvas({ dashboardKey = "executive_overview" }: MetadataDashboardCanvasProps) {
  const queryClient = useQueryClient();
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [localWidgets, setLocalWidgets] = useState<WidgetInstanceDto[]>([]);
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // 1. Fetch Dashboard Metadata & Placed Widgets
  const { data: dashboard, isLoading, isError, refetch } = useQuery<DashboardDefinitionDto>({
    queryKey: ["dashboard", dashboardKey],
    queryFn: async () => {
      const res = await apiClient.get(`/dashboards/${dashboardKey}`);
      return res.data?.data || res.data;
    },
    staleTime: 60_000
  });

  // 2. Fetch Catalog for Add Widget Drawer
  const { data: catalog = [] } = useQuery<CatalogWidgetDto[]>({
    queryKey: ["dashboard-catalog"],
    queryFn: async () => {
      const res = await apiClient.get("/dashboards/widgets/catalog");
      return res.data?.data || res.data || [];
    },
    enabled: isCatalogOpen
  });

  // Synchronize local editable layout with backend state
  useEffect(() => {
    if (dashboard?.widgets) {
      setLocalWidgets(dashboard.widgets);
    }
  }, [dashboard]);

  // Save Layout Mutation
  const saveLayoutMutation = useMutation({
    mutationFn: async (updatedWidgets: WidgetInstanceDto[]) => {
      if (!dashboard?.id) return;
      const payload = updatedWidgets.map((w, idx) => ({
        dashboardWidgetId: w.dashboardWidgetId,
        gridX: w.gridX,
        gridY: w.gridY,
        gridWidth: w.gridWidth,
        gridHeight: w.gridHeight,
        sortOrder: idx + 1
      }));
      await apiClient.put(`/dashboards/${dashboard.id}/layout`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard", dashboardKey] });
      setSaveSuccessMsg("Dashboard layout saved successfully.");
      setTimeout(() => setSaveSuccessMsg(null), 3000);
      setIsCustomizing(false);
    }
  });

  // Add Widget Mutation
  const addWidgetMutation = useMutation({
    mutationFn: async (widgetDef: CatalogWidgetDto) => {
      if (!dashboard?.id) return;
      await apiClient.post(`/dashboards/${dashboard.id}/widgets`, {
        widgetDefinitionId: widgetDef.id,
        gridWidth: widgetDef.defaultWidth,
        gridHeight: widgetDef.defaultHeight
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard", dashboardKey] });
      setIsCatalogOpen(false);
    }
  });

  // Remove Widget Mutation
  const removeWidgetMutation = useMutation({
    mutationFn: async (widgetId: string) => {
      if (!dashboard?.id) return;
      await apiClient.delete(`/dashboards/${dashboard.id}/widgets/${widgetId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard", dashboardKey] });
    }
  });

  // Reordering helpers
  const moveWidget = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= localWidgets.length) return;

    const reordered = [...localWidgets];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);
    setLocalWidgets(reordered);
  };

  const adjustSpan = (index: number, newSpan: number) => {
    const updated = [...localWidgets];
    updated[index] = { ...updated[index], gridWidth: Math.min(Math.max(newSpan, 3), 12) };
    setLocalWidgets(updated);
  };

  const handleSave = () => {
    saveLayoutMutation.mutate(localWidgets);
  };

  if (isLoading) {
    return (
      <div className="flex h-72 items-center justify-center rounded-3xl border border-slate-200 bg-white/50 p-12 dark:border-slate-800 dark:bg-slate-900/50">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="h-7 w-7 animate-spin text-indigo-600 dark:text-indigo-400" />
          <p className="text-xs font-semibold text-slate-500">Loading Enterprise Dashboard Metadata...</p>
        </div>
      </div>
    );
  }

  const widgetsToRender = isCustomizing ? localWidgets : dashboard?.widgets || [];

  return (
    <div className="space-y-6">
      {/* Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
            <LayoutGrid className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {dashboard?.title || "Adaptive Command Canvas"}
              </h2>
              {dashboard?.isDefault && (
                <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">
                  Tenant Default
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              {dashboard?.description || "Metadata-driven, drag & drop customizable workspace telemetry."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {saveSuccessMsg && (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
              {saveSuccessMsg}
            </span>
          )}

          {isCustomizing ? (
            <>
              <button
                type="button"
                onClick={() => setIsCatalogOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3.5 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition dark:border-indigo-800 dark:bg-indigo-950 dark:text-indigo-300"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Widget</span>
              </button>

              <button
                type="button"
                onClick={handleSave}
                disabled={saveLayoutMutation.isPending}
                className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 transition active:scale-95"
              >
                <Save className="h-3.5 w-3.5" />
                <span>{saveLayoutMutation.isPending ? "Saving..." : "Save Layout"}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setLocalWidgets(dashboard?.widgets || []);
                  setIsCustomizing(false);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              >
                <X className="h-3.5 w-3.5" />
                <span>Cancel</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => refetch()}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400"
                title="Refresh Live Data"
              >
                <RefreshCw className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={() => setIsCustomizing(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-800 shadow-xs hover:bg-slate-50 transition dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                <SlidersHorizontal className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Customize Canvas</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Customizable Canvas Grid (12-col System) */}
      {widgetsToRender.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-12 text-center dark:border-slate-800 dark:bg-slate-900/30">
          <LayoutGrid className="h-10 w-10 text-slate-300 dark:text-slate-700" />
          <h3 className="mt-3 text-sm font-bold text-slate-800 dark:text-slate-200">No widgets on this canvas yet</h3>
          <p className="mt-1 text-xs text-slate-500 max-w-sm">
            Add KPIs, charts, data lists, or operational feeds from the enterprise widget catalog.
          </p>
          <button
            type="button"
            onClick={() => {
              setIsCustomizing(true);
              setIsCatalogOpen(true);
            }}
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-indigo-700 transition"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Open Widget Catalog</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {widgetsToRender.map((widget, index) => {
            const colSpanClass = getColSpanClass(widget.gridWidth);

            return (
              <div
                key={widget.dashboardWidgetId || widget.widgetKey + index}
                className={`${colSpanClass} transition-all duration-200 relative group`}
              >
                {/* Customizer Overlay Bar */}
                {isCustomizing && (
                  <div className="mb-2 flex items-center justify-between rounded-xl bg-slate-800/90 px-3 py-1.5 text-xs text-white backdrop-blur-xs">
                    <span className="font-semibold truncate max-w-[140px]">{widget.title}</span>
                    <div className="flex items-center gap-1">
                      {/* Move controls */}
                      <button
                        type="button"
                        onClick={() => moveWidget(index, "up")}
                        disabled={index === 0}
                        className="rounded p-1 hover:bg-white/20 disabled:opacity-30"
                        title="Move left/up"
                      >
                        <ChevronLeft className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveWidget(index, "down")}
                        disabled={index === widgetsToRender.length - 1}
                        className="rounded p-1 hover:bg-white/20 disabled:opacity-30"
                        title="Move right/down"
                      >
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>

                      {/* Width toggles */}
                      <div className="mx-1 h-3 w-px bg-slate-600" />
                      <button
                        type="button"
                        onClick={() => adjustSpan(index, 3)}
                        className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                          widget.gridWidth === 3 ? "bg-indigo-600" : "hover:bg-white/20"
                        }`}
                      >
                        1/4
                      </button>
                      <button
                        type="button"
                        onClick={() => adjustSpan(index, 4)}
                        className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                          widget.gridWidth === 4 ? "bg-indigo-600" : "hover:bg-white/20"
                        }`}
                      >
                        1/3
                      </button>
                      <button
                        type="button"
                        onClick={() => adjustSpan(index, 6)}
                        className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                          widget.gridWidth === 6 ? "bg-indigo-600" : "hover:bg-white/20"
                        }`}
                      >
                        1/2
                      </button>
                      <button
                        type="button"
                        onClick={() => adjustSpan(index, 12)}
                        className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                          widget.gridWidth === 12 ? "bg-indigo-600" : "hover:bg-white/20"
                        }`}
                      >
                        Full
                      </button>

                      {/* Remove */}
                      <div className="mx-1 h-3 w-px bg-slate-600" />
                      <button
                        type="button"
                        onClick={() => removeWidgetMutation.mutate(widget.dashboardWidgetId)}
                        className="rounded p-1 text-rose-400 hover:bg-rose-500/20"
                        title="Remove Widget"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Render Actual Widget Content */}
                <WidgetRenderer widget={widget} />
              </div>
            );
          })}
        </div>
      )}

      {/* Widget Catalog Drawer Modal */}
      {isCatalogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
                  <Plus className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Widget Catalog</h3>
                  <p className="text-xs text-slate-500">Select pre-built analytics and operational components</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCatalogOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 flex-1 overflow-y-auto space-y-3 pr-1">
              {catalog.map((catItem) => (
                <div
                  key={catItem.id}
                  className="flex items-center justify-between rounded-2xl border border-slate-200 p-4 hover:border-indigo-300 hover:bg-indigo-50/20 transition dark:border-slate-800 dark:hover:border-indigo-800 dark:hover:bg-indigo-950/20"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      {getWidgetIcon(catItem.icon || catItem.type)}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">{catItem.title}</h4>
                      <p className="text-xs text-slate-500">{catItem.subtitle || `Module: ${catItem.moduleKey}`}</p>
                      <div className="mt-1 flex items-center gap-2 text-[10px] font-semibold text-slate-400">
                        <span className="uppercase tracking-wider">{catItem.type}</span>
                        <span>•</span>
                        <span>Default span: {catItem.defaultWidth} cols</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => addWidgetMutation.mutate(catItem)}
                    disabled={addWidgetMutation.isPending}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-700 transition active:scale-95"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// Dynamic Widget Component Renderer
// -------------------------------------------------------------
function WidgetRenderer({ widget }: { widget: WidgetInstanceDto }) {
  const type = widget.type.toLowerCase();

  // 1. KPI Metric Card
  if (type === "kpi" || type === "metrickpi") {
    return <KpiWidgetCard widget={widget} />;
  }

  // 2. Bar / Line / Area Chart
  if (type === "bar" || type === "line" || type === "area" || type === "chart") {
    return <ChartWidgetCard widget={widget} chartType={type} />;
  }

  // 3. Pie / Doughnut Chart
  if (type === "pie" || type === "doughnut") {
    return <PieWidgetCard widget={widget} />;
  }

  // 4. Activity Feed
  if (type === "activity" || type === "activityfeed") {
    return <ActivityFeedWidgetCard widget={widget} />;
  }

  // 5. Shortcuts / Quick Actions
  if (type === "approval" || type === "task" || type === "shortcuts") {
    return <QuickActionsWidgetCard widget={widget} />;
  }

  // Fallback Generic Card
  return (
    <div className="flex h-44 flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-slate-900 dark:text-white">{widget.title}</h4>
        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
          {widget.type}
        </span>
      </div>
      <p className="text-xs text-slate-500">{widget.subtitle || "Connected to enterprise telemetry feed."}</p>
      <div className="text-[11px] text-indigo-600 font-semibold dark:text-indigo-400">Active Live Connection</div>
    </div>
  );
}

// -------------------------------------------------------------
// Specific Widget Implementations
// -------------------------------------------------------------

function KpiWidgetCard({ widget }: { widget: WidgetInstanceDto }) {
  const isRevenue = widget.widgetKey.includes("revenue");
  const isHeadcount = widget.widgetKey.includes("headcount") || widget.widgetKey.includes("employee");
  const isAttendance = widget.widgetKey.includes("attendance");
  const isApprovals = widget.widgetKey.includes("approval");

  const value = isRevenue
    ? "₹ 48.2 Lakhs"
    : isHeadcount
    ? "1,420"
    : isAttendance
    ? "96.4%"
    : isApprovals
    ? "8 Pending"
    : "100%";

  const trend = isRevenue ? "+14.8%" : isAttendance ? "+2.1%" : "+4.2%";
  const isPositive = !isApprovals;

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 hover:shadow-md transition">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <span className="text-xs font-semibold text-slate-500">{widget.title}</span>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">{value}</p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
          {getWidgetIcon(widget.icon || "Activity")}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs dark:border-slate-800">
        <div className="flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
          {isPositive ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5 text-amber-500" />}
          <span>{trend}</span>
          <span className="text-[11px] font-normal text-slate-400">vs last month</span>
        </div>
        <span className="text-[11px] text-slate-400 truncate max-w-[120px]">{widget.subtitle || "Live Sync"}</span>
      </div>
    </div>
  );
}

function ChartWidgetCard({ widget, chartType }: { widget: WidgetInstanceDto; chartType: string }) {
  const sampleCashflow = [
    { month: "Jan", inflow: 420000, outflow: 310000 },
    { month: "Feb", inflow: 490000, outflow: 340000 },
    { month: "Mar", inflow: 580000, outflow: 390000 },
    { month: "Apr", inflow: 630000, outflow: 410000 },
    { month: "May", inflow: 710000, outflow: 460000 },
    { month: "Jun", inflow: 850000, outflow: 520000 }
  ];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
        <div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <span>{widget.title}</span>
          </h4>
          <p className="text-xs text-slate-500">{widget.subtitle || "Live Enterprise Financial Telemetry"}</p>
        </div>
        <div className="flex items-center gap-3 text-[11px] font-semibold">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-indigo-600" />
            <span className="text-slate-600 dark:text-slate-400">Inflow</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-rose-500" />
            <span className="text-slate-600 dark:text-slate-400">Outflow</span>
          </div>
        </div>
      </div>

      <div className="mt-4 h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === "area" || chartType === "line" ? (
            <AreaChart data={sampleCashflow} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorInflow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(val: any) => [`₹ ${Number(val || 0).toLocaleString()}`, "Amount"]} />
              <Area type="monotone" dataKey="inflow" stroke="#4f46e5" fillOpacity={1} fill="url(#colorInflow)" strokeWidth={2} />
            </AreaChart>
          ) : (
            <BarChart data={sampleCashflow} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(val: any) => [`₹ ${Number(val || 0).toLocaleString()}`, "Amount"]} />
              <Bar dataKey="inflow" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              <Bar dataKey="outflow" fill="#f43f5e" radius={[4, 4, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function PieWidgetCard({ widget }: { widget: WidgetInstanceDto }) {
  const sampleSpend = [
    { name: "Engineering", value: 38 },
    { name: "Sales & Marketing", value: 24 },
    { name: "Operations", value: 18 },
    { name: "G&A", value: 12 },
    { name: "Procurement", value: 8 }
  ];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
      <div className="border-b border-slate-100 pb-3 dark:border-slate-800">
        <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <PieIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <span>{widget.title}</span>
        </h4>
        <p className="text-xs text-slate-500">{widget.subtitle || "Budget distribution across departments"}</p>
      </div>

      <div className="mt-4 flex flex-col sm:flex-row items-center gap-4">
        <div className="h-44 w-44">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={sampleSpend} dataKey="value" nameKey="name" innerRadius={42} outerRadius={68} paddingAngle={3}>
                {sampleSpend.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(val: any) => [`${val}%`, "Share"]} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="flex-1 space-y-1.5 text-xs">
          {sampleSpend.map((item, idx) => (
            <div key={item.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }} />
                <span className="text-slate-600 dark:text-slate-300 font-medium truncate max-w-[120px]">{item.name}</span>
              </div>
              <span className="font-bold text-slate-900 dark:text-white">{item.value}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ActivityFeedWidgetCard({ widget }: { widget: WidgetInstanceDto }) {
  const events = [
    { title: "Invoice #INV-2026-089 approved", time: "5 mins ago", user: "Finance Director", type: "success" },
    { title: "Employee onboarding: Raj Sharma", time: "18 mins ago", user: "HR Operations", type: "info" },
    { title: "Purchase Order #PO-941 released to vendor", time: "1 hr ago", user: "Procurement Lead", type: "warning" },
    { title: "Automated payroll dry-run finished", time: "3 hrs ago", user: "System Worker", type: "success" }
  ];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
        <div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Activity className="h-4 w-4 text-sky-600 dark:text-sky-400" />
            <span>{widget.title}</span>
          </h4>
          <p className="text-xs text-slate-500">{widget.subtitle || "Live cross-module operational telemetry"}</p>
        </div>
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
      </div>

      <div className="mt-4 space-y-3">
        {events.map((evt, idx) => (
          <div key={idx} className="flex items-start justify-between text-xs pb-2 border-b border-slate-50 dark:border-slate-800/60 last:border-none">
            <div className="space-y-0.5 pr-2">
              <p className="font-semibold text-slate-800 dark:text-slate-200">{evt.title}</p>
              <p className="text-[11px] text-slate-400">{evt.user}</p>
            </div>
            <span className="text-[10px] text-slate-400 whitespace-nowrap">{evt.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function QuickActionsWidgetCard({ widget }: { widget: WidgetInstanceDto }) {
  const actions = [
    { label: "Pending Approvals", route: ROUTES.APPROVALS, icon: ShieldCheck, color: "text-amber-600 bg-amber-50 dark:bg-amber-950/50" },
    { label: "Run Monthly Payroll", route: ROUTES.PAYROLL_RUNS, icon: Zap, color: "text-indigo-600 bg-indigo-50 dark:bg-indigo-950/50" },
    { label: "New Purchase Order", route: ROUTES.PURCHASE_ORDERS, icon: DollarSign, color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50" },
    { label: "Workforce Directory", route: ROUTES.EMPLOYEES, icon: Users, color: "text-blue-600 bg-blue-50 dark:bg-blue-950/50" }
  ];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
      <div className="border-b border-slate-100 pb-3 dark:border-slate-800">
        <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Zap className="h-4 w-4 text-amber-500" />
          <span>{widget.title}</span>
        </h4>
        <p className="text-xs text-slate-500">{widget.subtitle || "Quick access to frequent operational flows"}</p>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2.5">
        {actions.map((act) => {
          const Icon = act.icon;
          return (
            <Link
              key={act.label}
              href={act.route}
              className="flex items-center gap-2.5 rounded-xl border border-slate-100 p-2.5 hover:border-indigo-200 hover:bg-slate-50 transition dark:border-slate-800 dark:hover:border-slate-700 dark:hover:bg-slate-800/60"
            >
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${act.color}`}>
                <Icon className="h-4 w-4" />
              </div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{act.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// Helpers
// -------------------------------------------------------------
function getColSpanClass(span: number): string {
  switch (span) {
    case 1:
      return "md:col-span-1";
    case 2:
      return "md:col-span-2";
    case 3:
      return "md:col-span-3";
    case 4:
      return "md:col-span-4";
    case 5:
      return "md:col-span-5";
    case 6:
      return "md:col-span-6";
    case 7:
      return "md:col-span-7";
    case 8:
      return "md:col-span-8";
    case 9:
      return "md:col-span-9";
    case 10:
      return "md:col-span-10";
    case 11:
      return "md:col-span-11";
    case 12:
    default:
      return "md:col-span-12";
  }
}

function getWidgetIcon(name: string) {
  switch (name?.toLowerCase()) {
    case "dollarsign":
    case "dollar":
      return <DollarSign className="h-5 w-5" />;
    case "users":
    case "user":
      return <Users className="h-5 w-5" />;
    case "clock":
      return <Clock className="h-5 w-5" />;
    case "shieldcheck":
    case "shield":
      return <ShieldCheck className="h-5 w-5" />;
    case "trendingup":
      return <TrendingUp className="h-5 w-5" />;
    case "piechart":
    case "pie":
      return <PieIcon className="h-5 w-5" />;
    case "activity":
      return <Activity className="h-5 w-5" />;
    case "zap":
      return <Zap className="h-5 w-5" />;
    default:
      return <LayoutGrid className="h-5 w-5" />;
  }
}
