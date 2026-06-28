import { headers } from "next/headers";
import CareersPageClient from "./CareersPageClient";
import { resolvePublicAudienceFromRequest } from "@/lib/public-audience";

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

  return <CareersPageClient audience={audience} />;
}
