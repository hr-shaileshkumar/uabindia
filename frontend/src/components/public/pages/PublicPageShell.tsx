"use client";

import type { ReactNode } from "react";
import PublicAudiencePageFrame from "@/components/public/PublicAudiencePageFrame";
import { PublicPageLoading } from "@/components/public/PublicPageLoading";
import { usePublicPageData } from "@/hooks/usePublicPageData";
import type { ClientProfile } from "@/lib/publicProfile";
import type {
  PublicFooterContent,
  PublicHeaderContent,
} from "@/lib/publicSiteContent";
import type { PublicSiteDataResponse } from "@/services/publicApi";

type PlatformPublicPageState = {
  profile: ClientProfile;
  headerContent: PublicHeaderContent;
  footerContent: PublicFooterContent;
  siteData: PublicSiteDataResponse | null;
  allowedPaths: string[];
  loading: boolean;
  pageVisible: boolean;
  parseContent: <TContent extends Record<string, unknown>>(fallback: TContent) => TContent;
};

export function usePublicPage(
  pageType: string
): PlatformPublicPageState {
  const {
    profile,
    headerContent,
    footerContent,
    siteData,
    allowedPaths,
    parseContent,
    loading,
    pageVisible,
  } = usePublicPageData(pageType, "platform");

  return {
    profile,
    headerContent,
    footerContent,
    siteData,
    allowedPaths,
    loading,
    pageVisible,
    parseContent,
  };
}

export { usePublicPage as usePlatformPublicPage };

type PlatformPublicPageShellProps = {
  loading: boolean;
  profile: ClientProfile;
  headerContent: PublicHeaderContent;
  footerContent: PublicFooterContent;
  allowedPaths?: string[];
  pageVisible?: boolean;
  children: ReactNode;
};

export function PublicPageShell({
  loading,
  profile,
  headerContent,
  footerContent,
  allowedPaths,
  pageVisible = true,
  children,
}: PlatformPublicPageShellProps) {
  if (loading) {
    return <PublicPageLoading label="Loading..." sublabel="Preparing the website" />;
  }

  return (
    <PublicAudiencePageFrame
      audience="platform"
      profile={profile}
      headerContent={headerContent}
      footerContent={footerContent}
      allowedPaths={allowedPaths}
      pageVisible={pageVisible}
    >
      {children}
    </PublicAudiencePageFrame>
  );
}

export { PublicPageShell as PlatformPublicPageShell };

