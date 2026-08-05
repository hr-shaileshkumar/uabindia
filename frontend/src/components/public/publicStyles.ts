/* ─── Public Site: Sapphire Blue + Teal Theme ────────────────────────────
   Buttons — using CSS variable tokens via Tailwind arbitrary value syntax */

export const publicButtonClassName = {
  primary:
    "inline-flex min-h-[3.5rem] items-center justify-center gap-2 rounded-2xl px-8 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:translate-y-0 bg-gradient-to-r from-blue-600 to-blue-700 shadow-[0_4px_14px_rgba(37,99,235,0.30)] hover:from-blue-700 hover:to-blue-800 hover:shadow-[0_6px_20px_rgba(37,99,235,0.45)] focus-visible:ring-blue-600",
  secondary:
    "inline-flex min-h-[3.5rem] items-center justify-center gap-2 rounded-2xl px-8 py-2.5 text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 border border-gray-200 bg-white text-gray-600 shadow-sm hover:border-blue-200 hover:bg-blue-50/60 hover:text-blue-700 focus-visible:ring-blue-600",
  ghost:
    "inline-flex min-h-[3.5rem] items-center justify-center gap-2 rounded-2xl px-6 py-2.5 text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 text-gray-600 bg-transparent hover:bg-gray-100 hover:text-gray-900 focus-visible:ring-blue-600",
  outline:
    "inline-flex min-h-[3.5rem] items-center justify-center gap-2 rounded-2xl bg-transparent px-8 py-2.5 text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white focus-visible:ring-blue-600",
};

/* Cards / panels */
export const publicPanelClassName =
  "rounded-[24px] p-8 transition-premium border border-gray-200/80 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.05),0_4px_12px_rgba(0,0,0,0.03)]";

export const publicPanelHoverClassName =
  "rounded-[24px] p-8 transition-premium hover:scale-[1.02] hover:-translate-y-[2px] border border-gray-200/80 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.05),0_4px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_36px_rgba(37,99,235,0.12),0_2px_6px_rgba(0,0,0,0.04)]";

export const publicMutedPanelClassName =
  "rounded-[24px] p-8 border border-gray-200/80 bg-gray-50 shadow-sm";

/* Layout */
export const publicSectionClassName =
  "mx-auto w-full max-w-[1440px] px-5 md:px-10 lg:px-16";

export const publicPageSectionClassName = "py-[96px]";
export const publicSectionSpacingClassName = "py-[96px]";
export const publicSectionContentGapClassName = "mt-8 lg:mt-12";

/* Eyebrow pill */
export const publicEyebrowClassName =
  "inline-flex self-start w-fit items-center gap-2 rounded-full px-3.5 py-1.5 text-[0.7rem] font-bold uppercase tracking-[0.18em] border border-blue-100 bg-blue-50 text-blue-700";

/* Section title */
export const publicTitleClassName =
  "text-balance text-[clamp(1.9rem,3.8vw,3.2rem)] font-bold leading-[1.1] tracking-tight text-gray-900";

/* Sub-title / lead */
export const publicSubtitleClassName =
  "text-pretty text-[1.125rem] leading-[1.7] max-w-[clamp(560px,60ch,680px)] text-gray-500";