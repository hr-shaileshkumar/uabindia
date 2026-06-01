"use client";

import PublicPageIntro from "@/components/public/PublicPageIntro";
import PublicSiteFrame from "@/components/public/PublicSiteFrame";
import { publicPanelClassName } from "@/components/public/publicStyles";
import { usePublicPageData } from "@/hooks/usePublicPageData";
import { getRawMarkupContent } from "@/lib/publicSiteContent";

type AboutContent = {
  eyebrow: string;
  title: string;
  subtitle: string;
  missionTitle: string;
  missionBody: string;
  governanceTitle: string;
  governanceBody: string;
  ctaLabel: string;
};

const productPillars = [
  {
    title: "Tenant-aware architecture",
    description: "Isolated client workflows, role-based access, and configurable tenant policy controls.",
  },
  {
    title: "Connected business operations",
    description: "Finance, HR, payroll, and procurement working together without data silos.",
  },
  {
    title: "Regulated workflow design",
    description: "Built for compliance, approvals, and audit-ready enterprise procedures.",
  },
];

export default function AboutPage() {
  const { profile, pageRecord, headerContent, footerContent, parseContent } = usePublicPageData("about");
  const content = parseContent<AboutContent>({
    eyebrow: "About the Uabindia ERP platform",
    title: `${profile.companyName} runs operations with ${profile.brandName}`,
    subtitle:
      "A unified Uabindia ERP experience for enterprise teams, delivering secure workflows, compliance, and operational clarity across HR, finance, and procurement.",
    missionTitle: "Our mission",
    missionBody:
      "Create a dependable Uabindia ERP system that empowers business leaders and operations teams with real-time insight, automated approvals, and audit-ready controls.",
    governanceTitle: "How we govern Uabindia ERP",
    governanceBody:
      "We align platform access, data ownership, and approval workflows so every team can move faster with confidence and accountability.",
    ctaLabel: "Contact our team",
  });
  const rawMarkup = getRawMarkupContent(pageRecord?.contentJson);

  return (
    <PublicSiteFrame profile={profile} headerContent={headerContent} footerContent={footerContent}>
      <section className="mx-auto max-w-7xl px-5 py-16 lg:px-6">
        <div className="grid gap-14 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-8">
            <PublicPageIntro eyebrow={content.eyebrow} title={content.title} subtitle={content.subtitle} />
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">Operations</p>
                <p className="mt-4 text-3xl font-semibold text-slate-900">4x</p>
                <p className="mt-2 text-sm text-slate-600">Faster approvals across teams</p>
              </div>
              <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">Security</p>
                <p className="mt-4 text-3xl font-semibold text-slate-900">99.9%</p>
                <p className="mt-2 text-sm text-slate-600">Enterprise uptime and governance</p>
              </div>
              <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">Teams</p>
                <p className="mt-4 text-3xl font-semibold text-slate-900">250+</p>
                <p className="mt-2 text-sm text-slate-600">Active users across finance and HR</p>
              </div>
            </div>
          </div>

          <div className={`${publicPanelClassName} p-8`}>
            <h2 className="text-lg font-semibold text-slate-900">Organization snapshot</h2>
            <div className="mt-6 space-y-4 text-sm leading-6 text-slate-600">
              <p>
                <span className="font-semibold text-slate-900">Industry:</span> {profile.industry}
              </p>
              <p>
                <span className="font-semibold text-slate-900">Headquarters:</span> {profile.headquarters}
              </p>
              <p>
                <span className="font-semibold text-slate-900">Employees:</span> {profile.employeeCount}
              </p>
              <p>
                <span className="font-semibold text-slate-900">Support tier:</span> {profile.supportTier}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-16 grid gap-8 lg:grid-cols-2">
          <div className={`${publicPanelClassName} p-8`}>
            <h2 className="text-lg font-semibold text-slate-900">{content.missionTitle}</h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">{content.missionBody}</p>
            <div className="mt-8 grid gap-4">
              {productPillars.map((pillar) => (
                <div key={pillar.title} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-sm font-semibold text-slate-900">{pillar.title}</p>
                  <p className="mt-2 text-sm text-slate-600">{pillar.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className={`${publicPanelClassName} p-8`}>
            <h2 className="text-lg font-semibold text-slate-900">{content.governanceTitle}</h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">{content.governanceBody}</p>
            <div className="mt-8 grid gap-4">
              <div className="rounded-3xl border border-slate-200 bg-white p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Partner</p>
                <p className="mt-2 text-sm font-semibold text-slate-900">{profile.implementationPartner}</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Support</p>
                <p className="mt-2 text-sm font-semibold text-slate-900">{profile.supportTier}</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Coverage</p>
                <p className="mt-2 text-sm font-semibold text-slate-900">{profile.industry}</p>
              </div>
            </div>
          </div>
        </div>

        {rawMarkup && (
          <div className={`prose mt-16 max-w-none p-8 ${publicPanelClassName}`}>
            <div dangerouslySetInnerHTML={{ __html: rawMarkup }} />
          </div>
        )}
      </section>
    </PublicSiteFrame>
  );
}
