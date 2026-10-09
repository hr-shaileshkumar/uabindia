"use client";

import React, { useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, Boxes, Check, CheckCircle2, Globe, Receipt, Server, ShieldCheck, Sparkles, Users, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { MotionReveal } from "@/components/public/PublicMotion";
import PublicProductPreview from "@/components/public/PublicProductPreview";
import {
  publicButtonClassName,
  publicEyebrowClassName,
  publicPanelClassName,
  publicPanelHoverClassName,
  publicSectionClassName,
  publicSectionContentGapClassName,
  publicSectionSpacingClassName,
  publicSubtitleClassName,
  publicTitleClassName,
} from "@/components/public/publicStyles";
import type {
  MarketingIndustry,
  MarketingModule,
  PricingPlan,
  ResourceCard,
  TrustedOrganization,
} from "@/lib/public-marketing";

export function SectionIntro({
  eyebrow,
  title,
  subtitle,
  align = "left",
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: "left" | "center";
}) {
  return (
    <div className={cn("max-w-2xl", align === "center" && "mx-auto text-center")}>
      {eyebrow ? <p className={publicEyebrowClassName}>{eyebrow}</p> : null}
      <h2 className={cn(publicTitleClassName, eyebrow && "mt-3")}>{title}</h2>
      {subtitle ? <p className={cn(publicSubtitleClassName, "mt-3", align === "center" && "mx-auto")}>{subtitle}</p> : null}
    </div>
  );
}

export function MarketingHero({
  eyebrow,
  title,
  subtitle,
  badges = [],
  actions,
  trustSignals = [],
  showPreview = true,
}: {
  eyebrow: string;
  title: ReactNode;
  subtitle: string;
  badges?: string[];
  actions: ReactNode;
  trustSignals?: string[];
  showPreview?: boolean;
}) {
  return (
    <section className="relative overflow-hidden border-b border-slate-200/90 bg-[#f8fafc] dark:border-slate-800/80 dark:bg-slate-950 transition-colors">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_10%_-10%,rgba(37,99,235,0.12),transparent_55%),radial-gradient(ellipse_60%_50%_at_90%_20%,rgba(15,23,42,0.06),transparent_50%)] dark:bg-[radial-gradient(ellipse_80%_60%_at_10%_-10%,rgba(37,99,235,0.2),transparent_55%),radial-gradient(ellipse_60%_50%_at_90%_20%,rgba(6,182,212,0.1),transparent_50%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.03)_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]"
      />

      <div
        className={cn(
          publicSectionClassName,
          "relative grid items-center gap-8 py-12 md:py-16 lg:py-20 lg:gap-14 xl:gap-16",
          showPreview ? "lg:grid-cols-[0.95fr_1.05fr]" : "",
        )}
      >
        <MotionReveal className={cn("flex flex-col", !showPreview && "mx-auto max-w-4xl text-center items-center")}>
          <p className={cn(publicEyebrowClassName, !showPreview && "justify-center")}>{eyebrow}</p>
          <h1 className="mt-3.5 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl lg:text-[3rem] xl:text-[3.4rem] lg:leading-[1.12] dark:text-white">
            {title}
          </h1>
          <p
            className={cn(
              "mt-4 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg dark:text-slate-300",
              !showPreview && "mx-auto",
            )}
          >
            {subtitle}
          </p>
          <div className={cn("mt-6 flex flex-wrap gap-3", !showPreview && "justify-center")}>{actions}</div>
          {trustSignals.length > 0 ? (
            <ul className={cn("mt-6 flex flex-wrap gap-x-5 gap-y-2", !showPreview && "justify-center")}>
              {trustSignals.map((item) => (
                <li key={item} className="flex items-center gap-2 text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </MotionReveal>

        {showPreview ? (
          <MotionReveal delay={0.08} className="relative">
            <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-blue-500/15 via-transparent to-indigo-500/10 blur-2xl" />
            <PublicProductPreview className="relative shadow-2xl shadow-blue-900/10 dark:shadow-cyan-950/20" />
          </MotionReveal>
        ) : null}
      </div>
    </section>
  );
}

export function TrustRibbon({ items }: { items: TrustedOrganization[] }) {
  if (!items.length) return null;
  return (
    <section className="border-b border-slate-200/80 bg-slate-50/70 py-8 dark:border-slate-800/80 dark:bg-slate-900/40 transition-colors">
      <div className={publicSectionClassName}>
        <p className="mb-5 text-center text-xs font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
          Trusted by high-growth Indian organizations & enterprises
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          {items.map((item) => (
            <div
              key={item.name}
              className="inline-flex items-center gap-2.5 rounded-xl border border-slate-200/90 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 shadow-2xs dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-blue-700 to-indigo-800 text-[10px] font-bold text-white">
                {item.mark}
              </span>
              <span>
                <span>{item.name}</span>
                {item.sector ? <span className="text-slate-400 dark:text-slate-500"> · {item.sector}</span> : null}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function ModuleGrid({
  modules,
  eyebrow = "Products",
  title,
  subtitle,
}: {
  modules: MarketingModule[];
  eyebrow?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <section className={publicSectionSpacingClassName}>
      <div className={publicSectionClassName}>
        <SectionIntro eyebrow={eyebrow} title={title} subtitle={subtitle} />
        <div className={cn(publicSectionContentGapClassName, "grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4")}>
          {modules.map((module) => {
            const isPeople = module.category === "People";
            const isFinance = module.category === "Finance";
            const isOps = module.category === "Operations";

            const badgeStyle = isPeople
              ? "bg-purple-50 border-purple-200/80 text-purple-700 dark:bg-purple-950/40 dark:border-purple-800 dark:text-purple-300"
              : isFinance
              ? "bg-blue-50 border-blue-200/80 text-blue-700 dark:bg-blue-950/40 dark:border-blue-800 dark:text-blue-300"
              : isOps
              ? "bg-emerald-50 border-emerald-200/80 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300"
              : "bg-amber-50 border-amber-200/80 text-amber-700 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-300";

            return (
              <Link
                key={module.slug}
                href={`/products/${module.slug}`}
                className="group relative flex h-full flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5.5 shadow-xs transition-all duration-200 hover:border-blue-400 hover:shadow-lg hover:-translate-y-1 dark:border-slate-800/80 dark:bg-slate-900 dark:hover:border-blue-500/60"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className={cn("inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider", badgeStyle)}>
                      {isPeople && <Users className="h-3 w-3" />}
                      {isFinance && <Receipt className="h-3 w-3" />}
                      {isOps && <Boxes className="h-3 w-3" />}
                      {!isPeople && !isFinance && !isOps && <Sparkles className="h-3 w-3" />}
                      {module.category}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      Active
                    </span>
                  </div>
                  <h3 className="mt-3.5 text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors dark:text-white dark:group-hover:text-cyan-400">
                    {module.title}
                  </h3>
                  <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                    {module.summary}
                  </p>
                </div>

                <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-700 group-hover:text-blue-600 transition-colors dark:border-slate-800 dark:text-slate-300 dark:group-hover:text-cyan-400">
                  <span>Explore Capabilities</span>
                  <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function IndustryGrid({
  industries,
  eyebrow = "Industries",
  title,
  subtitle,
}: {
  industries: MarketingIndustry[];
  eyebrow?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <section className={cn(publicSectionSpacingClassName, "bg-slate-50/70 dark:bg-slate-900/40 transition-colors")}>
      <div className={publicSectionClassName}>
        <SectionIntro eyebrow={eyebrow} title={title} subtitle={subtitle} />
        <div className={cn(publicSectionContentGapClassName, "grid gap-5 sm:grid-cols-2 lg:grid-cols-3")}>
          {industries.map((industry) => (
            <Link
              key={industry.slug}
              href={`/industries/${industry.slug}`}
              className="group relative flex h-full flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs transition-all duration-200 hover:border-indigo-400 hover:shadow-lg hover:-translate-y-1 dark:border-slate-800/80 dark:bg-slate-900 dark:hover:border-indigo-500/60"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-indigo-50 border border-indigo-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:bg-indigo-950/40 dark:border-indigo-800 dark:text-indigo-300">
                    {industry.eyebrow}
                  </span>
                </div>
                <h3 className="mt-3 text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors dark:text-white dark:group-hover:text-indigo-400">
                  {industry.title}
                </h3>
                <p className="mt-2.5 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                  {industry.summary}
                </p>
              </div>

              <div className="mt-6 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-700 group-hover:text-indigo-600 transition-colors dark:border-slate-800 dark:text-slate-300 dark:group-hover:text-indigo-400">
                <span>View Solution Blueprint</span>
                <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export function ResourceGrid({
  resources,
  eyebrow = "Resources",
  title,
  subtitle,
}: {
  resources: ResourceCard[];
  eyebrow?: string;
  title: string;
  subtitle?: string;
}) {
  if (!resources.length) return null;
  return (
    <section className={publicSectionSpacingClassName}>
      <div className={publicSectionClassName}>
        <SectionIntro eyebrow={eyebrow} title={title} subtitle={subtitle} />
        <div className={cn(publicSectionContentGapClassName, "grid gap-5 md:grid-cols-2 lg:grid-cols-3")}>
          {resources.map((item) => (
            <Link key={item.title} href={item.href} className={cn(publicPanelHoverClassName, "block")}>
              <p className="text-[11px] font-bold uppercase tracking-wide text-blue-600 dark:text-cyan-400">{item.type}</p>
              <h3 className="mt-2 text-base font-bold text-slate-900 dark:text-white">{item.title}</h3>
              <p className="mt-2 text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-400">{item.summary}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export function ValueGrid({
  items,
}: {
  items: Array<{ title: string; description: string }>;
}) {
  return (
    <section className={publicSectionSpacingClassName}>
      <div className={cn(publicSectionClassName, "grid gap-5 sm:grid-cols-2 lg:grid-cols-4")}>
        {items.map((item) => (
          <article key={item.title} className={publicPanelClassName}>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">{item.title}</h3>
            <p className="mt-2 text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-400">{item.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export function ProcessTimeline({
  items,
  eyebrow,
  title,
  subtitle,
}: {
  items: Array<{ step: string; title: string; description: string }>;
  eyebrow?: string;
  title?: string;
  subtitle?: string;
}) {
  return (
    <section className={cn(publicSectionSpacingClassName, "bg-slate-50/70 dark:bg-slate-900/40 transition-colors")}>
      <div className={publicSectionClassName}>
        {title ? <SectionIntro eyebrow={eyebrow} title={title} subtitle={subtitle} /> : null}
        <div className={cn(title ? publicSectionContentGapClassName : "", "grid gap-5 md:grid-cols-2 lg:grid-cols-4")}>
          {items.map((item) => (
            <article key={item.step} className={publicPanelClassName}>
              <p className="text-xs font-bold text-blue-600 dark:text-cyan-400">{item.step}</p>
              <h3 className="mt-2 text-base font-bold text-slate-900 dark:text-white">{item.title}</h3>
              <p className="mt-2 text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-400">{item.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function PricingGrid({ plans }: { plans: PricingPlan[] }) {
  const [currency, setCurrency] = useState<"INR" | "USD">("INR");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");

  const currencies = [
    { code: "INR" as const, symbol: "₹", label: "₹ INR (India)" },
    { code: "USD" as const, symbol: "$", label: "$ USD (Global / International)" },
  ];

  return (
    <div className="space-y-8">
      {/* Controls Bar: Currency Selector & Billing Cycle Toggle */}
      <div className="flex flex-col items-center justify-between gap-4 rounded-2xl border border-slate-200/90 bg-slate-50/80 p-4 sm:flex-row sm:px-6 dark:border-slate-800 dark:bg-slate-900/80">
        {/* Currency Switcher */}
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-blue-500" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Billing Currency:</span>
          <div className="flex flex-wrap gap-1.5">
            {currencies.map((c) => (
              <button
                key={c.code}
                type="button"
                onClick={() => setCurrency(c.code)}
                className={cn(
                  "rounded-xl px-3 py-1.5 text-xs font-semibold transition-all flex items-center gap-1.5",
                  currency === c.code
                    ? "bg-gradient-to-r from-blue-700 to-indigo-700 text-white shadow-2xs"
                    : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                )}
              >
                <span>{c.code === "INR" ? "🇮🇳 ₹ INR (India)" : "🌎 $ USD (Global)"}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Monthly vs Annual Toggle */}
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-2xs dark:border-slate-800 dark:bg-slate-800">
            <button
              type="button"
              onClick={() => setBillingCycle("monthly")}
              className={cn(
                "rounded-lg px-3 py-1 text-xs font-bold transition-all",
                billingCycle === "monthly" ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              )}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle("annual")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-bold transition-all",
                billingCycle === "annual" ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              )}
            >
              <span>Annual</span>
              <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">Save 20%</span>
            </button>
          </div>
        </div>
      </div>

      {/* Pricing Cards Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {plans.map((plan) => {
          const planPriceObj = plan.pricesByCurrency ? plan.pricesByCurrency[currency] : null;
          const displayPrice = planPriceObj
            ? billingCycle === "annual"
              ? planPriceObj.annual
              : `${planPriceObj.monthly} / mo`
            : plan.price;

          return (
            <article
              key={plan.name}
              className={cn(
                "flex flex-col relative rounded-2xl border p-6 sm:p-7 transition-all duration-200 dark:bg-slate-900",
                plan.featured
                  ? "border-blue-600 bg-white ring-2 ring-blue-600 shadow-xl dark:border-blue-500 dark:ring-blue-500"
                  : "border-slate-200/90 bg-white shadow-xs hover:border-slate-300 hover:shadow-md dark:border-slate-800 dark:hover:border-slate-700"
              )}
            >
              {plan.featured ? (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-blue-700 to-indigo-700 px-4 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm">
                  Recommended Tier
                </div>
              ) : null}
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">{plan.name}</h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 min-h-[32px]">{plan.audience}</p>
              
              <div className="mt-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                <p className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white font-mono">{displayPrice}</p>
                <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 font-medium">{plan.implementation}</p>
              </div>

              <p className="mt-4 text-xs leading-relaxed text-slate-600 dark:text-slate-400 min-h-[36px]">{plan.summary}</p>
              
              <ul className="mt-5 flex-1 space-y-3">
                {plan.points.map((point) => (
                  <li key={point} className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 mt-0.5">
                      <Check className="h-2.5 w-2.5 stroke-[3]" />
                    </span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={
                  plan.name.includes("Enterprise")
                    ? "/book-demo"
                    : `/register?plan=${plan.name.toLowerCase().replace(/\s+/g, "-")}&currency=${currency}`
                }
                className={cn(
                  plan.featured ? publicButtonClassName.primary : publicButtonClassName.secondary,
                  "mt-8 w-full text-center py-2.5 text-xs font-bold rounded-xl"
                )}
              >
                {plan.name.includes("Enterprise") ? "Schedule Architecture Consultation" : "Start 14-Day Free Trial"}
              </Link>
            </article>
          );
        })}
      </div>

      {/* Enterprise Guarantees Ribbon */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Server, title: "99.99% Uptime SLA", desc: "Tier-IV Indian cloud datacenters (Mumbai / Hyderabad)" },
            { icon: ShieldCheck, title: "Statutory Compliance", desc: "Guaranteed day-zero updates for GST, PF, ESI & TDS laws" },
            { icon: Zap, title: "Zero Lock-in Migration", desc: "Automated legacy ERP ETL connectors & data import tools" },
            { icon: Sparkles, title: "Dedicated Support", desc: "24/7 dedicated support engineers & named technical manager" },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-700 to-indigo-800 text-white shadow-2xs">
                  <Icon className="h-4 w-4 text-cyan-300" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">{item.title}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug mt-0.5">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function DemoAgendaPanel({ items }: { items: string[] }) {
  return (
    <div className={publicPanelClassName}>
      <p className={publicEyebrowClassName}>What we cover</p>
      <ul className="mt-4 space-y-2.5">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SupportLaneGrid({
  items,
}: {
  items: Array<{ title: string; detail: string }>;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {items.map((item) => (
        <article key={item.title} className={publicPanelClassName}>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">{item.title}</h3>
          <p className="mt-2 text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-400">{item.detail}</p>
        </article>
      ))}
    </div>
  );
}

export function CtaPanel({
  eyebrow,
  title,
  description,
  body,
  primaryLabel,
  primaryHref,
  secondaryLabel,
  secondaryHref,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  body?: string;
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel?: string;
  secondaryHref?: string;
}) {
  const copy = description || body || "";
  return (
    <section className={publicSectionSpacingClassName}>
      <div className={publicSectionClassName}>
        <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 px-6 py-12 text-center text-white sm:px-12 sm:py-16 shadow-2xl">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-blue-500/15 blur-3xl"
          />
          {eyebrow ? (
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-400">{eyebrow}</p>
          ) : null}
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">{title}</h2>
          {copy ? (
            <p className="mx-auto mt-4 max-w-2xl text-xs sm:text-sm md:text-base leading-relaxed text-slate-300">{copy}</p>
          ) : null}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href={primaryHref}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-white px-6 text-xs sm:text-sm font-bold text-slate-950 transition-all hover:bg-slate-100 hover:shadow-lg active:scale-[0.98]"
            >
              {primaryLabel}
              <ArrowRight className="h-4 w-4" />
            </Link>
            {secondaryLabel && secondaryHref ? (
              <Link
                href={secondaryHref}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 px-6 text-xs sm:text-sm font-semibold text-white backdrop-blur-xs transition-all hover:bg-white/10 hover:border-white/30 active:scale-[0.98]"
              >
                {secondaryLabel}
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
