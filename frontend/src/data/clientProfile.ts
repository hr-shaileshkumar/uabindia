const appName = process.env.NEXT_PUBLIC_APP_NAME || "UabIndia ERP";

export const clientProfile = {
  companyName: "UabIndia",
  brandName: appName,
  industry: "Enterprise Cloud ERP",
  headquarters: "Bengaluru, Karnataka, India",
  employeeCount: "",
  supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "support@uabindia.in",
  supportPhone: process.env.NEXT_PUBLIC_SUPPORT_PHONE || "+91 80 4000 1234",
  supportHours: "Mon-Sat | 9:00 AM - 6:30 PM IST",
  supportTier: "Enterprise Mission-Critical Support",
  implementationPartner: "UabIndia Enterprise Cloud",
  heroTitle: "Your company workspace",
  heroSubtitle:
    "Secure login, employee self-service, support, and company updates from one portal.",
  snapshot: [],
  workflowNote: "Approvals, payroll runs, finance controls, and cross-team workflows tracked in one flow.",
  highlights: [
    {
      title: "Company Profile",
      body: "Showcase your company details, active ERP modules, and support contacts for your teams.",
    },
    {
      title: "Service Coverage",
      body: "Highlight the ERP, SaaS, automation, and implementation services your company has subscribed to.",
    },
    {
      title: "Client Careers",
      body: "Share current openings for client teams and the operations or functional skills required to join them.",
    },
  ],
  servicesInUse: ["ERP Core", "HRMS", "Payroll", "Finance", "Inventory", "SaaS Platform"],
  overview:
    "This profile is designed for client companies to present their details, service coverage, SaaS platform capabilities, and ERP ownership for internal teams and stakeholders.",
  cultureNote:
    "Client teams rely on a single source of truth for operations, compliance, leadership reporting, and cross-module process execution.",
};

export const clientJobs: Array<{
  role: string;
  company: string;
  location: string;
  type: string;
}> = [];
