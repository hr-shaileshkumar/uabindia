"use client";

import {
  CtaPanel,
  SupportLaneGrid,
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
  publicSiteUrl,
  supportLanes,
} from "@/lib/public-marketing";
import { withPublicAudience, type PublicAudience } from "@/lib/public-audience";

type HeroContent = {
  eyebrow: string;
  title: string;
  subtitle: string;
};

export function HelpSupportLandingPage({ audience }: { audience: PublicAudience }) {
  const shell = usePublicPageData("support", audience);
  const content = shell.parseContent<HeroContent>({
    eyebrow: "Help & support",
    title: "Clear support paths for every stage",
    subtitle:
      "Whether you are evaluating, rolling out, or running live operations — reach the team that owns your request.",
  });

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
          name: "Help & Support | UabIndia ERP",
          url: `${publicSiteUrl}/help-support`,
          description: content.subtitle,
        }}
      />
      <section className={publicPageSectionClassName}>
        <div className={publicSectionClassName}>
          <MotionReveal>
            <PublicPageHero eyebrow={content.eyebrow} title={content.title} subtitle={content.subtitle} />
          </MotionReveal>
          <PublicSmartImage
            pageKey="help-support"
            alt="UabIndia Global Support & Helpdesk"
            aspectRatio="wide"
            className="my-6"
          />
          <MotionReveal delay={0.04} className="mt-8">
            <SupportLaneGrid items={[...supportLanes]} />
          </MotionReveal>
        </div>
      </section>

      <CtaPanel
        eyebrow="Need help now?"
        title="Contact the team for sales, rollout, or live support."
        description="Share your question and we will route it to the appropriate support lane."
        primaryLabel="Contact Support Desk"
        primaryHref={withPublicAudience("/contact", audience)}
        secondaryLabel="Request a Demo"
        secondaryHref={withPublicAudience("/contact?type=demo", audience)}
      />
    </PublicAudiencePageFrame>
  );
}

export default HelpSupportLandingPage;
