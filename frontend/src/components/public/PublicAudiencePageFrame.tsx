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
  showHeader?: boolean;
  showFooter?: boolean;
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
  showHeader = true,
  showFooter = true,
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
      showHeader={showHeader}
      showFooter={showFooter}
    >
      {pageVisible ? (
        children
      ) : (
        <section className="py-20 sm:py-28">
          <div className={publicSectionClassName}>
            <div className="mx-auto max-w-2xl rounded-2xl border border-white/8 bg-white/4 p-8 text-center backdrop-blur-xl shadow-[0_16px_48px_rgba(0,0,0,0.4)]">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-400">
                Page Unavailable
              </p>
              <h1 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl">
                This page is not available for this workspace.
              </h1>
              <p className="mt-4 text-sm leading-7 text-slate-400">
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
