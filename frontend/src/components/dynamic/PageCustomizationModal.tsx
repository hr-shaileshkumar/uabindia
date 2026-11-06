"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Sliders, Eye, EyeOff, RotateCcw, LayoutTemplate, Check } from "lucide-react";
import type { DynamicColumn } from "@/lib/dynamic-schema/types";
import type { RowDensity } from "@/store/pageCustomizationStore";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface PageCustomizationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pageKey: string;
  columns: DynamicColumn[];
  hiddenColumnKeys: string[];
  onToggleColumn: (key: string) => void;
  onResetColumns: () => void;
  density: RowDensity;
  onDensityChange: (density: RowDensity) => void;
  isSuperAdmin?: boolean;
}

export function PageCustomizationModal({
  open,
  onOpenChange,
  pageKey,
  columns,
  hiddenColumnKeys,
  onToggleColumn,
  onResetColumns,
  density,
  onDensityChange,
  isSuperAdmin,
}: PageCustomizationModalProps) {
  const router = useRouter();

  // Filter out system columns like actions
  const customColumns = columns.filter(
    (c) => c.key !== "actions" && c.key !== "_" && c.key !== "select"
  );

  const densities: Array<{ id: RowDensity; label: string; desc: string }> = [
    { id: "compact", label: "Compact", desc: "Dense table spacing for high-data workflows" },
    { id: "normal", label: "Normal", desc: "Default balanced row height and padding" },
    { id: "comfortable", label: "Comfortable", desc: "Spacious row heights with enhanced touch targets" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl border border-slate-200 bg-white p-0 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        <DialogHeader className="border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
              <Sliders className="h-4.5 w-4.5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-slate-900 dark:text-white">
                Customize Table & View
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
                Personalize column visibility and display density for this page.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="max-h-[65vh] overflow-y-auto px-6 py-4 space-y-5">
          {/* Row Density Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Row Density
            </label>
            <div className="grid grid-cols-3 gap-2">
              {densities.map((d) => {
                const isSelected = density === d.id;
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => onDensityChange(d.id)}
                    className={cn(
                      "flex flex-col items-center justify-center rounded-xl border p-2.5 text-center transition-all cursor-pointer",
                      isSelected
                        ? "border-indigo-600 bg-indigo-50/70 text-indigo-900 dark:border-indigo-500 dark:bg-indigo-950/40 dark:text-indigo-200 shadow-2xs font-semibold"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700/60"
                    )}
                  >
                    <span className="text-xs">{d.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Column Visibility Toggles */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Visible Columns ({customColumns.length - hiddenColumnKeys.length} of {customColumns.length})
              </label>
              <button
                type="button"
                onClick={onResetColumns}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 cursor-pointer"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Reset to Default</span>
              </button>
            </div>

            <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 dark:divide-slate-800 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 overflow-hidden">
              {customColumns.map((col) => {
                const isHidden = hiddenColumnKeys.includes(col.key);
                return (
                  <div
                    key={col.key}
                    onClick={() => onToggleColumn(col.key)}
                    className="flex items-center justify-between px-3.5 py-2.5 hover:bg-white dark:hover:bg-slate-800/80 transition-colors cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-slate-700 dark:text-slate-200">
                        {col.label}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        ({col.key})
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {isHidden ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                          <EyeOff className="h-3 w-3" /> Hidden
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-300">
                          <Eye className="h-3 w-3" /> Visible
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Admin Studio Navigation */}
          {isSuperAdmin && (
            <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-3.5 dark:border-indigo-900/50 dark:bg-indigo-950/20 space-y-2">
              <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-200">
                <LayoutTemplate className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                <span className="text-xs font-bold">Visual Page Builder</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                Drag and drop fields, create new form tabs, and manage versioning for this page in Schema Master.
              </p>
              <button
                type="button"
                onClick={() => {
                  onOpenChange(false);
                  router.push(`/administration/schema-master?pageKey=${pageKey}`);
                }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-700 transition-colors cursor-pointer shadow-2xs"
              >
                <span>Open in Schema Master</span>
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50 px-6 py-3.5 dark:border-slate-800 dark:bg-slate-850">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 transition-colors cursor-pointer shadow-xs"
          >
            Apply & Close
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
