"use client";

import { FileSpreadsheet, Landmark, UploadCloud } from "lucide-react";
import type { ViewTab } from "../types/reconciliation.types";

interface ReconciliationToolbarProps {
  activeTab: ViewTab;
  onTabChange: (tab: ViewTab) => void;
  recordsCount: number;
  accountsCount: number;
  filteredCount: number;
}

export function ReconciliationToolbar({
  activeTab,
  onTabChange,
  recordsCount,
  accountsCount,
  filteredCount,
}: ReconciliationToolbarProps) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
      <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
        <button
          type="button"
          onClick={() => onTabChange("register")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === "register"
              ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          Reconciliation Register
          <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
            {recordsCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onTabChange("feeds")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === "feeds"
              ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
          }`}
        >
          <UploadCloud className="w-4 h-4" />
          Electronic Bank Feed Studio
          <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300">
            OFX • MT940 • CSV
          </span>
        </button>

        <button
          type="button"
          onClick={() => onTabChange("treasury")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === "treasury"
              ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
          }`}
        >
          <Landmark className="w-4 h-4" />
          Treasury GL Ledgers
          <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
            {accountsCount}
          </span>
        </button>
      </div>

      {activeTab === "register" && (
        <div className="text-xs text-slate-500 dark:text-slate-400">
          Showing <strong className="text-slate-800 dark:text-slate-200">{filteredCount}</strong> of{" "}
          {recordsCount} statement balances
        </div>
      )}
    </div>
  );
}
