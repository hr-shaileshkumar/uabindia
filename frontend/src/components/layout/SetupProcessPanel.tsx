"use client";

import Link from "next/link";
import { getSetupPageContext, setupDomainMap, setupStageMap } from "@/lib/erp/setup-blueprint";

export default function SetupProcessPanel({ route }: { route: string }) {
  const context = getSetupPageContext(route);
  if (!context) return null;

  const domain = setupDomainMap.get(context.domainKey);
  const stages = context.stageSteps
    .map((step) => setupStageMap.get(step))
    .filter((stage): stage is NonNullable<typeof stage> => Boolean(stage));

  return (
    <section className="rounded-[1.2rem] border border-slate-200/85 bg-white p-4 shadow-[var(--erp-shadow-sm)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Setup Context
          </p>
          <h2 className="mt-1 text-base font-semibold text-slate-950">{context.label}</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            {domain?.summary || "This page participates in the master configuration process and should be operated with dependency awareness."}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
          Owner: <span className="font-semibold text-slate-950">{context.owner}</span>
        </div>
      </div>

      <div className="mt-4 grid gap-3 xl:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Linked Stages</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {stages.map((stage) => (
              <span key={stage.step} className="erp-chip erp-chip-info">
                {stage.step}. {stage.title}
              </span>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Next Action</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">{context.nextAction}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Validation Focus</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">{context.validationFocus}</p>
        </div>
      </div>

      {domain ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="erp-chip erp-chip-neutral">Domain: {domain.label}</span>
          <span className="erp-chip erp-chip-warning">Status: {domain.status}</span>
          <Link href={domain.route} className="erp-chip erp-chip-success">
            Open Domain Workspace
          </Link>
        </div>
      ) : null}
    </section>
  );
}
