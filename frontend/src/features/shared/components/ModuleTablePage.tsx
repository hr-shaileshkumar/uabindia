"use client";

import type { ReactNode } from "react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { CrudCard } from "@/components/workspace/crud-workspace";
import { ListSearchInput } from "@/components/workspace/list-toolbar";
import { ErpCreateButton, ErpRefreshButton } from "@/components/workspace/page-kit";
import { useErpListView } from "@/components/workspace/list-view";
import type { ErpListBulkAction, ErpListColumn } from "@/lib/workspace/list-view";

export type ModuleTableColumn = {
  label: string;
  className?: string;
  key?: string;
  defaultVisible?: boolean;
  filterable?: boolean;
  locked?: boolean;
  dataType?: ErpListColumn["dataType"];
};

type ModuleTablePageProps<T> = {
  title: string;
  subtitle: string;
  eyebrow?: string;
  icon?: string;
  toolbarTitle: string;
  toolbarSubtitle: string;
  loading: boolean;
  error?: string | null;
  loadError?: string | null;
  onRetry?: () => void;
  rows: T[];
  columns: ModuleTableColumn[];
  renderRow: (row: T) => ReactNode;
  renderActions?: (row: T) => ReactNode;
  emptyMessage: string;
  emptyAction?: ReactNode;
  countLabel?: (count: number) => string;
  actions?: ReactNode;
  filters?: ReactNode;
  pagination?: ReactNode;
  headerStats?: ReactNode;
  intro?: ReactNode;
  kpiCards?: ReactNode;
  detailCard?: ReactNode;
  quickEditDrawer?: ReactNode;
  onCreate?: () => void;
  createLabel?: string;
  onRefresh?: () => void;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  listKey?: string;
  getRowId?: (row: T) => string;
  onBulkDelete?: (rows: T[]) => void;
  bulkActions?: ErpListBulkAction[];
};

export default function ModuleTablePage<T>({
  title,
  subtitle,
  eyebrow,
  icon,
  toolbarTitle: _toolbarTitle,
  toolbarSubtitle: _toolbarSubtitle,
  loading,
  error,
  loadError,
  onRetry,
  rows,
  columns,
  renderRow,
  emptyMessage,
  emptyAction,
  countLabel,
  actions,
  filters,
  pagination,
  headerStats,
  intro,
  kpiCards,
  detailCard,
  quickEditDrawer,
  onCreate,
  createLabel = "New",
  onRefresh,
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search records…",
  listKey,
  getRowId,
  onBulkDelete,
  bulkActions,
}: ModuleTablePageProps<T>) {
  const displayError = loadError ?? error;
  const list = useErpListView({
    listKey: listKey || title,
    rows,
    columns,
    renderRow,
    loading,
    emptyMessage,
    emptyAction,
    getRowId,
    extraFilters: (
      <>
        {onSearchChange ? (
          <ListSearchInput value={searchValue ?? ""} onChange={onSearchChange} placeholder={searchPlaceholder} />
        ) : null}
        {filters}
      </>
    ),
    onCreate,
    createLabel,
    onRefresh,
    onBulkDelete,
    bulkActions,
  });

  const recordCountText = loading
    ? "Loading..."
    : countLabel
      ? countLabel(list.filteredCount)
      : `${list.filteredCount} records`;

  return (
    <StandardPageLayout
      title={title}
      subtitle={subtitle}
      eyebrow={eyebrow}
      icon={icon}
      meta={
        headerStats ?? (
          <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-600">
            {recordCountText}
          </span>
        )
      }
      actions={
        <>
          {onRefresh ? <ErpRefreshButton onClick={onRefresh} loading={loading} /> : null}
          {list.headerTools}
          {actions}
          {onCreate ? <ErpCreateButton label={createLabel} onClick={onCreate} /> : null}
        </>
      }
      filters={list.filterBar}
      pagination={pagination}
    >
      {displayError ? (
        <div className="erp-alert-error flex items-center justify-between gap-4">
          <span>{displayError}</span>
          {onRetry ? (
            <button
              type="button"
              onClick={onRetry}
              className="shrink-0 rounded border border-red-300 bg-white px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-50"
            >
              Retry
            </button>
          ) : null}
        </div>
      ) : null}
      {intro ? <div className="mb-4">{intro}</div> : null}
      {kpiCards && !headerStats ? <div className="mb-4">{kpiCards}</div> : null}

      <CrudCard>{list.table}</CrudCard>

      {detailCard ? <div className="mt-4">{detailCard}</div> : null}
      {quickEditDrawer ?? null}
    </StandardPageLayout>
  );
}
