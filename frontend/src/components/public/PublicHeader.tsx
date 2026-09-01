"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import type { ClientProfile } from "@/lib/publicProfile";
import type { PublicAudience } from "@/lib/public-audience";
import type { PublicHeaderContent } from "@/lib/publicSiteContent";
import { withPublicAudience } from "@/lib/public-audience";
import { getDefaultPublicHomeHref, getPublicNavLinks } from "@/lib/public-site-map";
import { cn } from "@/lib/utils";
import { publicButtonClassName, publicSectionClassName } from "@/components/public/publicStyles";

type PublicHeaderProps = {
  audience?: PublicAudience;
  profile: ClientProfile;
  headerContent: PublicHeaderContent;
  allowedPaths?: string[];
};

/** Primary nav for platform marketing center and right sections */
const PLATFORM_CENTER_HREFS = ["/products", "/industries", "/pricing", "/resources"];
const PLATFORM_RIGHT_HREFS = ["/about", "/careers", "/contact"];
const TENANT_NAV_HREFS = ["/about", "/careers", "/contact"];

export default function PublicHeader({
  audience = "tenant",
  profile,
  headerContent,
}: PublicHeaderProps) {
  const pathname = usePathname() || "";
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const brandName = profile.brandName || profile.companyName || "UabIndia ERP";
  const platformMode = audience === "platform";

  const homeHref = headerContent.homeHref || getDefaultPublicHomeHref(audience);

  const { centerLinks, rightLinks } = useMemo(() => {
    const defaults = getPublicNavLinks(audience, "primary");
    
    if (platformMode) {
      const center = PLATFORM_CENTER_HREFS
        .map((href) => defaults.find((link) => link.href === href))
        .filter((link): link is { label: string; href: string } => Boolean(link));
      const right = PLATFORM_RIGHT_HREFS
        .map((href) => defaults.find((link) => link.href === href))
        .filter((link): link is { label: string; href: string } => Boolean(link));
      return { centerLinks: center, rightLinks: right };
    } else {
      const tenantLinks = TENANT_NAV_HREFS
        .map((href) => defaults.find((link) => link.href === href))
        .filter((link): link is { label: string; href: string } => Boolean(link));
      return { centerLinks: [], rightLinks: tenantLinks };
    }
  }, [audience, platformMode]);

  const allMobileLinks = useMemo(() => [...centerLinks, ...rightLinks], [centerLinks, rightLinks]);

  const primaryCtaHref = withPublicAudience(
    headerContent.primaryCtaHref || (platformMode ? "/book-demo" : "/login"),
    audience,
  );
  const primaryCtaLabel = headerContent.primaryCtaLabel || (platformMode ? "Book demo" : "Login");
  const secondaryCtaHref = platformMode ? withPublicAudience("/login", audience) : null;

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 4);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const isActive = (href: string) => {
    const path = href.split("?")[0];
    if (path === "/") return pathname === "/";
    return pathname === path || pathname.startsWith(`${path}/`);
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b bg-white/90 backdrop-blur-xl transition-shadow",
        isScrolled ? "border-slate-200/90 shadow-sm shadow-slate-200/40" : "border-slate-200/70",
      )}
    >
      <div className={cn(publicSectionClassName, "flex h-16 items-center justify-between gap-4")}>
        {/* Left: Brand Logo */}
        <Link
          href={withPublicAudience(homeHref, audience)}
          className="flex shrink-0 items-center"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <img src={profile.logoUrl || "/logo.png"} alt={brandName} className="h-7 w-auto object-contain" />
        </Link>

        {/* Center: Main Product / Solutions Nav (in Platform mode) */}
        {centerLinks.length > 0 && (
          <nav className="hidden items-center gap-1 lg:flex">
            {centerLinks.map((item) => (
              <Link
                key={item.href}
                href={withPublicAudience(item.href, audience)}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-medium transition",
                  isActive(item.href)
                    ? "bg-slate-100 text-slate-900"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        )}

        {/* Right: Company Nav (About, Careers, Contact) + Auth CTAs */}
        <div className="hidden items-center gap-2 lg:flex">
          {rightLinks.map((item) => (
            <Link
              key={item.href}
              href={withPublicAudience(item.href, audience)}
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-medium transition",
                isActive(item.href)
                  ? "bg-slate-100 text-slate-900 font-semibold"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
              )}
            >
              {item.label}
            </Link>
          ))}

          <div className="ml-2 flex items-center gap-2 border-l border-slate-200 pl-3">
            {secondaryCtaHref ? (
              <Link href={secondaryCtaHref} className={publicButtonClassName.ghost}>
                Login
              </Link>
            ) : null}
            <Link href={primaryCtaHref} className={publicButtonClassName.primary}>
              {primaryCtaLabel}
            </Link>
          </div>
        </div>

        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-700 lg:hidden"
          onClick={() => setIsMobileMenuOpen((open) => !open)}
          aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
        >
          {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>

      {isMobileMenuOpen ? (
        <div className="border-t border-slate-200 bg-white lg:hidden">
          <div className={cn(publicSectionClassName, "space-y-1 py-3")}>
            {allMobileLinks.map((item) => (
              <Link
                key={item.href}
                href={withPublicAudience(item.href, audience)}
                className={cn(
                  "block rounded-lg px-3 py-2.5 text-sm font-medium",
                  isActive(item.href) ? "bg-slate-100 text-slate-900" : "text-slate-700",
                )}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <div className="flex flex-col gap-2 border-t border-slate-100 pt-3">
              {secondaryCtaHref ? (
                <Link
                  href={secondaryCtaHref}
                  className={publicButtonClassName.secondary}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Login
                </Link>
              ) : null}
              <Link
                href={primaryCtaHref}
                className={publicButtonClassName.primary}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {primaryCtaLabel}
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
