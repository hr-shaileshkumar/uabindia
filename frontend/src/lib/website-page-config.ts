export type WebsitePageDefinition = {
  key: string;
  label: string;
  description: string;
};

export const WEBSITE_PAGE_DEFINITIONS: WebsitePageDefinition[] = [
  {
    key: "header",
    label: "Header",
    description: "Announcement bar, navigation, and primary call to action across the tenant public site.",
  },
  {
    key: "home",
    label: "Company Home Page",
    description: "Tenant landing page for company profile, product positioning, and workspace entry.",
  },
  {
    key: "platform-home",
    label: "Platform Home Page",
    description: "Main platform marketing home page for the public SaaS site.",
  },
  {
    key: "features",
    label: "Features Page",
    description: "Platform product overview for modules, capabilities, and rollout patterns.",
  },
  {
    key: "industries",
    label: "Industries Page",
    description: "Platform use-case page for industry fit, operating contexts, and rollout lens.",
  },
  {
    key: "pricing",
    label: "Pricing Page",
    description: "Platform pricing and commercial model page for rollout tiers and plan comparison.",
  },
  {
    key: "about",
    label: "About Page",
    description: "Company mission, governance story, and operational narrative.",
  },
  {
    key: "contact",
    label: "Contact Page",
    description: "Sales or support capture form and public contact details.",
  },
  {
    key: "career",
    label: "Careers Page",
    description: "Hiring pitch, open roles, and recruitment process content.",
  },
  {
    key: "support",
    label: "Help & Support Page",
    description: "Support lanes, service model explanation, and escalation guidance.",
  },
  {
    key: "login",
    label: "Login Page",
    description: "Secure access messaging before authentication.",
  },
  {
    key: "forgot-password",
    label: "Forgot Password",
    description: "Password recovery guidance and reset-initiation copy.",
  },
  {
    key: "reset-password",
    label: "Reset Password",
    description: "Token-based password reset messaging and reassurance.",
  },
  {
    key: "register",
    label: "Access Request",
    description: "Invite-first account request messaging for controlled onboarding.",
  },
  {
    key: "footer",
    label: "Footer",
    description: "Closing brand summary, quick links, and legal line.",
  },
];

export const getWebsitePageDefinition = (pageType: string): WebsitePageDefinition | undefined =>
  WEBSITE_PAGE_DEFINITIONS.find((page) => page.key === pageType);
