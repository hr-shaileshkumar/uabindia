"use client";

import { useState } from "react";
import type { ClientProfile } from "@/lib/publicProfile";
import type { PublicHeaderContent } from "@/lib/publicSiteContent";
import PublicButtonLink from "@/components/public/PublicButtonLink";
import Link from "next/link";

type PublicHeaderProps = {
  profile: ClientProfile;
  headerContent: PublicHeaderContent;
};

export default function PublicHeader({ profile, headerContent }: PublicHeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [logoLoadFailed, setLogoLoadFailed] = useState(false);

return (
       <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-xl shadow-sm">
         <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 lg:px-6">
           <Link href="/" className="flex items-center gap-3">
             {(() => {
               const tenantLogo = profile.logoUrl;
               const brandingAlt = profile.brandName || profile.companyName || "ERP Tenant Portal";
               if (tenantLogo && tenantLogo !== "/logo.png" && !logoLoadFailed) {
                 return (
                   <>
                     <img
                       src={tenantLogo}
                       alt={brandingAlt}
                       width={140}
                       height={40}
                       className="h-10 w-auto object-contain"
                       onError={() => setLogoLoadFailed(true)}
                     />
                   </>
                 );
               }
               return (
                 <img
                   src="/logo.png?v=erp-20260205"
                   alt={brandingAlt}
                   width={140}
                   height={40}
                   className="h-10 w-auto object-contain"
                 />
               );
             })()}
        </Link>

        <div className="hidden items-center gap-8 lg:flex">
          <nav className="flex flex-wrap items-center gap-4 text-sm font-medium text-slate-700">
            {headerContent.navLinks.map((link) => (
              <Link key={`${link.href}-${link.label}`} href={link.href} className="transition hover:text-slate-900">
                {link.label}
              </Link>
            ))}
          </nav>
          <PublicButtonLink href={headerContent.primaryCtaHref} variant="primary" className="whitespace-nowrap">
            {headerContent.primaryCtaLabel}
          </PublicButtonLink>
        </div>

        <button
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 lg:hidden"
          onClick={() => setIsMobileMenuOpen((open) => !open)}
          aria-label="Toggle navigation"
        >
          <span className="block h-1.5 w-6 rounded-full bg-slate-700 shadow-sm"></span>
          <span className="mt-1 block h-1.5 w-6 rounded-full bg-slate-700 shadow-sm"></span>
          <span className="mt-1 block h-1.5 w-6 rounded-full bg-slate-700 shadow-sm"></span>
        </button>
      </div>

      {isMobileMenuOpen ? (
        <div className="absolute inset-x-0 top-full z-50 border-t border-slate-200 bg-white px-5 py-5 shadow-lg lg:hidden">
          <div className="space-y-4">
            {headerContent.navLinks.map((link) => (
              <Link
                key={`${link.href}-${link.label}`}
                href={link.href}
                className="block rounded-2xl px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                {link.label}
              </Link>
            ))}
            <PublicButtonLink href={headerContent.primaryCtaHref} variant="primary" className="w-full px-4 py-3 text-center">
              {headerContent.primaryCtaLabel}
            </PublicButtonLink>
          </div>
        </div>
      ) : null}
    </header>
  );
}
