"use client";

/**
 * Thin adapter over StandardPageLayout so /platform pages use the same ERP chrome
 * (title + chips, Refresh / Actions / Columns / New, Add filter, one CrudCard table).
 */
import type { ReactNode } from "react";
import { X } from "lucide-react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { CrudCard, CrudHeaderStats } from "@/components/erp/crud-workspace";
import { ErpCreateButton, ErpRefreshButton } from "@/components/erp/erp-page-kit";
import { useErpListView } from "@/components/erp/erp-list-view";
import { erpButtonClassName, erpFormInputClassName } from "@/components/erp/erpStyles";
import { SideDrawer } from "@/components/ui/side-drawer";
import type { ErpListBulkAction, ErpListColumn } from "@/lib/erp/list-view";

export interface KpiMetricItem {
  label: string;
  value: string | number;
  subtext?: string;
  tone?: "positive" | "negative" | "warning" | "info" | "neutral";
  icon?: ReactNode;
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

export interface PlatformGlobalPageShellProps<T = Record<string, unknown>> {
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
  onPrimaryAction?: () => void;
  primaryActionIcon?: ReactNode;
  secondaryActions?: {
    label: string;
    icon?: ReactNode;
    onClick: () => void;
    disabled?: boolean;
  }[];
  onRefresh?: () => void;
  onExportCsv?: () => void;
  isLoading?: boolean;
  currentPage?: number;
  totalPages?: number;
  totalRecords?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  inspectorTitle?: string;
  inspectorSubTitle?: string;
  inspectorContent?: ReactNode;
  isInspectorOpen?: boolean;
  onInspectorClose?: () => void;
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

export function PlatformGlobalPageShell<T>({
  title,
  categoryTag,
  icon,
  kpiMetrics = [],
  searchPlaceholder = "Search records…",
  searchValue = "",
  onSearchChange,
  filterOptions = [],
  onClearFilters,
  primaryActionLabel,
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
  inspectorContent,
  isInspectorOpen = false,
  onInspectorClose,
  listKey,
  listRows,
  listColumns,
  renderListRow,
  getRowId,
  emptyMessage,
  onBulkDelete,
  bulkActions,
  children,
}: PlatformGlobalPageShellProps<T>) {
  const hasList = Boolean(listKey && listColumns?.length && renderListRow);
  const hasActiveFilters = Boolean(
    searchValue.trim() || filterOptions.some((item) => item.value && item.value !== "all"),
  );

  const extraFilters = (
    <>
      {onSearchChange ? (
        <input
          type="search"
          className={`${erpFormInputClassName} max-w-xs`}
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      ) : null}
      {filterOptions.map((opt) => (
        <select key={opt.key} className="erp-select w-36" value={opt.value} onChange={(event) => opt.onChange(event.target.value)}>
          {opt.options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ))}
      {hasActiveFilters && onClearFilters ? (
        <button type="button" onClick={onClearFilters} className={erpButtonClassName.ghost}>
          <X className="h-3.5 w-3.5" />
          Clear
        </button>
      ) : null}
    </>
  );

  const list = useErpListView({
    listKey: listKey || `platform-${title}`,
    rows: (listRows ?? []) as T[],
    columns: listColumns?.length ? listColumns : [{ key: "_", label: " ", locked: true }],
    renderRow: renderListRow ?? (() => <tr className="erp-tr" />),
    loading: isLoading,
    emptyMessage: emptyMessage ?? "No records in the current view",
    getRowId,
    extraFilters,
    onCreate: onPrimaryAction,
    createLabel: primaryActionLabel ?? "New",
    onRefresh,
    onBulkDelete,
    bulkActions,
  });

  const pagination =
    totalRecords > 0 && onPageChange ? (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3">
        <p className="text-sm text-slate-500">
          Page {currentPage} of {Math.max(1, totalPages)} · {totalRecords} total
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => onPageChange(currentPage - 1)}
            className={erpButtonClassName.secondary}
          >
            Previous
          </button>
          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => onPageChange(currentPage + 1)}
            className={erpButtonClassName.secondary}
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
        icon={icon}
        eyebrow={categoryTag}
        meta={
          kpiMetrics.length > 0 ? (
            <CrudHeaderStats
              items={kpiMetrics.map((item) => ({
                label: item.label,
                value: item.value,
                helper: item.subtext,
                tone:
                  item.tone === "positive"
                    ? "positive"
                    : item.tone === "negative"
                      ? "danger"
                      : item.tone === "warning"
                        ? "warning"
                        : item.tone === "info"
                          ? "info"
                          : "neutral",
              }))}
            />
          ) : null
        }
        actions={
          <>
            {onRefresh ? <ErpRefreshButton onClick={onRefresh} loading={isLoading} /> : null}
            {hasList ? list.headerTools : null}
            {onExportCsv ? (
              <button type="button" onClick={onExportCsv} className={erpButtonClassName.secondary}>
                Export
              </button>
            ) : null}
            {secondaryActions.map((action) => (
              <button
                key={action.label}
                type="button"
                onClick={action.onClick}
                disabled={action.disabled}
                className={erpButtonClassName.secondary}
              >
                {action.icon}
                {action.label}
              </button>
            ))}
            {primaryActionLabel && onPrimaryAction ? (
              <ErpCreateButton label={primaryActionLabel} onClick={onPrimaryAction} />
            ) : null}
          </>
        }
        filters={
          hasList
            ? list.filterBar
            : onSearchChange || filterOptions.length > 0
              ? <div className="flex flex-wrap items-center gap-2">{extraFilters}</div>
              : undefined
        }
        pagination={pagination}
      >
        {children}
        {hasList ? <CrudCard>{list.table}</CrudCard> : null}
      </StandardPageLayout>

      {inspectorContent ? (
        <SideDrawer open={isInspectorOpen} onClose={() => onInspectorClose?.()} title={inspectorTitle || "Record details"}>
          {inspectorContent}
        </SideDrawer>
      ) : null}
    </>
  );
}
