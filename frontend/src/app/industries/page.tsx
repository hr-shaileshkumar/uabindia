import type { Metadata } from "next";
import { IndustriesLandingPage } from "@/components/public/pages/PublicMarketingPages";
import { buildPublicMetadata } from "@/lib/public-metadata";
import { resolveAudienceForPath, type PublicSearchParams } from "@/lib/public-page-request";

export const metadata: Metadata = buildPublicMetadata({
  title: "Industries",
  description:
    "Industry solutions for healthcare, manufacturing, retail, construction, education, NGOs, logistics, government projects, and services.",
  path: "/industries",
});

export default async function IndustriesPage({
  searchParams,
}: {
  searchParams?: PublicSearchParams;
}) {
  const audience = await resolveAudienceForPath("/industries", searchParams);
  return <IndustriesLandingPage audience={audience} />;
}
