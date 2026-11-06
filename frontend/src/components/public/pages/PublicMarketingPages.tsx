"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import {
  CtaPanel,
  PricingGrid,
  SupportLaneGrid,
} from "@/components/public/PublicMarketingBlocks";
import PublicAudiencePageFrame from "@/components/public/PublicAudiencePageFrame";
import PublicPageHero from "@/components/public/PublicPageHero";
import PublicStructuredData from "@/components/public/PublicStructuredData";
import PublicSmartImage from "@/components/public/PublicSmartImage";
import { MotionReveal } from "@/components/public/PublicMotion";
import {
  publicPageSectionClassName,
  publicPanelClassName,
  publicSectionClassName,
} from "@/components/public/publicStyles";
import { usePublicPageData } from "@/hooks/usePublicPageData";
import {
  pricingPlans,
  publicSiteUrl,
  supportLanes,
  type PricingPlan,
} from "@/lib/public-marketing";
import { withPublicAudience, type PublicAudience } from "@/lib/public-audience";
import { cn } from "@/lib/utils";

type HeroContent = {
  eyebrow: string;
  title: string;
  subtitle: string;
};

function PageShell({
  audience,
  shell,
  structuredData,
  children,
}: {
  audience: PublicAudience;
  shell: ReturnType<typeof usePublicPageData>;
  structuredData: Record<string, unknown>;
  children: ReactNode;
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
    <PageShell
      audience={audience}
      shell={shell}
      structuredData={{
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: "Pricing | UabIndia ERP",
        url: `${publicSiteUrl}/pricing`,
        description: content.subtitle,
      }}
    >
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
    </PageShell>
  );
}

export function HelpSupportLandingPage({ audience }: { audience: PublicAudience }) {
  const shell = usePublicPageData("support", audience);
  const content = shell.parseContent<HeroContent>({
    eyebrow: "Help & support",
    title: "Clear support paths for every stage",
    subtitle:
      "Whether you are evaluating, rolling out, or running live operations — reach the team that owns your request.",
  });

  return (
    <PageShell
      audience={audience}
      shell={shell}
      structuredData={{
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: "Help & Support | UabIndia ERP",
        url: `${publicSiteUrl}/help-support`,
        description: content.subtitle,
      }}
    >
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
        <div className={cn(publicSectionClassName, "max-w-3xl")}>
          <MotionReveal>
            <PublicPageHero eyebrow={eyebrow} title={title} />
          </MotionReveal>
          <div className="mt-8 space-y-4">
            {body.map((section) => (
              <MotionReveal key={section.heading}>
                <article className={publicPanelClassName}>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{section.heading}</h2>
                  <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">{section.text}</p>
                </article>
              </MotionReveal>
            ))}
          </div>
        </div>
      </section>
    </PageShell>
  );
}
