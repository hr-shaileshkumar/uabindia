/**
 * UAB India No-Code Visual Website Builder - Core Type System
 * Provides unified schema for client-customized public website blocks,
 * Canva-style branding parameters, and deep ERP/HRMS bridges.
 */

export type BlockType =
  | "hero"
  | "services"
  | "features"
  | "testimonials"
  | "team"
  | "pricing"
  | "faq"
  | "stats"
  | "cta"
  | "crm_contact"
  | "ats_careers"
  | "product_catalog"
  | "custom_html";

export type BlockAlignment = "left" | "center" | "right";
export type BlockPaddingY = "compact" | "normal" | "spacious";
export type BlockContainerWidth = "boxed" | "standard" | "full";

export interface BaseBlockStyle {
  backgroundType: "transparent" | "solid" | "gradient" | "glass" | "image";
  backgroundColor?: string;
  backgroundGradient?: string;
  backgroundImageUrl?: string;
  textColor?: string;
  paddingY: BlockPaddingY;
  containerWidth: BlockContainerWidth;
  alignment: BlockAlignment;
  borderRadius?: "none" | "md" | "xl" | "2xl";
  borderVisible?: boolean;
}

export interface HeroBlockData {
  eyebrow?: string;
  title: string;
  subtitle: string;
  primaryCtaLabel?: string;
  primaryCtaHref?: string;
  secondaryCtaLabel?: string;
  secondaryCtaHref?: string;
  badgeText?: string;
  trustPills?: string[];
  mediaType?: "none" | "image" | "video";
  mediaUrl?: string;
}

export interface ServiceItem {
  id: string;
  title: string;
  description: string;
  iconName?: string;
  linkHref?: string;
  badge?: string;
  priceNote?: string;
}

export interface ServicesBlockData {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  columns: 2 | 3 | 4;
  items: ServiceItem[];
}

export interface FeatureItem {
  id: string;
  title: string;
  description: string;
  iconName?: string;
  highlight?: string;
}

export interface FeaturesBlockData {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  layout: "grid" | "alternating" | "cards";
  items: FeatureItem[];
}

export interface TestimonialItem {
  id: string;
  authorName: string;
  authorRole: string;
  companyName: string;
  avatarUrl?: string;
  quote: string;
  rating: number; // 1-5
}

export interface TestimonialsBlockData {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  layout: "grid" | "carousel";
  items: TestimonialItem[];
}

export interface TeamMemberItem {
  id: string;
  name: string;
  role: string;
  department?: string;
  avatarUrl?: string;
  bio?: string;
  linkedinUrl?: string;
  email?: string;
}

export interface TeamBlockData {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  columns: 3 | 4;
  items: TeamMemberItem[];
}

export interface PricingPlanItem {
  id: string;
  name: string;
  price: string;
  period: string; // e.g. "/month", "/year", "one-time"
  description: string;
  features: string[];
  ctaLabel: string;
  ctaHref: string;
  isPopular?: boolean;
}

export interface PricingBlockData {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  billingToggleEnabled?: boolean;
  items: PricingPlanItem[];
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category?: string;
}

export interface FaqBlockData {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  searchEnabled?: boolean;
  items: FaqItem[];
}

export interface StatItem {
  id: string;
  value: string; // e.g. "99.9%", "50K+", "150+"
  label: string;
  sublabel?: string;
}

export interface StatsBlockData {
  eyebrow?: string;
  title?: string;
  columns: 2 | 3 | 4;
  items: StatItem[];
}

export interface CtaBlockData {
  eyebrow?: string;
  title: string;
  subtitle: string;
  primaryCtaLabel: string;
  primaryCtaHref: string;
  secondaryCtaLabel?: string;
  secondaryCtaHref?: string;
  cardStyle?: "gradient" | "glass" | "solid";
}

// ── ERP CRM Bridge Block ──────────────────────────────────
export interface CrmContactBlockData {
  eyebrow?: string;
  title: string;
  subtitle: string;
  companyNameField: boolean;
  phoneField: boolean;
  serviceCategoryField: boolean;
  serviceCategories?: string[];
  submitButtonLabel: string;
  successMessage: string;
  destinationModule: "crm_leads"; // Logs directly into ERP CRM
  contactCards?: {
    email?: string;
    phone?: string;
    address?: string;
    businessHours?: string;
  };
}

// ── HRMS Recruitment Bridge Block ─────────────────────────
export interface AtsCareersBlockData {
  eyebrow?: string;
  title: string;
  subtitle: string;
  showJobTracker: boolean;
  allowGeneralApplication: boolean;
  emptyStateText?: string;
  destinationModule: "hrms_recruitment"; // Submissions land directly in HRMS ATS
}

// ── ERP Product / Inventory Bridge Block ──────────────────
export interface ProductCatalogBlockData {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  showCategories: boolean;
  inquiryAction: "whatsapp" | "inquiry_modal" | "quotation";
  priceVisibility: "always" | "on_request" | "hidden";
  items?: {
    id: string;
    title: string;
    category: string;
    description: string;
    imageUrl?: string;
    price?: string;
    stockStatus?: "in_stock" | "made_to_order" | "quote_only";
  }[];
}

export interface CustomHtmlBlockData {
  htmlContent: string;
  containerHeight?: string;
}

export type BlockDataUnion =
  | { type: "hero"; data: HeroBlockData }
  | { type: "services"; data: ServicesBlockData }
  | { type: "features"; data: FeaturesBlockData }
  | { type: "testimonials"; data: TestimonialsBlockData }
  | { type: "team"; data: TeamBlockData }
  | { type: "pricing"; data: PricingBlockData }
  | { type: "faq"; data: FaqBlockData }
  | { type: "stats"; data: StatsBlockData }
  | { type: "cta"; data: CtaBlockData }
  | { type: "crm_contact"; data: CrmContactBlockData }
  | { type: "ats_careers"; data: AtsCareersBlockData }
  | { type: "product_catalog"; data: ProductCatalogBlockData }
  | { type: "custom_html"; data: CustomHtmlBlockData };

export interface WebsiteBlock {
  id: string;
  type: BlockType;
  title: string;
  style: BaseBlockStyle;
  data: any; // Type-narrowed based on type property
  isVisible: boolean;
}

// ── Canva-Style Visual Theme Configuration ────────────────
export interface WebsiteThemeStudioConfig {
  fontFamily: "Inter" | "Plus Jakarta Sans" | "Outfit" | "Playfair Display" | "Space Grotesk";
  colorMode: "single" | "gradient" | "duo";
  primaryColor: string;
  secondaryColor?: string;
  accentColor?: string;
  gradientPreset?: "aurora" | "sunset" | "ocean" | "cosmic" | "emerald_breeze" | "cyber_neon" | "custom";
  customGradientCss?: string;
  buttonBorderRadius: "rounded-md" | "rounded-xl" | "rounded-full";
  cardBorderRadius: "rounded-lg" | "rounded-2xl" | "rounded-3xl";
  headerStyle: "minimal" | "floating-glass" | "solid-brand";
  footerStyle: "mega" | "minimal-clean" | "brand-accent";
}

export interface CustomPageDefinition {
  id: string;
  slug: string;
  title: string;
  description?: string;
  theme: WebsiteThemeStudioConfig;
  blocks: WebsiteBlock[];
  updatedAt: string;
}
