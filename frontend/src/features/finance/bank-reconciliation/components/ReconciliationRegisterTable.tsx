"use client";

import {
  AlertCircle,
  ArrowDownRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Eye,
  Landmark,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";
import { formatCurrency, formatDateTime } from "@/lib/formatters";
import {
  STATUS_CONFIG,
  type ReconciliationRow,
} from "../types/reconciliation.types";

interface ReconciliationRegisterTableProps {
  records: ReconciliationRow[];
  totalFilteredCount: number;
  loading: boolean;
  search: string;
  onSearchChange: (val: string) => void;
  statusFilter: string;
  onStatusFilterChange: (val: string) => void;
  varianceFilter: string;
  onVarianceFilterChange: (val: string) => void;
  periodFilter: string;
  onPeriodFilterChange: (val: string) => void;
  onClearFilters: () => void;
  hasFilters: boolean;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  onOpenCreate: () => void;
  onInspect: (record: ReconciliationRow) => void;
  onEdit: (record: ReconciliationRow) => void;
  onDelete: (record: ReconciliationRow) => void;
}

export function ReconciliationRegisterTable({
  records,
  totalFilteredCount,
  loading,
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  varianceFilter,
  onVarianceFilterChange,
  periodFilter,
  onPeriodFilterChange,
  onClearFilters,
  hasFilters,
  currentPage,
  totalPages,
  onPageChange,
  canCreate,
  canEdit,
  canDelete,
  onOpenCreate,
  onInspect,
  onEdit,
  onDelete,
}: ReconciliationRegisterTableProps) {
  return (
    <div className="space-y-4">
      {/* Multi-Criteria Filter Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by bank account name, code, or remarks..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value)}
          className="py-2 px-3 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition cursor-pointer"
        >
          <option value="">All Statuses</option>
          <option value="Matched">Zero-Delta Matched</option>
          <option value="Partial">Partial Match</option>
          <option value="Unmatched">Unmatched Discrepancy</option>
          <option value="Pending">Pending Review</option>
        </select>

        <select
          value={varianceFilter}
          onChange={(e) => onVarianceFilterChange(e.target.value)}
          className="py-2 px-3 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition cursor-pointer"
        >
          <option value="">All Variances</option>
          <option value="zero">Zero Variance Only (Delta = 0)</option>
          <option value="gap">Has Discrepancy (Delta != 0)</option>
        </select>

        <input
          type="month"
          value={periodFilter}
          onChange={(e) => onPeriodFilterChange(e.target.value)}
          className="py-1.5 px-3 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition cursor-pointer"
          title="Filter by Fiscal Period Month"
        />

        {hasFilters && (
          <button
            type="button"
            onClick={onClearFilters}
            className="text-xs font-semibold px-3 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Table Container */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50/75 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <tr>
                <th className="py-3 px-4">Bank GL Account</th>
                <th className="py-3 px-4">Fiscal Period</th>
                <th className="py-3 px-4 text-right">Bank Statement Balance</th>
                <th className="py-3 px-4 text-right">GL Book Balance</th>
                <th className="py-3 px-4 text-right">Variance / Delta</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4">Last Reconciled</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 dark:text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="w-6 h-6 animate-spin text-indigo-500" />
                      <span>Loading bank reconciliation ledgers...</span>
                    </div>
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500 dark:text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                        <Landmark className="w-6 h-6" />
                      </div>
                      <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                        No Bank Reconciliations Found
                      </div>
                      <p className="text-xs text-slate-400 max-w-sm">
                        {hasFilters
                          ? "No statements matched your filter parameters. Try clearing your filters."
                          : "Start your first bank reconciliation or import an electronic statement feed to compare bank balances against the general ledger."}
                      </p>
                      {canCreate && (
                        <button
                          type="button"
                          onClick={onOpenCreate}
                          className="mt-2 text-xs font-semibold px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition cursor-pointer"
                        >
                          New Reconciliation
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                records.map((r) => {
                  const cfg = STATUS_CONFIG[r.status || "Pending"] || STATUS_CONFIG.Pending;
                  const hasGap = Math.abs(r.difference || 0) >= 0.01;
                  return (
                    <tr
                      key={r.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group cursor-pointer"
                      onClick={() => onInspect(r)}
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-100 dark:border-indigo-900/40">
                            <Landmark className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                              {r.accountName || "Bank Account"}
                            </div>
                            <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                              <span>{r.accountCode || "AC-LEDGER"}</span>
                              {r.remarks && (
                                <span
                                  className="truncate max-w-[180px] text-slate-400"
                                  title={r.remarks}
                                >
                                  • {r.remarks}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-300">
                        {r.period || "-"}
                      </td>

                      <td className="py-3.5 px-4 text-right font-medium text-slate-900 dark:text-slate-100 font-mono">
                        {formatCurrency(r.bankBalance || 0, "INR")}
                      </td>

                      <td className="py-3.5 px-4 text-right font-medium text-slate-600 dark:text-slate-300 font-mono">
                        {formatCurrency(r.bookBalance || 0, "INR")}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div
                          className={`font-mono font-bold flex items-center justify-end gap-1 ${
                            hasGap ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"
                          }`}
                        >
                          {hasGap ? (
                            <>
                              <ArrowDownRight className="w-3.5 h-3.5" />
                              <span>{formatCurrency(Math.abs(r.difference || 0), "INR")}</span>
                            </>
                          ) : (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>₹0.00</span>
                            </>
                          )}
                        </div>
                        {hasGap && (
                          <div className="text-[10px] text-rose-500/80 dark:text-rose-400/80">
                            {(r.difference || 0) > 0 ? "Bank > Book" : "Book > Bank"}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${cfg.chip}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                          {cfg.label}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-[11px] text-slate-500 dark:text-slate-400">
                        {r.lastReconciled ? formatDateTime(r.lastReconciled) : "-"}
                      </td>

                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => onInspect(r)}
                            title="Inspect Reconciliation Details"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {canEdit && (
                            <button
                              type="button"
                              onClick={() => onEdit(r)}
                              title="Edit Reconciliation"
                              className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                          )}

                          {canDelete && (
                            <button
                              type="button"
                              onClick={() => onDelete(r)}
                              title="Delete Record"
                              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <div>
              Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong> (
              {totalFilteredCount} records)
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
