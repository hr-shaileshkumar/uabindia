"use client";

import Link from "next/link";
import { CircleCheckBig, LifeBuoy, UsersRound, WalletCards } from "lucide-react";
import { MarketingHero } from "@/components/public/PublicMarketingBlocks";
import PublicAudiencePageFrame from "@/components/public/PublicAudiencePageFrame";
import { PublicPageLoading } from "@/components/public/PublicPageLoading";
import {
  publicButtonClassName,
  publicPanelClassName,
  publicSectionClassName,
  publicSectionSpacingClassName,
} from "@/components/public/publicStyles";
import { usePublicPageData } from "@/hooks/usePublicPageData";
import { withPublicAudience } from "@/lib/public-audience";

type HomeContent = {
  eyebrow: string;
  title: string;
  subtitle: string;
  primaryCtaLabel: string;
  secondaryCtaLabel: string;
  trustPills: string[];
};

export default function TenantHomePage() {
  const {
    profile,
    headerContent,
    footerContent,
    allowedPaths,
    parseContent,
    loading,
    isTenantContext,
    pageVisible,
  } = usePublicPageData("home", "tenant");

  const content = parseContent<HomeContent>({
    eyebrow: profile.brandName || profile.companyName,
    title: profile.heroTitle || `${profile.companyName} workspace`,
    subtitle:
      profile.heroSubtitle ||
      "Secure login, employee self-service, support, and company updates in one place.",
    primaryCtaLabel: "Sign in",
    secondaryCtaLabel: "Contact support",
    trustPills: ["Employee access", "Support desk", "Secure login"],
  });

  if (isTenantContext && loading) {
    return <PublicPageLoading label="Loading..." sublabel="Preparing your company workspace" />;
  }

  return (
    <PublicAudiencePageFrame
      audience="tenant"
      profile={profile}
      headerContent={headerContent}
      footerContent={footerContent}
      allowedPaths={allowedPaths}
      pageVisible={pageVisible}
    >
      <MarketingHero
        eyebrow={content.eyebrow}
        title={content.title}
        subtitle={content.subtitle}
        badges={content.trustPills}
        showPreview={false}
        trustSignals={["Secure employee login", "Self-service access", "Company support"]}
        actions={
          <>
            <Link href={withPublicAudience("/login", "tenant")} className={publicButtonClassName.primary}>
              {content.primaryCtaLabel}
            </Link>
            <Link href={withPublicAudience("/contact", "tenant")} className={publicButtonClassName.secondary}>
              {content.secondaryCtaLabel}
            </Link>
          </>
        }
      />

      <section className={publicSectionSpacingClassName}>
        <div className={`${publicSectionClassName} grid gap-4 sm:grid-cols-2 lg:grid-cols-4`}>
          {[
            {
              icon: UsersRound,
              title: "Employee self-service",
              description: "Login, password recovery, and daily actions from one URL.",
            },
            {
              icon: WalletCards,
              title: "Payroll access",
              description: "People records, attendance, and payroll aligned in one workspace.",
            },
            {
              icon: LifeBuoy,
              title: "Support desk",
              description: "A clear route to help without exposing internal tools.",
            },
            {
              icon: CircleCheckBig,
              title: "Company presence",
              description: "Careers, about, contact, and login in one consistent experience.",
            },
          ].map((item) => (
            <article key={item.title} className={publicPanelClassName}>
              <item.icon className="h-5 w-5 text-slate-700" />
              <h2 className="mt-3 text-base font-semibold text-slate-900">{item.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={`${publicSectionSpacingClassName} bg-slate-50`}>
        <div className={`${publicSectionClassName} grid gap-4 lg:grid-cols-2`}>
          <div className={publicPanelClassName}>
            <h2 className="text-lg font-semibold text-slate-900">What you can do</h2>
            <ul className="mt-4 space-y-2.5">
              {[
                "View and download payslips",
                "Apply for leave and track approvals",
                "Read company announcements",
                "Raise and track support requests",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-slate-700">
                  <CircleCheckBig className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className={publicPanelClassName}>
            <h2 className="text-lg font-semibold text-slate-900">Sign in to continue</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Use your company email and password. Contact HR if you need access provisioned.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href={withPublicAudience("/login", "tenant")} className={publicButtonClassName.primary}>
                Sign in
              </Link>
              <Link href={withPublicAudience("/contact", "tenant")} className={publicButtonClassName.secondary}>
                Contact support
              </Link>
            </div>
          </div>
        </div>
      </section>
    </PublicAudiencePageFrame>
  );
}
