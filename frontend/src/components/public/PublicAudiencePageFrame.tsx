"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import PublicSiteFrame from "@/components/public/PublicSiteFrame";
import { withPublicAudience, type PublicAudience } from "@/lib/public-audience";
import type { ClientProfile } from "@/lib/publicProfile";
import type { PublicFooterContent, PublicHeaderContent } from "@/lib/publicSiteContent";
import { publicButtonClassName, publicSectionClassName } from "@/components/public/publicStyles";

type PublicAudiencePageFrameProps = {
  audience: PublicAudience;
  profile: ClientProfile;
  headerContent: PublicHeaderContent;
  footerContent: PublicFooterContent;
  allowedPaths?: string[];
  footerVariant?: "full" | "minimal";
  pageVisible?: boolean;
  children: ReactNode;
};

export default function PublicAudiencePageFrame({
  audience,
  profile,
  headerContent,
  footerContent,
  allowedPaths,
  footerVariant = "full",
  pageVisible = true,
  children,
}: PublicAudiencePageFrameProps) {
  return (
    <PublicSiteFrame
      audience={audience}
      profile={profile}
      headerContent={headerContent}
      footerContent={footerContent}
      allowedPaths={allowedPaths}
      footerVariant={footerVariant}
    >
      {pageVisible ? (
        children
      ) : (
        <section className="py-20 sm:py-24">
          <div className={publicSectionClassName}>
            <div className="mx-auto max-w-2xl rounded-[1.6rem] border border-slate-200 bg-white p-8 text-center shadow-[0_20px_48px_rgba(15,23,42,0.06)]">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--erp-primary)]">
                Public Page Disabled
              </p>
              <h1 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-slate-950">
                This page is not available for this workspace.
              </h1>
              <p className="mt-4 text-sm leading-7 text-slate-600">
                Backend public access rules for this domain or tenant subdomain do not allow this page right now.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Link
                  href={withPublicAudience("/", audience)}
                  className={publicButtonClassName.primary}
                >
                  Go to home
                </Link>
                <Link
                  href={withPublicAudience("/login", audience)}
                  className={publicButtonClassName.secondary}
                >
                  Login
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}
    </PublicSiteFrame>
  );
}
