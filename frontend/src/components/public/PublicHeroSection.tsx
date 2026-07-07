"use client";

import type { ReactNode } from "react";
import { PublicMetricGrid } from "@/components/public/PublicContentBlocks";
import PublicPageIntro from "@/components/public/PublicPageIntro";
import {
  publicPageSectionClassName,
  publicPanelClassName,
  publicSectionClassName,
  publicSectionContentGapClassName,
} from "@/components/public/publicStyles";

export type PublicHeroMetric = {
  label: string;
  value: string;
  helper?: string;
};

type PublicHeroSectionProps = {
  eyebrow: string;
  title: string;
  subtitle: string;
  actions?: ReactNode;
  badges?: string[];
  panelLabel?: string;
  metrics?: PublicHeroMetric[];
  metricColumns?: "two" | "three" | "four";
};

export default function PublicHeroSection({
  eyebrow,
  title,
  subtitle,
  actions,
  badges,
  panelLabel,
  metrics,
  metricColumns = "two",
}: PublicHeroSectionProps) {
  const hasMetrics = Array.isArray(metrics) && metrics.length > 0;

  return (
    <section className={publicPageSectionClassName}>
      <div
        className={`${publicSectionClassName} grid gap-6 ${
          hasMetrics ? "lg:grid-cols-[1.05fr_0.95fr] lg:items-start" : ""
        }`}
      >
        <div>
          <PublicPageIntro eyebrow={eyebrow} title={title} subtitle={subtitle} />

          {actions ? <div className="mt-5 flex flex-wrap gap-3">{actions}</div> : null}

          {badges && badges.length > 0 ? (
            <div className={`${publicSectionContentGapClassName} flex flex-wrap gap-2`}>
              {badges.map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500"
                >
                  {item}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        {hasMetrics ? (
          <div className={`${publicPanelClassName} self-start p-5 sm:p-6`}>
            {panelLabel ? (
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--erp-primary)]">
                {panelLabel}
              </p>
            ) : null}
            <div className={panelLabel ? "mt-5" : undefined}>
              <PublicMetricGrid columns={metricColumns} items={metrics} />
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
