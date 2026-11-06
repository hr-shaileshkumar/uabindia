"use client";

import { useRef, type ReactNode, type KeyboardEvent } from "react";
import { cn } from "@/lib/utils";

export type TabTone = "neutral" | "positive" | "warning" | "danger" | "info";

export type TabItem = {
  key: string;
  label: string;
  count?: number;
  tone?: TabTone;
  icon?: ReactNode;
  disabled?: boolean;
};
export type ErpTabItem = TabItem;

const badgeToneMap: Record<TabTone, string> = {
  neutral: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700",
  positive: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60",
  warning: "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800/60",
  danger: "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800/60",
  info: "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800/60",
};

/**
 * Enterprise TabBar component for workspace registers and multi-view pages.
 * Supports "underline" (standard register tabstrip) and "pills" (segmented control).
 */
export function TabBar({
  tabs,
  active,
  onChange,
  variant = "underline",
  size = "sm",
  className,
}: {
  tabs: TabItem[];
  active: string;
  onChange: (key: string) => void;
  variant?: "underline" | "pills";
  size?: "sm" | "md";
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();

    const enabledTabs = tabs.filter((t) => !t.disabled);
    const currentIndex = enabledTabs.findIndex((t) => t.key === active);
    if (currentIndex === -1) return;

    let nextIndex = currentIndex;
    if (e.key === "ArrowRight") {
      nextIndex = (currentIndex + 1) % enabledTabs.length;
    } else if (e.key === "ArrowLeft") {
      nextIndex = (currentIndex - 1 + enabledTabs.length) % enabledTabs.length;
    }

    const nextTab = enabledTabs[nextIndex];
    if (nextTab) {
      onChange(nextTab.key);
      const button = containerRef.current?.querySelector<HTMLButtonElement>(`button[data-tab-key="${nextTab.key}"]`);
      button?.focus();
    }
  };

  if (variant === "pills") {
    return (
      <div
        ref={containerRef}
        role="tablist"
        aria-orientation="horizontal"
        onKeyDown={handleKeyDown}
        className={cn(
          "inline-flex items-center gap-1 overflow-x-auto rounded-xl border border-slate-200/90 bg-slate-100/80 p-1 dark:border-slate-800 dark:bg-slate-900/90 scrollbar-none",
          className,
        )}
      >
        {tabs.map((tab) => {
          const selected = tab.key === active;
          const tone = tab.tone ?? (selected ? "info" : "neutral");

          return (
            <button
              key={tab.key}
              data-tab-key={tab.key}
              type="button"
              role="tab"
              aria-selected={selected}
              disabled={tab.disabled}
              onClick={() => onChange(tab.key)}
              className={cn(
                "group inline-flex items-center gap-2 rounded-lg font-semibold transition-all whitespace-nowrap select-none disabled:pointer-events-none disabled:opacity-40 cursor-pointer",
                size === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm",
                selected
                  ? "bg-white text-slate-900 shadow-xs ring-1 ring-slate-200/80 font-bold dark:bg-slate-800 dark:text-white dark:ring-slate-700"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/60 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800/40",
              )}
            >
              {tab.icon && (
                <span className={cn("shrink-0 transition-colors", selected ? "text-blue-600 dark:text-blue-400" : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300")}>
                  {tab.icon}
                </span>
              )}
              <span>{tab.label}</span>
              {tab.count != null ? (
                <span
                  className={cn(
                    "inline-flex items-center justify-center rounded-full border px-1.5 py-0.2 text-[10px] font-bold tabular-nums",
                    badgeToneMap[tone],
                  )}
                >
                  {tab.count}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      role="tablist"
      aria-orientation="horizontal"
      onKeyDown={handleKeyDown}
      className={cn(
        "relative flex w-full items-center border-b border-slate-200/90 bg-white/70 px-2 sm:px-4 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/70 rounded-xl overflow-hidden shadow-2xs",
        className,
      )}
    >
      <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto scrollbar-none py-0.5">
        {tabs.map((tab) => {
          const selected = tab.key === active;
          const tone = tab.tone ?? (selected ? "info" : "neutral");

          return (
            <button
              key={tab.key}
              data-tab-key={tab.key}
              type="button"
              role="tab"
              aria-selected={selected}
              disabled={tab.disabled}
              onClick={() => onChange(tab.key)}
              className={cn(
                "group relative inline-flex items-center gap-2 border-b-2 px-3 sm:px-3.5 py-2.5 font-semibold transition-all whitespace-nowrap select-none disabled:pointer-events-none disabled:opacity-40 cursor-pointer",
                size === "sm" ? "text-xs" : "text-sm",
                selected
                  ? "border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-400 font-bold"
                  : "border-transparent text-slate-600 hover:border-slate-300 hover:text-slate-900 dark:text-slate-400 dark:hover:border-slate-700 dark:hover:text-slate-200",
              )}
            >
              {tab.icon && (
                <span className={cn("shrink-0 transition-colors", selected ? "text-blue-600 dark:text-blue-400" : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300")}>
                  {tab.icon}
                </span>
              )}
              <span>{tab.label}</span>
              {tab.count != null ? (
                <span
                  className={cn(
                    "inline-flex items-center justify-center rounded-full border px-1.5 py-0.2 text-[10px] font-bold tabular-nums transition-colors",
                    badgeToneMap[tone],
                  )}
                >
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

export function TabPanel({
  children,
  hidden,
  className,
}: {
  children: ReactNode;
  hidden?: boolean;
  className?: string;
}) {
  if (hidden) return null;
  return (
    <div role="tabpanel" className={cn("min-h-0 focus-visible:outline-none", className)}>
      {children}
    </div>
  );
}

// Backward-compatible aliases
export const ErpTabBar = TabBar;
export const ErpTabPanel = TabPanel;

