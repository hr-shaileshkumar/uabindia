import type { Metadata } from "next";
import { headers } from "next/headers";
import ClientHomePage from "@/components/public/client/ClientHomePage";
import PlatformHomePage from "@/components/public/platform/PlatformHomePage";
import { buildPublicMetadata } from "@/lib/public-metadata";
import { resolvePublicAudienceFromRequest } from "@/lib/public-audience";

export const metadata: Metadata = buildPublicMetadata(
  {
    title: "Next-Gen Cloud Enterprise Platform",
    description:
      (process.env.NEXT_PUBLIC_APP_NAME || "UabIndia ERP") + " helps organizations manage HRMS, payroll, accounting, procurement, inventory, projects, and operational intelligence from one secure cloud platform.",
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

  return audience === "tenant" ? <ClientHomePage /> : <PlatformHomePage />;
}
