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
import { publicSectionClassName } from "@/components/public/publicStyles";

type PublicHeaderProps = {
  audience?: PublicAudience;
  profile: ClientProfile;
  headerContent: PublicHeaderContent;
  allowedPaths?: string[];
};

export default function PublicHeader({
  audience = "tenant",
  profile,
  headerContent,
  allowedPaths,
}: PublicHeaderProps) {
  const pathname = usePathname() || "";
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const brandName = profile.brandName || profile.companyName || "UabIndia ERP";
  const homeHref = headerContent.homeHref || getDefaultPublicHomeHref(audience);

  const navItems = useMemo(() => {
    const sourceLinks =
      headerContent?.navLinks && headerContent.navLinks.length > 0
        ? headerContent.navLinks
        : getPublicNavLinks(audience, "primary");

    if (!allowedPaths || allowedPaths.length === 0) {
      return sourceLinks;
    }
    return sourceLinks.filter((item) => allowedPaths.includes(item.href));
  }, [headerContent?.navLinks, audience, allowedPaths]);

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
      <div className={cn(publicSectionClassName, "flex h-16 items-center justify-between")}>
        {/* Left: Brand Logo */}
        <Link
          href={withPublicAudience(homeHref, audience)}
          className="flex shrink-0 items-center"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <img src={profile.logoUrl || "/logo.png"} alt={brandName} className="h-7 w-auto object-contain" />
        </Link>

        {/* Right: All Navigation Links & Solid Black Login Action Button */}
        <div className="hidden items-center gap-2 xl:gap-3 lg:flex">
          <nav className="flex items-center gap-0.5 xl:gap-1.5">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={withPublicAudience(item.href, audience)}
                className={cn(
                  "rounded-lg px-2.5 xl:px-3 py-2 text-sm font-medium transition-colors",
                  isActive(item.href)
                    ? "bg-slate-100 text-slate-900 font-semibold"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="ml-3 flex items-center">
            <Link
              href={withPublicAudience("/login", audience)}
              className={cn(
                "inline-flex h-9 items-center justify-center rounded-lg bg-slate-900 px-4 text-xs font-semibold text-white shadow-2xs transition hover:bg-slate-800",
                isActive("/login") && "ring-2 ring-slate-900 ring-offset-2",
              )}
            >
              Login
            </Link>
          </div>
        </div>

        {/* Mobile menu toggle on the far right */}
        <button
          type="button"
          className="ml-auto inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-700 lg:hidden"
          onClick={() => setIsMobileMenuOpen((open) => !open)}
          aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
        >
          {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen ? (
        <div className="border-t border-slate-200 bg-white lg:hidden">
          <div className={cn(publicSectionClassName, "space-y-1 py-3")}>
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={withPublicAudience(item.href, audience)}
                className={cn(
                  "block rounded-lg px-3 py-2.5 text-sm font-medium",
                  isActive(item.href) ? "bg-slate-100 text-slate-900 font-semibold" : "text-slate-700",
                )}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <div className="border-t border-slate-100 pt-3">
              <Link
                href={withPublicAudience("/login", audience)}
                className="flex h-10 w-full items-center justify-center rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Login
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
