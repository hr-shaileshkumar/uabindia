"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { Menu, Moon, Sun, X } from "lucide-react";
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
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  const brandName = profile.brandName || profile.companyName || "UabIndia Enterprise";
  const homeHref = headerContent.homeHref || getDefaultPublicHomeHref(audience);

  useEffect(() => {
    setMounted(true);
  }, []);

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
        "sticky top-0 z-50 w-full border-b backdrop-blur-xl transition-all duration-200",
        isScrolled
          ? "border-slate-200/90 bg-white/90 shadow-xs shadow-slate-200/40 dark:border-slate-800/90 dark:bg-slate-950/90 dark:shadow-slate-950/40"
          : "border-slate-200/70 bg-white/80 dark:border-slate-800/70 dark:bg-slate-950/80",
      )}
    >
      <div className={cn(publicSectionClassName, "flex h-16 items-center justify-between")}>
        {/* Left: Brand Logo & Title */}
        <Link
          href={withPublicAudience(homeHref, audience)}
          className="flex shrink-0 items-center gap-2.5 group"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <img src={profile.logoUrl || "/logo.png"} alt={brandName} className="h-7 w-auto object-contain transition-transform group-hover:scale-105" />
          <span className="font-extrabold text-sm sm:text-base tracking-tight text-slate-900 dark:text-white hidden sm:inline-block">
            {brandName}
          </span>
        </Link>

        {/* Center/Right: Navigation Links & Theme + Login Action */}
        <div className="hidden items-center gap-2 xl:gap-3 lg:flex">
          <nav className="flex items-center gap-1 xl:gap-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={withPublicAudience(item.href, audience)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-150",
                  isActive(item.href)
                    ? "bg-blue-50 text-blue-700 shadow-2xs font-bold dark:bg-blue-950/60 dark:text-blue-400"
                    : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/70 dark:hover:text-white",
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

            <Link
              href={withPublicAudience("/login", audience)}
              className={cn(
                "inline-flex h-8.5 items-center justify-center rounded-xl bg-gradient-to-r from-blue-700 to-indigo-700 px-4 text-xs font-bold text-white shadow-xs shadow-blue-600/20 transition-all hover:from-blue-800 hover:to-indigo-800 hover:shadow-md hover:shadow-blue-600/30 active:scale-[0.98]",
                isActive("/login") && "ring-2 ring-blue-500 ring-offset-2",
              )}
            >
              Sign In
            </Link>
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
                className={cn(
                  "block rounded-xl px-3.5 py-2 text-sm font-semibold transition-colors",
                  isActive(item.href)
                    ? "bg-blue-50 text-blue-700 font-bold dark:bg-blue-950/60 dark:text-blue-400"
                    : "text-slate-700 hover:bg-slate-100/70 dark:text-slate-300 dark:hover:bg-slate-800/60",
                )}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <div className="border-t border-slate-100 pt-3 dark:border-slate-800">
              <Link
                href={withPublicAudience("/login", audience)}
                className="flex h-10 w-full items-center justify-center rounded-xl bg-gradient-to-r from-blue-700 to-indigo-700 px-4 text-sm font-bold text-white shadow-sm shadow-blue-500/20"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Sign In to Workspace
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
