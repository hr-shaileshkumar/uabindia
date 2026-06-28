"use client";

import type { ReactNode } from "react";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  publicMutedPanelClassName,
  publicPanelClassName,
} from "@/components/public/publicStyles";

type GridColumns = "two" | "three" | "four";

const cardGridClassName = (columns: GridColumns) => {
  if (columns === "two") return "grid gap-5 lg:grid-cols-2";
  if (columns === "four") return "grid gap-5 md:grid-cols-2 xl:grid-cols-4";
  return "grid gap-5 md:grid-cols-2 xl:grid-cols-3";
};

export function PublicMetricGrid({
  items,
  columns = "four",
}: {
  items: Array<{ label: string; value: string; helper?: string }>;
  columns?: "two" | "three" | "four";
}) {
  return (
    <div className={cardGridClassName(columns)}>
      {items.map((item) => (
        <article key={item.label} className={`${publicPanelClassName} p-5`}>
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-slate-500">{item.label}</p>
          <p className="mt-3 text-2xl leading-[1.15] font-semibold tracking-[-0.05em] text-slate-950 sm:text-[2rem]">{item.value}</p>
          {item.helper ? <p className="mt-2 text-sm leading-6 text-slate-600">{item.helper}</p> : null}
        </article>
      ))}
    </div>
  );
}

export function PublicCardGrid({
  items,
  columns = "three",
}: {
  items: Array<{
    title: string;
    description: string;
    eyebrow?: string;
    icon?: ReactNode;
    footer?: ReactNode;
  }>;
  columns?: GridColumns;
}) {
  return (
    <div className={cardGridClassName(columns)}>
      {items.map((item) => (
        <article key={item.title} className={`${publicPanelClassName} flex h-full flex-col p-6`}>
          {item.icon ? (
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-[1rem] border border-slate-200 bg-slate-50 text-[color:var(--erp-primary)]">
              {item.icon}
            </div>
          ) : null}
          {item.eyebrow ? (
            <p className={cn("text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--erp-primary)]", item.icon ? "mt-5" : "")}>
              {item.eyebrow}
            </p>
          ) : null}
          <h3 className={cn("text-xl font-semibold tracking-[-0.04em] text-slate-950", item.eyebrow || item.icon ? "mt-3" : "")}>
            {item.title}
          </h3>
          <p className="mt-3 flex-1 text-sm leading-7 text-slate-600">{item.description}</p>
          {item.footer ? <div className="mt-5">{item.footer}</div> : null}
        </article>
      ))}
    </div>
  );
}

export function PublicChecklistPanel({
  eyebrow,
  title,
  description,
  items,
  tone = "muted",
}: {
  eyebrow: string;
  title: string;
  description?: string;
  items: string[];
  tone?: "panel" | "muted";
}) {
  const panelClassName = tone === "panel" ? publicPanelClassName : publicMutedPanelClassName;

  return (
    <section className={`${panelClassName} p-7`}>
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--erp-primary)]">{eyebrow}</p>
      <h3 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-slate-950">{title}</h3>
      {description ? <p className="mt-3 text-sm leading-7 text-slate-600">{description}</p> : null}
      <div className="mt-6 space-y-3">
        {items.map((item) => (
          <div
            key={item}
            className="flex items-start gap-3 rounded-[1.15rem] border border-slate-200 bg-white px-4 py-3 text-sm leading-7 text-slate-600"
          >
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--erp-primary)]" />
            <span>{item}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export function PublicStepGrid({
  items,
  columns = "four",
}: {
  items: Array<{ step: string; title: string; description: string }>;
  columns?: "two" | "three" | "four";
}) {
  const gridClassName =
    columns === "two"
      ? "grid gap-4 md:grid-cols-2"
      : columns === "three"
        ? "grid gap-4 md:grid-cols-2 xl:grid-cols-3"
        : "grid gap-4 lg:grid-cols-4";

  return (
    <div className={gridClassName}>
      {items.map((item) => (
        <article key={item.step} className={`${publicPanelClassName} p-5`}>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--erp-primary)]">{item.step}</p>
          <h3 className="mt-3 text-lg font-semibold tracking-[-0.03em] text-slate-950">{item.title}</h3>
          <p className="mt-2 text-sm leading-7 text-slate-600">{item.description}</p>
        </article>
      ))}
    </div>
  );
}

export function PublicActionBand({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <section className={`${publicPanelClassName} p-7 sm:p-8`}>
      <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--erp-primary)]">{eyebrow}</p>
          <h3 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-[2rem]">{title}</h3>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">{description}</p>
        </div>
        {actions ? <div className="flex flex-wrap gap-3 lg:justify-end">{actions}</div> : null}
      </div>
    </section>
  );
}
