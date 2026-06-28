import type { Metadata } from "next";
import { PricingLandingPage } from "@/components/public/pages/PlatformMarketingPages";
import { buildPublicMetadata } from "@/lib/public-metadata";
import { resolveAudienceForPath, type PublicSearchParams } from "@/lib/public-page-request";

export const metadata: Metadata = buildPublicMetadata({
  title: "Pricing",
  description:
    "Commercial planning for phased ERP rollout across growing organizations and enterprise teams.",
  path: "/pricing",
});

export default async function PricingPage({
  searchParams,
}: {
  searchParams?: PublicSearchParams;
}) {
  const audience = await resolveAudienceForPath("/pricing", searchParams);
  return <PricingLandingPage audience={audience} />;
}
