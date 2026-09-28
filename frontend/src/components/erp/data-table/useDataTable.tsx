"use client";

import {
  Children,
  cloneElement,
  isValidElement,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import {
  ArrowUpDown,
  Check,
  ChevronDown,
  ChevronUp,
  Columns3,
  Download,
  Inbox,
  RotateCcw,
  Rows3,
  Search,
  UploadCloud,
} from "lucide-react";
import { erpButtonClassName } from "@/components/workspace/styles";
import { ErpCreateButton } from "@/components/workspace/page-kit";
import { ErpFloatingBulkBar } from "@/components/workspace/floating-bulk-bar";
import { BulkImportModal } from "@/components/workspace/BulkImportModal";
import { UniversalExportModal } from "@/components/workspace/UniversalExportModal";
import type { DynamicColumn } from "@/lib/dynamic-schema/types";
import { useTableKeyboardNav } from "@/components/workspace/useTableKeyboardNav";
import { cn } from "@/lib/utils";
import {
  applyListFilters,
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
import type { ErpListViewProps } from "./types";
import { ErpListFilterBar } from "./DataTableFilterBar";

function rowIdOf<T>(row: T, index: number, getRowId?: (row: T) => string) {
  if (getRowId) return getRowId(row);
  if (row && typeof row === "object") {
    const rec = row as Record<string, unknown>;
    const id = rec.id ?? rec.Id ?? rec.key;
    if (id != null) return String(id);
  }
  return `row-${index}`;
}

function useClickOutside(ref: React.RefObject<HTMLElement | null>, onClose: () => void) {
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) onClose();
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose, ref]);
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
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false));

  const groups = [
    { key: "data", label: "Data" },
    { key: "change", label: "Bulk changes" },
    { key: "danger", label: "Danger" },
  ] as const;

  if (selectedCount === 0 || actions.length === 0) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        className={cn(erpButtonClassName.secondary, "cursor-pointer")}
        onClick={() => setOpen((value) => !value)}
      >
        <span>Actions</span>
        <span className="rounded bg-blue-600 px-1.5 py-0.5 text-[10px] font-bold text-white tabular-nums">
          {selectedCount}
        </span>
        <ChevronDown className="h-3.5 w-3.5" />
      </button>
      {open ? (
        <div className="absolute right-0 z-40 mt-1 min-w-48 overflow-hidden rounded-xl border border-slate-200/90 bg-white py-1 shadow-xl dark:border-slate-800 dark:bg-slate-900">
          {groups.map((group) => {
            const items = actions.filter((action) => (action.category ?? "data") === group.key);
            if (items.length === 0) return null;
            return (
              <div key={group.key} className="border-b border-slate-100 last:border-0 dark:border-slate-800/60 pb-1">
                <p className="px-3 pt-1.5 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  {group.label}
                </p>
                {items.map((action) => (
                  <button
                    key={action.key}
                    type="button"
                    disabled={action.disabled}
                    className={cn(
                      "flex w-full items-center px-3 py-1.5 text-left text-xs font-medium transition-colors hover:bg-slate-50 disabled:opacity-40 cursor-pointer dark:hover:bg-slate-800",
                      group.key === "danger"
                        ? "text-rose-600 dark:text-rose-400"
                        : "text-slate-700 dark:text-slate-200",
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
  onRowClick?: () => void,
) {
  const selectCell = (
    <td key="__select" className="erp-td w-10 text-center" onClick={(e) => e.stopPropagation()}>
      <input
        id={`table-row-select-${rowKey}`}
        name={`table_row_select_${rowKey}`}
        type="checkbox"
        checked={selected}
        onChange={onToggle}
        aria-label="Select row"
        className="h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500/20 cursor-pointer"
      />
    </td>
  );

  const handleClick = (e: React.MouseEvent) => {
    if (!onRowClick) return;
    const target = e.target as HTMLElement | null;
    if (target?.closest("input, button, a, select, textarea, [data-prevent-row-click]")) {
      return;
    }
    onRowClick();
  };

  if (!isValidElement(node)) {
    return (
      <tr
        key={rowKey}
        onClick={handleClick}
        className={cn(
          "erp-tr",
          selected && "erp-tr-selected",
          isFocused && "ring-2 ring-blue-500/40 bg-blue-50/30 dark:bg-blue-950/20",
          onRowClick && "cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60",
        )}
      >
        {selectCell}
        {node}
        {extraCells}
      </tr>
    );
  }

  const element = node as ReactElement<{ className?: string; children?: ReactNode; onClick?: (e: React.MouseEvent) => void }>;
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
      onRowClick,
    );
  }

  const cells = Children.toArray(element.props.children);
  const nextChildren = [
    selectCell,
    ...cellsAt(cells, visibleUnlockedIndexes),
    ...extraCells,
    ...cellsAt(cells, lockedIndexes),
  ];

  return cloneElement(element, {
    key: element.key ?? rowKey,
    onClick: (e: React.MouseEvent) => {
      element.props.onClick?.(e);
      if (!e.defaultPrevented) {
        handleClick(e);
      }
    },
    className: cn(
      className,
      selected && "erp-tr-selected",
      isFocused && "ring-2 ring-blue-500/40 bg-blue-50/30 dark:bg-blue-950/20",
      onRowClick && "cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60",
    ),
    children: nextChildren,
  });
}

function compareValues(a: unknown, b: unknown, dataType?: string): number {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;

  if (dataType === "number" || dataType === "currency") {
    const numA = typeof a === "number" ? a : parseFloat(String(a).replace(/[^0-9.-]+/g, "")) || 0;
    const numB = typeof b === "number" ? b : parseFloat(String(b).replace(/[^0-9.-]+/g, "")) || 0;
    return numA - numB;
  }

  if (dataType === "date" || dataType === "datetime") {
    const timeA = new Date(String(a)).getTime() || 0;
    const timeB = new Date(String(b)).getTime() || 0;
    return timeA - timeB;
  }

  if (typeof a === "boolean" && typeof b === "boolean") {
    return a === b ? 0 : a ? -1 : 1;
  }

  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: "base" });
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
  const [columnSearch, setColumnSearch] = useState("");
  const [importOpen, setImportOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [density, setDensity] = useState<"compact" | "normal">("normal");

  // Sorting state
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc" | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const columnsMenuRef = useRef<HTMLDivElement>(null);
  useClickOutside(columnsMenuRef, () => setColumnsOpen(false));

  useEffect(() => {
    saveListPreferences(listKey, { visibleKeys, filters });
  }, [listKey, visibleKeys, filters]);

  // Reset pagination on filter or sort change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, sortKey, sortDirection]);

  // 1. Filtered Rows
  const filteredRows = useMemo(() => applyListFilters(rows, filters), [rows, filters]);

  // 2. Sorted Rows
  const sortedRows = useMemo(() => {
    if (!sortKey || !sortDirection) return filteredRows;
    const col = allColumns.find((c) => c.key === sortKey);
    const dataType = col?.dataType;

    return [...filteredRows].sort((rowA, rowB) => {
      const valA = getRowFieldValue(rowA, sortKey);
      const valB = getRowFieldValue(rowB, sortKey);
      const result = compareValues(valA, valB, dataType);
      return sortDirection === "asc" ? result : -result;
    });
  }, [filteredRows, sortKey, sortDirection, allColumns]);

  // 3. Paginated Rows
  const totalRecords = sortedRows.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  const safePage = Math.min(currentPage, totalPages);

  const paginatedRows = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return sortedRows.slice(start, start + pageSize);
  }, [sortedRows, safePage, pageSize]);

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

  const selectedRows = sortedRows.filter((row, index) => selected.includes(rowIdOf(row, index, getRowId)));
  const allVisibleIds = paginatedRows.map((row, index) => rowIdOf(row, index, getRowId));
  const allSelected = allVisibleIds.length > 0 && allVisibleIds.every((id) => selected.includes(id));

  // Keyboard navigation hook on current page
  const { focusedIndex } = useTableKeyboardNav({
    rows: paginatedRows,
    onRowClick: (row) => onRowClick?.(row),
    onToggleSelect: (row, idx) => {
      const id = rowIdOf(row, idx, getRowId);
      setSelected((curr) => (curr.includes(id) ? curr.filter((item) => item !== id) : [...curr, id]));
    },
    enabled: true,
  });

  const handleSortToggle = (key: string) => {
    if (sortKey !== key) {
      setSortKey(key);
      setSortDirection("asc");
    } else if (sortDirection === "asc") {
      setSortDirection("desc");
    } else {
      setSortKey(null);
      setSortDirection(null);
    }
  };

  const builtInActions: ErpListBulkAction[] = [
    ...(onRefresh
      ? [{ key: "refresh", label: "Refresh", category: "data" as const, onClick: () => onRefresh() }]
      : []),
    {
      key: "export",
      label: selected.length > 0 ? `Export (${selected.length} selected)...` : "Export Data...",
      category: "data",
      onClick: () => setExportOpen(true),
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

  const filteredColumnsToCustomize = allColumns.filter((col) =>
    col.label.toLowerCase().includes(columnSearch.toLowerCase())
  );

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
            className={cn(erpButtonClassName.secondary, "cursor-pointer")}
            onClick={() => setImportOpen(true)}
            title="Bulk Import CSV data"
          >
            <UploadCloud className="h-3.5 w-3.5" />
            <span>Import CSV</span>
          </button>
        )}
        <button
          type="button"
          className={cn(erpButtonClassName.secondary, "cursor-pointer")}
          onClick={() => setExportOpen(true)}
          title="Export data (CSV, Excel, JSON)"
        >
          <Download className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Export</span>
        </button>
        <button
          type="button"
          title={density === "compact" ? "Switch to comfortable view" : "Switch to compact view"}
          className={cn(erpButtonClassName.secondary, "cursor-pointer")}
          onClick={() => setDensity((d) => (d === "compact" ? "normal" : "compact"))}
        >
          <Rows3 className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{density === "compact" ? "Compact" : "Comfortable"}</span>
        </button>

        {/* Popover Columns Customizer Menu */}
        <div className="relative" ref={columnsMenuRef}>
          <button
            type="button"
            className={cn(erpButtonClassName.secondary, "cursor-pointer", columnsOpen && "bg-slate-100 dark:bg-slate-800")}
            onClick={() => setColumnsOpen((value) => !value)}
            aria-expanded={columnsOpen}
            title="Configure visible columns"
          >
            <Columns3 className="h-3.5 w-3.5" />
            <span>Columns</span>
            <ChevronDown className="h-3 w-3 opacity-60" />
          </button>

          {columnsOpen && (
            <div className="absolute right-0 z-40 mt-1.5 w-64 rounded-xl border border-slate-200/90 bg-white p-3 shadow-xl dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Visible Columns
                </span>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:underline dark:text-blue-400 cursor-pointer"
                  onClick={() => setVisibleKeys(defaultVisibleKeys(allColumns))}
                >
                  <RotateCcw className="h-2.5 w-2.5" />
                  Reset
                </button>
              </div>

              {allColumns.length > 6 && (
                <div className="relative mb-2">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
                  <input
                    id="table-column-search-input"
                    name="table_column_search_input"
                    type="text"
                    value={columnSearch}
                    onChange={(e) => setColumnSearch(e.target.value)}
                    placeholder="Search columns…"
                    className="h-7 w-full rounded-md border border-slate-200 bg-slate-50 pl-7 pr-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              )}

              <div className="max-h-64 space-y-0.5 overflow-y-auto scrollbar-thin">
                {filteredColumnsToCustomize.map((column) => {
                  const active = visibleKeys.includes(column.key);
                  return (
                    <label
                      key={column.key}
                      className={cn(
                        "flex cursor-pointer items-center justify-between rounded-lg px-2 py-1.5 text-xs text-slate-700 transition hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/60 select-none",
                        column.locked && "cursor-not-allowed opacity-60",
                      )}
                    >
                      <span className="truncate pr-2">{column.label}</span>
                      <input
                        id={`column-visibility-${column.key}`}
                        name={`column_visibility_${column.key}`}
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
                        className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 cursor-pointer"
                      />
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </>
    ),
    table: (
      <div className="erp-table-wrap min-w-0 rounded-xl border border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900 transition-all">
        <div className="overflow-x-auto scrollbar-thin">
          {loading && rows.length === 0 ? (
            <div className="space-y-2 p-4" role="status">
              {Array.from({ length: 5 }, (_, index) => (
                <div key={index} className="h-9 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
              ))}
            </div>
          ) : (
            <table
              className={cn(
                "erp-table w-full border-collapse transition-all",
                density === "compact"
                  ? "[&_.erp-td]:py-1.5 [&_.erp-td]:text-xs [&_.erp-th]:py-1.5"
                  : "[&_.erp-td]:py-2.5 [&_.erp-td]:text-xs sm:[&_.erp-td]:text-sm [&_.erp-th]:py-2.5",
              )}
            >
              <thead className="erp-thead">
                <tr>
                  <th className="erp-th w-10 text-center">
                    <input
                      id="data-table-select-all"
                      name="data_table_select_all"
                      type="checkbox"
                      className="h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500/20 cursor-pointer"
                      checked={allSelected}
                      onChange={() => setSelected(allSelected ? [] : allVisibleIds)}
                      aria-label="Select all rows"
                    />
                  </th>
                  {headerColumns.map((column) => {
                    const isSortable = column.key !== "actions" && column.key !== "select" && column.key !== "_";
                    const isCurrentSort = sortKey === column.key;
                    const isRightAligned = column.dataType === "currency" || column.dataType === "number";

                    return (
                      <th
                        key={column.key}
                        className={cn(
                          "erp-th",
                          isRightAligned && "text-right",
                          column.className,
                        )}
                      >
                        {isSortable ? (
                          <button
                            type="button"
                            onClick={() => handleSortToggle(column.key)}
                            className={cn(
                              "group/th inline-flex items-center gap-1.5 font-bold uppercase tracking-wider transition-colors cursor-pointer select-none",
                              isRightAligned ? "w-full justify-end" : "justify-start",
                              isCurrentSort
                                ? "text-blue-600 dark:text-blue-400"
                                : "text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white",
                            )}
                            title={`Sort by ${column.label}`}
                          >
                            <span>{column.label}</span>
                            <span className="shrink-0">
                              {isCurrentSort && sortDirection === "asc" ? (
                                <ChevronUp className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                              ) : isCurrentSort && sortDirection === "desc" ? (
                                <ChevronDown className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                              ) : (
                                <ArrowUpDown className="h-3 w-3 text-slate-400 opacity-0 group-hover/th:opacity-80 transition-opacity" />
                              )}
                            </span>
                          </button>
                        ) : (
                          <span className={isRightAligned ? "block text-right" : ""}>{column.label}</span>
                        )}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {paginatedRows.map((row, index) => {
                  const id = rowIdOf(row, index, getRowId);
                  const extraCells = extraVisible.map((column) => (
                    <td
                      key={column.key}
                      className={cn(
                        "erp-td",
                        (column.dataType === "currency" || column.dataType === "number") && "erp-cell-num",
                      )}
                    >
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
                    onRowClick ? () => onRowClick(row) : undefined,
                  );
                })}
                {!loading && sortedRows.length === 0 ? (
                  <tr>
                    <td colSpan={headerColumns.length + 1} className="erp-td py-12 text-center">
                      <div className="mx-auto flex max-w-sm flex-col items-center gap-2.5 text-center">
                        <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-400 shadow-2xs">
                          <Inbox className="h-5 w-5" />
                        </span>
                        <div>
                          <p className="text-sm font-bold text-slate-900 dark:text-white">
                            No records in current view
                          </p>
                          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{emptyMessage}</p>
                        </div>
                        {emptyAction ? (
                          <div className="mt-2">{emptyAction}</div>
                        ) : onCreate ? (
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

        {/* Docked Table Pagination Footer */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-200/80 bg-slate-50/60 px-4 py-2.5 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-950/40">
          <div className="flex items-center gap-2">
            <span>
              Showing <strong className="font-semibold text-slate-800 dark:text-slate-200">{totalRecords > 0 ? (safePage - 1) * pageSize + 1 : 0}</strong> to{" "}
              <strong className="font-semibold text-slate-800 dark:text-slate-200">{Math.min(safePage * pageSize, totalRecords)}</strong> of{" "}
              <strong className="font-semibold text-slate-800 dark:text-slate-200">{totalRecords}</strong> entries
              {rows.length > totalRecords && (
                <span className="text-slate-400"> (filtered from {rows.length} total)</span>
              )}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-500">Rows:</span>
              <select
                id="datatable-pagesize"
                name="datatable_pagesize"
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                aria-label="Rows per page"
                className="h-7 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-700 shadow-2xs focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 cursor-pointer"
              >
                {[10, 25, 50, 100].map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={safePage <= 1}
                className="inline-flex h-7 items-center rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 shadow-2xs hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 cursor-pointer transition-colors"
              >
                Previous
              </button>

              <span className="px-2 text-xs font-bold text-slate-800 dark:text-slate-200 tabular-nums">
                {safePage} / {totalPages}
              </span>

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage >= totalPages}
                className="inline-flex h-7 items-center rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 shadow-2xs hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 cursor-pointer transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        </div>

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
          onExportCsv={() => setExportOpen(true)}
          onBulkDelete={onBulkDelete ? () => onBulkDelete(selectedRows) : undefined}
        />

        {/* Universal Multi-Format Export Modal */}
        <UniversalExportModal
          open={exportOpen}
          onOpenChange={setExportOpen}
          entityName={listKey || "Records"}
          columns={allColumns.map((col) => ({
            key: col.key,
            label: col.label,
            dataType: (col.dataType as DynamicColumn["dataType"]) || "string",
            hidden: !visibleKeys.includes(col.key),
          }))}
          filteredRecords={sortedRows}
          allRecords={rows}
          selectedIds={selected}
          idField="id"
        />
      </div>
    ),
    selectedCount: selected.length,
    selectedIds: selected,
    filteredCount: sortedRows.length,
    totalCount: totalRecords,
    currentPage: safePage,
    totalPages,
    setPage: setCurrentPage,
    sortKey,
    sortDirection,
    setSort: (key: string, dir: "asc" | "desc" | null) => {
      setSortKey(key);
      setSortDirection(dir);
    },
  };
}

/** Canonical alias for useErpListView */
export const useDataTable = useErpListView;
