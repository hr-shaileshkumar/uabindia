"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type TabItem = {
  key: string;
  label: string;
  count?: number;
};
export type ErpTabItem = TabItem;

/** Shared tab strip for multi-register pages (leave, reports, workspace). */
export function TabBar({
  tabs,
  active,
  onChange,
  className,
}: {
  tabs: TabItem[];
  active: string;
  onChange: (key: string) => void;
  className?: string;
}) {
  return (
    <div className={cn("border-b border-slate-200 bg-white px-4", className)}>
      <div className="flex flex-wrap gap-1">
        {tabs.map((tab) => {
          const selected = tab.key === active;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onChange(tab.key)}
              className={cn(
                "rounded-t-md border-b-2 px-3 py-2.5 text-xs font-semibold transition",
                selected
                  ? "border-slate-900 text-slate-900"
                  : "border-transparent text-slate-500 hover:border-slate-200 hover:text-slate-800",
              )}
            >
              {tab.label}
              {tab.count != null ? (
                <span className="ml-1.5 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600">
                  {tab.count}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function TabPanel({ children, hidden }: { children: ReactNode; hidden?: boolean }) {
  if (hidden) return null;
  return <div className="min-h-0">{children}</div>;
}

// Backward-compatible aliases
export const ErpTabBar = TabBar;
export const ErpTabPanel = TabPanel;
