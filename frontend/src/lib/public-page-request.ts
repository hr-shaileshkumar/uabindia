import { headers } from "next/headers";
import { resolvePublicAudienceFromRequest } from "@/lib/public-audience";

export type PublicSearchParams = Promise<{
  audience?: string | string[];
  tenant?: string | string[];
}>;

export async function resolveAudienceForPath(
  pathname: string,
  searchParams?: PublicSearchParams
) {
  const requestHeaders = await headers();
  const params = searchParams ? await searchParams : undefined;

  return resolvePublicAudienceFromRequest({
    pathname,
    host: requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host"),
    requestedAudience: params?.audience,
    tenant: params?.tenant,
  });
}
