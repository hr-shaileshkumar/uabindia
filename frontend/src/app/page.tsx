import type { Metadata } from "next";
import { headers } from "next/headers";
import PlatformHomePage from "@/components/public/pages/PlatformHomePage";
import TenantHomePage from "@/components/public/pages/TenantHomePage";
import { buildPublicMetadata } from "@/lib/public-metadata";
import { resolvePublicAudienceFromRequest } from "@/lib/public-audience";

export const metadata: Metadata = buildPublicMetadata(
  {
    title: "Modern Cloud ERP Platform",
    description:
      "UabIndia ERP helps organizations manage HR, payroll, attendance, finance, procurement, inventory, CRM, projects, assets, support, and reporting from one secure cloud platform.",
    path: "/",
  }
);

export default async function HomePage({
  searchParams,
}: {
  searchParams?: Promise<{ audience?: string | string[]; tenant?: string | string[] }>;
}) {
  const requestHeaders = await headers();
  const params = searchParams ? await searchParams : undefined;
  const audience = resolvePublicAudienceFromRequest({
    pathname: "/",
    host: requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host"),
    requestedAudience: params?.audience,
    tenant: params?.tenant,
  });

  return audience === "tenant" ? <TenantHomePage /> : <PlatformHomePage />;
}
