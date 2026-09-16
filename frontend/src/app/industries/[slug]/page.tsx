import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { IndustryDetailPageClient } from "@/components/public/pages/PublicMarketingPages";
import { getMarketingIndustry } from "@/lib/public-marketing";
import { buildPublicMetadata } from "@/lib/public-metadata";
import { resolveAudienceForPath, type PublicSearchParams } from "@/lib/public-page-request";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const industry = getMarketingIndustry(slug);

  if (!industry) {
    return buildPublicMetadata({
      title: "Industry Solutions",
      description: "Enterprise industry solutions.",
      path: "/industries",
    });
  }

  return buildPublicMetadata({
    title: `${industry.title} ERP Solution`,
    description: industry.summary,
    path: `/industries/${industry.slug}`,
  });
}

export default async function IndustryDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams?: PublicSearchParams;
}) {
  const { slug } = await params;
  const industry = getMarketingIndustry(slug);

  if (!industry) {
    notFound();
  }

  const audience = await resolveAudienceForPath(`/industries/${slug}`, searchParams);
  return <IndustryDetailPageClient audience={audience} industry={industry} />;
}
