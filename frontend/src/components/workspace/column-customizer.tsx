"use client";

import { useState, useRef, useEffect } from "react";
import { Columns3, Search, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

export type ColumnItem = {
  key: string;
  label: string;
  locked?: boolean;
};

export interface ColumnCustomizerProps {
  columns: ColumnItem[];
  visibleKeys: string[];
  onToggle: (key: string) => void;
  onShowAll: () => void;
  onReset: () => void;
}

export function ColumnCustomizer({
  columns,
  visibleKeys,
  onToggle,
  onShowAll,
  onReset,
}: ColumnCustomizerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const visible = new Set(visibleKeys);
  const filtered = columns.filter((col) =>
    col.label.toLowerCase().includes(query.toLowerCase()),
  );

  const shownCount = visibleKeys.filter((key) =>
    columns.some((c) => c.key === key && !c.locked),
  ).length;

  return (
    <div ref={popoverRef} className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-label="Customize columns"
        className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
      >
        <Columns3 className="h-3.5 w-3.5 text-slate-500" />
        <span>Columns</span>
        <span className="inline-flex items-center justify-center rounded-full bg-slate-100 px-1.5 py-0.2 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
          {shownCount}
        </span>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1.5 w-64 origin-top-right rounded-xl border border-slate-200 bg-white p-2 shadow-xl animate-in fade-in zoom-in-95 duration-150 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2 px-1 dark:border-slate-800">
            <span className="text-xs font-bold text-slate-900 dark:text-white">
              Toggle Columns
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              {shownCount} of {columns.filter((c) => !c.locked).length} active
            </span>
          </div>

          <div className="relative mt-2 mb-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Find column..."
              className="h-7.5 w-full rounded-lg border border-slate-200 bg-slate-50/60 pl-8 pr-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
            />
          </div>

          <div className="max-h-52 overflow-y-auto space-y-0.5 py-1 scrollbar-thin">
            {filtered.map((column) => {
              const isChecked = column.locked || visible.has(column.key);
              return (
                <label
                  key={column.key}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-xs cursor-pointer select-none transition-colors",
                    column.locked
                      ? "opacity-50 cursor-not-allowed text-slate-400"
                      : "hover:bg-slate-50 text-slate-700 dark:hover:bg-slate-800 dark:text-slate-300",
                  )}
                >
                  <input
                    type="checkbox"
                    disabled={column.locked}
                    checked={isChecked}
                    onChange={() => onToggle(column.key)}
                    className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-slate-700"
                  />
                  <span className="truncate flex-1 font-medium">{column.label}</span>
                  {column.locked && (
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                      Required
                    </span>
                  )}
                </label>
              );
            })}
          </div>

          <div className="flex items-center justify-between border-t border-slate-100 pt-2 px-1 dark:border-slate-800">
            <button
              type="button"
              onClick={onShowAll}
              className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
            >
              Show All
            </button>
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            >
              <RotateCcw className="h-3 w-3" />
              Reset
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
