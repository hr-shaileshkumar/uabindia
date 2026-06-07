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

export type WebsitePageTemplateDefinition = {
  title: string;
  description: string;
  sample: Record<string, unknown>;
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
  badge: profile.brandName || "Uabindia ERP",
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

export const getWebsitePageTemplate = (pageType: string, profile: ClientProfile): WebsitePageTemplateDefinition => {
  const templates: Record<string, WebsitePageTemplateDefinition> = {
    header: {
      title: "Public Header",
      description: "Controls the announcement bar, navigation items, and primary CTA shown on all public pages.",
      sample: getDefaultHeaderContent(profile),
    },
    footer: {
      title: "Public Footer",
      description: "Controls the closing brand summary, footer navigation links, and legal line.",
      sample: getDefaultFooterContent(profile),
    },
    home: {
      title: "Home Page",
      description: "Hero content, benefits, workflow steps, trust messaging, and feature cards for the public landing page.",
      sample: {
        eyebrow: `Welcome to ${profile.brandName}`,
        title: profile.heroTitle || `Modern ${profile.brandName} workflows built for ${profile.companyName}`,
        subtitle:
          profile.heroSubtitle ||
          "A polished tenant-aware SaaS platform for finance, HR, payroll, and operational teams.",
        primaryCtaLabel: "Open workspace",
        secondaryCtaLabel: "Book a demo",
        trustPills: ["Tenant-ready branding", "HRMS + Payroll + ERP", "Role-based access", "Audit-aware operations"],
        featureCards: [
          {
            title: "Tenant-aware controls",
            description: "Role permissions, audit trails, and approval routing that scale with enterprise governance.",
          },
          {
            title: "Unified finance operations",
            description: "Billing, ledger, cash visibility, and compliance workflows managed from one operating layer.",
          },
        ],
        workflowSteps: [
          {
            title: "Shape your operating model",
            description: "Configure roles, departments, approvals, and policies around the way the business actually runs.",
          },
          {
            title: "Launch one connected workspace",
            description: "Bring finance, HR, payroll, inventory, and support into a single front door for every team.",
          },
          {
            title: "Track trust and performance",
            description: "Use reporting, controls, and audit-ready history to improve speed without losing accountability.",
          },
        ],
        testimonial:
          "We replaced fragmented finance and HR handoffs with one operating layer that leadership and delivery teams both trust.",
      },
    },
    about: {
      title: "About Page",
      description: "Mission, governance, credibility, and company narrative shown on the about page.",
      sample: {
        eyebrow: "About the platform",
        title: `${profile.companyName} runs operations with ${profile.brandName}`,
        subtitle:
          "A unified ERP and HR operations experience for enterprise teams that need secure workflows, stronger governance, and sharper visibility.",
        missionTitle: "Our mission",
        missionBody:
          "Create a dependable operating surface that gives leadership, finance, HR, and service teams the same trusted picture of how work moves.",
        governanceTitle: "How the platform is governed",
        governanceBody:
          "We align access, process ownership, approval paths, and support operations so every workflow can move faster without becoming harder to audit.",
      },
    },
    contact: {
      title: "Contact Page",
      description: "Controls the public support and lead capture page for branded tenant outreach.",
      sample: {
        eyebrow: "Contact",
        title: `Reach the ${profile.companyName} support team`,
        subtitle:
          "Use this page for onboarding, payroll support, finance workflows, tenant setup, or leadership-level platform enquiries.",
        submitLabel: "Send request",
        successMessage: "Your request has been received and routed to the support desk.",
        sideTitle: "Support desk",
        supportAreasTitle: "What we handle",
      },
    },
    career: {
      title: "Careers Page",
      description: "Controls the public hiring pitch, page headline, and recruitment process copy.",
      sample: {
        eyebrow: "Careers",
        title: `Build your next chapter with ${profile.companyName}`,
        subtitle:
          "Explore roles across ERP delivery, payroll, finance, HR operations, and platform support in a team built around operational clarity.",
        applyLabel: "Apply now",
        emptyTitle: "No openings published yet",
        emptySubtitle: "This page is ready for hiring campaigns as soon as the team publishes active roles.",
        processTitle: "Hiring process",
        processBody:
          "Expect structured screening, focused interviews, business alignment, and onboarding readiness designed for enterprise roles.",
      },
    },
    login: {
      title: "Login Page",
      description: "Public login messaging, hero text, and security-oriented guidance shown before authentication.",
      sample: {
        title: "Sign in to your workspace",
        subtitle:
          "Access ERP, payroll, HR, and operational workflows from one secure tenant-aware entry point.",
        loginButtonLabel: "Sign in",
        authEyebrow: "Secure access",
        authAsideTitle: "Built for controlled access",
        authAsideBody:
          "Use this page to present a secure, trustworthy handoff into the tenant workspace while preserving brand tone.",
        authBadges: ["Audit-aware login", "Tenant-scoped access", "Modern workspace"],
      },
    },
    "forgot-password": {
      title: "Forgot Password Page",
      description: "Public password recovery messaging used for email-based reset initiation.",
      sample: {
        title: "Recover access without contacting support first",
        subtitle:
          "Submit your business email to request password reset instructions. The response is intentionally generic for account security.",
        authEyebrow: "Password recovery",
        authAsideTitle: "How recovery works",
        authAsideBody:
          "Use this page to explain the recovery flow and reassure users that account security is preserved.",
        authBadges: ["Recovery flow live", "Backend-connected", "Security-first messaging"],
        submitLabel: "Send reset instructions",
      },
    },
    "reset-password": {
      title: "Reset Password Page",
      description: "Public password reset messaging used after the user receives a recovery token.",
      sample: {
        title: "Finish the recovery flow with a new secure password",
        subtitle:
          "Use the reset token from your recovery email. This page completes the frontend flow for the existing backend reset endpoint.",
        authEyebrow: "Set a new password",
        authAsideTitle: "What happens next",
        authAsideBody:
          "Explain that active sessions are revoked and that the user should sign in again after a successful reset.",
        authBadges: ["Reset token supported", "Revokes old sessions", "Enterprise-safe flow"],
        submitLabel: "Reset password",
      },
    },
  };

  return templates[pageType] ?? {
    title: pageType,
    description: "Custom website page content.",
    sample: {},
  };
};
