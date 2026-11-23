"use client";

import {
  CtaPanel,
  PricingGrid,
} from "@/components/public/PublicMarketingBlocks";
import PublicAudiencePageFrame from "@/components/public/PublicAudiencePageFrame";
import PublicPageHero from "@/components/public/PublicPageHero";
import PublicStructuredData from "@/components/public/PublicStructuredData";
import PublicSmartImage from "@/components/public/PublicSmartImage";
import { MotionReveal } from "@/components/public/PublicMotion";
import {
  publicPageSectionClassName,
  publicSectionClassName,
} from "@/components/public/publicStyles";
import { usePublicPageData } from "@/hooks/usePublicPageData";
import {
  pricingPlans,
  publicSiteUrl,
  type PricingPlan,
} from "@/lib/public-marketing";
import { withPublicAudience, type PublicAudience } from "@/lib/public-audience";

type HeroContent = {
  eyebrow: string;
  title: string;
  subtitle: string;
};

export function PricingLandingPage({ audience }: { audience: PublicAudience }) {
  const shell = usePublicPageData("pricing", audience);
  const content = shell.parseContent<HeroContent & { plans?: PricingPlan[] }>({
    eyebrow: "Pricing",
    title: "Plans that follow rollout scope",
    subtitle:
      "Every tier includes the platform foundation. Commercial terms track business size, module scope, and implementation depth.",
  });

  const displayedPlans = content.plans && content.plans.length > 0 ? content.plans : pricingPlans;

  return (
    <PublicAudiencePageFrame
      audience={audience}
      profile={shell.profile}
      headerContent={shell.headerContent}
      footerContent={shell.footerContent}
      allowedPaths={shell.allowedPaths}
      pageVisible={shell.pageVisible}
    >
      <PublicStructuredData
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "Pricing | UabIndia ERP",
          url: `${publicSiteUrl}/pricing`,
          description: content.subtitle,
        }}
      />
      <section className={publicPageSectionClassName}>
        <div className={publicSectionClassName}>
          <MotionReveal>
            <PublicPageHero eyebrow={content.eyebrow} title={content.title} subtitle={content.subtitle} />
          </MotionReveal>
          <PublicSmartImage
            pageKey="pricing"
            alt="UabIndia Global Pricing Plans"
            aspectRatio="wide"
            className="my-6"
          />
          <MotionReveal delay={0.04} className="mt-8">
            <PricingGrid plans={displayedPlans} />
          </MotionReveal>
        </div>
      </section>

      <CtaPanel
        eyebrow="Commercial planning"
        title="Need help choosing the right plan?"
        description="Tell us about your branches, modules, and timeline — we will recommend a commercial model that fits."
        primaryLabel="Talk to Sales"
        primaryHref={withPublicAudience("/contact", audience)}
        secondaryLabel="Request a Demo"
        secondaryHref={withPublicAudience("/contact?type=demo", audience)}
      />
    </PublicAudiencePageFrame>
  );
}

export default function PlatformPricingPage({ audience = "platform" }: { audience?: PublicAudience }) {
  return <PricingLandingPage audience={audience} />;
}
