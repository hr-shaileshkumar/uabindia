"use client";

import React, { useState, useMemo, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  Heart,
  MessageSquare,
  Pencil,
  Trash2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Download,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface ErpFrappeTableViewProps {
  rows: any[];
  columns: Array<{ key: string; label: string; width?: string; dataType?: string }>;
  idField?: string;
  onEdit?: (row: any) => void;
  onDelete?: (row: any) => void;
  onBulkDelete?: (ids: string[]) => void;
  onExportSelected?: (ids: string[]) => void;
  favorites: Record<string, boolean>;
  onToggleFavorite: (id: string) => void;
  onOpenComments?: (row: any) => void;
  getRelativeTime?: (row: any) => string;
  sortKey?: string;
  sortDirection?: "asc" | "desc";
  onSortChange?: (key: string, direction: "asc" | "desc") => void;
  renderCell?: (col: any, val: any, row: any) => React.ReactNode;
  isLoading?: boolean;
  emptyMessage?: string;
  totalRecords?: number;
  pageSize?: number;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  density?: "compact" | "normal" | "comfortable";
  enableVirtualization?: boolean;
  virtualScrollHeight?: number | string;
}

export function ErpFrappeTableView({
  rows,
  columns,
  idField = "id",
  onEdit,
  onDelete,
  onBulkDelete,
  onExportSelected,
  favorites,
  onToggleFavorite,
  onOpenComments,
  getRelativeTime,
  sortKey,
  sortDirection = "desc",
  onSortChange,
  renderCell,
  isLoading = false,
  emptyMessage = "No records found in current view.",
  totalRecords,
  pageSize = 10,
  currentPage = 1,
  onPageChange,
  onPageSizeChange,
  density = "normal",
  enableVirtualization,
  virtualScrollHeight,
}: ErpFrappeTableViewProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  // Filter out any artificial "actions" or "select" columns from table header
  const dataColumns = useMemo(
    () => columns.filter((c) => c.key !== "actions" && c.key !== "select" && c.key !== "_"),
    [columns]
  );

  // Pagination bounds
  const total = totalRecords ?? rows.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const paginatedRows = useMemo(() => {
    // If external pagination is used (totalRecords passed and different from rows.length), use rows as-is
    if (totalRecords !== undefined && totalRecords !== rows.length) {
      return rows;
    }
    return rows.slice(startIndex, startIndex + pageSize);
  }, [rows, totalRecords, startIndex, pageSize]);

  // High-volume virtualization configuration
  const isVirtual = Boolean(enableVirtualization ?? (paginatedRows.length > 50));

  const rowVirtualizer = useVirtualizer({
    count: paginatedRows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => (density === "compact" ? 36 : density === "comfortable" ? 52 : 44),
    overscan: 10,
    enabled: isVirtual,
  });

  const allVisibleIds = useMemo(
    () => paginatedRows.map((r, i) => String(r[idField] || r.id || i)),
    [paginatedRows, idField]
  );

  const allSelected = allVisibleIds.length > 0 && allVisibleIds.every((id) => selectedIds.includes(id));
  const someSelected = selectedIds.length > 0;

  const handleToggleAll = () => {
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(allVisibleIds);
    }
  };

  const handleToggleRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const virtualRows = rowVirtualizer.getVirtualItems();
  const totalVirtualSize = rowVirtualizer.getTotalSize();
  const paddingTop = virtualRows.length > 0 ? virtualRows[0].start : 0;
  const paddingBottom =
    virtualRows.length > 0
      ? totalVirtualSize - virtualRows[virtualRows.length - 1].end
      : 0;

  const renderRow = (
    row: any,
    rIdx: number,
    measureRef?: (el: HTMLTableRowElement | null) => void
  ) => {
    const rowId = String(row[idField] || row.id || row.code || rIdx);
    const isSelected = selectedIds.includes(rowId);
    const isFav = Boolean(favorites[rowId]);
    const relTime = getRelativeTime ? getRelativeTime(row) : `${(rIdx % 5) + 1} d`;
    const commentCount = row.commentCount ?? 0;

    const cellPaddingClass =
      density === "compact"
        ? "px-2.5 py-1.5 text-xs"
        : density === "comfortable"
        ? "px-4 py-3.5 text-sm"
        : "px-3.5 py-2.5 text-xs";

    const checkboxPaddingClass =
      density === "compact"
        ? "px-2 py-1.5"
        : density === "comfortable"
        ? "px-4 py-3.5"
        : "px-3.5 py-2.5";

    return (
      <tr
        key={rowId}
        ref={measureRef}
        data-index={rIdx}
        onClick={(e) => {
          const target = e.target as HTMLElement;
          if (target.closest("input") || target.closest("button") || target.closest("a")) {
            return;
          }
          if (onEdit) {
            onEdit(row);
          }
        }}
        className={cn(
          "group transition-colors",
          onEdit && "cursor-pointer",
          isSelected
            ? "bg-indigo-50/50 dark:bg-indigo-950/20"
            : "hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
        )}
      >
        {/* Checkbox cell */}
        <td className={cn("w-10 text-center", checkboxPaddingClass)}>
          <input
            id={`select-row-${rowId}`}
            name={`select_row_${rowId}`}
            type="checkbox"
            checked={isSelected}
            onChange={() => handleToggleRow(rowId)}
            className="h-3.5 w-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/20 cursor-pointer dark:border-slate-600 dark:bg-slate-800"
          />
        </td>

        {/* Data Cells */}
        {dataColumns.map((col, cIdx) => {
          const isFirst = cIdx === 0;
          const val = row[col.key];
          const rendered = renderCell ? renderCell(col, val, row) : null;

          return (
            <td
              key={col.key}
              style={col.width ? { width: col.width } : undefined}
              className={cn(cellPaddingClass, "text-slate-700 dark:text-slate-200")}
            >
              {isFirst && onEdit ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(row);
                  }}
                  className="font-semibold text-indigo-600 hover:text-indigo-800 hover:underline dark:text-indigo-400 dark:hover:text-indigo-300 text-left truncate inline-flex items-center gap-1.5 cursor-pointer max-w-full"
                >
                  {rendered !== null && rendered !== undefined ? (
                    rendered
                  ) : (
                    <span>{String(val ?? row.fullName ?? row.name ?? row.title ?? "-")}</span>
                  )}
                </button>
              ) : rendered !== null && rendered !== undefined ? (
                rendered
              ) : typeof val === "boolean" ? (
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold border shadow-2xs",
                    val
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                      : "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
                  )}
                >
                  {val ? <CheckCircle2 className="h-3 w-3 text-emerald-600" /> : <XCircle className="h-3 w-3 text-slate-400" />}
                  <span>{val ? "Yes" : "No"}</span>
                </span>
              ) : (
                <span className="truncate block max-w-[240px]">
                  {String(val ?? "-")}
                </span>
              )}
            </td>
          );
        })}

        {/* Far Right Action Column (Relative time, Comments, Heart, Edit, Delete) */}
        <td className={cn(cellPaddingClass, "text-right")}>
          <div className="flex items-center justify-end gap-2.5 text-slate-400 text-xs">
            {/* Relative timestamp */}
            <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium whitespace-nowrap">
              {relTime}
            </span>

            {/* Comments count badge */}
            <button
              type="button"
              onClick={() => onOpenComments?.(row)}
              className="inline-flex items-center gap-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
              title="View activity and comments"
            >
              <MessageSquare className="h-3 w-3" />
              <span className="text-[11px]">{commentCount}</span>
            </button>

            {/* Favorite Heart toggle */}
            <button
              type="button"
              onClick={() => onToggleFavorite(rowId)}
              className="p-0.5 text-slate-300 hover:text-rose-500 transition-colors cursor-pointer"
              title={isFav ? "Favorited" : "Mark as favorite"}
            >
              <Heart
                className={cn(
                  "h-3.5 w-3.5 transition-colors",
                  isFav ? "fill-rose-500 text-rose-500" : "text-slate-300 dark:text-slate-600 hover:text-rose-500"
                )}
              />
            </button>

            {/* Hover Quick Actions */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {onEdit && (
                <button
                  type="button"
                  onClick={() => onEdit(row)}
                  className="p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer"
                  title="Edit record"
                >
                  <Pencil className="h-3 w-3" />
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(row)}
                  className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                  title="Delete record"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div className="w-full rounded-xl border border-slate-200/90 bg-white shadow-2xs dark:border-slate-800 dark:bg-slate-900 overflow-hidden transition-all">
      {/* ── SELECTION ACTION BAR (Appears when rows are selected) ── */}
      {someSelected && (
        <div className="flex items-center justify-between bg-indigo-50/80 px-4 py-2 border-b border-indigo-100 dark:bg-indigo-950/40 dark:border-indigo-900/60 animate-in fade-in duration-100 text-xs">
          <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-200 font-semibold">
            <span className="inline-flex h-5 items-center justify-center rounded-full bg-indigo-600 px-2 text-[11px] font-bold text-white">
              {selectedIds.length}
            </span>
            <span>selected</span>
          </div>

          <div className="flex items-center gap-2">
            {onExportSelected && (
              <button
                type="button"
                onClick={() => onExportSelected(selectedIds)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-white px-2.5 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-50 dark:border-indigo-800 dark:bg-slate-900 dark:text-indigo-300 dark:hover:bg-slate-800 shadow-2xs cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Export Selected</span>
              </button>
            )}
            {onBulkDelete && (
              <button
                type="button"
                onClick={() => onBulkDelete(selectedIds)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-2.5 py-1 text-xs font-bold text-white hover:bg-rose-700 shadow-2xs cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete Selected</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 ml-1 cursor-pointer"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* ── MAIN TABLE ── */}
      <div
        ref={tableContainerRef}
        className={cn(
          "overflow-x-auto scrollbar-thin",
          isVirtual && "max-h-[600px] overflow-y-auto"
        )}
        style={isVirtual && virtualScrollHeight ? { maxHeight: virtualScrollHeight } : undefined}
      >
        <table className="w-full text-left text-xs border-collapse">
          <thead className={cn(isVirtual && "sticky top-0 z-10 shadow-2xs")}>
            <tr className="border-b border-slate-200/90 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-850 dark:text-slate-400 select-none">
              {/* Checkbox select-all column */}
              <th className="w-10 px-3.5 py-3 text-center">
                <input
                  id="erp-table-select-all"
                  name="select_all_rows"
                  type="checkbox"
                  checked={allSelected}
                  onChange={handleToggleAll}
                  className="h-3.5 w-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/20 cursor-pointer dark:border-slate-600 dark:bg-slate-800"
                  aria-label="Select all"
                />
              </th>

              {/* Data Columns */}
              {dataColumns.map((col) => {
                const isCurrentSort = sortKey === col.key;
                return (
                  <th
                    key={col.key}
                    style={col.width ? { width: col.width } : undefined}
                    className="px-3.5 py-3 font-bold"
                  >
                    {onSortChange ? (
                      <button
                        type="button"
                        onClick={() =>
                          onSortChange(
                            col.key,
                            isCurrentSort && sortDirection === "asc" ? "desc" : "asc"
                          )
                        }
                        className={cn(
                          "group inline-flex items-center gap-1.5 transition-colors cursor-pointer",
                          isCurrentSort
                            ? "text-slate-900 dark:text-white"
                            : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                        )}
                      >
                        <span>{col.label}</span>
                        {isCurrentSort ? (
                          sortDirection === "asc" ? (
                            <ArrowUp className="h-3 w-3 text-indigo-600 dark:text-indigo-400" />
                          ) : (
                            <ArrowDown className="h-3 w-3 text-indigo-600 dark:text-indigo-400" />
                          )
                        ) : (
                          <ArrowUpDown className="h-3 w-3 opacity-0 group-hover:opacity-70 transition-opacity" />
                        )}
                      </button>
                    ) : (
                      <span>{col.label}</span>
                    )}
                  </th>
                );
              })}

              {/* Far Right Header: Count & Meta */}
              <th className="px-4 py-3 text-right font-medium normal-case text-slate-400">
                <div className="flex items-center justify-end gap-1.5">
                  <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                    {total > 0
                      ? `${startIndex + 1}–${Math.min(startIndex + pageSize, total)} of ${total.toLocaleString()}`
                      : "0 records"}
                  </span>
                </div>
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {isLoading && paginatedRows.length === 0 ? (
              Array.from({ length: 4 }).map((_, idx) => (
                <tr key={idx} className="animate-pulse">
                  <td className="p-3.5 text-center">
                    <div className="h-4 w-4 bg-slate-200 dark:bg-slate-800 rounded mx-auto" />
                  </td>
                  {dataColumns.map((col) => (
                    <td key={col.key} className="p-3.5">
                      <div className="h-3.5 bg-slate-200 dark:bg-slate-800 rounded w-24" />
                    </td>
                  ))}
                  <td className="p-3.5">
                    <div className="h-3.5 bg-slate-200 dark:bg-slate-800 rounded w-16 ml-auto" />
                  </td>
                </tr>
              ))
            ) : paginatedRows.length === 0 ? (
              <tr>
                <td
                  colSpan={dataColumns.length + 2}
                  className="py-12 text-center text-xs text-slate-400 dark:text-slate-500"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : isVirtual ? (
              <>
                {paddingTop > 0 && (
                  <tr style={{ height: `${paddingTop}px` }}>
                    <td colSpan={dataColumns.length + 2} />
                  </tr>
                )}
                {virtualRows.map((virtualRow) => {
                  const row = paginatedRows[virtualRow.index];
                  return renderRow(row, virtualRow.index, rowVirtualizer.measureElement);
                })}
                {paddingBottom > 0 && (
                  <tr style={{ height: `${paddingBottom}px` }}>
                    <td colSpan={dataColumns.length + 2} />
                  </tr>
                )}
              </>
            ) : (
              paginatedRows.map((row, rIdx) => renderRow(row, rIdx))
            )}
          </tbody>
        </table>
      </div>

      {/* ── TABLE FOOTER: Pagination & Rows count ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200/90 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900 text-xs text-slate-500 dark:text-slate-400">
        <div>
          <span>
            Showing <strong className="text-slate-700 dark:text-slate-200">{total > 0 ? startIndex + 1 : 0}</strong> to{" "}
            <strong className="text-slate-700 dark:text-slate-200">
              {Math.min(startIndex + pageSize, total)}
            </strong>{" "}
            of <strong className="text-slate-700 dark:text-slate-200">{total.toLocaleString()}</strong> entries
          </span>
        </div>

        <div className="flex items-center gap-4">
          {/* Page Size Selector */}
          {onPageSizeChange && (
            <div className="flex items-center gap-1.5">
              <span>Rows:</span>
              <select
                id="erp-table-pagesize"
                name="erp_table_pagesize"
                aria-label="Rows per page"
                value={pageSize}
                onChange={(e) => onPageSizeChange(Number(e.target.value))}
                className="h-7 rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-700 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          )}

          {/* Previous / Next buttons */}
          {onPageChange && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => onPageChange(Math.max(safePage - 1, 1))}
                disabled={safePage <= 1}
                className="inline-flex h-7 items-center rounded-md border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 cursor-pointer shadow-2xs"
              >
                Previous
              </button>

              <span className="font-semibold text-slate-700 dark:text-slate-200 px-1">
                {safePage} / {totalPages}
              </span>

              <button
                type="button"
                onClick={() => onPageChange(Math.min(safePage + 1, totalPages))}
                disabled={safePage >= totalPages}
                className="inline-flex h-7 items-center rounded-md border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 cursor-pointer shadow-2xs"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
