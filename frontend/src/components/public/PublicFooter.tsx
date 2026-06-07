"use client";

import Link from "next/link";
import type { ClientProfile } from "@/lib/publicProfile";
import type { PublicFooterContent } from "@/lib/publicSiteContent";
import { publicSectionClassName } from "@/components/public/publicStyles";

type PublicFooterProps = {
  profile: ClientProfile;
  footerContent: PublicFooterContent;
};

export default function PublicFooter({ profile, footerContent }: PublicFooterProps) {
  const productLinks = footerContent.footerLinks.slice(0, 4);
  const resolvedName = profile.companyName?.trim() || profile.brandName || "Uabindia ERP";

  return (
    <footer className="mt-auto overflow-hidden border-t border-sky-100 bg-[linear-gradient(180deg,#fcfeff,#eef6fd)] text-slate-700">
      <div className={`${publicSectionClassName} py-14`}>
        <div className="grid gap-10 lg:grid-cols-[1.3fr_0.8fr_0.9fr]">
          <div className="space-y-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-(--erp-primary)">{footerContent.platformLabel}</p>
            <p className="max-w-xl text-sm leading-7 text-slate-600">{footerContent.summary}</p>
            <div className="flex flex-wrap gap-2">
              {profile.servicesInUse.slice(0, 4).map((service) => (
                <span
                  key={service}
                  className="rounded-full border border-sky-100 bg-white px-3 py-1.5 text-xs font-medium text-slate-600"
                >
                  {service}
                </span>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-sm font-semibold text-slate-950">Explore</p>
            <div className="space-y-3 text-sm text-slate-600">
              {productLinks.map((link) => (
                <Link key={`${link.href}-${link.label}`} href={link.href} className="block transition hover:text-slate-950">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="space-y-4 text-sm text-slate-600">
            <p className="text-sm font-semibold text-slate-950">Contact</p>
            <div className="rounded-[1.5rem] border border-sky-100 bg-white p-5 shadow-[0_14px_36px_rgba(125,162,191,0.12)]">
              <p className="font-semibold text-slate-950">{resolvedName}</p>
              <p className="mt-3">{profile.headquarters}</p>
              <p className="mt-2">{profile.supportEmail}</p>
              <p className="mt-2">{profile.supportPhone}</p>
              <p className="mt-2 text-slate-500">{profile.supportHours}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-sky-100 py-5 text-center text-xs text-slate-500">
        {footerContent.legalLine.replace("Â©", "©").replace("Ã‚Â©", "©")}
      </div>
    </footer>
  );
}
