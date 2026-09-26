"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  BarChart3,
  Layers,
  RefreshCw,
  AlertTriangle,
  ExternalLink,
  LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import apiClient from "@/services/apiClient";
import { getApiErrorMessage } from "@/lib/api-errors";
import { useOrgContext } from "@/context/OrgContext";

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

export interface ErpModuleDashboardProps {
  moduleKey: string;
  title: string;
  subtitle?: string;
  eyebrow?: string;
  icon?: LucideIcon;
  color?: string; // Tailwind gradient classes
  kpis?: ModuleDashboardKpi[];
  links: ModuleDashboardLink[];
  linksTitle?: string;
  statsEndpoint?: string; // API endpoint that returns live KPI data
  statsMapper?: (data: any) => ModuleDashboardKpi[]; // Map API response → KPIs
  activityEndpoint?: string;
  children?: React.ReactNode;
}

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

export function ErpModuleDashboard({
  moduleKey,
  title,
  subtitle,
  eyebrow,
  icon: ModuleIcon,
  color = "from-indigo-600 via-purple-600 to-pink-600",
  kpis = [],
  links,
  linksTitle = "Workspaces",
  statsEndpoint,
  statsMapper,
  activityEndpoint,
  children,
}: ErpModuleDashboardProps) {
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

  return (
    <div className="min-h-screen bg-slate-50/50">
      {/* ── Hero Header ── */}
      <div className={cn("relative overflow-hidden bg-gradient-to-br", color)}>
        {/* Decorative background shapes */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-24 -right-24 h-80 w-80 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute -bottom-12 -left-12 h-64 w-64 rounded-full bg-black/10 blur-3xl" />
          <div className="absolute top-1/2 right-1/4 h-40 w-40 rounded-full bg-white/5 blur-2xl" />
        </div>

        <div className="relative mx-auto max-w-[1720px] 2xl:max-w-full px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-start justify-between gap-6">
            <div className="min-w-0">
              {eyebrow && (
                <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-white/60">
                  {eyebrow}
                </p>
              )}
              <div className="flex items-center gap-3">
                {ModuleIcon && (
                  <div className="flex-shrink-0 rounded-xl bg-white/15 backdrop-blur-sm p-2.5 shadow-lg ring-1 ring-white/20">
                    <ModuleIcon className="h-6 w-6 text-white" />
                  </div>
                )}
                <div>
                  <h1 className="text-2xl font-bold text-white leading-tight">{title}</h1>
                  {subtitle && (
                    <p className="mt-0.5 text-sm text-white/70 max-w-2xl">{subtitle}</p>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={() => setRefreshKey((k) => k + 1)}
              className="flex-shrink-0 flex items-center gap-1.5 rounded-lg bg-white/15 hover:bg-white/25 px-3 py-2 text-xs font-semibold text-white transition-colors"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", loadingStats && "animate-spin")} />
              Refresh
            </button>
          </div>

          {/* ── KPI Row ── */}
          {displayKpis.length > 0 && (
            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {displayKpis.map((kpi, i) => (
                <KpiCard key={i} kpi={kpi} loading={loadingStats} />
              ))}
            </div>
          )}

          {statsError && (
            <div className="mt-4 flex items-center gap-2 rounded-lg bg-red-500/20 px-3 py-2 text-xs text-white">
              <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
              {statsError}
            </div>
          )}
        </div>
      </div>

      {/* ── Content Body ── */}
      <div className="mx-auto max-w-[1720px] 2xl:max-w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* ── Quick Links Grid ── */}
          <div className="lg:col-span-2">
            {linksTitle && (
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                  <Layers className="h-4 w-4 text-indigo-500" />
                  {linksTitle}
                </h2>
                <span className="text-xs text-slate-400">{links.length} modules</span>
              </div>
            )}
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {links.map((link) => (
                <QuickLinkCard key={link.href} link={link} />
              ))}
            </div>
          </div>

          {/* ── Right Panel: Activity + Custom Content ── */}
          <div className="space-y-4">
            {/* Custom child content (stats, charts, etc.) */}
            {children && (
              <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
                {children}
              </div>
            )}

            {/* Recent Activity Feed */}
            {activities.length > 0 && (
              <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
                <h3 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                  <BarChart3 className="h-3.5 w-3.5 text-indigo-400" />
                  Recent Activity
                </h3>
                <div className="space-y-2.5">
                  {activities.slice(0, 6).map((act) => (
                    <div key={act.id} className="flex items-start gap-2.5">
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
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-700 truncate">{act.title}</p>
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

            {/* Empty activity state */}
            {activityEndpoint && activities.length === 0 && !loadingStats && (
              <div className="rounded-xl border border-dashed border-slate-200 bg-white/50 p-6 text-center">
                <BarChart3 className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                <p className="text-xs text-slate-400">No recent activity</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
