import { useQuery } from "@tanstack/react-query";
import { platformApi, type WebsitePageSummary, type WebsitePagesResponse } from "@/services/modules/platform";

export const websitePagesQueryKey = ["platform", "website-pages"] as const;

const flattenWebsitePages = (payload: WebsitePagesResponse): WebsitePageSummary[] => {
  if (Array.isArray(payload)) {
    return payload;
  }
  if (payload.tenants) {
    return payload.tenants.flatMap((group) => group.pages);
  }
  return [];
};

export const useWebsitePages = () =>
  useQuery({
    queryKey: websitePagesQueryKey,
    queryFn: async () => {
      const { data } = await platformApi.website.listPages();
      return flattenWebsitePages(data);
    },
    staleTime: 30_000,
  });

export const mapWebsitePage = (page: WebsitePageSummary) => ({
  id: page.id,
  slug: `/${page.pageType}`,
  title: page.title,
  template: page.pageType,
  status: page.isPublished ? ("Published" as const) : ("Draft" as const),
  seoScore: page.isPublished ? 90 : 70,
  updatedAt: new Date().toLocaleDateString("en-IN"),
  tenantName: page.tenantName,
});
