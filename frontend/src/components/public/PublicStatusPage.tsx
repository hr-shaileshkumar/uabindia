"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, Shield, Sparkles } from "lucide-react";

type StatusAction = {
  href: string;
  label: string;
  variant?: "primary" | "secondary";
};

export default function PublicStatusPage({
  eyebrow,
  title,
  description,
  note,
  actions,
  homeHref = "/",
}: {
  eyebrow: string;
  title: string;
  description: string;
  note?: string;
  actions: StatusAction[];
  homeHref?: string;
}) {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f8fbff,#eef5ff_55%,#ffffff)] px-6 py-10 text-slate-900 sm:px-8 lg:px-12">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-7xl items-center">
        <div className="grid w-full gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <section className="space-y-6">
            <Link
              href={homeHref}
              className="inline-flex items-center gap-2 rounded-xl border border-[#d8e4ff] bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-[0_12px_24px_rgba(15,23,42,0.05)] transition hover:border-[#bcd2ff] hover:text-slate-950"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to home
            </Link>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#d9e7ff] bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#0f5eff] shadow-[0_16px_40px_rgba(15,94,255,0.08)]">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              {eyebrow}
            </div>
            <div className="space-y-4">
              <h1 className="max-w-2xl text-balance text-[2.8rem] leading-[0.92] font-semibold tracking-[-0.08em] text-slate-950 sm:text-[3.6rem]">
                {title}
              </h1>
              <p className="max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">{description}</p>
              {note ? <p className="max-w-2xl text-sm leading-7 text-slate-500">{note}</p> : null}
            </div>
            <div className="flex flex-wrap gap-3">
              {actions.map((action) => (
                <Link
                  key={`${action.href}-${action.label}`}
                  href={action.href}
                  className={
                    action.variant === "secondary"
                      ? "inline-flex items-center justify-center rounded-xl border border-[#d8e4ff] bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-[0_14px_30px_rgba(15,23,42,0.06)] transition hover:border-[#bcd2ff] hover:text-slate-950"
                      : "inline-flex items-center justify-center gap-2 rounded-xl bg-[#0f5eff] px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_40px_rgba(15,94,255,0.24)] transition hover:bg-[#0b4fe0]"
                  }
                >
                  {action.label}
                  {action.variant === "secondary" ? null : <ArrowRight className="h-4 w-4" />}
                </Link>
              ))}
            </div>
          </section>

          <section className="rounded-[2rem] border border-[#dbe7ff] bg-white/92 p-6 shadow-[0_30px_80px_rgba(15,23,42,0.1)] backdrop-blur sm:p-8">
            <div className="rounded-[1.75rem] border border-[#dce8ff] bg-[linear-gradient(180deg,#f8fbff,#eef4ff)] p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-[1.3rem] border border-white/70 bg-white p-5 shadow-[0_16px_30px_rgba(15,23,42,0.05)]">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#dbeafe,#eff6ff)] text-[#0f5eff]">
                    <Shield className="h-6 w-6" />
                  </div>
                  <p className="mt-4 text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Safe recovery
                  </p>
                  <p className="mt-2 text-lg font-semibold tracking-[-0.03em] text-slate-950">
                    Controlled fallback
                  </p>
                  <p className="mt-2 text-sm leading-7 text-slate-600">
                    The platform is keeping navigation predictable instead of dropping users into a broken route.
                  </p>
                </div>
                <div className="rounded-[1.3rem] bg-[linear-gradient(135deg,#143a68,#1f4e9e_58%,#0f5eff)] p-5 text-white shadow-[0_22px_48px_rgba(15,58,104,0.22)]">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/14">
                    <Sparkles className="h-6 w-6" />
                  </div>
                  <p className="mt-4 text-sm font-semibold uppercase tracking-[0.18em] text-white/70">
                    Next best action
                  </p>
                  <p className="mt-2 text-lg font-semibold tracking-[-0.03em] text-white">
                    Keep the workflow moving
                  </p>
                  <p className="mt-2 text-sm leading-7 text-white/80">
                    Re-enter through the right workspace, public route, or authenticated screen without losing clarity.
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-3">
                {[
                  "Public navigation stays available.",
                  "Primary actions remain visible.",
                  "Recovery options are one click away.",
                ].map((item) => (
                  <div key={item} className="rounded-[1.2rem] border border-[#dce8ff] bg-white px-4 py-4 text-sm leading-6 text-slate-700">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
