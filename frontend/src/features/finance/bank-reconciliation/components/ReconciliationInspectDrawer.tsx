"use client";

import { Edit3 } from "lucide-react";
import { SideDrawer } from "@/components/ui/side-drawer";
import { formatCurrency, formatDateTime } from "@/lib/formatters";
import {
  STATUS_CONFIG,
  type ReconciliationRow,
} from "../types/reconciliation.types";

interface ReconciliationInspectDrawerProps {
  record: ReconciliationRow | null;
  onClose: () => void;
  canEdit: boolean;
  onEdit: (record: ReconciliationRow) => void;
}

export function ReconciliationInspectDrawer({
  record,
  onClose,
  canEdit,
  onEdit,
}: ReconciliationInspectDrawerProps) {
  return (
    <SideDrawer
      open={!!record}
      onClose={onClose}
      title="Bank Reconciliation Inspection"
      subtitle={record ? `${record.accountName} (${record.period})` : ""}
      width="lg"
    >
      {record && (
        <div className="space-y-6">
          {/* 3 Metric Cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Bank Statement</span>
              <span className="text-base font-mono font-bold text-slate-900 dark:text-slate-100">
                {formatCurrency(record.bankBalance || 0, "INR")}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">GL Book Balance</span>
              <span className="text-base font-mono font-bold text-slate-900 dark:text-slate-100">
                {formatCurrency(record.bookBalance || 0, "INR")}
              </span>
            </div>

            <div
              className={`p-3.5 rounded-xl border ${
                Math.abs(record.difference || 0) < 0.01
                  ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60"
                  : "bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/60"
              }`}
            >
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Variance Delta</span>
              <span
                className={`text-base font-mono font-bold ${
                  Math.abs(record.difference || 0) < 0.01
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-rose-600 dark:text-rose-400"
                }`}
              >
                {formatCurrency(Math.abs(record.difference || 0), "INR")}
              </span>
            </div>
          </div>

          {/* Detailed Parameters List */}
          <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            <div className="p-3 flex items-center justify-between">
              <span className="text-slate-500">Bank Account</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                {record.accountName} ({record.accountCode})
              </span>
            </div>
            <div className="p-3 flex items-center justify-between">
              <span className="text-slate-500">Fiscal Period</span>
              <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">
                {record.period}
              </span>
            </div>
            <div className="p-3 flex items-center justify-between">
              <span className="text-slate-500">Reconciliation Status</span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                  STATUS_CONFIG[record.status || "Pending"]?.chip
                }`}
              >
                {STATUS_CONFIG[record.status || "Pending"]?.label}
              </span>
            </div>
            <div className="p-3 flex items-center justify-between">
              <span className="text-slate-500">Last Reconciled</span>
              <span className="text-slate-700 dark:text-slate-300">
                {record.lastReconciled ? formatDateTime(record.lastReconciled) : "-"}
              </span>
            </div>
            <div className="p-3 flex items-center justify-between">
              <span className="text-slate-500">Created At</span>
              <span className="text-slate-700 dark:text-slate-300">
                {record.createdAt ? formatDateTime(record.createdAt) : "-"}
              </span>
            </div>
            {record.remarks && (
              <div className="p-3">
                <span className="text-slate-500 block mb-1">Audit Notes & Remarks</span>
                <p className="text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-lg">
                  {record.remarks}
                </p>
              </div>
            )}
          </div>

          {/* Quick Edit Action */}
          {canEdit && (
            <div className="flex justify-end gap-2 pt-4">
              <button
                type="button"
                onClick={() => onEdit(record)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <Edit3 className="w-4 h-4" />
                Edit Reconciliation Record
              </button>
            </div>
          )}
        </div>
      )}
    </SideDrawer>
  );
}
