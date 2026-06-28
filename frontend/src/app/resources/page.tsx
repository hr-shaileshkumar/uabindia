import type { Metadata } from "next";
import { ResourcesLandingPage } from "@/components/public/pages/PlatformMarketingPages";
import { buildPublicMetadata } from "@/lib/public-metadata";
import { resolveAudienceForPath, type PublicSearchParams } from "@/lib/public-page-request";

export const metadata: Metadata = buildPublicMetadata({
  title: "Resources",
  description:
    "Guides, checklists, and planning material for ERP evaluation and rollout teams.",
  path: "/resources",
});

export default async function ResourcesPage({
  searchParams,
}: {
  searchParams?: PublicSearchParams;
}) {
  const audience = await resolveAudienceForPath("/resources", searchParams);
  return <ResourcesLandingPage audience={audience} />;
}
