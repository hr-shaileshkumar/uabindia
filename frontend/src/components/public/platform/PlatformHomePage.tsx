"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import {
  CtaPanel,
  FaqAccordion,
  MarketingHero,
  ModuleGrid,
  OfficeLocatorBlock,
  TestimonialGrid,
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
  marketingModules,
  publicSiteUrl,
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
    eyebrow: "Next-Gen Global Cloud ERP & HRMS",
    title: "Run HR, payroll, finance, and global operations in one unified system",
    subtitle:
      "A sovereign, multi-currency enterprise platform built for modern global organizations and high-growth businesses — phased module rollout, multi-jurisdiction compliance, and audit-ready workflows.",
    primaryCtaLabel: "Start 14-Day Free Trial",
    secondaryCtaLabel: "Request a Demo",
    badges: ["Global HRMS", "Multi-Currency Payroll", "Finance & Tax", "Supply Chain", "Procurement", "Enterprise CRM"],
  });

  const displayedModules = dbModules.length > 0 ? dbModules.slice(0, 8) : marketingModules.slice(0, 8);

  const fallbackTrustMarks = [
    { name: "Global Tax & E-Invoicing", sector: "Cross-Border PEPPOL & Regional VAT/GST", mark: "TAX" },
    { name: "SWIFT, SEPA & Connected Banking", sector: "Corporate Multi-Currency APIs", mark: "FX" },
    { name: "Global Sovereign Cloud", sector: "Multi-Region Tier-IV Data Sovereignty", mark: "CLD" },
    { name: "ISO 27001 & SOC 2 Type II", sector: "Bank-Grade 256-Bit TLS Security", mark: "SEC" },
  ];

  const trustMarks = (siteData?.industryCoverage ?? []).length > 0
    ? (siteData?.industryCoverage ?? []).map((item: { name: string; sector: string; mark: string }) => ({
        name: item.name,
        sector: item.sector,
        mark: item.mark,
      }))
    : fallbackTrustMarks;

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
            <Link href={withPublicAudience("/register", "platform")} className={publicButtonClassName.primary}>
              {content.primaryCtaLabel}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href={withPublicAudience("/contact?type=demo", "platform")} className={publicButtonClassName.secondary}>
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
              <Link href={withPublicAudience("/register", "platform")} className={publicButtonClassName.primary}>
                Start Free Trial
              </Link>
              <Link href={withPublicAudience("/contact?type=demo", "platform")} className={publicButtonClassName.secondary}>
                Schedule a Demo
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

      <TestimonialGrid
        testimonials={[
          {
            name: "Rajesh Malhotra",
            role: "Chief Operating Officer",
            company: "Apex Logistics India",
            quote: "Migrating our multi-location branches to UabIndia ERP cut our month-end payroll and dispatch cycle from 4 days to 45 minutes.",
            rating: 5,
          },
          {
            name: "Pooja Sundaram",
            role: "VP of Human Capital",
            company: "NextGen Mobility Corp",
            quote: "The employee self-service portal and biometric punch sync reduced attendance disputes by over 90%. Our HR team saved 20+ hours every week.",
            rating: 5,
          },
          {
            name: "Vikram Singhal",
            role: "Chief Financial Officer",
            company: "Bharat Infra Engineering",
            quote: "Having automated GST e-invoicing, TDS deductions, and vendor PO matching in one unified database eliminated all audit reconciliation headaches.",
            rating: 5,
          },
        ]}
      />

      <FaqAccordion
        items={[
          {
            question: "How does multi-tenant data sovereignty work in UabIndia ERP?",
            answer: "Each tenant workspace runs isolated schema partitioning with dedicated encryption keys and ISO-27001 audit logging. Your enterprise data is sovereign and strictly separated.",
            category: "Security",
          },
          {
            question: "Can we integrate biometric attendance hardware directly?",
            answer: "Yes, our attendance engine connects with Essl, ZKTeco, and biometric push APIs with real-time punch synchronization across multiple branch offices and plants.",
            category: "HRMS",
          },
          {
            question: "Are Indian statutory PF, ESIC, and TDS tax rules pre-configured?",
            answer: "Yes, all current EPFO wage ceilings (₹15,000), ESIC gross ceilings (₹21,000), Professional Tax by state, and Form 16 / TDS regimes are built-in and auto-updated.",
            category: "Payroll",
          },
          {
            question: "Can we publish a public B2B product catalog with Request for Quotation (RFQ)?",
            answer: "Yes, every tenant can enable a live B2B product storefront with real-time stock levels, category filters, and an interactive RFQ Drawer that drops quotation leads directly into the ERP CRM pipeline.",
            category: "Commerce",
          },
        ]}
      />

      <OfficeLocatorBlock
        title="Our Operating Hubs & Branch Presence"
        eyebrow="NATIONWIDE ACCESSIBILITY"
        subtitle="Visit our corporate headquarters, cloud engineering centers, or state-level implementation offices."
        locations={[
          {
            id: "loc-mumbai",
            name: "Corporate Headquarters (HQ Mumbai)",
            type: "Headquarters",
            city: "Mumbai, Maharashtra",
            address: "Level 14, Tower 2, One World Center, Lower Parel, Mumbai, Maharashtra 400013",
            phone: "+91 7903055384",
            email: "hq@uabindia.in",
            workingHours: "Mon - Sat: 09:30 AM – 06:30 PM IST",
            mapEmbedUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3771.954203175114!2d72.82772597597148!3d19.00632598218442!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3be7ce886851f50b%3A0xe54fb725efbc6f40!2sOne%20World%20Center!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin",
            directionsUrl: "https://maps.google.com/?q=One+World+Center+Lower+Parel+Mumbai",
          },
          {
            id: "loc-delhi",
            name: "Northern Region Implementation Center",
            type: "Branch Office",
            city: "New Delhi, NCR",
            address: "Statesman House, Barakhamba Road, Connaught Place, New Delhi, Delhi 110001",
            phone: "+91 11 4982 3400",
            email: "delhi@uabindia.in",
            workingHours: "Mon - Fri: 09:30 AM – 06:00 PM IST",
            mapEmbedUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3501.9967733475716!2d77.22359417627442!3d28.630048375665384!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390cfd369c0d1645%3A0xb3e1c6b1a37c9f5!2sStatesman%20House!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin",
            directionsUrl: "https://maps.google.com/?q=Statesman+House+Connaught+Place+New+Delhi",
          },
          {
            id: "loc-bengaluru",
            name: "Cloud Engineering & AI R&D Center",
            type: "Branch Office",
            city: "Bengaluru, Karnataka",
            address: "Prestige Tech Park, Marathahalli - Sarjapur Outer Ring Rd, Kadubeesanahalli, Bengaluru 560103",
            phone: "+91 80 6120 7800",
            email: "tech@uabindia.in",
            workingHours: "Mon - Fri: 10:00 AM – 07:00 PM IST",
            mapEmbedUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3888.7562846939943!2d77.6923483758364!3d12.923388787387442!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bae13a43fa4e1b7%3A0xb17332f195dfb824!2sPrestige%20Tech%20Park!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin",
            directionsUrl: "https://maps.google.com/?q=Prestige+Tech+Park+Bengaluru",
          },
        ]}
      />

      <CtaPanel
        title="Ready to transform your enterprise operations?"
        description="Launch an instant free 14-day trial workspace or schedule a personalized walkthrough with our team."
        primaryLabel="Start 14-Day Free Trial"
        primaryHref={withPublicAudience("/register", "platform")}
        secondaryLabel="Schedule a Demo"
        secondaryHref={withPublicAudience("/contact?type=demo", "platform")}
      />
    </PlatformPublicPageShell>
  );
}
