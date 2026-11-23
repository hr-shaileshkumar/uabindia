"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Sparkles, PhoneCall, Mail, MapPinned, Clock3, ShieldCheck, Building2 } from "lucide-react";
import { DemoAgendaPanel, SupportLaneGrid } from "@/components/public/PublicMarketingBlocks";
import { PlatformPublicPageShell, usePlatformPublicPage } from "./PlatformPageShell";
import PublicStructuredData from "@/components/public/PublicStructuredData";
import {
  publicEyebrowClassName,
  publicGradientTextClassName,
  publicPanelClassName,
  publicSectionClassName,
} from "@/components/public/publicStyles";
import { ContactDemoForm } from "@/components/workspace/contact-demo-form";
import { supportLanes, publicSiteUrl, demoAgenda } from "@/lib/public-marketing";
import { cn } from "@/lib/utils";

export default function PlatformContactPage() {
  const searchParams = useSearchParams();
  const isDemo = searchParams.get("type") === "demo" || searchParams.get("demo") === "true";

  const { profile, headerContent, footerContent, allowedPaths, pageVisible } =
    usePlatformPublicPage("platform-contact");

  const eyebrow = isDemo ? "Product Walkthrough" : "Enterprise Sales & Advisory";
  const title = isDemo ? "Schedule a 1-on-1 Enterprise Demo" : "Connect with UabIndia Enterprise Architects";
  const subtitle = isDemo
    ? "Experience tailored workflows for global payroll, GST/VAT e-invoicing, connected banking, and manufacturing with our platform experts."
    : "Discuss private cloud deployments, multi-country entity structures, volume pricing, or migration from SAP / NetSuite.";

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
          "@type": "ContactPage",
          name: `${title} | UabIndia Enterprise`,
          url: `${publicSiteUrl}/contact`,
          description: subtitle,
        }}
      />

      <div className={cn(publicSectionClassName, "pt-4 pb-12 sm:pt-6 sm:pb-16")}>
        {/* Header Breadcrumb & Title */}
        <div className="border-b border-slate-200/80 pb-6 dark:border-slate-800">
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-cyan-400">
            <Sparkles className="h-4 w-4" />
            <span className="uppercase tracking-wider">{eyebrow}</span>
          </div>
          <h1 className="mt-2 text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white">
            {isDemo ? (
              <span>Schedule a <span className={publicGradientTextClassName}>1-on-1 Enterprise Demo</span></span>
            ) : (
              <span>Connect with <span className={publicGradientTextClassName}>Enterprise Architects</span></span>
            )}
          </h1>
          <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-3xl leading-relaxed">
            {subtitle}
          </p>
        </div>

        {/* 2-Column Demo Agenda / Info & Form */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-5 space-y-6">
            {isDemo ? (
              <DemoAgendaPanel items={demoAgenda} />
            ) : (
              <div className="space-y-4">
                <div className={publicPanelClassName}>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-cyan-400 mb-4 flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    <span>Corporate Headquarters</span>
                  </h3>
                  <div className="space-y-4 text-sm">
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/80 dark:text-cyan-400 border border-blue-100 dark:border-blue-900/60 shadow-2xs">
                        <MapPinned className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Global HQ</span>
                        <p className="mt-0.5 font-semibold text-slate-800 dark:text-slate-100">Cyber City, Gurugram, NCR Delhi, India</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/80 dark:text-cyan-400 border border-blue-100 dark:border-blue-900/60 shadow-2xs">
                        <PhoneCall className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Enterprise Hotline</span>
                        <p className="mt-0.5 font-semibold text-slate-800 dark:text-slate-100">+91 (124) 490-8800</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/80 dark:text-cyan-400 border border-blue-100 dark:border-blue-900/60 shadow-2xs">
                        <Mail className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Sales Advisory</span>
                        <p className="mt-0.5 font-semibold text-slate-800 dark:text-slate-100">enterprise@uabindia.in</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/80 dark:text-cyan-400 border border-blue-100 dark:border-blue-900/60 shadow-2xs">
                        <Clock3 className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Response SLA</span>
                        <p className="mt-0.5 font-semibold text-slate-800 dark:text-slate-100">Guaranteed within 4 business hours</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-emerald-300/80 bg-emerald-50/80 p-5 dark:border-emerald-800/80 dark:bg-emerald-950/50 shadow-xs">
                  <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 text-xs font-bold uppercase tracking-wider">
                    <ShieldCheck className="h-4.5 w-4.5" />
                    <span>NDA & Security Assurance</span>
                  </div>
                  <p className="mt-2 text-sm text-emerald-950 dark:text-emerald-200 leading-relaxed font-normal">
                    All architectural inquiries, data volume discussions, and current system assessments are covered under mutual enterprise non-disclosure.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-7">
            <div className={publicPanelClassName}>
              <ContactDemoForm audience="platform" variant="public" />
            </div>
          </div>
        </div>

        {/* Support Lanes */}
        <div className="mt-14">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Dedicated Assistance Lanes</h2>
          <SupportLaneGrid items={[...supportLanes]} />
        </div>
      </div>
    </PlatformPublicPageShell>
  );
}
