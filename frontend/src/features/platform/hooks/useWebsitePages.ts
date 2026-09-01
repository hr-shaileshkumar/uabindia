import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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

export const useWebsitePageMutations = () => {
  const queryClient = useQueryClient();

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: websitePagesQueryKey });
  };

  const updatePage = useMutation({
    mutationFn: ({
      pageType,
      payload,
    }: {
      pageType: string;
      payload: { title: string; contentJson: string; tenantId?: string };
    }) => platformApi.website.updatePage(pageType, payload),
    onSuccess: invalidate,
  });

  const publishPage = useMutation({
    mutationFn: ({ pageType, tenantId }: { pageType: string; tenantId?: string }) =>
      platformApi.website.publishPage(pageType, tenantId),
    onSuccess: invalidate,
  });

  const unpublishPage = useMutation({
    mutationFn: ({ pageType, tenantId }: { pageType: string; tenantId?: string }) =>
      platformApi.website.unpublishPage(pageType, tenantId),
    onSuccess: invalidate,
  });

  return { updatePage, publishPage, unpublishPage };
};

export const mapWebsitePage = (page: WebsitePageSummary) => ({
  id: page.id,
  slug: `/${page.pageType}`,
  title: page.title,
  template: page.pageType,
  pageType: page.pageType,
  contentJson: page.contentJson ?? "{}",
  status: page.isPublished ? ("Published" as const) : ("Draft" as const),
  isPublished: page.isPublished,
  seoScore: page.isPublished ? 90 : 70,
  updatedAt: new Date().toLocaleDateString("en-IN"),
  tenantId: page.tenantId,
  tenantName: page.tenantName,
});
