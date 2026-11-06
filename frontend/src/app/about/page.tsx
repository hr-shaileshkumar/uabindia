import { headers } from "next/headers";
import AboutPageClient from "./AboutPageClient";
import { resolvePublicAudienceFromRequest } from "@/lib/public-audience";

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

  return <AboutPageClient audience={audience} />;
}
