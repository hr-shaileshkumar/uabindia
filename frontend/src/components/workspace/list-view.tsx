"use client";

import {
  Children,
  cloneElement,
  isValidElement,
  useEffect,
  useMemo,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import { ChevronDown, Columns3, Plus, RefreshCw, Trash2, Download, X, Check, Rows3, UploadCloud } from "lucide-react";
import { Inbox } from "lucide-react";
import { erpButtonClassName } from "@/components/workspace/styles";
import { ErpCreateButton } from "@/components/workspace/page-kit";
import { ErpFloatingBulkBar } from "@/components/workspace/floating-bulk-bar";
import { BulkImportModal, type ImportColumnDefinition } from "@/components/workspace/BulkImportModal";
import { useTableKeyboardNav } from "@/components/workspace/useTableKeyboardNav";
import { cn } from "@/lib/utils";
import {
  LIST_FILTER_OPERATORS,
  applyListFilters,
  createListFilterRule,
  defaultVisibleKeys,
  discoverRowColumns,
  exportListCsv,
  formatListCell,
  getRowFieldValue,
  loadListPreferences,
  normalizeListColumns,
  saveListPreferences,
  type ErpListBulkAction,
  type ErpListColumn,
  type ErpListFilterRule,
} from "@/lib/workspace/list-view";

type ColumnInput = ErpListColumn | { label: string; className?: string; key?: string };

export type ErpListViewProps<T> = {
  listKey: string;
  rows: T[];
  columns: ColumnInput[];
  renderRow: (row: T) => ReactNode;
  loading?: boolean;
  emptyMessage?: string;
  emptyAction?: ReactNode;
  getRowId?: (row: T) => string;
  extraFilters?: ReactNode;
  onCreate?: () => void;
  createLabel?: string;
  onRefresh?: () => void;
  onBulkDelete?: (rows: T[]) => void;
  bulkActions?: ErpListBulkAction[];
  searchPlaceholder?: string;
  onBulkImport?: (rows: Record<string, unknown>[]) => Promise<void>;
  importColumns?: ImportColumnDefinition[];
  onRowClick?: (row: T) => void;
};

function rowIdOf<T>(row: T, index: number, getRowId?: (row: T) => string) {
  if (getRowId) return getRowId(row);
  if (row && typeof row === "object") {
    const rec = row as Record<string, unknown>;
    const id = rec.id ?? rec.Id ?? rec.key;
    if (id != null) return String(id);
  }
  return `row-${index}`;
}

export function ErpListFilterBar({
  columns,
  filters,
  onChange,
  extra,
}: {
  columns: ErpListColumn[];
  filters: ErpListFilterRule[];
  onChange: (next: ErpListFilterRule[]) => void;
  extra?: ReactNode;
}) {
  const [draftFilters, setDraftFilters] = useState<ErpListFilterRule[]>(filters);
  const [isExpanded, setIsExpanded] = useState(filters.length > 0);

  useEffect(() => {
    setDraftFilters(filters);
    if (filters.length > 0) setIsExpanded(true);
  }, [filters]);

  const filterable = columns.filter((column) => column.filterable !== false && !column.locked);

  const addFilter = () => {
    const first = filterable[0]?.key ?? columns[0]?.key ?? "";
    const updated = [...draftFilters, createListFilterRule(first)];
    setDraftFilters(updated);
    setIsExpanded(true);
  };

  const applyFilters = () => {
    onChange(draftFilters);
  };

  const clearAll = () => {
    setDraftFilters([]);
    onChange([]);
    setIsExpanded(false);
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      {/* Top Left-Aligned Controls Row */}
      <div className="flex flex-wrap items-center gap-2">
        {extra}
        <button
          type="button"
          onClick={addFilter}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          Add filter
        </button>

        {draftFilters.length > 0 ? (
          <>
            <button
              type="button"
              onClick={applyFilters}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-slate-900 px-3 text-xs font-semibold text-white shadow-2xs hover:bg-slate-800 transition-colors"
            >
              <Check className="h-3.5 w-3.5" />
              Apply
            </button>
            <button
              type="button"
              onClick={clearAll}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-rose-600 shadow-2xs hover:bg-rose-50 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
              Clear
            </button>
          </>
        ) : null}
      </div>

      {/* Expanded Filter Rules Rows */}
      {isExpanded && draftFilters.length > 0 ? (
        <div className="flex flex-col gap-2 rounded-lg border border-slate-200/90 bg-slate-50/70 p-2.5">
          {draftFilters.map((rule) => (
            <div key={rule.id} className="grid gap-2 sm:grid-cols-[minmax(8rem,12rem)_minmax(8rem,11rem)_minmax(8rem,1fr)_auto]">
              <select
                className="erp-select"
                value={rule.columnKey}
                onChange={(event) =>
                  setDraftFilters(draftFilters.map((item) => (item.id === rule.id ? { ...item, columnKey: event.target.value } : item)))
                }
              >
                {filterable.map((column) => (
                  <option key={column.key} value={column.key}>
                    {column.label}
                  </option>
                ))}
              </select>
              <select
                className="erp-select"
                value={rule.operator}
                onChange={(event) =>
                  setDraftFilters(
                    draftFilters.map((item) =>
                      item.id === rule.id ? { ...item, operator: event.target.value as ErpListFilterRule["operator"] } : item,
                    ),
                  )
                }
              >
                {LIST_FILTER_OPERATORS.map((op) => (
                  <option key={op.value} value={op.value}>
                    {op.label}
                  </option>
                ))}
              </select>
              {rule.operator === "empty" || rule.operator === "nempty" ? (
                <div className="flex h-8 items-center text-xs text-slate-500">No value needed</div>
              ) : (
                <input
                  className="erp-input"
                  value={rule.value}
                  placeholder="Filter value"
                  onChange={(event) =>
                    setDraftFilters(draftFilters.map((item) => (item.id === rule.id ? { ...item, value: event.target.value } : item)))
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") applyFilters();
                  }}
                />
              )}
              <button
                type="button"
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                aria-label="Remove filter"
                onClick={() => {
                  const remaining = draftFilters.filter((item) => item.id !== rule.id);
                  setDraftFilters(remaining);
                  if (remaining.length === 0) {
                    onChange([]);
                    setIsExpanded(false);
                  }
                }}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function BulkActionMenu({
  selectedCount,
  selectedIds,
  actions,
}: {
  selectedCount: number;
  selectedIds: string[];
  actions: ErpListBulkAction[];
}) {
  const [open, setOpen] = useState(false);
  const groups = [
    { key: "data", label: "Data" },
    { key: "change", label: "Bulk changes" },
    { key: "danger", label: "Danger" },
  ] as const;

  if (selectedCount === 0 || actions.length === 0) return null;

  return (
    <div className="relative">
      <button type="button" className={erpButtonClassName.secondary} onClick={() => setOpen((value) => !value)}>
        Actions
        <span className="rounded bg-slate-900 px-1.5 py-0.5 text-[10px] font-bold text-white">{selectedCount}</span>
        <ChevronDown className="h-3.5 w-3.5" />
      </button>
      {open ? (
        <div className="absolute right-0 z-30 mt-1 min-w-48 overflow-hidden rounded-lg border border-slate-200 bg-white py-1">
          {groups.map((group) => {
            const items = actions.filter((action) => (action.category ?? "data") === group.key);
            if (items.length === 0) return null;
            return (
              <div key={group.key}>
                <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">{group.label}</p>
                {items.map((action) => (
                  <button
                    key={action.key}
                    type="button"
                    disabled={action.disabled}
                    className={cn(
                      "flex w-full items-center px-3 py-1.5 text-left text-xs font-medium hover:bg-slate-50 disabled:opacity-40",
                      group.key === "danger" ? "text-rose-600" : "text-slate-700",
                    )}
                    onClick={() => {
                      setOpen(false);
                      action.onClick(selectedIds);
                    }}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function ColumnPanel({
  columns,
  visibleKeys,
  onToggle,
  onShowAll,
  onReset,
}: {
  columns: ErpListColumn[];
  visibleKeys: string[];
  onToggle: (key: string) => void;
  onShowAll: () => void;
  onReset: () => void;
}) {
  const visible = new Set(visibleKeys);
  return (
    <aside className="flex h-full min-h-64 w-full flex-col rounded-lg border border-slate-200 bg-white lg:w-64">
      <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2">
        <p className="text-xs font-semibold text-slate-900">Columns</p>
        <span className="text-[11px] text-slate-500">
          {visibleKeys.filter((key) => columns.some((column) => column.key === key && !column.locked)).length} shown
        </span>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {columns.map((column) => (
          <label key={column.key} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-xs hover:bg-slate-50">
            <input
              type="checkbox"
              className="h-3.5 w-3.5 rounded border-slate-300"
              checked={column.locked || visible.has(column.key)}
              disabled={column.locked}
              onChange={() => onToggle(column.key)}
            />
            <span className={column.locked ? "text-slate-400" : "text-slate-700"}>{column.label}</span>
          </label>
        ))}
      </div>
      <div className="flex gap-2 border-t border-slate-200 p-2">
        <button type="button" className={`${erpButtonClassName.ghost} flex-1`} onClick={onShowAll}>
          All
        </button>
        <button type="button" className={`${erpButtonClassName.ghost} flex-1`} onClick={onReset}>
          Reset
        </button>
      </div>
    </aside>
  );
}

function cellsAt(cells: ReturnType<typeof Children.toArray>, indexes: number[]) {
  return indexes.map((index) => cells[index]).filter(Boolean);
}

function patchRowNode(
  node: ReactNode,
  visibleUnlockedIndexes: number[],
  lockedIndexes: number[],
  extraCells: ReactNode[],
  selected: boolean,
  onToggle: () => void,
  rowKey: string,
  isFocused?: boolean,
) {
  if (!isValidElement(node)) {
    return (
      <tr key={rowKey} className={cn("erp-tr", selected && "bg-sky-50", isFocused && "ring-2 ring-blue-500/40 bg-blue-50/20")}>
        <td key="__select" className="erp-td w-8">
          <input type="checkbox" checked={selected} onChange={onToggle} aria-label="Select row" className="h-3.5 w-3.5 rounded border-slate-300" />
        </td>
        {node}
        {extraCells}
      </tr>
    );
  }

  const element = node as ReactElement<{ className?: string; children?: ReactNode }>;
  const className = String(element.props.className ?? "");
  const looksLikeRow = element.type === "tr" || className.includes("erp-tr");

  // Fragments / bare <td> cells — wrap once, then patch selection columns.
  if (!looksLikeRow) {
    return patchRowNode(
      <tr key={element.key ?? rowKey} className="erp-tr">{node}</tr>,
      visibleUnlockedIndexes,
      lockedIndexes,
      extraCells,
      selected,
      onToggle,
      rowKey,
      isFocused,
    );
  }

  const cells = Children.toArray(element.props.children);
  const nextChildren = [
    <td key="__select" className="erp-td w-8">
      <input type="checkbox" checked={selected} onChange={onToggle} aria-label="Select row" className="h-3.5 w-3.5 rounded border-slate-300" />
    </td>,
    ...cellsAt(cells, visibleUnlockedIndexes),
    ...extraCells,
    ...cellsAt(cells, lockedIndexes),
  ];

  return cloneElement(element, {
    key: element.key ?? rowKey,
    className: cn(className, selected && "bg-sky-50", isFocused && "ring-2 ring-blue-500/40 bg-blue-50/20"),
    children: nextChildren,
  });
}

export function useErpListView<T>({
  listKey,
  rows,
  columns: columnInput,
  renderRow,
  loading = false,
  emptyMessage = "No records in the current view",
  emptyAction,
  getRowId,
  extraFilters,
  onCreate,
  createLabel = "New",
  onRefresh,
  onBulkDelete,
  bulkActions = [],
  onBulkImport,
  importColumns,
  onRowClick,
}: ErpListViewProps<T>) {
  const declared = useMemo(() => normalizeListColumns(columnInput), [columnInput]);
  const allColumns = useMemo(() => discoverRowColumns(rows, declared), [rows, declared]);
  const stored = useMemo(() => loadListPreferences(listKey), [listKey]);

  const [filters, setFilters] = useState<ErpListFilterRule[]>(stored.filters ?? []);
  const [visibleKeys, setVisibleKeys] = useState<string[]>(() => {
    const defaults = defaultVisibleKeys(allColumns);
    if (!stored.visibleKeys?.length) return defaults;
    const allowed = new Set(allColumns.map((column) => column.key));
    const next = stored.visibleKeys.filter((key) => allowed.has(key));
    allColumns.filter((column) => column.locked).forEach((column) => {
      if (!next.includes(column.key)) next.push(column.key);
    });
    return next.length ? next : defaults;
  });
  const [selected, setSelected] = useState<string[]>([]);
  const [columnsOpen, setColumnsOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [density, setDensity] = useState<"compact" | "normal">("normal");

  useEffect(() => {
    saveListPreferences(listKey, { visibleKeys, filters });
  }, [listKey, visibleKeys, filters]);

  const filteredRows = useMemo(() => applyListFilters(rows, filters), [rows, filters]);
  const declaredKeys = declared.map((column) => column.key);
  const visibleUnlockedIndexes = declared
    .map((column, index) => (!column.locked && visibleKeys.includes(column.key) ? index : -1))
    .filter((index) => index >= 0);
  const lockedIndexes = declared.map((column, index) => (column.locked ? index : -1)).filter((index) => index >= 0);
  const extraVisible = allColumns.filter(
    (column) => !declaredKeys.includes(column.key) && visibleKeys.includes(column.key),
  );
  const unlockedVisible = declared.filter((column) => !column.locked && visibleKeys.includes(column.key));
  const lockedDeclared = declared.filter((column) => column.locked);
  const headerColumns = [...unlockedVisible, ...extraVisible, ...lockedDeclared];

  const selectedRows = filteredRows.filter((row, index) => selected.includes(rowIdOf(row, index, getRowId)));
  const allVisibleIds = filteredRows.map((row, index) => rowIdOf(row, index, getRowId));
  const allSelected = allVisibleIds.length > 0 && allVisibleIds.every((id) => selected.includes(id));

  // Keyboard navigation hook
  const { focusedIndex } = useTableKeyboardNav({
    rows: filteredRows,
    onRowClick: (row) => onRowClick?.(row),
    onToggleSelect: (row, idx) => {
      const id = rowIdOf(row, idx, getRowId);
      setSelected((curr) => (curr.includes(id) ? curr.filter((item) => item !== id) : [...curr, id]));
    },
    enabled: true,
  });

  const builtInActions: ErpListBulkAction[] = [
    ...(onRefresh
      ? [{ key: "refresh", label: "Refresh", category: "data" as const, onClick: () => onRefresh() }]
      : []),
    {
      key: "export",
      label: "Export selected CSV",
      category: "data",
      onClick: () =>
        exportListCsv(
          selectedRows.length ? selectedRows : filteredRows,
          headerColumns.filter((column) => !column.locked),
          listKey,
        ),
    },
    ...bulkActions.map((action) => ({
      ...action,
      onClick: () => action.onClick(selected),
    })),
    ...(onBulkDelete
      ? [
          {
            key: "delete",
            label: "Delete selected",
            category: "danger" as const,
            onClick: () => onBulkDelete(selectedRows),
          },
        ]
      : []),
  ];

  return {
    filterBar: (
      <ErpListFilterBar columns={allColumns} filters={filters} onChange={setFilters} extra={extraFilters} />
    ),
    headerTools: (
      <>
        <BulkActionMenu selectedCount={selected.length} selectedIds={selected} actions={builtInActions} />
        {onBulkImport && (
          <button
            type="button"
            className={erpButtonClassName.secondary}
            onClick={() => setImportOpen(true)}
            title="Bulk Import CSV data"
          >
            <UploadCloud className="h-3.5 w-3.5" />
            Import CSV
          </button>
        )}
        <button
          type="button"
          title={density === "compact" ? "Switch to comfortable view" : "Switch to compact view"}
          className={erpButtonClassName.secondary}
          onClick={() => setDensity((d) => (d === "compact" ? "normal" : "compact"))}
        >
          <Rows3 className="h-3.5 w-3.5" />
          {density === "compact" ? "Compact" : "Comfortable"}
        </button>
        <button
          type="button"
          className={erpButtonClassName.secondary}
          onClick={() => setColumnsOpen((value) => !value)}
        >
          <Columns3 className="h-3.5 w-3.5" />
          Columns
        </button>
      </>
    ),
    table: (
      <div className={cn("grid gap-3", columnsOpen ? "lg:grid-cols-[minmax(0,1fr)_16rem]" : "")}>
        <div className="erp-table-wrap min-w-0 rounded-none border-0 shadow-none">
          {loading && rows.length === 0 ? (
            <div className="space-y-2 p-3" role="status">
              {Array.from({ length: 5 }, (_, index) => (
                <div key={index} className="h-8 animate-pulse rounded bg-slate-100" />
              ))}
            </div>
          ) : (
            <table className={cn("erp-table table-auto transition-all", density === "compact" ? "[&_.erp-td]:py-1.5 [&_.erp-td]:text-xs [&_.erp-th]:py-1.5" : "[&_.erp-td]:py-2.5 [&_.erp-td]:text-sm [&_.erp-th]:py-2.5")}>
              <thead className="erp-thead">
                <tr>
                  <th className="erp-th w-8">
                    <input
                      type="checkbox"
                      className="h-3.5 w-3.5 rounded border-slate-300"
                      checked={allSelected}
                      onChange={() => setSelected(allSelected ? [] : allVisibleIds)}
                      aria-label="Select all"
                    />
                  </th>
                  {headerColumns.map((column) => (
                    <th key={column.key} className={cn("erp-th", column.className)}>
                      {column.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row, index) => {
                  const id = rowIdOf(row, index, getRowId);
                  const extraCells = extraVisible.map((column) => (
                    <td key={column.key} className="erp-td">
                      {formatListCell(getRowFieldValue(row, column.key), column.dataType)}
                    </td>
                  ));
                  return patchRowNode(
                    renderRow(row),
                    visibleUnlockedIndexes,
                    lockedIndexes,
                    extraCells,
                    selected.includes(id),
                    () =>
                      setSelected((current) =>
                        current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
                      ),
                    id,
                    focusedIndex === index,
                  );
                })}
                {!loading && filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={headerColumns.length + 1} className="erp-td py-10 text-center">
                      <div className="mx-auto flex max-w-xl flex-col items-center gap-2 text-center">
                        <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                          <Inbox className="h-4 w-4" />
                        </span>
                        <p className="text-sm font-semibold text-slate-900">No records in the current view</p>
                        <p className="text-sm text-slate-500">{emptyMessage}</p>
                        {emptyAction ? <div className="mt-2">{emptyAction}</div> : onCreate ? (
                          <div className="mt-2">
                            <ErpCreateButton label={createLabel} onClick={onCreate} />
                          </div>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          )}
        </div>
        {columnsOpen ? (
          <aside className="rounded-2xl border border-slate-200 bg-white p-3 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Visible Columns</span>
              <button
                type="button"
                className="text-xs text-blue-600 hover:underline"
                onClick={() => setVisibleKeys(defaultVisibleKeys(allColumns))}
              >
                Reset
              </button>
            </div>
            <div className="max-h-72 space-y-1 overflow-y-auto">
              {allColumns.map((column) => {
                const active = visibleKeys.includes(column.key);
                return (
                  <label
                    key={column.key}
                    className={cn(
                      "flex cursor-pointer items-center justify-between rounded-lg px-2.5 py-1.5 text-xs text-slate-700 transition hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800",
                      column.locked && "cursor-not-allowed opacity-60",
                    )}
                  >
                    <span>{column.label}</span>
                    <input
                      type="checkbox"
                      checked={active}
                      disabled={column.locked}
                      onChange={() => {
                        if (column.locked) return;
                        setVisibleKeys((current) =>
                          current.includes(column.key)
                            ? current.filter((k) => k !== column.key)
                            : [...current, column.key]
                        );
                      }}
                      className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600"
                    />
                  </label>
                );
              })}
            </div>
          </aside>
        ) : null}

        {onBulkImport && (
          <BulkImportModal
            open={importOpen}
            onOpenChange={setImportOpen}
            entityName={listKey}
            columns={
              importColumns ||
              allColumns.map((c) => ({
                key: c.key,
                label: c.label,
                required: c.locked,
              }))
            }
            onImport={onBulkImport}
          />
        )}

        {/* Bottom Floating Multi-Select Bulk Actions Bar */}
        <ErpFloatingBulkBar
          selectedCount={selected.length}
          onDeselectAll={() => setSelected([])}
          onExportCsv={() =>
            exportListCsv(
              selectedRows,
              headerColumns.filter((column) => !column.locked),
              listKey,
            )
          }
          onBulkDelete={onBulkDelete ? () => onBulkDelete(selectedRows) : undefined}
        />
      </div>
    ),
    selectedCount: selected.length,
    selectedIds: selected,
    filteredCount: filteredRows.length,
  };
}

/** Compact refresh used next to Columns / Actions. */
export function ErpListRefreshButton({ onClick, loading }: { onClick: () => void; loading?: boolean }) {
  return (
    <button type="button" onClick={onClick} disabled={loading} className={erpButtonClassName.secondary}>
      <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
      Refresh
    </button>
  );
}

export function ErpListDeleteHint({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs text-slate-500", className)}>
      <Trash2 className="h-3 w-3" />
      Select rows, then Actions
    </span>
  );
}

export function ErpListExportButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={erpButtonClassName.ghost}>
      <Download className="h-3.5 w-3.5" />
      Export
    </button>
  );
}
