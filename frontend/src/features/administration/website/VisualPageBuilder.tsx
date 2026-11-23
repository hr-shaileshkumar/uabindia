"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Check,
  CheckCircle2,
  ChevronDown,
  Copy,
  Eye,
  EyeOff,
  Globe,
  GripVertical,
  HelpCircle,
  Laptop,
  Layers,
  LayoutGrid,
  Loader2,
  Maximize2,
  MessageSquare,
  Moon,
  MoveDown,
  MoveUp,
  Package,
  Palette,
  Phone,
  Plus,
  RefreshCw,
  Save,
  Sliders,
  Smartphone,
  Sparkles,
  Sun,
  Tablet,
  Trash2,
  Type,
  Undo2,
  Users,
  Video,
  X,
  Zap,
} from "lucide-react";
import {
  WebsiteBlock,
  BlockType,
  WebsiteThemeStudioConfig,
  CustomPageDefinition,
} from "@/lib/website-builder/types";
import {
  createDefaultBlock,
  getDefaultStarterBlocks,
  DEFAULT_THEME_STUDIO_CONFIG,
} from "@/lib/website-builder/defaultBlocks";
import { PublicBlockRenderer } from "@/components/public/builder/PublicBlockRenderer";
import { notifySuccess } from "@/lib/notifications";
import { cn } from "@/lib/utils";

const PAGES_LIST = [
  { slug: "/", label: "Home Page (Root)" },
  { slug: "/about", label: "About Us" },
  { slug: "/services", label: "Services" },
  { slug: "/products", label: "Product Catalog" },
  { slug: "/careers", label: "Careers & ATS" },
  { slug: "/contact", label: "Contact & CRM" },
];

const BLOCK_LIBRARY_ITEMS: {
  type: BlockType;
  title: string;
  category: "Structure" | "Content" | "Conversion" | "ERP Bridges";
  description: string;
  badge?: string;
}[] = [
  {
    type: "hero",
    title: "Hero Banner",
    category: "Structure",
    description: "High-impact visual headline, CTAs, trust badges, and media.",
  },
  {
    type: "features",
    title: "Feature Highlights",
    category: "Content",
    description: "3-4 column grid highlighting core competencies.",
  },
  {
    type: "services",
    title: "Services Grid",
    category: "Content",
    description: "Detailed cards for client services with inquiry links.",
  },
  {
    type: "stats",
    title: "Metric Counters",
    category: "Content",
    description: "Display enterprise scale: uptime, patients, volume, revenue.",
  },
  {
    type: "testimonials",
    title: "Client Reviews",
    category: "Conversion",
    description: "Customer quotes with star ratings and client avatars.",
  },
  {
    type: "team",
    title: "Team & Board",
    category: "Content",
    description: "Executive profiles, roles, and bio information.",
  },
  {
    type: "pricing",
    title: "Pricing Plans",
    category: "Conversion",
    description: "Tiered pricing table with feature checklists and popular badge.",
  },
  {
    type: "faq",
    title: "FAQ Accordion",
    category: "Content",
    description: "Collapsible questions and answers with search filter.",
  },
  {
    type: "cta",
    title: "CTA Conversion Strip",
    category: "Conversion",
    description: "High-contrast action banner driving demos or quotes.",
  },
  {
    type: "crm_contact",
    title: "CRM Lead Capture Form",
    category: "ERP Bridges",
    description: "Direct bridge logging submissions into ERP CRM Leads.",
    badge: "ERP Native",
  },
  {
    type: "ats_careers",
    title: "HRMS Recruitment ATS",
    category: "ERP Bridges",
    description: "Direct bridge to HRMS job openings & candidate tracker.",
    badge: "HRMS Native",
  },
  {
    type: "product_catalog",
    title: "Inventory Showcase",
    category: "ERP Bridges",
    description: "B2B product display with instant quotation requests.",
    badge: "Inventory Native",
  },
];

const COLOR_PRESETS = [
  { id: "emerald", name: "Emerald Pro", primary: "#059669", secondary: "#047857", accent: "#10b981" },
  { id: "sapphire", name: "Sapphire Royal", primary: "#2563eb", secondary: "#1d4ed8", accent: "#06b6d4" },
  { id: "teal", name: "Teal Modern", primary: "#0d9488", secondary: "#0f766e", accent: "#14b8a6" },
  { id: "violet", name: "Violet Luxury", primary: "#7c3aed", secondary: "#6d28d9", accent: "#a855f7" },
  { id: "aurora", name: "Aurora Gradient", primary: "#2563eb", secondary: "#4f46e5", accent: "#06b6d4" },
  { id: "sunset", name: "Sunset Horizon", primary: "#ea580c", secondary: "#c2410c", accent: "#f59e0b" },
  { id: "cyber_neon", name: "Cyber Neon", primary: "#0284c7", secondary: "#2563eb", accent: "#38bdf8" },
];

export function VisualPageBuilder() {
  const [selectedPage, setSelectedPage] = useState<string>("/");
  const [blocks, setBlocks] = useState<WebsiteBlock[]>([]);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [viewport, setViewport] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [isThemeStudioOpen, setIsThemeStudioOpen] = useState(false);
  const [theme, setTheme] = useState<WebsiteThemeStudioConfig>(DEFAULT_THEME_STUDIO_CONFIG);
  const [activeTab, setActiveTab] = useState<"content" | "style">("content");
  const [isSaving, setIsSaving] = useState(false);

  // Initialize or load blocks for selected page
  useEffect(() => {
    const storageKey = `uab_custom_page_${selectedPage}`;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setBlocks(parsed.blocks || getDefaultStarterBlocks());
        if (parsed.theme) setTheme(parsed.theme);
        return;
      } catch (e) {
        // Fallback
      }
    }
    setBlocks(getDefaultStarterBlocks());
  }, [selectedPage]);

  const selectedBlock = blocks.find((b) => b.id === selectedBlockId) || null;

  // Add block
  const handleAddBlock = (type: BlockType) => {
    const newBlock = createDefaultBlock(type);
    setBlocks((prev) => [...prev, newBlock]);
    setSelectedBlockId(newBlock.id);
    setIsLibraryOpen(false);
    notifySuccess(`Added ${newBlock.title} block to page`);
  };

  // Delete block
  const handleDeleteBlock = (id: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
    if (selectedBlockId === id) setSelectedBlockId(null);
  };

  // Move block up
  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    setBlocks((prev) => {
      const copy = [...prev];
      const temp = copy[index - 1];
      copy[index - 1] = copy[index];
      copy[index] = temp;
      return copy;
    });
  };

  // Move block down
  const handleMoveDown = (index: number) => {
    if (index >= blocks.length - 1) return;
    setBlocks((prev) => {
      const copy = [...prev];
      const temp = copy[index + 1];
      copy[index + 1] = copy[index];
      copy[index] = temp;
      return copy;
    });
  };

  // Duplicate block
  const handleDuplicateBlock = (block: WebsiteBlock) => {
    const duplicated: WebsiteBlock = {
      ...JSON.parse(JSON.stringify(block)),
      id: `block_${block.type}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title: `${block.title} (Copy)`,
    };
    const index = blocks.findIndex((b) => b.id === block.id);
    setBlocks((prev) => {
      const copy = [...prev];
      copy.splice(index + 1, 0, duplicated);
      return copy;
    });
    setSelectedBlockId(duplicated.id);
    notifySuccess("Block duplicated");
  };

  // Toggle block visibility
  const handleToggleVisibility = (id: string) => {
    setBlocks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, isVisible: !b.isVisible } : b)),
    );
  };

  // Update selected block data
  const handleUpdateBlockData = (field: string, value: any) => {
    if (!selectedBlockId) return;
    setBlocks((prev) =>
      prev.map((b) => {
        if (b.id !== selectedBlockId) return b;
        return {
          ...b,
          data: {
            ...b.data,
            [field]: value,
          },
        };
      }),
    );
  };

  // Update selected block style
  const handleUpdateBlockStyle = (field: string, value: any) => {
    if (!selectedBlockId) return;
    setBlocks((prev) =>
      prev.map((b) => {
        if (b.id !== selectedBlockId) return b;
        return {
          ...b,
          style: {
            ...b.style,
            [field]: value,
          },
        };
      }),
    );
  };

  // Save page definition
  const handleSaveAndPublish = () => {
    setIsSaving(true);
    const storageKey = `uab_custom_page_${selectedPage}`;
    const payload: CustomPageDefinition = {
      id: `page_${selectedPage.replace(/\//g, "_") || "home"}`,
      slug: selectedPage,
      title: PAGES_LIST.find((p) => p.slug === selectedPage)?.label || "Custom Page",
      theme,
      blocks,
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem(storageKey, JSON.stringify(payload));

    setTimeout(() => {
      setIsSaving(false);
      notifySuccess(`Saved & Published ${payload.title} live!`);
    }, 600);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] w-full overflow-hidden bg-slate-100 dark:bg-slate-950">
      {/* ── TOP HEADER CONTROL BAR ─────────────────────────── */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200/90 bg-white px-4 dark:border-slate-800/90 dark:bg-slate-900 z-30 shadow-xs">
        {/* Left: Back & Page Selector */}
        <div className="flex items-center gap-3">
          <Link
            href="/administration/website/settings"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Page:</span>
            <select
              value={selectedPage}
              onChange={(e) => {
                setSelectedPage(e.target.value);
                setSelectedBlockId(null);
              }}
              className="h-8 rounded-lg border border-slate-300 bg-white px-2.5 text-xs font-bold text-slate-800 shadow-2xs focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              {PAGES_LIST.map((page) => (
                <option key={page.slug} value={page.slug}>
                  {page.label} ({page.slug})
                </option>
              ))}
            </select>
          </div>

          <span className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1" />

          {/* Quick Action: Add Block */}
          <button
            type="button"
            onClick={() => setIsLibraryOpen(true)}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-blue-50 px-3 text-xs font-bold text-blue-700 hover:bg-blue-100 dark:bg-blue-950 dark:text-cyan-300 dark:hover:bg-blue-900"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Block
          </button>

          {/* Quick Action: Brand Theme Studio */}
          <button
            type="button"
            onClick={() => setIsThemeStudioOpen(true)}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <Palette className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
            Brand Studio
          </button>
        </div>

        {/* Center: Device Viewport Switcher */}
        <div className="hidden md:flex items-center rounded-xl border border-slate-200 bg-slate-100 p-0.5 dark:border-slate-800 dark:bg-slate-950">
          <button
            type="button"
            onClick={() => setViewport("desktop")}
            className={cn(
              "flex h-7 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition-colors",
              viewport === "desktop"
                ? "bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-white"
                : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white",
            )}
            title="Desktop 100%"
          >
            <Laptop className="h-3.5 w-3.5" />
            <span>Desktop</span>
          </button>

          <button
            type="button"
            onClick={() => setViewport("tablet")}
            className={cn(
              "flex h-7 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition-colors",
              viewport === "tablet"
                ? "bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-white"
                : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white",
            )}
            title="Tablet (768px)"
          >
            <Tablet className="h-3.5 w-3.5" />
            <span>Tablet</span>
          </button>

          <button
            type="button"
            onClick={() => setViewport("mobile")}
            className={cn(
              "flex h-7 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition-colors",
              viewport === "mobile"
                ? "bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-white"
                : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white",
            )}
            title="Mobile (375px)"
          >
            <Smartphone className="h-3.5 w-3.5" />
            <span>Mobile</span>
          </button>
        </div>

        {/* Right: Live Preview & Publish Button */}
        <div className="flex items-center gap-2">
          <Link
            href={selectedPage}
            target="_blank"
            className="hidden sm:inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200"
          >
            <Globe className="h-3.5 w-3.5 text-blue-600" />
            Live View
          </Link>

          <button
            type="button"
            onClick={handleSaveAndPublish}
            disabled={isSaving}
            style={{
              background: "var(--uab-brand-gradient, linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%))",
              boxShadow: "0 2px 10px -1px var(--uab-brand-glow, rgba(37,99,235,0.4))",
            }}
            className="inline-flex h-8.5 items-center gap-2 rounded-xl px-4 text-xs font-bold text-white shadow-xs transition-all hover:brightness-110 active:scale-95 disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Publishing...
              </>
            ) : (
              <>
                <Save className="h-3.5 w-3.5" />
                Save & Publish
              </>
            )}
          </button>
        </div>
      </header>

      {/* ── WORKSPACE BODY: (SIDEBAR OUTLINE + CANVAS + INSPECTOR) ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* ── LEFT PANE: SECTION OUTLINE / REORDER TREE ───────── */}
        <aside className="w-64 shrink-0 border-r border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between hidden lg:flex">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Page Outline ({blocks.length})
              </span>
              <button
                type="button"
                onClick={() => setIsLibraryOpen(true)}
                className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
              >
                <Plus className="h-3 w-3" /> Add
              </button>
            </div>

            <div className="mt-3 space-y-1.5 overflow-y-auto max-h-[calc(100vh-14rem)] pr-1">
              {blocks.map((block, index) => {
                const isSelected = selectedBlockId === block.id;
                return (
                  <div
                    key={block.id}
                    onClick={() => setSelectedBlockId(block.id)}
                    className={cn(
                      "group flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition-all cursor-pointer",
                      isSelected
                        ? "bg-blue-50 text-blue-800 border border-blue-200 dark:bg-blue-950/70 dark:text-cyan-300 dark:border-blue-900"
                        : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/60",
                      !block.isVisible && "opacity-50",
                    )}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <GripVertical className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{block.title}</span>
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveUp(index);
                        }}
                        disabled={index === 0}
                        className="p-1 hover:text-blue-600 disabled:opacity-20"
                        title="Move Up"
                      >
                        <ArrowUp className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveDown(index);
                        }}
                        disabled={index === blocks.length - 1}
                        className="p-1 hover:text-blue-600 disabled:opacity-20"
                        title="Move Down"
                      >
                        <ArrowDown className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400">
            Click block to inspect and customize styles or text.
          </div>
        </aside>

        {/* ── CENTER: INTERACTIVE PREVIEW CANVAS ──────────────── */}
        <main className="flex-1 overflow-y-auto bg-slate-200/60 p-4 md:p-6 dark:bg-slate-950/80 flex justify-center">
          <div
            className={cn(
              "transition-all duration-300 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-300/80 dark:border-slate-800 overflow-hidden min-h-[85vh] flex flex-col",
              viewport === "desktop"
                ? "w-full max-w-[1400px]"
                : viewport === "tablet"
                ? "w-[768px]"
                : "w-[375px]",
            )}
          >
            {/* Viewport Top Chrome Header */}
            <div className="flex h-7 items-center justify-between border-b border-slate-100 bg-slate-50 px-4 text-[10px] text-slate-400 dark:border-slate-800 dark:bg-slate-950 font-mono">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-red-400" />
                <span className="h-2 w-2 rounded-full bg-amber-400" />
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                <span className="ml-2 font-sans font-semibold text-slate-600 dark:text-slate-300">
                  https://bavya.uabindia.in{selectedPage}
                </span>
              </span>
              <span>
                {viewport === "desktop" ? "1440px" : viewport === "tablet" ? "768px" : "375px"}
              </span>
            </div>

            {/* Rendered Live Page */}
            <div className="flex-1">
              <PublicBlockRenderer
                blocks={blocks}
                previewMode={true}
                selectedBlockId={selectedBlockId}
                onSelectBlock={(id) => setSelectedBlockId(id)}
              />
            </div>
          </div>
        </main>

        {/* ── RIGHT PANE: BLOCK INSPECTOR / STYLE CUSTOMIZER ──── */}
        {selectedBlock && (
          <aside className="w-80 shrink-0 border-l border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 flex flex-col h-full z-20 shadow-lg">
            {/* Inspector Header */}
            <div className="flex items-center justify-between border-b border-slate-200 p-4 dark:border-slate-800">
              <div className="truncate">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-cyan-400">
                  {selectedBlock.type.toUpperCase()} BLOCK
                </span>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                  {selectedBlock.title}
                </h3>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleToggleVisibility(selectedBlock.id)}
                  className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  title={selectedBlock.isVisible ? "Hide Block" : "Show Block"}
                >
                  {selectedBlock.isVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => handleDuplicateBlock(selectedBlock)}
                  className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  title="Duplicate Block"
                >
                  <Copy className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteBlock(selectedBlock.id)}
                  className="p-1.5 text-red-500 hover:text-red-700"
                  title="Delete Block"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedBlockId(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700"
                  title="Close Inspector"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Tab Switcher: Content vs Style */}
            <div className="flex border-b border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setActiveTab("content")}
                className={cn(
                  "flex-1 py-2 text-xs font-bold border-b-2 transition-colors",
                  activeTab === "content"
                    ? "border-blue-600 text-blue-600 dark:border-cyan-400 dark:text-cyan-400"
                    : "border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400",
                )}
              >
                Content
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("style")}
                className={cn(
                  "flex-1 py-2 text-xs font-bold border-b-2 transition-colors",
                  activeTab === "style"
                    ? "border-blue-600 text-blue-600 dark:border-cyan-400 dark:text-cyan-400"
                    : "border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400",
                )}
              >
                Style & Layout
              </button>
            </div>

            {/* Inspector Form Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {activeTab === "content" ? (
                <>
                  {/* Common: Eyebrow */}
                  {"eyebrow" in selectedBlock.data && (
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                        Eyebrow Tag
                      </label>
                      <input
                        type="text"
                        value={selectedBlock.data.eyebrow || ""}
                        onChange={(e) => handleUpdateBlockData("eyebrow", e.target.value)}
                        className="h-8.5 w-full rounded-xl border border-slate-300 bg-white px-3 text-xs text-slate-900 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                    </div>
                  )}

                  {/* Common: Headline Title */}
                  {"title" in selectedBlock.data && (
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                        Headline Title
                      </label>
                      <textarea
                        rows={2}
                        value={selectedBlock.data.title || ""}
                        onChange={(e) => handleUpdateBlockData("title", e.target.value)}
                        className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs text-slate-900 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                    </div>
                  )}

                  {/* Common: Subtitle / Description */}
                  {"subtitle" in selectedBlock.data && (
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                        Subtitle / Paragraph
                      </label>
                      <textarea
                        rows={3}
                        value={selectedBlock.data.subtitle || ""}
                        onChange={(e) => handleUpdateBlockData("subtitle", e.target.value)}
                        className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs text-slate-900 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                    </div>
                  )}

                  {/* Hero Specific */}
                  {selectedBlock.type === "hero" && (
                    <>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                          Primary Button Label
                        </label>
                        <input
                          type="text"
                          value={selectedBlock.data.primaryCtaLabel || ""}
                          onChange={(e) => handleUpdateBlockData("primaryCtaLabel", e.target.value)}
                          className="h-8.5 w-full rounded-xl border border-slate-300 bg-white px-3 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                          Badge Label
                        </label>
                        <input
                          type="text"
                          value={selectedBlock.data.badgeText || ""}
                          onChange={(e) => handleUpdateBlockData("badgeText", e.target.value)}
                          className="h-8.5 w-full rounded-xl border border-slate-300 bg-white px-3 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        />
                      </div>
                    </>
                  )}

                  {/* CRM Bridge Specific */}
                  {selectedBlock.type === "crm_contact" && (
                    <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-3 text-xs space-y-2 dark:border-blue-900 dark:bg-blue-950/40">
                      <div className="font-bold text-blue-800 dark:text-cyan-300 flex items-center gap-1.5">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        ERP CRM Connection
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                        Submissions from this form automatically create Leads in `dbo.CrmLeads` with source set to "Public Website".
                      </p>
                    </div>
                  )}

                  {/* ATS Careers Specific */}
                  {selectedBlock.type === "ats_careers" && (
                    <div className="rounded-xl border border-purple-200 bg-purple-50/60 p-3 text-xs space-y-2 dark:border-purple-900 dark:bg-purple-950/40">
                      <div className="font-bold text-purple-800 dark:text-purple-300 flex items-center gap-1.5">
                        <Users className="h-4 w-4 text-purple-600" />
                        HRMS ATS Connection
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                        Live vacancies from HRMS Recruitment module populate dynamically on this block.
                      </p>
                    </div>
                  )}
                </>
              ) : (
                /* STYLE & LAYOUT TAB */
                <>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                      Background Type
                    </label>
                    <select
                      value={selectedBlock.style.backgroundType}
                      onChange={(e) => handleUpdateBlockStyle("backgroundType", e.target.value)}
                      className="h-8.5 w-full rounded-xl border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    >
                      <option value="transparent">Transparent (Page Default)</option>
                      <option value="solid">Solid Background Color</option>
                      <option value="gradient">Brand Ambient Gradient</option>
                      <option value="glass">Floating Frosted Glass</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                      Vertical Padding
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(["compact", "normal", "spacious"] as const).map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => handleUpdateBlockStyle("paddingY", p)}
                          className={cn(
                            "py-1.5 text-xs font-semibold rounded-lg border capitalize transition-all",
                            selectedBlock.style.paddingY === p
                              ? "bg-blue-600 text-white border-blue-600"
                              : "border-slate-300 text-slate-700 dark:border-slate-700 dark:text-slate-300",
                          )}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                      Text Alignment
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(["left", "center", "right"] as const).map((a) => (
                        <button
                          key={a}
                          type="button"
                          onClick={() => handleUpdateBlockStyle("alignment", a)}
                          className={cn(
                            "py-1.5 text-xs font-semibold rounded-lg border capitalize transition-all",
                            selectedBlock.style.alignment === a
                              ? "bg-blue-600 text-white border-blue-600"
                              : "border-slate-300 text-slate-700 dark:border-slate-700 dark:text-slate-300",
                          )}
                        >
                          {a}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                      Container Width
                    </label>
                    <select
                      value={selectedBlock.style.containerWidth}
                      onChange={(e) => handleUpdateBlockStyle("containerWidth", e.target.value)}
                      className="h-8.5 w-full rounded-xl border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    >
                      <option value="boxed">Boxed (Max-width 896px)</option>
                      <option value="standard">Standard (Max-width 1440px)</option>
                      <option value="full">Full Width (100% Screen)</option>
                    </select>
                  </div>
                </>
              )}
            </div>
          </aside>
        )}
      </div>

      {/* ── MODAL: BLOCK LIBRARY DRAWER ─────────────────────── */}
      {isLibraryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="flex flex-col h-[80vh] w-full max-w-3xl rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 p-5 dark:border-slate-800">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-cyan-400">
                  COMPONENT TOOLBOX
                </span>
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                  Add Section Block
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsLibraryOpen(false)}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Grid */}
            <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {BLOCK_LIBRARY_ITEMS.map((item) => (
                <div
                  key={item.type}
                  onClick={() => handleAddBlock(item.type)}
                  className="group relative flex flex-col justify-between rounded-2xl border border-slate-200 p-4 transition-all duration-200 hover:border-blue-500 hover:shadow-md hover:-translate-y-0.5 cursor-pointer dark:border-slate-800 dark:hover:border-blue-500"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold uppercase text-slate-400">
                        {item.category}
                      </span>
                      {item.badge && (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                      {item.title}
                    </h4>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end text-xs font-bold text-blue-600 dark:text-cyan-400 group-hover:translate-x-1 transition-transform">
                    <span>Insert Block</span>
                    <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: CANVA-STYLE BRAND THEME STUDIO ────────────── */}
      {isThemeStudioOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="flex flex-col w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                  CANVA-STYLE BRANDING ENGINE
                </span>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                  Client Brand Identity Studio
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsThemeStudioOpen(false)}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 space-y-5">
              {/* Color Presets */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                  Brand Palette Presets
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {COLOR_PRESETS.map((preset) => {
                    const isSelected = theme.primaryColor === preset.primary;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => {
                          setTheme((prev) => ({
                            ...prev,
                            primaryColor: preset.primary,
                            secondaryColor: preset.secondary,
                            accentColor: preset.accent,
                          }));
                        }}
                        className={cn(
                          "flex items-center gap-2 rounded-xl border p-2.5 text-left text-xs font-bold transition-all",
                          isSelected
                            ? "border-blue-600 ring-2 ring-blue-500/30 bg-blue-50/40 dark:bg-blue-950/40"
                            : "border-slate-200 hover:border-slate-300 dark:border-slate-800",
                        )}
                      >
                        <div
                          className="h-5 w-5 rounded-full shadow-2xs shrink-0"
                          style={{
                            background: `linear-gradient(135deg, ${preset.primary}, ${preset.secondary})`,
                          }}
                        />
                        <span className="truncate">{preset.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Typography Font Pairing */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                  Typography Pairing
                </label>
                <select
                  value={theme.fontFamily}
                  onChange={(e) =>
                    setTheme((prev) => ({
                      ...prev,
                      fontFamily: e.target.value as any,
                    }))
                  }
                  className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-xs font-bold text-slate-900 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value="Plus Jakarta Sans">Plus Jakarta Sans (Modern Executive)</option>
                  <option value="Inter">Inter (Ultra Clean SaaS)</option>
                  <option value="Outfit">Outfit (Tech Bold)</option>
                  <option value="Playfair Display">Playfair Display (Luxury & Legal)</option>
                  <option value="Space Grotesk">Space Grotesk (Neo-Brutalist Future)</option>
                </select>
              </div>

              {/* Button Corner Radius */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                  Button Style & Radius
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["rounded-md", "rounded-xl", "rounded-full"] as const).map((rad) => (
                    <button
                      key={rad}
                      type="button"
                      onClick={() => setTheme((prev) => ({ ...prev, buttonBorderRadius: rad }))}
                      className={cn(
                        "py-2 text-xs font-bold border transition-all",
                        rad,
                        theme.buttonBorderRadius === rad
                          ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                          : "border-slate-300 text-slate-700 dark:border-slate-700 dark:text-slate-300",
                      )}
                    >
                      {rad === "rounded-md" ? "Sharp (6px)" : rad === "rounded-xl" ? "Smooth (12px)" : "Pill (Full)"}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsThemeStudioOpen(false)}
                className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700"
              >
                Apply Brand Identity
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
