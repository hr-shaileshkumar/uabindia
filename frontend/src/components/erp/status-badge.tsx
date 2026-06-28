"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em]",
  {
    variants: {
      tone: {
        neutral: "border-slate-200 bg-slate-100 text-slate-700",
        positive: "border-emerald-200 bg-emerald-50 text-emerald-700",
        warning: "border-amber-200 bg-amber-50 text-amber-700",
        critical: "border-rose-200 bg-rose-50 text-rose-700",
        info: "border-sky-200 bg-sky-50 text-sky-700",
      },
    },
    defaultVariants: {
      tone: "neutral",
    },
  }
);

export function StatusBadge({
  className,
  tone,
  children,
}: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ tone }), className)}>{children}</span>;
}
