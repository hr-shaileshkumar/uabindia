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
import { ChevronDown, Columns3, Plus, RefreshCw, Trash2, Download, X } from "lucide-react";
import { Inbox } from "lucide-react";
import { erpButtonClassName } from "@/components/erp/erpStyles";
import { ErpCreateButton } from "@/components/erp/erp-page-kit";
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
} from "@/lib/erp/list-view";

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
  const filterable = columns.filter((column) => column.filterable !== false && !column.locked);
  const addFilter = () => {
    const first = filterable[0]?.key ?? columns[0]?.key ?? "";
    onChange([...filters, createListFilterRule(first)]);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        {extra}
        <button type="button" onClick={addFilter} className={erpButtonClassName.ghost}>
          <Plus className="h-3.5 w-3.5" />
          Add filter
        </button>
      </div>
      {filters.length > 0 ? (
        <div className="flex flex-col gap-2">
          {filters.map((rule) => (
            <div key={rule.id} className="grid gap-2 sm:grid-cols-[minmax(8rem,12rem)_minmax(8rem,11rem)_minmax(8rem,1fr)_auto]">
              <select
                className="erp-select"
                value={rule.columnKey}
                onChange={(event) =>
                  onChange(filters.map((item) => (item.id === rule.id ? { ...item, columnKey: event.target.value } : item)))
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
                  onChange(
                    filters.map((item) =>
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
                    onChange(filters.map((item) => (item.id === rule.id ? { ...item, value: event.target.value } : item)))
                  }
                />
              )}
              <button
                type="button"
                className={erpButtonClassName.ghost}
                aria-label="Remove filter"
                onClick={() => onChange(filters.filter((item) => item.id !== rule.id))}
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
): ReactNode {
  if (!isValidElement(node)) return node;
  const element = node as ReactElement<{ className?: string; children?: ReactNode }>;
  const className = String(element.props.className ?? "");
  const looksLikeRow = element.type === "tr" || className.includes("erp-tr");
  if (!looksLikeRow) return node;

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
    className: cn(className, selected && "bg-sky-50"),
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

  const toggleVisible = (key: string) => {
    const column = allColumns.find((item) => item.key === key);
    if (column?.locked) return;
    setVisibleKeys((current) => (current.includes(key) ? current.filter((item) => item !== key) : [...current, key]));
  };

  const selectedRows = filteredRows.filter((row, index) => selected.includes(rowIdOf(row, index, getRowId)));
  const allVisibleIds = filteredRows.map((row, index) => rowIdOf(row, index, getRowId));
  const allSelected = allVisibleIds.length > 0 && allVisibleIds.every((id) => selected.includes(id));

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
            <table className="erp-table table-auto">
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
          <ColumnPanel
            columns={allColumns}
            visibleKeys={visibleKeys}
            onToggle={toggleVisible}
            onShowAll={() => setVisibleKeys(allColumns.map((column) => column.key))}
            onReset={() => setVisibleKeys(defaultVisibleKeys(allColumns))}
          />
        ) : null}
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
