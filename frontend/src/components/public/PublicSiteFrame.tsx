"use client";

import type { CSSProperties, ReactNode } from "react";
import type { ClientProfile } from "@/lib/publicProfile";
import type { PublicFooterContent, PublicHeaderContent } from "@/lib/publicSiteContent";
import { brandingThemeToCssVars } from "@/lib/branding";
import PublicFooter from "@/components/public/PublicFooter";
import PublicHeader from "@/components/public/PublicHeader";

type PublicSiteFrameProps = {
  profile: ClientProfile;
  headerContent: PublicHeaderContent;
  footerContent: PublicFooterContent;
  children: ReactNode;
};

export default function PublicSiteFrame({
  profile,
  headerContent,
  footerContent,
  children,
}: PublicSiteFrameProps) {
  const brandingStyle: CSSProperties = brandingThemeToCssVars(profile.theme || {});

  return (
    <div
      className="flex min-h-screen flex-col bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.08),transparent_28%),radial-gradient(circle_at_85%_18%,rgba(45,212,191,0.08),transparent_22%),linear-gradient(180deg,#ffffff_0%,#f7fbff_32%,#eef5fb_100%)] text-slate-900"
      style={brandingStyle}
    >
      <PublicHeader profile={profile} headerContent={headerContent} />
      <main className="flex-1">{children}</main>
      <PublicFooter profile={profile} footerContent={footerContent} />
    </div>
  );
}
