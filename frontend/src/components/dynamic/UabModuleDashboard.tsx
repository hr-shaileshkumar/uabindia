"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowRight,
  BarChart3,
  Layers,
  RefreshCw,
  AlertTriangle,
  ExternalLink,
  Search,
  Sparkles,
  Folder,
  CheckCircle2,
  Building2,
  Users,
  Wallet,
  Briefcase,
  Package,
  ShoppingCart,
  Landmark,
  ShieldCheck,
  LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import apiClient from "@/services/apiClient";
import { getApiErrorMessage } from "@/lib/api-errors";
import { useOrgContext } from "@/context/OrgContext";
import { findFrontendModuleMap } from "@/lib/workspace/frontend-module-map";
import { useUiSchema } from "@/context/UiSchemaContext";
import { buildWorkspaceModules, findWorkspaceModuleByKey } from "@/lib/workspace/navigation";
import ModuleIcon from "@/components/ModuleIcon";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ModuleDashboardLink {
  href: string;
  label: string;
  icon: LucideIcon;
  desc?: string;
  badge?: string | number;
  badgeTone?: "green" | "amber" | "red" | "blue" | "purple";
}

export interface ModuleDashboardKpi {
  label: string;
  value?: string | number;
  helper?: string;
  href?: string;
  icon?: LucideIcon;
  tone?: "positive" | "negative" | "warning" | "info" | "neutral";
  trend?: number; // percentage change
}

export interface ModuleDashboardActivity {
  id: string;
  title: string;
  description?: string;
  timestamp?: string;
  href?: string;
  icon?: string;
  tone?: "positive" | "warning" | "negative" | "info" | "neutral";
}

export interface SubmodulePageItem {
  name: string;
  href: string;
  icon?: any;
  desc?: string;
  status?: string;
  display?: string;
  sequence: number;
}

export interface SubmoduleBoxItem {
  key: string;
  label: string;
  purpose?: string;
  sequence: number;
  pages: SubmodulePageItem[];
}

export interface UabModuleDashboardProps {
  moduleKey: string;
  title: string;
  subtitle?: string;
  eyebrow?: string;
  icon?: LucideIcon;
  color?: string; // Tailwind gradient classes
  kpis?: ModuleDashboardKpi[];
  links?: ModuleDashboardLink[];
  linksTitle?: string;
  submodules?: SubmoduleBoxItem[];
  statsEndpoint?: string; // API endpoint that returns live KPI data
  statsMapper?: (data: any) => ModuleDashboardKpi[]; // Map API response → KPIs
  activityEndpoint?: string;
  children?: React.ReactNode;
}

export type ErpModuleDashboardProps = UabModuleDashboardProps;

// ─── KPI Tone Styles ────────────────────────────────────────────────────────

const KPI_TONE: Record<string, { bg: string; text: string; icon: string; border: string }> = {
  positive: {
    bg: "from-emerald-50 to-teal-50",
    text: "text-emerald-700",
    icon: "text-emerald-500",
    border: "border-emerald-100",
  },
  negative: {
    bg: "from-red-50 to-rose-50",
    text: "text-red-700",
    icon: "text-red-500",
    border: "border-red-100",
  },
  warning: {
    bg: "from-amber-50 to-yellow-50",
    text: "text-amber-700",
    icon: "text-amber-500",
    border: "border-amber-100",
  },
  info: {
    bg: "from-blue-50 to-indigo-50",
    text: "text-blue-700",
    icon: "text-blue-500",
    border: "border-blue-100",
  },
  neutral: {
    bg: "from-slate-50 to-gray-50",
    text: "text-slate-700",
    icon: "text-slate-400",
    border: "border-slate-100",
  },
};

// ─── KPI Card ────────────────────────────────────────────────────────────────

function KpiCard({ kpi, loading }: { kpi: ModuleDashboardKpi; loading: boolean }) {
  const tone = kpi.tone ?? "neutral";
  const styles = KPI_TONE[tone] ?? KPI_TONE.neutral;
  const Icon = kpi.icon;

  const content = (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border p-4 bg-gradient-to-br transition-all duration-200",
        styles.bg,
        styles.border,
        kpi.href && "hover:shadow-md hover:-translate-y-0.5 cursor-pointer"
      )}
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 truncate">{kpi.label}</p>
          {loading ? (
            <div className="mt-2 h-8 w-24 rounded-md bg-slate-200 animate-pulse" />
          ) : (
            <p className={cn("mt-1.5 text-2xl font-bold tabular-nums", styles.text)}>
              {kpi.value ?? "—"}
            </p>
          )}
          {kpi.helper && (
            <p className="mt-1 text-xs text-slate-500 truncate">{kpi.helper}</p>
          )}
        </div>
        <div className="ml-3 flex-shrink-0 flex flex-col items-end gap-1">
          {Icon && (
            <div className={cn("rounded-lg p-2 bg-white/60 shadow-sm", styles.icon)}>
              <Icon className="h-4 w-4" />
            </div>
          )}
          {kpi.trend !== undefined && (
            <span
              className={cn(
                "flex items-center gap-0.5 text-xs font-semibold rounded-full px-1.5 py-0.5",
                kpi.trend >= 0
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-red-100 text-red-700"
              )}
            >
              {kpi.trend >= 0 ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {Math.abs(kpi.trend)}%
            </span>
          )}
        </div>
      </div>
    </div>
  );

  if (kpi.href) {
    return <Link href={kpi.href}>{content}</Link>;
  }
  return content;
}

// ─── Quick Link Card ─────────────────────────────────────────────────────────

function QuickLinkCard({ link }: { link: ModuleDashboardLink }) {
  const Icon = link.icon;
  return (
    <Link
      href={link.href}
      className="group relative flex items-center gap-3.5 rounded-xl border border-slate-100 bg-white p-3.5 shadow-sm transition-all duration-200 hover:border-indigo-200 hover:shadow-md hover:-translate-y-0.5"
    >
      <div className="flex-shrink-0 rounded-lg bg-gradient-to-br from-indigo-50 to-purple-50 p-2.5 text-indigo-600 transition-colors group-hover:from-indigo-100 group-hover:to-purple-100">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-800 group-hover:text-indigo-700 transition-colors truncate">
            {link.label}
          </span>
          {link.badge !== undefined && (
            <span
              className={cn(
                "flex-shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                link.badgeTone === "green"
                  ? "bg-emerald-100 text-emerald-700"
                  : link.badgeTone === "amber"
                  ? "bg-amber-100 text-amber-700"
                  : link.badgeTone === "red"
                  ? "bg-red-100 text-red-700"
                  : "bg-indigo-100 text-indigo-700"
              )}
            >
              {link.badge}
            </span>
          )}
        </div>
        {link.desc && (
          <p className="text-xs text-slate-500 mt-0.5 truncate">{link.desc}</p>
        )}
      </div>
      <ArrowUpRight className="h-3.5 w-3.5 flex-shrink-0 text-slate-300 transition-all group-hover:text-indigo-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
    </Link>
  );
}

// ─── Main Dashboard Component ────────────────────────────────────────────────

export function UabModuleDashboard({
  moduleKey,
  title,
  subtitle,
  eyebrow,
  icon: ModuleIcon,
  color = "from-indigo-600 via-purple-600 to-pink-600",
  kpis = [],
  links,
  linksTitle = "Workspaces",
  submodules,
  statsEndpoint,
  statsMapper,
  activityEndpoint,
  children,
}: UabModuleDashboardProps) {
  const { companyId, projectId } = useOrgContext();
  const router = useRouter();

  const [liveKpis, setLiveKpis] = useState<ModuleDashboardKpi[]>(kpis);
  const [loadingStats, setLoadingStats] = useState(!!statsEndpoint);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [activities, setActivities] = useState<ModuleDashboardActivity[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchStats = useCallback(async () => {
    if (!statsEndpoint) return;
    try {
      setLoadingStats(true);
      setStatsError(null);
      const params: Record<string, string> = {};
      if (companyId) params.companyId = companyId;
      if (projectId) params.projectId = projectId;
      const res = await apiClient.get(statsEndpoint, { params });
      if (statsMapper) {
        setLiveKpis(statsMapper(res.data));
      }
    } catch (err) {
      setStatsError(getApiErrorMessage(err, "Could not load dashboard stats."));
    } finally {
      setLoadingStats(false);
    }
  }, [statsEndpoint, statsMapper, companyId, projectId]);

  const fetchActivity = useCallback(async () => {
    if (!activityEndpoint) return;
    try {
      const res = await apiClient.get(activityEndpoint, {
        params: { limit: 8, ...(companyId ? { companyId } : {}), ...(projectId ? { projectId } : {}) },
      });
      const raw = res.data;
      const list = Array.isArray(raw) ? raw : Array.isArray(raw?.items) ? raw.items : Array.isArray(raw?.data) ? raw.data : [];
      setActivities(list);
    } catch {
      // Activity feed is non-critical
    }
  }, [activityEndpoint, companyId, projectId]);

  useEffect(() => {
    void fetchStats();
    void fetchActivity();
  }, [fetchStats, fetchActivity, refreshKey]);

  // Refresh when org context changes
  useEffect(() => {
    const handler = () => setRefreshKey((k) => k + 1);
    window.addEventListener("erp:org-context-changed", handler);
    window.addEventListener("erp:tenant-changed", handler);
    return () => {
      window.removeEventListener("erp:org-context-changed", handler);
      window.removeEventListener("erp:tenant-changed", handler);
    };
  }, []);

  const displayKpis = statsEndpoint ? liveKpis : kpis;

  const frontendDef = useMemo(() => findFrontendModuleMap(moduleKey), [moduleKey]);
  const { navigation, enabledModules } = useUiSchema();
  const workspaceModules = useMemo(
    () => buildWorkspaceModules(navigation.modules, enabledModules),
    [navigation.modules, enabledModules]
  );
  const currentWorkspaceMod = useMemo(
    () => findWorkspaceModuleByKey(workspaceModules, moduleKey),
    [workspaceModules, moduleKey]
  );

  const resolvedSubmodules = useMemo<SubmoduleBoxItem[]>(() => {
    if (submodules && submodules.length > 0) {
      return submodules;
    }

    if (frontendDef?.submodules && frontendDef.submodules.length > 0) {
      return frontendDef.submodules.map((sub, sIdx) => ({
        key: sub.key,
        label: sub.label,
        purpose: sub.purpose,
        sequence: sIdx + 1,
        pages: sub.pages.map((p, pIdx) => ({
          name: p.label,
          href: p.route,
          icon: null,
          desc: p.purpose,
          status: p.status,
          display: p.display,
          sequence: pIdx + 1,
        })),
      }));
    }

    if (currentWorkspaceMod?.groups && currentWorkspaceMod.groups.length > 0) {
      return currentWorkspaceMod.groups.map((grp, gIdx) => ({
        key: grp.label.toLowerCase().replace(/[\s&/]+/g, "-"),
        label: grp.label,
        purpose: `${grp.label} operational workspaces and master registers.`,
        sequence: gIdx + 1,
        pages: grp.items.map((it, iIdx) => ({
          name: it.name,
          href: it.path,
          icon: it.icon,
          desc: `Open ${it.name} record management.`,
          status: "implemented",
          sequence: iIdx + 1,
        })),
      }));
    }

    if (links && links.length > 0) {
      return [
        {
          key: "workspaces",
          label: linksTitle || "Workspaces",
          purpose: "Primary workspace entries and operational pages.",
          sequence: 1,
          pages: links.map((l, lIdx) => ({
            name: l.label,
            href: l.href,
            icon: l.icon,
            desc: l.desc,
            status: "implemented",
            sequence: lIdx + 1,
          })),
        },
      ];
    }

    return [];
  }, [submodules, frontendDef, currentWorkspaceMod, links, linksTitle]);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubmoduleKey, setSelectedSubmoduleKey] = useState<string | null>(null);

  const totalPagesCount = useMemo(
    () => resolvedSubmodules.reduce((acc, sub) => acc + sub.pages.length, 0),
    [resolvedSubmodules]
  );

  const filteredSubmodules = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return resolvedSubmodules
      .filter((sub) => {
        if (!selectedSubmoduleKey) return true;
        return sub.key === selectedSubmoduleKey;
      })
      .map((sub) => {
        if (!query) return sub;

        const matchingPages = sub.pages.filter(
          (p) =>
            p.name.toLowerCase().includes(query) ||
            (p.desc && p.desc.toLowerCase().includes(query)) ||
            sub.label.toLowerCase().includes(query)
        );

        return {
          ...sub,
          pages: matchingPages,
        };
      })
      .filter((sub) => sub.pages.length > 0);
  }, [resolvedSubmodules, searchQuery, selectedSubmoduleKey]);

  return (
    <div className="min-h-screen bg-slate-50/60 dark:bg-slate-950">
      {/* ── Executive ERP Header ── */}
      <div className="border-b border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto max-w-[1720px] 2xl:max-w-full px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="min-w-0">
              {eyebrow && (
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
                  {eyebrow}
                </p>
              )}
              <div className="flex items-center gap-3">
                {ModuleIcon && (
                  <div className="flex-shrink-0 rounded-xl bg-slate-100 dark:bg-slate-800 p-2.5 text-slate-700 dark:text-slate-200 border border-slate-200/70 dark:border-slate-700">
                    <ModuleIcon className="h-6 w-6" />
                  </div>
                )}
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                    {title}
                  </h1>
                  {subtitle && (
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                      {subtitle}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={() => setRefreshKey((k) => k + 1)}
              className="self-start sm:self-auto flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 transition-colors shadow-2xs"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", loadingStats && "animate-spin")} />
              Refresh
            </button>
          </div>

          {/* ── KPI Row (Clean & Compact) ── */}
          {displayKpis.length > 0 && (
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {displayKpis.map((kpi, i) => (
                <KpiCard key={i} kpi={kpi} loading={loadingStats} />
              ))}
            </div>
          )}

          {statsError && (
            <div className="mt-4 flex items-center gap-2 rounded-lg bg-red-50 text-red-700 border border-red-200 px-3 py-2 text-xs dark:bg-red-950/30 dark:text-red-300 dark:border-red-900">
              <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
              {statsError}
            </div>
          )}
        </div>
      </div>

      {/* ── Content Body: Clean Box-Wise Submodule Directory ── */}
      <div className="mx-auto max-w-[1720px] 2xl:max-w-full px-4 sm:px-6 lg:px-8 py-6 space-y-5">
        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search pages..."
              className="w-full rounded-lg border border-slate-200 bg-white py-1.5 pl-8 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs dark:border-slate-800 dark:bg-slate-900 dark:text-white"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              type="button"
              onClick={() => setSelectedSubmoduleKey(null)}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-semibold transition shrink-0",
                selectedSubmoduleKey === null
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-2xs"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800"
              )}
            >
              All
            </button>
            {resolvedSubmodules.map((sub) => {
              const isSelected = selectedSubmoduleKey === sub.key;
              return (
                <button
                  key={sub.key}
                  type="button"
                  onClick={() => setSelectedSubmoduleKey(isSelected ? null : sub.key)}
                  className={cn(
                    "rounded-md px-2.5 py-1 text-xs font-semibold transition shrink-0",
                    isSelected
                      ? "bg-blue-600 text-white shadow-2xs"
                      : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800"
                  )}
                >
                  {sub.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Box-Wise Submodule Cards Grid ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredSubmodules.map((submodule) => (
            <div
              key={submodule.key}
              className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-2xs transition-all hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900"
            >
              {/* Submodule Box Header */}
              <div className="flex items-center gap-2.5 pb-2.5 border-b border-slate-100 dark:border-slate-800">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-slate-100 font-mono text-[11px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  {submodule.sequence < 10 ? `0${submodule.sequence}` : submodule.sequence}
                </span>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 truncate">
                  {submodule.label}
                </h3>
              </div>

              {/* Submodule Pages in Clean Sequence */}
              <div className="mt-2.5 space-y-0.5">
                {submodule.pages.map((page) => (
                  <Link
                    key={page.href}
                    href={page.href}
                    className="group/page flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-xs text-slate-600 hover:bg-slate-50 hover:text-blue-600 dark:text-slate-300 dark:hover:bg-slate-800/60 dark:hover:text-blue-400 transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="flex h-4 w-4 shrink-0 items-center justify-center font-mono text-[10px] text-slate-400 group-hover/page:text-blue-600">
                        {page.sequence}
                      </span>
                      <span className="truncate font-medium">{page.name}</span>
                    </div>
                    <ArrowRight className="h-3 w-3 shrink-0 text-slate-300 opacity-0 group-hover/page:opacity-100 group-hover/page:translate-x-0.5 transition-all text-blue-600" />
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* ── Supplementary Content / Activity Feed ── */}
        {(activities.length > 0 || children) && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
            {children && (
              <div className="lg:col-span-2 rounded-xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                {children}
              </div>
            )}

            {activities.length > 0 && (
              <div className={cn("rounded-xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900", !children && "lg:col-span-3")}>
                <h3 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                  <BarChart3 className="h-3.5 w-3.5 text-indigo-500" />
                  Recent Activity
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {activities.slice(0, 6).map((act) => (
                    <div key={act.id} className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-50 dark:bg-slate-850">
                      <div
                        className={cn(
                          "mt-0.5 h-2 w-2 flex-shrink-0 rounded-full",
                          act.tone === "positive"
                            ? "bg-emerald-400"
                            : act.tone === "warning"
                            ? "bg-amber-400"
                            : act.tone === "negative"
                            ? "bg-red-400"
                            : "bg-indigo-400"
                        )}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">{act.title}</p>
                        {act.description && (
                          <p className="text-xs text-slate-500 truncate">{act.description}</p>
                        )}
                        {act.timestamp && (
                          <p className="text-[10px] text-slate-400 mt-0.5">{act.timestamp}</p>
                        )}
                      </div>
                      {act.href && (
                        <Link href={act.href} className="flex-shrink-0 text-indigo-400 hover:text-indigo-600">
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export const ErpModuleDashboard = UabModuleDashboard;
