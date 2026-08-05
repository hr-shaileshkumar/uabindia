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
    <div
      className="pub-page public-site-shell relative flex min-h-screen flex-col overflow-x-clip"
      style={brandingStyle}
    >
      {/* Very subtle indigo radial glow at top — adds depth without dark background */}
      <div
        className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-[480px]"
        style={{
          background:
            "radial-gradient(ellipse 70% 60% at 50% -10%, rgba(79,70,229,0.08) 0%, transparent 70%)",
        }}
      />

      {showHeader ? (
        <PublicHeader
          audience={audience}
          profile={profile}
          headerContent={headerContent}
          allowedPaths={allowedPaths}
        />
      ) : null}
      <main className="public-page-main flex-1">{children}</main>
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
