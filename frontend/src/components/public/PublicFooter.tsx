"use client";

import Link from "next/link";
import type { ClientProfile } from "@/lib/publicProfile";
import type { PublicFooterContent } from "@/lib/publicSiteContent";

type PublicFooterProps = {
  profile: ClientProfile;
  footerContent: PublicFooterContent;
};

export default function PublicFooter({ profile, footerContent }: PublicFooterProps) {
  const productLinks = footerContent.footerLinks.slice(0, 3);
  const companyLinks = footerContent.footerLinks.slice(3);
  const normalizedBrandName = profile.brandName?.trim().toLowerCase() ?? "";
  const resolvedBrandName =
    normalizedBrandName && !["erp", "portal", "tenant", "client", "company", "www", "app"].includes(normalizedBrandName)
      ? profile.brandName
      : "Uabindia ERP";
  const contactName =
    profile.companyName && profile.companyName.trim().length > 0 && !["erp", "portal", "tenant", "client", "company", "www", "app"].includes(profile.companyName.trim().toLowerCase())
      ? profile.companyName
      : resolvedBrandName;

  return (
    <footer className="mt-auto border-t border-slate-200 bg-slate-950 text-slate-200">
      <div className="mx-auto max-w-7xl px-5 py-16 lg:px-6">
        <div className="grid gap-10 xl:grid-cols-[1.6fr_1fr_1fr_1fr]">
          <div className="space-y-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
              {footerContent.platformLabel}
            </p>
            <p className="max-w-xl text-sm leading-7 text-slate-300">{footerContent.summary}</p>
            <div className="flex flex-wrap gap-2">
              {profile.servicesInUse.slice(0, 5).map((service) => (
                <span
                  key={service}
                  className="rounded-full border border-slate-700 bg-slate-900/70 px-3 py-1 text-xs font-medium text-slate-300"
                >
                  {service}
                </span>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-sm font-semibold text-white">Product</p>
            <div className="space-y-3 text-sm text-slate-300">
              {productLinks.map((link) => (
                <Link key={`${link.href}-${link.label}`} href={link.href} className="block transition hover:text-white">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-sm font-semibold text-white">Company</p>
            <div className="space-y-3 text-sm text-slate-300">
              {companyLinks.map((link) => (
                <Link key={`${link.href}-${link.label}`} href={link.href} className="block transition hover:text-white">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="space-y-4 text-sm text-slate-300">
            <p className="text-sm font-semibold text-white">Contact</p>
            <div className="space-y-2">
              <p className="font-semibold text-slate-100">{contactName}</p>
              <p>{profile.headquarters}</p>
              <p>{profile.supportEmail}</p>
              <p>{profile.supportPhone}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-800 bg-slate-900 py-5 text-center text-xs text-slate-500">
        {footerContent.legalLine}
      </div>
    </footer>
  );
}
