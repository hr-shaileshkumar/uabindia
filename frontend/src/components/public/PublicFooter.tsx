"use client";

import Link from "next/link";
import { Mail, Phone, ShieldCheck } from "lucide-react";
import type { ClientProfile } from "@/lib/publicProfile";
import type { PublicAudience } from "@/lib/public-audience";
import type { PublicFooterContent } from "@/lib/publicSiteContent";
import { withPublicAudience } from "@/lib/public-audience";
import { filterPublicLinks } from "@/lib/public-site-map";
import { publicSectionClassName } from "@/components/public/publicStyles";
import { cn } from "@/lib/utils";

type PublicFooterProps = {
  audience?: PublicAudience;
  profile: ClientProfile;
  footerContent: PublicFooterContent;
  allowedPaths?: string[];
  variant?: "full" | "minimal";
};

export default function PublicFooter({
  audience = "tenant",
  profile,
  footerContent,
  allowedPaths,
  variant = "full",
}: PublicFooterProps) {
  const brandName = profile.brandName || profile.companyName || "UabIndia Enterprise";
  const footerLinks = filterPublicLinks(footerContent.footerLinks ?? [], audience, allowedPaths);
  const currentYear = new Date().getFullYear();
  const platformMode = audience === "platform";

  const productLinks = [
    { label: "Products & Modules", href: "/products" },
    { label: "Industry Solutions", href: "/industries" },
    { label: "Pricing & Plans", href: "/pricing" },
    { label: "Resources & Guides", href: "/resources" },
    { label: "Request a Demo", href: "/book-demo" },
  ];
  const companyLinks = [
    { label: "About Us", href: "/about" },
    { label: "Careers", href: "/careers" },
    { label: "Contact Us", href: "/contact" },
    { label: "Help & Support", href: "/help-support" },
    { label: "Sign In", href: "/login" },
  ];

  if (variant === "minimal") {
    return (
      <footer className="border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
        <div className={cn(publicSectionClassName, "flex flex-col items-center justify-between gap-3 py-5 sm:flex-row")}>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            © {currentYear} {brandName}. All rights reserved.
          </p>
          <div className="flex flex-wrap gap-4">
            {footerLinks.slice(0, 4).map((link) => (
              <Link
                key={link.href}
                href={withPublicAudience(link.href, audience)}
                className="text-xs text-slate-500 transition-colors hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="border-t border-slate-200 bg-white transition-colors dark:border-slate-800 dark:bg-slate-950">
      <div className={cn(publicSectionClassName, "py-12 sm:py-16")}>
        <div className={cn("grid gap-10", platformMode ? "lg:grid-cols-[1.4fr_1fr_1fr]" : "lg:grid-cols-2")}>
          <div>
            <div className="flex items-center gap-2.5">
              <img src={profile.logoUrl || "/logo.png"} alt={brandName} className="h-7 w-auto object-contain" />
              <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white">
                {brandName}
              </span>
            </div>
            <p className="mt-4 max-w-sm text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              {footerContent.summary ||
                (platformMode
                  ? "Next-generation cloud platform for HR, payroll, finance, procurement, inventory, and enterprise operations."
                  : `${brandName} business workspace and operations portal.`)}
            </p>
            <div className="mt-5 space-y-2">
              {profile.supportEmail ? (
                <a href={`mailto:${profile.supportEmail}`} className="flex items-center gap-2 text-xs text-slate-600 transition-colors hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400">
                  <Mail className="h-4 w-4 shrink-0 text-blue-500" />
                  <span>{profile.supportEmail}</span>
                </a>
              ) : null}
              {profile.supportPhone ? (
                <a href={`tel:${profile.supportPhone}`} className="flex items-center gap-2 text-xs text-slate-600 transition-colors hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400">
                  <Phone className="h-4 w-4 shrink-0 text-indigo-500" />
                  <span>{profile.supportPhone}</span>
                </a>
              ) : null}
            </div>

            <div className="mt-6 flex items-center gap-2 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="h-4 w-4 shrink-0" />
              <span>Multi-Tenant Isolated · Indian Cloud Tier-IV Data Sovereignty</span>
            </div>
          </div>

          {platformMode ? (
            <>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">Product & Platform</p>
                <ul className="mt-4 space-y-2.5">
                  {productLinks.map((link) => (
                    <li key={link.href}>
                      <Link href={withPublicAudience(link.href, audience)} className="text-xs sm:text-sm text-slate-600 transition-colors hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">Enterprise</p>
                <ul className="mt-4 space-y-2.5">
                  {companyLinks.map((link) => (
                    <li key={link.href}>
                      <Link href={withPublicAudience(link.href, audience)} className="text-xs sm:text-sm text-slate-600 transition-colors hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          ) : (
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">Navigation Links</p>
              <ul className="mt-4 space-y-2.5">
                {(footerLinks.length > 0
                  ? footerLinks
                  : [
                      { label: "About Us", href: "/about" },
                      { label: "Careers", href: "/careers" },
                      { label: "Contact Us", href: "/contact" },
                      { label: "Sign In", href: "/login" },
                    ]
                ).map((link) => (
                  <li key={link.href}>
                    <Link href={withPublicAudience(link.href, audience)} className="text-xs sm:text-sm text-slate-600 transition-colors hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-slate-200/80 bg-slate-50/50 dark:border-slate-800/80 dark:bg-slate-950/60">
        <div className={cn(publicSectionClassName, "flex flex-col items-center justify-between gap-3 py-4 sm:flex-row")}>
          <p className="text-xs text-slate-500 dark:text-slate-500">
            {footerContent.legalLine || `© ${currentYear} ${brandName}. All rights reserved.`}
          </p>
          <div className="flex gap-5">
            <Link href={withPublicAudience("/privacy", audience)} className="text-xs text-slate-500 transition-colors hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400">
              Privacy Policy
            </Link>
            <Link href={withPublicAudience("/terms", audience)} className="text-xs text-slate-500 transition-colors hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
