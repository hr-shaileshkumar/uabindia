import type { MetadataRoute } from "next";
import {
  marketingIndustries,
  marketingModules,
  publicSiteUrl,
} from "@/lib/public-marketing";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = [
    "",
    "/about",
    "/book-demo",
    "/careers",
    "/contact",
    "/help-support",
    "/industries",
    "/pricing",
    "/privacy",
    "/products",
    "/resources",
    "/terms",
  ];

  return [
    ...staticRoutes.map((path) => ({
      url: `${publicSiteUrl}${path}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: path === "" ? 1 : 0.8,
    })),
    ...marketingModules.map((module) => ({
      url: `${publicSiteUrl}/products/${module.slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...marketingIndustries.map((industry) => ({
      url: `${publicSiteUrl}/industries/${industry.slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
