import type { ClientProfile } from "@/lib/publicProfile";

export type PublicNavLink = {
  label: string;
  href: string;
};

export type PublicHeaderContent = {
  badge: string;
  announcement: string;
  navLinks: PublicNavLink[];
  primaryCtaLabel: string;
  primaryCtaHref: string;
};

export type PublicFooterContent = {
  summary: string;
  footerLinks: PublicNavLink[];
  legalLine: string;
  platformLabel: string;
};

export type PublicPageRecord = {
  title?: string;
  contentJson?: string;
};

export const parsePageContentJson = <T extends Record<string, unknown>>(
  contentJson: string | null | undefined,
  fallback: T
): T => {
  if (!contentJson || contentJson === "{}") {
    return fallback;
  }

  try {
    const parsed = JSON.parse(contentJson) as unknown;
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      return fallback;
    }

    return { ...fallback, ...parsed } as T;
  } catch {
    return fallback;
  }
};

export const getRawMarkupContent = (contentJson: string | null | undefined): string | null => {
  if (!contentJson) return null;
  const trimmed = contentJson.trim();
  if (!trimmed || trimmed === "{}") return null;
  return trimmed.startsWith("<") ? trimmed : null;
};

const legalYear = "2026";

export const getDefaultHeaderContent = (profile: ClientProfile): PublicHeaderContent => ({
  badge: profile.brandName || "Uabindia ERP Cloud",
  announcement: `Workspace for ${profile.companyName} on ${profile.brandName}`,
  navLinks: [
    { label: "Home", href: "/" },
    { label: "About", href: "/about" },
    { label: "Careers", href: "/careers" },
    { label: "Contact", href: "/contact" },
  ],
  primaryCtaLabel: "Login",
  primaryCtaHref: "/login",
});

export const getDefaultFooterContent = (profile: ClientProfile): PublicFooterContent => ({
  summary:
    `${profile.brandName} delivers modern, secure ERP for HRMS, payroll, finance, inventory, approvals, and operational workflows with enterprise-grade tenant controls.`,
  footerLinks: [
    { label: "Home", href: "/" },
    { label: "About", href: "/about" },
    { label: "Careers", href: "/careers" },
    { label: "Contact", href: "/contact" },
    { label: "Login", href: "/login" },
  ],
  legalLine: `© ${legalYear} ${profile.brandName}. All rights reserved.`,
  platformLabel: `${profile.brandName} platform`,
});
