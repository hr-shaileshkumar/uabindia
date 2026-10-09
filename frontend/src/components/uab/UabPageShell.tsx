"use client";

/**
 * UabPageShell — UAB India Enterprise Canonical Page Shell
 *
 * Built on StandardPageLayout, SideDrawer, and the canonical workspace list kit.
 * Provides unified KPI metric cards, action toolbars, table views, and side drawer inspectors.
 */

import type { ReactNode } from "react";
import {
  Plus,
  X,
  Download,
  SlidersHorizontal,
} from "lucide-react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { SideDrawer } from "@/components/ui/side-drawer";
import { useErpListView } from "@/components/workspace/list-view";
import type { ErpListBulkAction, ErpListColumn } from "@/lib/workspace/list-view";
import { cn } from "@/lib/utils";

/* ─── Types ────────────────────────────────────────────────────────────── */

export interface KpiMetricItem {
  label: string;
  value: string | number;
  subtext?: string;
  tone?: "positive" | "negative" | "warning" | "info" | "neutral";
  icon?: ReactNode;
  delta?: string;
}

export interface FilterOption {
  key: string;
  label: string;
  options: { label: string; value: string }[];
  value: string;
  onChange: (val: string) => void;
}

export type PlatformListColumn = {
  label: string;
  className?: string;
  key?: string;
  defaultVisible?: boolean;
  filterable?: boolean;
  locked?: boolean;
  dataType?: ErpListColumn["dataType"];
};

export type ErpListColumnDef = PlatformListColumn;

export interface UabPageShellProps<T = any> {
  title: string;
  subtitle?: string;
  categoryTag?: string;
  icon?: string;
  kpiMetrics?: KpiMetricItem[];
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (val: string) => void;
  filterOptions?: FilterOption[];
  onClearFilters?: () => void;
  primaryActionLabel?: string;
  primaryActionIcon?: ReactNode;
  onPrimaryAction?: () => void;
  secondaryActions?: { label: string; onClick: () => void; icon?: ReactNode; disabled?: boolean }[];
  onRefresh?: () => void;
  onExportCsv?: () => void;
  isLoading?: boolean;
  currentPage?: number;
  totalPages?: number;
  totalRecords?: number;
  pageSize?: number;
  onPageSizeChange?: (size: number) => void;
  onPageChange?: (page: number) => void;
  inspectorTitle?: string;
  inspectorSubTitle?: string;
  inspectorContent?: ReactNode;
  inspectorFooter?: ReactNode;
  isInspectorOpen?: boolean;
  onInspectorClose?: () => void;
  inspectorWidth?: "md" | "lg" | "xl";
  listKey?: string;
  listRows?: T[];
  listColumns?: PlatformListColumn[];
  renderListRow?: (row: T) => ReactNode;
  getRowId?: (row: T) => string;
  emptyMessage?: string;
  onBulkDelete?: (rows: T[]) => void;
  bulkActions?: ErpListBulkAction[];
  children?: ReactNode;
}

export type ErpPageShellProps<T = any> = UabPageShellProps<T>;
export type PlatformGlobalPageShellProps<T = any> = UabPageShellProps<T>;

const toneCls: Record<
  NonNullable<KpiMetricItem["tone"]>,
  { card: string; label: string; value: string; icon: string; badge: string }
> = {
  positive: {
    card: "border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/60 dark:bg-emerald-950/20",
    label: "text-emerald-700 dark:text-emerald-400",
    value: "text-emerald-900 dark:text-emerald-200",
    icon: "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/40 dark:text-emerald-300",
    badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300",
  },
  negative: {
    card: "border-rose-200 bg-rose-50/50 dark:border-rose-900/60 dark:bg-rose-950/20",
    label: "text-rose-700 dark:text-rose-400",
    value: "text-rose-900 dark:text-rose-200",
    icon: "text-rose-600 bg-rose-100 dark:bg-rose-900/40 dark:text-rose-300",
    badge: "bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300",
  },
  warning: {
    card: "border-amber-200 bg-amber-50/50 dark:border-amber-900/60 dark:bg-amber-950/20",
    label: "text-amber-700 dark:text-amber-400",
    value: "text-amber-900 dark:text-amber-200",
    icon: "text-amber-600 bg-amber-100 dark:bg-amber-900/40 dark:text-amber-300",
    badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
  },
  info: {
    card: "border-sky-200 bg-sky-50/50 dark:border-sky-900/60 dark:bg-sky-950/20",
    label: "text-sky-700 dark:text-sky-400",
    value: "text-sky-900 dark:text-sky-200",
    icon: "text-sky-600 bg-sky-100 dark:bg-sky-900/40 dark:text-sky-300",
    badge: "bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300",
  },
  neutral: {
    card: "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900",
    label: "text-slate-500 dark:text-slate-400",
    value: "text-slate-900 dark:text-white",
    icon: "text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-300",
    badge: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  },
};

/* ─── Main Shell ────────────────────────────────────────────────────────── */

export function UabPageShell<T = any>(
  props: UabPageShellProps<T>
) {
  const {
    title,
    subtitle,
    categoryTag,
    icon = "settings",
    kpiMetrics = [],
    searchPlaceholder = "Search records…",
    searchValue = "",
    onSearchChange,
    filterOptions = [],
    onClearFilters,
    primaryActionLabel,
    primaryActionIcon,
    onPrimaryAction,
    secondaryActions = [],
    onRefresh,
    onExportCsv,
    isLoading = false,
    currentPage = 1,
    totalPages = 1,
    totalRecords = 0,
    onPageChange,
    inspectorTitle,
    inspectorSubTitle,
    inspectorContent,
    inspectorFooter,
    isInspectorOpen = false,
    onInspectorClose,
    inspectorWidth = "lg",
    listKey,
    listRows,
    listColumns,
    renderListRow,
    getRowId,
    emptyMessage,
    onBulkDelete,
    bulkActions,
    children,
  } = props;

  const hasList = Boolean(listKey && listColumns?.length && renderListRow);
  const hasActiveFilters = Boolean(
    searchValue.trim() || filterOptions.some((o) => o.value && o.value !== "all")
  );

  /* Extra filter controls — dropdowns only; search is in the list toolbar */
  const extraFilters = (
    <>
      {filterOptions.map((opt) => (
        <select
          key={opt.key}
          id={`shell-filter-${opt.key}`}
          name={`shell_filter_${opt.key}`}
          value={opt.value}
          onChange={(e) => opt.onChange(e.target.value)}
          className="h-8.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-700 shadow-2xs focus:border-blue-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
        >
          {opt.options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ))}
      {hasActiveFilters && onClearFilters ? (
        <button
          type="button"
          onClick={onClearFilters}
          className="inline-flex h-8.5 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-600 shadow-2xs hover:bg-slate-50 transition-colors dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
        >
          <X className="h-3 w-3" /> Clear
        </button>
      ) : null}
    </>
  );

  const list = useErpListView({
    listKey: listKey || `erp-${title}`,
    rows: (listRows ?? []) as any[],
    columns: listColumns?.length ? listColumns : [{ key: "_", label: " ", locked: true }],
    renderRow: (row) => {
      const rendered = renderListRow ? renderListRow(row as T) : null;
      if (!rendered) return <tr className="erp-tr" />;
      return rendered;
    },
    loading: isLoading,
    emptyMessage: emptyMessage ?? "No records found",
    getRowId: getRowId as any,
    extraFilters,
    onCreate: onPrimaryAction,
    createLabel: primaryActionLabel ?? "New",
    onRefresh,
    onBulkDelete: onBulkDelete as any,
    bulkActions,
  });

  /* KPI Stats Meta Component */
  const metaKpis = kpiMetrics.length > 0 ? (
    <div className="flex flex-wrap items-center gap-2">
      {kpiMetrics.map((kpi, i) => {
        const tone = toneCls[kpi.tone ?? "neutral"];
        return (
          <div
            key={i}
            className={cn(
              "flex items-center gap-2 rounded-lg border px-2.5 py-1 text-xs shadow-2xs",
              tone.card
            )}
          >
            <span className={cn("text-[11px] font-semibold", tone.label)}>{kpi.label}:</span>
            <span className={cn("font-bold tabular-nums", tone.value)}>
              {typeof kpi.value === "number" ? kpi.value.toLocaleString() : kpi.value}
            </span>
            {kpi.delta && (
              <span className={cn("rounded px-1 text-[10px] font-bold", tone.badge)}>
                {kpi.delta}
              </span>
            )}
          </div>
        );
      })}
    </div>
  ) : null;

  /* Actions Cluster */
  const actionButtons = (
    <div className="flex shrink-0 flex-wrap items-center gap-2">
      {onExportCsv && (
        <button
          type="button"
          onClick={onExportCsv}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
        >
          <Download className="h-3.5 w-3.5" />
          Export
        </button>
      )}
      {secondaryActions.map((action) => (
        <button
          key={action.label}
          type="button"
          onClick={action.onClick}
          disabled={action.disabled}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors disabled:opacity-40 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
        >
          {action.icon}
          {action.label}
        </button>
      ))}
      {primaryActionLabel && onPrimaryAction && (
        <button
          type="button"
          onClick={onPrimaryAction}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition-colors"
        >
          {primaryActionIcon ?? <Plus className="h-3.5 w-3.5" />}
          {primaryActionLabel}
        </button>
      )}
    </div>
  );

  /* Pagination Bar */
  const pagination =
    totalRecords > 0 && onPageChange ? (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-5 py-3 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <p className="text-xs text-slate-500">
          Page {currentPage} of {Math.max(1, totalPages)} &middot;{" "}
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            {totalRecords.toLocaleString()}
          </span>{" "}
          total records
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => onPageChange(currentPage - 1)}
            className="inline-flex h-7 items-center rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 shadow-2xs hover:bg-slate-50 disabled:opacity-40 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
          >
            Previous
          </button>
          <span className="min-w-8 rounded-lg bg-slate-900 px-2.5 py-1 text-center text-xs font-bold text-white dark:bg-blue-600">
            {currentPage}
          </span>
          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => onPageChange(currentPage + 1)}
            className="inline-flex h-7 items-center rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 shadow-2xs hover:bg-slate-50 disabled:opacity-40 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
          >
            Next
          </button>
        </div>
      </div>
    ) : null;

  return (
    <>
      <StandardPageLayout
        title={title}
        subtitle={subtitle}
        eyebrow={categoryTag}
        icon={icon}
        meta={metaKpis}
        actions={actionButtons}
        filters={
          hasList ? (
            list.filterBar
          ) : onSearchChange || filterOptions.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200/80 bg-white/90 p-2.5 shadow-2xs backdrop-blur-xs dark:border-slate-800 dark:bg-slate-900/90">
              <SlidersHorizontal className="h-3.5 w-3.5 text-slate-400" />
              {extraFilters}
            </div>
          ) : null
        }
        pagination={hasList ? undefined : pagination}
      >
        <div className="space-y-3.5 sm:space-y-4">
          {children}
          {hasList && list.table}
        </div>
      </StandardPageLayout>

      {/* Standard Side Drawer Inspector */}
      {inspectorContent && (
        <SideDrawer
          open={isInspectorOpen}
          onClose={() => onInspectorClose?.()}
          title={inspectorTitle ?? "Record details"}
          subtitle={inspectorSubTitle}
          footer={inspectorFooter}
          width={inspectorWidth}
        >
          {inspectorContent}
        </SideDrawer>
      )}
    </>
  );
}

export const ErpPageShell = UabPageShell;
export const PlatformGlobalPageShell = UabPageShell;
