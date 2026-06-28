"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { hasExplicitPublicTenantContext, type PublicAudience } from "@/lib/public-audience";
import {
  buildClientProfile,
  getBaseClientProfile,
  type ClientProfile,
} from "@/lib/publicProfile";
import { getTenantSubdomain } from "@/services/apiClient";
import {
  getDefaultFooterContent,
  getDefaultHeaderContent,
  parsePageContentJson,
  type PublicFooterContent,
  type PublicHeaderContent,
  type PublicPageRecord,
} from "@/lib/publicSiteContent";
import type { PublicSiteManifestResponse } from "@/services/publicApi";
import type { PublicSiteDataResponse } from "@/services/publicApi";
import { publicApi } from "@/services/modules";
import { getManifestPublicNavLinks, isSupportedPublicHref } from "@/lib/public-site-map";

type UsePublicPageDataResult = {
  profile: ClientProfile;
  pageRecord: PublicPageRecord | null;
  manifest: PublicSiteManifestResponse | null;
  siteData: PublicSiteDataResponse | null;
  allowedPaths: string[];
  headerContent: PublicHeaderContent;
  footerContent: PublicFooterContent;
  loading: boolean;
  isTenantContext: boolean;
  pageVisible: boolean;
  parseContent: <T extends Record<string, unknown>>(fallback: T) => T;
};

export const usePublicPageData = (
  pageType: string,
  audience: PublicAudience = "tenant"
): UsePublicPageDataResult => {
  const pathname = usePathname();
  const [profile, setProfile] = useState<ClientProfile>(getBaseClientProfile());
  const [pageRecord, setPageRecord] = useState<PublicPageRecord | null>(null);
  const [manifest, setManifest] = useState<PublicSiteManifestResponse | null>(null);
  const [siteData, setSiteData] = useState<PublicSiteDataResponse | null>(null);
  const [headerRecord, setHeaderRecord] = useState<PublicPageRecord | null>(null);
  const [footerRecord, setFooterRecord] = useState<PublicPageRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [isTenantContext, setIsTenantContext] = useState(false);

  useEffect(() => {
    let isActive = true;
    const isTenantRequest = typeof window !== "undefined" ? hasExplicitPublicTenantContext() : audience === "tenant";
    const resolvedAudience: PublicAudience = isTenantRequest ? "tenant" : "platform";
    const tenant = isTenantRequest && typeof window !== "undefined" ? getTenantSubdomain() : null;
    const canLoadPageContent = resolvedAudience === "platform" || Boolean(tenant);
    setIsTenantContext(isTenantRequest);
    setLoading(true);

    const profileRequest =
      resolvedAudience === "platform"
        ? publicApi.getCompanyProfile("platform").then((response) => buildClientProfile(response.data))
        : tenant
          ? publicApi.getCompanyProfile("tenant").then((response) => buildClientProfile(response.data))
          : Promise.resolve(getBaseClientProfile());
    const manifestRequest = publicApi.getSiteManifest(resolvedAudience).catch(() => null);
    const siteDataRequest = publicApi.getSiteData(resolvedAudience).catch(() => null);

    profileRequest
      .then((nextProfile) => {
        if (!isActive) return;
        setProfile(nextProfile);
      })
      .catch(() => {
        if (!isActive) return;
        setProfile(getBaseClientProfile());
      });

    if (!canLoadPageContent) {
      setPageRecord(null);
      setHeaderRecord(null);
      setFooterRecord(null);
      Promise.all([manifestRequest, siteDataRequest])
        .then(([manifestResponse, siteDataResponse]) => {
          if (!isActive) return;
          setManifest(manifestResponse?.data ?? null);
          setSiteData(siteDataResponse?.data ?? null);
        })
        .finally(() => {
          if (isActive) setLoading(false);
        });
      return () => {
        isActive = false;
      };
    }

    Promise.all([
      manifestRequest,
      siteDataRequest,
      publicApi.getWebsitePage(pageType, resolvedAudience).catch(() => null),
      publicApi.getWebsitePage("header", resolvedAudience).catch(() => null),
      publicApi.getWebsitePage("footer", resolvedAudience).catch(() => null),
    ])
      .then((responses) => {
        if (!isActive) return;
        setManifest(responses[0]?.data ?? null);
        setSiteData(responses[1]?.data ?? null);
        setPageRecord(responses[2]?.data ?? null);
        setHeaderRecord(responses[3]?.data ?? null);
        setFooterRecord(responses[4]?.data ?? null);
      })
      .finally(() => {
        if (isActive) setLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [audience, pageType]);

  const headerContent = useMemo(
    () => {
      const defaultHeaderContent = getDefaultHeaderContent(profile, audience);
      const manifestPrimaryLinks = getManifestPublicNavLinks(manifest?.pages, "primary");

      return parsePageContentJson<PublicHeaderContent>(headerRecord?.contentJson, {
        ...defaultHeaderContent,
        homeHref: manifest?.homePath || defaultHeaderContent.homeHref,
        navLinks:
          manifestPrimaryLinks.length > 0
            ? manifestPrimaryLinks
            : defaultHeaderContent.navLinks,
      });
    },
    [audience, headerRecord?.contentJson, manifest?.homePath, manifest?.pages, profile]
  );

  const footerContent = useMemo(
    () => {
      const defaultFooterContent = getDefaultFooterContent(profile, audience);
      const manifestFooterLinks = getManifestPublicNavLinks(manifest?.pages, "footer");

      return parsePageContentJson<PublicFooterContent>(footerRecord?.contentJson, {
        ...defaultFooterContent,
        footerLinks:
          manifestFooterLinks.length > 0
            ? manifestFooterLinks
            : defaultFooterContent.footerLinks,
      });
    },
    [audience, footerRecord?.contentJson, manifest?.pages, profile]
  );
  const allowedPaths = useMemo(
    () => manifest?.pages?.filter((page) => page.isEnabled).map((page) => page.path) ?? [],
    [manifest]
  );
  const pageVisible = useMemo(() => {
    if (!manifest || !pathname) {
      return true;
    }

    const normalizePath = (value: string) => value.split("?")[0].split("#")[0].replace(/\/+$/, "") || "/";
    const currentPath = normalizePath(pathname);
    const manifestPages = manifest.pages || [];

    if (manifestPages.length === 0) {
      return true;
    }

    if (
      manifestPages.some(
        (page) => page.isEnabled && normalizePath(page.path) === currentPath
      )
    ) {
      return true;
    }

    return isSupportedPublicHref(
      currentPath,
      audience,
      manifestPages.filter((page) => page.isEnabled).map((page) => normalizePath(page.path))
    );
  }, [audience, manifest, pathname]);

  return {
    profile,
    pageRecord,
    manifest,
    siteData,
    allowedPaths,
    headerContent,
    footerContent,
    loading,
    isTenantContext,
    pageVisible,
    parseContent: <T extends Record<string, unknown>>(fallback: T) =>
      parsePageContentJson<T>(pageRecord?.contentJson, fallback),
  };
};
