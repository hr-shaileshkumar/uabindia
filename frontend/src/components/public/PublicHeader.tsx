"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, Menu, X } from "lucide-react";
import type { ClientProfile } from "@/lib/publicProfile";
import type { PublicHeaderContent } from "@/lib/publicSiteContent";
import PublicButtonLink from "@/components/public/PublicButtonLink";

type PublicHeaderProps = {
  profile: ClientProfile;
  headerContent: PublicHeaderContent;
};

export default function PublicHeader({ profile, headerContent }: PublicHeaderProps) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [logoLoadFailed, setLogoLoadFailed] = useState(false);

  const brandName = useMemo(
    () => profile.brandName || profile.companyName || "Uabindia ERP",
    [profile.brandName, profile.companyName]
  );

  return (
    <header className="sticky top-0 z-50 border-b border-sky-100/80 bg-[linear-gradient(180deg,#fbfdff,#eef6fd)] backdrop-blur-2xl">
      <div className="border-b border-sky-100/70 bg-transparent text-slate-700">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-2 text-[11px] lg:px-6">
          <p className="truncate font-semibold uppercase tracking-[0.18em] text-slate-800">{headerContent.badge}</p>
          <p className="hidden truncate text-slate-500 md:block">{headerContent.announcement}</p>
        </div>
      </div>

      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-5 py-4 lg:px-6">
        <Link href="/" className="flex items-center gap-4" onClick={() => setIsMobileMenuOpen(false)}>
          {profile.logoUrl && profile.logoUrl !== "/logo.png" && !logoLoadFailed ? (
            <img
              src={profile.logoUrl}
              alt={brandName}
              width={168}
              height={56}
              className="h-12 w-auto object-contain sm:h-14"
              onError={() => setLogoLoadFailed(true)}
            />
          ) : (
            <img
              src="/logo.png?v=uabindia-20260205"
              alt={brandName}
              width={168}
              height={56}
              className="h-12 w-auto object-contain sm:h-14"
            />
          )}
          <div className="min-w-0">
            <p className="truncate text-base font-semibold tracking-[-0.03em] text-slate-950">{brandName}</p>
            <p className="truncate text-xs uppercase tracking-[0.16em] text-slate-500">Enterprise workflows</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-2 rounded-full border border-sky-100/90 bg-white/92 p-2 shadow-[0_14px_36px_rgba(148,163,184,0.14)] lg:flex">
          {headerContent.navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={`${link.href}-${link.label}`}
                href={link.href}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  isActive ? "bg-[linear-gradient(135deg,#edf7ff,#effcf8)] text-slate-950 shadow-sm" : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <PublicButtonLink href={headerContent.primaryCtaHref} variant="primary" className="whitespace-nowrap">
            {headerContent.primaryCtaLabel}
            <ArrowRight className="h-4 w-4" />
          </PublicButtonLink>
        </div>

        <button
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-sky-100 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 lg:hidden"
          onClick={() => setIsMobileMenuOpen((open) => !open)}
          aria-label="Toggle navigation"
        >
          {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {isMobileMenuOpen ? (
        <div className="border-t border-sky-100 bg-[linear-gradient(180deg,#fbfdff,#eef6fd)] px-5 py-5 shadow-[0_18px_44px_rgba(148,163,184,0.16)] lg:hidden">
          <div className="space-y-3">
            {headerContent.navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={`${link.href}-${link.label}`}
                  href={link.href}
                  className={`block rounded-[1.15rem] px-4 py-3 text-sm font-semibold transition ${
                    isActive ? "bg-[linear-gradient(135deg,#edf7ff,#effcf8)] text-slate-950" : "bg-slate-50 text-slate-700 hover:bg-slate-100"
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              );
            })}
            <PublicButtonLink href={headerContent.primaryCtaHref} variant="primary" className="w-full justify-center">
              {headerContent.primaryCtaLabel}
              <ArrowRight className="h-4 w-4" />
            </PublicButtonLink>
          </div>
        </div>
      ) : null}
    </header>
  );
}
