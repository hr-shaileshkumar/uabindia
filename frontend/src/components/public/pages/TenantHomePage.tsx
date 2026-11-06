"use client";

import Link from "next/link";
import { CircleCheckBig, LifeBuoy, UsersRound, WalletCards, ShieldCheck, ArrowRight, BellRing } from "lucide-react";
import { MarketingHero } from "@/components/public/PublicMarketingBlocks";
import PublicAudiencePageFrame from "@/components/public/PublicAudiencePageFrame";
import { PublicPageLoading } from "@/components/public/PublicPageLoading";
import {
  publicButtonClassName,
  publicPanelClassName,
  publicPanelHoverClassName,
  publicSectionClassName,
  publicSectionSpacingClassName,
} from "@/components/public/publicStyles";
import { usePublicPageData } from "@/hooks/usePublicPageData";
import { withPublicAudience } from "@/lib/public-audience";

export type HomeContent = {
  eyebrow: string;
  title: string;
  subtitle: string;
  primaryCtaLabel: string;
  primaryCtaHref?: string;
  secondaryCtaLabel: string;
  secondaryCtaHref?: string;
  trustPills: string[];
  announcement?: {
    enabled: boolean;
    text: string;
    type?: "info" | "alert" | "success";
  };
  showQuickAccess?: boolean;
  quickAccess?: Array<{
    title: string;
    description: string;
    icon?: string;
    href?: string;
  }>;
  showHighlights?: boolean;
  highlights?: string[];
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

  const companyDisplayName = profile.brandName || profile.companyName || "Company";

  const content = parseContent<HomeContent>({
    eyebrow: companyDisplayName,
    title: profile.heroTitle || `${companyDisplayName} Workspace`,
    subtitle:
      profile.heroSubtitle ||
      "Secure login, employee self-service, payroll access, support, and corporate updates in one place.",
    primaryCtaLabel: "Sign in",
    primaryCtaHref: "/login",
    secondaryCtaLabel: "Contact support",
    secondaryCtaHref: "/contact",
    trustPills: ["Employee Access", "Self-Service HR", "Secure Login"],
    announcement: {
      enabled: false,
      text: "",
      type: "info",
    },
    showQuickAccess: true,
    quickAccess: [
      {
        title: "Employee self-service",
        description: "Login, mark attendance, request leaves, and review daily updates.",
        href: "/login",
      },
      {
        title: "Payroll & compensation",
        description: "View monthly payslips, tax calculations, and compensation structure.",
        href: "/login",
      },
      {
        title: "Helpdesk & support",
        description: "Raise operational, HR, or technical tickets directly to support.",
        href: "/contact",
      },
      {
        title: "Corporate portal",
        description: "Company policies, verified directory, and official notices.",
        href: "/about",
      },
    ],
    showHighlights: true,
    highlights: [
      "View and download monthly payslips and tax declarations",
      "Apply for leaves, track approvals, and review shift schedules",
      "Read real-time organizational circulars and announcements",
      "Submit helpdesk queries and IT service tickets securely",
    ],
  });

  if (isTenantContext && loading) {
    return <PublicPageLoading label="Loading..." sublabel="Preparing your company workspace" />;
  }

  const defaultTiles = [
    {
      icon: UsersRound,
      title: "Employee self-service",
      description: "Login, mark attendance, request leaves, and review daily updates.",
      href: "/login",
    },
    {
      icon: WalletCards,
      title: "Payroll access",
      description: "View monthly payslips, tax declarations, and compensation structure.",
      href: "/login",
    },
    {
      icon: LifeBuoy,
      title: "Helpdesk & support",
      description: "Raise operational, HR, or technical tickets directly to support.",
      href: "/contact",
    },
    {
      icon: ShieldCheck,
      title: "Corporate portal",
      description: "Company policies, verified directory, and official notices.",
      href: "/about",
    },
  ];

  const quickTiles =
    content.quickAccess && content.quickAccess.length > 0
      ? content.quickAccess.map((tile, idx) => ({
          icon: defaultTiles[idx % defaultTiles.length].icon,
          title: tile.title,
          description: tile.description,
          href: tile.href || "/login",
        }))
      : defaultTiles;

  return (
    <PublicAudiencePageFrame
      audience="tenant"
      profile={profile}
      headerContent={headerContent}
      footerContent={footerContent}
      allowedPaths={allowedPaths}
      pageVisible={pageVisible}
    >
      {/* Dynamic Announcement Banner */}
      {content.announcement?.enabled && content.announcement?.text ? (
        <div className="border-b border-blue-200/70 bg-blue-50/90 px-4 py-2.5 text-center text-xs sm:text-sm font-medium text-blue-900 dark:border-blue-900/60 dark:bg-blue-950/70 dark:text-blue-200">
          <div className="mx-auto flex max-w-7xl items-center justify-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--uab-primary,#1d4ed8)] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
              <BellRing className="h-3 w-3" />
              Notice
            </span>
            <span>{content.announcement.text}</span>
          </div>
        </div>
      ) : null}

      {/* Clean Marketing & Workspace Hero */}
      <MarketingHero
        eyebrow={content.eyebrow}
        title={content.title}
        subtitle={content.subtitle}
        badges={content.trustPills}
        showPreview={false}
        trustSignals={["Enterprise SSO Access", "Role-Based Security", "Instant Self-Service"]}
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={withPublicAudience(content.primaryCtaHref || "/login", "tenant")}
              className={publicButtonClassName.primary}
            >
              {content.primaryCtaLabel || "Sign in"}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href={withPublicAudience(content.secondaryCtaHref || "/contact", "tenant")}
              className={publicButtonClassName.secondary}
            >
              {content.secondaryCtaLabel || "Contact support"}
            </Link>
          </div>
        }
      />

      {/* Quick-Access Services & Tiles */}
      {content.showQuickAccess !== false ? (
        <section className={publicSectionSpacingClassName}>
          <div className={`${publicSectionClassName} grid gap-5 sm:grid-cols-2 lg:grid-cols-4`}>
            {quickTiles.map((item) => (
              <Link
                key={item.title}
                href={withPublicAudience(item.href, "tenant")}
                className={`${publicPanelHoverClassName} group flex flex-col justify-between`}
              >
                <div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[var(--uab-primary,#1d4ed8)] dark:bg-blue-950/70 dark:text-cyan-300">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <h2 className="mt-3.5 text-base font-bold text-slate-900 group-hover:text-[var(--uab-primary,#1d4ed8)] transition-colors dark:text-white">
                    {item.title}
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                    {item.description}
                  </p>
                </div>
                <div className="mt-4 flex items-center text-xs font-semibold text-[var(--uab-primary,#1d4ed8)]">
                  <span>Open</span>
                  <ArrowRight className="ml-1 h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {/* Highlights & Direct Sign-in Section */}
      {content.showHighlights !== false ? (
        <section className={`${publicSectionSpacingClassName} bg-slate-50/80 dark:bg-slate-900/40 border-t border-slate-200/60 dark:border-slate-800/60`}>
          <div className={`${publicSectionClassName} grid gap-6 lg:grid-cols-2`}>
            <div className={publicPanelClassName}>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Workspace Services</h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Authorized actions for registered team members:</p>
              <ul className="mt-4 space-y-3">
                {(content.highlights || []).map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-slate-700 dark:text-slate-300">
                    <CircleCheckBig className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className={`${publicPanelClassName} flex flex-col justify-between`}>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Sign in to your account</h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                  Access your enterprise workspace using your official corporate credentials. Reach out to HR or administrator if you require onboarding support.
                </p>
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href={withPublicAudience(content.primaryCtaHref || "/login", "tenant")}
                  className={publicButtonClassName.primary}
                >
                  {content.primaryCtaLabel || "Sign in"}
                </Link>
                <Link
                  href={withPublicAudience(content.secondaryCtaHref || "/contact", "tenant")}
                  className={publicButtonClassName.secondary}
                >
                  {content.secondaryCtaLabel || "Contact support"}
                </Link>
              </div>
            </div>
          </div>
        </section>
      ) : null}
    </PublicAudiencePageFrame>
  );
}
