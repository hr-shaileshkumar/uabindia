export const publicSiteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") || "https://www.uabindia.com";

export type MarketingNavGroup = {
  label: string;
  href: string;
  description?: string;
  children?: Array<{
    label: string;
    href: string;
    description: string;
  }>;
};

export type MarketingMetric = {
  label: string;
  value: string;
  helper: string;
};

export type TrustedOrganization = {
  name: string;
  sector: string;
  mark: string;
};

export type MarketingProblem = {
  title: string;
  description: string;
  impact: string;
};

export type MarketingModule = {
  slug: string;
  title: string;
  category: "People" | "Finance" | "Operations" | "Engagement";
  icon: string;
  summary: string;
  description: string;
  outcomes: string[];
  highlights: string[];
  idealFor: string[];
  metrics: MarketingMetric[];
};

export type MarketingIndustry = {
  slug: string;
  title: string;
  eyebrow: string;
  summary: string;
  description: string;
  challenges: string[];
  recommendedModules: string[];
  results: string[];
};

export type PricingPlan = {
  name: string;
  audience: string;
  price: string;
  implementation: string;
  featured?: boolean;
  summary: string;
  points: string[];
};

export type ComparisonRow = {
  capability: string;
  excel: string;
  traditional: string;
  uabindia: string;
};

export type Testimonial = {
  name: string;
  role: string;
  company: string;
  avatar: string;
  rating: number;
  quote: string;
  result: string;
  caseStudy: string;
  videoLabel: string;
};

export type ResourceCard = {
  title: string;
  type: string;
  summary: string;
  href: string;
};

export type FaqItem = {
  question: string;
  answer: string;
};

export const publicPrimaryNav: MarketingNavGroup[] = [
  {
    label: "Home",
    href: "/",
    description: "Return to the UabIndia ERP platform overview.",
  },
  {
    label: "Products",
    href: "/products",
    description: "Explore modules for people, finance, operations, and service teams.",
  },
  {
    label: "Industries",
    href: "/industries",
    description: "See how the platform fits healthcare, manufacturing, retail, projects, and NGOs.",
  },
  {
    label: "Pricing",
    href: "/pricing",
    description: "Choose a rollout model that matches your scale, complexity, and support needs.",
  },
  {
    label: "Resources",
    href: "/resources",
    description: "Guides, checklists, and rollout materials for ERP evaluation teams.",
  },
  {
    label: "About",
    href: "/about",
    description: "Company story, delivery principles, and trust signals.",
  },
  {
    label: "Contact",
    href: "/contact",
    description: "Talk to sales, implementation, or support.",
  },
];

export const publicFooterGroups = [
  {
    title: "Products",
    links: [
      { label: "HRMS", href: "/products/hrms" },
      { label: "Payroll", href: "/products/payroll" },
      { label: "Attendance", href: "/products/attendance" },
      { label: "Finance", href: "/products/finance" },
      { label: "Inventory", href: "/products/inventory" },
      { label: "Procurement", href: "/products/procurement" },
      { label: "CRM", href: "/products/crm" },
      { label: "Projects", href: "/products/project-management" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Industries", href: "/industries" },
      { label: "Pricing", href: "/pricing" },
      { label: "Resources", href: "/resources" },
      { label: "Careers", href: "/careers" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Help & Support", href: "/help-support" },
      { label: "Book Demo", href: "/book-demo" },
      { label: "Login", href: "/login" },
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
    ],
  },
];

export const trustedOrganizations: TrustedOrganization[] = [];

export const heroMetrics: MarketingMetric[] = [
  {
    label: "Public site source",
    value: "Backend driven",
    helper: "Primary public content and enquiry flows resolve through API responses and published website-page records.",
  },
  {
    label: "Audience handling",
    value: "Tenant aware",
    helper: "Platform and tenant public experiences resolve branding, navigation, and content from the backend.",
  },
  {
    label: "Access model",
    value: "Role ready",
    helper: "The wider product is structured around controlled access, approvals, and auditable operational changes.",
  },
  {
    label: "Rollout style",
    value: "Phased rollout",
    helper: "Organizations can start with core modules and expand without redesigning the public or protected product experience.",
  },
];

export const businessProblems: MarketingProblem[] = [
  {
    title: "Manual Excel",
    description: "Employee, payroll, finance, and approval data still moves through spreadsheets and ad hoc files.",
    impact: "Leaders wait for reconciled numbers instead of acting on a live operating view.",
  },
  {
    title: "Attendance Errors",
    description: "Shift rules, field punches, and exceptions are tracked in separate tools or manual sheets.",
    impact: "Payroll teams inherit messy inputs and managers cannot verify workforce movement quickly.",
  },
  {
    title: "Payroll Delays",
    description: "Attendance, leave, overtime, loans, and deductions are consolidated too late in the month.",
    impact: "Salary cycles stretch, corrections rise, and employee confidence drops.",
  },
  {
    title: "Approval Bottlenecks",
    description: "Leave, procurement, onboarding, and reimbursements move across calls, chat, and email chains.",
    impact: "Critical business actions stay pending without ownership or escalation visibility.",
  },
  {
    title: "Compliance Risk",
    description: "Audit logs, policy checks, statutory controls, and document history are inconsistent.",
    impact: "Businesses carry unnecessary exposure during payroll, procurement, and governance reviews.",
  },
  {
    title: "Disconnected Systems",
    description: "HR, payroll, finance, CRM, inventory, and support sit in different products with weak handoffs.",
    impact: "Teams duplicate data and leadership loses a single source of operational truth.",
  },
  {
    title: "Poor Reporting",
    description: "Monthly insights depend on manual exports and spreadsheet packs from multiple departments.",
    impact: "Executives get delayed numbers instead of real-time dashboards and exception signals.",
  },
  {
    title: "Manual HR Processes",
    description: "Onboarding, leave, documents, and employee actions still rely on forms, calls, and follow-up.",
    impact: "HR spends time chasing routine work instead of improving workforce operations.",
  },
];

export const solutionSignals = [
  {
    title: "One platform",
    detail: "All modules share one operating surface so employees, managers, finance, and leadership stop switching tools.",
  },
  {
    title: "One login",
    detail: "Users enter one secure workspace with role-aware navigation, approvals, and action visibility.",
  },
  {
    title: "One database",
    detail: "People data, payroll values, inventory movement, finance records, and support context stay connected.",
  },
  {
    title: "One dashboard",
    detail: "The leadership view shows live workforce, payroll, finance, and operational signals from the same source.",
  },
];

export const platformHighlights = [
  "Multi company",
  "Multi branch",
  "Multi tenant",
  "Role based access",
  "Workflow engine",
  "Approval matrix",
  "Document management",
  "Face recognition attendance",
  "Geo fencing",
  "GPS tracking",
  "Mobile app",
  "Employee self service",
  "Audit logs",
  "Real-time dashboard",
  "Cloud backup",
  "Secure login",
  "REST API",
  "WhatsApp notifications",
  "Email notifications",
  "AI ready architecture",
];

export const implementationSteps = [
  {
    step: "01",
    title: "Add organization",
    description: "Set up company entities, branches, reporting structures, and approval owners.",
  },
  {
    step: "02",
    title: "Create departments",
    description: "Define operating units, access scope, and workflow ownership across locations and teams.",
  },
  {
    step: "03",
    title: "Add employees",
    description: "Import employee masters, documents, managers, payroll structures, and shift rules.",
  },
  {
    step: "04",
    title: "Track attendance",
    description: "Connect attendance rules, biometric devices, geo checks, or mobile workforce capture.",
  },
  {
    step: "05",
    title: "Run payroll",
    description: "Process salary, statutory deductions, reimbursements, arrears, and approval checks.",
  },
  {
    step: "06",
    title: "View reports",
    description: "Monitor live analytics across people, finance, procurement, inventory, and operations.",
  },
];

export const dashboardSignals = [
  { label: "Public content", value: "Live API", helper: "Homepage metrics and published page content are sourced from backend responses." },
  { label: "Customer proof", value: "Approval based", helper: "Customer names, logos, and testimonials stay hidden until explicitly approved for public display." },
  { label: "Navigation", value: "Shared system", helper: "Core public routes, CTAs, and menus now follow one centralized structure." },
  { label: "Theme", value: "Standardized", helper: "The public UI uses a shared palette and common component styling instead of page-by-page color drift." },
];

export const marketingModules: MarketingModule[] = [
  {
    slug: "hrms",
    title: "HRMS",
    category: "People",
    icon: "users",
    summary: "Employee lifecycle, records, onboarding, self-service, and workforce visibility in one secure system.",
    description:
      "Manage employee master data, letters, documents, reporting lines, organization structures, and workforce governance without fragmented HR tools.",
    outcomes: ["Faster onboarding", "Cleaner employee records", "Stronger manager visibility"],
    highlights: [
      "Employee master and document vault",
      "Onboarding, probation, confirmation, and offboarding flows",
      "Manager views, ESS, and organization-wide reporting",
    ],
    idealFor: ["Multi-location companies", "Hospitals and education groups", "Growing service organizations"],
    metrics: [
      { label: "Primary users", value: "HR + managers", helper: "Built for daily people operations, not back-office admin only." },
      { label: "Core gain", value: "Single employee truth", helper: "No more parallel master sheets across branches and departments." },
    ],
  },
  {
    slug: "payroll",
    title: "Payroll",
    category: "Finance",
    icon: "wallet",
    summary: "Payroll runs, statutory processing, payslips, components, arrears, and reimbursements under one governed flow.",
    description:
      "Close salary cycles with approval controls, attendance-linked inputs, salary structures, deductions, and audit-ready payroll records.",
    outcomes: ["Lower payroll error rate", "Faster cycle closure", "Better statutory confidence"],
    highlights: [
      "Salary structures, components, and pay runs",
      "Payslips, reimbursements, loans, bonus, and arrears",
      "Approval checkpoints and payroll audit readiness",
    ],
    idealFor: ["Payroll-heavy employers", "Compliance-sensitive sectors", "Field workforce organizations"],
    metrics: [
      { label: "Cycle control", value: "Approval-ready", helper: "Validate payroll before release with accountable sign-off." },
      { label: "Data sources", value: "Attendance linked", helper: "Leave, overtime, and attendance feed one salary process." },
    ],
  },
  {
    slug: "attendance",
    title: "Attendance",
    category: "People",
    icon: "clock",
    summary: "Track attendance with shift rules, geo logic, biometric inputs, and live exception visibility.",
    description:
      "Support office, site, hospital, plant, retail, and field attendance patterns with real-time visibility for managers and payroll teams.",
    outcomes: ["Higher attendance accuracy", "Reduced disputes", "Cleaner payroll inputs"],
    highlights: [
      "Daily, monthly, and shift-aware attendance tracking",
      "GPS, face recognition, and biometric integration options",
      "Late, absent, overtime, and exception workflows",
    ],
    idealFor: ["Logistics", "Construction", "Manufacturing", "Field service teams"],
    metrics: [
      { label: "Capture modes", value: "Multi-source", helper: "Support mobile, biometric, geo, or device-driven attendance." },
      { label: "Manager value", value: "Live exceptions", helper: "Surface late arrivals, absences, and missing punches immediately." },
    ],
  },
  {
    slug: "leave",
    title: "Leave",
    category: "People",
    icon: "calendar",
    summary: "Leave policy configuration, requests, balances, approvals, and manager visibility with payroll alignment.",
    description:
      "Avoid manual leave reconciliation by connecting policy setup, employee requests, approval ownership, and payroll impact in one flow.",
    outcomes: ["Clear leave accountability", "Fewer policy disputes", "Reliable balances"],
    highlights: [
      "Policy setup by employee type or business unit",
      "Leave requests with approval matrix and notifications",
      "Balance visibility for employees, managers, and payroll teams",
    ],
    idealFor: ["Mid-market HR teams", "Project businesses", "Multi-branch employers"],
    metrics: [
      { label: "Policy model", value: "Configurable", helper: "Apply different leave rules across entities, branches, or employee groups." },
      { label: "Process gain", value: "No spreadsheet follow-up", helper: "Balances and approvals stay visible inside the same system." },
    ],
  },
  {
    slug: "recruitment",
    title: "Recruitment",
    category: "People",
    icon: "briefcase",
    summary: "Vacancies, candidate tracking, interview coordination, offer workflows, and hiring visibility in one pipeline.",
    description:
      "Run structured hiring with role requests, candidate stages, screening, interviews, offer movement, and onboarding handoff.",
    outcomes: ["Structured hiring", "Better pipeline visibility", "Faster onboarding handoff"],
    highlights: [
      "Candidate records, stages, and screening workflows",
      "Interview schedules, panel coordination, and feedback",
      "Offer, approval, and onboarding transition support",
    ],
    idealFor: ["Fast-growing companies", "Education groups", "Healthcare staffing teams"],
    metrics: [
      { label: "Pipeline view", value: "Stage-based", helper: "Understand bottlenecks from requisition to offer in one screen." },
      { label: "Handoff quality", value: "Onboarding linked", helper: "Move hired candidates straight into employee workflows." },
    ],
  },
  {
    slug: "performance",
    title: "Performance",
    category: "People",
    icon: "sparkline",
    summary: "Goal cycles, reviews, manager feedback, and employee performance visibility aligned with organizational structure.",
    description:
      "Support continuous performance or formal review cycles with role-aware assessments, review steps, and outcome tracking.",
    outcomes: ["Clear review ownership", "Visible goal progress", "Better talent decisions"],
    highlights: [
      "Review periods, scorecards, and feedback workflows",
      "Manager-led performance visibility",
      "Structured assessment and action tracking",
    ],
    idealFor: ["Knowledge teams", "Large HR functions", "Process-driven organizations"],
    metrics: [
      { label: "Review model", value: "Structured", helper: "Keep evaluation cycles consistent across business units." },
      { label: "Manager value", value: "One view of people progress", helper: "Tie performance conversations to real employee context." },
    ],
  },
  {
    slug: "asset-management",
    title: "Asset Management",
    category: "Operations",
    icon: "package",
    summary: "Assign, track, recover, and audit employee and business assets from issue to return.",
    description:
      "Maintain accountability for laptops, tools, cards, devices, and critical equipment with assignment history and return controls.",
    outcomes: ["Lower asset leakage", "Clear employee accountability", "Stronger audit trace"],
    highlights: [
      "Asset assignment and return workflows",
      "Lifecycle tracking with status visibility",
      "Employee-linked asset accountability",
    ],
    idealFor: ["IT-enabled businesses", "Hospitals", "Manufacturing and site operations"],
    metrics: [
      { label: "Tracking model", value: "Employee linked", helper: "Understand exactly who holds what and for how long." },
      { label: "Risk control", value: "Exit-ready", helper: "Offboarding can automatically surface pending recoveries." },
    ],
  },
  {
    slug: "finance",
    title: "Finance",
    category: "Finance",
    icon: "bar-chart",
    summary: "Finance operations, invoices, payments, journals, expenses, reconciliation, and visibility in one controlled layer.",
    description:
      "Bring accounting operations and leadership reporting together so payroll, procurement, and finance decisions stay aligned.",
    outcomes: ["Cleaner financial control", "Faster close visibility", "Stronger reporting discipline"],
    highlights: [
      "Chart of accounts, journals, invoices, and payments",
      "Expenses, reconciliation, and period visibility",
      "Connected finance data across payroll and procurement",
    ],
    idealFor: ["Mid-sized businesses", "Project-led companies", "Growing multi-entity organizations"],
    metrics: [
      { label: "Operational gain", value: "Shared finance context", helper: "Payroll, procurement, and expenses stay tied to finance reality." },
      { label: "Leadership value", value: "Live visibility", helper: "Track revenue, cost, and outflow signals without waiting for manual packs." },
    ],
  },
  {
    slug: "inventory",
    title: "Inventory",
    category: "Operations",
    icon: "boxes",
    summary: "Items, warehouses, stock movement, transfers, GRN, adjustments, and inventory control from one workspace.",
    description:
      "Maintain better inventory discipline by connecting stores, approvals, receipts, transfers, and issue visibility in real time.",
    outcomes: ["Tighter stock control", "Fewer manual reconciliations", "Faster issue resolution"],
    highlights: [
      "Items, warehouses, stock movement, and transfers",
      "GRN, adjustments, and return visibility",
      "Procurement-connected inventory workflows",
    ],
    idealFor: ["Manufacturing", "Retail", "Logistics", "Hospitals"],
    metrics: [
      { label: "Stock visibility", value: "Real-time", helper: "Know what moved, where, and why across sites and stores." },
      { label: "Workflow fit", value: "Approval aligned", helper: "Inventory actions can follow the same governance model as procurement." },
    ],
  },
  {
    slug: "procurement",
    title: "Procurement",
    category: "Operations",
    icon: "shield",
    summary: "Purchase requests, approvals, POs, vendors, and receipt workflows built for control and speed.",
    description:
      "Shorten procurement cycles while preserving approval accountability, budget visibility, vendor records, and downstream stock impact.",
    outcomes: ["Quicker purchasing", "Higher approval discipline", "Better vendor traceability"],
    highlights: [
      "Purchase requests, orders, and vendor workflows",
      "Approval matrix with escalation visibility",
      "Inventory and finance connectivity",
    ],
    idealFor: ["Manufacturing", "Construction", "Hospitals", "Multi-site organizations"],
    metrics: [
      { label: "Control model", value: "Matrix-based", helper: "Approvals can reflect business unit, spend, or department rules." },
      { label: "Business gain", value: "One procure-to-receive flow", helper: "Reduce procurement follow-up across teams and locations." },
    ],
  },
  {
    slug: "crm",
    title: "CRM",
    category: "Engagement",
    icon: "messages",
    summary: "Track leads, customers, relationships, and business follow-up from one connected commercial workflow.",
    description:
      "Keep sales, account, and operations teams aligned with shared customer context, activity tracking, and follow-up visibility.",
    outcomes: ["Better lead continuity", "Stronger customer context", "Cleaner handoffs to operations"],
    highlights: [
      "Lead and customer record management",
      "Follow-up tracking and relationship history",
      "Connected visibility with finance and projects",
    ],
    idealFor: ["Service businesses", "ERP sales teams", "Project-led organizations"],
    metrics: [
      { label: "Customer context", value: "Centralized", helper: "Stop losing sales history across personal notes and spreadsheets." },
      { label: "Handoff gain", value: "Operations aligned", helper: "Connect commercial visibility to the rest of the business system." },
    ],
  },
  {
    slug: "project-management",
    title: "Project Management",
    category: "Operations",
    icon: "kanban",
    summary: "Projects, milestones, staffing, tasks, costs, and reporting visibility in one operational workspace.",
    description:
      "Give project-led teams stronger control over delivery status, resource use, approvals, and cross-functional execution.",
    outcomes: ["Clearer delivery visibility", "Better staffing control", "Stronger project accountability"],
    highlights: [
      "Project records, milestones, and task views",
      "Department and workforce coordination",
      "Cost and progress reporting for leadership",
    ],
    idealFor: ["Construction", "NGOs", "Consulting", "Healthcare programs"],
    metrics: [
      { label: "Coordination value", value: "Cross-functional", helper: "Projects connect to workforce, finance, and approvals." },
      { label: "Leadership view", value: "Progress + cost", helper: "See delivery movement before status meetings begin." },
    ],
  },
  {
    slug: "help-desk",
    title: "Help Desk",
    category: "Engagement",
    icon: "life-buoy",
    summary: "Tickets, escalations, service coverage, and support ownership for employees, admins, and operations teams.",
    description:
      "Handle internal support with visible queues, SLA awareness, escalation paths, and ownership across departments.",
    outcomes: ["Structured support", "Clearer escalation paths", "Faster issue closure"],
    highlights: [
      "Ticket queues and issue ownership",
      "Escalations and service-lane separation",
      "Public support and workspace support alignment",
    ],
    idealFor: ["Shared service teams", "Large HR operations", "Internal service organizations"],
    metrics: [
      { label: "Service model", value: "Role-aware", helper: "Separate employee, manager, admin, and platform support needs." },
      { label: "Operational gain", value: "Visible queue health", helper: "Know what is pending, aging, or escalated at any time." },
    ],
  },
  {
    slug: "reporting",
    title: "Reporting",
    category: "Finance",
    icon: "pie-chart",
    summary: "Unified reporting across workforce, payroll, finance, procurement, inventory, and operations.",
    description:
      "Turn live system activity into decision-ready reporting instead of waiting for manual packs from multiple departments.",
    outcomes: ["Faster executive reviews", "Better operational decisions", "Fewer manual report packs"],
    highlights: [
      "Cross-module dashboards and exports",
      "Department, cost, and process visibility",
      "Decision support across leadership levels",
    ],
    idealFor: ["Executive teams", "Controllers", "Operations leaders"],
    metrics: [
      { label: "Reporting model", value: "Cross-module", helper: "See how payroll, finance, and operations influence each other." },
      { label: "Leadership gain", value: "One decision layer", helper: "Replace departmental slide packs with live metrics." },
    ],
  },
  {
    slug: "analytics",
    title: "Analytics",
    category: "Finance",
    icon: "bar-chart",
    summary: "Interactive dashboards, trend analysis, KPI drilldowns, and leadership views for every operating layer.",
    description:
      "Transform live activity across HR, payroll, finance, inventory, projects, and support into decision-ready insight for managers and executives.",
    outcomes: ["Faster executive insight", "Stronger exception visibility", "Better planning decisions"],
    highlights: [
      "Role-based dashboards by function and management layer",
      "Trend, variance, and exception signals across modules",
      "Interactive KPI views for branch, company, and department analysis",
    ],
    idealFor: ["Leadership teams", "Controllers", "Operations heads"],
    metrics: [
      { label: "Decision speed", value: "Real-time", helper: "Leaders see live operating signals instead of waiting for month-end packs." },
      { label: "Coverage", value: "Cross-functional", helper: "People, payroll, finance, projects, and operations stay visible in one decision layer." },
    ],
  },
  {
    slug: "mobile-app",
    title: "ESS Mobile App",
    category: "Engagement",
    icon: "smartphone",
    summary: "Mobile access for ESS, attendance, approvals, notifications, and field-ready workflows.",
    description:
      "Support employees, managers, and field teams with the actions they need on the move without exposing the full admin surface.",
    outcomes: ["Better adoption", "Faster approvals", "Field-friendly workflow access"],
    highlights: [
      "ESS, payslips, leave, and attendance on mobile",
      "Manager approvals and exception handling",
      "Notifications and field attendance capture",
    ],
    idealFor: ["Field teams", "Distributed workforces", "Approval-heavy organizations"],
    metrics: [
      { label: "Access value", value: "Anywhere workflows", helper: "Employees and managers can act without waiting to reach a desktop." },
      { label: "Operational gain", value: "Faster response", helper: "Approvals and attendance issues move quicker across distributed teams." },
    ],
  },
];

export const marketingIndustries: MarketingIndustry[] = [
  {
    slug: "healthcare",
    title: "Healthcare",
    eyebrow: "Healthcare networks and care programs",
    summary: "Align workforce control, approvals, service operations, and compliance in one healthcare-ready operating layer.",
    description:
      "Healthcare organizations need workforce discipline, payroll reliability, procurement controls, and support visibility across high-accountability operations.",
    challenges: [
      "Round-the-clock teams across multiple departments and service lines",
      "High approval sensitivity for overtime, leave, procurement, and support requests",
      "Need for live reporting across facilities, vendors, and people operations",
    ],
    recommendedModules: ["hrms", "attendance", "payroll", "procurement", "help-desk"],
    results: ["More reliable shift governance", "Cleaner payroll closure", "Faster service and procurement approvals"],
  },
  {
    slug: "hospital",
    title: "Hospital",
    eyebrow: "Hospitals and multi-location clinics",
    summary: "Run staffing, attendance, payroll, procurement, and support for hospitals in one governed workflow system.",
    description:
      "Hospitals need deep attendance control, shift continuity, escalation management, and financial visibility without departmental silos.",
    challenges: [
      "Complex shift rosters across nursing, admin, and clinical support teams",
      "Urgent approvals for overtime, procurement, and employee movement",
      "Need for faster issue handling across facilities and departments",
    ],
    recommendedModules: ["attendance", "payroll", "procurement", "help-desk", "reporting"],
    results: ["Better roster discipline", "Faster escalation handling", "Clearer payroll and procurement visibility"],
  },
  {
    slug: "manufacturing",
    title: "Manufacturing",
    eyebrow: "Plants and production groups",
    summary: "Coordinate plant workforce, stores, procurement, assets, and finance with one disciplined manufacturing workspace.",
    description:
      "Manufacturing leaders need attendance, shifts, stores, purchase discipline, and asset accountability to run efficiently across units.",
    challenges: [
      "Shift planning across plants and production teams",
      "Tight control over inventory, stores, and procurement flow",
      "Need for fast decision visibility on people and operational costs",
    ],
    recommendedModules: ["attendance", "inventory", "procurement", "asset-management", "finance"],
    results: ["Stronger stock control", "Better procurement traceability", "Improved workforce planning"],
  },
  {
    slug: "retail",
    title: "Retail",
    eyebrow: "Multi-store retail operations",
    summary: "Keep store workforce, approvals, stock, and customer visibility aligned across growing retail networks.",
    description:
      "Retail teams need fast store-level reporting, attendance accuracy, procurement coordination, and cleaner item visibility.",
    challenges: [
      "Store-level attendance and workforce variation",
      "Fast-moving stock and replenishment needs",
      "Fragmented reporting across locations",
    ],
    recommendedModules: ["attendance", "inventory", "procurement", "crm", "reporting"],
    results: ["Better branch visibility", "Cleaner replenishment flow", "Faster leadership reporting"],
  },
  {
    slug: "construction",
    title: "Construction",
    eyebrow: "Project and site operations",
    summary: "Bring field attendance, project tracking, asset control, and commercial approvals into one project-led system.",
    description:
      "Construction organizations need workforce visibility across sites, project cost context, equipment accountability, and approval speed.",
    challenges: [
      "Distributed site attendance and workforce movement",
      "Project staffing and cost coordination",
      "Approval bottlenecks across procurement and reimbursements",
    ],
    recommendedModules: ["attendance", "project-management", "asset-management", "procurement", "finance"],
    results: ["Stronger site accountability", "Cleaner project controls", "Faster field approvals"],
  },
  {
    slug: "education",
    title: "Education",
    eyebrow: "Institutes and education groups",
    summary: "Manage staff operations, payroll, approvals, service support, and administration for education institutions at scale.",
    description:
      "Education groups need better control over employee records, attendance, payroll, and distributed campus administration.",
    challenges: [
      "Multiple campuses and department-level administration",
      "Faculty and non-teaching attendance complexity",
      "Need for cleaner support and approval workflows",
    ],
    recommendedModules: ["hrms", "attendance", "payroll", "help-desk", "reporting"],
    results: ["More consistent campus operations", "Better payroll reliability", "Clearer support handling"],
  },
  {
    slug: "government",
    title: "Government",
    eyebrow: "Public and program delivery teams",
    summary: "Support governance-heavy approvals, audit needs, employee controls, and program execution with better operational structure.",
    description:
      "Government and quasi-government programs need transparency, accountability, auditability, and controlled workflow movement.",
    challenges: [
      "Strict approval chains and documentation expectations",
      "High need for audit logs and traceability",
      "Complex reporting across teams and programs",
    ],
    recommendedModules: ["hrms", "procurement", "project-management", "reporting", "help-desk"],
    results: ["Better audit trace", "Clearer approval ownership", "Stronger reporting discipline"],
  },
  {
    slug: "ngo",
    title: "NGOs",
    eyebrow: "Mission and field delivery organizations",
    summary: "Coordinate dispersed workforce, projects, budgets, and approvals while keeping donor-facing reporting clearer.",
    description:
      "NGOs need one system for people, projects, expenses, field attendance, and structured reporting without enterprise overhead.",
    challenges: [
      "Field attendance and distributed teams",
      "Project-driven spending and approval controls",
      "Need for better reporting discipline across programs",
    ],
    recommendedModules: ["attendance", "project-management", "finance", "help-desk", "reporting"],
    results: ["Cleaner program visibility", "Better field coordination", "Faster reporting preparation"],
  },
  {
    slug: "logistics",
    title: "Logistics",
    eyebrow: "Movement-heavy operating teams",
    summary: "Track field workforce, approvals, assets, and operational support with better visibility across moving teams.",
    description:
      "Logistics businesses need stronger attendance discipline, asset accountability, and role-based support for distributed operations.",
    challenges: [
      "Mobile workforce and location-sensitive attendance",
      "Asset movement and issue tracking",
      "Operational support across branches and routes",
    ],
    recommendedModules: ["attendance", "asset-management", "help-desk", "hrms", "reporting"],
    results: ["Improved field visibility", "Cleaner asset tracking", "Faster issue escalation"],
  },
  {
    slug: "it-services",
    title: "IT Services",
    eyebrow: "Service and delivery organizations",
    summary: "Connect people operations, project control, customer visibility, and support ownership in one modern services workspace.",
    description:
      "IT and service firms need delivery tracking, employee visibility, approvals, and client coordination without disconnected systems.",
    challenges: [
      "Project and staffing coordination",
      "Customer-facing follow-up and service visibility",
      "Need for cleaner internal support and approvals",
    ],
    recommendedModules: ["hrms", "project-management", "crm", "help-desk", "reporting"],
    results: ["Better delivery coordination", "Stronger account visibility", "More consistent internal operations"],
  },
  {
    slug: "professional-services",
    title: "Professional Services",
    eyebrow: "Consulting, advisory, and services firms",
    summary: "Connect people operations, project delivery, client visibility, and internal approvals in one modern services platform.",
    description:
      "Professional services teams need project staffing, delivery reporting, customer follow-up, and internal workflow discipline without tool sprawl.",
    challenges: [
      "Balancing utilization, staffing, and project execution across delivery teams",
      "Managing approvals, expenses, and support requests without slowing client work",
      "Need for stronger customer, project, and workforce visibility in one system",
    ],
    recommendedModules: ["hrms", "project-management", "crm", "finance", "reporting"],
    results: ["Better utilization visibility", "Faster internal approvals", "Clearer client and delivery reporting"],
  },
];

export const pricingPlans: PricingPlan[] = [
  {
    name: "Core",
    audience: "Small businesses and focused HR rollouts",
    price: "Custom annual pricing",
    implementation: "Fast-start implementation",
    summary: "Start with the people and payroll foundation required to replace spreadsheets and disconnected point tools.",
    points: [
      "HRMS, attendance, leave, ESS",
      "Payroll with approval-ready inputs",
      "Single-company rollout path",
      "Implementation guidance and onboarding support",
    ],
  },
  {
    name: "Growth",
    audience: "Mid-sized companies expanding across functions",
    price: "Custom annual pricing",
    implementation: "Guided phased rollout",
    featured: true,
    summary: "Extend HR and payroll into finance, procurement, reporting, and multi-branch coordination.",
    points: [
      "Everything in Core",
      "Finance, procurement, inventory, help desk",
      "Multi-branch workflows and approval matrix",
      "Role-based dashboards and reporting",
    ],
  },
  {
    name: "Enterprise",
    audience: "Multi-entity organizations with governance complexity",
    price: "Tailored commercial model",
    implementation: "Solution-led deployment",
    summary: "Bring departments, branches, projects, and leadership reporting into one governed platform with deeper rollout support.",
    points: [
      "Everything in Growth",
      "Multi-company and tenant-aware operating model",
      "Advanced workflow, audit, and integration support",
      "Dedicated solution planning and rollout architecture",
    ],
  },
];

export const comparisonRows: ComparisonRow[] = [
  { capability: "Automation", excel: "Manual formulas and follow-up", traditional: "Partial workflows across modules", uabindia: "End-to-end workflows with approvals and alerts" },
  { capability: "Security", excel: "Weak sharing and access control", traditional: "Depends on custom implementation", uabindia: "Role-based access, audit logs, and secure login by default" },
  { capability: "Cloud", excel: "Not designed for governed cloud operations", traditional: "Often hybrid or infrastructure-heavy", uabindia: "Secure cloud-first deployment with multi-entity access" },
  { capability: "Reports", excel: "Manual reports and delayed packs", traditional: "Static reports by department", uabindia: "Real-time dashboards across people, finance, and operations" },
  { capability: "Scalability", excel: "Breaks with branch and user growth", traditional: "Costly to extend and maintain", uabindia: "Phased rollout across branches, entities, and new modules" },
  { capability: "Support", excel: "No structured support path", traditional: "Vendor dependent and fragmented", uabindia: "Product, rollout, and post-go-live support alignment" },
  { capability: "Approval Workflow", excel: "Calls, email, and chats", traditional: "Limited or rigid workflow rules", uabindia: "Approval matrix with role-aware routing and escalations" },
  { capability: "Mobile", excel: "No workflow mobility", traditional: "Inconsistent mobile coverage", uabindia: "ESS, approvals, attendance, and field actions on mobile" },
  { capability: "AI Ready", excel: "No architecture for intelligent automation", traditional: "Often retrofit only", uabindia: "AI-ready architecture with structured data across modules" },
];

export const testimonials: Testimonial[] = [];

export const resources: ResourceCard[] = [
  {
    title: "ERP Rollout Planning Guide",
    type: "Playbook",
    summary: "A practical framework for sequencing HRMS, payroll, finance, and operations rollout without overwhelming teams.",
    href: "/book-demo",
  },
  {
    title: "Attendance to Payroll Readiness Checklist",
    type: "Checklist",
    summary: "Know which data, rules, and approvals must be right before salary runs go live.",
    href: "/contact",
  },
  {
    title: "Healthcare Operations Workflow Brief",
    type: "Industry Note",
    summary: "See how hospitals and healthcare groups structure workforce, support, and approval operations on one platform.",
    href: "/industries/healthcare",
  },
  {
    title: "Manufacturing Control Blueprint",
    type: "Operational Guide",
    summary: "A compact reference for connecting plant attendance, procurement, stores, and reporting in one system.",
    href: "/industries/manufacturing",
  },
  {
    title: "Executive ERP Evaluation Questions",
    type: "Decision Aid",
    summary: "Questions leadership teams should ask before selecting an ERP partner for a phased deployment.",
    href: "/pricing",
  },
  {
    title: "Book a Product Walkthrough",
    type: "Live Session",
    summary: "Review your current process gaps and see the recommended module mix with a guided demo.",
    href: "/book-demo",
  },
];

export const frequentlyAskedQuestions: FaqItem[] = [
  { question: "What is UabIndia ERP?", answer: "UabIndia ERP is a cloud platform for HR, payroll, attendance, finance, procurement, inventory, CRM, projects, assets, help desk, and reporting in one secure operating system." },
  { question: "Who is the platform built for?", answer: "It is designed for small businesses, medium businesses, enterprises, hospitals, manufacturing, retail, education, logistics, NGOs, government projects, and service organizations." },
  { question: "Can we start with only HRMS and payroll?", answer: "Yes. Many teams launch with HRMS, attendance, leave, and payroll first, then expand into finance, procurement, or inventory later." },
  { question: "Does it support multi-company operations?", answer: "Yes. The platform is structured for multi-company, multi-branch, and multi-tenant operating models." },
  { question: "Can different roles see different modules?", answer: "Yes. Role-based access controls determine which users can view pages, approvals, reports, and actions." },
  { question: "Is employee self service included?", answer: "Yes. Employees can use ESS flows for attendance, leave, payslips, and other workspace actions depending on rollout scope." },
  { question: "Can attendance connect to biometrics or GPS?", answer: "Yes. The design supports biometric integration, GPS attendance, geo fencing, and face recognition workflows." },
  { question: "How does payroll connect with attendance?", answer: "Attendance, leave, overtime, and other salary inputs can feed into payroll processing for better cycle control." },
  { question: "Does the system support approvals?", answer: "Yes. Approval matrices and workflow routing can be configured for HR, finance, procurement, and other operating actions." },
  { question: "Can we manage procurement and inventory together?", answer: "Yes. Purchase requests, POs, GRN, warehouses, stock movement, and adjustments can work in one flow." },
  { question: "Do you support project-driven organizations?", answer: "Yes. The platform includes project management support and is suited for construction, NGOs, consulting, and other project-led teams." },
  { question: "What reporting capabilities are available?", answer: "Reporting spans workforce, payroll, finance, procurement, inventory, approvals, and leadership dashboards." },
  { question: "Can the platform work for hospitals?", answer: "Yes. It is well suited for hospitals and healthcare projects that need staffing control, attendance discipline, payroll, and procurement visibility." },
  { question: "How secure is the platform?", answer: "The system is built around role-based access, audit awareness, workflow control, and tenant-aware access patterns." },
  { question: "Is there mobile support?", answer: "Yes. Mobile use cases can include ESS, attendance, approvals, notifications, and field workforce actions." },
  { question: "Can the product be customized by industry?", answer: "Yes. The same core product can be configured differently based on industry workflows, approval depth, and rollout priorities." },
  { question: "How long does implementation take?", answer: "Implementation timelines depend on the scope, modules, migration complexity, and number of entities or branches involved." },
  { question: "Do you provide onboarding support?", answer: "Yes. Rollout planning, solution guidance, and onboarding support are part of the implementation approach." },
  { question: "Can we migrate from spreadsheets or older ERP tools?", answer: "Yes. Many deployments are designed specifically to replace spreadsheet-driven processes or fragmented legacy systems." },
  { question: "How do we request a demo?", answer: "Use the Book Demo or Contact page and share your business context, employee size, and module priorities." },
];

export const companyValues = [
  {
    title: "Operational clarity",
    description: "Every workflow should make accountability clearer, not more obscure.",
  },
  {
    title: "Enterprise discipline",
    description: "Strong design means approvals, reporting, and access control stay reliable as teams grow.",
  },
  {
    title: "Phased transformation",
    description: "Good ERP adoption happens in deliberate stages, with measurable business outcomes at each step.",
  },
  {
    title: "Human-centered software",
    description: "Employees, managers, finance teams, and leadership should all understand how to move work forward.",
  },
];

export const companyMilestones = [
  {
    year: "01",
    title: "Map the operating model",
    description: "We start with real workflows, not a generic module dump.",
  },
  {
    year: "02",
    title: "Prioritize the highest-friction processes",
    description: "HR, payroll, approvals, finance, and procurement usually deliver the fastest business value.",
  },
  {
    year: "03",
    title: "Roll out with governance in place",
    description: "Access, approvals, auditability, and reporting structure are built into the launch plan.",
  },
  {
    year: "04",
    title: "Expand without redesigning operations",
    description: "The same platform can grow from a focused deployment into a broader enterprise operating layer.",
  },
];

export const demoAgenda = [
  "Review your current system gaps and manual handoffs",
  "Recommend the right module sequence for your rollout",
  "Show role-based dashboards, approvals, and reporting paths",
  "Discuss implementation scope, timelines, and support model",
];

export const supportLanes = [
  "Sales and solution consulting for product fit and rollout planning",
  "Implementation guidance for phase-wise deployment and migration readiness",
  "Post-go-live support for usage, issue resolution, and workflow optimization",
];

export function getMarketingModule(slug: string) {
  return marketingModules.find((module) => module.slug === slug);
}

export function getMarketingIndustry(slug: string) {
  return marketingIndustries.find((industry) => industry.slug === slug);
}

export function getRecommendedModules(slugs: string[]) {
  return slugs
    .map((slug) => getMarketingModule(slug))
    .filter((module): module is MarketingModule => Boolean(module));
}
