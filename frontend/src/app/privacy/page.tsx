import type { Metadata } from "next";
import { LegalPublicPage } from "@/components/public/pages/PlatformMarketingPages";
import { buildPublicMetadata } from "@/lib/public-metadata";
import { resolveAudienceForPath, type PublicSearchParams } from "@/lib/public-page-request";

export const metadata: Metadata = buildPublicMetadata({
  title: "Privacy",
  description:
    "Privacy summary for public website visitors, contact requests, and demo enquiries handled by UabIndia ERP.",
  path: "/privacy",
});

export default async function PrivacyPage({
  searchParams,
}: {
  searchParams?: PublicSearchParams;
}) {
  const audience = await resolveAudienceForPath("/privacy", searchParams);

  return (
    <LegalPublicPage
      audience={audience}
      title="Privacy"
      eyebrow="Privacy summary"
      path="/privacy"
      body={[
        {
          heading: "Public enquiry data",
          text: "When visitors submit contact or demo forms, UabIndia ERP uses the provided name, email, phone, company details, and requirement notes to respond to the enquiry and route it to the appropriate team.",
        },
        {
          heading: "Operational relevance",
          text: "Only information relevant to the sales, implementation, or support discussion should be submitted through public forms. Sensitive internal data should not be shared until a formal project process has been established.",
        },
        {
          heading: "Platform trust",
          text: "The public website is designed to support secure, role-aware access into the main product experience. Privacy and access expectations are reinforced through tenant-aware workflows and controlled authentication flows.",
        },
      ]}
    />
  );
}
