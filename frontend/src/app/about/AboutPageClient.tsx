"use client";

import Link from "next/link";
import {
  CtaPanel,
  ProcessTimeline,
  SectionIntro,
  ValueGrid,
} from "@/components/public/PublicMarketingBlocks";
import PublicAudiencePageFrame from "@/components/public/PublicAudiencePageFrame";
import PublicStructuredData from "@/components/public/PublicStructuredData";
import { MotionReveal } from "@/components/public/PublicMotion";
import {
  publicButtonClassName,
  publicPageSectionClassName,
  publicPanelClassName,
  publicSectionClassName,
} from "@/components/public/publicStyles";
import { companyMilestones, companyValues, publicSiteUrl } from "@/lib/public-marketing";
import { usePublicPageData } from "@/hooks/usePublicPageData";
import { withPublicAudience, type PublicAudience } from "@/lib/public-audience";

type AboutContent = {
  eyebrow: string;
  title: string;
  subtitle: string;
  missionTitle: string;
  missionBody: string;
  governanceTitle: string;
  governanceBody: string;
};

export default function AboutPageClient({ audience }: { audience: PublicAudience }) {
  const {
    profile,
    headerContent,
    footerContent,
    siteData,
    allowedPaths,
    pageVisible,
    parseContent,
  } = usePublicPageData("about", audience);

  const content = parseContent<AboutContent>({
    eyebrow: "About UabIndia ERP",
    title: "A modern ERP company focused on operational clarity, not feature noise.",
    subtitle:
      "UabIndia ERP is designed to help organizations replace fragmented systems with one disciplined platform for people, payroll, finance, procurement, inventory, support, and reporting.",
    missionTitle: "Mission",
    missionBody:
      "Build enterprise software that helps leadership, finance, HR, and operations teams work from one reliable operating picture.",
    governanceTitle: "Why governance matters",
    governanceBody:
      "Strong software should make accountability easier to see. That means role-based access, approval traceability, and shared workflow language across modules.",
  });

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: "About UabIndia ERP",
    url: `${publicSiteUrl}/about`,
    description: content.subtitle,
  };
  const liveSummaryStats =
    siteData?.summaryStats?.slice(0, 4).map((item) => ({
      label: item.label,
      value: `${item.value.toLocaleString("en-IN")}${item.suffix}`,
    })) ?? [];

  return (
    <PublicAudiencePageFrame
      audience={audience}
      profile={profile}
      headerContent={headerContent}
      footerContent={footerContent}
      allowedPaths={allowedPaths}
      pageVisible={pageVisible}
    >
      <PublicStructuredData data={structuredData} />

      <section className={publicPageSectionClassName}>
        <div className={`${publicSectionClassName} grid gap-6 xl:grid-cols-[1.02fr_0.98fr]`}>
          <MotionReveal>
            <div>
              <SectionIntro eyebrow={content.eyebrow} title={content.title} subtitle={content.subtitle} />
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href={withPublicAudience("/book-demo", audience)} className={publicButtonClassName.primary}>
                  Book Demo
                </Link>
                <Link href={withPublicAudience("/contact", audience)} className={publicButtonClassName.secondary}>
                  Talk to the team
                </Link>
              </div>
            </div>
          </MotionReveal>

          <MotionReveal delay={0.06}>
            <div className={`${publicPanelClassName} h-full p-6`}>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--erp-primary)]">
                {content.missionTitle}
              </p>
              <h2 className="mt-3 text-[1.9rem] font-semibold tracking-[-0.05em] text-slate-950">
                Premium on the surface. Disciplined underneath.
              </h2>
              <p className="mt-3 text-[0.98rem] leading-7 text-slate-600">{content.missionBody}</p>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {(liveSummaryStats.length > 0
                  ? liveSummaryStats
                  : [
                      { label: "Platform scope", value: "HR + ERP + Reporting" },
                      { label: "Deployment style", value: "Phased and governed" },
                      { label: "Target markets", value: "SMB to Enterprise" },
                      { label: "Design principle", value: "One operating language" },
                    ]).map((item) => (
                  <div key={item.label} className="rounded-[1rem] border border-slate-200 bg-slate-50/70 px-4 py-3.5">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{item.label}</p>
                    <p className="mt-2 text-lg font-semibold tracking-[-0.03em] text-slate-950">{item.value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-5 grid gap-3">
                {[
                  "Build one operating language across people, finance, and operations.",
                  "Keep governance visible through access control and approval traceability.",
                  "Reduce noise so the product and the public story feel equally disciplined.",
                ].map((item) => (
                  <div key={item} className="rounded-[1rem] border border-slate-200 bg-white px-4 py-3.5 text-sm leading-6 text-slate-700">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </MotionReveal>
        </div>
      </section>

      <ValueGrid items={companyValues} />
      <ProcessTimeline
        items={companyMilestones.map((item) => ({
          step: item.year,
          title: item.title,
          description: item.description,
        }))}
        eyebrow={content.governanceTitle}
        title="A better ERP rollout starts with a better operating model."
        subtitle={content.governanceBody}
      />
      <CtaPanel
        eyebrow="Next step"
        title="Review your current process stack and identify where the operating friction really is."
        description="The clearest way to evaluate UabIndia ERP is to map the handoffs that currently slow down payroll, approvals, reporting, or operational decisions."
        primaryLabel="Book Free Demo"
        primaryHref={withPublicAudience("/book-demo", audience)}
        secondaryLabel="Contact Us"
        secondaryHref={withPublicAudience("/contact", audience)}
      />
    </PublicAudiencePageFrame>
  );
}
