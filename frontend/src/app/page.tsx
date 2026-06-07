"use client";

import { ArrowRight, CheckCircle2 } from "lucide-react";
import PublicButtonLink from "@/components/public/PublicButtonLink";
import PublicPageIntro from "@/components/public/PublicPageIntro";
import PublicSiteFrame from "@/components/public/PublicSiteFrame";
import PublicStatGrid from "@/components/public/PublicStatGrid";
import { publicMutedPanelClassName, publicPanelClassName, publicSectionClassName } from "@/components/public/publicStyles";
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
  { title: "One clean workspace", description: "Bring HR, payroll, finance, and approvals into one consistent operating surface." },
  { title: "Tenant-ready branding", description: "Present a branded public site and a controlled workspace experience for each client." },
  { title: "Clear governance", description: "Keep access, audit visibility, and workflow accountability easy to understand." },
];

const defaultWorkflow = [
  { title: "Configure", description: "Set roles, policies, and modules around the business model." },
  { title: "Launch", description: "Give teams one entry point for daily work." },
  { title: "Improve", description: "Use reporting and visibility to keep operations moving." },
];

export default function Home() {
  const { profile, pageRecord, headerContent, footerContent, parseContent } = usePublicPageData("home");
  const content = parseContent<HomeContent>({
    eyebrow: `Welcome to ${profile.brandName}`,
    title: profile.heroTitle || `Modern ${profile.brandName || "Uabindia ERP"} workflows built for ${profile.companyName}`,
    subtitle:
      profile.heroSubtitle ||
      "A polished tenant-aware SaaS platform for finance, HR, payroll, and operational teams.",
    primaryCtaLabel: "Open workspace",
    secondaryCtaLabel: "Contact us",
    trustPills: ["Tenant-ready", "ERP + HRMS + Payroll", "Role-based access"],
    featureCards: defaultFeatures,
    workflowSteps: defaultWorkflow,
    testimonial: "One place for teams to work, track, and stay aligned.",
  });
  const rawMarkup = getRawMarkupContent(pageRecord?.contentJson);

  return (
    <PublicSiteFrame profile={profile} headerContent={headerContent} footerContent={footerContent}>
      <section className="relative overflow-hidden py-18 sm:py-22">
        <div className="absolute left-[-8rem] top-10 h-72 w-72 rounded-full bg-sky-100/80 blur-3xl" />
        <div className="absolute right-[-8rem] top-14 h-72 w-72 rounded-full bg-cyan-100/70 blur-3xl" />

        <div className={`${publicSectionClassName} grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center`}>
          <div className="space-y-7">
            <PublicPageIntro eyebrow={content.eyebrow} title={content.title} subtitle={content.subtitle} />

            <div className="flex flex-wrap items-center gap-4">
              <PublicButtonLink href="/login">
                {content.primaryCtaLabel}
                <ArrowRight className="h-4 w-4" />
              </PublicButtonLink>
              <PublicButtonLink href="/contact" variant="secondary">
                {content.secondaryCtaLabel}
              </PublicButtonLink>
            </div>

            <div className="flex flex-wrap gap-2.5">
              {content.trustPills.map((pill) => (
                <span key={pill} className="rounded-full border border-sky-100 bg-white px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-600 shadow-sm">
                  {pill}
                </span>
              ))}
            </div>
          </div>

          <div className={`${publicPanelClassName} p-7 lg:p-8`}>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Platform snapshot</p>
            <div className="mt-5">
              <PublicStatGrid items={profile.snapshot.map((item) => ({ label: item.label, value: item.value }))} />
            </div>
            <div className={`${publicMutedPanelClassName} mt-5 p-5`}>
              <p className="text-sm font-semibold text-slate-950">Operational note</p>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                {profile.workflowNote || "Secure approvals, payroll runs, finance controls, and support workflows in one place."}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="pb-18 sm:pb-22">
        <div className={`${publicSectionClassName} grid gap-5 md:grid-cols-3`}>
          {content.featureCards.map((feature) => (
            <article key={feature.title} className={`${publicPanelClassName} p-6`}>
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-[0.95rem] bg-sky-50 text-(--erp-primary)">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-xl font-semibold tracking-[-0.03em] text-slate-950">{feature.title}</h3>
              <p className="mt-2 text-sm leading-7 text-slate-600">{feature.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="pb-18 sm:pb-22">
        <div className={`${publicSectionClassName} grid gap-5 lg:grid-cols-[0.85fr_1.15fr] lg:items-start`}>
          <div className={`${publicMutedPanelClassName} p-7`}>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-(--erp-primary)">How it works</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-950">Simple before login, focused after login.</h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              Before login works best with a lighter and more welcoming palette. After login should stay clean too, but with slightly stronger blue accents to signal product focus and control.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {content.workflowSteps.map((step, index) => (
              <div key={step.title} className={`${publicPanelClassName} p-6`}>
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-950 text-sm font-semibold text-white">
                  {index + 1}
                </div>
                <h3 className="mt-4 text-lg font-semibold text-slate-950">{step.title}</h3>
                <p className="mt-2 text-sm leading-7 text-slate-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {rawMarkup ? (
        <section className="pb-10">
          <div className={publicSectionClassName}>
            <div className={`prose max-w-none p-8 ${publicPanelClassName}`}>
              <div dangerouslySetInnerHTML={{ __html: rawMarkup }} />
            </div>
          </div>
        </section>
      ) : null}
    </PublicSiteFrame>
  );
}
