"use client";

import { useEffect, useMemo, useState } from "react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Edit, Eye, EyeOff, RefreshCw } from "lucide-react";
import { notifyError, notifySuccess } from "@/lib/notifications";
import { usePermissions } from "@/context/PermissionContext";
import { WEBSITE_PAGE_DEFINITIONS } from "@/lib/website-page-config";
import WebsitePageEditor from "@/components/admin/website/WebsitePageEditor";
import { platformApi, type WebsitePagesResponse, type WebsitePageSummary, type WebsitePageTenantGroup } from "@/services/modules/platform";

type WebsitePageGroup = {
  tenant: string;
  pages: WebsitePageSummary[];
};

export default function WebsitePagesPage() {
  const { isSuperAdmin } = usePermissions();
  const [pages, setPages] = useState<WebsitePageSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editingPage, setEditingPage] = useState<WebsitePageSummary | null>(null);

  const loadPages = async (mode: "initial" | "refresh" = "refresh") => {
    if (mode === "initial") {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    try {
      const response = await platformApi.website.listPages();
      const pageList = normalizeWebsitePages(response.data);
      setPages(pageList);
    } catch {
      notifyError("Failed to load website pages.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadPages("initial");
  }, []);

  const groupedPages = useMemo<WebsitePageGroup[]>(() => {
    if (!isSuperAdmin) {
      return [{ tenant: "Current Tenant", pages }];
    }

    const grouped = pages.reduce<Map<string, WebsitePageSummary[]>>((acc, page) => {
      const key = page.tenantName || "Unknown Tenant";
      const existing = acc.get(key) ?? [];
      existing.push(page);
      acc.set(key, existing);
      return acc;
    }, new Map());

    return Array.from(grouped.entries()).map(([tenant, tenantPages]) => ({
      tenant,
      pages: tenantPages,
    }));
  }, [isSuperAdmin, pages]);

  const handlePublish = async (page: WebsitePageSummary, publish: boolean) => {
    try {
      if (publish) {
        await platformApi.website.publishPage(page.pageType, isSuperAdmin ? page.tenantId : undefined);
      } else {
        await platformApi.website.unpublishPage(page.pageType, isSuperAdmin ? page.tenantId : undefined);
      }

      notifySuccess(`Page ${publish ? "published" : "unpublished"}.`);
      await loadPages();
    } catch {
      notifyError(`Failed to ${publish ? "publish" : "unpublish"} page.`);
    }
  };

  const handleSavePage = async (page: WebsitePageSummary, title: string, contentJson: string) => {
    try {
      await platformApi.website.updatePage(page.pageType, {
        title,
        contentJson,
        ...(isSuperAdmin && page.tenantId ? { tenantId: page.tenantId } : {}),
      });

      notifySuccess("Page saved successfully.");
      setEditingPage(null);
      await loadPages();
    } catch {
      notifyError("Failed to save page.");
    }
  };

  if (loading) {
    return (
      <StandardPageLayout title="Website Pages" subtitle="Manage public pages stored in the tenant database.">
        <div className="flex h-64 items-center justify-center text-sm text-slate-500">Loading website pages...</div>
      </StandardPageLayout>
    );
  }

  return (
    <StandardPageLayout
      title="Website Pages"
      subtitle="Edit tenant-facing public content, publish it intentionally, and keep support and access pages aligned with the database."
      actions={
        <Button variant="outline" onClick={() => void loadPages()} disabled={refreshing}>
          <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      }
    >
      {groupedPages.map(({ tenant, pages: tenantPages }) => (
        <section key={tenant} className="space-y-4">
          {isSuperAdmin ? <h2 className="text-lg font-semibold text-slate-900">{tenant}</h2> : null}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {WEBSITE_PAGE_DEFINITIONS.map((definition) => {
              const page = tenantPages.find((item) => item.pageType === definition.key) ?? {
                id: `${tenant}-${definition.key}`,
                pageType: definition.key,
                title: "",
                contentJson: "{}",
                isPublished: false,
                tenantName: tenant,
              };

              return (
                <Card key={`${tenant}-${definition.key}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <CardTitle>{definition.label}</CardTitle>
                        <CardDescription className="mt-2">{definition.description}</CardDescription>
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          page.isPublished ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {page.isPublished ? "Published" : "Draft"}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="font-medium text-slate-900">{page.title || "No title set"}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {page.contentJson !== "{}" ? "Content configured and ready for preview." : "No saved content yet. Use the template to seed this page."}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" onClick={() => setEditingPage(page)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => void handlePublish(page, !page.isPublished)}>
                        {page.isPublished ? (
                          <>
                            <EyeOff className="mr-2 h-4 w-4" />
                            Unpublish
                          </>
                        ) : (
                          <>
                            <Eye className="mr-2 h-4 w-4" />
                            Publish
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      ))}

      {editingPage ? (
        <WebsitePageEditor
          pageType={editingPage.pageType}
          initialTitle={editingPage.title || ""}
          initialContent={editingPage.contentJson || "{}"}
          onSave={(title, content) => handleSavePage(editingPage, title, content)}
          onClose={() => setEditingPage(null)}
        />
      ) : null}
    </StandardPageLayout>
  );
}

function normalizeWebsitePages(data: WebsitePagesResponse): WebsitePageSummary[] {
  if (Array.isArray(data)) {
    return data;
  }

  const tenants = Array.isArray(data.tenants) ? data.tenants : [];
  return tenants.flatMap((tenantGroup: WebsitePageTenantGroup) =>
    tenantGroup.pages.map((page) => ({ ...page, tenantName: tenantGroup.tenant }))
  );
}
