"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { LogIn, Menu, Moon, Sun, X } from "lucide-react";
import type { ClientProfile } from "@/lib/publicProfile";
import type { PublicAudience } from "@/lib/public-audience";
import type { PublicHeaderContent } from "@/lib/publicSiteContent";
import { withPublicAudience } from "@/lib/public-audience";
import { getDefaultPublicHomeHref, getPublicNavLinks } from "@/lib/public-site-map";
import { cn } from "@/lib/utils";
import PublicBrand from "@/components/public/PublicBrand";
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
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  const isTenantAudience = audience === "tenant";
  const brandName =
    isTenantAudience && profile.companyName && profile.companyName !== "UabIndia"
      ? profile.companyName
      : profile.brandName || profile.companyName || "UabIndia Enterprise";

  const homeHref = headerContent.homeHref || getDefaultPublicHomeHref(audience);

  useEffect(() => {
    setMounted(true);
  }, []);

  const navItems = useMemo(() => {
    const sourceLinks =
      headerContent?.navLinks && headerContent.navLinks.length > 0
        ? headerContent.navLinks
        : getPublicNavLinks(audience, "primary");

    // Exclude /book-demo from the plain text links row since it has a dedicated prominent CTA button in the header action cluster
    const filtered = sourceLinks.filter((item) => item.href !== "/book-demo");

    if (!allowedPaths || allowedPaths.length === 0) {
      return filtered;
    }
    return filtered.filter((item) => allowedPaths.includes(item.href));
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
        "sticky top-0 z-50 w-full border-b backdrop-blur-xl transition-all duration-200",
        isScrolled
          ? "border-slate-200/90 bg-white/90 shadow-xs shadow-slate-200/40 dark:border-slate-800/90 dark:bg-slate-950/90 dark:shadow-slate-950/40"
          : "border-slate-200/70 bg-white/80 dark:border-slate-800/70 dark:bg-slate-950/80",
      )}
    >
      {/* ── Dynamic Top Brand Accent Line (Client single color or multi-color mix gradient) ── */}
      <div
        className="h-[2.5px] w-full"
        style={{
          background: "var(--uab-brand-gradient, var(--uab-brand-primary, #1d4ed8))",
        }}
      />

      <div className={cn(publicSectionClassName, "flex h-16 items-center justify-between")}>
        {/* Left: Brand Logo & Title */}
        <Link
          href={withPublicAudience(homeHref, audience)}
          className="flex shrink-0 items-center group"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <PublicBrand logoUrl={profile.logoUrl} brandName={brandName} size="md" />
        </Link>

        {/* Center/Right: Navigation Links & Theme + Login Action */}
        <div className="hidden items-center gap-2 xl:gap-3 lg:flex">
          <nav className="flex items-center gap-1 xl:gap-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={withPublicAudience(item.href, audience)}
                style={
                  isActive(item.href)
                    ? {
                        backgroundColor: "var(--uab-brand-accent-soft, rgba(37,99,235,0.1))",
                        color: "var(--uab-brand-primary, #1d4ed8)",
                      }
                    : undefined
                }
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-150",
                  isActive(item.href)
                    ? "shadow-2xs font-bold"
                    : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 dark:text-slate-200 dark:hover:bg-slate-800/80 dark:hover:text-white font-medium",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="ml-2 flex items-center gap-2 border-l border-slate-200 pl-3 dark:border-slate-800">
            {mounted && (
              <button
                type="button"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                aria-label="Toggle theme"
              >
                {theme === "dark" ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-600" />}
              </button>
            )}

            {audience === "platform" ? (
              <>
                {!isActive("/login") && (
                  <Link
                    href={withPublicAudience("/login", audience)}
                    style={{
                      background: "var(--uab-brand-gradient, linear-gradient(135deg, #2563eb 0%, #1d4ed8 50%, #4338ca 100%))",
                      color: "var(--uab-brand-text, #ffffff)",
                      boxShadow: "0 2px 12px -1px var(--uab-brand-glow, rgba(37,99,235,0.4))",
                    }}
                    className="group inline-flex h-9 items-center justify-center gap-1.5 rounded-full border border-white/20 px-4.5 text-xs font-bold text-white shadow-xs transition-all duration-200 hover:brightness-110 hover:shadow-md hover:-translate-y-0.5 active:scale-[0.97]"
                  >
                    <LogIn className="h-3.5 w-3.5 transition-transform group-hover:scale-110" />
                    Sign In
                  </Link>
                )}
              </>
            ) : (
              <Link
                href={withPublicAudience(headerContent.primaryCtaHref || "/login", audience)}
                style={{
                  background: "var(--uab-brand-gradient, linear-gradient(135deg, #2563eb 0%, #1d4ed8 50%, #4338ca 100%))",
                  color: "var(--uab-brand-text, #ffffff)",
                  boxShadow: "0 2px 12px -1px var(--uab-brand-glow, rgba(37,99,235,0.4))",
                }}
                className={cn(
                  "group inline-flex h-9 items-center justify-center gap-1.5 rounded-full border border-white/20 px-4.5 text-xs font-bold text-white shadow-xs transition-all duration-200 hover:brightness-110 hover:shadow-md hover:-translate-y-0.5 active:scale-[0.97]",
                )}
              >
                <LogIn className="h-3.5 w-3.5 transition-transform group-hover:scale-110" />
                {headerContent.primaryCtaLabel || "Sign In"}
              </Link>
            )}
          </div>
        </div>

        {/* Mobile Action Cluster */}
        <div className="flex items-center gap-2 lg:hidden">
          {mounted && (
            <button
              type="button"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-700 dark:border-slate-800 dark:text-slate-300"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4" />}
            </button>
          )}

          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-700 dark:border-slate-800 dark:text-slate-300"
            onClick={() => setIsMobileMenuOpen((open) => !open)}
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen ? (
        <div className="border-t border-slate-200 bg-white/95 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/95 lg:hidden animate-in fade-in slide-in-from-top-2 duration-150">
          <div className={cn(publicSectionClassName, "space-y-1.5 py-4")}>
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={withPublicAudience(item.href, audience)}
                style={
                  isActive(item.href)
                    ? {
                        backgroundColor: "var(--uab-brand-accent-soft, rgba(37,99,235,0.1))",
                        color: "var(--uab-brand-primary, #1d4ed8)",
                      }
                    : undefined
                }
                className={cn(
                  "block rounded-xl px-3.5 py-2 text-sm font-semibold transition-colors",
                  isActive(item.href)
                    ? "font-bold"
                    : "text-slate-700 hover:bg-slate-100/70 dark:text-slate-300 dark:hover:bg-slate-800/60",
                )}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <div className="border-t border-slate-100 pt-3 space-y-2 dark:border-slate-800">
              {audience === "platform" ? (
                <>
                  {!isActive("/login") && (
                    <Link
                      href={withPublicAudience("/login", audience)}
                      style={{
                        background: "var(--uab-brand-gradient, linear-gradient(135deg, #2563eb 0%, #1d4ed8 50%, #4338ca 100%))",
                        color: "var(--uab-brand-text, #ffffff)",
                        boxShadow: "0 2px 12px -1px var(--uab-brand-glow, rgba(37,99,235,0.4))",
                      }}
                      className="flex h-10 w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold text-white shadow-xs transition-all duration-200 hover:brightness-110 active:scale-[0.98]"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <LogIn className="h-4 w-4" />
                      Sign In
                    </Link>
                  )}
                </>
              ) : (
                <Link
                  href={withPublicAudience(headerContent.primaryCtaHref || "/login", audience)}
                  style={{
                    background: "var(--uab-brand-gradient, linear-gradient(135deg, #2563eb 0%, #1d4ed8 50%, #4338ca 100%))",
                    color: "var(--uab-brand-text, #ffffff)",
                    boxShadow: "0 2px 12px -1px var(--uab-brand-glow, rgba(37,99,235,0.4))",
                  }}
                  className="flex h-10 w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold text-white shadow-xs transition-all duration-200 hover:brightness-110 active:scale-[0.98]"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <LogIn className="h-4 w-4" />
                  {headerContent.primaryCtaLabel || "Sign In"}
                </Link>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
