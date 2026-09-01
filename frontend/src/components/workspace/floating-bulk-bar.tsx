"use client";

import { type ReactNode } from "react";
import { Download, Trash2, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

type FloatingBulkBarProps = {
  selectedCount: number;
  onDeselectAll: () => void;
  onExportCsv?: () => void;
  onBulkDelete?: () => void;
  actions?: {
    label: string;
    icon?: ReactNode;
    onClick: () => void;
    tone?: "primary" | "danger" | "secondary";
  }[];
};

export function ErpFloatingBulkBar({
  selectedCount,
  onDeselectAll,
  onExportCsv,
  onBulkDelete,
  actions = [],
}: FloatingBulkBarProps) {
  return (
    <AnimatePresence>
      {selectedCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.18 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-white shadow-2xl backdrop-blur-md"
        >
          {/* Selected Count Tag */}
          <div className="flex items-center gap-2 border-r border-slate-700 pr-3">
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-indigo-500 px-1.5 text-[11px] font-bold text-white">
              {selectedCount}
            </span>
            <span className="text-xs font-medium text-slate-200">Selected</span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5">
            {onExportCsv && (
              <button
                type="button"
                onClick={onExportCsv}
                className="inline-flex h-7 items-center gap-1 rounded-full bg-slate-800 px-3 text-xs font-medium text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
              >
                <Download className="h-3 w-3" />
                Export CSV
              </button>
            )}

            {actions.map((action, i) => (
              <button
                key={i}
                type="button"
                onClick={action.onClick}
                className="inline-flex h-7 items-center gap-1 rounded-full bg-slate-800 px-3 text-xs font-medium text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
              >
                {action.icon}
                {action.label}
              </button>
            ))}

            {onBulkDelete && (
              <button
                type="button"
                onClick={onBulkDelete}
                className="inline-flex h-7 items-center gap-1 rounded-full bg-rose-900/60 border border-rose-700/50 px-3 text-xs font-medium text-rose-200 hover:bg-rose-800 transition-colors"
              >
                <Trash2 className="h-3 w-3" />
                Delete
              </button>
            )}
          </div>

          {/* Deselect All */}
          <button
            type="button"
            onClick={onDeselectAll}
            title="Clear selection"
            aria-label="Clear selection"
            className="ml-1 inline-flex h-6 w-6 items-center justify-center rounded-full text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
