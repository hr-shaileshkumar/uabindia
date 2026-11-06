"use client";

import Link from "next/link";
import { Mail, Phone, ShieldCheck } from "lucide-react";
import type { ClientProfile } from "@/lib/publicProfile";
import type { PublicAudience } from "@/lib/public-audience";
import type { PublicFooterContent } from "@/lib/publicSiteContent";
import { withPublicAudience } from "@/lib/public-audience";
import { publicSectionClassName } from "@/components/public/publicStyles";
import PublicBrand from "@/components/public/PublicBrand";
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
  allowedPaths: _allowedPaths,
  variant = "full",
}: PublicFooterProps) {
  const brandName = profile.brandName || profile.companyName || "UabIndia Enterprise";
  const currentYear = new Date().getFullYear();
  const platformMode = audience === "platform";

  // Verified fallback contact details if database/backend is offline or unprovisioned
  const effectiveSupportEmail = profile.supportEmail || "support@uabindia.in";
  const effectiveSupportPhone = profile.supportPhone || "+91 7903055384";

  const platformNavLinks = [
    { label: "Cloud ERP Platform", href: "/" },
    { label: "Pricing & Plans", href: "/pricing" },
    { label: "About Platform", href: "/about" },
    { label: "Request a Demo", href: "/contact?type=demo" },
  ];

  const platformAccessLinks = [
    { label: "Contact Sales & Support", href: "/contact" },
    { label: "Help & Support Desk", href: "/help-support" },
    { label: "Create Workspace", href: "/register" },
    { label: "Sign In to Account", href: "/login" },
  ];

  const tenantNavLinks = [
    { label: "Home", href: "/" },
    { label: "About Us", href: "/about" },
    { label: "Contact Us", href: "/contact" },
    { label: "Help & Support", href: "/help-support" },
  ];

  const tenantAccessLinks = [
    { label: "Sign In", href: "/login" },
    { label: "Request Access", href: "/register" },
    { label: "Forgot Password", href: "/forgot-password" },
  ];

  if (variant === "minimal") {
    return (
      <footer className="border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
        <div className={cn(publicSectionClassName, "flex flex-col items-center justify-between gap-3 py-5 sm:flex-row")}>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            © {currentYear} {brandName}. All rights reserved.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href={withPublicAudience("/privacy", audience)}
              className="text-xs text-slate-500 transition-colors hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400"
            >
              Privacy Policy
            </Link>
            <Link
              href={withPublicAudience("/terms", audience)}
              className="text-xs text-slate-500 transition-colors hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400"
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="border-t border-slate-200 bg-white transition-colors dark:border-slate-800 dark:bg-slate-950">
      <div className={cn(publicSectionClassName, "py-12 sm:py-16")}>
        <div className="grid gap-10 grid-cols-1 md:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr]">
          {/* Column 1: Brand & Contact Info */}
          <div>
            <PublicBrand logoUrl={profile.logoUrl} brandName={brandName} size="md" />
            <p className="mt-4 max-w-sm text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              {footerContent.summary ||
                (platformMode
                  ? "Next-generation cloud platform for HR, payroll, finance, procurement, inventory, and enterprise operations."
                  : `${brandName} business workspace and operations portal.`)}
            </p>

            <div className="mt-5 space-y-2.5">
              <a
                href={`mailto:${effectiveSupportEmail}`}
                className="flex items-center gap-2.5 text-xs text-slate-600 transition-colors hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400"
              >
                <Mail className="h-4 w-4 shrink-0 text-blue-500" />
                <span className="font-medium">{effectiveSupportEmail}</span>
              </a>

              <a
                href={`tel:${effectiveSupportPhone.replace(/\s+/g, "")}`}
                className="flex items-center gap-2.5 text-xs text-slate-600 transition-colors hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400"
              >
                <Phone className="h-4 w-4 shrink-0 text-indigo-500" />
                <span className="font-medium">{effectiveSupportPhone}</span>
              </a>
            </div>

            <div className="mt-6 flex items-center gap-2 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="h-4 w-4 shrink-0" />
              <span>Multi-Tenant Isolated · Global Sovereign Cloud & Multi-Region Tier-IV Security</span>
            </div>
          </div>

          {/* Column 2: Navigation Links */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              {platformMode ? "Product & Platform" : "Workspace Navigation"}
            </p>
            <ul className="mt-4 space-y-2.5">
              {(platformMode ? platformNavLinks : tenantNavLinks).map((link) => (
                <li key={link.href}>
                  <Link
                    href={withPublicAudience(link.href, audience)}
                    className="text-xs sm:text-sm text-slate-600 transition-colors hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Access & Services */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              {platformMode ? "Enterprise & Support" : "Account & Access"}
            </p>
            <ul className="mt-4 space-y-2.5">
              {(platformMode ? platformAccessLinks : tenantAccessLinks).map((link) => (
                <li key={link.href}>
                  <Link
                    href={withPublicAudience(link.href, audience)}
                    className="text-xs sm:text-sm text-slate-600 transition-colors hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Legal Row */}
      <div className="border-t border-slate-200/80 bg-slate-50/50 dark:border-slate-800/80 dark:bg-slate-950/60">
        <div className={cn(publicSectionClassName, "flex flex-col items-center justify-between gap-3 py-4 sm:flex-row")}>
          <p className="text-xs text-slate-500 dark:text-slate-500">
            {footerContent.legalLine || `Copyright ${currentYear} ${brandName}. All rights reserved.`}
          </p>
          <div className="flex gap-5">
            <Link
              href={withPublicAudience("/privacy", audience)}
              className="text-xs text-slate-500 transition-colors hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400"
            >
              Privacy Policy
            </Link>
            <Link
              href={withPublicAudience("/terms", audience)}
              className="text-xs text-slate-500 transition-colors hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400"
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
