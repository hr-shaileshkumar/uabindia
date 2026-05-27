import { clientProfile } from "@/data/clientProfile";
import type { PublicCompanyProfileResponse } from "./publicApi";

export type ClientProfile = typeof clientProfile & {
  logoUrl?: string;
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

export const getBaseClientProfile = (): ClientProfile => ({ ...baseProfile });

export const buildClientProfile = (
  response?: PublicCompanyProfileResponse
): ClientProfile => {
  if (!response) return getBaseClientProfile();

  const company = response.company ?? undefined;
  const tenant = response.tenant ?? undefined;
  const branding = parseBranding(response.brandingJson);

  return {
    ...baseProfile,
    companyName: company?.name ?? tenant?.name ?? baseProfile.companyName,
    brandName: branding.brandName ?? baseProfile.brandName,
    industry: company?.industry ?? baseProfile.industry,
    headquarters:
      [company?.city, company?.state, company?.country]
        .filter(Boolean)
        .join(" · ") || baseProfile.headquarters,
    supportEmail:
      company?.contactPersonEmail ?? company?.email ?? baseProfile.supportEmail,
    supportPhone:
      company?.contactPersonPhone ?? company?.phoneNumber ?? baseProfile.supportPhone,
    logoUrl: branding.logoUrl ?? company?.logoUrl ?? baseProfile.logoUrl,
  };
};
