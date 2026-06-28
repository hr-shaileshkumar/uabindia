import type { ClientProfile } from "@/lib/publicProfile";
import type { PublicAudience } from "@/lib/public-audience";
import {
  getDefaultPublicHomeHref,
  getPublicNavLinks,
} from "@/lib/public-site-map";

export type PublicNavLink = {
  label: string;
  href: string;
};

export type PublicHeaderContent = {
  badge: string;
  announcement: string;
  homeHref?: string;
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

const legalYear = "2026";

export const getDefaultHeaderContent = (
  profile: ClientProfile,
  audience: PublicAudience = "tenant"
): PublicHeaderContent => ({
  badge: audience === "platform" ? "Cloud ERP platform" : "Company workspace",
  announcement:
    audience === "platform"
      ? `${profile.brandName} brings HR, payroll, finance, procurement, inventory, CRM, projects, and support into one secure platform.`
      : `${profile.companyName} employee access, support, and company information`,
  homeHref: getDefaultPublicHomeHref(audience),
  navLinks: getPublicNavLinks(audience, "primary"),
  primaryCtaLabel: audience === "platform" ? "Request Demo" : "Login",
  primaryCtaHref: audience === "platform" ? "/book-demo" : "/login",
});

export const getDefaultFooterContent = (
  profile: ClientProfile,
  audience: PublicAudience = "tenant"
): PublicFooterContent => ({
  summary:
    audience === "platform"
      ? `${profile.brandName} helps organizations run HR, payroll, attendance, finance, procurement, inventory, CRM, projects, assets, help desk, and reporting from one modern enterprise platform.`
      : `${profile.brandName} gives ${profile.companyName} one clean public entry for company information, support, recruitment, and secure workspace access.`,
  footerLinks: getPublicNavLinks(audience, "footer"),
  legalLine: `Copyright ${legalYear} ${profile.brandName}. All rights reserved.`,
  platformLabel:
    audience === "platform"
      ? `${profile.brandName} SaaS experience`
      : `${profile.brandName} company public experience`,
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
        primaryCtaLabel: "Login",
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
    "platform-home": {
      title: "Platform Home Page",
      description: "Platform-facing hero, metrics, feature cards, rollout steps, and closing CTA for the public SaaS site.",
      sample: {
        eyebrow: `Welcome to ${profile.brandName}`,
        title: "ERP, HRMS, payroll, and support workflows in one production-ready SaaS workspace.",
        subtitle:
          "One SaaS operating layer for employee records, attendance, payroll, finance, procurement, approvals, and tenant governance.",
        primaryCtaLabel: "Login",
        secondaryCtaLabel: "Talk to the team",
        badges: ["HRMS", "Payroll", "Finance", "Procurement", "Employee Self Service"],
        metrics: [
          { label: "Core products", value: "ERP + HRMS", helper: "Operations, payroll, finance, and people data stay in one workspace." },
          { label: "Access model", value: "Backend-driven", helper: "Modules and menus come from tenant permissions and API responses." },
        ],
        featureCards: [
          { title: "HRMS and employee records", description: "Employee master, onboarding, leave, attendance, recruitment, and self-service." },
          { title: "Payroll and finance control", description: "Runs, payslips, journals, payments, invoices, expenses, and statutory visibility." },
        ],
        checklistEyebrow: "Why teams choose it",
        checklistTitle: "One front door for business operations.",
        checklistDescription: "Keep public pages, authentication, protected workspaces, and tenant governance aligned in one SaaS structure.",
        checklistItems: [
          "Single workspace for HRMS, payroll, finance, procurement, inventory, support, and approvals.",
          "Tenant modules, role mapping, and menu visibility are driven by backend APIs instead of frontend role forks.",
        ],
        rolloutEyebrow: "Rollout path",
        rolloutTitle: "Launch the core workspace first, then expand by module.",
        rolloutSubtitle: "The same frontend can support first-phase HR rollout, payroll activation, and ERP expansion.",
        rolloutSteps: [
          { step: "01", title: "Set up tenant and access rules", description: "Enable modules, define user roles, and publish navigation." },
          { step: "02", title: "Go live with HRMS and payroll", description: "Start with employees, attendance, leave, payroll, and secure login." },
        ],
        closingEyebrow: "Next step",
        closingTitle: "Move from public site to controlled workspace access.",
        closingDescription: "Enter the tenant workspace through real authentication and backend-controlled permissions.",
      },
    },
    features: {
      title: "Features Page",
      description: "Platform module overview, product rules, rollout stages, and feature-group content.",
      sample: {
        eyebrow: "Feature overview",
        title: "One ERP product surface for people, payroll, finance, inventory, support, and control.",
        subtitle:
          "Show how major modules fit together without making the page feel overloaded.",
        primaryCtaLabel: "Login",
        secondaryCtaLabel: "Review pricing",
        badges: ["HRMS", "Payroll", "Finance", "Inventory", "Support"],
        metrics: [
          { label: "Modules", value: "6+", helper: "Major product domains." },
          { label: "Workflow model", value: "Shared", helper: "Approvals and states stay consistent." },
        ],
        featureGroups: [
          { eyebrow: "People", title: "HRMS core", description: "Employee master, onboarding, documents, and lifecycle flows." },
          { eyebrow: "Pay", title: "Payroll and statutory", description: "Salary structures, payouts, reimbursements, and compliance work." },
        ],
        rulesEyebrow: "Shared rules",
        rulesTitle: "Users should not relearn the product for every module.",
        rulesDescription: "Use short statements that explain why the product stays usable at scale.",
        rules: [
          "Every module should feel like the same product.",
          "Access and audit signals should stay consistent.",
        ],
        patternEyebrow: "Platform patterns",
        patternTitle: "The strongest systems are consistent underneath.",
        patternSubtitle: "Explain the patterns that keep the product stable.",
        patternCards: [
          { title: "Shared workflow language", description: "States and approvals follow one model." },
          { title: "Role-aware by default", description: "Screens and actions reflect tenant and permission scope." },
        ],
        rolloutEyebrow: "Implementation flow",
        rolloutTitle: "Launch in phases without changing the UI direction.",
        rolloutSubtitle: "Define the main rollout stages clearly.",
        rolloutSteps: [
          { step: "01", title: "Core records", description: "Tenant, user, role, and employee foundations." },
          { step: "02", title: "Workforce execution", description: "Attendance, leave, shifts, and approvals." },
        ],
        closingEyebrow: "Next step",
        closingTitle: "Map feature depth to rollout scope.",
        closingDescription: "Guide the user into pricing, contact, or industry-fit decisions.",
      },
    },
    industries: {
      title: "Industries Page",
      description: "Platform industry-fit page for market segments, workflow signals, and rollout planning.",
      sample: {
        eyebrow: "Industry fit",
        title: "One product structure, different operating models.",
        subtitle:
          "Use this page to explain how the same product adapts to different industries without changing the design language.",
        primaryCtaLabel: "Explore features",
        secondaryCtaLabel: "Login",
        badges: ["Projects", "Manufacturing", "Logistics", "Healthcare"],
        metrics: [
          { label: "Use cases", value: "6", helper: "Common operating contexts." },
          { label: "Rollout model", value: "Configurable", helper: "Module sequencing and control depth vary by client." },
        ],
        industryCards: [
          { eyebrow: "Projects", title: "Infrastructure and contracting", description: "Attendance, deployment, approvals, and billing-sensitive workflows." },
          { eyebrow: "Manufacturing", title: "Plants and warehouse operations", description: "Shift, stores, procurement, asset, and finance coordination." },
        ],
        signalEyebrow: "What changes by industry",
        signalTitle: "The workflow changes, not the product discipline.",
        signalDescription: "Use short points to describe industry-level differences.",
        signals: [
          "Project-led businesses need staffing and billing context to stay connected.",
          "Regulated sectors need tighter audit and approval controls.",
        ],
        rolloutEyebrow: "Rollout lens",
        rolloutTitle: "Industry onboarding starts with process clarity.",
        rolloutSubtitle: "Define how roles, modules, and approval depth vary by client.",
        rolloutSteps: [
          { step: "01", title: "Workflow map", description: "Map employee, finance, and reporting needs." },
          { step: "02", title: "Role model", description: "Separate owner, admin, manager, and employee scope." },
        ],
        closingEyebrow: "Planning",
        closingTitle: "Move from industry fit into rollout scope.",
        closingDescription: "Push the user toward pricing or contact once fit is clear.",
      },
    },
    pricing: {
      title: "Pricing Page",
      description: "Platform pricing page for commercial tiers, plan comparison, and rollout notes.",
      sample: {
        eyebrow: "Commercial model",
        title: "Cleaner pricing for phased ERP rollout.",
        subtitle:
          "Use this page to present modular rollout tiers instead of heavy enterprise pricing tables.",
        primaryCtaLabel: "Talk to sales",
        secondaryCtaLabel: "Login",
        metrics: [
          { label: "Plan layers", value: "4", helper: "Starter through platform-level governance." },
          { label: "Rollout style", value: "Modular", helper: "Start narrow and expand." },
        ],
        plans: [
          { name: "Starter", audience: "Single-company HRMS rollout", price: "Rs 24,999 / month", summary: "Start with employee records and attendance.", points: ["Employee master", "Attendance and leave"] },
          { name: "Professional", audience: "Operations-led growth phase", price: "Rs 64,999 / month", summary: "Adds payroll and finance workflows.", points: ["Payroll", "Finance operations"], featured: true },
        ],
        comparisonEyebrow: "Capability overview",
        comparisonTitle: "What expands between plan tiers.",
        comparisonRows: [
          { capability: "Employee self-service", values: ["Starter: Included", "Professional: Included"] },
          { capability: "Owner console", values: ["Starter: No", "Platform: Included"] },
        ],
        notesEyebrow: "Commercial notes",
        notesTitle: "Pricing works best after rollout scope is clear.",
        notesDescription: "Use short notes to explain implementation, support, and integration scope.",
        notes: [
          "Implementation fees depend on complexity and migration scope.",
          "Support and integration work are packaged separately where needed.",
        ],
        closingEyebrow: "Next step",
        closingTitle: "Move from plan selection into rollout sizing.",
        closingDescription: "Guide the user into sales contact or deeper feature review.",
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
    support: {
      title: "Help & Support Page",
      description: "Controls support-model messaging, escalation copy, and service-lane content for tenant public support pages.",
      sample: {
        eyebrow: "Support model",
        title: "Support should stay aligned with your company workspace, not sit outside the product.",
        subtitle:
          "Employees, admins, and managers should get support that fits the same language, workflows, and tenant boundaries as the workspace they use every day.",
        coverageTitle: "The support layer is built around user role, business impact, and resolution ownership.",
        coverageDescription:
          "Different issues belong to different operating surfaces. Employee self-service, company operations, and platform governance do not need the same response path.",
        supportLanesTitle: "Support should stay separated by role and business impact.",
        supportLanesDescription:
          "A useful service model does not treat employee issues, business admin issues, and platform governance as the same queue.",
        supportLanes: [
          "Employee help: Password, ESS, attendance visibility, leave requests, payslips, and personal record issues.",
          "Business admin help: Approval routing, payroll validation, reports, finance flow, procurement, inventory, and role access issues.",
          "Platform governance: Tenant configuration, module enablement, audit concerns, branding, and owner-console workflows.",
        ],
        resolutionTitle: "Good support is structured, visible, and easy to escalate.",
        resolutionDescription:
          "The support process mirrors enterprise control expectations: clear triage, ownership, escalation, and closure traceability.",
        actionTitle: "Define support coverage with the same clarity as product scope.",
        actionDescription:
          "The cleanest implementations make escalation, response ownership, and operating boundaries visible before rollout begins.",
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
    register: {
      title: "Access Request Page",
      description: "Invite-first access request messaging used when public self-registration is disabled.",
      sample: {
        title: "Request workspace access",
        subtitle:
          "Account creation is managed by your tenant administrator. Use this form to request access or contact the support desk.",
        authEyebrow: "Invite-first access",
        authAsideTitle: "How access is granted",
        authAsideBody:
          "New users are usually provisioned by an internal admin so role assignments, company context, and approval limits stay correct from day one.",
        authBadges: ["Invite managed", "Role-aware onboarding", "Tenant-scoped access"],
        submitLabel: "Request access",
      },
    },
  };

  return templates[pageType] ?? {
    title: pageType,
    description: "Custom website page content.",
    sample: {},
  };
};
