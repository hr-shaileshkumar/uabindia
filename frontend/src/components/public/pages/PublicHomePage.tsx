"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import {
  CtaPanel,
  IndustryGrid,
  MarketingHero,
  ModuleGrid,
  ResourceGrid,
  TrustRibbon,
} from "@/components/public/PublicMarketingBlocks";
import PublicStructuredData from "@/components/public/PublicStructuredData";
import { MotionReveal } from "@/components/public/PublicMotion";
import { PlatformPublicPageShell, usePlatformPublicPage } from "@/components/public/pages/PublicPageShell";
import {
  publicButtonClassName,
  publicPanelClassName,
  publicSectionClassName,
  publicSectionSpacingClassName,
} from "@/components/public/publicStyles";
import {
  marketingIndustries,
  marketingModules,
  publicSiteUrl,
  resources,
  type MarketingModule,
} from "@/lib/public-marketing";
import { withPublicAudience } from "@/lib/public-audience";
import { publicApi } from "@/services/publicApi";
import { cn } from "@/lib/utils";

type HomePageContent = {
  eyebrow: string;
  title: string;
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

  const [dbModules, setDbModules] = useState<MarketingModule[]>([]);

  useEffect(() => {
    publicApi
      .getPublicModules()
      .then((res) => {
        if (Array.isArray(res?.data) && res.data.length > 0) {
          const mapped: MarketingModule[] = res.data.map((m) => ({
            slug: m.slug,
            title: m.title,
            category: (m.category === "People" || m.category === "Finance" || m.category === "Operations" || m.category === "Engagement") ? m.category : "Operations",
            icon: m.icon || "Boxes",
            summary: m.summary || `${m.title} enterprise operations module.`,
            description: m.summary || `${m.title} core module for enterprise management.`,
            outcomes: [],
            highlights: [],
            idealFor: [],
            metrics: [],
          }));
          setDbModules(mapped);
        }
      })
      .catch(() => {});
  }, []);

  const content = parseContent<HomePageContent>({
    eyebrow: "Cloud ERP platform",
    title: "Run HR, payroll, finance, and operations in one system",
    subtitle:
      "A secure enterprise platform for Indian organizations — phased module rollout, role-based access, and audit-ready workflows.",
    primaryCtaLabel: "Request a Demo",
    secondaryCtaLabel: "Explore Products",
    badges: ["HRMS", "Payroll", "Finance", "Inventory", "Procurement", "CRM"],
  });

  const displayedModules = dbModules.length > 0 ? dbModules.slice(0, 8) : marketingModules.slice(0, 8);
  const dynamicIndustries = (siteData?.industryCoverage ?? []).map((item) => ({
    slug: item.name.toLowerCase().replace(/\s+/g, "-"),
    title: item.name,
    eyebrow: "Sector",
    summary: item.sector || `${item.name} operational workflows`,
    description: `Enterprise ERP solutions for ${item.name} organizations.`,
    challenges: [],
    recommendedModules: [],
    results: [],
  }));
  const displayedIndustries = dynamicIndustries.length > 0 ? dynamicIndustries : marketingIndustries.slice(0, 6);

  const trustMarks = (siteData?.industryCoverage ?? []).map((item: { name: string; sector: string; mark: string }) => ({
    name: item.name,
    sector: item.sector,
    mark: item.mark,
  }));

  const liveStats = (siteData?.summaryStats ?? []).slice(0, 4);

  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: profile.brandName,
      url: publicSiteUrl,
      email: profile.supportEmail,
      telephone: profile.supportPhone,
    },
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: profile.brandName,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      url: publicSiteUrl,
    },
  ];

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
        title={content.title}
        subtitle={content.subtitle}
        badges={content.badges}
        trustSignals={["Role-based access", "Audit-ready workflows", "Secure cloud"]}
        actions={
          <>
            <Link href={withPublicAudience("/book-demo", "platform")} className={publicButtonClassName.primary}>
              {content.primaryCtaLabel}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href={withPublicAudience("/products", "platform")} className={publicButtonClassName.secondary}>
              {content.secondaryCtaLabel}
            </Link>
          </>
        }
      />

      {trustMarks.length > 0 ? <TrustRibbon items={trustMarks} /> : null}

      {liveStats.length > 0 ? (
        <section className="border-b border-slate-200 bg-white py-8">
          <div className={cn(publicSectionClassName, "grid gap-4 sm:grid-cols-2 lg:grid-cols-4")}>
            {liveStats.map((stat: { label: string; value: number; suffix?: string }) => (
              <div key={stat.label} className={publicPanelClassName}>
                <p className="text-2xl font-semibold text-slate-900">
                  {stat.value.toLocaleString("en-IN")}
                  {stat.suffix}
                </p>
                <p className="mt-1 text-sm text-slate-600">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className={publicSectionSpacingClassName}>
        <div className={cn(publicSectionClassName, "grid gap-4 md:grid-cols-3")}>
          {[
            {
              title: "One operating system",
              body: "Connect HR, payroll, procurement, finance, and support without tool sprawl.",
            },
            {
              title: "Phased implementation",
              body: "Start with the modules you need. Expand without redesigning the workspace.",
            },
            {
              title: "Governed scale",
              body: "Multi-branch and multi-entity ready with consistent approvals and access control.",
            },
          ].map((item, index) => (
            <MotionReveal key={item.title} delay={index * 0.04}>
              <article className={cn(publicPanelClassName, "h-full")}>
                <h2 className="text-base font-semibold text-slate-900">{item.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.body}</p>
              </article>
            </MotionReveal>
          ))}
        </div>
      </section>

      <section className={cn(publicSectionSpacingClassName, "bg-slate-50")}>
        <div className={cn(publicSectionClassName, "grid gap-6 lg:grid-cols-2")}>
          <article className={publicPanelClassName}>
            <h2 className="text-xl font-semibold text-slate-900">Built for connected operations</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              UabIndia ERP keeps people, money, and inventory on one data core — with shared approvals and reporting.
            </p>
            <ul className="mt-5 space-y-2">
              {[
                "Role-aware navigation and approvals",
                "Module-by-module rollout",
                "Shared reporting across functions",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-slate-700">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  {item}
                </li>
              ))}
            </ul>
          </article>
          <article className={publicPanelClassName}>
            <h2 className="text-xl font-semibold text-slate-900">Ready when you are</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Evaluate with a focused demo, then roll out with clear ownership and training that matches your team size.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href={withPublicAudience("/book-demo", "platform")} className={publicButtonClassName.primary}>
                Request a Demo
              </Link>
              <Link href={withPublicAudience("/pricing", "platform")} className={publicButtonClassName.secondary}>
                View Pricing Plans
              </Link>
            </div>
          </article>
        </div>
      </section>

      <ModuleGrid
        modules={displayedModules}
        title="Modules that work alone — and better together"
        subtitle="Launch with the functions you need today. Add more when your team is ready."
      />

      <IndustryGrid
        industries={displayedIndustries}
        title="Built for how your sector operates"
        subtitle="Healthcare, manufacturing, retail, logistics, education, and project-led teams."
      />

      <ResourceGrid
        resources={resources.slice(0, 3)}
        title="Practical evaluation resources"
        subtitle="Checklists and guides to move your ERP decision forward."
      />

      <CtaPanel
        title="See the platform with your workflows in mind"
        description="Request a demo tailored to your modules, team size, and rollout goals."
        primaryLabel="Request a Demo"
        primaryHref={withPublicAudience("/book-demo", "platform")}
        secondaryLabel="Contact Sales"
        secondaryHref={withPublicAudience("/contact", "platform")}
      />
    </PlatformPublicPageShell>
  );
}
