import type { Metadata } from "next";
import { headers } from "next/headers";
import ClientContactPage from "@/components/public/client/ClientContactPage";
import PlatformContactPage from "@/components/public/platform/PlatformContactPage";
import { buildPublicMetadata } from "@/lib/public-metadata";
import { resolvePublicAudienceFromRequest } from "@/lib/public-audience";

export const metadata: Metadata = buildPublicMetadata({
  title: "Contact & Advisory",
  description: "Get in touch with customer service desks, enterprise architects, or schedule a live product walkthrough.",
  path: "/contact",
});

export default async function ContactPage({
  searchParams,
}: {
  searchParams?: Promise<{ audience?: string | string[]; tenant?: string | string[]; type?: string; demo?: string }>;
}) {
  const requestHeaders = await headers();
  const params = searchParams ? await searchParams : undefined;
  const audience = resolvePublicAudienceFromRequest({
    pathname: "/contact",
    host: requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host"),
    requestedAudience: params?.audience,
    tenant: params?.tenant,
  });

  return audience === "tenant" ? <ClientContactPage /> : <PlatformContactPage />;
}
