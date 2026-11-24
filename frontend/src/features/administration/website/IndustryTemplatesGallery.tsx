"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  ExternalLink,
  Eye,
  Layers,
  Palette,
  Sparkles,
  Zap,
} from "lucide-react";
import { INDUSTRY_TEMPLATES, type IndustryTemplatePreset } from "./industryTemplatePresets";
import { notifySuccess } from "@/lib/notifications";
import { cn } from "@/lib/utils";

interface IndustryTemplatesGalleryProps {
  onApplyTemplate?: (template: IndustryTemplatePreset) => void;
  activeTemplateId?: string;
}

export default function IndustryTemplatesGallery({
  onApplyTemplate,
  activeTemplateId,
}: IndustryTemplatesGalleryProps) {
  const [selectedIndustry, setSelectedIndustry] = useState<string>("All");
  const [previewTemplate, setPreviewTemplate] = useState<IndustryTemplatePreset | null>(null);
  const [applyingId, setApplyingId] = useState<string | null>(null);

  const industries = ["All", "Corporate", "Healthcare", "Education", "Manufacturing", "Agency", "Hospitality"];

  const filteredTemplates =
    selectedIndustry === "All"
      ? INDUSTRY_TEMPLATES
      : INDUSTRY_TEMPLATES.filter((t) => t.industry === selectedIndustry);

  const handleApply = (template: IndustryTemplatePreset) => {
    setApplyingId(template.id);
    setTimeout(() => {
      if (onApplyTemplate) {
        onApplyTemplate(template);
      } else {
        // Save to localStorage so WebsiteCustomizer picks it up
        try {
          localStorage.setItem("uab_applied_template", JSON.stringify(template));
        } catch {}
        notifySuccess(
          `Template Applied: ${template.name}`,
          "Website blocks, colors, slides, and copy updated. Head to the Customizer or Live Site to review."
        );
      }
      setApplyingId(null);
    }, 400);
  };

  return (
    <div className="space-y-6">
      {/* Studio Header */}
      <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-blue-50/40 p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900/60 dark:from-slate-900 dark:via-slate-900/90 dark:to-blue-950/20">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Multi-Client Agency Design System</span>
            </div>
            <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
              Website Template Studio & Industry Presets
            </h1>
            <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              Transform your website instantly without touching code. Each template includes hand-crafted hero typography, high-res carousel slides, brand color tokens, branch locator maps, and pre-written enterprise copy.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/administration/website"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <Layers className="h-4 w-4" />
              <span>Open Customizer</span>
            </Link>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-slate-200/80 pt-4 dark:border-slate-800/80">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 mr-1">Industry:</span>
          {industries.map((ind) => (
            <button
              key={ind}
              type="button"
              onClick={() => setSelectedIndustry(ind)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
                selectedIndustry === ind
                  ? "bg-blue-600 text-white shadow-xs font-bold"
                  : "bg-white text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              )}
            >
              {ind}
            </button>
          ))}
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredTemplates.map((template) => {
          const isCurrentActive = activeTemplateId === template.id;
          const isApplying = applyingId === template.id;

          return (
            <div
              key={template.id}
              className={cn(
                "group relative flex flex-col justify-between overflow-hidden rounded-2xl border bg-white shadow-xs transition-all hover:shadow-md dark:bg-slate-900",
                isCurrentActive
                  ? "border-blue-500 ring-2 ring-blue-500/20 dark:border-blue-400"
                  : "border-slate-200 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700"
              )}
            >
              {/* Card Image Banner */}
              <div className="relative h-48 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                <img
                  src={template.slides[0]?.imageUrl || "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80"}
                  alt={template.name}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />

                {/* Badges on Banner */}
                <div className="absolute left-3 top-3 flex items-center gap-1.5">
                  <span className="rounded-md bg-white/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-900 backdrop-blur-xs">
                    {template.industry}
                  </span>
                  <span className="rounded-md bg-blue-600/90 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-xs">
                    {template.badge}
                  </span>
                </div>

                {isCurrentActive && (
                  <div className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-emerald-500 px-2.5 py-0.5 text-[11px] font-bold text-white shadow-sm">
                    <Check className="h-3 w-3 stroke-[3]" />
                    <span>Active Live</span>
                  </div>
                )}

                {/* Slide Title preview */}
                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-blue-300">
                    {template.hero.eyebrow}
                  </p>
                  <p className="line-clamp-1 text-sm font-bold text-white">
                    {template.hero.title}
                  </p>
                </div>
              </div>

              {/* Card Details Body */}
              <div className="flex flex-1 flex-col p-5">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {template.name}
                </h3>
                <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                  {template.description}
                </p>

                {/* Color Swatches & Header style pill */}
                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-medium text-slate-500">Palette:</span>
                    <span
                      className="h-4 w-4 rounded-full border border-white shadow-xs dark:border-slate-800"
                      style={{ backgroundColor: template.primaryColor }}
                      title={`Primary: ${template.primaryColor}`}
                    />
                    <span
                      className="h-4 w-4 rounded-full border border-white shadow-xs dark:border-slate-800"
                      style={{ backgroundColor: template.accentColor }}
                      title={`Accent: ${template.accentColor}`}
                    />
                  </div>

                  <div className="flex items-center gap-1 text-[11px] text-slate-500">
                    <span className="font-medium">Header:</span>
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      {template.headerStyle}
                    </span>
                  </div>
                </div>

                {/* Included Block Badges */}
                <div className="mt-3 flex flex-wrap gap-1 text-[10.5px]">
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    Hero Slider ({template.slides.length})
                  </span>
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    Maps & Branches ({template.locations.length})
                  </span>
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    FAQ Accordion ({template.faqs.length})
                  </span>
                </div>

                {/* Card Actions */}
                <div className="mt-5 flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => handleApply(template)}
                    disabled={isApplying}
                    className={cn(
                      "flex-1 inline-flex h-9 items-center justify-center gap-1.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer",
                      isCurrentActive
                        ? "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                    )}
                  >
                    {isApplying ? (
                      <span className="inline-flex items-center gap-1">
                        <div className="h-3 w-3 animate-spin rounded-full border border-white border-t-transparent" />
                        <span>Applying...</span>
                      </span>
                    ) : (
                      <>
                        <Zap className="h-3.5 w-3.5" />
                        <span>{isCurrentActive ? "Re-Apply Preset" : "Apply Template"}</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setPreviewTemplate(template)}
                    className="inline-flex h-9 items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                    title="View Template Details"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span>Details</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Details Modal */}
      {previewTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
          <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 dark:border-slate-800">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-cyan-400">
                  {previewTemplate.industry} Template
                </span>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {previewTemplate.name}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setPreviewTemplate(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs text-slate-600 dark:text-slate-300">
              <p className="text-sm font-medium">{previewTemplate.description}</p>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-850">
                <p className="font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                  Sample Hero Section Copy
                </p>
                <p className="mt-2 text-sm font-extrabold text-slate-900 dark:text-white">
                  &ldquo;{previewTemplate.hero.title}&rdquo;
                </p>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                  {previewTemplate.hero.subtitle}
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <span className="rounded-md bg-blue-600 px-2.5 py-1 text-[11px] font-bold text-white">
                    {previewTemplate.hero.primaryCta}
                  </span>
                  <span className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    {previewTemplate.hero.secondaryCta}
                  </span>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-white p-3.5 dark:border-slate-800 dark:bg-slate-850">
                  <span className="font-bold text-slate-900 dark:text-white">Color System</span>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="h-5 w-5 rounded-full" style={{ backgroundColor: previewTemplate.primaryColor }} />
                    <span className="font-mono text-xs">{previewTemplate.primaryColor} (Primary)</span>
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="h-5 w-5 rounded-full" style={{ backgroundColor: previewTemplate.accentColor }} />
                    <span className="font-mono text-xs">{previewTemplate.accentColor} (Accent)</span>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-3.5 dark:border-slate-800 dark:bg-slate-850">
                  <span className="font-bold text-slate-900 dark:text-white">SEO & Schema Type</span>
                  <p className="mt-2 font-mono text-xs text-blue-600 dark:text-cyan-400">
                    Schema: {previewTemplate.seo.schemaType}
                  </p>
                  <p className="mt-1 line-clamp-2 text-[11px] text-slate-500">
                    Title: {previewTemplate.seo.metaTitle}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-200 pt-4 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setPreviewTemplate(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  handleApply(previewTemplate);
                  setPreviewTemplate(null);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 cursor-pointer"
              >
                <Zap className="h-4 w-4" />
                <span>Apply This Template Now</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
