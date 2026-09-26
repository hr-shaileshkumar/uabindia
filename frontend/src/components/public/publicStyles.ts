/* Enterprise SaaS public design tokens — clean, restrained, production */

export const publicButtonClassName = {
  primary:
    "inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-slate-900 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  secondary:
    "inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2",
  ghost:
    "inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400",
  outline:
    "inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-900 bg-transparent px-5 text-sm font-medium text-slate-900 transition hover:bg-slate-900 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2",
};

export const publicPanelClassName =
  "rounded-xl border border-slate-200 bg-white p-6 shadow-sm";

export const publicPanelHoverClassName =
  "rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-slate-300 hover:shadow-md";

export const publicMutedPanelClassName =
  "rounded-xl border border-slate-200 bg-slate-50 p-6";

export const publicGlassPanelClassName = publicMutedPanelClassName;

export const publicSectionClassName =
  "relative mx-auto w-full max-w-[1580px] 2xl:max-w-[1760px] px-5 sm:px-8 lg:px-12 xl:px-16";

export const publicPageSectionClassName = "relative py-12 md:py-16";
export const publicSectionSpacingClassName = "relative py-12 md:py-16";
export const publicSectionContentGapClassName = "mt-8";

export const publicEyebrowClassName =
  "text-xs font-semibold uppercase tracking-[0.14em] text-slate-500";

export const publicTitleClassName =
  "text-balance text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl";

export const publicSubtitleClassName =
  "text-pretty max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg";

export const publicGradientTextClassName = "text-slate-900";

export const publicFormLabelClassName = "block text-sm font-medium text-slate-700";

export const publicFormInputClassName =
  "h-11 w-full rounded-lg border border-slate-200 bg-white text-sm transition placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10";

export const publicFormTextareaClassName =
  "min-h-[96px] w-full rounded-lg border border-slate-200 bg-white p-3 text-sm transition placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 resize-none";

export const publicAuthLinkClassName =
  "font-medium text-slate-900 underline-offset-4 transition hover:underline";

export const publicAuthCardClassName = "w-full";

export const publicAuthInputIconClassName =
  "pointer-events-none absolute left-3.5 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-slate-400";

export const publicAuthInputWithIconClassName =
  "h-11 w-full rounded-lg border border-slate-200 bg-white !pl-10 text-sm shadow-none transition placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus-visible:ring-slate-900/10";
