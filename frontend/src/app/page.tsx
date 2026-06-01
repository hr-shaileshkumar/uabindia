"use client";

import PublicButtonLink from "@/components/public/PublicButtonLink";
import PublicPageIntro from "@/components/public/PublicPageIntro";
import PublicSiteFrame from "@/components/public/PublicSiteFrame";
import { publicPanelClassName } from "@/components/public/publicStyles";
import { usePublicPageData } from "@/hooks/usePublicPageData";
import { getRawMarkupContent } from "@/lib/publicSiteContent";

type HomeContent = {
  eyebrow: string;
  title: string;
  subtitle: string;
  primaryCtaLabel: string;
  secondaryCtaLabel: string;
  trustPills: string[];
  featureCards: Array<{ title: string; description: string }>;
  workflowSteps: Array<{ title: string; description: string }>;
  testimonial: string;
};

const defaultFeatures = [
  {
    title: "Tenant-aware controls",
    description: "Role-based permissions, approval routing, and secure tenant isolation for enterprise teams.",
  },
  {
    title: "Unified finance operations",
    description: "One ledger for billing, payments, budgeting, and compliance across your organization.",
  },
  {
    title: "HR and payroll workflows",
    description: "Recruitment, attendance, payroll, and workforce planning built into a single SaaS workspace.",
  },
  {
    title: "Insights at a glance",
    description: "Dashboard metrics, audit reports, and operational health signals delivered in real time.",
  },
];

const defaultWorkflow = [
  {
    title: "Configure tenant workflows",
    description: "Map approvals, roles, and departments with simple enterprise-grade controls.",
  },
  {
    title: "Launch secure operations",
    description: "Give teams access to Uabindia ERP, payroll, finance, and HR in one polished workspace.",
  },
  {
    title: "Measure and optimize",
    description: "Track adoption, performance, and compliance with clear, actionable analytics.",
  },
];

export default function Home() {
  const { profile, pageRecord, headerContent, footerContent, parseContent } = usePublicPageData("home");
  const content = parseContent<HomeContent>({
    eyebrow: `Welcome to ${profile.brandName}`,
    title: profile.heroTitle || `Modern ${profile.brandName || "Uabindia ERP"} workflows built for ${profile.companyName}`,
    subtitle:
      profile.heroSubtitle ||
      "A polished tenant-aware SaaS platform for finance, HR, payroll, and operational teams.",
    primaryCtaLabel: "Start your workspace",
    secondaryCtaLabel: "Book a demo",
    trustPills: ["Tenant-based branding", "Uabindia ERP + HRMS + Payroll", "Secure role-based access"],
    featureCards: defaultFeatures,
    workflowSteps: defaultWorkflow,
    testimonial:
      "“This platform simplified our finance and HR workflows while giving us enterprise-class controls and clarity.”",
  });
  const rawMarkup = getRawMarkupContent(pageRecord?.contentJson);

  return (
    <PublicSiteFrame profile={profile} headerContent={headerContent} footerContent={footerContent}>
      <section className="relative overflow-hidden bg-white/80 py-20">
        <div className="absolute left-0 top-0 h-72 w-72 rounded-full bg-sky-200/60 blur-3xl" />
        <div className="absolute right-0 top-16 h-72 w-72 rounded-full bg-indigo-200/70 blur-3xl" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-linear-to-t from-slate-50 to-transparent" />

        <div className="mx-auto grid max-w-7xl gap-12 px-5 lg:grid-cols-[0.95fr_0.9fr] lg:px-6">
          <div className="space-y-8">
            <PublicPageIntro eyebrow={content.eyebrow} title={content.title} subtitle={content.subtitle} />
            <div className="flex flex-wrap items-center gap-4">
              <PublicButtonLink href="/login">{content.primaryCtaLabel}</PublicButtonLink>
              <PublicButtonLink href="/contact" variant="secondary">
                {content.secondaryCtaLabel}
              </PublicButtonLink>
            </div>
            <div className="flex flex-wrap gap-3 text-xs text-slate-600">
              {content.trustPills.map((pill) => (
                <span key={pill} className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1.5">
                  {pill}
                </span>
              ))}
            </div>
          </div>

          <div className={`${publicPanelClassName} p-8 shadow-[0_40px_100px_rgba(15,23,42,0.08)]`}>
            <div className="space-y-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Tenant snapshot</p>
                  <p className="mt-3 text-xl font-semibold text-slate-900">{profile.industry || "Enterprise operations"}</p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                  {profile.supportTier || "Standard"}
                </span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {profile.snapshot.map((item) => (
                  <div key={item.label} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{item.label}</p>
                    <p className="mt-3 text-2xl font-semibold text-slate-900">{item.value}</p>
                  </div>
                ))}
              </div>
              <div className="rounded-3xl bg-(--erp-primary) p-5 text-white">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-200">Governance</p>
                <p className="mt-4 text-sm leading-6 text-slate-100">
                  {profile.workflowNote || "Secure approvals, audit trails, and tenant-aware governance controls."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 lg:px-6">
        <div className="grid gap-8 lg:grid-cols-2 lg:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-(--erp-primary)">Platform capabilities</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              Built for modern enterprise SaaS operations.
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
              Everything you need to connect finance, HR, payroll, and operations across a secure tenant-aware workflow platform.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {content.featureCards.map((feature) => (
              <div key={feature.title} className={`${publicPanelClassName} p-6`}>
                <p className="text-lg font-semibold text-slate-900">{feature.title}</p>
                <p className="mt-3 text-sm leading-6 text-slate-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-16">
        <div className="mx-auto max-w-7xl px-5 lg:px-6">
          <div className="grid gap-8 lg:grid-cols-[0.95fr_0.9fr] lg:items-center">
            <div className="space-y-6">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Workflow</p>
              <h2 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                From setup to operational insight in three simple steps.
              </h2>
              <p className="max-w-2xl text-base leading-7 text-slate-600">
                A clear onboarding flow backed by secure tenant controls and always-on visibility.
              </p>
            </div>
            <div className="grid gap-4">
              {content.workflowSteps.map((step, index) => (
                <div key={step.title} className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-(--erp-primary) text-sm font-semibold text-white">
                    {index + 1}
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-slate-900">{step.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 lg:px-6">
        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="space-y-6">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-(--erp-primary)">Enterprise trust</p>
            <h2 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">Secure governance with compliance-ready controls.</h2>
            <p className="max-w-2xl text-base leading-7 text-slate-600">
              Manage authorization, audit logs, and tenant policies with a unified platform experience.
            </p>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-3xl border border-slate-200 bg-white p-6">
                <p className="text-sm font-semibold text-slate-900">Audit-ready</p>
                <p className="mt-3 text-sm leading-6 text-slate-600">Logs, approvals, and history designed for enterprise governance.</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white p-6">
                <p className="text-sm font-semibold text-slate-900">Data isolation</p>
                <p className="mt-3 text-sm leading-6 text-slate-600">Tenant-specific access and role controls for every workflow.</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white p-6">
                <p className="text-sm font-semibold text-slate-900">Compliance</p>
                <p className="mt-3 text-sm leading-6 text-slate-600">Secure processes for payroll, HR, finance, and operations.</p>
              </div>
            </div>
          </div>
          <div className={`${publicPanelClassName} p-10 bg-slate-950 text-white`}>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Customer story</p>
            <p className="mt-6 text-2xl font-semibold leading-tight">{content.testimonial}</p>
            <p className="mt-6 max-w-xl text-sm leading-7 text-slate-300">
              Organizations rely on tenant-aware Uabindia ERP control and a modern SaaS workspace for finance, HR, and operations.
            </p>
          </div>
        </div>
      </section>

      {rawMarkup && (
        <section className="mx-auto max-w-7xl px-5 py-12 lg:px-6">
          <div className={`prose max-w-none p-8 ${publicPanelClassName}`}>
            <div dangerouslySetInnerHTML={{ __html: rawMarkup }} />
          </div>
        </section>
      )}

      <section className="mx-auto max-w-7xl px-5 pb-20 lg:px-6">
        <div className="rounded-[1.75rem] bg-(--erp-primary) px-8 py-10 text-white shadow-[0_32px_120px_rgba(15,23,42,0.16)] sm:px-10">
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-200">Ready to launch</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight">Simplify your Uabindia ERP and HRMS experience today.</h2>
            </div>
            <div className="flex flex-col items-start gap-3 sm:flex-row sm:justify-end">
              <PublicButtonLink href="/login" variant="secondary" className="bg-white text-(--erp-primary)">
                Go to Login
              </PublicButtonLink>
              <PublicButtonLink href="/contact" variant="ghost" className="text-white hover:text-white">
                Contact Team
              </PublicButtonLink>
            </div>
          </div>
        </div>
      </section>
    </PublicSiteFrame>
  );
}
