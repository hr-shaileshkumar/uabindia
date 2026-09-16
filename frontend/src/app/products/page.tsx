import type { Metadata } from "next";
import { ProductsLandingPage } from "@/components/public/pages/PublicMarketingPages";
import { buildPublicMetadata } from "@/lib/public-metadata";
import { resolveAudienceForPath, type PublicSearchParams } from "@/lib/public-page-request";

export const metadata: Metadata = buildPublicMetadata({
  title: "Products",
  description:
    "Explore enterprise ERP modules for HRMS, payroll, attendance, finance, inventory, procurement, CRM, projects, assets, help desk, and reporting.",
  path: "/products",
});

export default async function ProductsPage({
  searchParams,
}: {
  searchParams?: PublicSearchParams;
}) {
  const audience = await resolveAudienceForPath("/products", searchParams);
  return <ProductsLandingPage audience={audience} />;
}
