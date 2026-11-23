"use client";

import React, { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Boxes,
  Building,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock,
  ExternalLink,
  Globe,
  HelpCircle,
  Mail,
  MapPin,
  MessageSquareQuote,
  Navigation,
  Phone,
  Receipt,
  Server,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  Zap,
} from "lucide-react";
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
          "relative grid items-center gap-5 pt-3 pb-5 sm:pt-4 sm:pb-6 md:pt-4 md:pb-8 lg:pt-5 lg:pb-8 lg:gap-8 xl:gap-12",
          showPreview ? "lg:grid-cols-[0.92fr_1.08fr] xl:grid-cols-[0.88fr_1.12fr]" : "",
        )}
      >
        <MotionReveal className={cn("flex flex-col justify-center", !showPreview && "mx-auto max-w-4xl text-center items-center")}>
          <p className={cn(publicEyebrowClassName, !showPreview && "justify-center")}>{eyebrow}</p>
          <h1 className="mt-3.5 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl md:text-5xl lg:text-[3rem] xl:text-[3.5rem] lg:leading-[1.14] dark:text-white">
            {title}
          </h1>
          <p
            className={cn(
              "mt-4 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg lg:text-xl dark:text-slate-300",
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
          <MotionReveal delay={0.08} className="relative flex items-center justify-center w-full">
            <PublicProductPreview />
          </MotionReveal>
        ) : null}
      </div>
    </section>
  );
}

export function TrustRibbon({ items }: { items: TrustedOrganization[] }) {
  if (!items.length) return null;
  return (
    <section className="border-b border-slate-200/80 bg-slate-50/70 py-4 sm:py-5 dark:border-slate-800/80 dark:bg-slate-900/40 transition-colors">
      <div className={publicSectionClassName}>
        <p className="mb-5 text-center text-xs font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
          Trusted by high-growth global enterprises & multi-region organizations
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
                href={`/contact?module=${module.slug}`}
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
  type CurrencyCode = "INR" | "USD" | "EUR" | "GBP" | "AED";
  const [currency, setCurrency] = useState<CurrencyCode>("INR");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");

  const currencies: Array<{ code: CurrencyCode; label: string; badge: string }> = [
    { code: "INR", label: "₹ INR", badge: "🇮🇳 India" },
    { code: "USD", label: "$ USD", badge: "🌎 Global" },
    { code: "EUR", label: "€ EUR", badge: "🇪🇺 Europe" },
    { code: "GBP", label: "£ GBP", badge: "🇬🇧 UK" },
    { code: "AED", label: "AED", badge: "🇦🇪 UAE" },
  ];

  return (
    <div className="space-y-8">
      {/* Controls Bar: Currency Selector & Billing Cycle Toggle */}
      <div className="flex flex-col items-center justify-between gap-4 rounded-2xl border border-slate-200/90 bg-slate-50/80 p-4 sm:flex-row sm:px-6 dark:border-slate-800 dark:bg-slate-900/80">
        {/* Currency Switcher */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 mr-1">
            <Globe className="h-4 w-4 text-blue-500" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Currency:</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {currencies.map((c) => (
              <button
                key={c.code}
                type="button"
                onClick={() => setCurrency(c.code)}
                className={cn(
                  "rounded-xl px-2.5 py-1.5 text-xs font-semibold transition-all flex items-center gap-1.5",
                  currency === c.code
                    ? "bg-gradient-to-r from-blue-700 to-indigo-700 text-white shadow-2xs"
                    : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                )}
              >
                <span>{c.badge}</span>
                <span className={cn("text-[11px]", currency === c.code ? "text-blue-100" : "text-slate-500 dark:text-slate-400")}>
                  {c.label}
                </span>
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
                billingCycle === "monthly" ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:white"
              )}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle("annual")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-bold transition-all",
                billingCycle === "annual" ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:white"
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
          const planPriceObj = plan.pricesByCurrency
            ? plan.pricesByCurrency[currency] ?? plan.pricesByCurrency.USD ?? plan.pricesByCurrency.INR
            : null;
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
            { icon: Server, title: "99.99% Uptime SLA", desc: "Multi-region Tier-IV sovereign cloud datacenters with 99.99% high availability" },
            { icon: ShieldCheck, title: "Statutory Compliance", desc: "Guaranteed day-zero updates for global VAT, regional GST & local statutory laws" },
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
        <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 px-6 py-8 text-center text-white sm:px-10 sm:py-10 shadow-2xl">
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

export interface FaqItem {
  question: string;
  answer: string;
  category?: string;
}

export function FaqAccordion({
  items,
  title = "Frequently Asked Questions",
  eyebrow = "CLEAR ANSWERS",
  subtitle = "Everything you need to know about rollout, compliance, and enterprise deployment.",
}: {
  items: FaqItem[];
  title?: string;
  eyebrow?: string;
  subtitle?: string;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleItem = (idx: number) => {
    setOpenIndex((prev) => (prev === idx ? null : idx));
  };

  return (
    <section className={publicSectionSpacingClassName}>
      <div className={publicSectionClassName}>
        <SectionIntro eyebrow={eyebrow} title={title} subtitle={subtitle} align="center" />
        <div className="mx-auto mt-5 sm:mt-6 max-w-3xl space-y-2.5">
          {items.map((item, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className={cn(
                  "overflow-hidden rounded-2xl border transition-all duration-200",
                  isOpen
                    ? "border-blue-300 bg-white shadow-xs dark:border-blue-900/60 dark:bg-slate-900"
                    : "border-slate-200 bg-white/70 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/40"
                )}
              >
                <button
                  type="button"
                  onClick={() => toggleItem(idx)}
                  className="flex w-full items-center justify-between p-4 sm:p-5 text-left text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100"
                >
                  <span className="flex items-center gap-2.5">
                    <HelpCircle className="h-4 w-4 shrink-0 text-blue-600 dark:text-cyan-400" />
                    <span>{item.question}</span>
                  </span>
                  <span className="ml-4 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                    {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </span>
                </button>
                {isOpen && (
                  <div className="border-t border-slate-100 dark:border-slate-800/80 px-4 pb-5 pt-3 sm:px-5 sm:pb-6 text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                    <p>{item.answer}</p>
                    {item.category && (
                      <span className="mt-3 inline-block rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                        {item.category}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export interface TestimonialItem {
  name: string;
  role: string;
  company: string;
  quote: string;
  rating?: number;
  avatarUrl?: string;
}

export function TestimonialGrid({
  testimonials,
  title = "Trusted by Enterprise Leaders",
  eyebrow = "CUSTOMER SUCCESS",
  subtitle = "Discover how growing organizations and multi-location businesses streamline operations with UabIndia ERP.",
}: {
  testimonials: TestimonialItem[];
  title?: string;
  eyebrow?: string;
  subtitle?: string;
}) {
  return (
    <section className={publicSectionSpacingClassName}>
      <div className={publicSectionClassName}>
        <SectionIntro eyebrow={eyebrow} title={title} subtitle={subtitle} align="center" />
        <div className="mt-6 sm:mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((t, idx) => (
            <div
              key={idx}
              className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs hover:border-blue-300 transition-all dark:border-slate-800 dark:bg-slate-900"
            >
              <div>
                <div className="flex items-center gap-1 text-amber-500">
                  {Array.from({ length: t.rating ?? 5 }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 stroke-amber-500" />
                  ))}
                </div>
                <p className="mt-4 text-xs sm:text-sm leading-relaxed text-slate-700 dark:text-slate-300 italic">
                  &ldquo;{t.quote}&rdquo;
                </p>
              </div>

              <div className="mt-6 flex items-center gap-3 border-t border-slate-100 dark:border-slate-800 pt-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-xs font-bold text-white shadow-xs">
                  {t.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={t.avatarUrl} alt={t.name} className="h-full w-full rounded-full object-cover" />
                  ) : (
                    t.name.slice(0, 2).toUpperCase()
                  )}
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">{t.name}</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {t.role} · <span className="font-semibold text-blue-600 dark:text-cyan-400">{t.company}</span>
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export interface CarouselSlide {
  id: string;
  eyebrow?: string;
  title: string;
  subtitle: string;
  badge?: string;
  primaryCtaLabel?: string;
  primaryCtaHref?: string;
  secondaryCtaLabel?: string;
  secondaryCtaHref?: string;
  imageUrl?: string;
  tagline?: string;
}

export function HeroCarousel({
  slides,
  autoPlayInterval = 6000,
}: {
  slides: CarouselSlide[];
  autoPlayInterval?: number;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (!slides || slides.length <= 1 || isPaused) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, autoPlayInterval);
    return () => clearInterval(timer);
  }, [slides, isPaused, autoPlayInterval]);

  if (!slides || slides.length === 0) return null;

  const current = slides[currentIndex] || slides[0];

  return (
    <section
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="relative overflow-hidden border-b border-slate-200/90 bg-[#f8fafc] dark:border-slate-800/80 dark:bg-slate-950 transition-colors"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_10%_-10%,rgba(37,99,235,0.12),transparent_55%),radial-gradient(ellipse_60%_50%_at_90%_20%,rgba(15,23,42,0.06),transparent_50%)] dark:bg-[radial-gradient(ellipse_80%_60%_at_10%_-10%,rgba(37,99,235,0.2),transparent_55%),radial-gradient(ellipse_60%_50%_at_90%_20%,rgba(6,182,212,0.1),transparent_50%)]"
      />

      <div className={cn(publicSectionClassName, "relative pt-4 pb-8 sm:pt-5 sm:pb-10 lg:pt-6 lg:pb-10")}>
        <div className="grid items-center gap-8 lg:grid-cols-12">
          {/* Text Content */}
          <div className="lg:col-span-7 flex flex-col justify-center">
            {current.eyebrow ? (
              <span className={publicEyebrowClassName}>
                <Sparkles className="h-3.5 w-3.5" />
                <span>{current.eyebrow}</span>
              </span>
            ) : null}

            <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl md:text-4xl lg:text-[2.75rem] lg:leading-[1.15] dark:text-white">
              {current.title}
            </h1>

            <p className="mt-3.5 max-w-xl text-sm leading-relaxed text-slate-600 sm:text-base lg:text-lg dark:text-slate-300">
              {current.subtitle}
            </p>

            {/* Actions */}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              {current.primaryCtaLabel ? (
                <Link
                  href={current.primaryCtaHref || "/login"}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-xs sm:text-sm font-semibold text-white shadow-xs hover:bg-blue-700 active:scale-[0.98] transition-all"
                >
                  <span>{current.primaryCtaLabel}</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              ) : null}

              {current.secondaryCtaLabel ? (
                <Link
                  href={current.secondaryCtaHref || "/contact"}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-xs sm:text-sm font-semibold text-slate-800 shadow-2xs hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800/80 transition-all"
                >
                  <span>{current.secondaryCtaLabel}</span>
                </Link>
              ) : null}
            </div>
          </div>

          {/* Visual Showcase / Slide Image or Banner Card */}
          <div className="lg:col-span-5 relative flex items-center justify-center">
            <div className="w-full overflow-hidden rounded-2xl border border-slate-200 bg-white p-2.5 shadow-md dark:border-slate-800 dark:bg-slate-900">
              {current.imageUrl ? (
                <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={current.imageUrl}
                    alt={current.title}
                    className="h-full w-full object-cover transition-all duration-300"
                  />
                  {current.badge ? (
                    <span className="absolute top-3 left-3 rounded-full bg-slate-900/80 backdrop-blur-md px-3 py-1 text-[11px] font-bold text-white shadow-sm">
                      {current.badge}
                    </span>
                  ) : null}
                </div>
              ) : (
                <div className="relative flex aspect-video w-full flex-col justify-between rounded-xl bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-950 p-6 text-white shadow-inner">
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-white/10 backdrop-blur-md px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-cyan-300">
                      {current.badge || "ENTERPRISE READY"}
                    </span>
                    <Sparkles className="h-5 w-5 text-amber-300" />
                  </div>
                  <div>
                    <p className="text-lg font-bold">{current.title}</p>
                    <p className="mt-1 text-xs text-slate-300 line-clamp-2">{current.tagline || current.subtitle}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Carousel Navigation Bar (Dots + Arrows) */}
        {slides.length > 1 && (
          <div className="mt-8 flex items-center justify-between border-t border-slate-200/80 pt-4 dark:border-slate-800/80">
            {/* Dots */}
            <div className="flex items-center gap-2">
              {slides.map((s, idx) => (
                <button
                  key={s.id || idx}
                  type="button"
                  onClick={() => setCurrentIndex(idx)}
                  className={cn(
                    "h-2.5 rounded-full transition-all duration-300",
                    currentIndex === idx
                      ? "w-8 bg-blue-600 dark:bg-cyan-400"
                      : "w-2.5 bg-slate-300 hover:bg-slate-400 dark:bg-slate-700 dark:hover:bg-slate-600"
                  )}
                  aria-label={`Slide ${idx + 1}`}
                />
              ))}
            </div>

            {/* Arrows */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCurrentIndex((prev) => (prev === 0 ? slides.length - 1 : prev - 1))}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                aria-label="Previous Slide"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setCurrentIndex((prev) => (prev + 1) % slides.length)}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                aria-label="Next Slide"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export interface OfficeLocation {
  id: string;
  name: string;
  type: "Headquarters" | "Branch Office" | "Manufacturing Plant" | "Regional Warehouse";
  city: string;
  address: string;
  phone: string;
  email: string;
  workingHours: string;
  mapEmbedUrl: string;
  directionsUrl?: string;
}

export function OfficeLocatorBlock({
  locations,
  title = "Our Office & Operating Locations",
  eyebrow = "NATIONWIDE PRESENCE",
  subtitle = "Visit our corporate headquarters, regional hubs, or distribution facilities across India.",
}: {
  locations: OfficeLocation[];
  title?: string;
  eyebrow?: string;
  subtitle?: string;
}) {
  const [selectedId, setSelectedId] = useState<string>(locations[0]?.id || "");
  const activeOffice = locations.find((l) => l.id === selectedId) || locations[0];

  if (!locations || locations.length === 0) return null;

  return (
    <section className={publicSectionSpacingClassName}>
      <div className={publicSectionClassName}>
        <SectionIntro eyebrow={eyebrow} title={title} subtitle={subtitle} align="center" />

        <div className="mt-6 sm:mt-8 grid gap-6 lg:grid-cols-12 items-stretch">
          {/* Left Column: Office Selector Tabs */}
          <div className="lg:col-span-5 flex flex-col gap-3">
            {locations.map((loc) => {
              const isSelected = (loc.id || loc.name) === (activeOffice?.id || activeOffice?.name);
              return (
                <div
                  key={loc.id || loc.name}
                  onClick={() => setSelectedId(loc.id)}
                  className={cn(
                    "cursor-pointer rounded-2xl border p-4 sm:p-5 transition-all text-left shadow-xs",
                    isSelected
                      ? "border-blue-500 bg-blue-50/70 shadow-sm dark:border-blue-500/70 dark:bg-blue-950/40"
                      : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 dark:text-cyan-400">
                      <Building className="h-3.5 w-3.5" />
                      <span>{loc.type}</span>
                    </span>
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      {loc.city}
                    </span>
                  </div>

                  <h3 className="mt-2 text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                    {loc.name}
                  </h3>

                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                    {loc.address}
                  </p>

                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <Phone className="h-3 w-3 text-slate-400" />
                      <span>{loc.phone}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-slate-400" />
                      <span>{loc.workingHours}</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Google Maps Live Embed & Direct Directions */}
          <div className="lg:col-span-7 flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <div className="relative min-h-[300px] sm:min-h-[360px] w-full flex-1 bg-slate-100 dark:bg-slate-800">
              {activeOffice?.mapEmbedUrl ? (
                <iframe
                  title={`Map of ${activeOffice.name}`}
                  src={activeOffice.mapEmbedUrl}
                  className="h-full w-full border-0 absolute inset-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center p-6 text-center text-slate-400">
                  <MapPin className="h-8 w-8 text-blue-500" />
                  <p className="ml-2 text-xs">Interactive Google Map view for {activeOffice?.city}</p>
                </div>
              )}
            </div>

            {/* Bottom Info Bar with Get Directions */}
            <div className="border-t border-slate-100 bg-slate-50/70 p-4 sm:px-5 dark:border-slate-800 dark:bg-slate-950/60 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-rose-500" />
                  <span>{activeOffice?.name}</span>
                </p>
                <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">{activeOffice?.address}</p>
              </div>

              {activeOffice?.directionsUrl ? (
                <a
                  href={activeOffice.directionsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-blue-700 transition-all"
                >
                  <Navigation className="h-3.5 w-3.5" />
                  <span>Get Directions</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
