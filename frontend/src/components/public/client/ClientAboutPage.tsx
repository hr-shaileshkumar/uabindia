"use client";

import Link from "next/link";
import { Building2, ShieldCheck, Target, Users, MapPin, Award } from "lucide-react";
import PublicAudiencePageFrame from "@/components/public/PublicAudiencePageFrame";
import PublicPageHero from "@/components/public/PublicPageHero";
import PublicStructuredData from "@/components/public/PublicStructuredData";
import {
  publicButtonClassName,
  publicPageSectionClassName,
  publicPanelClassName,
  publicSectionClassName,
} from "@/components/public/publicStyles";
import { usePublicPageData } from "@/hooks/usePublicPageData";
import { withPublicAudience } from "@/lib/public-audience";
import { publicSiteUrl } from "@/lib/public-marketing";
import { cn } from "@/lib/utils";

type ClientAboutContent = {
  eyebrow: string;
  title: string;
  subtitle: string;
  missionTitle: string;
  missionBody: string;
  governanceTitle: string;
  governanceBody: string;
  values?: Array<{ title: string; description: string }>;
  milestones?: Array<{ year: string; title: string; description: string }>;
};

export default function ClientAboutPage() {
  const { profile, headerContent, footerContent, allowedPaths, pageVisible, parseContent } =
    usePublicPageData("about", "tenant");

  const companyDisplayName = profile.brandName || profile.companyName || "Our Organization";

  const content = parseContent<ClientAboutContent>({
    eyebrow: "About " + companyDisplayName,
    title: `Delivering operational excellence and verified enterprise value`,
    subtitle:
      profile.heroSubtitle ||
      `Learn about ${companyDisplayName}'s mission, leadership standards, workplace values, and official operating standards.`,
    missionTitle: "Our Mission & Commitment",
    missionBody:
      "To provide high-quality services, transparent governance, and reliable solutions to our clients, employees, and partners through disciplined operations.",
    governanceTitle: "Workplace & Governance Standards",
    governanceBody:
      "Strict compliance with regional safety, labor regulations, fair employment standards, and automated audit trails across all departments.",
    values: [
      {
        title: "Integrity & Trust",
        description: "Zero tolerance for non-compliance; transparent dealings with clients and vendors.",
      },
      {
        title: "Operational Excellence",
        description: "Standard operating procedures and real-time systems to maintain consistent delivery.",
      },
      {
        title: "Customer Centricity",
        description: "Dedicated account desks, responsive support, and clear communication channels.",
      },
    ],
  });

  return (
    <PublicAudiencePageFrame
      audience="tenant"
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
          name: `About | ${companyDisplayName}`,
          url: `${publicSiteUrl}/about`,
          description: content.subtitle,
        }}
      />

      <div className={cn(publicSectionClassName, "pt-4 pb-12 sm:pt-6 sm:pb-16")}>
        {/* Hero Section */}
        <div className="border-b border-slate-200/80 pb-6 dark:border-slate-800">
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-cyan-400">
            <Building2 className="h-4 w-4" />
            <span className="uppercase tracking-wider">{content.eyebrow}</span>
          </div>
          <h1 className="mt-2 text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white">
            {content.title}
          </h1>
          <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-3xl leading-relaxed">
            {content.subtitle}
          </p>
        </div>

        {/* Mission & Governance Grid */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className={cn(publicPanelClassName, "border-l-4 border-l-blue-600 dark:border-l-blue-500")}>
            <div className="flex items-center gap-2 text-blue-600 dark:text-cyan-400">
              <Target className="h-5 w-5" />
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">{content.missionTitle}</h2>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              {content.missionBody}
            </p>
          </div>

          <div className={cn(publicPanelClassName, "border-l-4 border-l-emerald-600 dark:border-l-emerald-500")}>
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="h-5 w-5" />
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">{content.governanceTitle}</h2>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              {content.governanceBody}
            </p>
          </div>
        </div>

        {/* Core Values */}
        {content.values && content.values.length > 0 && (
          <div className="mt-10">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Core Principles & Values</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {content.values.map((v, i) => (
                <div key={i} className={publicPanelClassName}>
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300 mb-3">
                    <Award className="h-4 w-4" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">{v.title}</h4>
                  <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{v.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA Strip */}
        <div className="mt-10 rounded-2xl bg-slate-100/80 p-6 dark:bg-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h4 className="text-base font-bold text-slate-900 dark:text-white">Have inquiries or need partnership info?</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">Get in touch directly with our corporate desk.</p>
          </div>
          <Link href={withPublicAudience("/contact", "tenant")} className={publicButtonClassName.primary}>
            Contact Corporate Desk
          </Link>
        </div>
      </div>
    </PublicAudiencePageFrame>
  );
}
