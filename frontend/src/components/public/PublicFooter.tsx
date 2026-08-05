"use client";

import Link from "next/link";
import { ArrowRight, Mail, Phone } from "lucide-react";
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
  const platformMode = audience === "platform";

  const footerLinks = filterPublicLinks(footerContent.footerLinks ?? [], audience, allowedPaths);
  const currentYear = new Date().getFullYear();

  const columns = [
    {
      heading: "Platform",
      links: [
        { label: "Products", href: "/products" },
        { label: "Industries", href: "/industries" },
        { label: "Pricing", href: "/pricing" },
        { label: "Resources", href: "/resources" },
      ],
    },
    {
      heading: "Company",
      links: [
        { label: "About", href: "/about" },
        { label: "Careers", href: "/careers" },
        { label: "Blog", href: "/blog" },
        { label: "Contact", href: "/contact" },
      ],
    },
    {
      heading: "Legal",
      links: [
        { label: "Privacy Policy", href: "/privacy" },
        { label: "Terms of Service", href: "/terms" },
        { label: "Security", href: "/security" },
        { label: "Compliance", href: "/compliance" },
      ],
    },
  ];

  if (variant === "minimal") {
    return (
      <footer className="border-t border-slate-200 bg-white">
        <div className={cn(publicSectionClassName, "flex flex-col items-center justify-between gap-4 py-6 sm:flex-row")}>
          <p className="text-sm text-slate-500">
            © {currentYear} {brandName}. All rights reserved.
          </p>
          {footerLinks.length > 0 && (
            <div className="flex flex-wrap gap-4">
              {footerLinks.slice(0, 4).map((link) => (
                <Link
                  key={link.href}
                  href={withPublicAudience(link.href, audience)}
                  className="text-sm text-slate-500 transition-colors hover:text-indigo-600"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      </footer>
    );
  }

  return (
    <footer className="border-t border-slate-200 bg-slate-50">
      {/* Main footer */}
      <div className={cn(publicSectionClassName, "pt-14 pb-10")}>
        <div className="grid gap-10 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
          {/* Brand column */}
          <div>
            <div className="flex items-center gap-2 group w-fit">
              <img
                src="/logo.png"
                alt={brandName}
                className="h-6 w-auto object-contain"
              />
            </div>
            <p className="mt-4 text-sm leading-7 text-slate-500 max-w-xs">
              {footerContent.summary ||
              "One cloud ERP platform for HR, payroll, finance, procurement, inventory, CRM, and operations."}
            </p>

            {/* Contact info */}
            <div className="mt-6 space-y-2.5">
              {profile.supportEmail && (
                <a
                  href={`mailto:${profile.supportEmail}`}
                  className="flex items-center gap-2.5 text-sm text-slate-500 transition hover:text-indigo-600"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50">
                    <Mail className="h-3.5 w-3.5 text-indigo-600" />
                  </div>
                  {profile.supportEmail}
                </a>
              )}
              {profile.supportPhone && (
                <a
                  href={`tel:${profile.supportPhone}`}
                  className="flex items-center gap-2.5 text-sm text-slate-500 transition hover:text-indigo-600"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50">
                    <Phone className="h-3.5 w-3.5 text-indigo-600" />
                  </div>
                  {profile.supportPhone}
                </a>
              )}
            </div>
          </div>

          {/* Nav columns */}
          {columns.map((col) => (
            <div key={col.heading}>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-900">{col.heading}</p>
              <ul className="mt-4 space-y-3">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={withPublicAudience(link.href, audience)}
                      className="text-sm text-slate-500 transition-colors hover:text-indigo-600"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* CTA band */}
        {platformMode && (
          <div className="mt-10 rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-600 to-indigo-700 p-8 text-white">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-lg font-bold tracking-tight">Ready to streamline your operations?</p>
                <p className="mt-1 text-sm text-indigo-200">
                  Book a focused product walkthrough. No commitment required.
                </p>
              </div>
              <Link
                href={withPublicAudience("/book-demo", audience)}
                className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-indigo-700 shadow-lg transition hover:bg-indigo-50"
              >
                Book a Demo
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Bottom bar */}
      <div className="border-t border-slate-200">
        <div className={cn(publicSectionClassName, "flex flex-col items-center justify-between gap-3 py-5 sm:flex-row")}>
          <p className="text-xs text-slate-400">
            © {currentYear} {brandName}. All rights reserved.
          </p>
          <div className="flex items-center gap-5">
            {["Privacy", "Terms", "Security"].map((item) => (
              <Link
                key={item}
                href={withPublicAudience(`/${item.toLowerCase()}`, audience)}
                className="text-xs text-slate-400 transition hover:text-indigo-600"
              >
                {item}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
