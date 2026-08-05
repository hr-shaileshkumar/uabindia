"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

export interface DetailTabItem {
  id: string;
  label: string;
  badge?: number | string;
  content: ReactNode;
}

export interface DetailViewProps {
  title: string;
  subtitle?: string;
  code?: string;
  status?: ReactNode;
  headerActions?: ReactNode;
  tabs: DetailTabItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  onBack?: () => void;
}

export function DetailView({
  title,
  subtitle,
  code,
  status,
  headerActions,
  tabs,
  activeTab,
  onTabChange,
  onBack,
}: DetailViewProps) {
  const currentTab = tabs.find((t) => t.id === activeTab) || tabs[0];

  return (
    <div className="space-y-5">
      {/* Detail Summary Card Banner */}
      <section className="overflow-hidden rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 py-5 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              {onBack ? (
                <Button variant="ghost" size="sm" onClick={onBack} className="h-8 px-2 text-slate-500">
                  ← Back
                </Button>
              ) : null}
              {code ? (
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold">
                  {code}
                </span>
              ) : null}
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{title}</h1>
              {status}
            </div>
            {subtitle ? <p className="text-sm text-slate-500 max-w-3xl">{subtitle}</p> : null}
          </div>

          {headerActions ? <div className="flex items-center gap-2">{headerActions}</div> : null}
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 dark:border-slate-800 pt-3">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition ${
                activeTab === tab.id
                  ? "bg-indigo-600 text-white shadow-2xs"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
              }`}
            >
              {tab.label}
              {tab.badge !== undefined ? (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 text-current font-bold">
                  {tab.badge}
                </span>
              ) : null}
            </button>
          ))}
        </div>
      </section>

      {/* Active Tab Workspace */}
      <section className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs min-h-[300px]">
        {currentTab?.content}
      </section>
    </div>
  );
}
