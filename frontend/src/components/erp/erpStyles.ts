/* ─── ERP Internal: Cartoon Brutalist Theme ──────────────────────────────
   Buttons, panels, stat cards, sections — using CSS variable tokens
   via Tailwind arbitrary value syntax. Parallel to publicStyles.ts */

export const erpButtonClassName = {
  primary:
    "inline-flex min-h-[3rem] items-center justify-center gap-2 rounded-xl px-6 py-2 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:translate-y-0 [background:var(--erp-primary)] [box-shadow:var(--erp-shadow-sm)] hover:[background:var(--erp-primary-hover)] hover:[box-shadow:var(--erp-shadow-md)] focus-visible:ring-[color:var(--erp-primary)]",
  secondary:
    "inline-flex min-h-[3rem] items-center justify-center gap-2 rounded-xl px-6 py-2 text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 [border:2px_solid_var(--erp-border)] [background:var(--erp-surface)] [color:var(--erp-ink-secondary)] [box-shadow:var(--erp-shadow-sm)] hover:[border-color:var(--erp-border-strong)] hover:[background:var(--erp-surface-muted)] hover:[color:var(--erp-ink)] focus-visible:ring-[color:var(--erp-primary)]",
  ghost:
    "inline-flex min-h-[3rem] items-center justify-center gap-2 rounded-xl px-5 py-2 text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 [color:var(--erp-muted)] [background:transparent] hover:[background:var(--erp-surface-muted)] hover:[color:var(--erp-ink)] focus-visible:ring-[color:var(--erp-primary)]",
  outline:
    "inline-flex min-h-[3rem] items-center justify-center gap-2 rounded-xl bg-transparent px-6 py-2 text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 [border:2px_solid_var(--erp-primary)] [color:var(--erp-primary)] hover:[background:var(--erp-primary)] hover:text-white focus-visible:ring-[color:var(--erp-primary)]",
  danger:
    "inline-flex min-h-[3rem] items-center justify-center gap-2 rounded-xl px-6 py-2 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 [background:var(--erp-danger)] [box-shadow:var(--erp-shadow-sm)] hover:[box-shadow:var(--erp-shadow-md)] focus-visible:ring-[color:var(--erp-danger)]",
};

/* Cards / panels */
export const erpPanelClassName =
  "overflow-hidden rounded-[0.75rem] [border:2px_solid_var(--erp-border)] [background:var(--erp-surface)] [box-shadow:var(--erp-shadow)]";

export const erpPanelHeaderClassName =
  "flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b-2 [border-color:var(--erp-border)] [background:var(--erp-surface)]";

export const erpPanelTitleClassName =
  "text-[0.98rem] font-bold [color:var(--erp-ink)]";

export const erpPanelBodyClassName = "p-5";

/* Stat cards (KPI tiles) */
export const erpStatCardClassName =
  "rounded-[0.75rem] px-4 py-3 [border:2px_solid_var(--erp-border)] [background:var(--erp-surface)] [box-shadow:var(--erp-shadow-sm)]";

export const erpStatCardLabelClassName =
  "text-[11px] font-bold uppercase tracking-[0.14em] [color:var(--erp-muted)]";

export const erpStatCardValueClassName =
  "mt-1.5 text-[1.125rem] font-bold tracking-[-0.04em] [color:var(--erp-ink)]";

export const erpStatCardHelperClassName =
  "mt-0.5 text-[11px] leading-4 [color:var(--erp-muted)]";

/* Status badge tones */
export const erpStatusBadgeTone = {
  success:
    "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold [background:var(--erp-success-bg)] [color:var(--erp-success)]",
  warning:
    "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold [background:var(--erp-warning-bg)] [color:var(--erp-warning)]",
  danger:
    "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold [background:var(--erp-danger-bg)] [color:var(--erp-danger)]",
  info:
    "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold [background:var(--erp-info-bg)] [color:var(--erp-info)]",
  accent:
    "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold [background:var(--erp-accent-soft)] [color:var(--erp-accent)]",
  neutral:
    "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold [background:var(--erp-surface-muted)] [color:var(--erp-muted)]",
};

/* Layout sections */
export const erpSectionClassName =
  "rounded-[0.75rem] [border:2px_solid_var(--erp-border)] [background:var(--erp-surface)] [box-shadow:var(--erp-shadow-sm)] p-5";

export const erpSectionEyebrowClassName =
  "text-[11px] font-semibold uppercase tracking-[0.16em] [color:var(--erp-muted)]";

export const erpSectionTitleClassName =
  "mt-1 text-xl font-semibold tracking-[-0.03em] [color:var(--erp-ink)]";

export const erpSectionSubtitleClassName =
  "text-sm leading-6 [color:var(--erp-muted)]";

/* Module tag / pill */
export const erpModuleTagClassName =
  "rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] [border:1px_solid_var(--erp-border)] [background:var(--erp-surface-muted)] [color:var(--erp-muted)]";

/* Quick-action link card */
export const erpActionCardClassName =
  "rounded-[1rem] px-4 py-4 transition [border:1px_solid_var(--erp-border)] [background:var(--erp-surface)] hover:[border-color:var(--erp-border-strong)] hover:[background:var(--erp-surface-muted)]";

export const erpActionCardIconClassName =
  "inline-flex h-9 w-9 items-center justify-center rounded-xl [background:var(--erp-surface-muted)] [color:var(--erp-primary)]";

export const erpActionCardTitleClassName =
  "truncate text-sm font-semibold [color:var(--erp-ink)]";

export const erpActionCardSubtitleClassName =
  "truncate text-xs [color:var(--erp-muted)]";

/* Table styles */
export const erpTableWrapClassName =
  "overflow-x-auto rounded-[0.75rem] [border:2px_solid_var(--erp-border)] [background:var(--erp-surface)]";

export const erpTableThClassName =
  "sticky top-0 z-10 px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.14em] [color:var(--erp-muted)] backdrop-blur";

export const erpTableTdClassName =
  "px-4 py-3 text-sm [color:var(--erp-ink-secondary)]";

export const erpTableRowHoverClassName =
  "transition hover:[background:var(--erp-surface-muted)]";

/* Welcome / hero banner */
export const erpWelcomeBannerClassName =
  "rounded-[var(--erp-radius-panel)] [border:2px_solid_var(--erp-border)] [box-shadow:var(--erp-shadow-sm)] p-5 md:p-6 [background:linear-gradient(180deg,var(--erp-surface),var(--erp-surface-muted))]";

/* Sidebar / aside panel */
export const erpAsidePanelClassName =
  "rounded-[0.75rem] p-4 [border:2px_solid_var(--erp-border)] [background:var(--erp-surface)] [box-shadow:var(--erp-shadow-sm)]";