"use client";

import {
  useEffect,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react";
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
  TrendingUp,
  UsersRound,
  WalletCards,
  Zap,
} from "lucide-react";
import { useInView, LazyMotion, domAnimation, m } from "framer-motion";
import { cn } from "@/lib/utils";
import { MotionItem, MotionReveal, MotionStagger } from "@/components/public/PublicMotion";
import {
  publicButtonClassName,
  publicEyebrowClassName,
  publicPanelClassName,
  publicPanelHoverClassName,
  publicSectionClassName,
  publicSectionContentGapClassName,
  publicSectionSpacingClassName,
  publicTitleClassName,
  publicSubtitleClassName,
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

export const FloatingCard = ({ children, position, delay }: { children: React.ReactNode; position: string; delay: string }) => {
  return (
    <div 
      className={`absolute hidden lg:block floating-card-token ${position}`}
      style={{
        animation: 'subtleFloat 6s ease-in-out infinite',
        animationDelay: delay,
        willChange: 'transform',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 10px 30px -3px rgba(0,0,0,0.04)',
        border: '1px solid #e2e8f0',
        borderRadius: '16px',
        background: 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(16px)',
        padding: '16px',
        zIndex: 20
      }}
    >
      {children}
    </div>
  );
};

// ─── Icon maps ────────────────────────────────────────────────────────────────

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
  "it-services": BriefcaseBusiness,
  "professional-services": BriefcaseBusiness,
} as const;

// ─── Section Intro ────────────────────────────────────────────────────────────

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
    <div className={cn("flex max-w-3xl flex-col gap-4", align === "center" && "mx-auto items-center text-center")}>
      <div className={publicEyebrowClassName}>
        <span className="h-1.5 w-1.5 rounded-full bg-indigo-600" />
        {eyebrow}
      </div>
      <h2 className={publicTitleClassName}>{title}</h2>
      <p className={publicSubtitleClassName}>{subtitle}</p>
    </div>
  );
}

// ─── Marketing Hero ───────────────────────────────────────────────────────────

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
    <section className="pub-hero-bg relative overflow-hidden border-b border-slate-200 pt-12 pb-20 sm:pt-16 sm:pb-28 mb-[120px]">
      {/* Dot grid */}
      <div className="pub-dot-grid pointer-events-none absolute inset-0 opacity-40" />

      <div className={cn(publicSectionClassName, "relative grid grid-cols-1 xl:grid-cols-[45fr_55fr] gap-12 items-center")}>
        <MotionReveal className="flex flex-col items-start w-full min-w-0">
          {/* Eyebrow */}
          <div className="pub-badge">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
            {eyebrow}
          </div>

          {/* Headline */}
          <h1 className="mt-6 text-[clamp(2.25rem,4.5vw,4.5rem)] font-extrabold leading-[1.05] tracking-tight text-slate-900 max-w-[700px] text-balance font-sans">
            {title}
          </h1>

          <p className="mt-5 text-xl leading-relaxed text-slate-500 max-w-[clamp(560px,60ch,680px)] w-auto text-pretty">{subtitle}</p>

          {/* Actions */}
          <div className="mt-8 flex flex-wrap gap-4">{actions}</div>

          {/* Trust signals */}
          {trustSignals.length > 0 && (
            <div className="mt-7 flex flex-wrap gap-3">
              {trustSignals.slice(0, 4).map((item) => (
                <div
                  key={item}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm"
                >
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  {item}
                </div>
              ))}
            </div>
          )}

          {/* Module badges */}
          <div className="mt-5 flex flex-wrap gap-2">
            {badges.slice(0, 6).map((badge) => (
              <span
                key={badge}
                className="rounded-full border border-slate-200 bg-white px-3.5 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 shadow-sm"
              >
                {badge}
              </span>
            ))}
          </div>
        </MotionReveal>

        <MotionReveal delay={0.1} className="w-full min-w-0 lg:translate-y-16">
          <div className="relative">
            {/* Ambient graphic glow backdrops */}
            <div className="absolute -top-10 -right-10 -z-10 h-72 w-72 rounded-full bg-[#6366F1]/15 blur-[85px] pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 -z-10 h-72 w-72 rounded-full bg-[#3B82F6]/15 blur-[85px] pointer-events-none" />

            {/* Floating widget 1: Employees Active (Top Right) */}
            <FloatingCard position="-top-6 -right-8" delay="0s">
              <div className="flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold text-slate-800">1,248 Employees Active</span>
              </div>
            </FloatingCard>

            {/* Floating widget 2: Payroll Disbursed (Bottom Left) */}
            <FloatingCard position="-bottom-5 -left-10" delay="1s">
              <div className="flex items-center gap-2.5">
                <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                <span className="text-xs font-bold text-slate-800">Payroll Disbursed Successfully</span>
              </div>
            </FloatingCard>

            {/* Floating widget 3: Live Sync (Bottom Right) */}
            <FloatingCard position="-bottom-7 -right-6" delay="2s">
              <div className="flex items-center gap-2.5">
                <Zap className="h-4 w-4 text-cyan-600 shrink-0" />
                <span className="text-xs font-bold text-slate-800">Live Sync Connected</span>
              </div>
            </FloatingCard>

            <DashboardPreview metrics={metrics} />
          </div>
        </MotionReveal>
      </div>
    </section>
  );
}

// ─── Dashboard Preview Mockup ─────────────────────────────────────────────────

function DashboardPreview({ metrics }: { metrics: MarketingMetric[] }) {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"];

  return (
    <div className="relative rounded-2xl border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.10),0_4px_16px_rgba(15,23,42,0.06)] overflow-hidden select-none">
      {/* Top indigo line */}
      <div className="h-1 w-full bg-gradient-to-r from-indigo-500 via-indigo-600 to-cyan-500" />

      {/* Title bar */}
      <div className="flex items-center border-b border-[#F3F4F6] px-4 py-3.5 bg-slate-50/80 relative">
        {/* Windows controls dots */}
        <div className="absolute left-4 flex gap-2">
          <div className="h-3 w-3 rounded-full bg-[#FF5F56] opacity-90 shadow-sm" />
          <div className="h-3 w-3 rounded-full bg-[#FFBD2E] opacity-90 shadow-sm" />
          <div className="h-3 w-3 rounded-full bg-[#27C93F] opacity-90 shadow-sm" />
        </div>
        
        {/* Perfectly centered URL Address bar */}
        <div className="mx-auto flex items-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-1 text-[10px] text-slate-500 font-semibold tracking-wide shadow-sm max-w-[240px] justify-center">
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>uabindia.erp.app · Dashboard</span>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* KPI row */}
        <div className="grid grid-cols-3 gap-3">
          {metrics.slice(0, 3).map((m) => (
            <div key={m.label} className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-left">
              <p className="text-[9px] uppercase tracking-wider font-bold text-slate-400 truncate">{m.label}</p>
              <p className="mt-1 text-base font-extrabold text-slate-900 tracking-tight">{m.value}</p>
            </div>
          ))}
        </div>

        {/* High-Fidelity SVG Curved Area Chart */}
        <div className="rounded-xl border border-slate-100 p-4 bg-white relative">
          <div className="flex items-center justify-between mb-3 text-left">
            <div>
              <p className="text-xs font-bold text-slate-700">Payroll & Cashflow Trend</p>
              <p className="mt-0.5 text-xl font-extrabold text-slate-900 tracking-tight">₹4.82 Cr</p>
            </div>
            <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
              ↑ 12% this month
            </span>
          </div>
          
          <div className="h-28 w-full relative">
            <svg className="w-full h-full" viewBox="0 0 320 100" preserveAspectRatio="none">
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366F1" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#6366F1" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              {/* Area path */}
              <path
                d="M 0 100 Q 40 70 80 80 T 160 50 T 240 30 T 320 15 L 320 100 Z"
                fill="url(#chartGradient)"
              />
              {/* Line path */}
              <path
                d="M 0 100 Q 40 70 80 80 T 160 50 T 240 30 T 320 15"
                fill="none"
                stroke="#6366F1"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
            
            {/* Interactive pulsing live dot at peak */}
            <div className="absolute top-[12px] right-[4px] h-2.5 w-2.5 rounded-full bg-indigo-600 shadow-md">
              <div className="absolute inset-0 rounded-full bg-indigo-600 animate-ping opacity-75" />
            </div>
          </div>
          
          {/* Months label row */}
          <div className="flex justify-between mt-2.5 px-1 text-[9px] font-bold text-slate-400">
            {months.map((m) => (
              <span key={m}>{m}</span>
            ))}
          </div>
        </div>

        {/* Elevated status badges */}
        <div className="grid grid-cols-2 gap-2.5">
          {[
            { label: "Core HR & Directory", status: "Connected", active: true },
            { label: "Statutory Payroll", status: "Compliant", active: true },
            { label: "Consolidated Ledger", status: "Balanced", active: true },
            { label: "Real-time Audit Logs", status: "Audited", active: true }
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between gap-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-left">
              <span className="text-[10px] font-bold text-slate-600 truncate">{item.label}</span>
              <span className="shrink-0 flex items-center gap-1 text-[8px] font-extrabold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md">
                <span className="h-1 w-1 rounded-full bg-indigo-600 animate-pulse" />
                {item.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Trust Ribbon ─────────────────────────────────────────────────────────────

export function TrustRibbon({ items }: { items: TrustedOrganization[] }) {
  return (
    <section className="border-y border-slate-100 bg-slate-50 py-12">
      <div className={publicSectionClassName}>
        <MotionReveal>
          <p className="mb-8 text-center text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
            Trusted by organizations across India
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {items.map((item) => (
              <div
                key={item.name}
                className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3.5 shadow-sm transition hover:border-indigo-200 hover:shadow-md"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-700 text-xs font-bold text-white shadow-sm">
                  {item.mark}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-800">{item.name}</p>
                  <p className="truncate text-xs text-slate-400">{item.sector}</p>
                </div>
              </div>
            ))}
          </div>
        </MotionReveal>
      </div>
    </section>
  );
}

// ─── Problem Grid ─────────────────────────────────────────────────────────────

export function ProblemGrid({ items }: { items: MarketingProblem[] }) {
  return (
    <section className={publicSectionSpacingClassName}>
      <div className={publicSectionClassName}>
        <MotionReveal>
          <SectionIntro
            eyebrow="Business problems"
            title="Most ERP searches begin after teams hit the same operating ceiling."
            subtitle="The issue is rarely a missing report. It is usually scattered systems, weak control, and too many manual handoffs between departments."
          />
        </MotionReveal>
        <MotionStagger className={cn(publicSectionContentGapClassName, "grid gap-5 md:grid-cols-2 xl:grid-cols-4")}>
          {items.map((item) => (
            <MotionItem key={item.title}>
              <article className={cn(publicPanelHoverClassName, "h-full p-6")}>
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <Sparkles className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-lg font-bold tracking-tight text-slate-900">{item.title}</h3>
                <p className="mt-2.5 text-sm leading-7 text-slate-500">{item.description}</p>
                <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-500">
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

// ─── Solution Framework ───────────────────────────────────────────────────────

export function SolutionFramework({ items }: { items: Array<{ title: string; detail: string }> }) {
  return (
    <section className={publicSectionSpacingClassName}>
      <div className={cn(publicSectionClassName, "grid gap-6 xl:grid-cols-[0.9fr_1.1fr]")}>
        <MotionReveal>
          <div className="rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-800 p-8 text-white shadow-[0_16px_48px_rgba(79,70,229,0.25)]">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-[0.7rem] font-bold uppercase tracking-[0.18em] text-indigo-200">
              <span className="h-1.5 w-1.5 rounded-full bg-white" />
              Solution design
            </div>
            <h2 className="mt-5 text-2xl font-bold leading-[1.1] tracking-tight">
              One business, one data core, one clear operating picture.
            </h2>
            <p className="mt-4 text-sm leading-7 text-indigo-200">
              UabIndia ERP collapses fragmented HR, payroll, finance, procurement, inventory, CRM, and project workflows into one disciplined platform.
            </p>
            <div className="mt-6 grid gap-2.5 sm:grid-cols-2">
              {["Live approvals", "Tenant-aware access", "Cross-module reporting", "Audit-ready history"].map((pill) => (
                <div
                  key={pill}
                  className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-medium text-white"
                >
                  <Check className="h-4 w-4 text-emerald-300 shrink-0" />
                  {pill}
                </div>
              ))}
            </div>
          </div>
        </MotionReveal>

        <MotionStagger className="grid gap-4 md:grid-cols-2">
          {items.map((item) => (
            <MotionItem key={item.title}>
              <article className={cn(publicPanelHoverClassName, "h-full p-6")}>
                <div className={publicEyebrowClassName}>
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-600" />
                  {item.title}
                </div>
                <p className="mt-4 text-sm leading-7 text-slate-500">{item.detail}</p>
              </article>
            </MotionItem>
          ))}
        </MotionStagger>
      </div>
    </section>
  );
}

// ─── Connected Flow ────────────────────────────────────────────────────────────

export function ConnectedFlowSection() {
  const nodes = ["Employees", "Attendance", "Payroll", "Finance", "Reports", "Management"];
  return (
    <section className={cn(publicSectionSpacingClassName, "pub-section-tint py-16")}>
      <div className={publicSectionClassName}>
        <MotionReveal>
          <SectionIntro
            eyebrow="Connected workflow"
            title="The platform connects every critical business handoff in one operating flow."
            subtitle="Instead of moving information between separate tools, UabIndia ERP keeps employee data, attendance, payroll, finance, reports, and leadership dashboards connected by design."
          />
        </MotionReveal>
        <MotionReveal delay={0.06} className={publicSectionContentGapClassName}>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="grid gap-3 lg:grid-cols-6">
              {nodes.map((node, index) => (
                <div key={node} className="flex flex-col items-center gap-3 lg:flex-row">
                  <div className="flex h-full w-full items-center justify-center rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-4 text-center text-sm font-bold text-indigo-800">
                    {node}
                  </div>
                  {index < nodes.length - 1 && (
                    <>
                      <div className="hidden h-px flex-1 bg-gradient-to-r from-indigo-400 to-cyan-400 lg:block" />
                      <div className="text-indigo-400 lg:hidden">
                        <ArrowDown className="h-5 w-5" />
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </MotionReveal>
      </div>
    </section>
  );
}

// ─── Module Grid ──────────────────────────────────────────────────────────────

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
  const categoryColors: Record<string, string> = {
    People: "bg-violet-50 text-violet-700 border-violet-200",
    Finance: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Operations: "bg-cyan-50 text-cyan-700 border-cyan-200",
    Engagement: "bg-orange-50 text-orange-700 border-orange-200",
  };

  return (
    <section className={publicSectionSpacingClassName}>
      <div className={publicSectionClassName}>
        <MotionReveal>
          <SectionIntro eyebrow={eyebrow} title={title} subtitle={subtitle} />
        </MotionReveal>
        <MotionStagger className={cn(publicSectionContentGapClassName, "grid gap-5 md:grid-cols-2 xl:grid-cols-4")}>
          {modules.map((module) => {
            const Icon = moduleIconMap[module.icon as keyof typeof moduleIconMap] || Sparkles;
            const catClass = categoryColors[module.category] || "bg-slate-50 text-slate-600 border-slate-200";
            return (
              <MotionItem key={module.slug}>
                <article className={cn(publicPanelHoverClassName, "group flex h-full flex-col p-6")}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 shadow-sm">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className={cn("rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em]", catClass)}>
                      {module.category}
                    </span>
                  </div>
                  <h3 className="mt-4 text-base font-bold tracking-tight text-slate-900">{module.title}</h3>
                  <p className="mt-2 flex-1 text-sm leading-6 text-slate-500">{module.summary}</p>
                  <div className="mt-4 space-y-2">
                    {module.outcomes.slice(0, 2).map((outcome) => (
                      <div key={outcome} className="flex items-center gap-2 text-xs text-slate-500">
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                        <span>{outcome}</span>
                      </div>
                    ))}
                  </div>
                  <Link
                    href={`/products/${module.slug}`}
                    className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 transition hover:text-indigo-800"
                  >
                    Learn more
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
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

// ─── Highlight Chip Grid ──────────────────────────────────────────────────────

export function HighlightChipGrid({ items }: { items: string[] }) {
  return (
    <section className={cn(publicSectionSpacingClassName, "pub-section-tint py-16")}>
      <div className={publicSectionClassName}>
        <MotionReveal>
          <SectionIntro
            eyebrow="Key features"
            title="Enterprise controls, mobility, security, and automation in one product layer."
            subtitle="The platform is designed for real operating teams: role-based access, approval logic, field-ready workflows, integrations, and AI readiness."
          />
        </MotionReveal>
        <MotionStagger className={cn(publicSectionContentGapClassName, "flex flex-wrap gap-3")}>
          {items.map((item) => (
            <MotionItem key={item} className="basis-full sm:basis-auto">
              <div className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700">
                <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                {item}
              </div>
            </MotionItem>
          ))}
        </MotionStagger>
      </div>
    </section>
  );
}

// ─── Process Timeline ─────────────────────────────────────────────────────────

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
    <section className={publicSectionSpacingClassName}>
      <div className={publicSectionClassName}>
        <MotionReveal>
          <SectionIntro eyebrow={eyebrow} title={title} subtitle={subtitle} />
        </MotionReveal>
        <MotionStagger className={cn(publicSectionContentGapClassName, "grid gap-5 lg:grid-cols-3 xl:grid-cols-6")}>
          {items.map((item) => (
            <MotionItem key={item.step}>
              <article className={cn(publicPanelHoverClassName, "relative h-full p-6")}>
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-sm font-bold text-white shadow-md shadow-indigo-500/30">
                  {item.step}
                </div>
                <h3 className="mt-4 text-base font-bold tracking-tight text-slate-900">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">{item.description}</p>
              </article>
            </MotionItem>
          ))}
        </MotionStagger>
      </div>
    </section>
  );
}

// ─── Analytics Showcase ───────────────────────────────────────────────────────

export function AnalyticsShowcase({ metrics }: { metrics: MarketingMetric[] }) {
  const barValues = [54, 68, 61, 79, 74, 92, 88];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"];

  return (
    <section className={publicSectionSpacingClassName}>
      <div className={cn(publicSectionClassName, "grid gap-6 xl:grid-cols-[1.1fr_0.9fr]")}>
        <MotionReveal>
          <div className={cn(publicPanelClassName, "overflow-hidden p-0")}>
            {/* Header bar */}
            <div className="h-1 bg-gradient-to-r from-indigo-500 to-cyan-500" />
            <div className="p-6 border-b border-slate-100">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className={publicEyebrowClassName}>
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-600" />
                    Dashboard preview
                  </div>
                  <h3 className="mt-3 text-xl font-bold tracking-tight text-slate-900">
                    A leadership dashboard built for real operational questions.
                  </h3>
                </div>
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                  ● Live
                </span>
              </div>
            </div>
            <div className="p-6 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
              {/* Chart */}
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex items-end justify-between gap-3 mb-4">
                  <div>
                    <p className="text-xs font-medium text-slate-500">Payroll trend</p>
                    <p className="mt-1 text-2xl font-bold text-slate-900">₹4.8 Cr</p>
                  </div>
                  <span className="rounded-full bg-indigo-50 border border-indigo-200 px-2.5 py-1 text-[10px] font-bold text-indigo-700">
                    This month
                  </span>
                </div>
                <div className="flex h-28 items-end gap-1.5">
                  {barValues.map((v, i) => (
                    <div key={i} className="flex flex-1 flex-col items-center gap-1">
                      <div
                        className="w-full rounded-t bg-gradient-to-t from-indigo-600 to-indigo-400"
                        style={{ height: `${v}%` }}
                      />
                      <span className="text-[9px] font-medium text-slate-400">{months[i]}</span>
                    </div>
                  ))}
                </div>
              </div>
              {/* Mini stats */}
              <div className="grid gap-3">
                {[
                  { label: "Leave analytics", value: "214", helper: "Cases by branch" },
                  { label: "Dept mix", value: "12 depts", helper: "Live headcount" },
                  { label: "Expense alerts", value: "7 alerts", helper: "Outlier claims" },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{item.label}</p>
                    <p className="mt-1 text-xl font-bold text-slate-900">{item.value}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{item.helper}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </MotionReveal>

        <MotionStagger className="grid gap-4">
          {metrics.map((metric) => (
            <MotionItem key={metric.label}>
              <div className="pub-stat-card">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{metric.label}</p>
                <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{metric.value}</p>
                <p className="mt-2 text-sm leading-6 text-slate-500">{metric.helper}</p>
              </div>
            </MotionItem>
          ))}
        </MotionStagger>
      </div>
    </section>
  );
}

// ─── Animated Stats Band ──────────────────────────────────────────────────────

export function AnimatedStatsBand({ items }: { items: Array<{ value: number; suffix: string; label: string }> }) {
  return (
    <section className={publicSectionSpacingClassName}>
      <div className={publicSectionClassName}>
        <MotionReveal>
          <div className="pub-section-indigo rounded-2xl px-8 py-12 text-white shadow-[0_16px_48px_rgba(79,70,229,0.30)]">
            <div className="mb-8 text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-[0.7rem] font-bold uppercase tracking-[0.2em] text-indigo-200">
                Business impact
              </div>
              <h2 className="mt-4 text-[2.2rem] font-bold tracking-tight sm:text-[2.8rem]">
                Built for scale, speed, and reliability.
              </h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {items.map((item) => (
                <div key={item.label} className="rounded-xl border border-white/15 bg-white/10 px-5 py-6 text-center backdrop-blur">
                  <p className="text-[3rem] font-bold leading-none tracking-tight">
                    <AnimatedNumber value={item.value} />
                    {item.suffix}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-indigo-200">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </MotionReveal>
      </div>
    </section>
  );
}

// ─── Industry Grid ────────────────────────────────────────────────────────────

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
    <section className={cn(publicSectionSpacingClassName, "pub-section-tint py-16")}>
      <div className={publicSectionClassName}>
        <MotionReveal>
          <SectionIntro eyebrow={eyebrow} title={title} subtitle={subtitle} />
        </MotionReveal>
        <MotionStagger className={cn(publicSectionContentGapClassName, "grid gap-5 md:grid-cols-2 xl:grid-cols-3")}>
          {industries.map((industry) => {
            const Icon = industryIconMap[industry.slug as keyof typeof industryIconMap] || Building2;
            return (
              <MotionItem key={industry.slug}>
                <article className={cn(publicPanelHoverClassName, "group flex h-full flex-col p-6")}>
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 shadow-sm">
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-600">{industry.eyebrow}</p>
                  <h3 className="mt-2 text-xl font-bold tracking-tight text-slate-900">{industry.title}</h3>
                  <p className="mt-2 flex-1 text-sm leading-7 text-slate-500">{industry.summary}</p>
                  <Link
                    href={`/industries/${industry.slug}`}
                    className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 transition hover:text-indigo-800"
                  >
                    Explore solution
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
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

// ─── Comparison Table ─────────────────────────────────────────────────────────

export function ComparisonTable({ rows }: { rows: ComparisonRow[] }) {
  return (
    <section className={publicSectionSpacingClassName}>
      <div className={publicSectionClassName}>
        <MotionReveal>
          <SectionIntro
            eyebrow="Why choose UabIndia"
            title="The difference is not only features. It is the operating model behind them."
            subtitle="The best ERP decision is the one that reduces manual work, strengthens control, and keeps adoption realistic for the business."
          />
        </MotionReveal>
        <MotionReveal delay={0.05} className={cn(publicSectionContentGapClassName, "overflow-hidden rounded-2xl border border-slate-200 shadow-[0_4px_24px_rgba(15,23,42,0.08)]")}>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead>
                <tr className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white">
                  {["Capability", "Excel", "Traditional ERP", "UabIndia ERP"].map((h) => (
                    <th key={h} className="px-6 py-4 text-sm font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {rows.map((row, idx) => (
                  <tr key={row.capability} className={cn("transition hover:bg-indigo-50/30", idx % 2 === 1 && "bg-slate-50/50")}>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-800">{row.capability}</td>
                    <td className="px-6 py-4 text-sm text-slate-400">{row.excel}</td>
                    <td className="px-6 py-4 text-sm text-slate-400">{row.traditional}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
                        <Check className="h-4 w-4 text-emerald-500" />
                        {row.uabindia}
                      </div>
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

// ─── Testimonials Grid ────────────────────────────────────────────────────────

export function TestimonialsGrid({ testimonials }: { testimonials: Testimonial[] }) {
  return (
    <section className={cn(publicSectionSpacingClassName, "pub-section-tint py-16")}>
      <div className={publicSectionClassName}>
        <MotionReveal>
          <SectionIntro
            eyebrow="Customer stories"
            title="Operators share what changed after switching to UabIndia ERP."
            subtitle="These are not launch-day quotes. They come from teams that have been operating on the platform."
          />
        </MotionReveal>
        <MotionStagger className={cn(publicSectionContentGapClassName, "grid gap-5 md:grid-cols-2 xl:grid-cols-3")}>
          {testimonials.map((t) => (
            <MotionItem key={t.name}>
              <article className={cn(publicPanelHoverClassName, "flex h-full flex-col p-6")}>
                <div className="flex gap-1">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <blockquote className="mt-4 flex-1 text-sm leading-7 text-slate-500">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>
                <div className="mt-5 border-t border-slate-100 pt-4">
                  <p className="text-sm font-bold text-slate-800">{t.name}</p>
                  <p className="mt-0.5 text-xs text-slate-400">{t.role}, {t.company}</p>
                </div>
                {t.result && (
                  <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-emerald-700">
                    ✓ {t.result}
                  </div>
                )}
              </article>
            </MotionItem>
          ))}
        </MotionStagger>
      </div>
    </section>
  );
}

// ─── CTA Panel ────────────────────────────────────────────────────────────────

export function CtaPanel({
  eyebrow,
  title,
  body,
  description,
  primaryLabel,
  primaryHref,
  secondaryLabel,
  secondaryHref,
}: {
  eyebrow: string;
  title: string;
  body?: string;
  description?: string;
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel: string;
  secondaryHref: string;
}) {
  const bodyText = body || description || "";

  return (
    <section className={publicSectionSpacingClassName}>
      <div className={publicSectionClassName}>
        <MotionReveal>
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-indigo-800 px-8 py-16 text-center shadow-[0_20px_60px_rgba(79,70,229,0.30)] sm:px-16">
            {/* Top glow ring */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
            {/* Subtle dot pattern */}
            <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "24px 24px" }} />

            <div className="relative">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-[0.68rem] font-bold uppercase tracking-[0.2em] text-indigo-200">
                <span className="h-1.5 w-1.5 rounded-full bg-white" />
                {eyebrow}
              </div>
              <h2 className="mx-auto mt-5 max-w-3xl text-balance text-[clamp(1.9rem,3.5vw,3rem)] font-bold tracking-tight text-white">
                {title}
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-base leading-8 text-indigo-200">{bodyText}</p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                <Link
                  href={primaryHref}
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3.5 text-sm font-bold text-indigo-700 shadow-lg transition hover:bg-indigo-50 hover:-translate-y-0.5"
                >
                  {primaryLabel}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href={secondaryHref}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-7 py-3.5 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20 hover:-translate-y-0.5"
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

// ─── Pricing Grid ─────────────────────────────────────────────────────────────

export function PricingGrid({
  plans,
  eyebrow = "Pricing",
  title = "Clear investment tiers for different implementation stages.",
  subtitle = "Every tier includes full platform access. The difference is in implementation depth, support level, and configuration scope.",
  audience,
}: {
  plans: import("@/lib/public-marketing").PricingPlan[];
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  audience: import("@/lib/public-audience").PublicAudience;
}) {
  return (
    <section className={publicSectionSpacingClassName}>
      <div className={publicSectionClassName}>
        <MotionReveal>
          <SectionIntro eyebrow={eyebrow} title={title} subtitle={subtitle} align="center" />
        </MotionReveal>
        <MotionStagger className={cn(publicSectionContentGapClassName, "grid gap-6 lg:grid-cols-3")}>
          {plans.map((plan) => (
            <MotionItem key={plan.name}>
              <article
                className={cn(
                  "flex h-full flex-col rounded-2xl border p-7 transition",
                  plan.featured
                    ? "border-indigo-200 bg-gradient-to-b from-indigo-50 to-white shadow-[0_16px_48px_rgba(79,70,229,0.15)] ring-2 ring-indigo-600/20"
                    : "border-slate-200 bg-white shadow-sm hover:shadow-md hover:border-indigo-100"
                )}
              >
                {plan.featured && (
                  <div className="mb-4 inline-flex items-center gap-1.5 self-start rounded-full border border-indigo-200 bg-indigo-600 px-3 py-1 text-xs font-bold text-white">
                    <Sparkles className="h-3 w-3" />
                    Most popular
                  </div>
                )}
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">{plan.audience}</p>
                <h3 className="mt-2 text-xl font-bold text-slate-900">{plan.name}</h3>
                <p className="mt-2.5 text-sm leading-6 text-slate-500">{plan.summary}</p>
                <p className="mt-5 text-3xl font-bold text-slate-900">{plan.price}</p>
                <p className="mt-1 text-xs text-slate-400">{plan.implementation}</p>
                <div className="mt-6 flex-1 space-y-3">
                  {plan.points.map((point) => (
                    <div key={point} className="flex items-start gap-3 text-sm text-slate-600">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500 mt-0.5" />
                      <span>{point}</span>
                    </div>
                  ))}
                </div>
                <Link
                  href={`/book-demo?plan=${plan.name.toLowerCase().replace(/\s+/g, "-")}`}
                  className={cn(
                    "mt-8 inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-bold transition",
                    plan.featured
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/25 hover:bg-indigo-700"
                      : "border border-slate-200 bg-white text-slate-700 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                  )}
                >
                  Get started
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </article>
            </MotionItem>
          ))}
        </MotionStagger>
      </div>
    </section>
  );
}

// ─── Resource Grid ────────────────────────────────────────────────────────────

export function ResourceGrid({ resources }: { resources: ResourceCard[] }) {
  return (
    <section className={publicSectionSpacingClassName}>
      <div className={publicSectionClassName}>
        <MotionReveal>
          <SectionIntro
            eyebrow="Resources"
            title="Evaluation material, rollout notes, and implementation guidance."
            subtitle="Use these before your first demo or during scoping to review module fit, implementation expectations, and product depth."
          />
        </MotionReveal>
        <MotionStagger className={cn(publicSectionContentGapClassName, "grid gap-5 md:grid-cols-2 xl:grid-cols-3")}>
          {resources.map((resource) => (
            <MotionItem key={resource.title}>
              <Link href={resource.href} className={cn(publicPanelHoverClassName, "group flex h-full flex-col p-6")}>
                <div className="flex items-center justify-between gap-3">
                  <span className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-indigo-600">
                    {resource.type}
                  </span>
                  <ArrowRight className="h-4 w-4 text-slate-400 transition group-hover:text-indigo-600 group-hover:translate-x-0.5" />
                </div>
                <h3 className="mt-4 text-base font-bold tracking-tight text-slate-900 group-hover:text-indigo-700 transition">
                  {resource.title}
                </h3>
                <p className="mt-2 flex-1 text-sm leading-6 text-slate-500">{resource.summary}</p>
              </Link>
            </MotionItem>
          ))}
        </MotionStagger>
      </div>
    </section>
  );
}

// ─── FAQ Section ──────────────────────────────────────────────────────────────

export function FaqSection({ items }: { items: FaqItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className={publicSectionSpacingClassName}>
      <div className={cn(publicSectionClassName, "grid gap-10 xl:grid-cols-[0.9fr_1.1fr]")}>
        <MotionReveal>
          <SectionIntro
            eyebrow="Frequently asked"
            title="Questions teams ask before starting the evaluation."
            subtitle="These cover scope, implementation, pricing, and product depth for new evaluators."
          />
        </MotionReveal>
        <MotionReveal delay={0.05}>
          <div className="space-y-3">
            {items.map((item, index) => (
              <div
                key={item.question}
                className={cn(
                  "rounded-xl border transition-all duration-200",
                  openIndex === index
                    ? "border-indigo-200 bg-indigo-50 shadow-sm"
                    : "border-slate-200 bg-white hover:border-slate-300"
                )}
              >
                <button
                  type="button"
                  className="flex w-full items-start justify-between gap-4 px-5 py-4 text-left"
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                >
                  <span className="text-sm font-semibold text-slate-800">{item.question}</span>
                  <ChevronDown
                    className={cn(
                      "h-5 w-5 shrink-0 text-slate-400 transition-transform duration-200",
                      openIndex === index && "rotate-180 text-indigo-600"
                    )}
                  />
                </button>
                {openIndex === index && (
                  <div className="border-t border-indigo-100 px-5 pb-4 pt-3">
                    <p className="text-sm leading-7 text-slate-600">{item.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </MotionReveal>
      </div>
    </section>
  );
}

// ─── Demo Video ───────────────────────────────────────────────────────────────

export function DemoVideo({ agenda }: { agenda: string[] }) {
  return (
    <section className={publicSectionSpacingClassName}>
      <div className={publicSectionClassName}>
        <MotionReveal>
          <div className="grid gap-8 xl:grid-cols-[1fr_0.9fr]">
            <div className="flex h-80 items-center justify-center rounded-2xl border border-slate-200 bg-gradient-to-br from-indigo-50 to-slate-50 shadow-sm">
              <div className="flex flex-col items-center gap-4">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-600 shadow-lg shadow-indigo-500/30 transition hover:scale-105">
                  <PlayCircle className="h-8 w-8 text-white" />
                </div>
                <p className="text-sm font-semibold text-slate-600">Watch product demo</p>
              </div>
            </div>
            <div className="flex flex-col justify-center gap-5">
              <div className={publicEyebrowClassName}>
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-600" />
                Platform walkthrough
              </div>
              <h2 className="text-[1.8rem] font-bold tracking-tight text-slate-900">
                See how the platform runs a real business workflow end-to-end.
              </h2>
              <div className="space-y-3">
                {agenda.map((item, index) => (
                  <div key={item} className="flex items-start gap-3 text-sm text-slate-600">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white">
                      {index + 1}
                    </span>
                    {item}
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

// ─── Value Grid ───────────────────────────────────────────────────────────────

export function ValueGrid({
  items,
  eyebrow = "Our values",
  title = "The principles that drive how we build and support the platform.",
  subtitle = "These are not aspirational statements. They describe specific decisions we make repeatedly when designing, deploying, and supporting the ERP.",
}: {
  items: Array<{ title: string; body?: string; description?: string }>;
  eyebrow?: string;
  title?: string;
  subtitle?: string;
}) {
  return (
    <section className={publicSectionSpacingClassName}>
      <div className={publicSectionClassName}>
        <MotionReveal>
          <SectionIntro eyebrow={eyebrow} title={title} subtitle={subtitle} />
        </MotionReveal>
        <MotionStagger className={cn(publicSectionContentGapClassName, "grid gap-5 md:grid-cols-2 xl:grid-cols-3")}>
          {items.map((item) => (
            <MotionItem key={item.title}>
              <article className={cn(publicPanelHoverClassName, "h-full p-6")}>
                <h3 className="text-lg font-bold tracking-tight text-slate-900">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-500">{item.body || item.description}</p>
              </article>
            </MotionItem>
          ))}
        </MotionStagger>
      </div>
    </section>
  );
}

// ─── Demo Agenda Panel ────────────────────────────────────────────────────────

export function DemoAgendaPanel({ items }: { items: string[] }) {
  return (
    <div className={cn(publicPanelClassName, "p-6")}>
      <div className={publicEyebrowClassName}>
        <span className="h-1.5 w-1.5 rounded-full bg-indigo-600" />
        Demo agenda
      </div>
      <h3 className="mt-4 text-xl font-bold tracking-tight text-slate-900">What we cover in the demo</h3>
      <div className="mt-5 space-y-3">
        {items.map((item, index) => (
          <div key={item} className="flex items-start gap-3 text-sm text-slate-600">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
              {index + 1}
            </span>
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Support Lane Grid ────────────────────────────────────────────────────────

export function SupportLaneGrid({
  items,
}: {
  items: Array<{ title: string; detail: string; channel?: string } | string>;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {items.map((item, i) => {
        const title = typeof item === "string" ? item : item.title;
        const detail = typeof item === "string" ? "" : item.detail;
        const channel = typeof item === "string" ? undefined : item.channel;
        return (
          <div key={title + i} className={cn(publicPanelHoverClassName, "p-5")}>
            {channel && <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-600">{channel}</p>}
            <h4 className={cn("text-base font-bold text-slate-900", channel && "mt-2")}>{title}</h4>
            {detail && <p className="mt-2 text-sm leading-6 text-slate-500">{detail}</p>}
          </div>
        );
      })}
    </div>
  );
}

// ─── Animated Number ──────────────────────────────────────────────────────────

function AnimatedNumber({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const duration = 1200;
    const start = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * value));
      if (progress >= 1) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [inView, value]);

  return <span ref={ref}>{display}</span>;
}
