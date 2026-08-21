"use client";

import { Clock3, Mail, MapPinned, PhoneCall } from "lucide-react";
import { DemoAgendaPanel, SupportLaneGrid } from "@/components/public/PublicMarketingBlocks";
import PublicAudiencePageFrame from "@/components/public/PublicAudiencePageFrame";
import PublicPageHero from "@/components/public/PublicPageHero";
import PublicStructuredData from "@/components/public/PublicStructuredData";
import {
  publicEyebrowClassName,
  publicPageSectionClassName,
  publicPanelClassName,
  publicSectionClassName,
  publicSectionSpacingClassName,
} from "@/components/public/publicStyles";
import { ContactDemoForm } from "@/components/erp/contact-demo-form";
import { supportLanes, publicSiteUrl } from "@/lib/public-marketing";
import { usePublicPageData } from "@/hooks/usePublicPageData";
import type { PublicAudience } from "@/lib/public-audience";

type ContactContent = {
  eyebrow: string;
  title: string;
  subtitle: string;
};

export default function ContactPageClient({ audience }: { audience: PublicAudience }) {
  const { profile, headerContent, footerContent, allowedPaths, pageVisible, parseContent } =
    usePublicPageData("contact", audience);

  const content = parseContent<ContactContent>({
    eyebrow: audience === "platform" ? "Contact" : "Support",
    title:
      audience === "platform"
        ? "Tell us about your business"
        : `Get help from ${profile.brandName}`,
    subtitle:
      audience === "platform"
        ? "Share team size, modules of interest, and current challenges. We typically respond within one business day."
        : "Use this form for access issues, workflow questions, and company support requests.",
  });

  const contactItems = [
    { icon: Mail, label: "Email", value: profile.supportEmail },
    { icon: PhoneCall, label: "Phone", value: profile.supportPhone },
    { icon: MapPinned, label: "Address", value: profile.headquarters },
    { icon: Clock3, label: "Hours", value: profile.supportHours },
  ].filter((item) => item.value);

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
          "@type": "ContactPage",
          name: `Contact ${profile.brandName}`,
          url: `${publicSiteUrl}/contact`,
          description: content.subtitle,
        }}
      />

      <section className={publicPageSectionClassName}>
        <div className={`${publicSectionClassName} grid gap-8 lg:grid-cols-[0.9fr_1.1fr]`}>
          <div className="space-y-6">
            <PublicPageHero eyebrow={content.eyebrow} title={content.title} subtitle={content.subtitle} />

            {audience === "platform" ? (
              <DemoAgendaPanel
                items={[
                  "Map the modules that matter first",
                  "Review approval, reporting, and payroll friction",
                  "Discuss implementation sequencing",
                  "Plan a realistic path from demo to deployment",
                ]}
              />
            ) : null}

            {contactItems.length > 0 ? (
              <div className={publicPanelClassName}>
                <p className={publicEyebrowClassName}>Direct contact</p>
                <div className="mt-4 space-y-3">
                  {contactItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <div key={item.label} className="flex items-start gap-3 text-sm text-slate-700">
                        <Icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                        <div>
                          <p className="font-medium text-slate-900">{item.label}</p>
                          <p className="mt-0.5 text-slate-600">{item.value}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>

          <div className={publicPanelClassName}>
            <ContactDemoForm audience={audience} variant="public" />
          </div>
        </div>
      </section>

      {audience === "platform" ? (
        <section className={publicSectionSpacingClassName}>
          <div className={publicSectionClassName}>
            <p className={publicEyebrowClassName}>Support coverage</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">Who handles what</h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">
              Sales, implementation, and live support each have a clear owner.
            </p>
            <div className="mt-6">
              <SupportLaneGrid items={[...supportLanes]} />
            </div>
          </div>
        </section>
      ) : null}
    </PublicAudiencePageFrame>
  );
}
