"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Calendar,
  Lock,
  Unlock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Clock,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  FileText,
  X,
} from "lucide-react";
import apiClient from "@/services/apiClient";
import { notifySuccess, notifyError } from "@/lib/notifications";
import { getApiErrorMessage } from "@/lib/api-errors";

interface AccountingPeriodRow {
  id?: string;
  year: number;
  month: number;
  isClosed: boolean;
  closedAt?: string | null;
  closedBy?: string | null;
  notes?: string | null;
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

// Indian Financial Year display order: April (Month 4) to March (Month 3)
const INDIAN_FY_MONTH_ORDER = [4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3];

export function AccountingPeriodsStudio() {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [periods, setPeriods] = useState<AccountingPeriodRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  // Modal for adding audit notes when locking a period
  const [modalPeriod, setModalPeriod] = useState<number | null>(null);
  const [auditNotes, setAuditNotes] = useState<string>("");

  const loadPeriods = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiClient.get<{ year: number; periods: AccountingPeriodRow[] }>(
        `/finance/periods?year=${selectedYear}`
      );
      setPeriods(res.data?.periods || []);
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to load accounting periods"));
    } finally {
      setLoading(false);
    }
  }, [selectedYear]);

  useEffect(() => {
    void loadPeriods();
  }, [loadPeriods]);

  // Lock a period
  const handleLockPeriod = async () => {
    if (modalPeriod === null) return;
    try {
      setActionLoading(modalPeriod);
      await apiClient.post("/finance/periods/close", {
        year: selectedYear,
        month: modalPeriod,
        notes: auditNotes.trim() || `Month-end financial lock executed for ${MONTH_NAMES[modalPeriod - 1]} ${selectedYear}`,
      });
      notifySuccess(`Locked accounting period for ${MONTH_NAMES[modalPeriod - 1]} ${selectedYear}`);
      setModalPeriod(null);
      setAuditNotes("");
      await loadPeriods();
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to lock accounting period"));
    } finally {
      setActionLoading(null);
    }
  };

  // Reopen a period
  const handleReopenPeriod = async (month: number) => {
    if (!confirm(`Are you sure you want to reopen ${MONTH_NAMES[month - 1]} ${selectedYear}? This will allow transactions to be posted to this period.`)) {
      return;
    }
    try {
      setActionLoading(month);
      await apiClient.post("/finance/periods/reopen", {
        year: selectedYear,
        month,
      });
      notifySuccess(`Reopened accounting period for ${MONTH_NAMES[month - 1]} ${selectedYear}`);
      await loadPeriods();
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to reopen accounting period"));
    } finally {
      setActionLoading(null);
    }
  };

  // Map periods by month number
  const periodsByMonth = useMemo(() => {
    const map = new Map<number, AccountingPeriodRow>();
    periods.forEach((p) => map.set(p.month, p));
    return map;
  }, [periods]);

  const closedCount = periods.filter((p) => p.isClosed).length;
  const openCount = 12 - closedCount;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
            <Calendar className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Fiscal Accounting Period Studio
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Lock financial months to freeze General Ledger journals, invoices, and expense postings from backdating.
            </p>
          </div>
        </div>

        {/* Year Navigator */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedYear((y) => y - 1)}
            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 text-slate-600 dark:text-slate-300 transition"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="font-bold text-sm px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100">
            Fiscal Year {selectedYear}
          </span>
          <button
            onClick={() => setSelectedYear((y) => y + 1)}
            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 text-slate-600 dark:text-slate-300 transition"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <button
            onClick={() => void loadPeriods()}
            disabled={loading}
            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 text-slate-600 dark:text-slate-300 transition disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Open Periods</span>
            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{openCount} Months</span>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
            <Unlock className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Locked / Closed</span>
            <span className="text-2xl font-bold text-rose-600 dark:text-rose-400">{closedCount} Months</span>
          </div>
          <div className="p-3 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
            <Lock className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Active Month</span>
            <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {MONTH_NAMES[currentMonth - 1]} {currentYear}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
            <ShieldCheck className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* 12-Month Calendar Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {INDIAN_FY_MONTH_ORDER.map((monthNum) => {
          const row = periodsByMonth.get(monthNum);
          const isClosed = row?.isClosed ?? false;
          const isCurrent = selectedYear === currentYear && monthNum === currentMonth;
          const isActionBusy = actionLoading === monthNum;

          return (
            <div
              key={monthNum}
              className={`rounded-2xl border p-5 transition flex flex-col justify-between space-y-4 ${
                isClosed
                  ? "border-rose-200 bg-rose-50/30 dark:border-rose-900/40 dark:bg-rose-950/10"
                  : isCurrent
                  ? "border-blue-300 bg-blue-50/20 dark:border-blue-800 dark:bg-blue-950/10 shadow-xs"
                  : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {MONTH_NAMES[monthNum - 1]}
                  </span>
                  {isClosed ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800">
                      <Lock className="h-2.5 w-2.5" />
                      LOCKED
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800">
                      <Unlock className="h-2.5 w-2.5" />
                      OPEN
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {isCurrent ? "Current operational month" : `Calendar Period M${monthNum}`}
                </p>

                {row?.closedAt && (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-500 space-y-0.5">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-slate-400" />
                      <span>{new Date(row.closedAt).toLocaleDateString()}</span>
                    </div>
                    {row.notes && <p className="italic text-slate-400 text-[10px] line-clamp-2">&ldquo;{row.notes}&rdquo;</p>}
                  </div>
                )}
              </div>

              {/* Action Button */}
              <div className="pt-2">
                {isClosed ? (
                  <button
                    onClick={() => handleReopenPeriod(monthNum)}
                    disabled={isActionBusy}
                    className="w-full py-2 px-3 rounded-xl border border-slate-200 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold transition inline-flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {isActionBusy ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Unlock className="h-3 w-3" />}
                    <span>Reopen Period</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setModalPeriod(monthNum);
                      setAuditNotes("");
                    }}
                    disabled={isActionBusy}
                    className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:hover:bg-white dark:text-slate-900 text-xs font-semibold shadow-2xs transition inline-flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <Lock className="h-3 w-3" />
                    <span>Lock Period</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Lock Confirmation Modal with Audit Notes */}
      {modalPeriod !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 dark:bg-slate-900 dark:border-slate-800 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
                  <Lock className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Lock {MONTH_NAMES[modalPeriod - 1]} {selectedYear}
                </h3>
              </div>
              <button
                onClick={() => setModalPeriod(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400">
              Locking this accounting period will freeze all general ledger postings, sales invoices, and vendor bills. No user will be able to create or edit records backdated to this period.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Audit Remarks (Optional)
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Month-end financial close verified by Audit Team..."
                value={auditNotes}
                onChange={(e) => setAuditNotes(e.target.value)}
                className="w-full p-2.5 text-xs rounded-xl border border-slate-200 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setModalPeriod(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleLockPeriod}
                disabled={actionLoading !== null}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-2xs transition inline-flex items-center gap-1.5 disabled:opacity-50"
              >
                {actionLoading !== null ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Lock className="h-3.5 w-3.5" />}
                <span>Confirm & Lock Period</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
