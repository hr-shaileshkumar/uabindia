import { clientProfile } from "@/data/clientProfile";
import type { PublicCompanyProfileResponse } from "@/services/publicApi";
import { parseBrandingTheme, type BrandingTheme } from "./branding";

export type ClientProfile = typeof clientProfile & {
  logoUrl?: string;
  theme?: BrandingTheme;
};

type BrandingPayload = {
  brandName?: string;
  logoUrl?: string;
};

const baseProfile: ClientProfile = { ...clientProfile, logoUrl: "/logo.png" };

const parseBranding = (payload?: string | null): BrandingPayload => {
  if (!payload) return {};
  try {
    return JSON.parse(payload) as BrandingPayload;
  } catch {
    return {};
  }
};

const firstNonEmpty = (...values: Array<string | null | undefined>): string | undefined =>
  values.find((value) => typeof value === "string" && value.trim().length > 0)?.trim();

const normalizeTenantName = (value?: string | null): string | undefined => {
  if (!value) return undefined;
  const cleaned = value
    .replace(/[-_.]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
  if (!cleaned) return undefined;
  return cleaned
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

export const getBaseClientProfile = (tenantSubdomain?: string): ClientProfile => {
  return {
    ...baseProfile,
    companyName: baseProfile.companyName,
    brandName: baseProfile.brandName,
  };
};

export const buildClientProfile = (
  response?: PublicCompanyProfileResponse
): ClientProfile => {
  if (!response) return getBaseClientProfile();

  const company = response.company ?? undefined;
  const tenant = response.tenant ?? undefined;
  const branding = parseBranding(response.brandingJson);

  const headquarters = [company?.city, company?.state, company?.country]
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    .join(" | ");

  return {
    ...baseProfile,
    companyName: firstNonEmpty(company?.name, tenant?.name, baseProfile.companyName) ?? baseProfile.companyName,
    brandName: firstNonEmpty(branding.brandName, baseProfile.brandName) ?? baseProfile.brandName,
    industry: firstNonEmpty(company?.industry, baseProfile.industry) ?? baseProfile.industry,
    headquarters: firstNonEmpty(headquarters, baseProfile.headquarters) ?? baseProfile.headquarters,
    supportEmail:
      firstNonEmpty(company?.contactPersonEmail, company?.email, baseProfile.supportEmail) ?? baseProfile.supportEmail,
    supportPhone:
      firstNonEmpty(company?.contactPersonPhone, company?.phoneNumber, baseProfile.supportPhone) ?? baseProfile.supportPhone,
    logoUrl: firstNonEmpty(branding.logoUrl, company?.logoUrl, baseProfile.logoUrl) ?? baseProfile.logoUrl,
    theme: parseBrandingTheme(response?.brandingJson),
  };
};
