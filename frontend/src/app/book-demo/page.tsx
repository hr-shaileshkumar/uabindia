import type { Metadata } from "next";
import { BookDemoLandingPage } from "@/components/public/pages/PlatformMarketingPages";
import { buildPublicMetadata } from "@/lib/public-metadata";
import { resolveAudienceForPath, type PublicSearchParams } from "@/lib/public-page-request";

export const metadata: Metadata = buildPublicMetadata({
  title: "Book Demo",
  description:
    "Book a tailored walkthrough for your ERP, HR, payroll, finance, procurement, inventory, and operations rollout.",
  path: "/book-demo",
});

export default async function BookDemoPage({
  searchParams,
}: {
  searchParams?: PublicSearchParams;
}) {
  const audience = await resolveAudienceForPath("/book-demo", searchParams);
  return <BookDemoLandingPage audience={audience} />;
}
