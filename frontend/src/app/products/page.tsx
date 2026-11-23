import type { Metadata } from "next";
import { headers } from "next/headers";
import ClientProductCatalogPage from "@/components/public/client/ClientProductCatalogPage";
import PlatformModulesPage from "@/components/public/platform/PlatformModulesPage";
import { buildPublicMetadata } from "@/lib/public-metadata";
import { resolvePublicAudienceFromRequest } from "@/lib/public-audience";

export const metadata: Metadata = buildPublicMetadata({
  title: "Products & Modules Suite",
  description: "Browse authenticated product catalog, industrial inventory, and ERP software modules.",
  path: "/products",
});

export default async function ProductsPage({
  searchParams,
}: {
  searchParams?: Promise<{ audience?: string | string[]; tenant?: string | string[] }>;
}) {
  const requestHeaders = await headers();
  const params = searchParams ? await searchParams : undefined;
  const audience = resolvePublicAudienceFromRequest({
    pathname: "/products",
    host: requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host"),
    requestedAudience: params?.audience,
    tenant: params?.tenant,
  });

  return audience === "tenant" ? <ClientProductCatalogPage /> : <PlatformModulesPage />;
}
