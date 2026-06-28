"use client";

import { useEffect, useRef, useState, type ComponentProps, type ReactNode } from "react";
import Link from "next/link";
import {
  ArrowDown,
  ArrowRight,
  BarChart3,
  Boxes,
  BriefcaseBusiness,
  Building2,
  CalendarRange,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  FileChartColumn,
  GraduationCap,
  HeartPulse,
  KanbanSquare,
  Landmark,
  LifeBuoy,
  LineChart,
  MessageSquareText,
  Package,
  PieChart,
  PlayCircle,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Star,
  Store,
  Truck,
  UsersRound,
  WalletCards,
} from "lucide-react";
import { useInView } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  MotionItem,
  MotionReveal,
  MotionStagger,
} from "@/components/public/PublicMotion";
import {
  publicButtonClassName,
  publicEyebrowClassName,
  publicPanelClassName,
  publicSectionClassName,
} from "@/components/public/publicStyles";
import type {
  ComparisonRow,
  FaqItem,
  MarketingIndustry,
  MarketingMetric,
  MarketingModule,
  MarketingProblem,
  ResourceCard,
  Testimonial,
  TrustedOrganization,
} from "@/lib/public-marketing";

const moduleIconMap = {
  users: UsersRound,
  wallet: WalletCards,
  clock: Clock3,
  calendar: CalendarRange,
  briefcase: BriefcaseBusiness,
  sparkline: LineChart,
  package: Package,
  "bar-chart": BarChart3,
  boxes: Boxes,
  shield: ShieldCheck,
  messages: MessageSquareText,
  kanban: KanbanSquare,
  "life-buoy": LifeBuoy,
  "pie-chart": PieChart,
  smartphone: Smartphone,
} as const;

const industryIconMap = {
  healthcare: HeartPulse,
  manufacturing: Building2,
  retail: Store,
  construction: Landmark,
  education: GraduationCap,
  government: ShieldCheck,
  ngo: Sparkles,
  hospital: HeartPulse,
  logistics: Truck,
  "it-services": LaptopIcon,
  "professional-services": BriefcaseBusiness,
} as const;

function LaptopIcon(props: ComponentProps<typeof Sparkles>) {
  return <Sparkles {...props} />;
}

export function SectionIntro({
  eyebrow,
  title,
  subtitle,
  align = "left",
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  align?: "left" | "center";
}) {
  return (
    <div
      className={cn(
        "flex max-w-3xl flex-col gap-4",
        align === "center" ? "mx-auto items-center text-center" : "items-start text-left"
      )}
    >
      <p className={publicEyebrowClassName}>{eyebrow}</p>
      <h2 className="max-w-4xl text-balance text-[2.35rem] leading-[0.96] font-semibold tracking-[-0.06em] text-slate-950 sm:text-[3.2rem] lg:text-[3.7rem]">
        {title}
      </h2>
      <p className="max-w-2xl text-pretty text-base leading-8 text-slate-600 sm:text-lg">
        {subtitle}
      </p>
    </div>
  );
}

export function MarketingHero({
  eyebrow,
  title,
  subtitle,
  badges,
  actions,
  metrics,
  trustSignals = [],
}: {
  eyebrow: string;
  title: ReactNode;
  subtitle: string;
  badges: string[];
  actions: ReactNode;
  metrics: MarketingMetric[];
  trustSignals?: string[];
}) {
  return (
    <section className="relative flex min-h-[calc(100vh-8.5rem)] items-center overflow-hidden pt-8 pb-16 sm:pt-10 sm:pb-20 lg:pt-14">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[42rem] bg-[radial-gradient(circle_at_20%_15%,rgba(36,108,192,0.2),transparent_34%),radial-gradient(circle_at_78%_12%,rgba(99,102,241,0.18),transparent_30%),radial-gradient(circle_at_70%_65%,rgba(16,185,129,0.16),transparent_30%)]" />
      <div className={cn(publicSectionClassName, "grid gap-10 lg:grid-cols-[1.02fr_0.98fr] lg:items-center")}>
        <MotionReveal>
          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--erp-primary)] shadow-[0_20px_45px_rgba(15,23,42,0.08)] backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              {eyebrow}
            </div>
            <h1 className="mt-6 max-w-4xl text-balance text-[3.2rem] leading-[0.9] font-semibold tracking-[-0.08em] text-slate-950 sm:text-[4.35rem] lg:text-[5.4rem]">
              {title}
            </h1>
            <p className="mt-6 max-w-2xl text-pretty text-lg leading-8 text-slate-600">
              {subtitle}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">{actions}</div>

            {trustSignals.length > 0 ? (
              <div className="mt-6 flex flex-wrap gap-3 text-sm text-slate-600">
                {trustSignals.map((item) => (
                  <div key={item} className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-2 shadow-[0_14px_28px_rgba(15,23,42,0.05)]">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            ) : null}

            <div className="mt-10 flex flex-wrap gap-3">
              {badges.map((badge) => (
                <span
                  key={badge}
                  className="rounded-full border border-slate-200/80 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 shadow-[0_14px_34px_rgba(15,23,42,0.06)] backdrop-blur"
                >
                  {badge}
                </span>
              ))}
            </div>
          </div>
        </MotionReveal>

        <MotionReveal delay={0.08}>
          <OperationalDashboardMockup metrics={metrics} />
        </MotionReveal>
      </div>
    </section>
  );
}

export function TrustRibbon({ items }: { items: TrustedOrganization[] }) {
  return (
    <section className="pb-16 sm:pb-20">
      <div className={publicSectionClassName}>
        <MotionReveal>
          <div className="rounded-[2rem] border border-white/60 bg-white/75 p-6 shadow-[0_28px_70px_rgba(15,23,42,0.07)] backdrop-blur sm:p-8">
            <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <p className={publicEyebrowClassName}>Trusted by</p>
                <h2 className="mt-3 max-w-xl text-2xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-[2.2rem]">
                  Built for modern operators across India&apos;s core industries.
                </h2>
                <p className="mt-3 max-w-lg text-sm leading-7 text-slate-600">
                  Healthcare, manufacturing, retail, logistics, public programs, and services teams use the same platform with different workflows and approvals.
                </p>
              </div>
              <div className="grid flex-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {items.map((item) => (
                  <div
                    key={item.name}
                    className="rounded-[1.35rem] border border-slate-200/80 bg-white px-4 py-4 shadow-[0_18px_34px_rgba(15,23,42,0.07)]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#143a68,#1f4e9e_58%,#0f766e)] text-sm font-semibold tracking-[0.14em] text-white">
                        {item.mark}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold tracking-[-0.02em] text-slate-950">
                          {item.name}
                        </p>
                        <p className="truncate text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                          {item.sector}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </MotionReveal>
      </div>
    </section>
  );
}

export function ProblemGrid({ items }: { items: MarketingProblem[] }) {
  return (
    <section className="pb-16 sm:pb-20">
      <div className={publicSectionClassName}>
        <MotionReveal>
          <SectionIntro
            eyebrow="Business problems"
            title="Most ERP searches begin after teams hit the same operating ceiling."
            subtitle="The issue is rarely a missing report. It is usually scattered systems, weak control, and too many manual handoffs between departments."
          />
        </MotionReveal>
        <MotionStagger className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {items.map((item) => (
            <MotionItem key={item.title}>
              <article className={cn(publicPanelClassName, "h-full p-6")}>
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-[color:var(--erp-primary)]">
                  <Sparkles className="h-5 w-5" />
                </div>
                <h3 className="mt-5 text-xl font-semibold tracking-[-0.04em] text-slate-950">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{item.description}</p>
                <div className="mt-5 rounded-[1.2rem] bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-700">
                  {item.impact}
                </div>
              </article>
            </MotionItem>
          ))}
        </MotionStagger>
      </div>
    </section>
  );
}

export function SolutionFramework({
  items,
}: {
  items: Array<{ title: string; detail: string }>;
}) {
  return (
    <section className="pb-16 sm:pb-20">
      <div className={cn(publicSectionClassName, "grid gap-6 xl:grid-cols-[0.88fr_1.12fr]")}>
        <MotionReveal>
          <div className="rounded-[2rem] border border-slate-200/80 bg-[linear-gradient(180deg,#0f172a,#142c53_58%,#123b64)] p-8 text-white shadow-[0_30px_80px_rgba(15,23,42,0.2)] sm:p-10">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-200">
              Solution design
            </p>
            <h2 className="mt-4 max-w-lg text-[2.3rem] leading-[0.98] font-semibold tracking-[-0.06em]">
              One business, one data core, one clear operating picture.
            </h2>
            <p className="mt-4 max-w-lg text-base leading-8 text-slate-200">
              UabIndia ERP is designed to collapse fragmented HR, payroll, finance, procurement,
              inventory, CRM, and project workflows into one disciplined platform.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {[
                "Live approvals",
                "Tenant-aware access",
                "Cross-module reporting",
                "Audit-ready history",
              ].map((pill) => (
                <div
                  key={pill}
                  className="rounded-[1.15rem] border border-white/12 bg-white/8 px-4 py-3 text-sm font-medium text-slate-100 backdrop-blur"
                >
                  {pill}
                </div>
              ))}
            </div>
          </div>
        </MotionReveal>

        <MotionStagger className="grid gap-5 md:grid-cols-2">
          {items.map((item) => (
            <MotionItem key={item.title}>
              <article className={cn(publicPanelClassName, "h-full p-6")}>
                <p className={publicEyebrowClassName}>{item.title}</p>
                <p className="mt-4 text-base leading-8 text-slate-700">{item.detail}</p>
              </article>
            </MotionItem>
          ))}
        </MotionStagger>
      </div>
    </section>
  );
}

export function ConnectedFlowSection() {
  const nodes = [
    "Employees",
    "Attendance",
    "Payroll",
    "Finance",
    "Reports",
    "Management Dashboard",
  ];

  return (
    <section className="pb-16 sm:pb-20">
      <div className={publicSectionClassName}>
        <MotionReveal>
          <SectionIntro
            eyebrow="Connected workflow"
            title="The platform connects every critical business handoff in one operating flow."
            subtitle="Instead of moving information between separate tools, UabIndia ERP keeps employee data, attendance inputs, payroll calculations, finance entries, reports, and leadership dashboards connected by design."
          />
        </MotionReveal>
        <MotionReveal delay={0.06} className="mt-10">
          <div className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-[0_30px_80px_rgba(15,23,42,0.08)] sm:p-8">
            <div className="grid gap-4 lg:grid-cols-6">
              {nodes.map((node, index) => (
                <div key={node} className="flex flex-col items-center gap-4 lg:flex-row">
                  <div className="flex h-full w-full items-center justify-center rounded-[1.4rem] border border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm font-semibold tracking-[-0.02em] text-slate-900">
                    {node}
                  </div>
                  {index < nodes.length - 1 ? (
                    <div className="hidden h-px flex-1 bg-[linear-gradient(90deg,rgba(37,99,235,0.24),rgba(16,185,129,0.45))] lg:block" />
                  ) : null}
                  {index < nodes.length - 1 ? (
                    <div className="text-[color:var(--erp-primary)] lg:hidden">
                      <ArrowDown className="h-6 w-6" />
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </MotionReveal>
      </div>
    </section>
  );
}

export function ModuleGrid({
  modules,
  eyebrow = "Products overview",
  title = "Every core business function can grow inside the same product language.",
  subtitle = "Each module is designed to work independently and to become more valuable when connected with the rest of the platform.",
}: {
  modules: MarketingModule[];
  eyebrow?: string;
  title?: string;
  subtitle?: string;
}) {
  return (
    <section className="pb-16 sm:pb-20">
      <div className={publicSectionClassName}>
        <MotionReveal>
          <SectionIntro eyebrow={eyebrow} title={title} subtitle={subtitle} />
        </MotionReveal>
        <MotionStagger className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {modules.map((module) => {
            const Icon =
              moduleIconMap[module.icon as keyof typeof moduleIconMap] || Sparkles;

            return (
              <MotionItem key={module.slug}>
                <article className={cn(publicPanelClassName, "flex h-full flex-col p-6")}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-[1.15rem] border border-slate-200 bg-slate-50 text-[color:var(--erp-primary)]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      {module.category}
                    </span>
                  </div>
                  <h3 className="mt-5 text-2xl font-semibold tracking-[-0.04em] text-slate-950">
                    {module.title}
                  </h3>
                  <p className="mt-3 flex-1 text-sm leading-7 text-slate-600">
                    {module.summary}
                  </p>
                  <div className="mt-5 space-y-3">
                    {module.outcomes.map((outcome) => (
                      <div key={outcome} className="flex items-center gap-3 text-sm text-slate-700">
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                        <span>{outcome}</span>
                      </div>
                    ))}
                  </div>
                  <Link
                    href={`/products/${module.slug}`}
                    className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[color:var(--erp-primary)] transition hover:gap-3"
                  >
                    Learn more
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </article>
              </MotionItem>
            );
          })}
        </MotionStagger>
      </div>
    </section>
  );
}

export function HighlightChipGrid({ items }: { items: string[] }) {
  return (
    <section className="pb-16 sm:pb-20">
      <div className={publicSectionClassName}>
        <MotionReveal>
          <SectionIntro
            eyebrow="Key features"
            title="Enterprise controls, mobility, security, and automation in one product layer."
            subtitle="The platform is designed for real operating teams: role-based access, approval logic, field-ready workflows, integrations, and future AI readiness."
          />
        </MotionReveal>
        <MotionStagger className="mt-10 flex flex-wrap gap-3">
          {items.map((item) => (
            <MotionItem key={item} className="basis-full sm:basis-auto">
              <div className="flex items-center gap-3 rounded-full border border-slate-200/90 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-[0_16px_34px_rgba(15,23,42,0.05)]">
                <Check className="h-4 w-4 text-emerald-600" />
                {item}
              </div>
            </MotionItem>
          ))}
        </MotionStagger>
      </div>
    </section>
  );
}

export function ProcessTimeline({
  items,
  eyebrow = "How it works",
  title = "A practical rollout flow from setup to reporting.",
  subtitle = "The implementation path is designed to move teams toward operational discipline without creating avoidable complexity.",
}: {
  items: Array<{ step: string; title: string; description: string }>;
  eyebrow?: string;
  title?: string;
  subtitle?: string;
}) {
  return (
    <section className="pb-16 sm:pb-20">
      <div className={publicSectionClassName}>
        <MotionReveal>
          <SectionIntro eyebrow={eyebrow} title={title} subtitle={subtitle} />
        </MotionReveal>
        <MotionStagger className="mt-10 grid gap-5 lg:grid-cols-3 xl:grid-cols-6">
          {items.map((item) => (
            <MotionItem key={item.step}>
              <article className={cn(publicPanelClassName, "relative h-full p-5")}>
                <div className="inline-flex h-10 min-w-10 items-center justify-center rounded-full bg-[color:var(--erp-primary)] px-3 text-sm font-semibold text-white">
                  {item.step}
                </div>
                <h3 className="mt-5 text-lg font-semibold tracking-[-0.03em] text-slate-950">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-7 text-slate-600">{item.description}</p>
              </article>
            </MotionItem>
          ))}
        </MotionStagger>
      </div>
    </section>
  );
}

export function AnalyticsShowcase({
  metrics,
}: {
  metrics: MarketingMetric[];
}) {
  return (
    <section className="pb-16 sm:pb-20">
      <div className={cn(publicSectionClassName, "grid gap-6 xl:grid-cols-[1.08fr_0.92fr]")}>
        <MotionReveal>
          <div className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-[0_30px_80px_rgba(15,23,42,0.08)] sm:p-8">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-5">
              <div>
                <p className={publicEyebrowClassName}>Dashboard preview</p>
                <h3 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-slate-950">
                  A leadership dashboard built for real operational questions.
                </h3>
              </div>
              <div className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
                Live visibility
              </div>
            </div>
            <div className="mt-6 grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
              <div className="rounded-[1.5rem] bg-slate-950 p-5 text-white">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-sm text-slate-300">Payroll and workforce trend</p>
                    <p className="mt-2 text-3xl font-semibold tracking-[-0.05em]">Rs 4.8 Cr</p>
                  </div>
                  <div className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-sky-200">
                    This month
                  </div>
                </div>
                <div className="mt-7 flex h-48 items-end gap-3 rounded-[1.3rem] bg-white/6 px-4 pb-4 pt-6">
                  {[54, 68, 61, 79, 74, 92, 88].map((value, index) => (
                    <div key={value + index} className="flex flex-1 flex-col items-center gap-3">
                      <div
                        className="w-full rounded-t-[1rem] bg-[linear-gradient(180deg,#7dd3fc,#22c55e)]"
                        style={{ height: `${value}%` }}
                      />
                      <span className="text-[0.7rem] uppercase tracking-[0.18em] text-slate-400">
                        {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"][index]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid gap-4">
                {[
                  { label: "Leave analytics", value: "214", helper: "Pending, approved, and exception cases by branch." },
                  { label: "Department mix", value: "12 depts", helper: "Live headcount and role distribution." },
                  { label: "Expense watch", value: "7 alerts", helper: "Outlier claims and late approvals surfaced automatically." },
                ].map((item) => (
                  <div key={item.label} className="rounded-[1.35rem] border border-slate-200 bg-slate-50/70 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{item.label}</p>
                    <p className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-slate-950">{item.value}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{item.helper}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </MotionReveal>

        <MotionStagger className="grid gap-5">
          {metrics.map((metric) => (
            <MotionItem key={metric.label}>
              <div className={cn(publicPanelClassName, "p-6")}>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {metric.label}
                </p>
                <p className="mt-3 text-[2rem] leading-none font-semibold tracking-[-0.05em] text-slate-950">
                  {metric.value}
                </p>
                <p className="mt-3 text-sm leading-7 text-slate-600">{metric.helper}</p>
              </div>
            </MotionItem>
          ))}
        </MotionStagger>
      </div>
    </section>
  );
}

export function AnimatedStatsBand({
  items,
}: {
  items: Array<{ value: number; suffix: string; label: string }>;
}) {
  return (
    <section className="pb-16 sm:pb-20">
      <div className={publicSectionClassName}>
        <MotionReveal>
          <div className="rounded-[2rem] border border-slate-200/80 bg-slate-950 px-6 py-8 text-white shadow-[0_30px_80px_rgba(15,23,42,0.2)] sm:px-8 sm:py-10">
            <div className="mb-8">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-200">
                Business statistics
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.05em] sm:text-[2.7rem]">
                Built for organizations that need scale, speed, and reliability.
              </h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {items.map((item) => (
                <div key={item.label} className="rounded-[1.35rem] border border-white/10 bg-white/6 px-5 py-5">
                  <p className="text-[2.4rem] leading-none font-semibold tracking-[-0.06em] text-white sm:text-[3rem]">
                    <AnimatedNumber value={item.value} />
                    {item.suffix}
                  </p>
                  <p className="mt-3 text-sm leading-7 text-slate-300">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </MotionReveal>
      </div>
    </section>
  );
}

export function IndustryGrid({
  industries,
  eyebrow = "Industry solutions",
  title = "One ERP core, tailored for different operating realities.",
  subtitle = "Industry fit is about matching workflows, approvals, reporting depth, and rollout priorities to the business without fragmenting the platform.",
}: {
  industries: MarketingIndustry[];
  eyebrow?: string;
  title?: string;
  subtitle?: string;
}) {
  return (
    <section className="pb-16 sm:pb-20">
      <div className={publicSectionClassName}>
        <MotionReveal>
          <SectionIntro eyebrow={eyebrow} title={title} subtitle={subtitle} />
        </MotionReveal>
        <MotionStagger className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {industries.map((industry) => {
            const Icon = industryIconMap[industry.slug as keyof typeof industryIconMap] || Building2;

            return (
              <MotionItem key={industry.slug}>
                <article className={cn(publicPanelClassName, "flex h-full flex-col p-6")}>
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-[1.1rem] border border-slate-200 bg-slate-50 text-[color:var(--erp-primary)]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--erp-primary)]">
                    {industry.eyebrow}
                  </p>
                  <h3 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-slate-950">
                    {industry.title}
                  </h3>
                  <p className="mt-3 flex-1 text-sm leading-7 text-slate-600">{industry.summary}</p>
                  <Link
                    href={`/industries/${industry.slug}`}
                    className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[color:var(--erp-primary)] transition hover:gap-3"
                  >
                    Explore solution
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </article>
              </MotionItem>
            );
          })}
        </MotionStagger>
      </div>
    </section>
  );
}

export function ComparisonTable({ rows }: { rows: ComparisonRow[] }) {
  return (
    <section className="pb-16 sm:pb-20">
      <div className={publicSectionClassName}>
        <MotionReveal>
          <SectionIntro
            eyebrow="Why choose UabIndia"
            title="The difference is not only features. It is the operating model behind them."
            subtitle="The best ERP decision is the one that reduces manual work, strengthens control, and keeps adoption realistic for the business."
          />
        </MotionReveal>
        <MotionReveal delay={0.05} className="mt-10 overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white shadow-[0_28px_70px_rgba(15,23,42,0.08)]">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="bg-slate-950 text-white">
                <tr>
                  {["Capability", "Excel", "Traditional ERP", "UabIndia ERP"].map((heading) => (
                    <th
                      key={heading}
                      className="px-5 py-4 text-sm font-semibold tracking-[-0.02em] sm:px-6"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={row.capability} className={index % 2 === 0 ? "bg-white" : "bg-slate-50/70"}>
                    <td className="px-5 py-5 text-sm font-semibold text-slate-950 sm:px-6">
                      {row.capability}
                    </td>
                    <td className="px-5 py-5 text-sm leading-7 text-slate-600 sm:px-6">{row.excel}</td>
                    <td className="px-5 py-5 text-sm leading-7 text-slate-600 sm:px-6">{row.traditional}</td>
                    <td className="px-5 py-5 text-sm leading-7 text-slate-950 sm:px-6">
                      <span className="inline-flex rounded-full bg-[color:var(--erp-primary)]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--erp-primary)]">
                        Preferred
                      </span>
                      <span className="mt-3 block">{row.uabindia}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </MotionReveal>
      </div>
    </section>
  );
}

export function TestimonialCards({ items }: { items: Testimonial[] }) {
  return (
    <section className="pb-16 sm:pb-20">
      <div className={publicSectionClassName}>
        <MotionReveal>
          <SectionIntro
            eyebrow="Client perspective"
            title="Trust grows when the platform improves how teams actually work."
            subtitle="These stories are representative of the kinds of operational gains businesses expect when fragmented workflows move into one governed system."
          />
        </MotionReveal>
        <MotionStagger className="mt-10 grid gap-5 lg:grid-cols-3">
          {items.map((item) => (
            <MotionItem key={`${item.name}-${item.company}`}>
              <article className="h-full rounded-[2rem] border border-slate-200/80 bg-[linear-gradient(180deg,#ffffff,#f8fbff)] p-6 shadow-[0_24px_60px_rgba(15,23,42,0.08)]">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[linear-gradient(135deg,#143a68,#1f4e9e_58%,#0f766e)] text-sm font-semibold text-white">
                      {item.avatar}
                    </div>
                    <div>
                      <p className="text-base font-semibold text-slate-950">{item.name}</p>
                      <p className="mt-1 text-sm text-slate-600">
                        {item.role}, {item.company}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-amber-700">
                    {Array.from({ length: item.rating }).map((_, index) => (
                      <Star key={index} className="h-3.5 w-3.5 fill-current" />
                    ))}
                  </div>
                </div>
                <p className="mt-5 text-lg leading-8 text-slate-700">&ldquo;{item.quote}&rdquo;</p>
                <div className="mt-6 rounded-[1.3rem] bg-slate-950 px-4 py-4 text-sm font-medium text-slate-100">
                  {item.result}
                </div>
                <div className="mt-6 grid gap-3">
                  <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    <PlayCircle className="h-4 w-4 text-[color:var(--erp-primary)]" />
                    {item.videoLabel}
                  </div>
                  <div className="rounded-[1.2rem] bg-slate-50 px-4 py-4 text-sm leading-7 text-slate-700">
                    {item.caseStudy}
                  </div>
                </div>
              </article>
            </MotionItem>
          ))}
        </MotionStagger>
      </div>
    </section>
  );
}

export function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section className="pb-16 sm:pb-20">
      <div className={cn(publicSectionClassName, "grid gap-8 xl:grid-cols-[0.86fr_1.14fr]")}>
        <MotionReveal>
          <div className="sticky top-24">
            <SectionIntro
              eyebrow="FAQ"
              title="Answers for buying teams, operations leaders, and implementation stakeholders."
              subtitle="Keep the evaluation process clear. The questions below cover scope, rollout, security, support, and operational fit."
            />
          </div>
        </MotionReveal>
        <MotionStagger className="space-y-4">
          {items.map((item, index) => {
            const isOpen = index === openIndex;

            return (
              <MotionItem key={item.question}>
                <article className={cn(publicPanelClassName, "overflow-hidden")}>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                    onClick={() => setOpenIndex(isOpen ? -1 : index)}
                    aria-expanded={isOpen}
                  >
                    <span className="text-base font-semibold tracking-[-0.02em] text-slate-950">
                      {item.question}
                    </span>
                    <ChevronDown
                      className={cn(
                        "h-5 w-5 shrink-0 text-slate-400 transition-transform",
                        isOpen && "rotate-180"
                      )}
                    />
                  </button>
                  {isOpen ? (
                    <div className="border-t border-slate-100 px-6 py-5 text-sm leading-7 text-slate-600">
                      {item.answer}
                    </div>
                  ) : null}
                </article>
              </MotionItem>
            );
          })}
        </MotionStagger>
      </div>
    </section>
  );
}

export function ResourceGrid({ items }: { items: ResourceCard[] }) {
  return (
    <section className="pb-16 sm:pb-20">
      <div className={publicSectionClassName}>
        <MotionReveal>
          <SectionIntro
            eyebrow="Resources"
            title="Material that helps teams evaluate, plan, and deploy with more confidence."
            subtitle="These resources are written for real decision-making conversations: scope, rollout sequence, control needs, and expected operational outcomes."
          />
        </MotionReveal>
        <MotionStagger className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <MotionItem key={item.title}>
              <Link
                href={item.href}
                className="group block h-full rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-[0_22px_55px_rgba(15,23,42,0.07)] transition hover:-translate-y-1 hover:shadow-[0_30px_70px_rgba(15,23,42,0.12)]"
              >
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-[1.15rem] border border-slate-200 bg-slate-50 text-[color:var(--erp-primary)]">
                  <FileChartColumn className="h-5 w-5" />
                </div>
                <p className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--erp-primary)]">
                  {item.type}
                </p>
                <h3 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-slate-950">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{item.summary}</p>
                <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[color:var(--erp-primary)]">
                  Open resource
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </div>
              </Link>
            </MotionItem>
          ))}
        </MotionStagger>
      </div>
    </section>
  );
}

export function ValueGrid({
  items,
  eyebrow = "Operating principles",
  title = "The public website should communicate the same discipline as the product.",
  subtitle = "UabIndia ERP positions itself as a modern enterprise platform. That means clarity, control, confidence, and a bias toward operational outcomes.",
}: {
  items: Array<{ title: string; description: string }>;
  eyebrow?: string;
  title?: string;
  subtitle?: string;
}) {
  return (
    <section className="pb-16 sm:pb-20">
      <div className={publicSectionClassName}>
        <MotionReveal>
          <SectionIntro eyebrow={eyebrow} title={title} subtitle={subtitle} />
        </MotionReveal>
        <MotionStagger className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {items.map((item) => (
            <MotionItem key={item.title}>
              <div className={cn(publicPanelClassName, "h-full p-6")}>
                <p className="text-xl font-semibold tracking-[-0.03em] text-slate-950">{item.title}</p>
                <p className="mt-3 text-sm leading-7 text-slate-600">{item.description}</p>
              </div>
            </MotionItem>
          ))}
        </MotionStagger>
      </div>
    </section>
  );
}

export function CtaPanel({
  eyebrow,
  title,
  description,
  primaryLabel,
  primaryHref,
  secondaryLabel,
  secondaryHref,
}: {
  eyebrow: string;
  title: string;
  description: string;
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel: string;
  secondaryHref: string;
}) {
  return (
    <section className="pb-16 sm:pb-20">
      <div className={publicSectionClassName}>
        <MotionReveal>
          <div className="overflow-hidden rounded-[2rem] border border-slate-200/80 bg-[linear-gradient(135deg,#0f172a,#12335c_56%,#0f5f8e)] px-8 py-10 text-white shadow-[0_34px_85px_rgba(15,23,42,0.22)] sm:px-10 sm:py-12">
            <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-200">
                  {eyebrow}
                </p>
                <h2 className="mt-4 max-w-3xl text-balance text-[2.3rem] leading-[0.98] font-semibold tracking-[-0.06em] sm:text-[3rem]">
                  {title}
                </h2>
                <p className="mt-4 max-w-2xl text-base leading-8 text-slate-200">
                  {description}
                </p>
              </div>
              <div className="flex flex-wrap gap-3 lg:justify-end">
                <Link href={primaryHref} className={publicButtonClassName.primary}>
                  {primaryLabel}
                </Link>
                <Link
                  href={secondaryHref}
                  className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/16"
                >
                  {secondaryLabel}
                </Link>
              </div>
            </div>
          </div>
        </MotionReveal>
      </div>
    </section>
  );
}

export function DemoAgendaPanel({ items }: { items: string[] }) {
  return (
    <div className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-[0_24px_60px_rgba(15,23,42,0.08)] sm:p-8">
      <p className={publicEyebrowClassName}>What your demo includes</p>
      <h3 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-slate-950">
        A business-first walkthrough, not a feature dump.
      </h3>
      <div className="mt-6 space-y-4">
        {items.map((item) => (
          <div key={item} className="flex items-start gap-3 rounded-[1.2rem] bg-slate-50 px-4 py-4">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
            <p className="text-sm leading-7 text-slate-700">{item}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SupportLaneGrid({ items }: { items: string[] }) {
  return (
    <div className="grid gap-4">
      {items.map((item) => (
        <div key={item} className={cn(publicPanelClassName, "flex items-start gap-4 p-5")}>
          <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[1rem] border border-slate-200 bg-slate-50 text-[color:var(--erp-primary)]">
            <LifeBuoy className="h-5 w-5" />
          </div>
          <p className="text-sm leading-7 text-slate-700">{item}</p>
        </div>
      ))}
    </div>
  );
}

function OperationalDashboardMockup({ metrics }: { metrics: MarketingMetric[] }) {
  const floatingCards = [
    {
      title: "Employee Analytics",
      value: "1,284 active",
      note: "+12% headcount this quarter",
      className: "public-float md:absolute md:-left-8 md:top-14",
    },
    {
      title: "Payroll Summary",
      value: "Rs 2.4 Cr",
      note: "Ready for finance approval",
      className: "public-float-delayed md:absolute md:right-0 md:top-8",
    },
    {
      title: "Notifications",
      value: "8 critical",
      note: "Policy and attendance alerts",
      className: "public-float-slow md:absolute md:-left-10 md:bottom-24",
    },
    {
      title: "Revenue Graph",
      value: "+18.6%",
      note: "Month-on-month growth",
      className: "public-float md:absolute md:right-2 md:bottom-8",
    },
  ];

  return (
    <div className="relative rounded-[2.2rem] border border-slate-200/80 bg-white/88 p-5 shadow-[0_36px_90px_rgba(15,23,42,0.12)] backdrop-blur sm:p-6 md:px-8 md:py-7">
      <div className="absolute top-5 right-5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-emerald-700">
        Live workspace
      </div>
      <div className="rounded-[1.8rem] border border-slate-200/80 bg-[linear-gradient(180deg,#f8fbff,#eef5ff)] p-5 md:p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Executive dashboard</p>
            <h3 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-slate-950">
              One intelligent ERP command center
            </h3>
          </div>
          <div className="hidden rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 sm:block">
            Multi-branch
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {metrics.slice(0, 4).map((metric) => (
            <div key={metric.label} className="rounded-[1.3rem] border border-white/70 bg-white p-4 shadow-[0_14px_30px_rgba(15,23,42,0.06)]">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate-500">
                {metric.label}
              </p>
              <p className="mt-3 text-2xl font-semibold tracking-[-0.05em] text-slate-950">{metric.value}</p>
              <p className="mt-2 text-xs leading-6 text-slate-500">{metric.helper}</p>
            </div>
          ))}
        </div>

        <div className="mt-5 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[1.4rem] bg-slate-950 p-5 text-white">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-sm text-slate-300">Attendance graph</p>
                <p className="mt-2 text-3xl font-semibold tracking-[-0.05em]">98.4%</p>
              </div>
              <LineChart className="h-6 w-6 text-sky-300" />
            </div>
            <div className="mt-6 flex h-40 items-end gap-2 rounded-[1.2rem] bg-white/8 px-3 pb-3 pt-5">
              {[40, 54, 48, 66, 61, 78, 72, 84].map((height, index) => (
                <div key={height + index} className="flex flex-1 items-end">
                  <div
                    className="w-full rounded-t-[0.9rem] bg-[linear-gradient(180deg,#7dd3fc,#34d399)]"
                    style={{ height: `${height}%` }}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4">
            {[
              {
                title: "Approval Cards",
                value: "16 pending",
                helper: "Leave, procurement, payroll review, and onboarding.",
              },
              {
                title: "Leave Summary",
                value: "214 requests",
                helper: "Approvals and exceptions grouped by branch and manager.",
              },
              {
                title: "Task Completion",
                value: "89% closed",
                helper: "Routine HR and payroll actions completed without manual chasing.",
              },
            ].map((item) => (
              <div key={item.title} className="rounded-[1.3rem] border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-950">{item.title}</p>
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-500">
                    Live
                  </span>
                </div>
                <p className="mt-3 text-xl font-semibold tracking-[-0.04em] text-slate-950">{item.value}</p>
                <p className="mt-2 text-xs leading-6 text-slate-500">{item.helper}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {[
            { title: "Expense Chart", value: "7 alerts", helper: "Outlier claims and pending reimbursements." },
            { title: "Department Statistics", value: "12 teams", helper: "Headcount, staffing, and utilization in one view." },
            { title: "Revenue Graph", value: "Rs 8.6 Cr", helper: "Collections and revenue trend tracked alongside payroll." },
          ].map((item) => (
            <div key={item.title} className="rounded-[1.3rem] border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{item.title}</p>
              <p className="mt-3 text-xl font-semibold tracking-[-0.04em] text-slate-950">{item.value}</p>
              <div className="mt-4 flex h-12 items-end gap-1.5">
                {[36, 54, 48, 68, 64, 72].map((height, index) => (
                  <div
                    key={index}
                    className="flex-1 rounded-t-full bg-[linear-gradient(180deg,rgba(31,78,158,0.28),rgba(15,118,110,0.92))]"
                    style={{ height: `${height}%` }}
                  />
                ))}
              </div>
              <p className="mt-3 text-xs leading-6 text-slate-500">{item.helper}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="pointer-events-none hidden md:block">
        {floatingCards.map((card) => (
          <div key={card.title} className={card.className}>
            <div className="w-[13.5rem] rounded-[1.25rem] border border-white/70 bg-white/92 p-4 shadow-[0_18px_38px_rgba(15,23,42,0.12)] backdrop-blur">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[color:var(--erp-primary)]">
                {card.title}
              </p>
              <p className="mt-2 text-xl font-semibold tracking-[-0.04em] text-slate-950">{card.value}</p>
              <p className="mt-2 text-xs leading-6 text-slate-500">{card.note}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-3 md:hidden">
        {floatingCards.map((card) => (
          <div key={card.title} className="rounded-[1.25rem] border border-slate-200 bg-white p-4">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[color:var(--erp-primary)]">
              {card.title}
            </p>
            <p className="mt-2 text-xl font-semibold tracking-[-0.04em] text-slate-950">{card.value}</p>
            <p className="mt-2 text-xs leading-6 text-slate-500">{card.note}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function AnimatedNumber({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const isInView = useInView(ref, { once: true, amount: 0.7 });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!isInView) return;

    const start = performance.now();
    const duration = 1400;

    const tick = (timestamp: number) => {
      const progress = Math.min((timestamp - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(value * eased);

      if (progress < 1) {
        requestAnimationFrame(tick);
      }
    };

    const frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [isInView, value]);

  const formatted =
    value % 1 === 0
      ? Math.round(display).toLocaleString("en-IN")
      : display.toFixed(1);

  return <span ref={ref}>{formatted}</span>;
}
