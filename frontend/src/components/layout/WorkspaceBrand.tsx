"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useOrgContext } from "@/context/OrgContext";
import { ROUTES } from "@/constants/routes";
import apiClient from "@/services/apiClient";
import { publicApi } from "@/services/publicApi";

const DEFAULT_LOGO = "/logo.png";
const DEFAULT_ALT = "UabIndia";
const SILENT = { headers: { "X-Silent-Error": "1" } };

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function readNonEmpty(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

function extractCompanyLogo(payload: unknown): string | null {
  const root = asRecord(payload);
  if (!root) return null;
  const company = asRecord(root.company) ?? root;
  return readNonEmpty(company.logoUrl, company.LogoUrl);
}

function extractTenantLogo(payload: unknown): string | null {
  const root = asRecord(payload);
  if (!root) return null;

  const brandingJson = readNonEmpty(root.brandingJson, root.BrandingJson);
  if (brandingJson) {
    try {
      const branding = asRecord(JSON.parse(brandingJson));
      const fromBranding = readNonEmpty(branding?.logoUrl, branding?.LogoUrl);
      if (fromBranding) return fromBranding;
    } catch {
      // Branding JSON is optional and may be invalid; fall through to company/tenant fields.
    }
  }

  const tenant = asRecord(root.tenant);
  const company = asRecord(root.company);
  return readNonEmpty(tenant?.logoUrl, tenant?.LogoUrl, company?.logoUrl, company?.LogoUrl);
}

export function WorkspaceBrand() {
  const { companyId, companyName } = useOrgContext();
  const [tenantLogoUrl, setTenantLogoUrl] = useState<string | null>(null);
  const [companyLogoUrl, setCompanyLogoUrl] = useState<string | null>(null);
  const [broken, setBroken] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;

    publicApi
      .getCompanyProfile("tenant")
      .then((response) => {
        if (!cancelled) setTenantLogoUrl(extractTenantLogo(response.data));
      })
      .catch(() => {
        if (!cancelled) setTenantLogoUrl(null);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!companyId) {
      setCompanyLogoUrl(null);
      return;
    }

    let cancelled = false;

    apiClient
      .get(`/companies/${companyId}`, SILENT)
      .then((response) => {
        if (!cancelled) setCompanyLogoUrl(extractCompanyLogo(response.data));
      })
      .catch(() => {
        if (!cancelled) setCompanyLogoUrl(null);
      });

    return () => {
      cancelled = true;
    };
  }, [companyId]);

  const src =
    [companyLogoUrl, tenantLogoUrl, DEFAULT_LOGO].find(
      (candidate): candidate is string =>
        typeof candidate === "string" && candidate.length > 0 && !broken.includes(candidate),
    ) ?? null;
  const alt = companyName || DEFAULT_ALT;

  return (
    <Link href={ROUTES.DASHBOARD} className="flex min-w-0 items-center gap-2" aria-label={alt}>
      {src ? (
        <Image
          src={src}
          alt={alt}
          width={128}
          height={32}
          className="h-8 w-auto max-w-[9rem] object-contain"
          priority
          unoptimized
          onError={() => setBroken((previous) => (previous.includes(src) ? previous : [...previous, src]))}
        />
      ) : (
        <>
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-[13px] font-bold text-white">
            U
          </span>
          <span className="hidden truncate text-[13px] font-semibold leading-tight text-slate-900 sm:block">{alt}</span>
        </>
      )}
    </Link>
  );
}
