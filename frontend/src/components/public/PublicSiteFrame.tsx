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
  children: ReactNode;
};

export default function PublicSiteFrame({
  audience = "tenant",
  profile,
  headerContent,
  footerContent,
  allowedPaths,
  footerVariant = "full",
  children,
}: PublicSiteFrameProps) {
  const brandingStyle: CSSProperties = brandingThemeToCssVars(profile.theme || {});

  return (
    <div
      className="relative flex min-h-screen flex-col overflow-x-clip bg-[#f7f8fb] text-slate-900"
      style={brandingStyle}
    >
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_14%_10%,rgba(37,99,235,0.12),transparent_28%),radial-gradient(circle_at_88%_8%,rgba(99,102,241,0.1),transparent_26%),radial-gradient(circle_at_72%_76%,rgba(16,185,129,0.08),transparent_28%),linear-gradient(180deg,#fbfdff_0%,#f4f7fb_42%,#edf3f8_100%)]" />
      <div className="pointer-events-none absolute top-20 left-[-8rem] -z-10 h-72 w-72 rounded-full bg-sky-200/30 blur-3xl" />
      <div className="pointer-events-none absolute top-0 right-[-6rem] -z-10 h-80 w-80 rounded-full bg-indigo-200/30 blur-3xl" />
      <PublicHeader audience={audience} profile={profile} headerContent={headerContent} allowedPaths={allowedPaths} />
      <main className="flex-1">{children}</main>
      <PublicFooter audience={audience} profile={profile} footerContent={footerContent} allowedPaths={allowedPaths} variant={footerVariant} />
    </div>
  );
}
