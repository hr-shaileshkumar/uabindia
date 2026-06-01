"use client";

import { useEffect, useMemo, useState } from "react";
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
import { publicApi } from "@/services/publicApi";

type UsePublicPageDataResult = {
  profile: ClientProfile;
  pageRecord: PublicPageRecord | null;
  headerContent: PublicHeaderContent;
  footerContent: PublicFooterContent;
  parseContent: <T extends Record<string, unknown>>(fallback: T) => T;
};

export const usePublicPageData = (pageType: string): UsePublicPageDataResult => {
  const [profile, setProfile] = useState<ClientProfile>(getBaseClientProfile());
  const [pageRecord, setPageRecord] = useState<PublicPageRecord | null>(null);
  const [headerRecord, setHeaderRecord] = useState<PublicPageRecord | null>(null);
  const [footerRecord, setFooterRecord] = useState<PublicPageRecord | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const tenant = getTenantSubdomain();
    if (!tenant) return;
    setProfile((currentProfile) => {
      const fallbackProfile = getBaseClientProfile();
      if (currentProfile.companyName === fallbackProfile.companyName && currentProfile.brandName === fallbackProfile.brandName) {
        return currentProfile;
      }
      return fallbackProfile;
    });
  }, []);

  useEffect(() => {
    let isActive = true;

    publicApi
      .getCompanyProfile()
      .then((response) => {
        if (!isActive) return;
        setProfile(buildClientProfile(response.data));
      })
      .catch(() => undefined);

    Promise.all([
      publicApi.getWebsitePage(pageType).catch(() => null),
      publicApi.getWebsitePage("header").catch(() => null),
      publicApi.getWebsitePage("footer").catch(() => null),
    ]).then((responses) => {
      if (!isActive) return;

      setPageRecord(responses[0]?.data ?? null);
      setHeaderRecord(responses[1]?.data ?? null);
      setFooterRecord(responses[2]?.data ?? null);
    });

    return () => {
      isActive = false;
    };
  }, [pageType]);

  const headerContent = useMemo(
    () => parsePageContentJson<PublicHeaderContent>(headerRecord?.contentJson, getDefaultHeaderContent(profile)),
    [headerRecord?.contentJson, profile]
  );

  const footerContent = useMemo(
    () => parsePageContentJson<PublicFooterContent>(footerRecord?.contentJson, getDefaultFooterContent(profile)),
    [footerRecord?.contentJson, profile]
  );

  return {
    profile,
    pageRecord,
    headerContent,
    footerContent,
    parseContent: <T extends Record<string, unknown>>(fallback: T) =>
      parsePageContentJson<T>(pageRecord?.contentJson, fallback),
  };
};
