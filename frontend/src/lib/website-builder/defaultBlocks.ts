import { WebsiteBlock, BlockType, WebsiteThemeStudioConfig } from "./types";

export const DEFAULT_THEME_STUDIO_CONFIG: WebsiteThemeStudioConfig = {
  fontFamily: "Plus Jakarta Sans",
  colorMode: "gradient",
  primaryColor: "#2563eb",
  secondaryColor: "#4f46e5",
  accentColor: "#06b6d4",
  gradientPreset: "aurora",
  buttonBorderRadius: "rounded-full",
  cardBorderRadius: "rounded-2xl",
  headerStyle: "floating-glass",
  footerStyle: "mega",
};

export function createDefaultBlock(type: BlockType, index = 1): WebsiteBlock {
  const id = `block_${type}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  switch (type) {
    case "hero":
      return {
        id,
        type: "hero",
        title: "Hero Banner",
        isVisible: true,
        style: {
          backgroundType: "gradient",
          paddingY: "spacious",
          containerWidth: "standard",
          alignment: "center",
          borderRadius: "none",
        },
        data: {
          eyebrow: "NEXT-GENERATION ENTERPRISE",
          title: "Empowering Modern Business with Intelligent Operations",
          subtitle:
            "Seamlessly unify your workflow, client engagements, and enterprise resources through our sovereign digital cloud ecosystem.",
          primaryCtaLabel: "Explore Solutions",
          primaryCtaHref: "#services",
          secondaryCtaLabel: "Contact Advisory",
          secondaryCtaHref: "#contact",
          badgeText: "Verified Enterprise Partner",
          trustPills: ["SOC-2 Certified", "ISO 27001", "24/7 Priority SLA"],
        },
      };

    case "services":
      return {
        id,
        type: "services",
        title: "Core Services Grid",
        isVisible: true,
        style: {
          backgroundType: "transparent",
          paddingY: "normal",
          containerWidth: "standard",
          alignment: "center",
        },
        data: {
          eyebrow: "WHAT WE DELIVER",
          title: "Comprehensive Solutions for Enterprise Growth",
          subtitle: "Engineered specifically to solve high-complexity operational hurdles.",
          columns: 3,
          items: [
            {
              id: "srv_1",
              title: "Strategic Consulting",
              description: "Architectural alignment and business process re-engineering for peak efficiency.",
              iconName: "TrendingUp",
              priceNote: "Custom Proposal",
            },
            {
              id: "srv_2",
              title: "Digital Cloud Infrastructure",
              description: "High-concurrency cloud computing with automated failover and sovereign data isolation.",
              iconName: "Cloud",
              badge: "Popular",
              priceNote: "SLA Guaranteed",
            },
            {
              id: "srv_3",
              title: "Enterprise Compliance & Audit",
              description: "Statutory multi-jurisdiction compliance monitoring with automated regulatory reporting.",
              iconName: "ShieldCheck",
              priceNote: "Annual Retainer",
            },
          ],
        },
      };

    case "features":
      return {
        id,
        type: "features",
        title: "Key Capabilities",
        isVisible: true,
        style: {
          backgroundType: "solid",
          paddingY: "normal",
          containerWidth: "standard",
          alignment: "left",
        },
        data: {
          eyebrow: "CORE ADVANTAGES",
          title: "Why Market Leaders Choose Our Enterprise Stack",
          subtitle: "Designed from first principles to scale effortlessly with your volume.",
          layout: "grid",
          items: [
            {
              id: "feat_1",
              title: "Instant Live Synchronization",
              description: "Every transaction, lead, and employee request reflects across the ecosystem in real-time.",
              iconName: "Zap",
            },
            {
              id: "feat_2",
              title: "Zero Data Leakage Guarantee",
              description: "Air-gapped tenant boundary isolation with dedicated database encryption keys.",
              iconName: "Lock",
            },
            {
              id: "feat_3",
              title: "Automated Ledger Reconciliations",
              description: "Auto-reconciles bank feeds, GST, and payroll vouchers without human error.",
              iconName: "CheckCircle2",
            },
            {
              id: "feat_4",
              title: "Global Multi-Currency Engine",
              description: "Transact seamlessly across INR, USD, EUR, and AED with live treasury FX valuation.",
              iconName: "Globe",
            },
          ],
        },
      };

    case "stats":
      return {
        id,
        type: "stats",
        title: "Impact Metrics",
        isVisible: true,
        style: {
          backgroundType: "glass",
          paddingY: "normal",
          containerWidth: "standard",
          alignment: "center",
          borderRadius: "2xl",
        },
        data: {
          eyebrow: "PROVEN TRACK RECORD",
          title: "Driving Measurable Value at Scale",
          columns: 4,
          items: [
            { id: "stat_1", value: "99.99%", label: "System Uptime", sublabel: "Guaranteed SLA" },
            { id: "stat_2", value: "10M+", label: "Transactions Processed", sublabel: "Monthly Volume" },
            { id: "stat_3", value: "150+", label: "Global Enterprise Clients", sublabel: "Across 8 Sectors" },
            { id: "stat_4", value: "4.9/5", label: "Client Satisfaction", sublabel: "Verified Feedback" },
          ],
        },
      };

    case "testimonials":
      return {
        id,
        type: "testimonials",
        title: "Client Testimonials",
        isVisible: true,
        style: {
          backgroundType: "transparent",
          paddingY: "normal",
          containerWidth: "standard",
          alignment: "center",
        },
        data: {
          eyebrow: "SUCCESS STORIES",
          title: "Trusted by Industry Leaders",
          subtitle: "Read what executives say about partnering with our platform.",
          layout: "grid",
          items: [
            {
              id: "test_1",
              authorName: "Rajesh Malhotra",
              authorRole: "Managing Director",
              companyName: "Zenith Infotech Ltd",
              quote:
                "Consolidating our operations into this unified platform cut our monthly cycle times by 40% and gave us complete clarity.",
              rating: 5,
            },
            {
              id: "test_2",
              authorName: "Dr. Ananya Sen",
              authorRole: "Chief Medical Administrator",
              companyName: "Bavya Health Services",
              quote:
                "The patient portal and public web presence paired with automated backend HRMS reduced our overhead drastically.",
              rating: 5,
            },
            {
              id: "test_3",
              authorName: "Vikram Singhania",
              authorRole: "Head of Operations",
              companyName: "Apex Logistics India",
              quote:
                "The instant CRM lead capturing directly connected to our sales quotas transformed how our branch teams execute.",
              rating: 5,
            },
          ],
        },
      };

    case "team":
      return {
        id,
        type: "team",
        title: "Leadership & Team",
        isVisible: true,
        style: {
          backgroundType: "transparent",
          paddingY: "normal",
          containerWidth: "standard",
          alignment: "center",
        },
        data: {
          eyebrow: "OUR LEADERSHIP",
          title: "The Visionaries Behind Our Growth",
          subtitle: "Decades of cross-industry expertise dedicated to your success.",
          columns: 3,
          items: [
            {
              id: "team_1",
              name: "Amitabh Verma",
              role: "Chief Executive Officer",
              department: "Executive Board",
              bio: "20+ years driving enterprise digital transformation across Asia and Europe.",
            },
            {
              id: "team_2",
              name: "Pooja Hegde",
              role: "Chief Technology Officer",
              department: "Engineering & Architecture",
              bio: "Distributed systems specialist, former systems architect at Fortune 500 tech labs.",
            },
            {
              id: "team_3",
              name: "Saurabh Mukherjee",
              role: "Head of Client Solutions",
              department: "Client Services",
              bio: "Passionate about enterprise operational excellence and rapid solution adoption.",
            },
          ],
        },
      };

    case "pricing":
      return {
        id,
        type: "pricing",
        title: "Transparent Pricing",
        isVisible: true,
        style: {
          backgroundType: "transparent",
          paddingY: "spacious",
          containerWidth: "standard",
          alignment: "center",
        },
        data: {
          eyebrow: "FLEXIBLE PLANS",
          title: "Predictable Investment for Every Stage",
          subtitle: "No hidden surprise fees. Scale your tier as your business expands.",
          billingToggleEnabled: true,
          items: [
            {
              id: "price_1",
              name: "Starter Business",
              price: "₹1,999",
              period: "/month",
              description: "Perfect for emerging companies establishing their professional presence.",
              features: ["Up to 15 Team Members", "Core Financial Ledger", "Standard Public Website", "Email Support"],
              ctaLabel: "Get Started",
              ctaHref: "#contact",
              isPopular: false,
            },
            {
              id: "price_2",
              name: "Growth Enterprise",
              price: "₹4,999",
              period: "/month",
              description: "Designed for scaling mid-market businesses requiring advanced automation.",
              features: [
                "Up to 100 Team Members",
                "Full HRMS, Payroll & Statutory Tax",
                "Visual Website Builder & Custom Branding",
                "Integrated CRM & ATS Career Hub",
                "Priority 4-Hour Support SLA",
              ],
              ctaLabel: "Launch Free Trial",
              ctaHref: "#contact",
              isPopular: true,
            },
            {
              id: "price_3",
              name: "Custom Corporate",
              price: "Custom",
              period: "Annual",
              description: "Dedicated sovereign deployment with custom workflows and integrations.",
              features: [
                "Unlimited Users & Branches",
                "Dedicated Private Cloud / Tenant DB",
                "White-label Custom Apex Domain",
                "Dedicated Solutions Architect",
                "24/7 Phone & On-site SLA",
              ],
              ctaLabel: "Speak With Advisory",
              ctaHref: "#contact",
              isPopular: false,
            },
          ],
        },
      };

    case "faq":
      return {
        id,
        type: "faq",
        title: "Frequently Asked Questions",
        isVisible: true,
        style: {
          backgroundType: "solid",
          paddingY: "normal",
          containerWidth: "standard",
          alignment: "left",
        },
        data: {
          eyebrow: "COMMON INQUIRIES",
          title: "Everything You Need to Know",
          subtitle: "Clear answers to frequent questions about our platform and services.",
          searchEnabled: true,
          items: [
            {
              id: "faq_1",
              question: "How long does it take to migrate to your platform?",
              answer:
                "Standard onboarding takes less than 24 hours. Our automated migration tool imports existing masters, ledgers, and employee databases seamlessly.",
            },
            {
              id: "faq_2",
              question: "Is our business data isolated and compliant with Indian regulations?",
              answer:
                "Yes, 100%. We comply strictly with the DPDPA 2023 and RBI data localization mandates. Every tenant receives isolated cryptographic database encryption.",
            },
            {
              id: "faq_3",
              question: "Can we connect our own custom domain (e.g. company.com)?",
              answer:
                "Absolutely! You can map any custom domain via a simple CNAME record, complete with automatic free SSL security certificates.",
            },
          ],
        },
      };

    case "cta":
      return {
        id,
        type: "cta",
        title: "Call to Action Banner",
        isVisible: true,
        style: {
          backgroundType: "gradient",
          paddingY: "normal",
          containerWidth: "standard",
          alignment: "center",
          borderRadius: "2xl",
        },
        data: {
          eyebrow: "READY TO TRANSFORM?",
          title: "Take Your Enterprise to the Next Level Today",
          subtitle: "Join over 150+ thriving organizations powering their operations on our cloud.",
          primaryCtaLabel: "Schedule Live Architecture Tour",
          primaryCtaHref: "#contact",
          secondaryCtaLabel: "View Case Studies",
          secondaryCtaHref: "/about",
          cardStyle: "gradient",
        },
      };

    case "crm_contact":
      return {
        id,
        type: "crm_contact",
        title: "CRM Lead Capture Form (Direct ERP Bridge)",
        isVisible: true,
        style: {
          backgroundType: "transparent",
          paddingY: "normal",
          containerWidth: "standard",
          alignment: "left",
        },
        data: {
          eyebrow: "START THE CONVERSATION",
          title: "Connect with our Solutions Team",
          subtitle: "Fill out the inquiry form below and an enterprise architect will reach out within 4 business hours.",
          companyNameField: true,
          phoneField: true,
          serviceCategoryField: true,
          serviceCategories: ["Enterprise ERP", "HRMS & Payroll", "Cloud Migration", "Custom Development", "Support"],
          submitButtonLabel: "Submit Enterprise Inquiry",
          successMessage: "Thank you! Your inquiry has been routed directly to our CRM desk. Reference ticket created.",
          destinationModule: "crm_leads",
          contactCards: {
            email: "contact@company.com",
            phone: "+91 98765 43210",
            address: "Cyber City, DLF Phase 2, Gurugram, NCR Delhi",
            businessHours: "Mon - Sat: 9:00 AM - 7:00 PM IST",
          },
        },
      };

    case "ats_careers":
      return {
        id,
        type: "ats_careers",
        title: "HRMS Recruitment ATS Hub",
        isVisible: true,
        style: {
          backgroundType: "transparent",
          paddingY: "normal",
          containerWidth: "standard",
          alignment: "center",
        },
        data: {
          eyebrow: "JOIN OUR TALENT NETWORK",
          title: "Build the Future of Enterprise Solutions With Us",
          subtitle: "Explore open career opportunities across Engineering, Finance, Operations, and Product.",
          showJobTracker: true,
          allowGeneralApplication: true,
          emptyStateText: "No active vacancies at this moment. You may submit a general profile for future opportunities.",
          destinationModule: "hrms_recruitment",
        },
      };

    case "product_catalog":
      return {
        id,
        type: "product_catalog",
        title: "Products & Inventory Showcase",
        isVisible: true,
        style: {
          backgroundType: "transparent",
          paddingY: "normal",
          containerWidth: "standard",
          alignment: "center",
        },
        data: {
          eyebrow: "OUR PRODUCT OFFERINGS",
          title: "Enterprise Solutions & Hardware Catalog",
          subtitle: "Explore certified enterprise equipment, software licenses, and advisory packages.",
          showCategories: true,
          inquiryAction: "quotation",
          priceVisibility: "on_request",
          items: [
            {
              id: "prod_1",
              title: "Enterprise Biometric Access Terminal",
              category: "Hardware & Telemetry",
              description: "AI-powered facial recognition & optical fingerprint terminal with offline storage.",
              price: "₹18,500",
              stockStatus: "in_stock",
            },
            {
              id: "prod_2",
              title: "Cloud Backup Vault Gateway",
              category: "Infrastructure",
              description: "High-throughput encrypted storage bridge for real-time ledger snapshots.",
              price: "₹34,000",
              stockStatus: "in_stock",
            },
            {
              id: "prod_3",
              title: "Custom Integration Middleware",
              category: "Software",
              description: "Dedicated webhook bridge for bank connectivity and custom legacy systems.",
              price: "Quotation Only",
              stockStatus: "quote_only",
            },
          ],
        },
      };

    case "custom_html":
      return {
        id,
        type: "custom_html",
        title: "Custom Embed / Widget",
        isVisible: true,
        style: {
          backgroundType: "transparent",
          paddingY: "compact",
          containerWidth: "standard",
          alignment: "center",
        },
        data: {
          htmlContent: `<div class="rounded-2xl border border-dashed border-blue-300 dark:border-blue-800 p-8 text-center text-sm text-slate-500">
  <p class="font-bold text-slate-700 dark:text-slate-300">Custom Embed Block</p>
  <p class="text-xs text-slate-400 mt-1">Insert Google Maps iframe, Calendly booking widget, or custom analytics.</p>
</div>`,
          containerHeight: "auto",
        },
      };

    default:
      throw new Error(`Unsupported block type: ${type}`);
  }
}

export function getDefaultStarterBlocks(): WebsiteBlock[] {
  return [
    createDefaultBlock("hero"),
    createDefaultBlock("features"),
    createDefaultBlock("services"),
    createDefaultBlock("stats"),
    createDefaultBlock("testimonials"),
    createDefaultBlock("faq"),
    createDefaultBlock("crm_contact"),
    createDefaultBlock("cta"),
  ];
}
