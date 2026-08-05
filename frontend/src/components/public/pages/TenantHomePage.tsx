"use client";

import Link from "next/link";
import { CircleCheckBig, LifeBuoy, UsersRound, WalletCards } from "lucide-react";
import { PublicCardGrid } from "@/components/public/PublicContentBlocks";

import PublicAudiencePageFrame from "@/components/public/PublicAudiencePageFrame";
import PublicHeroSection from "@/components/public/PublicHeroSection";
import { PublicPageLoading } from "@/components/public/PublicPageLoading";
import {
  publicButtonClassName,
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
    eyebrow: `Welcome to ${profile.brandName}`,
    title: profile.heroTitle || `${profile.companyName} workspace`,
    subtitle:
      profile.heroSubtitle ||
      "A clean company front door for employee access, support, and operational updates.",
    primaryCtaLabel: "Login",
    secondaryCtaLabel: "Contact support",
    trustPills: ["Employee access", "Support desk", "Company updates", "Secure login"],
  });


  if (isTenantContext && loading) {
    return <PublicPageLoading label="Loading company profile from database..." />;
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
      <PublicHeroSection
        eyebrow={content.eyebrow}
        title={content.title}
        subtitle={content.subtitle}
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
        badges={content.trustPills}
        panelLabel="Company overview"
        metrics={[
          { label: "Industry", value: profile.industry },
          { label: "Support", value: profile.supportTier },
          { label: "Headquarters", value: profile.headquarters },
          { label: "Partner", value: profile.implementationPartner || profile.brandName },
        ]}
        metricColumns="two"
      />

      <section className={publicSectionSpacingClassName}>
        <div className={publicSectionClassName}>
          <PublicCardGrid
            columns="four"
            items={[
              {
                icon: <UsersRound className="h-5 w-5" />,
                title: "Employee self service",
                description: "A simple entry point for login, password recovery, and daily employee actions.",
              },
              {
                icon: <WalletCards className="h-5 w-5" />,
                title: "Payroll-ready operations",
                description: "Keep people records, attendance, and payroll access aligned with one workspace URL.",
              },
              {
                icon: <LifeBuoy className="h-5 w-5" />,
                title: "Support and contact",
                description: "Give employees and admins a clear route to help without exposing internal tools.",
              },
              {
                icon: <CircleCheckBig className="h-5 w-5" />,
                title: "Trusted company presence",
                description: "Present careers, about, contact, and login pages in one consistent SaaS style.",
              },
            ]}
          />
        </div>
      </section>

      <section className={publicSectionSpacingClassName}>
        <div className={`${publicSectionClassName} grid gap-6 xl:grid-cols-2`}>
          <div className="rounded-[24px] border border-slate-200 bg-white p-7 sm:p-9 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">Employee access</p>
            <h2 className="mt-4 text-xl font-bold tracking-tight text-slate-900">
              Everything your team needs, in one place.
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-500">
              Access payroll records, apply for leave, raise support tickets, and stay updated — all from your company workspace without needing to contact HR directly.
            </p>
            <ul className="mt-5 space-y-2.5">
              {[
                "View and download payslips anytime",
                "Apply for leave and track approval status",
                "Access company announcements and updates",
                "Raise and track support requests",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-slate-700">
                  <CircleCheckBig className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-gradient-to-br from-indigo-50 to-white p-7 sm:p-9 shadow-sm flex flex-col justify-between gap-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">Quick access</p>
              <h2 className="mt-4 text-xl font-bold tracking-tight text-slate-900">
                Sign in to your workspace.
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-500">
                Use your company email and password to access your personal workspace dashboard. Contact your HR admin if you need access or have login issues.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
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

