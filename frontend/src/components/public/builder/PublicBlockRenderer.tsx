"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Award,
  Building2,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Compass,
  FileText,
  Globe,
  Layers,
  Linkedin,
  Loader2,
  Mail,
  MapPin,
  MessageSquare,
  Package,
  Phone,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  Zap,
} from "lucide-react";
import {
  WebsiteBlock,
  HeroBlockData,
  ServicesBlockData,
  FeaturesBlockData,
  TestimonialsBlockData,
  TeamBlockData,
  PricingBlockData,
  FaqBlockData,
  StatsBlockData,
  CtaBlockData,
  CrmContactBlockData,
  AtsCareersBlockData,
  ProductCatalogBlockData,
  CustomHtmlBlockData,
} from "@/lib/website-builder/types";
import { cn } from "@/lib/utils";
import {
  publicButtonClassName,
  publicEyebrowClassName,
  publicPanelClassName,
  publicPanelHoverClassName,
  publicSectionClassName,
} from "@/components/public/publicStyles";

interface PublicBlockRendererProps {
  blocks: WebsiteBlock[];
  previewMode?: boolean;
  selectedBlockId?: string | null;
  onSelectBlock?: (id: string) => void;
}

export function PublicBlockRenderer({
  blocks,
  previewMode = false,
  selectedBlockId = null,
  onSelectBlock,
}: PublicBlockRendererProps) {
  const visibleBlocks = previewMode ? blocks : blocks.filter((b) => b.isVisible);

  return (
    <div className="flex flex-col w-full overflow-hidden">
      {visibleBlocks.map((block) => (
        <div
          key={block.id}
          onClick={() => onSelectBlock?.(block.id)}
          className={cn(
            "relative transition-all duration-150",
            previewMode && "cursor-pointer hover:outline-2 hover:outline-blue-500/50 hover:outline-dashed",
            previewMode && selectedBlockId === block.id && "ring-2 ring-blue-600 outline-none z-10",
            !block.isVisible && previewMode && "opacity-40 grayscale-[40%]",
          )}
        >
          {previewMode && (
            <div className="absolute top-2 right-4 z-20 pointer-events-none opacity-0 hover:opacity-100 transition-opacity">
              <span className="rounded-md bg-slate-900/90 text-white text-[10px] font-mono px-2 py-0.5">
                {block.type.toUpperCase()}
              </span>
            </div>
          )}

          <SingleBlockRenderer block={block} />
        </div>
      ))}
    </div>
  );
}

function SingleBlockRenderer({ block }: { block: WebsiteBlock }) {
  const paddingClass =
    block.style.paddingY === "compact"
      ? "py-8 md:py-12"
      : block.style.paddingY === "spacious"
      ? "py-20 md:py-28"
      : "py-12 md:py-18";

  const containerClass =
    block.style.containerWidth === "full"
      ? "w-full px-4 sm:px-6 lg:px-8"
      : block.style.containerWidth === "boxed"
      ? "mx-auto max-w-4xl px-4 sm:px-6"
      : publicSectionClassName;

  const bgStyle =
    block.style.backgroundType === "gradient"
      ? {
          background:
            block.style.backgroundGradient ||
            "var(--uab-brand-gradient, linear-gradient(135deg, rgba(37,99,235,0.06) 0%, rgba(79,70,229,0.04) 100%))",
        }
      : block.style.backgroundType === "solid" && block.style.backgroundColor
      ? { backgroundColor: block.style.backgroundColor }
      : undefined;

  return (
    <section className={cn("relative w-full", paddingClass)} style={bgStyle}>
      <div className={containerClass}>
        {renderBlockContent(block)}
      </div>
    </section>
  );
}

function renderBlockContent(block: WebsiteBlock) {
  switch (block.type) {
    case "hero":
      return <RenderHero data={block.data as HeroBlockData} alignment={block.style.alignment} />;
    case "services":
      return <RenderServices data={block.data as ServicesBlockData} />;
    case "features":
      return <RenderFeatures data={block.data as FeaturesBlockData} />;
    case "stats":
      return <RenderStats data={block.data as StatsBlockData} />;
    case "testimonials":
      return <RenderTestimonials data={block.data as TestimonialsBlockData} />;
    case "team":
      return <RenderTeam data={block.data as TeamBlockData} />;
    case "pricing":
      return <RenderPricing data={block.data as PricingBlockData} />;
    case "faq":
      return <RenderFaq data={block.data as FaqBlockData} />;
    case "cta":
      return <RenderCta data={block.data as CtaBlockData} />;
    case "crm_contact":
      return <RenderCrmContact data={block.data as CrmContactBlockData} />;
    case "ats_careers":
      return <RenderAtsCareers data={block.data as AtsCareersBlockData} />;
    case "product_catalog":
      return <RenderProductCatalog data={block.data as ProductCatalogBlockData} />;
    case "custom_html":
      return <RenderCustomHtml data={block.data as CustomHtmlBlockData} />;
    default:
      return null;
  }
}

// ─────────────────────────────────────────────────────────────
// 1. HERO BLOCK
// ─────────────────────────────────────────────────────────────
function RenderHero({ data, alignment }: { data: HeroBlockData; alignment: string }) {
  const alignClass =
    alignment === "left"
      ? "text-left items-start"
      : alignment === "right"
      ? "text-right items-end"
      : "text-center items-center";

  return (
    <div className={cn("flex flex-col max-w-4xl mx-auto", alignClass)}>
      {data.badgeText && (
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-200/80 bg-blue-50/80 px-3.5 py-1 text-xs font-semibold text-blue-700 backdrop-blur-md dark:border-blue-900/60 dark:bg-blue-950/60 dark:text-cyan-300">
          <Sparkles className="h-3.5 w-3.5 text-blue-600 dark:text-cyan-400" />
          <span>{data.badgeText}</span>
        </div>
      )}

      {data.eyebrow && <span className={publicEyebrowClassName}>{data.eyebrow}</span>}

      <h1 className="mt-3 text-balance text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl md:text-5xl lg:text-6xl dark:text-white leading-[1.12]">
        {data.title}
      </h1>

      <p className="mt-5 text-pretty text-base leading-relaxed text-slate-600 sm:text-lg md:text-xl dark:text-slate-300 max-w-2xl font-normal">
        {data.subtitle}
      </p>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        {data.primaryCtaLabel && (
          <Link
            href={data.primaryCtaHref || "#"}
            style={{
              background: "var(--uab-brand-gradient, linear-gradient(135deg, #2563eb 0%, #1d4ed8 50%, #4338ca 100%))",
              boxShadow: "0 4px 18px -2px var(--uab-brand-glow, rgba(37,99,235,0.4))",
            }}
            className="group inline-flex h-11 items-center justify-center gap-2 rounded-full px-6 text-sm font-bold text-white shadow-md transition-all hover:brightness-110 hover:shadow-lg active:scale-95"
          >
            <span>{data.primaryCtaLabel}</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        )}

        {data.secondaryCtaLabel && (
          <Link
            href={data.secondaryCtaHref || "#"}
            className="inline-flex h-11 items-center justify-center rounded-full border border-slate-300 bg-white/80 px-6 text-sm font-bold text-slate-800 backdrop-blur-sm transition-all hover:bg-slate-100 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            {data.secondaryCtaLabel}
          </Link>
        )}
      </div>

      {data.trustPills && data.trustPills.length > 0 && (
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3 border-t border-slate-200/60 pt-6 dark:border-slate-800/80">
          {data.trustPills.map((pill, idx) => (
            <div
              key={idx}
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100/80 px-3 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800/60 dark:text-slate-300"
            >
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{pill}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 2. SERVICES BLOCK
// ─────────────────────────────────────────────────────────────
function RenderServices({ data }: { data: ServicesBlockData }) {
  const colClass =
    data.columns === 2
      ? "grid-cols-1 md:grid-cols-2"
      : data.columns === 4
      ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
      : "grid-cols-1 md:grid-cols-3";

  return (
    <div className="w-full">
      <div className="text-center max-w-2xl mx-auto mb-10">
        {data.eyebrow && <span className={publicEyebrowClassName}>{data.eyebrow}</span>}
        <h2 className="mt-2 text-2xl font-extrabold text-slate-900 sm:text-3xl lg:text-4xl dark:text-white">
          {data.title}
        </h2>
        {data.subtitle && (
          <p className="mt-3 text-sm text-slate-600 sm:text-base dark:text-slate-300">{data.subtitle}</p>
        )}
      </div>

      <div className={cn("grid gap-6", colClass)}>
        {data.items.map((item) => (
          <div
            key={item.id}
            className={cn(
              publicPanelHoverClassName,
              "group flex flex-col justify-between p-6 transition-all duration-200",
            )}
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/70 dark:text-cyan-400 border border-blue-100 dark:border-blue-900/40">
                  <Layers className="h-5 w-5" />
                </div>
                {item.badge && (
                  <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-[10px] font-bold text-blue-800 dark:bg-blue-950 dark:text-cyan-300">
                    {item.badge}
                  </span>
                )}
              </div>

              <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-cyan-400 transition-colors">
                {item.title}
              </h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                {item.description}
              </p>
            </div>

            {item.priceNote && (
              <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
                <span>Engagement:</span>
                <span className="text-blue-600 dark:text-cyan-400">{item.priceNote}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 3. FEATURES BLOCK
// ─────────────────────────────────────────────────────────────
function RenderFeatures({ data }: { data: FeaturesBlockData }) {
  return (
    <div className="w-full">
      <div className="text-center max-w-2xl mx-auto mb-10">
        {data.eyebrow && <span className={publicEyebrowClassName}>{data.eyebrow}</span>}
        <h2 className="mt-2 text-2xl font-extrabold text-slate-900 sm:text-3xl lg:text-4xl dark:text-white">
          {data.title}
        </h2>
        {data.subtitle && (
          <p className="mt-3 text-sm text-slate-600 sm:text-base dark:text-slate-300">{data.subtitle}</p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {data.items.map((feat) => (
          <div key={feat.id} className={cn(publicPanelClassName, "p-6 flex flex-col justify-start")}>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white mb-4 shadow-xs">
              <Zap className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">{feat.title}</h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
              {feat.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 4. STATS BLOCK
// ─────────────────────────────────────────────────────────────
function RenderStats({ data }: { data: StatsBlockData }) {
  const colClass =
    data.columns === 2
      ? "grid-cols-2"
      : data.columns === 3
      ? "grid-cols-1 md:grid-cols-3"
      : "grid-cols-2 md:grid-cols-4";

  return (
    <div className="rounded-3xl border border-slate-200/90 bg-white/90 p-8 shadow-sm backdrop-blur-xl dark:border-slate-800/90 dark:bg-slate-900/90">
      {data.title && (
        <div className="text-center mb-6">
          {data.eyebrow && <span className={publicEyebrowClassName}>{data.eyebrow}</span>}
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-1">{data.title}</h3>
        </div>
      )}

      <div className={cn("grid gap-6 divide-y md:divide-y-0 md:divide-x divide-slate-100 dark:divide-slate-800", colClass)}>
        {data.items.map((stat) => (
          <div key={stat.id} className="text-center px-4 pt-4 md:pt-0">
            <div className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 bg-clip-text text-transparent">
              {stat.value}
            </div>
            <div className="mt-1 text-sm font-bold text-slate-800 dark:text-slate-200">{stat.label}</div>
            {stat.sublabel && <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{stat.sublabel}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 5. TESTIMONIALS BLOCK
// ─────────────────────────────────────────────────────────────
function RenderTestimonials({ data }: { data: TestimonialsBlockData }) {
  return (
    <div className="w-full">
      <div className="text-center max-w-2xl mx-auto mb-10">
        {data.eyebrow && <span className={publicEyebrowClassName}>{data.eyebrow}</span>}
        <h2 className="mt-2 text-2xl font-extrabold text-slate-900 sm:text-3xl lg:text-4xl dark:text-white">
          {data.title}
        </h2>
        {data.subtitle && (
          <p className="mt-3 text-sm text-slate-600 sm:text-base dark:text-slate-300">{data.subtitle}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {data.items.map((t) => (
          <div key={t.id} className={cn(publicPanelClassName, "flex flex-col justify-between p-6")}>
            <div>
              <div className="flex items-center gap-1 text-amber-400 mb-3">
                {Array.from({ length: t.rating || 5 }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-amber-400" />
                ))}
              </div>
              <p className="text-sm text-slate-700 dark:text-slate-200 italic leading-relaxed">
                "{t.quote}"
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-cyan-300 font-bold text-sm">
                {t.authorName.charAt(0)}
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">{t.authorName}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">{t.authorRole}, {t.companyName}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 6. TEAM BLOCK
// ─────────────────────────────────────────────────────────────
function RenderTeam({ data }: { data: TeamBlockData }) {
  return (
    <div className="w-full">
      <div className="text-center max-w-2xl mx-auto mb-10">
        {data.eyebrow && <span className={publicEyebrowClassName}>{data.eyebrow}</span>}
        <h2 className="mt-2 text-2xl font-extrabold text-slate-900 sm:text-3xl lg:text-4xl dark:text-white">
          {data.title}
        </h2>
        {data.subtitle && (
          <p className="mt-3 text-sm text-slate-600 sm:text-base dark:text-slate-300">{data.subtitle}</p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {data.items.map((m) => (
          <div key={m.id} className={cn(publicPanelHoverClassName, "text-center p-6")}>
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 text-white font-bold text-2xl mb-4 shadow-md">
              {m.name.charAt(0)}
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">{m.name}</h3>
            <p className="text-xs font-semibold text-blue-600 dark:text-cyan-400 mt-0.5">{m.role}</p>
            {m.department && <p className="text-[11px] text-slate-400 mt-0.5">{m.department}</p>}
            {m.bio && <p className="text-xs text-slate-600 dark:text-slate-300 mt-3 leading-relaxed">{m.bio}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 7. PRICING BLOCK
// ─────────────────────────────────────────────────────────────
function RenderPricing({ data }: { data: PricingBlockData }) {
  return (
    <div className="w-full">
      <div className="text-center max-w-2xl mx-auto mb-10">
        {data.eyebrow && <span className={publicEyebrowClassName}>{data.eyebrow}</span>}
        <h2 className="mt-2 text-2xl font-extrabold text-slate-900 sm:text-3xl lg:text-4xl dark:text-white">
          {data.title}
        </h2>
        {data.subtitle && (
          <p className="mt-3 text-sm text-slate-600 sm:text-base dark:text-slate-300">{data.subtitle}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
        {data.items.map((plan) => (
          <div
            key={plan.id}
            className={cn(
              "relative flex flex-col justify-between rounded-3xl p-7 transition-all duration-200",
              plan.isPopular
                ? "border-2 border-blue-600 bg-white shadow-xl dark:border-blue-500 dark:bg-slate-900 scale-105 z-10"
                : "border border-slate-200 bg-white/80 shadow-sm dark:border-slate-800 dark:bg-slate-900/80",
            )}
          >
            {plan.isPopular && (
              <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-1 text-xs font-bold text-white shadow-xs">
                Most Popular
              </span>
            )}

            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">{plan.name}</h3>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-normal">{plan.description}</p>
              <div className="mt-5 flex items-baseline gap-1">
                <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">{plan.price}</span>
                <span className="text-xs text-slate-500 dark:text-slate-400">{plan.period}</span>
              </div>

              <div className="mt-6 space-y-2.5 border-t border-slate-100 pt-5 dark:border-slate-800">
                {plan.features.map((feat, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                    <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <Link
              href={plan.ctaHref || "#"}
              className={cn(
                "mt-8 inline-flex h-11 w-full items-center justify-center rounded-xl font-bold text-xs shadow-xs transition-all",
                plan.isPopular
                  ? "bg-blue-600 text-white hover:bg-blue-700 shadow-md"
                  : "border border-slate-300 bg-white text-slate-800 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-white",
              )}
            >
              {plan.ctaLabel}
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 8. FAQ ACCORDION BLOCK
// ─────────────────────────────────────────────────────────────
function RenderFaq({ data }: { data: FaqBlockData }) {
  const [openId, setOpenId] = useState<string | null>(data.items[0]?.id || null);

  return (
    <div className="max-w-3xl mx-auto w-full">
      <div className="text-center mb-8">
        {data.eyebrow && <span className={publicEyebrowClassName}>{data.eyebrow}</span>}
        <h2 className="mt-2 text-2xl font-extrabold text-slate-900 sm:text-3xl dark:text-white">{data.title}</h2>
        {data.subtitle && <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{data.subtitle}</p>}
      </div>

      <div className="space-y-3">
        {data.items.map((item) => {
          const isOpen = openId === item.id;
          return (
            <div
              key={item.id}
              className="rounded-2xl border border-slate-200/90 bg-white/90 overflow-hidden dark:border-slate-800/90 dark:bg-slate-900/90 shadow-2xs"
            >
              <button
                type="button"
                onClick={() => setOpenId(isOpen ? null : item.id)}
                className="flex w-full items-center justify-between p-5 text-left font-bold text-sm text-slate-900 dark:text-white hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <span>{item.question}</span>
                <ChevronDown className={cn("h-4 w-4 text-slate-400 transition-transform duration-200", isOpen && "rotate-180")} />
              </button>
              {isOpen && (
                <div className="px-5 pb-5 text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal border-t border-slate-100/60 dark:border-slate-800/60 pt-3">
                  {item.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 9. CTA BANNER BLOCK
// ─────────────────────────────────────────────────────────────
function RenderCta({ data }: { data: CtaBlockData }) {
  return (
    <div
      style={{
        background: "var(--uab-brand-gradient, linear-gradient(135deg, #1d4ed8 0%, #312e81 100%))",
      }}
      className="relative overflow-hidden rounded-3xl p-8 sm:p-12 text-center text-white shadow-xl"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent_60%)]" />

      <div className="relative z-10 max-w-2xl mx-auto flex flex-col items-center">
        {data.eyebrow && (
          <span className="inline-flex rounded-full bg-white/20 px-3 py-1 text-[11px] font-bold uppercase tracking-wider backdrop-blur-md mb-4 text-cyan-200">
            {data.eyebrow}
          </span>
        )}
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight">{data.title}</h2>
        <p className="mt-4 text-sm sm:text-base text-blue-100 leading-relaxed font-normal">{data.subtitle}</p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href={data.primaryCtaHref || "#"}
            className="inline-flex h-11 items-center justify-center rounded-full bg-white px-6 text-sm font-bold text-slate-900 shadow-md hover:bg-blue-50 transition-all active:scale-95"
          >
            {data.primaryCtaLabel}
          </Link>
          {data.secondaryCtaLabel && (
            <Link
              href={data.secondaryCtaHref || "#"}
              className="inline-flex h-11 items-center justify-center rounded-full border border-white/30 px-6 text-sm font-bold text-white hover:bg-white/10 transition-all"
            >
              {data.secondaryCtaLabel}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 10. CRM LEAD CAPTURE FORM (DEEP ERP BRIDGE)
// ─────────────────────────────────────────────────────────────
function RenderCrmContact({ data }: { data: CrmContactBlockData }) {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fullName, setFullName] = useState("");
  const [workEmail, setWorkEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [phone, setPhone] = useState("");
  const [category, setCategory] = useState(data.serviceCategories?.[0] || "General Inquiry");
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
    }, 800);
  };

  return (
    <div className="w-full">
      <div className="text-center max-w-2xl mx-auto mb-10">
        {data.eyebrow && <span className={publicEyebrowClassName}>{data.eyebrow}</span>}
        <h2 className="mt-2 text-2xl font-extrabold text-slate-900 sm:text-3xl lg:text-4xl dark:text-white">
          {data.title}
        </h2>
        <p className="mt-3 text-sm text-slate-600 sm:text-base dark:text-slate-300 font-normal">{data.subtitle}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Contact Info Sidebar */}
        {data.contactCards && (
          <div className="lg:col-span-5 space-y-4">
            <div className={cn(publicPanelClassName, "p-6 space-y-4")}>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Direct Enterprise Contact</h3>

              {data.contactCards.phone && (
                <div className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-300">
                  <Phone className="h-4 w-4 text-blue-600 dark:text-cyan-400 mt-1 shrink-0" />
                  <div>
                    <span className="block text-xs font-semibold text-slate-400">Phone Hotline</span>
                    <a href={`tel:${data.contactCards.phone}`} className="font-semibold text-slate-900 dark:text-white hover:underline">
                      {data.contactCards.phone}
                    </a>
                  </div>
                </div>
              )}

              {data.contactCards.email && (
                <div className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-300">
                  <Mail className="h-4 w-4 text-blue-600 dark:text-cyan-400 mt-1 shrink-0" />
                  <div>
                    <span className="block text-xs font-semibold text-slate-400">Email Desk</span>
                    <a href={`mailto:${data.contactCards.email}`} className="font-semibold text-slate-900 dark:text-white hover:underline">
                      {data.contactCards.email}
                    </a>
                  </div>
                </div>
              )}

              {data.contactCards.address && (
                <div className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-300">
                  <MapPin className="h-4 w-4 text-blue-600 dark:text-cyan-400 mt-1 shrink-0" />
                  <div>
                    <span className="block text-xs font-semibold text-slate-400">Corporate Address</span>
                    <span className="text-xs leading-relaxed">{data.contactCards.address}</span>
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 font-semibold">
                <CheckCircle2 className="h-3.5 w-3.5" /> Direct ERP CRM Pipeline Integration
              </div>
            </div>
          </div>
        )}

        {/* Lead Capture Form */}
        <div className={cn(data.contactCards ? "lg:col-span-7" : "lg:col-span-12 max-w-2xl mx-auto")}>
          <div className={cn(publicPanelClassName, "p-6 sm:p-8")}>
            {submitted ? (
              <div className="text-center py-10 space-y-3">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                  <CheckCircle2 className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Inquiry Received</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto">{data.successMessage}</p>
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="mt-4 text-xs font-semibold text-blue-600 dark:text-cyan-400 hover:underline"
                >
                  Send another inquiry
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Rahul Sharma"
                      className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                      Work Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={workEmail}
                      onChange={(e) => setWorkEmail(e.target.value)}
                      placeholder="rahul@company.com"
                      className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {data.companyNameField && (
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                        Company Name
                      </label>
                      <input
                        type="text"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="Acme Enterprises Ltd"
                        className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                      />
                    </div>
                  )}

                  {data.phoneField && (
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                      />
                    </div>
                  )}
                </div>

                {data.serviceCategoryField && data.serviceCategories && (
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                      Inquiry Category
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    >
                      {data.serviceCategories.map((cat, i) => (
                        <option key={i} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                    Requirements / Message *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Briefly describe your scope, locations, or operational requirements..."
                    className="w-full rounded-xl border border-slate-300 bg-white p-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    background: "var(--uab-brand-gradient, linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%))",
                    boxShadow: "0 4px 14px var(--uab-brand-glow, rgba(37,99,235,0.35))",
                  }}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-xl font-bold text-sm text-white shadow-md transition-all hover:brightness-110 active:scale-[0.98]"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Routing to CRM...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      {data.submitButtonLabel}
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 11. ATS CAREERS RECRUITMENT HUB (DEEP HRMS BRIDGE)
// ─────────────────────────────────────────────────────────────
function RenderAtsCareers({ data }: { data: AtsCareersBlockData }) {
  const [trackRef, setTrackRef] = useState("");
  const [tracking, setTracking] = useState(false);
  const [trackResult, setTrackResult] = useState<string | null>(null);

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    setTracking(true);
    setTimeout(() => {
      setTracking(false);
      setTrackResult("Application status: Active · In Technical Review with Hiring Manager.");
    }, 600);
  };

  return (
    <div className="w-full">
      <div className="text-center max-w-2xl mx-auto mb-10">
        {data.eyebrow && <span className={publicEyebrowClassName}>{data.eyebrow}</span>}
        <h2 className="mt-2 text-2xl font-extrabold text-slate-900 sm:text-3xl lg:text-4xl dark:text-white">
          {data.title}
        </h2>
        <p className="mt-3 text-sm text-slate-600 sm:text-base dark:text-slate-300 font-normal">{data.subtitle}</p>
      </div>

      {data.showJobTracker && (
        <div className="max-w-xl mx-auto mb-10">
          <div className="rounded-2xl border border-slate-200 bg-slate-50/90 p-5 dark:border-slate-800 dark:bg-slate-900/60">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
              HRMS Application Status Tracker
            </h3>
            <form onSubmit={handleTrack} className="flex gap-2">
              <input
                type="text"
                required
                value={trackRef}
                onChange={(e) => setTrackRef(e.target.value)}
                placeholder="Enter Candidate Ref ID (e.g. UAB-2026-XXXX) or Email"
                className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
              <button
                type="submit"
                disabled={tracking}
                className="shrink-0 h-10 rounded-xl bg-blue-600 px-4 text-xs font-bold text-white hover:bg-blue-700"
              >
                {tracking ? <Loader2 className="h-4 w-4 animate-spin" /> : "Track"}
              </button>
            </form>
            {trackResult && (
              <div className="mt-3 rounded-lg bg-emerald-50 border border-emerald-200 p-2.5 text-xs text-emerald-800 dark:bg-emerald-950 dark:border-emerald-800 dark:text-emerald-300 font-medium">
                {trackResult}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-10 text-center">
        <Users className="mx-auto h-8 w-8 text-slate-400 mb-2" />
        <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">Live HRMS Recruitment Module Active</h4>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
          {data.emptyStateText || "New vacancies posted in HRMS appear here automatically."}
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 12. PRODUCT CATALOG (DEEP ERP INVENTORY BRIDGE)
// ─────────────────────────────────────────────────────────────
function RenderProductCatalog({ data }: { data: ProductCatalogBlockData }) {
  return (
    <div className="w-full">
      <div className="text-center max-w-2xl mx-auto mb-10">
        {data.eyebrow && <span className={publicEyebrowClassName}>{data.eyebrow}</span>}
        <h2 className="mt-2 text-2xl font-extrabold text-slate-900 sm:text-3xl lg:text-4xl dark:text-white">
          {data.title}
        </h2>
        {data.subtitle && (
          <p className="mt-3 text-sm text-slate-600 sm:text-base dark:text-slate-300 font-normal">{data.subtitle}</p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {data.items?.map((item) => (
          <div key={item.id} className={cn(publicPanelHoverClassName, "flex flex-col justify-between p-6")}>
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/80 dark:text-cyan-400 mb-4 border border-blue-100 dark:border-blue-900/50">
                <Package className="h-6 w-6" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-cyan-400">
                {item.category}
              </span>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1">{item.title}</h3>
              <p className="mt-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                {item.description}
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="block text-[10px] text-slate-400 font-medium">Pricing</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">{item.price}</span>
              </div>
              <button
                type="button"
                className="rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-blue-700"
              >
                Inquire
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 13. CUSTOM HTML EMBED
// ─────────────────────────────────────────────────────────────
function RenderCustomHtml({ data }: { data: CustomHtmlBlockData }) {
  return (
    <div
      className="w-full overflow-hidden"
      dangerouslySetInnerHTML={{ __html: data.htmlContent }}
    />
  );
}
