"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Clock3, Mail, MapPinned, PhoneCall, Sparkles } from "lucide-react";
import { DemoAgendaPanel, SupportLaneGrid } from "@/components/public/PublicMarketingBlocks";
import PublicAudiencePageFrame from "@/components/public/PublicAudiencePageFrame";
import PublicPageHero from "@/components/public/PublicPageHero";
import PublicStructuredData from "@/components/public/PublicStructuredData";
import PublicSmartImage from "@/components/public/PublicSmartImage";
import {
  publicEyebrowClassName,
  publicPageSectionClassName,
  publicPanelClassName,
  publicSectionClassName,
  publicSectionSpacingClassName,
} from "@/components/public/publicStyles";
import { ContactDemoForm } from "@/components/workspace/contact-demo-form";
import { supportLanes, publicSiteUrl } from "@/lib/public-marketing";
import { usePublicPageData } from "@/hooks/usePublicPageData";
import type { PublicAudience } from "@/lib/public-audience";

type ContactContent = {
  eyebrow: string;
  title: string;
  subtitle: string;
};

export default function ContactPageClient({ audience }: { audience: PublicAudience }) {
  const searchParams = useSearchParams();
  const isDemo = searchParams.get("type") === "demo" || searchParams.get("demo") === "true";

  const { profile, headerContent, footerContent, allowedPaths, pageVisible, parseContent } =
    usePublicPageData("contact", audience);

  const defaultEyebrow = isDemo
    ? "Product Walkthrough"
    : audience === "platform"
    ? "Contact Sales & Support"
    : "Support Desk";

  const defaultTitle = isDemo
    ? "Schedule a 1-on-1 Enterprise Demo"
    : audience === "platform"
    ? "Tell us about your business"
    : `Get help from ${profile.brandName}`;

  const defaultSubtitle = isDemo
    ? "Experience tailored workflows for payroll, GST, attendance, and accounting with our solution experts in a 20-minute live walkthrough."
    : audience === "platform"
    ? "Share team size, modules of interest, and current challenges. We typically respond within one business day."
    : "Use this form for access issues, workflow questions, and company support requests.";

  const content = parseContent<ContactContent>({
    eyebrow: defaultEyebrow,
    title: defaultTitle,
    subtitle: defaultSubtitle,
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
          name: `${isDemo ? "Request a Demo" : "Contact"} | ${profile.brandName}`,
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
                  "Map the modules that matter first (HRMS, Payroll, Accounts, Inventory)",
                  "Review Indian statutory compliance (GST, TDS, E-Way Bill)",
                  "Live walkthrough of approval workflows & biometric attendance",
                  "Plan a realistic rollout path with zero disruption to daily work",
                ]}
              />
            ) : null}

            {/* Optional Contact Page Image - Auto loads if user adds to /assets/pages/contact/ */}
            <PublicSmartImage
              pageKey="contact"
              alt="UabIndia Customer Support & Sales"
              aspectRatio="video"
            />

            {contactItems.length > 0 ? (
              <div className={publicPanelClassName}>
                <p className={publicEyebrowClassName}>Direct Contact Channels</p>
                <div className="mt-4 space-y-3">
                  {contactItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <div key={item.label} className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-300">
                        <Icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">{item.label}</p>
                          <p className="mt-0.5 text-slate-600 dark:text-slate-400">{item.value}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>

          <div className={publicPanelClassName}>
            {/* Cross-Conversion Bridge for Platform Audience */}
            {audience === "platform" ? (
              <div className="mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-blue-200 bg-blue-50/80 p-3.5 text-xs text-blue-900 dark:border-blue-900/60 dark:bg-blue-950/60 dark:text-blue-200">
                <div>
                  <p className="font-bold">Want to explore hands-on immediately?</p>
                  <p className="text-blue-700 dark:text-blue-300">Skip the demo queue and create your free 14-day trial workspace.</p>
                </div>
                <Link
                  href="/register"
                  className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-[var(--uab-primary,#1d4ed8)] px-3 py-1.5 font-bold text-white hover:brightness-110 transition-all text-xs shadow-xs"
                >
                  <Sparkles className="h-3 w-3" />
                  Create Workspace
                </Link>
              </div>
            ) : null}

            <ContactDemoForm audience={audience} variant="public" />
          </div>
        </div>
      </section>

      {audience === "platform" ? (
        <section className={publicSectionSpacingClassName}>
          <div className={publicSectionClassName}>
            <p className={publicEyebrowClassName}>Support Coverage</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">Dedicated Coverage by Stage</h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
              Sales consultation, implementation roadmap, and live support each have clear owners.
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
