"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import type { ClientProfile } from "@/lib/publicProfile";
import { publicButtonClassName, publicPanelClassName } from "@/components/public/publicStyles";

type PublicAuthShellProps = {
  profile: ClientProfile;
  eyebrow: string;
  title: string;
  subtitle: string;
  badges: string[];
  asideTitle: string;
  asideBody: string;
  metrics: Array<{ label: string; value: string }>;
  children: ReactNode;
};

export default function PublicAuthShell({
  profile,
  eyebrow,
  title,
  subtitle,
  badges,
  asideTitle,
  asideBody,
  metrics,
  children,
}: PublicAuthShellProps) {
  const platformName = profile.brandName || "Uabindia ERP";

  return (
    <section className="relative overflow-hidden px-4 py-12 sm:px-6 sm:py-16">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(186,230,253,0.42),transparent_30%),radial-gradient(circle_at_85%_18%,rgba(209,250,229,0.34),transparent_22%),linear-gradient(180deg,#fcfeff_0%,#f2f8fd_55%,#ecf4fb_100%)]" />

      <div className="relative mx-auto grid min-h-[calc(100vh-10rem)] max-w-7xl gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div className="space-y-8">
          <div className="inline-flex items-center gap-4">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-[1.25rem] border border-sky-100 bg-[linear-gradient(180deg,#ffffff,#f4fbff)] shadow-[0_14px_30px_rgba(148,163,184,0.16)]">
              <img
                src={profile.logoUrl || "/logo.png?v=uabindia-20260205"}
                alt={`${platformName} logo`}
                width={56}
                height={56}
                className="h-8 w-8 object-contain"
              />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-(--erp-primary)">{eyebrow}</p>
              <p className="mt-1 text-lg font-semibold tracking-[-0.03em] text-slate-950">{platformName}</p>
            </div>
          </div>

          <div className="max-w-2xl space-y-5">
            <h1 className="text-4xl font-semibold tracking-[-0.05em] text-slate-950 sm:text-[3.2rem]">{title}</h1>
            <p className="text-base leading-7 text-slate-600 sm:text-lg">{subtitle}</p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            {badges.map((badge) => (
              <span key={badge} className="rounded-full border border-sky-100 bg-white px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-600 shadow-sm">
                {badge}
              </span>
            ))}
          </div>

          <div className={`${publicPanelClassName} max-w-2xl p-7`}>
            <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-start">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">{asideTitle}</p>
                <p className="mt-3 text-sm leading-7 text-slate-600">{asideBody}</p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <Link href="/contact" className={publicButtonClassName.secondary}>
                    Talk to support
                  </Link>
                  <Link href="/" className={publicButtonClassName.ghost}>
                    Back to website
                  </Link>
                </div>
              </div>
              <div className="grid min-w-[11rem] gap-3">
                {metrics.map((metric) => (
                  <div key={metric.label} className="rounded-[1.25rem] border border-slate-200/80 bg-[linear-gradient(180deg,#ffffff,#f7fafc)] p-4">
                    <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-slate-500">{metric.label}</p>
                    <p className="mt-2 text-lg font-semibold tracking-[-0.03em] text-slate-950">{metric.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="w-full max-w-xl justify-self-end">{children}</div>
      </div>
    </section>
  );
}
