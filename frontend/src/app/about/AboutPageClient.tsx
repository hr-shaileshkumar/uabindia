"use client";

import Link from "next/link";
import {
  CtaPanel,
  ProcessTimeline,
  ValueGrid,
} from "@/components/public/PublicMarketingBlocks";
import PublicAudiencePageFrame from "@/components/public/PublicAudiencePageFrame";
import PublicInfoPanel from "@/components/public/PublicInfoPanel";
import PublicPageHero from "@/components/public/PublicPageHero";
import PublicStructuredData from "@/components/public/PublicStructuredData";
import {
  publicButtonClassName,
  publicPageSectionClassName,
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
    allowedPaths,
    pageVisible,
    parseContent,
    siteData,
  } = usePublicPageData("about", audience);

  const content = parseContent<AboutContent>({
    eyebrow: "About",
    title: "Enterprise software built for operational clarity",
    subtitle:
      "Cloud ERP for organizations that need one reliable system for people, payroll, finance, procurement, inventory, and operations.",
    missionTitle: "Mission",
    missionBody:
      "Help leadership, HR, finance, and operations work from one live operating picture — with approvals, access control, and reporting that stay trustworthy as you grow.",
    governanceTitle: "How we deliver",
    governanceBody:
      "Role-based access, traceable approvals, and phased module expansion that does not disrupt daily work.",
  });

  const summaryStats =
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
      <PublicStructuredData
        data={{
          "@context": "https://schema.org",
          "@type": "AboutPage",
          name: `About ${profile.brandName}`,
          url: `${publicSiteUrl}/about`,
          description: content.subtitle,
        }}
      />

      <section className={publicPageSectionClassName}>
        <div className={`${publicSectionClassName} grid gap-6 lg:grid-cols-2`}>
          <PublicPageHero
            eyebrow={content.eyebrow}
            title={content.title}
            subtitle={content.subtitle}
            actions={
              <>
                <Link href={withPublicAudience("/book-demo", audience)} className={publicButtonClassName.primary}>
                  Book demo
                </Link>
                <Link href={withPublicAudience("/contact", audience)} className={publicButtonClassName.secondary}>
                  Contact
                </Link>
              </>
            }
          />
          <PublicInfoPanel
            eyebrow={content.missionTitle}
            title="One system. Clear ownership."
            summary={content.missionBody}
            stats={summaryStats.length > 0 ? summaryStats : undefined}
            points={[
              "One operating language across people, finance, and operations",
              "Visible governance through access control and approvals",
              "Product and public experience with the same discipline",
            ]}
          />
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
        title="A better ERP rollout starts with a better operating model"
        subtitle={content.governanceBody}
      />

      <CtaPanel
        title="Map where your current stack creates friction"
        description="Evaluate UabIndia ERP against the handoffs that slow payroll, approvals, reporting, or operations."
        primaryLabel="Book demo"
        primaryHref={withPublicAudience("/book-demo", audience)}
        secondaryLabel="Contact"
        secondaryHref={withPublicAudience("/contact", audience)}
      />
    </PublicAudiencePageFrame>
  );
}
