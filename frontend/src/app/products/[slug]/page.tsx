import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductDetailPageClient } from "@/components/public/pages/PlatformMarketingPages";
import { getMarketingModule } from "@/lib/public-marketing";
import { buildPublicMetadata } from "@/lib/public-metadata";
import { resolveAudienceForPath, type PublicSearchParams } from "@/lib/public-page-request";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const productModule = getMarketingModule(slug);

  if (!productModule) {
    return buildPublicMetadata({
      title: "Product",
      description: "UabIndia ERP product detail page.",
      path: "/products",
    });
  }

  return buildPublicMetadata({
    title: `${productModule.title}`,
    description: productModule.summary,
    path: `/products/${productModule.slug}`,
  });
}

export default async function ProductDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams?: PublicSearchParams;
}) {
  const { slug } = await params;
  const productModule = getMarketingModule(slug);

  if (!productModule) {
    notFound();
  }

  const audience = await resolveAudienceForPath(`/products/${slug}`, searchParams);
  return <ProductDetailPageClient audience={audience} module={productModule} />;
}
