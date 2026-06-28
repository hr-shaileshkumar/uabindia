"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, ChevronDown, Menu, X } from "lucide-react";
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
  const [logoLoadFailed, setLogoLoadFailed] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const brandName = profile.brandName || profile.companyName || "UabIndia ERP";
  const platformMode = audience === "platform";

  const homeHref = useMemo(() => {
    if (
      headerContent.homeHref &&
      isSupportedPublicHref(headerContent.homeHref, audience, allowedPaths)
    ) {
      return headerContent.homeHref;
    }

    return getDefaultPublicHomeHref(audience);
  }, [allowedPaths, audience, headerContent.homeHref]);

  const tenantLinks = useMemo(
    () =>
      filterPublicLinks(headerContent.navLinks, audience, allowedPaths).filter(
        (link) => link.href !== "/login"
      ),
    [allowedPaths, audience, headerContent.navLinks]
  );

  const platformLinks = useMemo(
    () =>
      publicPrimaryNav.filter((item) =>
        isSupportedPublicHref(item.href, audience, allowedPaths)
      ),
    [allowedPaths, audience]
  );

  const primaryCtaHref = withPublicAudience(platformMode ? "/book-demo" : "/login", audience);
  const primaryCtaLabel = platformMode ? "Book Demo" : "Login";
  const loginHref = withPublicAudience("/login", audience);
  const isTransparentHomeNav = platformMode && pathname === "/" && !isScrolled;

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 18);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 backdrop-blur-xl transition duration-300",
        isTransparentHomeNav
          ? "border-b border-transparent bg-white/20"
          : "border-b border-white/70 bg-white/75"
      )}
    >
      {platformMode ? (
        <div className="border-b border-slate-200/70 bg-slate-950 text-white">
          <div className={cnSection(publicSectionClassName, "flex items-center justify-between gap-4 py-2 text-xs")}>
            <p className="font-medium tracking-[0.12em] text-slate-200 uppercase">
              One Platform. Complete Business Management.
            </p>
            <p className="hidden text-slate-300 lg:block">{headerContent.announcement}</p>
          </div>
        </div>
      ) : null}

      <div className={cnSection(publicSectionClassName, "flex items-center justify-between gap-4 py-4")}>
        <Link
          href={withPublicAudience(homeHref, audience)}
          className="flex min-w-0 items-center gap-3"
          onClick={() => {
            setIsMobileMenuOpen(false);
            setOpenMenu(null);
          }}
        >
          {profile.logoUrl && profile.logoUrl !== "/logo.png" && !logoLoadFailed ? (
            <img
              src={profile.logoUrl}
              alt={brandName}
              width={168}
              height={56}
              className="h-10 w-auto max-w-[8.8rem] object-contain sm:max-w-[9.6rem]"
              onError={() => setLogoLoadFailed(true)}
            />
          ) : (
            <img
              src="/logo.png?v=uabindia-20260205"
              alt={brandName}
              width={168}
              height={56}
              className="h-10 w-auto max-w-[8.8rem] object-contain sm:max-w-[9.6rem]"
            />
          )}
          <div className="min-w-0">
            <p className="truncate text-base font-semibold tracking-[-0.03em] text-slate-950">
              {brandName}
            </p>
            <p className="truncate text-xs uppercase tracking-[0.16em] text-slate-500">
              {platformMode ? "Cloud ERP Platform" : "Company workspace"}
            </p>
          </div>
        </Link>

        <div className="hidden flex-1 items-center justify-end gap-3 xl:flex">
          {platformMode ? (
            <nav className="flex items-center gap-1 rounded-full border border-slate-200/80 bg-white/80 px-2 py-1 shadow-[0_16px_34px_rgba(15,23,42,0.05)] backdrop-blur">
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
                        featuredLinks={marketingModules.slice(0, 8).map((module) => ({
                          label: module.title,
                          href: `/products/${module.slug}`,
                          description: module.summary,
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
                        featuredLinks={marketingIndustries.slice(0, 8).map((industry) => ({
                          label: industry.title,
                          href: `/industries/${industry.slug}`,
                          description: industry.summary,
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
                        featuredLinks={resources.slice(0, 6).map((resource) => ({
                          label: resource.title,
                          href: resource.href,
                          description: resource.summary,
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
                    className={navLinkClass(pathname === item.href)}
                  >
                    {item.label}
                  </Link>
                )
              )}
            </nav>
          ) : (
            <nav className="flex items-center gap-1 rounded-full border border-slate-200/80 bg-white/80 px-2 py-1 shadow-[0_16px_34px_rgba(15,23,42,0.05)] backdrop-blur">
              {tenantLinks.map((link) => (
                <Link
                  key={`${link.href}-${link.label}`}
                  href={withPublicAudience(link.href, audience)}
                  className={navLinkClass(pathname === link.href)}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          )}

          {platformMode ? (
            <Link
              href={loginHref}
              className="inline-flex items-center rounded-full px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-white hover:text-slate-950"
            >
              Login
            </Link>
          ) : null}

          <Link href={primaryCtaHref} className={publicButtonClassName.primary}>
            {primaryCtaLabel}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <button
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-[0_12px_24px_rgba(15,23,42,0.06)] transition hover:bg-slate-50 xl:hidden"
          onClick={() => setIsMobileMenuOpen((value) => !value)}
          aria-label="Toggle navigation"
        >
          {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {isMobileMenuOpen ? (
        <div className="border-t border-slate-200 bg-white/95 xl:hidden">
          <div className={cnSection("space-y-4 py-5")}>
            {platformMode ? (
              <>
                <MobileMenuSection
                  label="Products"
                  links={marketingModules.slice(0, 8).map((module) => ({
                    label: module.title,
                    href: `/products/${module.slug}`,
                  }))}
                  audience={audience}
                  onNavigate={() => setIsMobileMenuOpen(false)}
                />
                <MobileMenuSection
                  label="Industries"
                  links={marketingIndustries.slice(0, 8).map((industry) => ({
                    label: industry.title,
                    href: `/industries/${industry.slug}`,
                  }))}
                  audience={audience}
                  onNavigate={() => setIsMobileMenuOpen(false)}
                />
                {platformLinks
                  .filter((link) => !["Products", "Industries"].includes(link.label))
                  .map((link) => (
                    <Link
                      key={link.label}
                      href={withPublicAudience(link.href, audience)}
                      className="block rounded-[1.2rem] border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm font-semibold text-slate-700"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {link.label}
                    </Link>
                  ))}
                <Link
                  href={loginHref}
                  className="block rounded-[1.2rem] border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm font-semibold text-slate-700"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Login
                </Link>
              </>
            ) : (
              tenantLinks.map((link) => (
                <Link
                  key={`${link.href}-${link.label}`}
                  href={withPublicAudience(link.href, audience)}
                  className="block rounded-[1.2rem] border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm font-semibold text-slate-700"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))
            )}

            <Link
              href={primaryCtaHref}
              className={cn(publicButtonClassName.primary, "w-full")}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {primaryCtaLabel}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}

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
    <div
      className="relative"
      onMouseEnter={() => onOpenChange(true)}
      onMouseLeave={() => onOpenChange(false)}
    >
      <button
        type="button"
        className={navLinkClass(active || isOpen)}
        onClick={() => onOpenChange(!isOpen)}
        aria-expanded={isOpen}
      >
        {label}
        <ChevronDown className="h-4 w-4" />
      </button>
      {isOpen ? (
        <div className="absolute top-full left-1/2 z-40 mt-4 w-[42rem] -translate-x-1/2">
          {content}
        </div>
      ) : null}
    </div>
  );
}

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
    <div className="overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white p-5 shadow-[0_28px_80px_rgba(15,23,42,0.14)]">
      <div className="border-b border-slate-100 pb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--erp-primary)]">
          {title}
        </p>
        <p className="mt-2 text-sm leading-7 text-slate-600">{subtitle}</p>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {featuredLinks.map((link) => (
          <Link
            key={`${link.label}-${link.href}`}
            href={withPublicAudience(link.href, audience)}
            className="rounded-[1.25rem] border border-slate-200 bg-slate-50/70 px-4 py-4 transition hover:border-slate-300 hover:bg-white"
          >
            <p className="text-sm font-semibold text-slate-950">{link.label}</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">{link.description}</p>
          </Link>
        ))}
      </div>
      <Link
        href={withPublicAudience(footerHref, audience)}
        className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[color:var(--erp-primary)]"
      >
        {footerLabel}
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

function MobileMenuSection({
  label,
  links,
  audience,
  onNavigate,
}: {
  label: string;
  links: Array<{ label: string; href: string }>;
  audience: PublicAudience;
  onNavigate: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-[1.4rem] border border-slate-200 bg-slate-50/70">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-semibold text-slate-800"
        onClick={() => setOpen((value) => !value)}
      >
        {label}
        <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open ? (
        <div className="space-y-2 border-t border-slate-200 px-4 py-3">
          {links.map((link) => (
            <Link
              key={`${label}-${link.href}`}
              href={withPublicAudience(link.href, audience)}
              className="block rounded-[1rem] bg-white px-3 py-3 text-sm text-slate-600"
              onClick={onNavigate}
            >
              {link.label}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function navLinkClass(active: boolean) {
  return cnSection(
    "inline-flex items-center gap-1 rounded-full px-4 py-3 text-sm font-semibold transition",
    active
      ? "bg-slate-950 text-white shadow-[0_14px_30px_rgba(15,23,42,0.14)]"
      : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
  );
}

function cnSection(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}
