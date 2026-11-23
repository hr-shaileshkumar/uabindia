import type { Metadata } from "next";
import { headers } from "next/headers";
import ClientAboutPage from "@/components/public/client/ClientAboutPage";
import PlatformAboutPage from "@/components/public/platform/PlatformAboutPage";
import { buildPublicMetadata } from "@/lib/public-metadata";
import { resolvePublicAudienceFromRequest } from "@/lib/public-audience";

export const metadata: Metadata = buildPublicMetadata({
  title: "About Us",
  description: "Enterprise software built for operational clarity, governance, and transparent business management.",
  path: "/about",
});

export default async function AboutPage({
  searchParams,
}: {
  searchParams?: Promise<{ audience?: string | string[]; tenant?: string | string[] }>;
}) {
  const requestHeaders = await headers();
  const params = searchParams ? await searchParams : undefined;
  const audience = resolvePublicAudienceFromRequest({
    pathname: "/about",
    host: requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host"),
    requestedAudience: params?.audience,
    tenant: params?.tenant,
  });

  return audience === "tenant" ? <ClientAboutPage /> : <PlatformAboutPage />;
}
