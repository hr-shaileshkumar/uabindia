"use client";

import {
  CtaPanel,
  DemoAgendaPanel,
  SectionIntro,
  SupportLaneGrid,
} from "@/components/public/PublicMarketingBlocks";
import PublicAudiencePageFrame from "@/components/public/PublicAudiencePageFrame";
import PublicStructuredData from "@/components/public/PublicStructuredData";
import { MotionReveal } from "@/components/public/PublicMotion";
import { publicPanelClassName, publicSectionClassName } from "@/components/public/publicStyles";
import { ContactDemoForm } from "@/components/erp/contact-demo-form";
import { supportLanes, publicSiteUrl } from "@/lib/public-marketing";
import { usePublicPageData } from "@/hooks/usePublicPageData";
import { withPublicAudience, type PublicAudience } from "@/lib/public-audience";

type ContactContent = {
  eyebrow: string;
  title: string;
  subtitle: string;
};

export default function ContactPageClient({ audience }: { audience: PublicAudience }) {
  const {
    profile,
    headerContent,
    footerContent,
    allowedPaths,
    pageVisible,
    parseContent,
  } = usePublicPageData("contact", audience);

  const content = parseContent<ContactContent>({
    eyebrow: audience === "platform" ? "Contact and demo requests" : "Support and contact",
    title:
      audience === "platform"
        ? "Talk to the UabIndia ERP team about your rollout."
        : `Contact ${profile.brandName} support and service teams.`,
    subtitle:
      audience === "platform"
        ? "Share your business size, current system stack, and module priorities. We will shape the walkthrough around your real operating context."
        : "Use this page for access support, workflow help, product questions, and company-level assistance.",
  });

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: "Contact UabIndia ERP",
    url: `${publicSiteUrl}/contact`,
    description: content.subtitle,
  };

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

      <section className="py-16 sm:py-20">
        <div className={`${publicSectionClassName} grid gap-8 xl:grid-cols-[0.88fr_1.12fr]`}>
          <div className="space-y-6">
            <MotionReveal>
              <SectionIntro eyebrow={content.eyebrow} title={content.title} subtitle={content.subtitle} />
            </MotionReveal>
            <MotionReveal delay={0.06}>
              <DemoAgendaPanel
                items={[
                  "Map the modules that matter first for your business",
                  "Review approval, reporting, attendance, and payroll friction points",
                  "Discuss implementation sequencing, entities, and branch complexity",
                  "Plan a realistic path from demo to deployment",
                ]}
              />
            </MotionReveal>
            <MotionReveal delay={0.12}>
              <div className={`${publicPanelClassName} p-6`}>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--erp-primary)]">
                  Direct contact
                </p>
                <div className="mt-4 space-y-3 text-sm leading-7 text-slate-700">
                  <p>{profile.supportEmail}</p>
                  <p>{profile.supportPhone}</p>
                  <p>{profile.headquarters}</p>
                  <p className="text-slate-500">{profile.supportHours}</p>
                </div>
              </div>
            </MotionReveal>
          </div>

          <MotionReveal delay={0.08}>
            <ContactDemoForm audience={audience} />
          </MotionReveal>
        </div>
      </section>

      <section className="pb-16 sm:pb-20">
        <div className={`${publicSectionClassName} grid gap-6 xl:grid-cols-[0.86fr_1.14fr]`}>
          <MotionReveal>
            <div>
              <SectionIntro
                eyebrow="Support coverage"
                title="The right conversation depends on where the business issue sits."
                subtitle="Sales, implementation, support, and post-go-live optimization are related, but they should still follow clear ownership paths."
              />
            </div>
          </MotionReveal>
          <MotionReveal delay={0.06}>
            <SupportLaneGrid items={supportLanes} />
          </MotionReveal>
        </div>
      </section>

      <CtaPanel
        eyebrow="Planning call"
        title="If you already know the pain points, the fastest next step is a focused walkthrough."
        description="Share your employee count, locations, and target modules. We will shape the discussion around rollout fit rather than generic product presentation."
        primaryLabel="Book Demo"
        primaryHref={withPublicAudience("/book-demo", audience)}
        secondaryLabel="View Pricing"
        secondaryHref={withPublicAudience("/pricing", audience)}
      />
    </PublicAudiencePageFrame>
  );
}
