"use client";

import type { ReactNode } from "react";

type PublicAuthShellProps = {
  eyebrow?: string;
  title?: string;
  description?: string;
  badges?: string[];
  children: ReactNode;
};

export default function PublicAuthShell({
  eyebrow,
  title,
  description,
  badges = [],
  children,
}: PublicAuthShellProps) {
  return (
    <section className="px-4 py-10 sm:px-6 sm:py-12 lg:px-8 lg:py-14">
      <div className="mx-auto grid w-full max-w-[76rem] gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(24rem,28rem)] lg:items-stretch">
        <div className="hidden overflow-hidden rounded-[2.25rem] border border-white/70 bg-[radial-gradient(circle_at_top_left,rgba(15,74,125,0.18),transparent_36%),radial-gradient(circle_at_bottom_right,rgba(11,123,115,0.12),transparent_34%),linear-gradient(165deg,rgba(255,255,255,0.98),rgba(239,246,255,0.92)_58%,rgba(226,232,240,0.95))] p-8 shadow-[0_34px_90px_rgba(15,23,42,0.1)] lg:flex lg:flex-col lg:justify-between">
          <div className="max-w-xl">
            {eyebrow ? (
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.3em] text-[color:var(--erp-primary)]">
                {eyebrow}
              </p>
            ) : null}
            {title ? (
              <h1 className="mt-4 text-4xl font-semibold tracking-[-0.055em] text-slate-950 xl:text-[3.35rem]">
                {title}
              </h1>
            ) : null}
            {description ? (
              <p className="mt-4 max-w-lg text-base leading-7 text-slate-600 xl:text-[1.05rem]">
                {description}
              </p>
            ) : null}
          </div>

          <div className="space-y-5">
            {badges.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {badges.map((badge) => (
                  <span
                    key={badge}
                    className="rounded-full border border-slate-200 bg-white/90 px-3 py-1 text-xs font-semibold tracking-[0.08em] text-slate-700 shadow-sm"
                  >
                    {badge}
                  </span>
                ))}
              </div>
            ) : null}

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/80 bg-white/75 px-4 py-4 shadow-sm backdrop-blur">
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-slate-500">Workspace routing</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Automatically resolves tenant, company, and platform context from the active domain.
                </p>
              </div>
              <div className="rounded-2xl border border-white/80 bg-white/75 px-4 py-4 shadow-sm backdrop-blur">
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-slate-500">Secure sessions</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Cookie-based auth, role-aware access, and recovery flows are built into the shell.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-white/80 bg-[linear-gradient(135deg,rgba(15,74,125,0.92),rgba(11,123,115,0.9))] px-5 py-4 text-white shadow-[0_20px_44px_rgba(15,74,125,0.22)]">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.26em] text-white/70">
                One platform
              </p>
              <div className="mt-3 grid gap-3 text-sm text-white/92 sm:grid-cols-3">
                <div>
                  <p className="text-2xl font-semibold tracking-[-0.04em]">HR</p>
                  <p className="mt-1 text-white/70">Workforce operations</p>
                </div>
                <div>
                  <p className="text-2xl font-semibold tracking-[-0.04em]">ERP</p>
                  <p className="mt-1 text-white/70">Finance and supply chain</p>
                </div>
                <div>
                  <p className="text-2xl font-semibold tracking-[-0.04em]">Ops</p>
                  <p className="mt-1 text-white/70">Workflow and reporting</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto w-full max-w-[31rem]">{children}</div>
      </div>
    </section>
  );
}
