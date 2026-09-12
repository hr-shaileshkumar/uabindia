import { HelpSupportLandingPage } from "@/components/public/pages/PublicMarketingPages";
import { resolveAudienceForPath, type PublicSearchParams } from "@/lib/public-page-request";

export default async function HelpSupportPage({
  searchParams,
}: {
  searchParams?: PublicSearchParams;
}) {
  const audience = await resolveAudienceForPath("/help-support", searchParams);
  return <HelpSupportLandingPage audience={audience} />;
}
