"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Boxes,
  Users,
  Receipt,
  Building2,
  Package,
  Layers,
  ArrowRight,
  ShieldCheck,
  Zap,
  Globe2,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { PlatformPublicPageShell, usePlatformPublicPage } from "./PlatformPageShell";
import {
  publicButtonClassName,
  publicGradientTextClassName,
  publicPanelClassName,
  publicPanelHoverClassName,
  publicSectionClassName,
} from "@/components/public/publicStyles";
import { marketingModules, type MarketingModule } from "@/lib/public-marketing";
import { publicApi } from "@/services/publicApi";
import { withPublicAudience } from "@/lib/public-audience";
import { cn } from "@/lib/utils";

const ICON_MAP: Record<string, React.ElementType> = {
  Users,
  Receipt,
  Building2,
  Package,
  Layers,
  Boxes,
  ShieldCheck,
  Zap,
  Globe2,
};

export default function PlatformModulesPage() {
  const { profile, headerContent, footerContent, allowedPaths, pageVisible } =
    usePlatformPublicPage("platform-products");

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

  const displayedModules = dbModules.length > 0 ? dbModules : marketingModules;

  return (
    <PlatformPublicPageShell
      loading={false}
      profile={profile}
      headerContent={headerContent}
      footerContent={footerContent}
      allowedPaths={allowedPaths}
      pageVisible={pageVisible}
    >
      <div className={cn(publicSectionClassName, "pt-4 pb-12 sm:pt-6 sm:pb-16")}>
        {/* Header Breadcrumb & Title */}
        <div className="border-b border-slate-200/80 pb-6 dark:border-slate-800">
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-cyan-400">
            <Boxes className="h-4 w-4" />
            <span className="uppercase tracking-wider">UabIndia Cloud Suite</span>
          </div>
          <h1 className="mt-2 text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white">
            Comprehensive <span className={publicGradientTextClassName}>Enterprise Modules</span>
          </h1>
          <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-3xl leading-relaxed">
            Every module is natively integrated with multi-currency double-entry ledgers, automated cross-border tax compliance, and fine-grained role-based security.
          </p>
        </div>

        {/* Modules Grid */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedModules.map((mod) => {
            const IconComponent = ICON_MAP[mod.icon] || Boxes;
            return (
              <div
                key={mod.slug}
                className={cn(
                  publicPanelHoverClassName,
                  "flex flex-col justify-between group"
                )}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-cyan-400 group-hover:scale-105 transition-transform">
                      <IconComponent className="h-5 w-5" />
                    </div>
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      {mod.category}
                    </span>
                  </div>

                  <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                    {mod.title}
                  </h3>
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {mod.description || mod.summary}
                  </p>

                  {mod.highlights && mod.highlights.length > 0 && (
                    <div className="mt-4 space-y-1.5 border-t border-slate-100 dark:border-slate-800 pt-3">
                      {mod.highlights.slice(0, 3).map((h, i) => (
                        <div key={i} className="flex items-center gap-2 text-[11px] text-slate-600 dark:text-slate-300">
                          <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
                          <span className="truncate">{h}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-4">
                  <span className="text-xs font-semibold text-slate-400">Phase Ready</span>
                  <Link
                    href={withPublicAudience("/contact?type=demo", "platform")}
                    className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-cyan-400"
                  >
                    <span>Request Demo</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* Global SaaS Platform Architecture Box */}
        <div className="mt-12 rounded-3xl border border-blue-200/90 bg-gradient-to-br from-blue-50/60 via-white to-indigo-50/60 p-8 dark:border-blue-900/60 dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-900 dark:to-blue-950/40">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-800 dark:bg-blue-900/60 dark:text-blue-300">
                <Sparkles className="h-3.5 w-3.5" />
                ENTERPRISE SCALABILITY
              </span>
              <h2 className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">
                Deploy modularly. Expand seamlessly.
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Start with Core HRMS and Payroll, then turn on Cross-Border Billing, Manufacturing, Supply Chain, and Banking APIs when your organization is ready.
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-3">
              <Link href={withPublicAudience("/pricing", "platform")} className={publicButtonClassName.secondary}>
                Explore Pricing
              </Link>
              <Link href={withPublicAudience("/contact?type=demo", "platform")} className={publicButtonClassName.primary}>
                Schedule Live Demo
              </Link>
            </div>
          </div>
        </div>
      </div>
    </PlatformPublicPageShell>
  );
}
