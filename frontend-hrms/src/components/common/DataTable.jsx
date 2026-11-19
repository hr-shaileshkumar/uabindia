import React, { useState, useMemo } from "react";
import {
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  Pencil,
  Trash2,
  Inbox,
} from "lucide-react";
import StatusBadge from "./StatusBadge";

export const DataTable = ({
  columns = [],
  data = [],
  onRowClick,
  onEdit,
  onDelete,
  onAction,
  isLoading = false,
  emptyMessage = "No records found in this view",
  emptyActionLabel,
  onEmptyAction,
  pageSize: initialPageSize = 10,
}) => {
  const [sortKey, setSortKey] = useState(null);
  const [sortDirection, setSortDirection] = useState("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [selectedIds, setSelectedIds] = useState(new Set());

  const handleSort = (key) => {
    if (sortKey === key) {
      if (sortDirection === "asc") setSortDirection("desc");
      else {
        setSortKey(null);
        setSortDirection("asc");
      }
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  const sortedData = useMemo(() => {
    if (!sortKey) return data;
    return [...data].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (aVal === bVal) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;

      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
      }
      const strA = String(aVal).toLowerCase();
      const strB = String(bVal).toLowerCase();
      return sortDirection === "asc"
        ? strA.localeCompare(strB)
        : strB.localeCompare(strA);
    });
  }, [data, sortKey, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(sortedData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const toggleSelectAll = () => {
    if (selectedIds.size === paginatedData.length && paginatedData.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedData.map((d) => d.id || d.employeeCode)));
    }
  };

  const toggleSelectRow = (id) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const formatCellValue = (row, col) => {
    const val = row[col.key];
    if (col.render) return col.render(row);

    if (col.type === "badge" || col.key === "status") {
      return <StatusBadge status={val} />;
    }

    if (col.type === "currency") {
      if (val == null || val === "") return "—";
      return `₹ ${Number(val).toLocaleString("en-IN")}`;
    }

    if (col.type === "date") {
      if (!val) return "—";
      try {
        return new Date(val).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
      } catch (e) {
        return val;
      }
    }

    if (val === true) return <span className="text-emerald-600 font-semibold text-[11px]">Yes</span>;
    if (val === false) return <span className="text-slate-400 text-[11px]">No</span>;
    if (val == null || val === "") return <span className="text-slate-300">—</span>;

    return String(val);
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200/70 p-6 flex flex-col items-center justify-center space-y-2">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-slate-400 font-medium">Fetching live records from database...</span>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200/70 p-8 text-center shadow-2xs">
        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-2.5">
          <Inbox className="w-5 h-5" />
        </div>
        <h3 className="text-xs font-bold text-slate-800">{emptyMessage}</h3>
        <p className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto">
          No records in this database collection or none match your filter.
        </p>
        {emptyActionLabel && onEmptyAction && (
          <button
            onClick={onEmptyAction}
            className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-2xs transition-colors"
          >
            {emptyActionLabel}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden flex flex-col">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-bold select-none text-[10.5px] uppercase tracking-wider">
              <th className="w-8 px-2.5 py-2">
                <input
                  type="checkbox"
                  checked={selectedIds.size === paginatedData.length && paginatedData.length > 0}
                  onChange={toggleSelectAll}
                  className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500/20 accent-blue-600 cursor-pointer"
                />
              </th>
              {columns.map((col) => {
                const isSorted = sortKey === col.key;
                return (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    className="px-2.5 py-2 cursor-pointer hover:bg-slate-100/70 transition-colors"
                    style={{ width: col.width }}
                  >
                    <div className="flex items-center gap-1">
                      <span>{col.label}</span>
                      <span className="text-slate-400">
                        {isSorted ? (
                          sortDirection === "asc" ? (
                            <ChevronUp className="w-3 h-3 text-blue-600" />
                          ) : (
                            <ChevronDown className="w-3 h-3 text-blue-600" />
                          )
                        ) : (
                          <ChevronsUpDown className="w-3 h-3 opacity-30 hover:opacity-100" />
                        )}
                      </span>
                    </div>
                  </th>
                );
              })}
              <th className="px-2.5 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedData.map((row, idx) => {
              const rowId = row.id || row.employeeCode || `row-${idx}`;
              const isSelected = selectedIds.has(rowId);

              return (
                <tr
                  key={rowId}
                  className={`hover:bg-slate-50/80 transition-colors group ${
                    isSelected ? "bg-blue-50/30" : ""
                  }`}
                >
                  <td className="w-8 px-2.5 py-1.5">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelectRow(rowId)}
                      className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500/20 accent-blue-600 cursor-pointer"
                    />
                  </td>

                  {columns.map((col) => (
                    <td
                      key={col.key}
                      onClick={() => onRowClick && onRowClick(row)}
                      className={`px-2.5 py-1.5 text-xs text-slate-700 cursor-pointer leading-tight ${
                        col.type === "currency" || col.type === "number" ? "font-mono" : ""
                      }`}
                    >
                      {formatCellValue(row, col)}
                    </td>
                  ))}

                  <td className="px-2.5 py-1.5 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                      {onRowClick && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onRowClick(row);
                          }}
                          title="Inspect record"
                          className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-slate-100"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {onEdit && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEdit(row);
                          }}
                          title="Edit record"
                          className="p-1 rounded text-slate-400 hover:text-amber-600 hover:bg-slate-100"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(row);
                          }}
                          title="Delete record"
                          className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-slate-100"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="px-3 py-2 bg-slate-50/60 border-t border-slate-200/80 flex items-center justify-between text-[11px] text-slate-500">
        <div className="flex items-center gap-2.5">
          <span>
            Showing <strong className="text-slate-800">{(currentPage - 1) * pageSize + 1}</strong> to{" "}
            <strong className="text-slate-800">
              {Math.min(currentPage * pageSize, sortedData.length)}
            </strong>{" "}
            of <strong className="text-slate-800">{sortedData.length}</strong> records
          </span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[11px] focus:ring-1 focus:ring-blue-600 cursor-pointer"
          >
            <option value={10}>10 per page</option>
            <option value={20}>20 per page</option>
            <option value={50}>50 per page</option>
            <option value={100}>100 per page</option>
          </select>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-1 rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className="px-2 py-0.5 font-semibold text-slate-700">
            {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-1 rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default DataTable;
