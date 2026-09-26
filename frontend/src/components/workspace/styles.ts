/* Workspace & Design System Styles — aligned with enterprise SaaS standards */

export const buttonClassName = {
  primary:
    "inline-flex h-8 items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 text-xs font-semibold text-white shadow-xs transition-all hover:bg-blue-700 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  secondary:
    "inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-xs transition-all hover:border-slate-300 hover:bg-slate-50 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-700 dark:hover:bg-slate-800",
  ghost:
    "inline-flex h-8 items-center justify-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 disabled:pointer-events-none disabled:opacity-50 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100",
  outline:
    "inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-transparent px-3 text-xs font-medium text-slate-900 transition-all hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white",
  danger:
    "inline-flex h-8 items-center justify-center gap-1.5 rounded-lg bg-rose-600 px-3 text-xs font-semibold text-white shadow-xs transition-all hover:bg-rose-700 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-600 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
};

export const panelClassName =
  "overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900";

export const panelHeaderClassName =
  "flex items-center justify-between border-b border-slate-100 px-4 py-3 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-950/40";

export const panelTitleClassName = "text-sm font-semibold text-slate-900 dark:text-white";

export const panelBodyClassName = "p-4";

export const statCardClassName =
  "rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs transition-all hover:shadow-sm dark:border-slate-800 dark:bg-slate-900";

export const statCardLabelClassName =
  "text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400";

export const statCardValueClassName =
  "mt-1 text-xl font-bold tracking-tight text-slate-900 font-mono tabular-nums dark:text-white";

export const statCardHelperClassName = "mt-1 text-xs text-slate-500 flex items-center gap-1 dark:text-slate-400";

export const statusBadgeTone = {
  success:
    "inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200/60 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/60",
  warning:
    "inline-flex items-center gap-1.5 rounded-md bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700 border border-amber-200/60 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/60",
  danger:
    "inline-flex items-center gap-1.5 rounded-md bg-rose-50 px-2 py-0.5 text-xs font-semibold text-rose-700 border border-rose-200/60 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800/60",
  info:
    "inline-flex items-center gap-1.5 rounded-md bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700 border border-blue-200/60 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800/60",
  accent:
    "inline-flex items-center gap-1.5 rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700 border border-indigo-200/60 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800/60",
  neutral:
    "inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 border border-slate-200/80 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
};

export const sectionClassName =
  "rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900";

export const sectionEyebrowClassName =
  "text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500";

export const sectionTitleClassName = "text-sm font-bold text-slate-900 dark:text-white";

export const sectionSubtitleClassName = "text-xs text-slate-500 dark:text-slate-400";

export const moduleTagClassName =
  "rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300";

export const actionCardClassName =
  "group rounded-2xl border border-slate-200/90 bg-white p-3.5 transition-all hover:border-blue-200 hover:bg-blue-50/30 hover:shadow-xs dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-900/60 dark:hover:bg-blue-950/30";

export const actionCardIconClassName =
  "inline-flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-100 group-hover:text-blue-700 dark:bg-blue-950/60 dark:text-blue-400 dark:group-hover:bg-blue-900/80";

export const actionCardTitleClassName = "truncate text-sm font-semibold text-slate-900 group-hover:text-blue-700 dark:text-white dark:group-hover:text-blue-400";

export const actionCardSubtitleClassName = "truncate text-xs text-slate-500 dark:text-slate-400";

export const tableWrapClassName =
  "overflow-x-auto rounded-xl border border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900";

export const tableThClassName =
  "sticky top-0 z-10 border-b border-slate-200 bg-slate-50/95 backdrop-blur-sm px-3.5 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:border-slate-800 dark:bg-slate-900/95 dark:text-slate-300 select-none";

export const tableTdClassName =
  "px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 border-b border-slate-100/90 last:border-0 dark:text-slate-200 dark:border-slate-800/60 align-middle";

export const tableRowHoverClassName =
  "transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40";

export const welcomeBannerClassName =
  "rounded-2xl border border-slate-200/90 bg-gradient-to-r from-white via-slate-50 to-blue-50/30 p-5 md:p-6 shadow-xs dark:border-slate-800 dark:from-slate-900 dark:via-slate-900/90 dark:to-blue-950/30";

export const asidePanelClassName =
  "rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900";

export const formLabelClassName = "block text-xs font-semibold text-slate-700 mb-1 dark:text-slate-300";

export const formInputClassName =
  "erp-input h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm transition placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-blue-500";

// Backward-compatible aliases
export const erpButtonClassName = buttonClassName;
export const erpPanelClassName = panelClassName;
export const erpPanelHeaderClassName = panelHeaderClassName;
export const erpPanelTitleClassName = panelTitleClassName;
export const erpPanelBodyClassName = panelBodyClassName;
export const erpStatCardClassName = statCardClassName;
export const erpStatCardLabelClassName = statCardLabelClassName;
export const erpStatCardValueClassName = statCardValueClassName;
export const erpStatCardHelperClassName = statCardHelperClassName;
export const erpStatusBadgeTone = statusBadgeTone;
export const erpSectionClassName = sectionClassName;
export const erpSectionEyebrowClassName = sectionEyebrowClassName;
export const erpSectionTitleClassName = sectionTitleClassName;
export const erpSectionSubtitleClassName = sectionSubtitleClassName;
export const erpModuleTagClassName = moduleTagClassName;
export const erpActionCardClassName = actionCardClassName;
export const erpActionCardIconClassName = actionCardIconClassName;
export const erpActionCardTitleClassName = actionCardTitleClassName;
export const erpActionCardSubtitleClassName = actionCardSubtitleClassName;
export const erpTableWrapClassName = tableWrapClassName;
export const erpTableThClassName = tableThClassName;
export const erpTableTdClassName = tableTdClassName;
export const erpTableRowHoverClassName = tableRowHoverClassName;
export const erpWelcomeBannerClassName = welcomeBannerClassName;
export const erpAsidePanelClassName = asidePanelClassName;
export const erpFormLabelClassName = formLabelClassName;
export const erpFormInputClassName = formInputClassName;
