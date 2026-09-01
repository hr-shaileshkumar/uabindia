"use client";

import React, { useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, Check, Globe } from "lucide-react";
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
    <section className="relative overflow-hidden border-b border-slate-200 bg-[#f8fafc]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_10%_-10%,rgba(37,99,235,0.12),transparent_55%),radial-gradient(ellipse_60%_50%_at_90%_20%,rgba(15,23,42,0.06),transparent_50%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.03)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]"
      />

      <div
        className={cn(
          publicSectionClassName,
          "relative grid items-center gap-10 py-12 md:py-16 lg:gap-14",
          showPreview ? "lg:grid-cols-[1.05fr_0.95fr]" : "",
        )}
      >
        <MotionReveal className={cn("flex flex-col", !showPreview && "mx-auto max-w-3xl text-center items-center")}>
          <p className={cn(publicEyebrowClassName, !showPreview && "justify-center")}>{eyebrow}</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-900 sm:text-[2.75rem] sm:leading-[1.1]">
            {title}
          </h1>
          <p
            className={cn(
              "mt-4 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg",
              !showPreview && "mx-auto",
            )}
          >
            {subtitle}
          </p>
          <div className={cn("mt-7 flex flex-wrap gap-3", !showPreview && "justify-center")}>{actions}</div>
          {trustSignals.length > 0 ? (
            <ul className={cn("mt-6 flex flex-wrap gap-x-5 gap-y-2", !showPreview && "justify-center")}>
              {trustSignals.map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-slate-600">
                  <Check className="h-4 w-4 shrink-0 text-emerald-600" />
                  {item}
                </li>
              ))}
            </ul>
          ) : null}
          {badges.length > 0 ? (
            <div className={cn("mt-5 flex flex-wrap gap-2", !showPreview && "justify-center")}>
              {badges.map((badge) => (
                <span
                  key={badge}
                  className="rounded-md border border-slate-200/80 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 shadow-sm"
                >
                  {badge}
                </span>
              ))}
            </div>
          ) : null}
        </MotionReveal>

        {showPreview ? (
          <MotionReveal delay={0.08} className="relative">
            <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-blue-500/10 via-transparent to-slate-900/5 blur-2xl" />
            <PublicProductPreview className="relative" />
          </MotionReveal>
        ) : null}
      </div>
    </section>
  );
}

export function TrustRibbon({ items }: { items: TrustedOrganization[] }) {
  if (!items.length) return null;
  return (
    <section className="border-b border-slate-200 bg-slate-50 py-8">
      <div className={publicSectionClassName}>
        <p className="mb-5 text-center text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
          Trusted across industries
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          {items.map((item) => (
            <div
              key={item.name}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-900 text-[10px] font-semibold text-white">
                {item.mark}
              </span>
              <span>
                <span className="font-medium">{item.name}</span>
                {item.sector ? <span className="text-slate-500"> · {item.sector}</span> : null}
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
        <div className={cn(publicSectionContentGapClassName, "grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4")}>
          {modules.map((module) => (
            <Link key={module.slug} href={`/products/${module.slug}`} className={cn(publicPanelHoverClassName, "block")}>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{module.category}</p>
              <h3 className="mt-2 text-base font-semibold text-slate-900">{module.title}</h3>
              <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-slate-600">{module.summary}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-slate-900">
                View module <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </Link>
          ))}
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
    <section className={cn(publicSectionSpacingClassName, "bg-slate-50")}>
      <div className={publicSectionClassName}>
        <SectionIntro eyebrow={eyebrow} title={title} subtitle={subtitle} />
        <div className={cn(publicSectionContentGapClassName, "grid gap-4 sm:grid-cols-2 lg:grid-cols-3")}>
          {industries.map((industry) => (
            <Link
              key={industry.slug}
              href={`/industries/${industry.slug}`}
              className={cn(publicPanelHoverClassName, "block")}
            >
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{industry.eyebrow}</p>
              <h3 className="mt-2 text-base font-semibold text-slate-900">{industry.title}</h3>
              <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-slate-600">{industry.summary}</p>
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
        <div className={cn(publicSectionContentGapClassName, "grid gap-4 md:grid-cols-2 lg:grid-cols-3")}>
          {resources.map((item) => (
            <Link key={item.title} href={item.href} className={cn(publicPanelHoverClassName, "block")}>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{item.type}</p>
              <h3 className="mt-2 text-base font-semibold text-slate-900">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.summary}</p>
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
      <div className={cn(publicSectionClassName, "grid gap-4 sm:grid-cols-2 lg:grid-cols-4")}>
        {items.map((item) => (
          <article key={item.title} className={publicPanelClassName}>
            <h3 className="text-base font-semibold text-slate-900">{item.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.description}</p>
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
    <section className={cn(publicSectionSpacingClassName, "bg-slate-50")}>
      <div className={publicSectionClassName}>
        {title ? <SectionIntro eyebrow={eyebrow} title={title} subtitle={subtitle} /> : null}
        <div className={cn(title ? publicSectionContentGapClassName : "", "grid gap-4 md:grid-cols-2 lg:grid-cols-4")}>
          {items.map((item) => (
            <article key={item.step} className={publicPanelClassName}>
              <p className="text-xs font-semibold text-slate-400">{item.step}</p>
              <h3 className="mt-2 text-base font-semibold text-slate-900">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.description}</p>
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
      <div className="flex flex-col items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 sm:flex-row sm:px-6">
        {/* Currency Switcher */}
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-slate-500" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Billing Currency:</span>
          <div className="flex flex-wrap gap-1.5">
            {currencies.map((c) => (
              <button
                key={c.code}
                type="button"
                onClick={() => setCurrency(c.code)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-semibold transition flex items-center gap-1.5",
                  currency === c.code
                    ? "bg-slate-900 text-white shadow-sm"
                    : "bg-white text-slate-700 hover:bg-slate-200/70 border border-slate-200"
                )}
              >
                <span>{c.code === "INR" ? "🇮🇳 ₹ INR (India)" : "🌎 $ USD (Global)"}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Monthly vs Annual Toggle */}
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
            <button
              type="button"
              onClick={() => setBillingCycle("monthly")}
              className={cn(
                "rounded-md px-3 py-1 text-xs font-semibold transition",
                billingCycle === "monthly" ? "bg-slate-900 text-white" : "text-slate-600 hover:text-slate-900"
              )}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle("annual")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-semibold transition",
                billingCycle === "annual" ? "bg-slate-900 text-white" : "text-slate-600 hover:text-slate-900"
              )}
            >
              <span>Annual</span>
              <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">Save 20%</span>
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
              : `${planPriceObj.monthly} / month`
            : plan.price;

          return (
            <article
              key={plan.name}
              className={cn(
                publicPanelClassName,
                "flex flex-col relative",
                plan.featured && "border-slate-900 ring-2 ring-slate-900 shadow-xl"
              )}
            >
              {plan.featured ? (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-slate-900 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow">
                  Most Popular
                </div>
              ) : null}
              <h3 className="text-lg font-semibold text-slate-900">{plan.name}</h3>
              <p className="mt-1 text-xs text-slate-500 min-h-[32px]">{plan.audience}</p>
              
              <div className="mt-4">
                <p className="text-2xl font-bold tracking-tight text-slate-900">{displayPrice}</p>
                <p className="mt-1 text-[11px] text-slate-500 font-medium">{plan.implementation}</p>
              </div>

              <p className="mt-4 text-xs leading-relaxed text-slate-600 min-h-[36px]">{plan.summary}</p>
              
              <ul className="mt-5 flex-1 space-y-2.5 border-t border-slate-100 pt-4">
                {plan.points.map((point) => (
                  <li key={point} className="flex items-start gap-2 text-xs text-slate-700">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
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
                  "mt-6 w-full text-center py-2.5 text-xs font-semibold"
                )}
              >
                {plan.name.includes("Enterprise") ? "Talk to Enterprise Sales" : "Start 14-Day Free Trial"}
              </Link>
            </article>
          );
        })}
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
          <li key={item} className="flex items-start gap-2 text-sm text-slate-700">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
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
          <h3 className="text-base font-semibold text-slate-900">{item.title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.detail}</p>
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
        <div className="rounded-2xl border border-slate-200 bg-slate-900 px-6 py-10 text-center text-white sm:px-10">
          {eyebrow ? <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">{eyebrow}</p> : null}
          <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h2>
          {copy ? <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-slate-300 sm:text-base">{copy}</p> : null}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href={primaryHref}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-white px-5 text-sm font-medium text-slate-900 transition hover:bg-slate-100"
            >
              {primaryLabel}
              <ArrowRight className="h-4 w-4" />
            </Link>
            {secondaryLabel && secondaryHref ? (
              <Link
                href={secondaryHref}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-white/20 px-5 text-sm font-medium text-white transition hover:bg-white/10"
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
