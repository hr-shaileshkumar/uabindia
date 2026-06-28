import type { Metadata } from "next";
import { publicSiteUrl } from "@/lib/public-marketing";

const SITE_NAME = "UabIndia ERP";

type MetadataOptions = {
  title: string;
  description: string;
  path?: string;
};

export function buildPublicMetadata({
  title,
  description,
  path = "/",
}: MetadataOptions): Metadata {
  const canonical = `${publicSiteUrl}${path === "/" ? "" : path}`;

  return {
    title,
    description,
    applicationName: SITE_NAME,
    metadataBase: new URL(publicSiteUrl),
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description,
      siteName: SITE_NAME,
      type: "website",
      url: canonical,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}
