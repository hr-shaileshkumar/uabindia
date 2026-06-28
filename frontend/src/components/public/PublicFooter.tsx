"use client";

import Link from "next/link";
import type { ClientProfile } from "@/lib/publicProfile";
import type { PublicAudience } from "@/lib/public-audience";
import type { PublicFooterContent } from "@/lib/publicSiteContent";
import { withPublicAudience } from "@/lib/public-audience";
import { filterPublicLinks } from "@/lib/public-site-map";
import { publicFooterGroups, resources } from "@/lib/public-marketing";
import { publicSectionClassName } from "@/components/public/publicStyles";

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
  const quickLinks = filterPublicLinks(footerContent.footerLinks, audience, allowedPaths);
  const brandName = profile.brandName || profile.companyName || "UabIndia ERP";
  const platformMode = audience === "platform";
  const socialLinks = [
    { label: "LinkedIn", href: withPublicAudience("/about", audience) },
    { label: "Resources", href: withPublicAudience("/resources", audience) },
    { label: "Careers", href: withPublicAudience("/careers", audience) },
  ];

  if (variant === "minimal") {
    return (
      <footer className="mt-auto border-t border-white/70 bg-white/80">
        <div className={`${publicSectionClassName} py-5 text-center text-sm text-slate-500`}>
          {footerContent.legalLine}
        </div>
      </footer>
    );
  }

  return (
    <footer className="mt-auto border-t border-white/70 bg-slate-950 text-white">
      <div className={publicSectionClassName}>
        <div className="grid gap-10 py-14 xl:grid-cols-[1.05fr_1.35fr_0.9fr]">
          <div className="space-y-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-200">
                {platformMode ? "Enterprise software company" : "Workspace access"}
              </p>
              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-white">
                {brandName}
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-7 text-slate-300">
                {platformMode
                  ? "One platform for HR, payroll, attendance, finance, procurement, inventory, CRM, projects, assets, support, and reporting."
                  : footerContent.summary}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {profile.servicesInUse.slice(0, 6).map((service) => (
                <span
                  key={service}
                  className="rounded-full border border-white/12 bg-white/6 px-3 py-1.5 text-xs font-medium text-slate-200"
                >
                  {service}
                </span>
              ))}
            </div>
          </div>

          <div className="grid gap-8 sm:grid-cols-3">
            {(platformMode
              ? publicFooterGroups
              : [{ title: "Quick links", links: quickLinks }]).map((group) => (
              <div key={group.title}>
                <p className="text-sm font-semibold text-white">{group.title}</p>
                <div className="mt-4 space-y-3">
                  {group.links.map((link) => (
                    <Link
                      key={`${group.title}-${link.href}-${link.label}`}
                      href={withPublicAudience(link.href, audience)}
                      className="block text-sm text-slate-300 transition hover:text-white"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-5">
            <div className="rounded-[1.6rem] border border-white/10 bg-white/6 p-5">
              <p className="text-sm font-semibold text-white">Contact</p>
              <p className="mt-4 text-sm leading-7 text-slate-300">{profile.headquarters}</p>
              <p className="mt-3 text-sm text-slate-200">{profile.supportEmail}</p>
              <p className="mt-2 text-sm text-slate-200">{profile.supportPhone}</p>
              <p className="mt-3 text-xs uppercase tracking-[0.16em] text-slate-400">
                {profile.supportHours}
              </p>
            </div>

            {platformMode ? (
              <div className="rounded-[1.6rem] border border-white/10 bg-white/6 p-5">
                <p className="text-sm font-semibold text-white">Newsletter</p>
                <p className="mt-4 text-sm font-medium text-slate-100">ERP rollout notes, compliance updates, and product releases.</p>
                <p className="mt-2 text-sm leading-7 text-slate-300">
                  Use the resource center to review planning guides, evaluation checklists, and product updates before your next demo.
                </p>
                <Link
                  href={withPublicAudience(resources[0]?.href || "/resources", audience)}
                  className="mt-4 inline-flex text-sm font-semibold text-sky-300 transition hover:text-sky-200"
                >
                  Open resources
                </Link>
                <div className="mt-5 flex flex-wrap gap-2">
                  {socialLinks.map((link) => (
                    <Link
                      key={link.label}
                      href={link.href}
                      className="rounded-full border border-white/12 bg-white/8 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-slate-200 transition hover:bg-white/12"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className={`${publicSectionClassName} flex flex-col gap-3 py-5 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between`}>
          <p>{footerContent.legalLine}</p>
          <div className="flex flex-wrap gap-4">
            <Link href={withPublicAudience("/privacy", audience)} className="transition hover:text-white">
              Privacy
            </Link>
            <Link href={withPublicAudience("/terms", audience)} className="transition hover:text-white">
              Terms
            </Link>
            <Link href={withPublicAudience("/book-demo", audience)} className="transition hover:text-white">
              Book Demo
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
