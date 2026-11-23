import type { Metadata } from "next";
import { headers } from "next/headers";
import ClientCareersPage from "@/components/public/client/ClientCareersPage";
import PlatformCareersPage from "@/components/public/platform/PlatformCareersPage";
import { buildPublicMetadata } from "@/lib/public-metadata";
import { resolvePublicAudienceFromRequest } from "@/lib/public-audience";

export const metadata: Metadata = buildPublicMetadata({
  title: "Careers & Open Positions",
  description: "Explore open job roles, submit candidate profiles, and track hiring applications.",
  path: "/careers",
});

export default async function CareersPage({
  searchParams,
}: {
  searchParams?: Promise<{ audience?: string | string[]; tenant?: string | string[] }>;
}) {
  const requestHeaders = await headers();
  const params = searchParams ? await searchParams : undefined;
  const audience = resolvePublicAudienceFromRequest({
    pathname: "/careers",
    host: requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host"),
    requestedAudience: params?.audience,
    tenant: params?.tenant,
  });

  return audience === "tenant" ? <ClientCareersPage /> : <PlatformCareersPage />;
}
