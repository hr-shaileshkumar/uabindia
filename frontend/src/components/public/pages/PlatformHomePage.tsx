"use client";

import Link from "next/link";
import {
  CtaPanel,
  IndustryGrid,
  MarketingHero,
  ModuleGrid,
  ResourceGrid,
  TrustRibbon,
} from "@/components/public/PublicMarketingBlocks";
import { MotionReveal } from "@/components/public/PublicMotion";
import PublicStructuredData from "@/components/public/PublicStructuredData";
import { PlatformPublicPageShell, usePlatformPublicPage } from "@/components/public/pages/PlatformPublicPageShell";
import {
  publicButtonClassName,
  publicEyebrowClassName,
  publicPanelClassName,
  publicPanelHoverClassName,
  publicSectionClassName,
} from "@/components/public/publicStyles";
import {
  heroMetrics,
  marketingIndustries,
  marketingModules,
  publicSiteUrl,
  resources,
  trustedOrganizations,
} from "@/lib/public-marketing";
import { withPublicAudience } from "@/lib/public-audience";
import { Check, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

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
    eyebrow: "Enterprise ERP for growing operations",
    subtitle:
      "UabIndia ERP brings HR, payroll, finance, procurement, inventory, service, and reporting into one disciplined operating system.",
    primaryCtaLabel: "Book a Demo",
    secondaryCtaLabel: "Explore Modules",
    badges: ["HRMS", "Payroll", "Finance", "Inventory", "Procurement", "CRM"],
  });

  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: profile.brandName,
      url: publicSiteUrl,
      email: profile.supportEmail,
      telephone: profile.supportPhone,
      description: "UabIndia ERP is a cloud ERP platform for HR, payroll, attendance, finance, procurement, inventory, CRM, projects, assets, compliance, and operations.",
    },
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: profile.brandName,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      url: publicSiteUrl,
      description: "One cloud ERP platform for HRMS, payroll, finance, procurement, inventory, CRM, projects, help desk, and reporting.",
    },
  ];

  const liveHeroMetrics = siteData?.heroMetrics?.length ? siteData.heroMetrics : heroMetrics;
  const trustMarks =
    trustedOrganizations.length > 0
      ? trustedOrganizations
      : [
          { name: "Healthcare Ops", sector: "Shift-heavy teams", mark: "HC" },
          { name: "Manufacturing", sector: "Plant control", mark: "MF" },
          { name: "Retail Groups", sector: "Multi-branch ops", mark: "RT" },
          { name: "Logistics", sector: "Field movement", mark: "LG" },
          { name: "Services", sector: "Delivery teams", mark: "SV" },
          { name: "Public Programs", sector: "Governance-led", mark: "PG" },
        ];

  const whyPoints = [
    {
      title: "Operational control",
      body: "Connect approvals, records, and reporting across HR, payroll, procurement, finance, inventory, and support.",
    },
    {
      title: "Implementation clarity",
      body: "Roll out by module or business unit with a cleaner product language, clearer ownership, and less training overhead.",
    },
    {
      title: "Governed scale",
      body: "Support multi-branch and multi-entity growth without rebuilding the shell, navigation, or approval model every time.",
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

      {/* ── Hero ──────────────────────────────────────────────────── */}
      <MarketingHero
        eyebrow={content.eyebrow}
        title={
          <>
            One Platform.{" "}
            <span className="pub-gradient-text">All Your Business.</span>
          </>
        }
        subtitle={content.subtitle}
        badges={content.badges}
        metrics={liveHeroMetrics}
        trustSignals={["Role-based access", "Approval workflows", "Cross-module reporting"]}
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

      {/* ── Trust ribbon ──────────────────────────────────────────── */}
      <TrustRibbon items={trustMarks} />

      {/* ── Why it matters ────────────────────────────────────────── */}
      <section className="py-14 lg:py-20">
        <div className={cn(publicSectionClassName, "grid gap-5 xl:grid-cols-3")}>
          {whyPoints.map((item, index) => (
            <MotionReveal key={item.title} delay={index * 0.07}>
              <article className={cn(publicPanelHoverClassName, "h-full p-7")}>
                <div className={publicEyebrowClassName}>
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-600" />
                  Why it matters
                </div>
                <h2 className="mt-4 text-xl font-bold tracking-tight text-slate-900">{item.title}</h2>
                <p className="mt-2.5 text-sm leading-7 text-slate-500">{item.body}</p>
              </article>
            </MotionReveal>
          ))}
        </div>
      </section>

      {/* ── Platform Capabilities section ──────────────────────────── */}
      <section className="bg-slate-50 py-14 lg:py-20">
        <div className={cn(publicSectionClassName, "grid gap-6 xl:grid-cols-[1.1fr_0.9fr]")}>
          <MotionReveal>
            <article className={cn(publicPanelClassName, "p-7 sm:p-9")}>
              <div className={publicEyebrowClassName}>
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-600" />
                Platform capabilities
              </div>
              <h2 className="mt-4 text-[clamp(1.5rem,2.4vw,2.1rem)] font-bold tracking-tight text-slate-900">
                One connected system for every business function.
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-500">
                UabIndia ERP unifies HR, payroll, procurement, finance, and compliance into a single operating model — removing the cost and risk of disconnected point solutions.
              </p>
              <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
                {[
                  "Role-aware navigation and approval flows",
                  "Module-by-module rollout with no rework",
                  "People, finance, and operations on one data core",
                  "Shared reporting across all business functions",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-2.5 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    {item}
                  </div>
                ))}
              </div>
            </article>
          </MotionReveal>

          <MotionReveal delay={0.07}>
            <article className={cn(publicPanelClassName, "h-full p-7 sm:p-9")}>
              <div className={publicEyebrowClassName}>
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-600" />
                At a glance
              </div>
              <div className="mt-5 space-y-3">
                {[
                  "Multi-role support with a single, consistent workspace experience.",
                  "Payroll, finance, procurement, and approvals sharing the same data core.",
                  "Start with one module — expand to full ERP without redesigning anything.",
                  "Leadership dashboards aggregating operational, financial, and people signals.",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3.5 text-sm leading-6 text-slate-600">
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-indigo-400" />
                    {item}
                  </div>
                ))}
              </div>
            </article>
          </MotionReveal>
        </div>
      </section>

      {/* ── Module grid ───────────────────────────────────────────── */}
      <ModuleGrid
        modules={marketingModules.slice(0, 8)}
        eyebrow="Our products"
        title="Powerful modules built to streamline every aspect of your business."
        subtitle="Choose the modules that fit your rollout today, then expand into a wider connected ERP stack as operations mature."
      />

      {/* ── Industry grid ─────────────────────────────────────────── */}
      <IndustryGrid
        industries={marketingIndustries.slice(0, 6)}
        eyebrow="Industries we serve"
        title="Tailored ERP solutions for every industry."
        subtitle="The same product language can be configured for healthcare, manufacturing, education, logistics, retail, and project-led teams."
      />

      {/* ── Resources ─────────────────────────────────────────────── */}
      <ResourceGrid resources={resources.slice(0, 3)} />

      {/* ── CTA ───────────────────────────────────────────────────── */}
      <CtaPanel
        eyebrow="Next step"
        title="Review the right product mix before your rollout grows more complex."
        body="Book a focused walkthrough and we will map the modules, workflows, and business priorities that matter first."
        primaryLabel="Book a Demo"
        primaryHref={withPublicAudience("/book-demo", "platform")}
        secondaryLabel="Contact Sales"
        secondaryHref={withPublicAudience("/contact", "platform")}
      />
    </PlatformPublicPageShell>
  );
}
