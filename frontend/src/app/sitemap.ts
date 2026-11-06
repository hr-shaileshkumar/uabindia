import type { MetadataRoute } from "next";
import { publicSiteUrl } from "@/lib/public-marketing";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = [
    "",
    "/about",
    "/contact",
    "/pricing",
    "/help-support",
    "/privacy",
    "/terms",
  ];

  return staticRoutes.map((path) => ({
    url: `${publicSiteUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1 : 0.8,
  }));
}
