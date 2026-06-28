import { headers } from "next/headers";
import ContactPageClient from "./ContactPageClient";
import { resolvePublicAudienceFromRequest } from "@/lib/public-audience";

export default async function ContactPage({
  searchParams,
}: {
  searchParams?: Promise<{ audience?: string | string[]; tenant?: string | string[] }>;
}) {
  const requestHeaders = await headers();
  const params = searchParams ? await searchParams : undefined;
  const audience = resolvePublicAudienceFromRequest({
    pathname: "/contact",
    host: requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host"),
    requestedAudience: params?.audience,
    tenant: params?.tenant,
  });

  return <ContactPageClient audience={audience} />;
}
