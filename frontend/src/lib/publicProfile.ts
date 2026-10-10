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

const isGenericBrandName = (value?: string | null): boolean => {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  return [
    "erp",
    "portal",
    "tenant",
    "client",
    "company",
    "www",
    "app",
    "enterprise platform",
    "platform",
  ].includes(normalized);
};

export const getBaseClientProfile = (): ClientProfile => {
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

  const safeBrandName = !isGenericBrandName(branding.brandName)
    ? branding.brandName
    : baseProfile.brandName;

  return {
    ...baseProfile,
    companyName:
      firstNonEmpty(
        !isGenericBrandName(company?.name) ? company?.name : undefined,
        !isGenericBrandName(tenant?.name) ? tenant?.name : undefined,
        baseProfile.companyName
      ) ?? baseProfile.companyName,
    brandName: firstNonEmpty(safeBrandName, baseProfile.brandName) ?? baseProfile.brandName,
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
