"use client";

import Link from "next/link";
import {
  AnalyticsShowcase,
  AnimatedStatsBand,
  ComparisonTable,
  ConnectedFlowSection,
  CtaPanel,
  FaqAccordion,
  HighlightChipGrid,
  IndustryGrid,
  MarketingHero,
  ModuleGrid,
  ProblemGrid,
  ProcessTimeline,
  SolutionFramework,
} from "@/components/public/PublicMarketingBlocks";
import { MotionReveal } from "@/components/public/PublicMotion";
import PublicStructuredData from "@/components/public/PublicStructuredData";
import { PlatformPublicPageShell, usePlatformPublicPage } from "@/components/public/pages/PlatformPublicPageShell";
import { publicButtonClassName, publicPanelClassName, publicSectionClassName } from "@/components/public/publicStyles";
import {
  businessProblems,
  comparisonRows,
  dashboardSignals,
  frequentlyAskedQuestions,
  heroMetrics,
  implementationSteps,
  marketingIndustries,
  marketingModules,
  platformHighlights,
  publicSiteUrl,
  solutionSignals,
} from "@/lib/public-marketing";
import { withPublicAudience } from "@/lib/public-audience";

type HomePageContent = {
  eyebrow: string;
  subtitle: string;
  primaryCtaLabel: string;
  secondaryCtaLabel: string;
  badges: string[];
};

export default function PlatformHomePage() {
  const {
    profile,
    headerContent,
    footerContent,
    siteData,
    allowedPaths,
    loading,
    pageVisible,
    parseContent,
  } = usePlatformPublicPage("platform-home");

  const content = parseContent<HomePageContent>({
    eyebrow: "India's Modern ERP Platform",
    subtitle:
      "Manage HR, payroll, attendance, finance, inventory, procurement, CRM, projects, assets, support, and reporting from one secure cloud solution.",
    primaryCtaLabel: "Book Free Demo",
    secondaryCtaLabel: "Explore Modules",
    badges: [
      "HRMS",
      "Payroll",
      "Finance",
      "Inventory",
      "Procurement",
      "Employee Self Service",
    ],
  });

  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: profile.brandName,
      url: publicSiteUrl,
      email: profile.supportEmail,
      telephone: profile.supportPhone,
      description:
        "UabIndia ERP is a cloud ERP platform for HR, payroll, attendance, finance, procurement, inventory, CRM, projects, assets, compliance, and operations.",
    },
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: profile.brandName,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      url: publicSiteUrl,
      description:
        "One cloud ERP platform for HRMS, payroll, finance, procurement, inventory, CRM, projects, help desk, and reporting.",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "INR",
        availability: "https://schema.org/InStock",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: frequentlyAskedQuestions.slice(0, 8).map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.answer,
        },
      })),
    },
  ];
  const liveHeroMetrics = siteData?.heroMetrics?.length ? siteData.heroMetrics : heroMetrics;
  const liveDashboardMetrics =
    siteData?.dashboardMetrics?.length ? siteData.dashboardMetrics : dashboardSignals;
  const liveSummaryStats =
    siteData?.summaryStats?.map((item) => ({
      value: item.value,
      suffix: item.suffix,
      label: item.label,
    })) ?? [];
  const liveDataNotice = siteData?.socialProof?.note;

  return (
    <PlatformPublicPageShell
      loading={loading}
      profile={profile}
      headerContent={headerContent}
      footerContent={footerContent}
      allowedPaths={allowedPaths}
      pageVisible={pageVisible}
    >
      <PublicStructuredData data={structuredData} />

      <MarketingHero
        eyebrow={content.eyebrow}
        title={
          <>
            Run your <span className="public-gradient-text bg-clip-text text-transparent">entire business</span>
            <br />
            from one intelligent <span className="public-gradient-text bg-clip-text text-transparent">ERP platform.</span>
          </>
        }
        subtitle={content.subtitle}
        badges={content.badges}
        metrics={liveHeroMetrics}
        trustSignals={["No Credit Card", "Free Consultation", "Cloud Based"]}
        actions={
          <>
            <Link href={withPublicAudience("/book-demo", "platform")} className={publicButtonClassName.primary}>
              {content.primaryCtaLabel}
            </Link>
            <Link href={withPublicAudience("/products", "platform")} className={publicButtonClassName.secondary}>
              {content.secondaryCtaLabel}
            </Link>
          </>
        }
      />

      <ProblemGrid items={businessProblems} />
      <SolutionFramework items={solutionSignals} />
      <ConnectedFlowSection />
      <ModuleGrid
        modules={marketingModules}
        eyebrow="ERP modules"
        title="Everything you need in one intelligent enterprise platform."
        subtitle="HR, payroll, finance, procurement, inventory, CRM, projects, analytics, and employee self service stay connected inside one cloud ERP."
      />
      <HighlightChipGrid items={platformHighlights} />
      {liveSummaryStats.length > 0 ? <AnimatedStatsBand items={liveSummaryStats} /> : null}
      <ProcessTimeline items={implementationSteps} />
      <AnalyticsShowcase metrics={liveDashboardMetrics} />
      {liveDataNotice ? (
        <section className="pb-16 sm:pb-20">
          <div className={publicSectionClassName}>
            <MotionReveal>
              <div className={`${publicPanelClassName} p-6 sm:p-8`}>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--erp-primary)]">
                  Verified public data
                </p>
                <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-[2.2rem]">
                  Public proof is approval-based, not placeholder-based.
                </h2>
                <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
                  {liveDataNotice}
                </p>
              </div>
            </MotionReveal>
          </div>
        </section>
      ) : null}
      <IndustryGrid industries={marketingIndustries} />
      <ComparisonTable rows={comparisonRows} />
      <FaqAccordion items={frequentlyAskedQuestions} />
      <CtaPanel
        eyebrow="Final CTA"
        title="Ready to transform your business with one disciplined ERP platform?"
        description="Book a guided walkthrough, share your operating context, and get a rollout recommendation built around your workforce, approvals, reporting, and growth priorities."
        primaryLabel="Book Free Demo"
        primaryHref={withPublicAudience("/book-demo", "platform")}
        secondaryLabel="Talk to Sales"
        secondaryHref={withPublicAudience("/contact", "platform")}
      />
    </PlatformPublicPageShell>
  );
}
