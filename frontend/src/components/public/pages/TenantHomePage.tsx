"use client";

import Link from "next/link";
import { CircleCheckBig, LifeBuoy, UsersRound, WalletCards } from "lucide-react";
import {
  PublicActionBand,
  PublicCardGrid,
  PublicChecklistPanel,
} from "@/components/public/PublicContentBlocks";
import PublicAudiencePageFrame from "@/components/public/PublicAudiencePageFrame";
import PublicHeroSection from "@/components/public/PublicHeroSection";
import { PublicPageLoading } from "@/components/public/PublicPageLoading";
import { publicButtonClassName, publicSectionClassName } from "@/components/public/publicStyles";
import { usePublicPageData } from "@/hooks/usePublicPageData";
import { withPublicAudience } from "@/lib/public-audience";

type HomeContent = {
  eyebrow: string;
  title: string;
  subtitle: string;
  primaryCtaLabel: string;
  secondaryCtaLabel: string;
  trustPills: string[];
  testimonial: string;
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
    testimonial:
      "Keep your public company surface simple: login, contact, careers, and trusted company information.",
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

      <section className="pb-16 sm:pb-20">
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

      <section className="pb-16 sm:pb-20">
        <div className={`${publicSectionClassName} grid gap-6 xl:grid-cols-[0.95fr_1.05fr]`}>
          <PublicChecklistPanel
            eyebrow="What this page is for"
            title="Keep public access narrow and useful."
            description="A good company home should help people find the right workspace path quickly."
            items={[
              "Guide users into the tenant workspace through the correct company domain.",
              "Share company profile, contact details, and open hiring positions.",
              "Avoid exposing platform-only admin or owner controls on public pages.",
            ]}
            tone="panel"
          />

          <PublicActionBand
            eyebrow="Operator note"
            title="Professional public pages build trust before login."
            description={content.testimonial}
            actions={
              <>
                <Link href={withPublicAudience("/login", "tenant")} className={publicButtonClassName.primary}>
                  Login
                </Link>
                <Link href={withPublicAudience("/contact", "tenant")} className={publicButtonClassName.secondary}>
                  Contact support
                </Link>
              </>
            }
          />
        </div>
      </section>
    </PublicAudiencePageFrame>
  );
}
