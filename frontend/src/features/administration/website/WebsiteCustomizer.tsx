"use client";

import React, { useEffect, useState } from "react";
import {
  Globe,
  Palette,
  Sparkles,
  Layout,
  BellRing,
  CheckCircle2,
  ExternalLink,
  Save,
  RotateCcw,
  Check,
  Eye,
  Smartphone,
  Monitor,
  Building2,
  UsersRound,
  WalletCards,
  LifeBuoy,
  ShieldCheck,
  ArrowRight,
  HelpCircle,
  MessageSquareQuote,
  Layers,
  ShoppingCart,
  Plus,
  Trash2,
  Star,
  MapPin,
  SlidersHorizontal,
  Building,
  Navigation,
  Wand2,
  Search,
  Users,
  Share2,
} from "lucide-react";
import apiClient from "@/services/apiClient";
import { notifyError, notifySuccess } from "@/lib/notifications";
import { cn } from "@/lib/utils";
import MediaUploadDropzone from "@/components/ui/MediaUploadDropzone";
import IndustryTemplatesGallery from "./IndustryTemplatesGallery";
import type { IndustryTemplatePreset } from "./industryTemplatePresets";

type CustomizerTab =
  | "templates"
  | "hero"
  | "carousel"
  | "branding"
  | "blocks"
  | "locations"
  | "storefront"
  | "seo"
  | "leads"
  | "announcement"
  | "quickAccess";

const COLOR_PRESETS = [
  { name: "Sapphire Blue", primary: "#2563eb", accent: "#3b82f6" },
  { name: "Royal Navy", primary: "#1e3a8a", accent: "#3b82f6" },
  { name: "Emerald Green", primary: "#065f46", accent: "#10b981" },
  { name: "Crimson Maroon", primary: "#881337", accent: "#f43f5e" },
  { name: "Midnight Slate", primary: "#0f172a", accent: "#6366f1" },
  { name: "Modern Indigo", primary: "#4f46e5", accent: "#818cf8" },
];

export default function WebsiteCustomizer({ defaultTab = "hero" }: { defaultTab?: CustomizerTab }) {
  const [activeTab, setActiveTab] = useState<CustomizerTab>(defaultTab);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");

  // Branding State
  const [brandName, setBrandName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#2563eb");
  const [accentColor, setAccentColor] = useState("#3b82f6");
  const [supportPhone, setSupportPhone] = useState("+91 7903055384");
  const [supportEmail, setSupportEmail] = useState("support@uabindia.in");

  // Hero & Content State
  const [eyebrow, setEyebrow] = useState("");
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [primaryCtaLabel, setPrimaryCtaLabel] = useState("Sign In");
  const [primaryCtaHref, setPrimaryCtaHref] = useState("/login");
  const [secondaryCtaLabel, setSecondaryCtaLabel] = useState("Contact Support");
  const [secondaryCtaHref, setSecondaryCtaHref] = useState("/contact");
  const [trustPillsText, setTrustPillsText] = useState("Employee Access, Self-Service HR, Secure Login");

  // Announcement State
  const [announcementEnabled, setAnnouncementEnabled] = useState(false);
  const [announcementText, setAnnouncementText] = useState("");

  // Quick Access Services
  const [showQuickAccess, setShowQuickAccess] = useState(true);
  const [quickTile1Title, setQuickTile1Title] = useState("Employee self-service");
  const [quickTile1Desc, setQuickTile1Desc] = useState("Login, mark attendance, request leaves, and review daily updates.");
  const [quickTile2Title, setQuickTile2Title] = useState("Payroll & compensation");
  const [quickTile2Desc, setQuickTile2Desc] = useState("View monthly payslips, tax calculations, and compensation structure.");
  const [quickTile3Title, setQuickTile3Title] = useState("Helpdesk & support");
  const [quickTile3Desc, setQuickTile3Desc] = useState("Raise operational, HR, or technical tickets directly to support.");
  const [quickTile4Title, setQuickTile4Title] = useState("Corporate portal");
  const [quickTile4Desc, setQuickTile4Desc] = useState("Company policies, verified directory, and official notices.");

  // Highlights
  const [showHighlights, setShowHighlights] = useState(true);
  const [highlight1, setHighlight1] = useState("View and download monthly payslips and tax declarations");
  const [highlight2, setHighlight2] = useState("Apply for leaves, track approvals, and review shift schedules");
  const [highlight3, setHighlight3] = useState("Read real-time organizational circulars and announcements");
  const [highlight4, setHighlight4] = useState("Submit helpdesk queries and IT service tickets securely");

  // Enterprise Blocks State
  const [faqs, setFaqs] = useState<{ question: string; answer: string; category?: string }[]>([
    { question: "How does multi-tenant data sovereignty work in UabIndia ERP?", answer: "Each tenant workspace runs isolated schema partitioning with dedicated encryption keys and ISO-27001 audit logging.", category: "Security" },
    { question: "Can we integrate biometric attendance hardware directly?", answer: "Yes, our attendance engine connects with Essl, ZKTeco, and biometric push APIs with real-time punch synchronization.", category: "HRMS" },
    { question: "Are Indian statutory PF, ESIC, and TDS tax rules pre-configured?", answer: "Yes, all current EPFO wage ceilings (₹15,000), ESIC gross ceilings (₹21,000), and Form 16 / TDS regimes are built-in.", category: "Payroll" },
  ]);
  const [newFaqQ, setNewFaqQ] = useState("");
  const [newFaqA, setNewFaqA] = useState("");

  const [testimonials, setTestimonials] = useState<{ name: string; role: string; company: string; quote: string; rating: number }[]>([
    { name: "Rajesh Malhotra", role: "Chief Operating Officer", company: "Apex Logistics India", quote: "Migrating our multi-location branches to UabIndia ERP cut our month-end payroll and dispatch cycle from 4 days to 45 minutes.", rating: 5 },
    { name: "Pooja Sundaram", role: "VP of Human Capital", company: "NextGen Mobility Corp", quote: "The employee self-service portal and biometric punch sync reduced attendance disputes by over 90%.", rating: 5 },
  ]);
  const [newTestimonialName, setNewTestimonialName] = useState("");
  const [newTestimonialRole, setNewTestimonialRole] = useState("");
  const [newTestimonialCompany, setNewTestimonialCompany] = useState("");
  const [newTestimonialQuote, setNewTestimonialQuote] = useState("");

  const [b2bStorefrontEnabled, setB2bStorefrontEnabled] = useState(true);
  const [storefrontMode, setStorefrontMode] = useState<"rfq" | "direct">("rfq");

  // Header & Footer Custom Appearance
  const [headerStyle, setHeaderStyle] = useState<"clean" | "dark" | "brand" | "glass">("clean");
  const [footerStyle, setFooterStyle] = useState<"dark" | "light" | "brand">("dark");

  // Hero Carousel State
  const [carouselEnabled, setCarouselEnabled] = useState(false);
  const [carouselSlides, setCarouselSlides] = useState<Array<{
    id: string;
    eyebrow?: string;
    title: string;
    subtitle: string;
    badge?: string;
    primaryCtaLabel?: string;
    primaryCtaHref?: string;
    secondaryCtaLabel?: string;
    secondaryCtaHref?: string;
    imageUrl?: string;
  }>>([
    {
      id: "slide-1",
      eyebrow: "NEXT-GEN CLOUD ERP",
      title: "Run HR, payroll, finance, and global operations in one unified system",
      subtitle: "Multi-tenant isolation, role-based workflows, and cross-border statutory compliance.",
      badge: "ENTERPRISE READY",
      primaryCtaLabel: "Sign in",
      primaryCtaHref: "/login",
      imageUrl: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&auto=format&fit=crop&q=80",
    },
    {
      id: "slide-2",
      eyebrow: "B2B COMMERCE & CATALOG",
      title: "Instant Bulk RFQ & Warehouse Inventory Dispatch",
      subtitle: "Browse real-time stock levels, volume discounts, and submit formal quotations.",
      badge: "B2B CATALOG",
      primaryCtaLabel: "Browse Products",
      primaryCtaHref: "/products",
      imageUrl: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&auto=format&fit=crop&q=80",
    },
  ]);
  const [newSlideTitle, setNewSlideTitle] = useState("");
  const [newSlideSubtitle, setNewSlideSubtitle] = useState("");
  const [newSlideEyebrow, setNewSlideEyebrow] = useState("");
  const [newSlideImage, setNewSlideImage] = useState("");

  // Operating Locations State
  const [officeLocatorEnabled, setOfficeLocatorEnabled] = useState(true);
  const [officeLocations, setOfficeLocations] = useState<Array<{
    id: string;
    name: string;
    type: "Headquarters" | "Branch Office" | "Manufacturing Plant" | "Regional Warehouse";
    city: string;
    address: string;
    phone: string;
    email: string;
    workingHours: string;
    mapEmbedUrl: string;
    directionsUrl?: string;
  }>>([
    {
      id: "loc-1",
      name: "Corporate Headquarters",
      type: "Headquarters",
      city: "Mumbai, Maharashtra",
      address: "Level 14, Tower 2, One World Center, Lower Parel, Mumbai 400013",
      phone: "+91 7903055384",
      email: "support@uabindia.in",
      workingHours: "Mon - Sat: 09:30 AM – 06:30 PM",
      mapEmbedUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3771.954203175114!2d72.82772597597148!3d19.00632598218442!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3be7ce886851f50b%3A0xe54fb725efbc6f40!2sOne%20World%20Center!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin",
      directionsUrl: "https://maps.google.com/?q=One+World+Center+Lower+Parel+Mumbai",
    },
  ]);
  const [newLocName, setNewLocName] = useState("");
  const [newLocCity, setNewLocCity] = useState("");
  const [newLocAddress, setNewLocAddress] = useState("");
  const [newLocPhone, setNewLocPhone] = useState("");
  const [newLocMapUrl, setNewLocMapUrl] = useState("");

  // SEO & Social Meta State
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [canonicalUrl, setCanonicalUrl] = useState("");
  const [ogImageUrl, setOgImageUrl] = useState("");
  const [schemaType, setSchemaType] = useState("Corporation");
  const [robotsIndex, setRobotsIndex] = useState(true);

  // Captured Leads State
  const [leads] = useState([
    { id: "lead-1", name: "Ananya Sharma", email: "ananya@tatasolutions.com", phone: "+91 98200-11223", company: "Tata Solutions", type: "Enterprise ERP Inquiry", status: "New", date: "Today, 02:15 PM" },
    { id: "lead-2", name: "Vikram Singhania", email: "vikram@singhaniagroup.in", phone: "+91 99100-44556", company: "Singhania Logistics", type: "Multi-Plant Demo Request", status: "Contacted", date: "Yesterday, 11:30 AM" },
    { id: "lead-3", name: "Dr. Alok Verma", email: "averma@apexmed.org", phone: "+91 97110-88990", company: "Apex Hospitals", type: "Hospital OPD Module", status: "Converted", date: "Nov 20, 04:45 PM" },
  ]);

  const handleApplyPreset = (tpl: IndustryTemplatePreset) => {
    setBrandName(tpl.name);
    setPrimaryColor(tpl.primaryColor);
    setAccentColor(tpl.accentColor);
    setHeaderStyle(tpl.headerStyle);
    setFooterStyle(tpl.footerStyle);
    setEyebrow(tpl.hero.eyebrow);
    setTitle(tpl.hero.title);
    setSubtitle(tpl.hero.subtitle);
    setPrimaryCtaLabel(tpl.hero.primaryCta);
    setSecondaryCtaLabel(tpl.hero.secondaryCta);
    setTrustPillsText(tpl.hero.trustPills);
    if (tpl.slides && tpl.slides.length > 0) {
      setCarouselSlides(tpl.slides);
      setCarouselEnabled(true);
    }
    if (tpl.locations && tpl.locations.length > 0) {
      setOfficeLocations(tpl.locations);
      setOfficeLocatorEnabled(true);
    }
    if (tpl.faqs && tpl.faqs.length > 0) {
      setFaqs(tpl.faqs.map((f) => ({ question: f.q, answer: f.a, category: tpl.industry })));
    }
    if (tpl.seo) {
      setMetaTitle(tpl.seo.metaTitle);
      setMetaDescription(tpl.seo.metaDescription);
      setSchemaType(tpl.seo.schemaType);
    }
    notifySuccess(`Applied ${tpl.name}!`, "Colors, Hero, Slider, Maps, and FAQ populated into live preview.");
    setActiveTab("hero");
  };

  // Load existing data
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setLoading(true);
      try {
        // 1. Fetch Branding
        const brandRes = await apiClient.get<any>("/api/v1/branding/current").catch(() => null);
        if (brandRes?.data && isMounted) {
          const b = brandRes.data;
          setBrandName(b.brandName || b.companyName || "");
          if (b.logoUrl && b.logoUrl !== "/assets/logo.png" && b.logoUrl !== "/logo.png") {
            setLogoUrl(b.logoUrl);
          }
          if (b.primaryColor) setPrimaryColor(b.primaryColor);
          if (b.accentColor) setAccentColor(b.accentColor);
          if (b.supportPhone) setSupportPhone(b.supportPhone);
          if (b.supportEmail) setSupportEmail(b.supportEmail);
        }

        // 2. Fetch Home Page CMS
        const pageRes = await apiClient.get<any>("/api/v1/website/pages/home").catch(() => null);
        if (pageRes?.data && isMounted) {
          const contentJson = pageRes.data.contentJson;
          if (contentJson && contentJson !== "{}") {
            try {
              const c = JSON.parse(contentJson);
              if (c.eyebrow) setEyebrow(c.eyebrow);
              if (c.title) setTitle(c.title);
              if (c.subtitle) setSubtitle(c.subtitle);
              if (c.primaryCtaLabel) setPrimaryCtaLabel(c.primaryCtaLabel);
              if (c.primaryCtaHref) setPrimaryCtaHref(c.primaryCtaHref);
              if (c.secondaryCtaLabel) setSecondaryCtaLabel(c.secondaryCtaLabel);
              if (c.secondaryCtaHref) setSecondaryCtaHref(c.secondaryCtaHref);
              if (Array.isArray(c.trustPills)) setTrustPillsText(c.trustPills.join(", "));

              if (c.announcement) {
                setAnnouncementEnabled(Boolean(c.announcement.enabled));
                setAnnouncementText(c.announcement.text || "");
              }

              if (c.showQuickAccess !== undefined) setShowQuickAccess(Boolean(c.showQuickAccess));
              if (Array.isArray(c.quickAccess)) {
                if (c.quickAccess[0]) {
                  setQuickTile1Title(c.quickAccess[0].title || "");
                  setQuickTile1Desc(c.quickAccess[0].description || "");
                }
                if (c.quickAccess[1]) {
                  setQuickTile2Title(c.quickAccess[1].title || "");
                  setQuickTile2Desc(c.quickAccess[1].description || "");
                }
                if (c.quickAccess[2]) {
                  setQuickTile3Title(c.quickAccess[2].title || "");
                  setQuickTile3Desc(c.quickAccess[2].description || "");
                }
                if (c.quickAccess[3]) {
                  setQuickTile4Title(c.quickAccess[3].title || "");
                  setQuickTile4Desc(c.quickAccess[3].description || "");
                }
              }

              if (c.showHighlights !== undefined) setShowHighlights(Boolean(c.showHighlights));
              if (Array.isArray(c.highlights)) {
                if (c.highlights[0]) setHighlight1(c.highlights[0]);
                if (c.highlights[1]) setHighlight2(c.highlights[1]);
                if (c.highlights[2]) setHighlight3(c.highlights[2]);
                if (c.highlights[3]) setHighlight4(c.highlights[3]);
              }

              if (Array.isArray(c.faqs) && c.faqs.length > 0) setFaqs(c.faqs);
              if (Array.isArray(c.testimonials) && c.testimonials.length > 0) setTestimonials(c.testimonials);
              if (c.b2bStorefront) {
                if (c.b2bStorefront.enabled !== undefined) setB2bStorefrontEnabled(Boolean(c.b2bStorefront.enabled));
                if (c.b2bStorefront.mode) setStorefrontMode(c.b2bStorefront.mode);
              }
              if (c.carousel) {
                if (c.carousel.enabled !== undefined) setCarouselEnabled(Boolean(c.carousel.enabled));
                if (Array.isArray(c.carousel.slides) && c.carousel.slides.length > 0) setCarouselSlides(c.carousel.slides);
              }
              if (c.officeLocator) {
                if (c.officeLocator.enabled !== undefined) setOfficeLocatorEnabled(Boolean(c.officeLocator.enabled));
              }
              if (Array.isArray(c.officeLocations) && c.officeLocations.length > 0) setOfficeLocations(c.officeLocations);
              if (c.headerStyle) setHeaderStyle(c.headerStyle);
              if (c.footerStyle) setFooterStyle(c.footerStyle);
              if (c.seo) {
                if (c.seo.metaTitle) setMetaTitle(c.seo.metaTitle);
                if (c.seo.metaDescription) setMetaDescription(c.seo.metaDescription);
                if (c.seo.canonicalUrl) setCanonicalUrl(c.seo.canonicalUrl);
                if (c.seo.ogImageUrl) setOgImageUrl(c.seo.ogImageUrl);
                if (c.seo.schemaType) setSchemaType(c.seo.schemaType);
                if (c.seo.robotsIndex !== undefined) setRobotsIndex(Boolean(c.seo.robotsIndex));
              }
            } catch {
              // fallback
            }
          }
        }
      } catch (err) {
        console.warn("Could not preload website customization data", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSaveAndPublish = async () => {
    setSaving(true);
    try {
      const pillsArray = trustPillsText
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const homeContent = {
        eyebrow: eyebrow || brandName || "Corporate Workspace",
        title: title || `${brandName || "Company"} Workspace`,
        subtitle:
          subtitle ||
          "Secure login, employee self-service, payroll access, support, and corporate updates in one place.",
        primaryCtaLabel: primaryCtaLabel || "Sign In",
        primaryCtaHref: primaryCtaHref || "/login",
        secondaryCtaLabel: secondaryCtaLabel || "Contact support",
        secondaryCtaHref: secondaryCtaHref || "/contact",
        trustPills: pillsArray.length > 0 ? pillsArray : ["Employee Access", "Self-Service HR", "Secure Login"],
        announcement: {
          enabled: announcementEnabled,
          text: announcementText,
          type: "info",
        },
        showQuickAccess,
        quickAccess: [
          { title: quickTile1Title, description: quickTile1Desc, href: "/login" },
          { title: quickTile2Title, description: quickTile2Desc, href: "/login" },
          { title: quickTile3Title, description: quickTile3Desc, href: "/contact" },
          { title: quickTile4Title, description: quickTile4Desc, href: "/about" },
        ],
        showHighlights,
        highlights: [highlight1, highlight2, highlight3, highlight4].filter(Boolean),
        faqs,
        testimonials,
        b2bStorefront: {
          enabled: b2bStorefrontEnabled,
          mode: storefrontMode,
        },
        carousel: {
          enabled: carouselEnabled,
          slides: carouselSlides,
        },
        officeLocator: {
          enabled: officeLocatorEnabled,
        },
        officeLocations,
        headerStyle,
        footerStyle,
        seo: {
          metaTitle,
          metaDescription,
          canonicalUrl,
          ogImageUrl,
          schemaType,
          robotsIndex,
        },
      };

      // 1. Save Website Page with auto-publish
      await apiClient.put("/api/v1/website/pages/home", {
        title: "Home Page",
        contentJson: JSON.stringify(homeContent),
        publishNow: true,
      });

      // 2. Save Branding & Theme
      await apiClient.put("/api/v1/branding", {
        brandName: brandName || undefined,
        logoUrl: logoUrl || undefined,
        primaryColor,
        accentColor,
        supportPhone: supportPhone || "+91 7903055384",
        supportEmail: supportEmail || "support@uabindia.in",
      });

      notifySuccess("Website & Branding Published!", "Public page updated with zero code. Changes are live immediately.");
    } catch (err: any) {
      notifyError("Failed to save changes", err?.message || "Please verify your input and try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleOpenLiveSite = () => {
    window.open("/?audience=tenant", "_blank");
  };

  const currentDisplayBrand = brandName || "Acme Enterprises";
  const currentDisplayEyebrow = eyebrow || currentDisplayBrand;
  const currentDisplayTitle = title || `${currentDisplayBrand} Workspace`;
  const currentDisplaySubtitle =
    subtitle || "Secure login, employee self-service, payroll access, support, and corporate updates in one place.";
  const currentPills = trustPillsText
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          <span className="text-sm font-medium">Loading website customizer...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-5 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Website & Public Page Customizer
            </h1>
            <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 ring-1 ring-inset ring-emerald-600/20 dark:bg-emerald-950/60 dark:text-emerald-400">
              Zero Code
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Edit your public portal hero text, colors, logo, announcement, and links with instant live preview.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleOpenLiveSite}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
          >
            <ExternalLink className="h-4 w-4" />
            View Live Portal
          </button>

          <button
            type="button"
            onClick={handleSaveAndPublish}
            disabled={saving}
            style={{ backgroundColor: primaryColor }}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold text-white shadow-sm hover:brightness-110 active:scale-[0.98] disabled:opacity-50 transition-all"
          >
            {saving ? (
              <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save & Publish
          </button>
        </div>
      </div>

      {/* Main Grid: Controls on Left, Live Preview on Right */}
      <div className="grid gap-6 lg:grid-cols-12 items-start">
        {/* Controls Column */}
        <div className="lg:col-span-6 space-y-5">
          {/* Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-850">
            {[
              { id: "templates", label: "Templates", icon: Wand2 },
              { id: "hero", label: "Hero & Copy", icon: Layout },
              { id: "carousel", label: "Hero Slider", icon: SlidersHorizontal },
              { id: "branding", label: "Branding", icon: Palette },
              { id: "blocks", label: "FAQ & Reviews", icon: Layers },
              { id: "locations", label: "Offices & Maps", icon: MapPin },
              { id: "storefront", label: "B2B Catalog", icon: ShoppingCart },
              { id: "seo", label: "SEO & Social", icon: Search },
              { id: "leads", label: "Inquiries", icon: Users },
              { id: "announcement", label: "Notice Bar", icon: BellRing },
              { id: "quickAccess", label: "Services", icon: Sparkles },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as CustomizerTab)}
                className={cn(
                  "flex items-center justify-center gap-1.5 rounded-lg py-2 px-1 text-center text-[11px] font-semibold transition-all truncate",
                  activeTab === tab.id
                    ? "bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-white font-bold"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                )}
              >
                <tab.icon className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab 0: Industry Templates */}
          {activeTab === "templates" && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4 dark:border-slate-800 dark:bg-slate-900">
              <div className="border-b border-slate-100 pb-3 dark:border-slate-800">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  1-Click Industry Templates Studio
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Select an industry preset below to automatically configure colors, hero copy, slider images, map locations, and FAQs for your workspace.
                </p>
              </div>

              <IndustryTemplatesGallery onApplyTemplate={handleApplyPreset} />
            </div>
          )}

          {/* Tab 1: Hero & Copy */}
          {activeTab === "hero" && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4 dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Hero Banner Content
              </h2>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Eyebrow / Small Header Text
                </label>
                <input
                  type="text"
                  value={eyebrow}
                  onChange={(e) => setEyebrow(e.target.value)}
                  placeholder="e.g. Acme Technologies Portal"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Main Headline / Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Acme Employee & Partner Workspace"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Subtitle / Tagline
                </label>
                <textarea
                  rows={3}
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="e.g. Secure login, employee self-service, payroll access, support, and corporate updates in one place."
                  className="w-full rounded-xl border border-slate-300 p-3 text-sm text-slate-900 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white resize-none"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Primary Button Label
                  </label>
                  <input
                    type="text"
                    value={primaryCtaLabel}
                    onChange={(e) => setPrimaryCtaLabel(e.target.value)}
                    placeholder="Sign in"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Primary Button Link
                  </label>
                  <input
                    type="text"
                    value={primaryCtaHref}
                    onChange={(e) => setPrimaryCtaHref(e.target.value)}
                    placeholder="/login"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Secondary Button Label
                  </label>
                  <input
                    type="text"
                    value={secondaryCtaLabel}
                    onChange={(e) => setSecondaryCtaLabel(e.target.value)}
                    placeholder="Contact support"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Secondary Button Link
                  </label>
                  <input
                    type="text"
                    value={secondaryCtaHref}
                    onChange={(e) => setSecondaryCtaHref(e.target.value)}
                    placeholder="/contact"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Trust Badges (comma-separated)
                </label>
                <input
                  type="text"
                  value={trustPillsText}
                  onChange={(e) => setTrustPillsText(e.target.value)}
                  placeholder="Employee Access, Self-Service HR, Secure Login"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>
          )}

          {/* Tab: Hero Carousel / Slider */}
          {activeTab === "carousel" && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-5 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                    <SlidersHorizontal className="h-4 w-4 text-blue-600 dark:text-cyan-400" />
                    <span>Hero Image Carousel & Slides</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Display an interactive multi-banner sliding hero with automated rotation.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={carouselEnabled}
                    onChange={(e) => setCarouselEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {carouselEnabled && (
                <div className="space-y-4 pt-2">
                  <div className="space-y-3">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Active Carousel Slides ({carouselSlides.length})
                    </span>
                    {carouselSlides.map((slide, idx) => (
                      <div
                        key={slide.id || idx}
                        className="flex items-start justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3 text-xs dark:border-slate-800 dark:bg-slate-800/50"
                      >
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="rounded bg-blue-100 px-1.5 py-0.2 text-[10px] font-bold text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                              Slide {idx + 1}
                            </span>
                            <span className="font-bold text-slate-900 dark:text-white truncate max-w-xs">{slide.title}</span>
                          </div>
                          <p className="text-slate-600 dark:text-slate-400 line-clamp-2">{slide.subtitle}</p>
                          {slide.imageUrl && (
                            <p className="text-[10px] text-blue-600 truncate max-w-xs">Image: {slide.imageUrl}</p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => setCarouselSlides(carouselSlides.filter((_, i) => i !== idx))}
                          className="rounded-lg p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/60 transition-colors"
                          title="Delete Slide"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Add Slide Form */}
                  <div className="rounded-xl border border-dashed border-slate-300 p-3.5 dark:border-slate-700 bg-white dark:bg-slate-900 space-y-2.5">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Add New Carousel Slide</span>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <input
                        type="text"
                        value={newSlideEyebrow}
                        onChange={(e) => setNewSlideEyebrow(e.target.value)}
                        placeholder="Eyebrow badge (e.g. EXCLUSIVE PROMO)"
                        className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                      <input
                        type="text"
                        value={newSlideImage}
                        onChange={(e) => setNewSlideImage(e.target.value)}
                        placeholder="Slide Image URL (https://...)"
                        className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                    </div>
                    <input
                      type="text"
                      value={newSlideTitle}
                      onChange={(e) => setNewSlideTitle(e.target.value)}
                      placeholder="Slide Headline Title"
                      className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                    <textarea
                      rows={2}
                      value={newSlideSubtitle}
                      onChange={(e) => setNewSlideSubtitle(e.target.value)}
                      placeholder="Slide Description Subtitle..."
                      className="w-full rounded-lg border border-slate-200 p-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white resize-none"
                    />
                    <button
                      type="button"
                      disabled={!newSlideTitle.trim()}
                      onClick={() => {
                        if (!newSlideTitle.trim()) return;
                        setCarouselSlides([
                          ...carouselSlides,
                          {
                            id: `slide-${Date.now()}`,
                            eyebrow: newSlideEyebrow.trim() || "ENTERPRISE",
                            title: newSlideTitle.trim(),
                            subtitle: newSlideSubtitle.trim() || "Empowering business scalability.",
                            imageUrl: newSlideImage.trim() || undefined,
                            primaryCtaLabel: "Learn more",
                            primaryCtaHref: "/login",
                          },
                        ]);
                        setNewSlideTitle("");
                        setNewSlideSubtitle("");
                        setNewSlideEyebrow("");
                        setNewSlideImage("");
                      }}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-blue-700 disabled:opacity-40 transition-all"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Add Slide</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Theme & Logo */}
          {activeTab === "branding" && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4 dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Brand Identity & Colors
              </h2>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Company / Brand Name
                </label>
                <input
                  type="text"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  placeholder="e.g. Acme Technologies Private Limited"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white font-semibold"
                />
              </div>

              <div>
                <MediaUploadDropzone
                  label="Corporate Brand Logo"
                  value={logoUrl}
                  onChange={setLogoUrl}
                  aspectRatio="square"
                  helperText="Upload PNG, SVG, or WebP logo (up to 5MB) or pick an enterprise preset"
                />
              </div>

              {/* Color Presets */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Preset Color Themes
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {COLOR_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => {
                        setPrimaryColor(preset.primary);
                        setAccentColor(preset.accent);
                      }}
                      className={cn(
                        "flex items-center gap-2 rounded-xl border p-2 text-left text-xs font-medium transition-all",
                        primaryColor === preset.primary
                          ? "border-slate-900 bg-slate-50 font-bold dark:border-white dark:bg-slate-800"
                          : "border-slate-200 hover:border-slate-300 dark:border-slate-700"
                      )}
                    >
                      <span className="h-4 w-4 rounded-full shrink-0" style={{ backgroundColor: preset.primary }} />
                      <span className="truncate">{preset.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Hex Color Pickers */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Primary Brand Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="h-9 w-10 cursor-pointer rounded-lg border border-slate-300 p-0.5"
                    />
                    <input
                      type="text"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="flex-1 rounded-xl border border-slate-300 px-3 py-1.5 text-xs font-mono uppercase text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Accent Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      className="h-9 w-10 cursor-pointer rounded-lg border border-slate-300 p-0.5"
                    />
                    <input
                      type="text"
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      className="flex-1 rounded-xl border border-slate-300 px-3 py-1.5 text-xs font-mono uppercase text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Support & Contact Information */}
              <div className="border-t border-slate-100 pt-3 dark:border-slate-800">
                <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">
                  Public Support & Helpline
                </h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Support Phone Number
                    </label>
                    <input
                      type="text"
                      value={supportPhone}
                      onChange={(e) => setSupportPhone(e.target.value)}
                      placeholder="+91 7903055384"
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                    <p className="mt-1 text-[11px] text-slate-400">Default fallback: +91 7903055384</p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Support Email
                    </label>
                    <input
                      type="email"
                      value={supportEmail}
                      onChange={(e) => setSupportEmail(e.target.value)}
                      placeholder="support@uabindia.in"
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                    <p className="mt-1 text-[11px] text-slate-400">Default: support@uabindia.in</p>
                  </div>
                </div>
              </div>

              {/* Header & Footer Appearance */}
              <div className="border-t border-slate-100 pt-3 dark:border-slate-800">
                <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">
                  Header & Footer Appearance
                </h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Header Background Style
                    </label>
                    <select
                      value={headerStyle}
                      onChange={(e) => setHeaderStyle(e.target.value as any)}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    >
                      <option value="clean">Clean White / Translucent</option>
                      <option value="dark">Deep Midnight Slate (Dark)</option>
                      <option value="brand">Brand Colored Theme</option>
                      <option value="glass">Glass Frost Blur</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Footer Background Style
                    </label>
                    <select
                      value={footerStyle}
                      onChange={(e) => setFooterStyle(e.target.value as any)}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    >
                      <option value="dark">Dark Slate / Midnight Navy</option>
                      <option value="light">Clean Light Gray</option>
                      <option value="brand">Brand Primary Color</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab: Enterprise Blocks (FAQ & Testimonials) */}
          {activeTab === "blocks" && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-6 dark:border-slate-800 dark:bg-slate-900">
              <div>
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                    <HelpCircle className="h-4 w-4 text-blue-600 dark:text-cyan-400" />
                    <span>Frequently Asked Questions (FAQ)</span>
                  </h2>
                  <span className="text-xs text-slate-500 font-medium">{faqs.length} Questions</span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Pre-built accordion blocks that resolve visitor concerns and boost conversion.
                </p>

                {/* FAQ List */}
                <div className="mt-4 space-y-2.5">
                  {faqs.map((faq, idx) => (
                    <div
                      key={idx}
                      className="flex items-start justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3 text-xs dark:border-slate-800 dark:bg-slate-800/50"
                    >
                      <div className="flex-1 space-y-1">
                        <p className="font-bold text-slate-900 dark:text-slate-100">{faq.question}</p>
                        <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{faq.answer}</p>
                        {faq.category && (
                          <span className="inline-block rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-semibold text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                            {faq.category}
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => setFaqs(faqs.filter((_, i) => i !== idx))}
                        className="rounded-lg p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/60 transition-colors"
                        title="Delete FAQ"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add New FAQ Form */}
                <div className="mt-4 rounded-xl border border-dashed border-slate-300 p-3 dark:border-slate-700 bg-white dark:bg-slate-900 space-y-2.5">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Add New FAQ</span>
                  <input
                    type="text"
                    value={newFaqQ}
                    onChange={(e) => setNewFaqQ(e.target.value)}
                    placeholder="Enter question (e.g. Is biometric attendance hardware supported?)"
                    className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                  <textarea
                    rows={2}
                    value={newFaqA}
                    onChange={(e) => setNewFaqA(e.target.value)}
                    placeholder="Enter clear, concise answer..."
                    className="w-full rounded-lg border border-slate-200 p-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white resize-none"
                  />
                  <button
                    type="button"
                    disabled={!newFaqQ.trim() || !newFaqA.trim()}
                    onClick={() => {
                      if (!newFaqQ.trim() || !newFaqA.trim()) return;
                      setFaqs([...faqs, { question: newFaqQ.trim(), answer: newFaqA.trim(), category: "General" }]);
                      setNewFaqQ("");
                      setNewFaqA("");
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-blue-700 disabled:opacity-40 transition-all"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add Question</span>
                  </button>
                </div>
              </div>

              {/* Testimonials Section */}
              <div className="border-t border-slate-100 pt-5 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                    <MessageSquareQuote className="h-4 w-4 text-amber-500" />
                    <span>Client Testimonials & Social Proof</span>
                  </h2>
                  <span className="text-xs text-slate-500 font-medium">{testimonials.length} Reviews</span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Verified enterprise customer stories with 5-star ratings displayed in modern grid cards.
                </p>

                {/* Testimonials List */}
                <div className="mt-4 space-y-2.5">
                  {testimonials.map((t, idx) => (
                    <div
                      key={idx}
                      className="flex items-start justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3 text-xs dark:border-slate-800 dark:bg-slate-800/50"
                    >
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-1 text-amber-500">
                          {Array.from({ length: t.rating ?? 5 }).map((_, i) => (
                            <Star key={i} className="h-3 w-3 fill-amber-400 stroke-amber-500" />
                          ))}
                        </div>
                        <p className="italic text-slate-700 dark:text-slate-300">&ldquo;{t.quote}&rdquo;</p>
                        <p className="font-semibold text-slate-900 dark:text-slate-100">
                          {t.name} · <span className="text-slate-500">{t.role}, {t.company}</span>
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setTestimonials(testimonials.filter((_, i) => i !== idx))}
                        className="rounded-lg p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/60 transition-colors"
                        title="Delete Testimonial"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add Testimonial Form */}
                <div className="mt-4 rounded-xl border border-dashed border-slate-300 p-3 dark:border-slate-700 bg-white dark:bg-slate-900 space-y-2.5">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Add Testimonial</span>
                  <div className="grid gap-2 sm:grid-cols-3">
                    <input
                      type="text"
                      value={newTestimonialName}
                      onChange={(e) => setNewTestimonialName(e.target.value)}
                      placeholder="Client Name (e.g. Ramesh Gupta)"
                      className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                    <input
                      type="text"
                      value={newTestimonialRole}
                      onChange={(e) => setNewTestimonialRole(e.target.value)}
                      placeholder="Role (e.g. Operations Director)"
                      className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                    <input
                      type="text"
                      value={newTestimonialCompany}
                      onChange={(e) => setNewTestimonialCompany(e.target.value)}
                      placeholder="Company (e.g. Tata Projects)"
                      className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                  <textarea
                    rows={2}
                    value={newTestimonialQuote}
                    onChange={(e) => setNewTestimonialQuote(e.target.value)}
                    placeholder="Testimonial quote text..."
                    className="w-full rounded-lg border border-slate-200 p-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white resize-none"
                  />
                  <button
                    type="button"
                    disabled={!newTestimonialName.trim() || !newTestimonialQuote.trim()}
                    onClick={() => {
                      if (!newTestimonialName.trim() || !newTestimonialQuote.trim()) return;
                      setTestimonials([
                        ...testimonials,
                        {
                          name: newTestimonialName.trim(),
                          role: newTestimonialRole.trim() || "Executive",
                          company: newTestimonialCompany.trim() || "Enterprise Partner",
                          quote: newTestimonialQuote.trim(),
                          rating: 5,
                        },
                      ]);
                      setNewTestimonialName("");
                      setNewTestimonialRole("");
                      setNewTestimonialCompany("");
                      setNewTestimonialQuote("");
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-blue-700 disabled:opacity-40 transition-all"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add Testimonial</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tab: Operating Locations & Google Maps */}
          {activeTab === "locations" && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-5 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-rose-500" />
                    <span>Office & Branch Locations (Google Maps)</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Display your corporate headquarters, plant locations, and branch offices with live Google Maps.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={officeLocatorEnabled}
                    onChange={(e) => setOfficeLocatorEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {officeLocatorEnabled && (
                <div className="space-y-4 pt-2">
                  <div className="space-y-3">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Configured Operating Hubs ({officeLocations.length})
                    </span>
                    {officeLocations.map((loc, idx) => (
                      <div
                        key={loc.id || idx}
                        className="flex items-start justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3 text-xs dark:border-slate-800 dark:bg-slate-800/50"
                      >
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="rounded bg-rose-100 px-1.5 py-0.2 text-[10px] font-bold text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                              {loc.type}
                            </span>
                            <span className="font-bold text-slate-900 dark:text-white truncate">{loc.name}</span>
                            <span className="text-slate-500 text-[11px]">({loc.city})</span>
                          </div>
                          <p className="text-slate-600 dark:text-slate-400 line-clamp-1">{loc.address}</p>
                          <p className="text-[11px] text-slate-500">Phone: {loc.phone} · Hours: {loc.workingHours}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setOfficeLocations(officeLocations.filter((_, i) => i !== idx))}
                          className="rounded-lg p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/60 transition-colors"
                          title="Delete Location"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Add Location Form */}
                  <div className="rounded-xl border border-dashed border-slate-300 p-3.5 dark:border-slate-700 bg-white dark:bg-slate-900 space-y-2.5">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Add Operating Location</span>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <input
                        type="text"
                        value={newLocName}
                        onChange={(e) => setNewLocName(e.target.value)}
                        placeholder="Hub Name (e.g. Northern Branch)"
                        className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                      <input
                        type="text"
                        value={newLocCity}
                        onChange={(e) => setNewLocCity(e.target.value)}
                        placeholder="City, State (e.g. New Delhi, NCR)"
                        className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                    </div>
                    <input
                      type="text"
                      value={newLocAddress}
                      onChange={(e) => setNewLocAddress(e.target.value)}
                      placeholder="Complete Postal Address"
                      className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                    <div className="grid gap-2 sm:grid-cols-2">
                      <input
                        type="text"
                        value={newLocPhone}
                        onChange={(e) => setNewLocPhone(e.target.value)}
                        placeholder="Contact Phone (e.g. +91 11 4982 3400)"
                        className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                      <input
                        type="text"
                        value={newLocMapUrl}
                        onChange={(e) => setNewLocMapUrl(e.target.value)}
                        placeholder="Google Maps Embed URL (iframe src)"
                        className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                    </div>
                    <button
                      type="button"
                      disabled={!newLocName.trim() || !newLocAddress.trim()}
                      onClick={() => {
                        if (!newLocName.trim() || !newLocAddress.trim()) return;
                        setOfficeLocations([
                          ...officeLocations,
                          {
                            id: `loc-${Date.now()}`,
                            name: newLocName.trim(),
                            type: "Branch Office",
                            city: newLocCity.trim() || "India",
                            address: newLocAddress.trim(),
                            phone: newLocPhone.trim() || "+91 7903055384",
                            email: "support@uabindia.in",
                            workingHours: "Mon - Sat: 09:30 AM – 06:30 PM",
                            mapEmbedUrl: newLocMapUrl.trim() || "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3771.954203175114!2d72.82772597597148!3d19.00632598218442!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3be7ce886851f50b%3A0xe54fb725efbc6f40!2sOne%20World%20Center!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin",
                            directionsUrl: `https://maps.google.com/?q=${encodeURIComponent(newLocAddress.trim())}`,
                          },
                        ]);
                        setNewLocName("");
                        setNewLocCity("");
                        setNewLocAddress("");
                        setNewLocPhone("");
                        setNewLocMapUrl("");
                      }}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-blue-700 disabled:opacity-40 transition-all"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Add Office Hub</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab: B2B Storefront & Catalog */}
          {activeTab === "storefront" && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-5 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Public B2B Storefront & RFQ Catalog</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Enable public visitors and registered B2B clients to browse your products and request bulk quotations.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={b2bStorefrontEnabled}
                    onChange={(e) => setB2bStorefrontEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {b2bStorefrontEnabled && (
                <div className="space-y-4 pt-2">
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/20">
                    <h3 className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                      Storefront Catalog Endpoint Active
                    </h3>
                    <p className="mt-1 text-xs text-emerald-800/80 dark:text-emerald-300/80">
                      Your public catalog is live at <span className="font-mono font-semibold">/products</span> with live category filters, stock indicators, and instant RFQ submission.
                    </p>
                    <div className="mt-3">
                      <a
                        href="/products"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-emerald-700 transition-all"
                      >
                        <span>Open Live Catalog (/products)</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Storefront Ordering Mode
                    </label>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div
                        onClick={() => setStorefrontMode("rfq")}
                        className={cn(
                          "cursor-pointer rounded-xl border p-3 transition-all",
                          storefrontMode === "rfq"
                            ? "border-blue-600 bg-blue-50/50 dark:border-blue-500 dark:bg-blue-950/40"
                            : "border-slate-200 dark:border-slate-800"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900 dark:text-white">Request for Quote (RFQ)</span>
                          {storefrontMode === "rfq" && <Check className="h-4 w-4 text-blue-600" />}
                        </div>
                        <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                          Clients add items to an RFQ Drawer and submit bulk quotation requests directly into your ERP CRM. Recommended for B2B.
                        </p>
                      </div>

                      <div
                        onClick={() => setStorefrontMode("direct")}
                        className={cn(
                          "cursor-pointer rounded-xl border p-3 transition-all",
                          storefrontMode === "direct"
                            ? "border-blue-600 bg-blue-50/50 dark:border-blue-500 dark:bg-blue-950/40"
                            : "border-slate-200 dark:border-slate-800"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900 dark:text-white">Direct PO Checkout</span>
                          {storefrontMode === "direct" && <Check className="h-4 w-4 text-blue-600" />}
                        </div>
                        <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                          Clients generate instant Purchase Orders (PO) linked to standard unit prices and dispatch terms.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Announcement Notice */}
          {activeTab === "announcement" && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                    Announcement Notice Bar
                  </h2>
                  <p className="text-xs text-slate-500">
                    Displays an alert bar at the top of your public landing page.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={announcementEnabled}
                    onChange={(e) => setAnnouncementEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {announcementEnabled && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Announcement Message
                  </label>
                  <input
                    type="text"
                    value={announcementText}
                    onChange={(e) => setAnnouncementText(e.target.value)}
                    placeholder="e.g. Offices will remain closed on Friday for Annual Celebration."
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              )}
            </div>
          )}

          {/* Tab 4: Quick Access Services */}
          {activeTab === "quickAccess" && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                    Quick-Access Portal Services
                  </h2>
                  <p className="text-xs text-slate-500">
                    Cards shown directly below the hero section for easy employee navigation.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showQuickAccess}
                    onChange={(e) => setShowQuickAccess(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {showQuickAccess && (
                <div className="space-y-3">
                  <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-800 space-y-2">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Tile 1: Self-Service</span>
                    <input
                      type="text"
                      value={quickTile1Title}
                      onChange={(e) => setQuickTile1Title(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white font-medium"
                    />
                    <input
                      type="text"
                      value={quickTile1Desc}
                      onChange={(e) => setQuickTile1Desc(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                    />
                  </div>

                  <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-800 space-y-2">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Tile 2: Payroll</span>
                    <input
                      type="text"
                      value={quickTile2Title}
                      onChange={(e) => setQuickTile2Title(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white font-medium"
                    />
                    <input
                      type="text"
                      value={quickTile2Desc}
                      onChange={(e) => setQuickTile2Desc(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                    />
                  </div>

                  <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-800 space-y-2">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Tile 3: Support</span>
                    <input
                      type="text"
                      value={quickTile3Title}
                      onChange={(e) => setQuickTile3Title(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white font-medium"
                    />
                    <input
                      type="text"
                      value={quickTile3Desc}
                      onChange={(e) => setQuickTile3Desc(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                    />
                  </div>

                  <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-800 space-y-2">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Tile 4: Corporate Portal</span>
                    <input
                      type="text"
                      value={quickTile4Title}
                      onChange={(e) => setQuickTile4Title(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white font-medium"
                    />
                    <input
                      type="text"
                      value={quickTile4Desc}
                      onChange={(e) => setQuickTile4Desc(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab 8: SEO & Social Share Preview */}
          {activeTab === "seo" && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-6 dark:border-slate-800 dark:bg-slate-900">
              <div className="border-b border-slate-100 pb-3 dark:border-slate-800">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  SEO & Social Graph Management
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Configure search engine metadata, Open Graph sharing cards, and Schema.org structured data.
                </p>
              </div>

              {/* Live Google Search Result Preview */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-850">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Live Google Search Snippet Preview
                  </span>
                  <span className="rounded bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:bg-blue-900/60 dark:text-blue-300">
                    Google SERP
                  </span>
                </div>

                <div className="rounded-lg bg-white p-3.5 shadow-2xs dark:bg-slate-900 space-y-1">
                  <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                    <Globe className="h-3.5 w-3.5 text-blue-600" />
                    <span className="font-mono text-[11px] text-slate-700 dark:text-slate-300">
                      https://{brandName.toLowerCase().replace(/[^a-z0-9]/g, "") || "portal"}.uabindia.in
                    </span>
                  </div>
                  <h3 className="text-base font-medium text-blue-700 hover:underline dark:text-blue-400 cursor-pointer">
                    {metaTitle || `${currentDisplayBrand} - Enterprise ERP & Operating Portal`}
                  </h3>
                  <p className="line-clamp-2 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                    {metaDescription || currentDisplaySubtitle || "Secure enterprise login, workforce management, financial ledgers, and operational support portal."}
                  </p>
                </div>
              </div>

              {/* Meta Title Field */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    SEO Meta Title
                  </label>
                  <span className={cn(
                    "text-[11px] font-mono",
                    metaTitle.length > 60 ? "text-amber-600 font-bold" : "text-slate-400"
                  )}>
                    {metaTitle.length} / 60 characters
                  </span>
                </div>
                <input
                  type="text"
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                  placeholder="e.g. Acme Corp | Enterprise Cloud ERP & Operations Portal"
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-900 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              {/* Meta Description Field */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    SEO Meta Description
                  </label>
                  <span className={cn(
                    "text-[11px] font-mono",
                    metaDescription.length > 160 ? "text-amber-600 font-bold" : "text-slate-400"
                  )}>
                    {metaDescription.length} / 160 characters
                  </span>
                </div>
                <textarea
                  rows={3}
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  placeholder="Write a concise, compelling summary for Google searchers..."
                  className="mt-1 w-full rounded-xl border border-slate-300 p-3 text-xs text-slate-900 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              {/* Canonical URL & OG Image */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Canonical URL (Optional)
                  </label>
                  <input
                    type="text"
                    value={canonicalUrl}
                    onChange={(e) => setCanonicalUrl(e.target.value)}
                    placeholder="https://acme.uabindia.in"
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-1.5 font-mono text-xs text-slate-900 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Schema.org Entity Type
                  </label>
                  <select
                    value={schemaType}
                    onChange={(e) => setSchemaType(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-1.5 text-xs text-slate-900 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="Corporation">Corporation (Enterprise / Group)</option>
                    <option value="Organization">Organization (General)</option>
                    <option value="LocalBusiness">Local Business / Manufacturer</option>
                    <option value="MedicalBusiness">Medical Business / Hospital</option>
                    <option value="EducationalOrganization">Educational Organization / Academy</option>
                  </select>
                </div>
              </div>

              {/* Robots Indexing */}
              <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-850">
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">
                    Search Engine Visibility (Robots.txt)
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Allow Google, Bing, and web crawlers to index this website.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={robotsIndex}
                    onChange={(e) => setRobotsIndex(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          )}

          {/* Tab 9: Lead Inquiries */}
          {activeTab === "leads" && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-3 dark:border-slate-800">
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                    Website Form Submissions & Captured Leads
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Live enterprise inquiries submitted through your website's contact and demo forms.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => notifySuccess("Leads Exported", "Downloaded 3 lead records as CSV.")}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200 cursor-pointer"
                >
                  <span>Export CSV</span>
                </button>
              </div>

              <div className="space-y-3">
                {leads.map((lead) => (
                  <div
                    key={lead.id}
                    className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 transition-all hover:border-slate-300 dark:border-slate-800 dark:bg-slate-850"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white">{lead.name}</span>
                        <span className="ml-2 text-slate-500">· {lead.company}</span>
                      </div>
                      <span className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-bold",
                        lead.status === "New" ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300" :
                        lead.status === "Contacted" ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300" :
                        "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                      )}>
                        {lead.status}
                      </span>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-slate-400">
                      <span>📧 {lead.email}</span>
                      <span>📞 {lead.phone}</span>
                      <span className="rounded bg-white px-2 py-0.5 font-medium border border-slate-200 dark:bg-slate-800 dark:border-slate-700">
                        {lead.type}
                      </span>
                      <span className="text-[11px] text-slate-400 ml-auto">{lead.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Live Preview Column */}
        <div className="lg:col-span-6 sticky top-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-900/5 p-4 dark:border-slate-800 dark:bg-slate-950/60">
            {/* Preview Device Controls */}
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
                <Eye className="h-3.5 w-3.5" />
                <span>Live Portal Preview</span>
              </div>
              <div className="flex items-center gap-1 rounded-lg bg-slate-200/80 p-0.5 dark:bg-slate-800">
                <button
                  type="button"
                  onClick={() => setPreviewDevice("desktop")}
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-md text-xs transition-colors",
                    previewDevice === "desktop" ? "bg-white text-slate-900 shadow-2xs font-bold" : "text-slate-500"
                  )}
                >
                  <Monitor className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDevice("mobile")}
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-md text-xs transition-colors",
                    previewDevice === "mobile" ? "bg-white text-slate-900 shadow-2xs font-bold" : "text-slate-500"
                  )}
                >
                  <Smartphone className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Mock Screen Frame */}
            <div
              className={cn(
                "mx-auto overflow-hidden rounded-xl border border-slate-200 bg-white shadow-md transition-all duration-300 dark:border-slate-800 dark:bg-slate-900",
                previewDevice === "mobile" ? "max-w-[340px]" : "w-full"
              )}
            >
              {/* Mock Browser Header */}
              <div className="flex h-7 items-center gap-1.5 border-b border-slate-100 bg-slate-50 px-3 dark:border-slate-800 dark:bg-slate-950">
                <span className="h-2 w-2 rounded-full bg-rose-400" />
                <span className="h-2 w-2 rounded-full bg-amber-400" />
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                <span className="ml-2 truncate text-[10px] text-slate-400">
                  {currentDisplayBrand.toLowerCase().replace(/[^a-z0-9]/g, "")}.uabindia.com
                </span>
              </div>

              {/* Mock Announcement */}
              {announcementEnabled && announcementText ? (
                <div className="bg-blue-50 px-3 py-1.5 text-center text-[10px] font-semibold text-blue-900 border-b border-blue-100">
                  <span
                    className="mr-1.5 rounded-full px-1.5 py-0.2 text-[9px] font-bold text-white uppercase"
                    style={{ backgroundColor: primaryColor }}
                  >
                    Notice
                  </span>
                  {announcementText}
                </div>
              ) : null}

              {/* Mock Header */}
              <div className="flex h-12 items-center justify-between border-b border-slate-100 px-4 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  {logoUrl ? (
                    <img src={logoUrl} alt="Logo" className="h-5 w-auto object-contain" />
                  ) : (
                    <div
                      className="flex h-6 w-6 items-center justify-center rounded-lg text-white font-extrabold text-[11px]"
                      style={{ backgroundColor: primaryColor }}
                    >
                      {currentDisplayBrand.charAt(0)}
                    </div>
                  )}
                  <span className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[140px]">
                    {currentDisplayBrand}
                  </span>
                </div>
                <div
                  className="rounded-lg px-2.5 py-1 text-[10px] font-bold text-white shadow-2xs"
                  style={{ backgroundColor: primaryColor }}
                >
                  {primaryCtaLabel}
                </div>
              </div>

              {/* Mock Hero */}
              <div className="p-5 text-center bg-radial from-slate-50 to-white dark:from-slate-900 dark:to-slate-950">
                <span
                  className="inline-block text-[10px] font-bold uppercase tracking-wider mb-1"
                  style={{ color: primaryColor }}
                >
                  {currentDisplayEyebrow}
                </span>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white leading-tight">
                  {currentDisplayTitle}
                </h3>
                <p className="mt-1.5 text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed max-w-sm mx-auto">
                  {currentDisplaySubtitle}
                </p>

                {/* Trust Badges */}
                <div className="mt-2.5 flex flex-wrap justify-center gap-1">
                  {currentPills.map((pill) => (
                    <span
                      key={pill}
                      className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                    >
                      {pill}
                    </span>
                  ))}
                </div>

                {/* Buttons */}
                <div className="mt-4 flex items-center justify-center gap-2">
                  <div
                    className="rounded-xl px-3 py-1.5 text-[11px] font-bold text-white shadow-xs"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {primaryCtaLabel}
                  </div>
                  <div className="rounded-xl border border-slate-200 px-3 py-1.5 text-[11px] font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-300">
                    {secondaryCtaLabel}
                  </div>
                </div>
              </div>

              {/* Mock Quick Access */}
              {showQuickAccess && (
                <div className="p-4 border-t border-slate-100 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/50">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-xl border border-slate-200/80 bg-white p-2.5 text-left shadow-3xs dark:border-slate-800 dark:bg-slate-900">
                      <UsersRound className="h-3.5 w-3.5" style={{ color: primaryColor }} />
                      <p className="mt-1 text-[11px] font-bold text-slate-900 dark:text-white truncate">
                        {quickTile1Title}
                      </p>
                      <p className="text-[9px] text-slate-500 line-clamp-2 mt-0.5">{quickTile1Desc}</p>
                    </div>

                    <div className="rounded-xl border border-slate-200/80 bg-white p-2.5 text-left shadow-3xs dark:border-slate-800 dark:bg-slate-900">
                      <WalletCards className="h-3.5 w-3.5" style={{ color: primaryColor }} />
                      <p className="mt-1 text-[11px] font-bold text-slate-900 dark:text-white truncate">
                        {quickTile2Title}
                      </p>
                      <p className="text-[9px] text-slate-500 line-clamp-2 mt-0.5">{quickTile2Desc}</p>
                    </div>

                    <div className="rounded-xl border border-slate-200/80 bg-white p-2.5 text-left shadow-3xs dark:border-slate-800 dark:bg-slate-900">
                      <LifeBuoy className="h-3.5 w-3.5" style={{ color: primaryColor }} />
                      <p className="mt-1 text-[11px] font-bold text-slate-900 dark:text-white truncate">
                        {quickTile3Title}
                      </p>
                      <p className="text-[9px] text-slate-500 line-clamp-2 mt-0.5">{quickTile3Desc}</p>
                    </div>

                    <div className="rounded-xl border border-slate-200/80 bg-white p-2.5 text-left shadow-3xs dark:border-slate-800 dark:bg-slate-900">
                      <ShieldCheck className="h-3.5 w-3.5" style={{ color: primaryColor }} />
                      <p className="mt-1 text-[11px] font-bold text-slate-900 dark:text-white truncate">
                        {quickTile4Title}
                      </p>
                      <p className="text-[9px] text-slate-500 line-clamp-2 mt-0.5">{quickTile4Desc}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Mock Storefront Strip */}
              {b2bStorefrontEnabled && (
                <div className="border-t border-slate-100 bg-emerald-50/70 p-2.5 px-3 dark:border-slate-800 dark:bg-emerald-950/30">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                      <ShoppingCart className="h-3 w-3" />
                      <span>Live B2B Storefront & RFQ</span>
                    </span>
                    <span className="font-semibold text-emerald-700 dark:text-emerald-400">/products →</span>
                  </div>
                </div>
              )}

              {/* Mock Testimonial preview */}
              {testimonials.length > 0 && (
                <div className="border-t border-slate-100 p-2.5 px-3 bg-slate-50/40 dark:border-slate-800 dark:bg-slate-900/30">
                  <div className="flex items-center gap-1 text-amber-500">
                    <Star className="h-2.5 w-2.5 fill-amber-400 stroke-amber-500" />
                    <Star className="h-2.5 w-2.5 fill-amber-400 stroke-amber-500" />
                    <Star className="h-2.5 w-2.5 fill-amber-400 stroke-amber-500" />
                    <Star className="h-2.5 w-2.5 fill-amber-400 stroke-amber-500" />
                    <Star className="h-2.5 w-2.5 fill-amber-400 stroke-amber-500" />
                    <span className="text-[9px] font-bold text-slate-700 dark:text-slate-300 ml-1">
                      {testimonials[0].company}
                    </span>
                  </div>
                  <p className="text-[9px] text-slate-500 italic mt-0.5 line-clamp-1">
                    &ldquo;{testimonials[0].quote}&rdquo;
                  </p>
                </div>
              )}

              {/* Mock Carousel Banner Preview */}
              {carouselEnabled && (
                <div className="border-t border-slate-100 bg-blue-50/70 p-2.5 px-3 dark:border-slate-800 dark:bg-blue-950/30">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-bold text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
                      <SlidersHorizontal className="h-3 w-3" />
                      <span>Hero Slider Active ({carouselSlides.length} Slides)</span>
                    </span>
                    <span className="font-semibold text-blue-700 dark:text-blue-400">Auto-Rotate 6s</span>
                  </div>
                </div>
              )}

              {/* Mock Office Locator Strip */}
              {officeLocatorEnabled && (
                <div className="border-t border-slate-100 bg-rose-50/70 p-2.5 px-3 dark:border-slate-800 dark:bg-rose-950/30">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-bold text-rose-900 dark:text-rose-300 flex items-center gap-1.5">
                      <MapPin className="h-3 w-3" />
                      <span>Office Locations & Google Maps ({officeLocations.length} Hubs)</span>
                    </span>
                    <span className="font-semibold text-rose-700 dark:text-rose-400">{officeLocations[0]?.city || "India"}</span>
                  </div>
                </div>
              )}

              {/* Mock Footer */}
              <div className="border-t border-slate-100 p-3 text-center text-[9px] text-slate-400 dark:border-slate-800">
                © {new Date().getFullYear()} {currentDisplayBrand}. All rights reserved.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

