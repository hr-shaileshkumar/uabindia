"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, ChevronDown, Menu, Sparkles, X } from "lucide-react";
import type { ClientProfile } from "@/lib/publicProfile";
import type { PublicAudience } from "@/lib/public-audience";
import type { PublicHeaderContent } from "@/lib/publicSiteContent";
import { withPublicAudience } from "@/lib/public-audience";
import {
  filterPublicLinks,
  getDefaultPublicHomeHref,
  isSupportedPublicHref,
} from "@/lib/public-site-map";
import {
  marketingIndustries,
  marketingModules,
  publicPrimaryNav,
  resources,
} from "@/lib/public-marketing";
import { cn } from "@/lib/utils";
import { publicButtonClassName, publicSectionClassName } from "@/components/public/publicStyles";

type PublicHeaderProps = {
  audience?: PublicAudience;
  profile: ClientProfile;
  headerContent: PublicHeaderContent;
  allowedPaths?: string[];
};

type PlatformMenuKey = "products" | "industries" | "resources" | null;

export default function PublicHeader({
  audience = "tenant",
  profile,
  headerContent,
  allowedPaths,
}: PublicHeaderProps) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<PlatformMenuKey>(null);
  const [isScrolled, setIsScrolled] = useState(false);

  const brandName = profile.brandName || profile.companyName || "UabIndia ERP";
  const platformMode = audience === "platform";

  const homeHref = useMemo(() => {
    if (headerContent.homeHref && isSupportedPublicHref(headerContent.homeHref, audience, allowedPaths)) {
      return headerContent.homeHref;
    }
    return getDefaultPublicHomeHref(audience);
  }, [allowedPaths, audience, headerContent.homeHref]);

  const tenantLinks = useMemo(
    () => filterPublicLinks(headerContent.navLinks, audience, allowedPaths).filter((l) => l.href !== "/login"),
    [allowedPaths, audience, headerContent.navLinks]
  );

  const platformLinks = useMemo(
    () => publicPrimaryNav.filter((item) => isSupportedPublicHref(item.href, audience, allowedPaths)),
    [allowedPaths, audience]
  );

  const primaryCtaHref = withPublicAudience("/login", audience);
  const primaryCtaLabel = "Login";

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 16);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setOpenMenu(null);
  }, [pathname]);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300",
        isScrolled
          ? "border-b border-slate-200 bg-white/85 shadow-sm backdrop-blur-[12px]"
          : "border-b border-transparent bg-white/80 backdrop-blur-[12px]"
      )}
    >
      {/* Announcement banner */}
      {platformMode && headerContent.announcement ? (
        <div className="w-full border-b border-indigo-100 bg-indigo-50/90 py-2 px-3">
          <div className="w-full flex items-center justify-center gap-2 text-center">
            <Sparkles className="h-3.5 w-3.5 shrink-0 text-indigo-600" />
            <p className="font-semibold tracking-wide text-indigo-700 whitespace-nowrap text-[10px] min-[400px]:text-[11px] sm:text-xs md:text-sm">
              {headerContent.announcement}
            </p>
          </div>
        </div>
      ) : null}

      <div className="mx-auto w-full max-w-[88rem] px-8 xl:px-16 flex items-center justify-between gap-4 h-20">
        {/* Logo */}
        <Link
          href={withPublicAudience(homeHref, audience)}
          className="flex min-w-0 items-center gap-2 group"
          onClick={() => { setIsMobileMenuOpen(false); setOpenMenu(null); }}
        >
          <img
            src="/logo.png"
            alt={brandName}
            className="h-6 w-auto object-contain transition group-hover:opacity-80"
          />
        </Link>

        {/* Desktop nav */}
        <div className="hidden flex-1 items-center justify-center gap-1 lg:flex">
          {platformMode ? (
            <nav className="flex items-center gap-0.5">
              {platformLinks.map((item) =>
                item.label === "Products" ? (
                  <MenuTrigger
                    key={item.label}
                    label={item.label}
                    active={pathname.startsWith("/products")}
                    isOpen={openMenu === "products"}
                    onOpenChange={(next) => setOpenMenu(next ? "products" : null)}
                    content={
                      <MegaMenuGrid
                        title="Product suite"
                        subtitle="Connected modules for people, finance, operations, and service teams."
                        featuredLinks={marketingModules.slice(0, 6).map((m) => ({
                          label: m.title,
                          href: `/products/${m.slug}`,
                          description: m.summary,
                        }))}
                        footerHref="/products"
                        footerLabel="View all products"
                        audience={audience}
                      />
                    }
                  />
                ) : item.label === "Industries" ? (
                  <MenuTrigger
                    key={item.label}
                    label={item.label}
                    active={pathname.startsWith("/industries")}
                    isOpen={openMenu === "industries"}
                    onOpenChange={(next) => setOpenMenu(next ? "industries" : null)}
                    content={
                      <MegaMenuGrid
                        title="Industry solutions"
                        subtitle="See how the same platform adapts to different operating models."
                        featuredLinks={marketingIndustries.slice(0, 6).map((ind) => ({
                          label: ind.title,
                          href: `/industries/${ind.slug}`,
                          description: ind.summary,
                        }))}
                        footerHref="/industries"
                        footerLabel="View all industries"
                        audience={audience}
                      />
                    }
                  />
                ) : item.label === "Resources" ? (
                  <MenuTrigger
                    key={item.label}
                    label={item.label}
                    active={pathname.startsWith("/resources")}
                    isOpen={openMenu === "resources"}
                    onOpenChange={(next) => setOpenMenu(next ? "resources" : null)}
                    content={
                      <MegaMenuGrid
                        title="Resources"
                        subtitle="Practical material for evaluation, rollout planning, and executive review."
                        featuredLinks={resources.slice(0, 4).map((r) => ({
                          label: r.title,
                          href: r.href,
                          description: r.summary,
                        }))}
                        footerHref="/resources"
                        footerLabel="Open resource center"
                        audience={audience}
                      />
                    }
                  />
                ) : (
                  <Link
                    key={item.label}
                    href={withPublicAudience(item.href, audience)}
                    className={cn(
                      "transition-all duration-200 text-sm font-semibold",
                      pathname === item.href || pathname.startsWith(item.href + "/")
                        ? "rounded-full bg-indigo-50/70 text-indigo-700 shadow-[0_2px_8px_rgba(79,70,229,0.08)] px-4 py-2 border border-indigo-100/50"
                        : "rounded-lg px-3.5 py-2 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    )}
                  >
                    {item.label}
                  </Link>
                )
              )}
            </nav>
          ) : (
            <nav className="flex items-center gap-0.5">
              {tenantLinks.map((link) => (
                <Link
                  key={link.href}
                  href={withPublicAudience(link.href, audience)}
                  className={cn(
                    "transition-all duration-200 text-sm font-semibold",
                    pathname === link.href
                      ? "rounded-full bg-indigo-50/70 text-indigo-700 shadow-[0_2px_8px_rgba(79,70,229,0.08)] px-4 py-2 border border-indigo-100/50"
                      : "rounded-lg px-3.5 py-2 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          )}
        </div>

        {/* CTA row */}
        <div className="flex items-center gap-3">
          <Link
            href={primaryCtaHref}
            className="hidden lg:inline-flex h-[52px] px-8 items-center justify-center gap-2 rounded-2xl bg-indigo-600 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(79,70,229,0.4)] transition-all duration-200 hover:bg-gradient-to-r hover:from-indigo-600 hover:to-indigo-700 hover:shadow-[0_6px_20px_rgba(79,70,229,0.5)] hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            {primaryCtaLabel}
            <ArrowRight className="h-4 w-4" />
          </Link>
          {/* Mobile menu toggle */}
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 lg:hidden"
            onClick={() => setIsMobileMenuOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="border-t border-slate-100 bg-white lg:hidden">
          <div className={cn(publicSectionClassName, "py-5 space-y-1")}>
            {(platformMode ? platformLinks : tenantLinks).map((item) => (
              <Link
                key={item.href || item.label}
                href={withPublicAudience("href" in item ? item.href : "#", audience)}
                className={cn(
                  "flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  pathname === ("href" in item ? item.href : "")
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                {item.label}
              </Link>
            ))}
            <div className="pt-3 border-t border-slate-100 mt-3">
              <Link href={primaryCtaHref} className={cn(publicButtonClassName.primary, "w-full justify-center")}>
                {primaryCtaLabel}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

// ─── Menu Trigger ──────────────────────────────────────────────────────────────

function MenuTrigger({
  label,
  active,
  isOpen,
  onOpenChange,
  content,
}: {
  label: string;
  active: boolean;
  isOpen: boolean;
  onOpenChange: (next: boolean) => void;
  content: ReactNode;
}) {
  return (
    <div className="relative" onMouseEnter={() => onOpenChange(true)} onMouseLeave={() => onOpenChange(false)}>
      <button
        type="button"
        className={cn(
          "flex items-center gap-1 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors",
          active || isOpen
            ? "bg-indigo-50 text-indigo-700"
            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
        )}
        aria-expanded={isOpen}
      >
        {label}
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-200", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="absolute left-1/2 top-full z-50 w-[680px] -translate-x-1/2 pt-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_16px_48px_rgba(15,23,42,0.12)]">
            {content}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Mega Menu Grid ────────────────────────────────────────────────────────────

function MegaMenuGrid({
  title,
  subtitle,
  featuredLinks,
  footerHref,
  footerLabel,
  audience,
}: {
  title: string;
  subtitle: string;
  featuredLinks: Array<{ label: string; href: string; description: string }>;
  footerHref: string;
  footerLabel: string;
  audience: PublicAudience;
}) {
  return (
    <div>
      <div className="mb-4 border-b border-slate-100 pb-4">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">{title}</p>
        <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        {featuredLinks.map((link) => (
          <Link
            key={link.href}
            href={withPublicAudience(link.href, audience)}
            className="group rounded-xl p-3 transition-colors hover:bg-indigo-50"
          >
            <p className="text-sm font-semibold text-slate-800 group-hover:text-indigo-700">{link.label}</p>
            <p className="mt-0.5 text-xs leading-5 text-slate-500 line-clamp-2">{link.description}</p>
          </Link>
        ))}
      </div>
      <div className="mt-4 border-t border-slate-100 pt-3">
        <Link
          href={withPublicAudience(footerHref, audience)}
          className="flex items-center gap-1.5 text-sm font-semibold text-indigo-600 transition hover:text-indigo-700"
        >
          {footerLabel}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
