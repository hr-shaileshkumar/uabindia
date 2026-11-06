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
} from "lucide-react";
import apiClient from "@/services/apiClient";
import { notifyError, notifySuccess } from "@/lib/notifications";
import { cn } from "@/lib/utils";

type CustomizerTab = "hero" | "branding" | "announcement" | "quickAccess" | "highlights";

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
          <div className="flex rounded-xl bg-slate-100 p-1 dark:bg-slate-850">
            {[
              { id: "hero", label: "Hero & Copy", icon: Layout },
              { id: "branding", label: "Theme & Logo", icon: Palette },
              { id: "announcement", label: "Notice Bar", icon: BellRing },
              { id: "quickAccess", label: "Services", icon: Sparkles },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as CustomizerTab)}
                className={cn(
                  "flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold transition-all",
                  activeTab === tab.id
                    ? "bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-white font-bold"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                )}
              >
                <tab.icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

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
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Logo Image URL
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="https://.../logo.png"
                    className="flex-1 rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                  {logoUrl ? (
                    <div className="flex h-10 w-16 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 p-1">
                      <img src={logoUrl} alt="Preview" className="max-h-full max-w-full object-contain" />
                    </div>
                  ) : null}
                </div>
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

