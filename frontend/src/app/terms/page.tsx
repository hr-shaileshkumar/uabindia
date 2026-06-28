import type { Metadata } from "next";
import { LegalPublicPage } from "@/components/public/pages/PlatformMarketingPages";
import { buildPublicMetadata } from "@/lib/public-metadata";
import { resolveAudienceForPath, type PublicSearchParams } from "@/lib/public-page-request";

export const metadata: Metadata = buildPublicMetadata({
  title: "Terms",
  description:
    "Public website terms summary for visitors, product evaluation teams, and demo enquiries.",
  path: "/terms",
});

export default async function TermsPage({
  searchParams,
}: {
  searchParams?: PublicSearchParams;
}) {
  const audience = await resolveAudienceForPath("/terms", searchParams);

  return (
    <LegalPublicPage
      audience={audience}
      title="Terms"
      eyebrow="Terms summary"
      path="/terms"
      body={[
        {
          heading: "Informational purpose",
          text: "The public website is intended to explain product capabilities, industry fit, rollout approach, and enquiry pathways. Commercial commitments are finalized only through formal proposals and agreements.",
        },
        {
          heading: "Evaluation process",
          text: "Product descriptions, module references, and industry examples are designed to support evaluation conversations. Final implementation scope, timelines, and deliverables depend on the agreed project plan.",
        },
        {
          heading: "Responsible use",
          text: "Visitors should use contact, demo, and access-request features in good faith and provide accurate information relevant to genuine business or support needs.",
        },
      ]}
    />
  );
}
