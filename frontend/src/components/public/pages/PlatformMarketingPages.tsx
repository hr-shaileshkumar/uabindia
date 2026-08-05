"use client";

import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  FileText,
  GraduationCap,
  HeartPulse,
  Landmark,
  Layers3,
  Library,
  MessageSquareText,
  Package,
  ShoppingCart,
  Store,
  Truck,
  Users,
  UsersRound,
  WalletCards,
  Zap,
} from "lucide-react";
import { FloatingCard } from "@/components/public/PublicMarketingBlocks";
import PublicAudiencePageFrame from "@/components/public/PublicAudiencePageFrame";
import PublicStructuredData from "@/components/public/PublicStructuredData";
import { MotionReveal } from "@/components/public/PublicMotion";
import {
  publicButtonClassName,
  publicPageSectionClassName,
  publicPanelClassName,
  publicSectionClassName,
  publicSectionSpacingClassName,
} from "@/components/public/publicStyles";
import { ContactDemoForm } from "@/components/erp/contact-demo-form";
import { usePublicPageData } from "@/hooks/usePublicPageData";
import {
  demoAgenda,
  getRecommendedModules,
  marketingIndustries,
  marketingModules,
  pricingPlans,
  publicSiteUrl,
  resources,
  supportLanes,
  type MarketingIndustry,
  type MarketingModule,
} from "@/lib/public-marketing";
import { withPublicAudience, type PublicAudience } from "@/lib/public-audience";

function renderModuleIcon(slug: string, className: string) {
  switch (slug) {
    case "hrms":
      return <UsersRound className={className} />;
    case "payroll":
      return <WalletCards className={className} />;
    case "attendance":
      return <Clock3 className={className} />;
    case "leave":
      return <CalendarDays className={className} />;
    case "recruitment":
      return <BriefcaseBusiness className={className} />;
    case "performance":
      return <BarChart3 className={className} />;
    case "asset-management":
      return <Package className={className} />;
    case "finance":
      return <Landmark className={className} />;
    case "inventory":
      return <Layers3 className={className} />;
    case "procurement":
      return <ShoppingCart className={className} />;
    case "crm":
    case "help-desk":
      return <MessageSquareText className={className} />;
    case "project-management":
      return <Building2 className={className} />;
    case "reporting":
      return <FileText className={className} />;
    default:
      return <Layers3 className={className} />;
  }
}

function renderIndustryIcon(slug: string, className: string) {
  switch (slug) {
    case "manufacturing":
      return <Building2 className={className} />;
    case "healthcare":
    case "hospital":
      return <HeartPulse className={className} />;
    case "education":
      return <GraduationCap className={className} />;
    case "retail":
      return <Store className={className} />;
    case "construction":
      return <ShoppingCart className={className} />;
    case "logistics":
      return <Truck className={className} />;
    case "agriculture":
      return <Library className={className} />;
    case "pharma":
      return <WalletCards className={className} />;
    case "government":
      return <Landmark className={className} />;
    case "ngo":
    case "professional-services":
      return <BriefcaseBusiness className={className} />;
    case "it-services":
      return <BarChart3 className={className} />;
    default:
      return <Building2 className={className} />;
  }
}

function DashboardPreview() {
  return (
    <div className="rounded-[1.45rem] border border-[#dce8ff] bg-[linear-gradient(180deg,#ffffff,#f4f8ff)] p-3.5 shadow-[0_16px_40px_rgba(15,23,42,0.07)]">
      <div className="rounded-[1.15rem] border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#c5d8ff]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#dbe7ff]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#edf4ff]" />
          </div>
          <div className="h-7 w-28 rounded-full bg-[#f3f7ff]" />
        </div>
        <div className="mt-3.5 grid gap-3 md:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-3">
            <div className="rounded-[0.95rem] bg-[#f7faff] p-3">
              <div className="h-3 w-20 rounded-full bg-[#dce8ff]" />
              <div className="mt-3 h-10 w-24 rounded-xl bg-[#edf4ff]" />
            </div>
            <div className="rounded-[0.95rem] bg-[#f7faff] p-3">
              <div className="h-3 w-24 rounded-full bg-[#dce8ff]" />
              <div className="mt-3 h-8 w-20 rounded-xl bg-[#edf4ff]" />
            </div>
          </div>
          <div className="rounded-[0.95rem] bg-[linear-gradient(180deg,#fbfdff,#f2f7ff)] p-4">
            <div className="flex h-36 items-end gap-2">
              {[30, 48, 42, 62, 54, 76, 68].map((height, index) => (
                <div key={index} className="flex-1">
                  <div
                    className="w-full rounded-t-full bg-[linear-gradient(180deg,#86b3ff,#0f5eff)]"
                    style={{ height: `${height * 1.2}px` }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function HeroStatStrip({
  items,
}: {
  items: Array<{ label: string; value: string }>;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {items.map((item) => (
        <div key={item.label} className="rounded-[0.95rem] border border-white/80 bg-white/92 px-4 py-3 shadow-[0_8px_18px_rgba(15,23,42,0.05)]">
          <p className="text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-slate-500">{item.label}</p>
          <p className="mt-2 text-[1.2rem] font-semibold tracking-[-0.04em] text-slate-950">{item.value}</p>
        </div>
      ))}
    </div>
  );
}

function HeroSummaryPanel({
  eyebrow,
  title,
  summary,
  stats,
  points,
}: {
  eyebrow: string;
  title: string;
  summary: string;
  stats: Array<{ label: string; value: string }>;
  points: string[];
}) {
  return (
    <div className="rounded-[1.45rem] border border-slate-200/80 bg-[linear-gradient(180deg,#fbfdff,#eef4fb)] p-5 shadow-[0_18px_46px_rgba(15,23,42,0.07)]">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--erp-primary)]">{eyebrow}</p>
      <h2 className="mt-2 text-[1.65rem] font-semibold tracking-[-0.05em] text-slate-950">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">{summary}</p>
      <div className="mt-4">
        <HeroStatStrip items={stats} />
      </div>
      <div className="mt-4 grid gap-2.5">
        {points.map((point) => (
          <div key={point} className="rounded-[0.95rem] border border-white/80 bg-white/92 px-4 py-3 text-sm text-slate-700 shadow-[0_8px_18px_rgba(15,23,42,0.04)]">
            {point}
          </div>
        ))}
      </div>
    </div>
  );
}

function PageShell({
  audience,
  shell,
  structuredData,
  children,
}: {
  audience: PublicAudience;
  shell: ReturnType<typeof usePublicPageData>;
  structuredData: Record<string, unknown>;
  children: React.ReactNode;
}) {
  return (
    <PublicAudiencePageFrame
      audience={audience}
      profile={shell.profile}
      headerContent={shell.headerContent}
      footerContent={shell.footerContent}
      allowedPaths={shell.allowedPaths}
      pageVisible={shell.pageVisible}
    >
      <PublicStructuredData data={structuredData} />
      {children}
    </PublicAudiencePageFrame>
  );
}

function SectionHeader({
  eyebrow,
  title,
  subtitle,
  centered = false,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  centered?: boolean;
}) {
  return (
    <div className={centered ? "mx-auto max-w-3xl text-center" : "max-w-3xl"}>
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--erp-primary)]">{eyebrow}</p>
      <h1 className="mt-2.5 text-[clamp(2.35rem,4.2vw,3.2rem)] leading-[0.94] font-semibold tracking-[-0.075em] text-slate-950">
        {title}
      </h1>
      {subtitle ? <p className="mt-3 max-w-2xl text-[0.98rem] leading-7 text-slate-600">{subtitle}</p> : null}
    </div>
  );
}

function ModuleCard({ module }: { module: MarketingModule }) {
  return (
    <article className={`${publicPanelClassName} flex h-full flex-col p-5 transition hover:-translate-y-1 hover:shadow-[0_18px_44px_rgba(15,23,42,0.09)]`}>
      <div className="flex items-start justify-between gap-4">
        <div className="inline-flex h-11 w-11 items-center justify-center rounded-[0.95rem] bg-[linear-gradient(180deg,#eef5ff,#dfeaff)] text-[#0f5eff]">
          {renderModuleIcon(module.slug, "h-6 w-6")}
        </div>
        <span className="rounded-full bg-[#f4f8ff] px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-slate-500">
          {module.category}
        </span>
      </div>
      <h3 className="mt-4 text-xl font-semibold tracking-[-0.04em] text-slate-950">{module.title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{module.summary}</p>
      <Link href={`/products/${module.slug}`} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#0f5eff]">
        Explore
        <ArrowRight className="h-4 w-4" />
      </Link>
    </article>
  );
}

function IndustryTile({ industry }: { industry: MarketingIndustry }) {
  return (
    <Link
      href={`/industries/${industry.slug}`}
      className={`${publicPanelClassName} flex h-full flex-col items-center p-5 text-center transition hover:-translate-y-1 hover:shadow-[0_18px_44px_rgba(15,23,42,0.09)]`}
    >
      <div className="inline-flex h-12 w-12 items-center justify-center rounded-[0.95rem] bg-[linear-gradient(180deg,#eef5ff,#dfeaff)] text-[#0f5eff]">
        {renderIndustryIcon(industry.slug, "h-6 w-6")}
      </div>
      <h3 className="mt-4 text-lg font-semibold tracking-[-0.03em] text-slate-950">{industry.title}</h3>
    </Link>
  );
}

function ResourceCard({
  item,
}: {
  item: {
    title: string;
    type: string;
    summary: string;
    href: string;
  };
}) {
  return (
    <Link
      href={item.href}
      className={`${publicPanelClassName} block h-full overflow-hidden transition hover:-translate-y-1 hover:shadow-[0_18px_44px_rgba(15,23,42,0.09)]`}
    >
      <div className="h-36 bg-[linear-gradient(135deg,#dbeafe,#eff6ff)]" />
      <div className="p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--erp-primary)]">{item.type}</p>
        <h3 className="mt-3 text-xl font-semibold tracking-[-0.04em] text-slate-950">{item.title}</h3>
        <p className="mt-3 text-sm leading-7 text-slate-600">{item.summary}</p>
        <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#0f5eff]">
          Read More
          <ArrowRight className="h-4 w-4" />
        </span>
      </div>
    </Link>
  );
}

function PayrollVisual() {
  return (
    <div className="relative z-1 rounded-[24px] border border-slate-200 bg-white p-8 shadow-[0_20px_50px_rgba(15,23,42,0.08)] min-h-[420px] flex flex-col justify-between select-none">
      {/* Background radial gradient */}
      <div className="absolute -top-10 -right-10 -z-10 h-64 w-64 rounded-full bg-indigo-500/8 blur-[60px]" />
      <div className="absolute -bottom-10 -left-10 -z-10 h-64 w-64 rounded-full bg-emerald-500/5 blur-[60px]" />
      
      {/* Visual content: CTC breakdown */}
      <div>
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
          <div className="text-left">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Salary Structure</p>
            <h3 className="text-lg font-bold text-slate-800">CTC Breakdown Statement</h3>
          </div>
          <span className="rounded-full bg-emerald-50 border border-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">Auto-calculated</span>
        </div>

        {/* Breakdown Items */}
        <div className="space-y-4">
          {[
            { label: "Base Salary", amount: "₹4,20,000", pct: 70, color: "bg-indigo-600" },
            { label: "House Rent Allowance (HRA)", amount: "₹1,20,000", pct: 20, color: "bg-cyan-500" },
            { label: "Statutory PF & ESIC", amount: "₹60,000", pct: 10, color: "bg-emerald-500" },
          ].map((item) => (
            <div key={item.label} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span>{item.label}</span>
                <span>{item.amount}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                <div className={`h-full rounded-full ${item.color}`} style={{ width: `${item.pct}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Regulatory indicators badges */}
      <div className="mt-8 pt-4 border-t border-slate-100 flex flex-wrap gap-2.5">
        {[
          { label: "EPF Settled", active: true },
          { label: "ESIC Computed", active: true },
          { label: "Tax Withheld (TDS)", active: true }
        ].map((badg) => (
          <div key={badg.label} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            {badg.label}
          </div>
        ))}
      </div>

      {/* Floating Elements */}
      {/* Floating Card 1: Upper Center */}
      <FloatingCard position="-top-6 left-1/2 -translate-x-1/2" delay="0s">
        <div className="flex items-center gap-2">
          <Check className="h-4 w-4 text-emerald-600 shrink-0" />
          <span className="text-xs font-bold text-slate-800 whitespace-nowrap">EPF Automatic Return Generated</span>
        </div>
      </FloatingCard>

      {/* Floating Card 2: Lower Right */}
      <FloatingCard position="-bottom-6 -right-6" delay="1s">
        <div className="flex items-center gap-2.5">
          <BarChart3 className="h-4 w-4 text-indigo-600" />
          <span className="text-xs font-bold text-slate-800 whitespace-nowrap">Monthly Run Curves: OK</span>
        </div>
      </FloatingCard>
    </div>
  );
}

function FinanceVisual() {
  return (
    <div className="relative z-1 rounded-[24px] border border-slate-200 bg-white p-8 shadow-[0_20px_50px_rgba(15,23,42,0.08)] min-h-[420px] flex flex-col justify-between select-none">
      {/* Background radial gradient */}
      <div className="absolute -top-10 -right-10 -z-10 h-64 w-64 rounded-full bg-indigo-500/8 blur-[60px]" />
      <div className="absolute -bottom-10 -left-10 -z-10 h-64 w-64 rounded-full bg-cyan-500/5 blur-[60px]" />

      <div>
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
          <div className="text-left">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Analytical Ledgers</p>
            <h3 className="text-lg font-bold text-slate-800">Finance Cashflow Summary</h3>
          </div>
          <span className="rounded-full bg-indigo-50 border border-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">Real-time sync</span>
        </div>

        {/* Visual Line Graph Mockup */}
        <div className="h-32 w-full flex items-end gap-1.5 pt-4">
          {[40, 25, 45, 60, 50, 75, 90, 80, 95].map((val, idx) => (
            <div key={idx} className="flex-1 flex flex-col items-center gap-1.5">
              <div 
                className="w-full bg-gradient-to-t from-indigo-500 to-indigo-600 rounded-t-lg transition-all duration-300"
                style={{ height: `${val}px` }}
              />
              <span className="text-[9px] font-bold text-slate-400 uppercase">Q{idx + 1}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 pt-4 border-t border-slate-100 grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-slate-150 bg-slate-50/50 p-3 text-left">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Operating Cash</p>
          <p className="text-base font-bold text-slate-800">₹1.48 Crore</p>
        </div>
        <div className="rounded-xl border border-slate-150 bg-slate-50/50 p-3 text-left">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Budget Balance</p>
          <p className="text-base font-bold text-slate-800">92.4% Safe</p>
        </div>
      </div>

      {/* Floating Card 1: Top Left */}
      <FloatingCard position="-top-6 -left-6" delay="0s">
        <div className="flex items-center gap-2 font-mono text-[9px] bg-slate-900 border-none text-white px-2.5 py-1 rounded-lg">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>POST /v1/ledgers/sync ... 200 OK</span>
        </div>
      </FloatingCard>

      {/* Floating Card 2: Bottom Right */}
      <FloatingCard position="-bottom-6 -right-6" delay="1.2s">
        <div className="flex items-center gap-2">
          <Check className="h-4 w-4 text-emerald-600 shrink-0" />
          <span className="text-xs font-bold text-slate-800 whitespace-nowrap">Corporate Bank Feeds Synced</span>
        </div>
      </FloatingCard>
    </div>
  );
}

function HRCoreVisual() {
  return (
    <div className="relative z-1 rounded-[24px] border border-slate-200 bg-white p-8 shadow-[0_20px_50px_rgba(15,23,42,0.08)] min-h-[420px] flex flex-col justify-between select-none">
      {/* Background radial gradient */}
      <div className="absolute -top-10 -right-10 -z-10 h-64 w-64 rounded-full bg-indigo-500/8 blur-[60px]" />
      <div className="absolute -bottom-10 -left-10 -z-10 h-64 w-64 rounded-full bg-cyan-500/5 blur-[60px]" />

      <div>
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
          <div className="text-left">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Employee Registry</p>
            <h3 className="text-lg font-bold text-slate-800">Core Directory Layout</h3>
          </div>
          <span className="rounded-full bg-cyan-50 border border-cyan-100 px-3 py-1 text-xs font-semibold text-cyan-700">Centralized</span>
        </div>

        {/* Directory Grid */}
        <div className="grid grid-cols-2 gap-3.5">
          {[
            { name: "Aditya Sharma", dept: "Engineering", email: "aditya@company.com", avatar: "A" },
            { name: "Neha Patel", dept: "Finance", email: "neha@company.com", avatar: "N" },
            { name: "Vikram Roy", dept: "Operations", email: "vikram@company.com", avatar: "V" },
            { name: "Priya Das", dept: "Finance", email: "priya@company.com", avatar: "P" }
          ].map((emp) => (
            <div key={emp.name} className="flex items-center gap-2.5 rounded-xl border border-slate-150 bg-slate-50/50 p-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 font-bold text-indigo-700 text-xs shrink-0">
                {emp.avatar}
              </div>
              <div className="text-left min-w-0">
                <p className="text-xs font-bold text-slate-800 truncate">{emp.name}</p>
                <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider truncate">{emp.dept}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-semibold text-left">
        <span>Total Count: 1,248 Active</span>
        <span>Active Departments: 6</span>
      </div>

      {/* Floating Card 1: Top Right */}
      <FloatingCard position="-top-6 -right-6" delay="0.5s">
        <div className="flex items-center gap-2">
          <Check className="h-4 w-4 text-emerald-600 shrink-0" />
          <span className="text-xs font-bold text-slate-800 whitespace-nowrap">Leave Request Approved: 4 Days</span>
        </div>
      </FloatingCard>

      {/* Floating Card 2: Center Left */}
      <FloatingCard position="top-1/2 -left-4 -translate-y-1/2" delay="1.5s">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 animate-pulse" />
          <span className="text-xs font-bold text-slate-800 whitespace-nowrap">Onboarding Completion: 92%</span>
        </div>
      </FloatingCard>
    </div>
  );
}

export function ProductsLandingPage({ audience }: { audience: PublicAudience }) {
  const shell = usePublicPageData("features", audience);

  return (
    <PageShell
      audience={audience}
      shell={shell}
      structuredData={{
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: "Products | UabIndia ERP",
        url: `${publicSiteUrl}/products`,
        description: "Explore UabIndia ERP modules for HRMS, payroll, finance, inventory, procurement, CRM, projects, assets, help desk, and reporting.",
      }}
    >
      <section className={publicPageSectionClassName}>
        <div className={`${publicSectionClassName} grid gap-6 xl:grid-cols-[0.96fr_1.04fr] xl:items-start`}>
          <div>
            <MotionReveal>
              <SectionHeader
                eyebrow="Our products"
                title="Powerful modules built to streamline every aspect of your business."
                subtitle="Choose the modules that match your rollout now and expand later without breaking the product experience."
              />
            </MotionReveal>

            <MotionReveal delay={0.05}>
              <div className="mt-6 flex flex-wrap gap-2">
                {["All Modules", "Core", "Finance", "Operations", "Human Resources", "Sales & CRM"].map((tab) => (
                  <span key={tab} className={`rounded-xl border px-4 py-2 text-sm font-semibold ${tab === "All Modules" ? "border-[#d4e3ff] bg-[#f4f8ff] text-[#0f5eff]" : "border-slate-200 bg-white text-slate-600"}`}>
                    {tab}
                  </span>
                ))}
              </div>
            </MotionReveal>
          </div>

          <MotionReveal delay={0.08}>
            <HeroSummaryPanel
              eyebrow="Rollout view"
              title="A shared product language across every module."
              summary="The module system is designed for phased adoption, cleaner navigation, and connected reporting across people, finance, and operations."
              stats={[
                { label: "Modules", value: `${marketingModules.length}+` },
                { label: "Workflows", value: "Role-aware" },
                { label: "Rollout", value: "Phase-ready" },
              ]}
              points={[
                "Start with one business unit or function and expand without redesigning the workspace.",
                "Keep approvals, master data, and reporting aligned across modules.",
                "Reduce training overhead with one consistent interaction model.",
              ]}
            />
          </MotionReveal>
        </div>

        <div className={`${publicSectionClassName} mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4`}>
            {marketingModules.slice(0, 8).map((module, index) => (
              <MotionReveal key={module.slug} delay={index * 0.03}>
                <ModuleCard module={module} />
              </MotionReveal>
            ))}
        </div>
      </section>
    </PageShell>
  );
}

export function ProductDetailPageClient({
  audience,
  module,
}: {
  audience: PublicAudience;
  module: MarketingModule;
}) {
  const shell = usePublicPageData(`product-${module.slug}`, audience);

  return (
    <PageShell
      audience={audience}
      shell={shell}
      structuredData={{
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: `${module.title} | UabIndia ERP`,
        url: `${publicSiteUrl}/products/${module.slug}`,
        description: module.summary,
      }}
    >
      <section className={publicPageSectionClassName}>
        <div className={`${publicSectionClassName} grid gap-6 xl:grid-cols-[0.9fr_1.1fr] xl:items-start`}>
          <MotionReveal>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--erp-primary)]">{module.title}</p>
              <h1 className="mt-2.5 text-[clamp(2.4rem,4.4vw,3.35rem)] leading-[0.94] font-semibold tracking-[-0.075em] text-slate-950">{module.title}</h1>
              <p className="mt-3 max-w-2xl text-[0.98rem] leading-7 text-slate-600">{module.description}</p>
              <div className="mt-6 space-y-2">
                {module.highlights.slice(0, 5).map((item) => (
                  <div key={item} className="flex items-start gap-3 text-sm text-slate-700">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href={withPublicAudience("/book-demo", audience)} className={publicButtonClassName.primary}>
                  Book a Demo
                </Link>
                <Link href={withPublicAudience("/contact", audience)} className={publicButtonClassName.secondary}>
                  View Screenshots
                </Link>
              </div>
            </div>
          </MotionReveal>

          <MotionReveal delay={0.06} className="w-full min-w-0">
            {module.slug === "payroll" ? (
              <PayrollVisual />
            ) : module.slug === "finance" ? (
              <FinanceVisual />
            ) : module.slug === "hrms" ? (
              <HRCoreVisual />
            ) : (
              <HeroSummaryPanel
                eyebrow="Module snapshot"
                title="Built for controlled day-to-day execution."
                summary="This module sits inside the same enterprise shell, so approvals, records, and reports remain connected as scope grows."
                stats={[
                  { label: "Adoption", value: "Fast" },
                  { label: "Controls", value: "Role-based" },
                  { label: "Reporting", value: "Shared" },
                ]}
                points={module.highlights.slice(0, 3)}
              />
            )}
          </MotionReveal>
        </div>
      </section>

      <section className={publicSectionSpacingClassName}>
        <div className={`${publicSectionClassName} grid gap-4 md:grid-cols-4`}>
          {[
            { value: "500+", label: "Businesses Trust Us" },
            { value: "50K+", label: "Active Users" },
            { value: "99.9%", label: "Uptime" },
            { value: "24/7", label: "Support" },
          ].map((item) => (
            <MotionReveal key={item.label}>
              <div className="text-center">
                <p className="text-3xl font-semibold tracking-[-0.05em] text-slate-950">{item.value}</p>
                <p className="mt-2 text-sm text-slate-500">{item.label}</p>
              </div>
            </MotionReveal>
          ))}
        </div>
      </section>
    </PageShell>
  );
}

export function IndustriesLandingPage({ audience }: { audience: PublicAudience }) {
  const shell = usePublicPageData("industries", audience);

  return (
    <PageShell
      audience={audience}
      shell={shell}
      structuredData={{
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: "Industries | UabIndia ERP",
        url: `${publicSiteUrl}/industries`,
        description: "Industry solutions for healthcare, manufacturing, retail, construction, education, logistics, and services.",
      }}
    >
      <section className={publicPageSectionClassName}>
        <div className={`${publicSectionClassName} grid gap-6 xl:grid-cols-[0.96fr_1.04fr] xl:items-start`}>
          <MotionReveal>
            <SectionHeader
              eyebrow="Industries we serve"
              title="Tailored ERP solutions for every industry"
              subtitle="Choose the industry lens that matches your operating model. The platform stays consistent while workflows adapt."
            />
          </MotionReveal>
          <MotionReveal delay={0.08}>
            <HeroSummaryPanel
              eyebrow="Industry fit"
              title="One ERP core with workflow variation by sector."
              summary="Industry alignment comes from approval logic, data structures, operational sequencing, and reporting depth, not from separate disconnected products."
              stats={[
                { label: "Sectors", value: `${marketingIndustries.length}+` },
                { label: "Core", value: "Shared" },
                { label: "Config", value: "Adaptive" },
              ]}
              points={[
                "Healthcare, manufacturing, logistics, retail, and services can stay on the same product foundation.",
                "Industry workflows can change without fragmenting access control or reporting language.",
                "Rollouts remain cleaner when the UI stays consistent across operating contexts.",
              ]}
            />
          </MotionReveal>
        </div>
        <div className={`${publicSectionClassName} mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4`}>
          {marketingIndustries.slice(0, 8).map((industry, index) => (
            <MotionReveal key={industry.slug} delay={index * 0.03}>
              <IndustryTile industry={industry} />
            </MotionReveal>
          ))}
        </div>
        <div className={`${publicSectionClassName} mt-6 flex justify-center`}>
          <Link href={withPublicAudience("/contact", audience)} className={publicButtonClassName.secondary}>
            View All Industries
          </Link>
        </div>
      </section>
    </PageShell>
  );
}

export function IndustryDetailPageClient({
  audience,
  industry,
}: {
  audience: PublicAudience;
  industry: MarketingIndustry;
}) {
  const shell = usePublicPageData(`industry-${industry.slug}`, audience);
  const modules = getRecommendedModules(industry.recommendedModules).slice(0, 4);

  return (
    <PageShell
      audience={audience}
      shell={shell}
      structuredData={{
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: `${industry.title} ERP Solution | UabIndia ERP`,
        url: `${publicSiteUrl}/industries/${industry.slug}`,
        description: industry.summary,
      }}
    >
      <section className={publicPageSectionClassName}>
        <div className={`${publicSectionClassName} grid gap-6 xl:grid-cols-[0.9fr_1.1fr] xl:items-start`}>
          <MotionReveal>
            <div>
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-[1.1rem] bg-[linear-gradient(180deg,#eef5ff,#dfeaff)] text-[#0f5eff]">
                {renderIndustryIcon(industry.slug, "h-8 w-8")}
              </div>
              <p className="mt-4 text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--erp-primary)]">{industry.eyebrow}</p>
              <h1 className="mt-2.5 text-[clamp(2.4rem,4.4vw,3.35rem)] leading-[0.94] font-semibold tracking-[-0.075em] text-slate-950">{industry.title}</h1>
              <p className="mt-3 text-[0.98rem] leading-7 text-slate-600">{industry.description}</p>
            </div>
          </MotionReveal>
          <MotionReveal delay={0.06}>
            <HeroSummaryPanel
              eyebrow="Recommended modules"
              title="A practical deployment stack for this operating model."
              summary="The recommended module mix keeps the business on one operating backbone while matching the reality of this sector."
              stats={[
                { label: "Modules", value: `${modules.length}` },
                { label: "Approvals", value: "Aligned" },
                { label: "Outcomes", value: "Connected" },
              ]}
              points={modules.map((module) => module.title)}
            />
          </MotionReveal>
        </div>
      </section>
    </PageShell>
  );
}

export function PricingLandingPage({ audience }: { audience: PublicAudience }) {
  const shell = usePublicPageData("pricing", audience);

  return (
    <PageShell
      audience={audience}
      shell={shell}
      structuredData={{
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: "Pricing | UabIndia ERP",
        url: `${publicSiteUrl}/pricing`,
        description: "Commercial planning for phased ERP rollouts.",
      }}
    >
      <section className={publicPageSectionClassName}>
        <div className={`${publicSectionClassName} grid gap-6 xl:grid-cols-[0.94fr_1.06fr] xl:items-start`}>
          <MotionReveal>
            <SectionHeader
              eyebrow="Pricing"
              title="Flexible rollout plans for serious business operations."
              subtitle="Choose a commercial model based on business scope, rollout depth, and long-term support needs."
            />
          </MotionReveal>
          <MotionReveal delay={0.08}>
            <HeroSummaryPanel
              eyebrow="Commercial view"
              title="Price should follow rollout complexity, not vague packaging."
              summary="The strongest ERP commercial model is clear about business size, implementation depth, support expectations, and expansion path."
              stats={[
                { label: "Plans", value: `${pricingPlans.length}` },
                { label: "Setup", value: "Guided" },
                { label: "Growth", value: "Scalable" },
              ]}
              points={[
                "Start with the right scope instead of overbuying modules too early.",
                "Align implementation effort with branch, entity, and workflow complexity.",
                "Keep room for future expansion without forcing a redesign of the plan.",
              ]}
            />
          </MotionReveal>
        </div>
        <div className={`${publicSectionClassName} mt-6 grid gap-4 xl:grid-cols-3`}>
            {pricingPlans.map((plan, index) => (
              <MotionReveal key={plan.name} delay={index * 0.04}>
                <div className={`${publicPanelClassName} h-full p-6 ${plan.featured ? "border-[#cfe0ff] shadow-[0_18px_44px_rgba(15,94,255,0.09)]" : ""}`}>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--erp-primary)]">{plan.audience}</p>
                  <h2 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-slate-950">{plan.name}</h2>
                  <p className="mt-4 text-2xl font-semibold tracking-[-0.04em] text-slate-900">{plan.price}</p>
                  <p className="mt-2 text-sm text-slate-500">{plan.implementation}</p>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{plan.summary}</p>
                  <div className="mt-4 space-y-2.5">
                    {plan.points.map((point) => (
                      <div key={point} className="rounded-[0.95rem] bg-slate-50 px-4 py-2.5 text-sm text-slate-700">
                        {point}
                      </div>
                    ))}
                  </div>
                </div>
              </MotionReveal>
            ))}
        </div>
      </section>
    </PageShell>
  );
}

export function ResourcesLandingPage({ audience }: { audience: PublicAudience }) {
  const shell = usePublicPageData("resources", audience);

  return (
    <PageShell
      audience={audience}
      shell={shell}
      structuredData={{
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: "Resources | UabIndia ERP",
        url: `${publicSiteUrl}/resources`,
        description: "Guides, case studies, and planning material for ERP evaluation teams.",
      }}
    >
      <section className={publicPageSectionClassName}>
        <div className={`${publicSectionClassName} grid gap-6 xl:grid-cols-[0.95fr_1.05fr] xl:items-start`}>
          <div>
            <MotionReveal>
              <SectionHeader
                eyebrow="Resources"
                title="Insights, guides, and updates to help your business grow."
                subtitle="Keep the public content lean and useful: practical reading, not filler."
              />
            </MotionReveal>
            <div className="mt-6 flex flex-wrap gap-2">
            {["All", "Blog", "Guides", "Case Studies", "Videos", "Webinars"].map((tab, index) => (
              <span key={tab} className={`rounded-xl border px-4 py-2 text-sm font-semibold ${index === 0 ? "border-[#d4e3ff] bg-[#f4f8ff] text-[#0f5eff]" : "border-slate-200 bg-white text-slate-600"}`}>
                {tab}
              </span>
            ))}
            </div>
          </div>
          <MotionReveal delay={0.08}>
            <HeroSummaryPanel
              eyebrow="Planning material"
              title="Useful resources should help a decision move forward."
              summary="The public knowledge layer should support evaluation, scope planning, rollout sequencing, and operating clarity instead of generic marketing copy."
              stats={[
                { label: "Formats", value: "Multi" },
                { label: "Audience", value: "Buyers" },
                { label: "Focus", value: "Practical" },
              ]}
              points={[
                "Guides should answer rollout and governance questions directly.",
                "Case material should show real process impact, not abstract claims.",
                "Resource design should remain as disciplined as the product UI.",
              ]}
            />
          </MotionReveal>
        </div>
        <div className={`${publicSectionClassName} mt-6 grid gap-4 xl:grid-cols-3`}>
          {resources.slice(0, 3).map((item, index) => (
            <MotionReveal key={item.title} delay={index * 0.04}>
              <ResourceCard item={item} />
            </MotionReveal>
          ))}
        </div>
        <div className={`${publicSectionClassName} mt-6 flex justify-center`}>
          <Link href={withPublicAudience("/contact", audience)} className={publicButtonClassName.secondary}>
            View All Resources
          </Link>
        </div>
      </section>
    </PageShell>
  );
}

export function BookDemoLandingPage({ audience }: { audience: PublicAudience }) {
  const shell = usePublicPageData("book-demo", audience);

  return (
    <PageShell
      audience={audience}
      shell={shell}
      structuredData={{
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: "Book Demo | UabIndia ERP",
        url: `${publicSiteUrl}/book-demo`,
        description: "Book a tailored walkthrough for your ERP rollout.",
      }}
    >
      <section className={publicPageSectionClassName}>
        <div className={`${publicSectionClassName} grid gap-6 xl:grid-cols-[0.9fr_1.1fr]`}>
          <div className="space-y-6">
            <MotionReveal>
              <SectionHeader
                eyebrow="Book a demo"
                title="Schedule a walkthrough shaped around your real business priorities."
                subtitle="Share your rollout scope and we will focus the conversation on modules, approvals, reporting, and adoption fit."
              />
            </MotionReveal>
            <MotionReveal delay={0.06}>
              <div className={`${publicPanelClassName} p-5`}>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--erp-primary)]">What your demo includes</p>
                <div className="mt-4 space-y-2.5">
                  {demoAgenda.map((item) => (
                    <div key={item} className="rounded-[0.95rem] bg-slate-50 px-4 py-3 text-sm text-slate-700">
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </MotionReveal>
          </div>
          <MotionReveal delay={0.08}>
            <HeroSummaryPanel
              eyebrow="Demo outcomes"
              title="A shorter, more useful pre-sales conversation."
              summary="The goal is to identify module priority, process friction, and rollout reality before the product walkthrough becomes too broad."
              stats={[
                { label: "Focus", value: "Business-first" },
                { label: "Scope", value: "Mapped" },
                { label: "Next step", value: "Clear" },
              ]}
              points={[
                "Review the workflows that are creating operational drag today.",
                "Align the demo to your branch, entity, and approval complexity.",
                "Leave with a realistic phased rollout direction, not just screenshots.",
              ]}
            />
          </MotionReveal>
        </div>
      </section>
    </PageShell>
  );
}

export function HelpSupportLandingPage({ audience }: { audience: PublicAudience }) {
  const shell = usePublicPageData("support", audience);

  return (
    <PageShell
      audience={audience}
      shell={shell}
      structuredData={{
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: "Help & Support | UabIndia ERP",
        url: `${publicSiteUrl}/help-support`,
        description: "Support coverage and service guidance for UabIndia ERP users.",
      }}
    >
      <section className={publicPageSectionClassName}>
        <div className={`${publicSectionClassName} grid gap-5 xl:grid-cols-[0.9fr_1.1fr]`}>
          <MotionReveal>
            <SectionHeader
              eyebrow="Support"
              title="Clear support lanes for product, rollout, and post-go-live questions."
              subtitle="Good support pages should route the user fast without unnecessary noise."
            />
          </MotionReveal>
          <MotionReveal delay={0.06}>
            <HeroSummaryPanel
              eyebrow="Support design"
              title="Faster routing with less confusion."
              summary="Support pages work best when they separate implementation, tenant operations, and product questions without forcing users through generic contact loops."
              stats={[
                { label: "Lanes", value: `${supportLanes.length}` },
                { label: "Routing", value: "Clear" },
                { label: "Ownership", value: "Defined" },
              ]}
              points={supportLanes.slice(0, 3)}
            />
          </MotionReveal>
        </div>
      </section>
    </PageShell>
  );
}

export function LegalPublicPage({
  audience,
  title,
  eyebrow,
  body,
  path,
}: {
  audience: PublicAudience;
  title: string;
  eyebrow: string;
  body: Array<{ heading: string; text: string }>;
  path: string;
}) {
  const shell = usePublicPageData(path.replace("/", ""), audience);

  return (
    <PageShell
      audience={audience}
      shell={shell}
      structuredData={{
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: `${title} | UabIndia ERP`,
        url: `${publicSiteUrl}${path}`,
      }}
    >
      <section className={publicPageSectionClassName}>
        <div className={`${publicSectionClassName} max-w-4xl`}>
          <MotionReveal>
            <SectionHeader
              eyebrow={eyebrow}
              title={title}
              subtitle="These pages communicate baseline policy and legal expectations without overloading the public experience."
            />
          </MotionReveal>
          <div className="mt-8 space-y-4">
            {body.map((section) => (
              <MotionReveal key={section.heading}>
                <div className={`${publicPanelClassName} p-6`}>
                  <h2 className="text-xl font-semibold tracking-[-0.03em] text-slate-950">{section.heading}</h2>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{section.text}</p>
                </div>
              </MotionReveal>
            ))}
          </div>
        </div>
      </section>
    </PageShell>
  );
}
