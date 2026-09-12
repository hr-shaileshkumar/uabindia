"use client";

import Link from "next/link";
import { Mail, Phone } from "lucide-react";
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
  const brandName = profile.brandName || profile.companyName || "UabIndia ERP";
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
      <footer className="border-t border-slate-200 bg-white">
        <div className={cn(publicSectionClassName, "flex flex-col items-center justify-between gap-3 py-5 sm:flex-row")}>
          <p className="text-sm text-slate-500">
            © {currentYear} {brandName}
          </p>
          <div className="flex flex-wrap gap-4">
            {footerLinks.slice(0, 4).map((link) => (
              <Link
                key={link.href}
                href={withPublicAudience(link.href, audience)}
                className="text-sm text-slate-500 hover:text-slate-900"
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
    <footer className="border-t border-slate-200 bg-white">
      <div className={cn(publicSectionClassName, "py-10")}>
        <div className={cn("grid gap-8", platformMode ? "lg:grid-cols-[1.4fr_1fr_1fr]" : "lg:grid-cols-2")}>
          <div>
            <img src={profile.logoUrl || "/logo.png"} alt={brandName} className="h-6 w-auto object-contain" />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-600">
              {footerContent.summary ||
                (platformMode
                  ? "Cloud ERP for HR, payroll, finance, procurement, inventory, and operations."
                  : `${brandName} company portal for employees and applicants.`)}
            </p>
            <div className="mt-4 space-y-2">
              {profile.supportEmail ? (
                <a href={`mailto:${profile.supportEmail}`} className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900">
                  <Mail className="h-4 w-4 shrink-0" />
                  {profile.supportEmail}
                </a>
              ) : null}
              {profile.supportPhone ? (
                <a href={`tel:${profile.supportPhone}`} className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900">
                  <Phone className="h-4 w-4 shrink-0" />
                  {profile.supportPhone}
                </a>
              ) : null}
            </div>
          </div>

          {platformMode ? (
            <>
              <div>
                <p className="text-sm font-semibold text-slate-900">Product</p>
                <ul className="mt-3 space-y-2">
                  {productLinks.map((link) => (
                    <li key={link.href}>
                      <Link href={withPublicAudience(link.href, audience)} className="text-sm text-slate-600 hover:text-slate-900">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Company</p>
                <ul className="mt-3 space-y-2">
                  {companyLinks.map((link) => (
                    <li key={link.href}>
                      <Link href={withPublicAudience(link.href, audience)} className="text-sm text-slate-600 hover:text-slate-900">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          ) : (
            <div>
              <p className="text-sm font-semibold text-slate-900">Quick links</p>
              <ul className="mt-3 space-y-2">
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
                    <Link href={withPublicAudience(link.href, audience)} className="text-sm text-slate-600 hover:text-slate-900">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-slate-200">
        <div className={cn(publicSectionClassName, "flex flex-col items-center justify-between gap-3 py-4 sm:flex-row")}>
          <p className="text-xs text-slate-500">
            {footerContent.legalLine || `© ${currentYear} ${brandName}. All rights reserved.`}
          </p>
          <div className="flex gap-4">
            <Link href={withPublicAudience("/privacy", audience)} className="text-xs text-slate-500 hover:text-slate-900">
              Privacy Policy
            </Link>
            <Link href={withPublicAudience("/terms", audience)} className="text-xs text-slate-500 hover:text-slate-900">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
