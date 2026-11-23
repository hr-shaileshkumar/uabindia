"use client";

import Link from "next/link";
import { Globe2, ShieldCheck, Server, Award, Sparkles, Building2, CheckCircle2 } from "lucide-react";
import { PlatformPublicPageShell, usePlatformPublicPage } from "@/components/public/pages/PublicPageShell";
import PublicStructuredData from "@/components/public/PublicStructuredData";
import {
  publicButtonClassName,
  publicGradientTextClassName,
  publicPanelClassName,
  publicSectionClassName,
} from "@/components/public/publicStyles";
import { publicSiteUrl } from "@/lib/public-marketing";
import { withPublicAudience } from "@/lib/public-audience";
import { cn } from "@/lib/utils";

export default function PlatformAboutPage() {
  const { profile, headerContent, footerContent, allowedPaths, pageVisible } =
    usePlatformPublicPage("platform-about");

  const pillars = [
    {
      icon: Globe2,
      title: "Global Multi-Currency Ledgers",
      description: "Sub-millisecond double-entry ledger architecture with real-time FX conversions and multi-jurisdiction compliance.",
    },
    {
      icon: ShieldCheck,
      title: "Statutory & Tax Sovereignty",
      description: "Automated GST/VAT returns, PEPPOL international e-invoicing, TDS calculation, and localized payroll engines.",
    },
    {
      icon: Server,
      title: "Tier-IV Multi-Region Isolation",
      description: "Row-level tenant security, dedicated schema options, bank-grade encryption at rest and in transit (TLS 1.3).",
    },
    {
      icon: Award,
      title: "Audited & Enterprise Certified",
      description: "ISO 27001, SOC 2 Type II compliant controls, role-based governance, and immutable audit logs for every ledger post.",
    },
  ];

  return (
    <PlatformPublicPageShell
      loading={false}
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
          name: "About UabIndia Global Cloud ERP",
          url: `${publicSiteUrl}/about`,
          description: "Sovereign multi-currency cloud enterprise operating system for modern business operations.",
        }}
      />

      <div className={cn(publicSectionClassName, "pt-4 pb-12 sm:pt-6 sm:pb-16")}>
        {/* Header Breadcrumb & Title */}
        <div className="border-b border-slate-200/80 pb-6 dark:border-slate-800">
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-cyan-400">
            <Globe2 className="h-4 w-4" />
            <span className="uppercase tracking-wider">About UabIndia Platform</span>
          </div>
          <h1 className="mt-2 text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white">
            Pioneering the Sovereign <span className={publicGradientTextClassName}>Enterprise Cloud</span>
          </h1>
          <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-3xl leading-relaxed">
            UabIndia was architected from the ground up to replace fragmented legacy ERPs with a unified, high-performance operating system for finance, global payroll, tax, supply chain, and workforce orchestration.
          </p>
        </div>

        {/* Pillars Grid */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
          {pillars.map((p, idx) => (
            <div key={idx} className={cn(publicPanelClassName, "p-6")}>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-cyan-400 mb-4">
                <p.icon className="h-5 w-5" />
              </div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">{p.title}</h2>
              <p className="mt-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{p.description}</p>
            </div>
          ))}
        </div>

        {/* Platform Milestones & Trust Banner */}
        <div className="mt-12 rounded-3xl bg-slate-900 text-white p-8 dark:bg-slate-900/90 border border-slate-800">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
            <div>
              <p className="text-3xl sm:text-4xl font-black text-blue-400">99.99%</p>
              <p className="mt-1 text-xs text-slate-400 uppercase font-semibold">Uptime SLA</p>
            </div>
            <div>
              <p className="text-3xl sm:text-4xl font-black text-cyan-400">120+</p>
              <p className="mt-1 text-xs text-slate-400 uppercase font-semibold">Currencies Handled</p>
            </div>
            <div>
              <p className="text-3xl sm:text-4xl font-black text-emerald-400">&lt;50ms</p>
              <p className="mt-1 text-xs text-slate-400 uppercase font-semibold">API Latency</p>
            </div>
            <div>
              <p className="text-3xl sm:text-4xl font-black text-purple-400">100%</p>
              <p className="mt-1 text-xs text-slate-400 uppercase font-semibold">Tax Audit Proof</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Ready to modernize your enterprise stack?</h3>
            <p className="text-xs text-slate-500">Consult with our enterprise architects on migration and private deployments.</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href={withPublicAudience("/pricing", "platform")} className={publicButtonClassName.secondary}>
              View Pricing
            </Link>
            <Link href={withPublicAudience("/contact?type=demo", "platform")} className={publicButtonClassName.primary}>
              Book Live Demo
            </Link>
          </div>
        </div>
      </div>
    </PlatformPublicPageShell>
  );
}
