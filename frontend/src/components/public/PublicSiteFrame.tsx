"use client";

import type { CSSProperties, ReactNode } from "react";
import type { ClientProfile } from "@/lib/publicProfile";
import type { PublicAudience } from "@/lib/public-audience";
import type { PublicFooterContent, PublicHeaderContent } from "@/lib/publicSiteContent";
import { brandingThemeToCssVars } from "@/lib/branding";
import PublicFooter from "@/components/public/PublicFooter";
import PublicHeader from "@/components/public/PublicHeader";

type PublicSiteFrameProps = {
  audience?: PublicAudience;
  profile: ClientProfile;
  headerContent: PublicHeaderContent;
  footerContent: PublicFooterContent;
  allowedPaths?: string[];
  footerVariant?: "full" | "minimal";
  showHeader?: boolean;
  showFooter?: boolean;
  children: ReactNode;
};

export default function PublicSiteFrame({
  audience = "tenant",
  profile,
  headerContent,
  footerContent,
  allowedPaths,
  footerVariant = "full",
  showHeader = true,
  showFooter = true,
  children,
}: PublicSiteFrameProps) {
  const brandingStyle: CSSProperties = brandingThemeToCssVars(profile.theme || {});

  return (
    <div className="relative flex min-h-screen flex-col bg-white text-slate-900" style={brandingStyle}>
      {showHeader ? (
        <PublicHeader
          audience={audience}
          profile={profile}
          headerContent={headerContent}
          allowedPaths={allowedPaths}
        />
      ) : null}
      <main className="relative z-10 flex min-h-0 flex-1 flex-col">{children}</main>
      {showFooter ? (
        <PublicFooter
          audience={audience}
          profile={profile}
          footerContent={footerContent}
          allowedPaths={allowedPaths}
          variant={footerVariant}
        />
      ) : null}
    </div>
  );
}
