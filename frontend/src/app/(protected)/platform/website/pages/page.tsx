"use client";

import { useEffect, useMemo, useState } from "react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import ErpHeaderSummary from "@/components/layout/ErpHeaderSummary";
import WebsitePageEditor from "@/components/admin/website/WebsitePageEditor";
import { platformApi, type WebsitePageSummary, type WebsitePageTenantGroup } from "@/services/modules/platform";
import { getWebsitePageDefinition } from "@/lib/website-page-config";
import { notifyError, notifySuccess } from "@/lib/notifications";
import { getApiErrorMessage } from "@/lib/api-errors";

type FlatWebsitePage = WebsitePageSummary & { tenantLabel?: string };

const flattenPages = (payload: unknown): FlatWebsitePage[] => {
  if (Array.isArray(payload)) {
    return payload as FlatWebsitePage[];
  }

  if (!payload || typeof payload !== "object") {
    return [];
  }

  const grouped = (payload as { tenants?: WebsitePageTenantGroup[] }).tenants || [];
  return grouped.flatMap((group) =>
    group.pages.map((page) => ({
      ...page,
      tenantLabel: group.tenant,
    }))
  );
};

export default function WebsitePagesPage() {
  const [pages, setPages] = useState<FlatWebsitePage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPage, setSelectedPage] = useState<FlatWebsitePage | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const loadPages = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await platformApi.website.listPages();
      setPages(flattenPages(response.data));
    } catch (err) {
      const message = getApiErrorMessage(err, "Failed to load website pages.");
      setError(message);
      notifyError(message, "Website Pages");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPages();
  }, []);

  const pageStats = useMemo(() => {
    const published = pages.filter((page) => page.isPublished).length;
    const draft = pages.length - published;
    return { total: pages.length, published, draft };
  }, [pages]);

  const handleSave = async (title: string, contentJson: string) => {
    if (!selectedPage) return;
    try {
      setBusyKey(selectedPage.pageType);
      await platformApi.website.updatePage(selectedPage.pageType, {
        title,
        contentJson,
        tenantId: selectedPage.tenantId,
      });
      notifySuccess(`Saved ${selectedPage.pageType}`);
      setSelectedPage(null);
      await loadPages();
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to save page."), "Website Pages");
    } finally {
      setBusyKey(null);
    }
  };

  const handlePublish = async (page: FlatWebsitePage) => {
    try {
      setBusyKey(page.pageType);
      await platformApi.website.publishPage(page.pageType, page.tenantId);
      notifySuccess(`Published ${page.pageType}`);
      await loadPages();
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to publish page."), "Website Pages");
    } finally {
      setBusyKey(null);
    }
  };

  const handleUnpublish = async (page: FlatWebsitePage) => {
    try {
      setBusyKey(page.pageType);
      await platformApi.website.unpublishPage(page.pageType, page.tenantId);
      notifySuccess(`Unpublished ${page.pageType}`);
      await loadPages();
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to unpublish page."), "Website Pages");
    } finally {
      setBusyKey(null);
    }
  };

  return (
    <StandardPageLayout
      title="Website Pages"
      subtitle="Manage the backend-driven public website pages, edit structured content, and control publish state from one workspace."
      eyebrow="Platform / Website"
      icon="file-text"
      meta={
        <ErpHeaderSummary
          items={[
            { label: "Pages", value: pageStats.total },
            { label: "Published", value: pageStats.published, tone: "success" },
            { label: "Drafts", value: pageStats.draft, tone: "warning" },
            { label: "Definitions", value: pages.filter((page) => getWebsitePageDefinition(page.pageType)).length, tone: "info" },
          ]}
        />
      }
      actions={
        <button type="button" onClick={() => void loadPages()} className="erp-action-btn erp-action-btn-secondary">
          Refresh
        </button>
      }
    >
      {error ? <div className="erp-alert-error">{error}</div> : null}

      <div className="erp-panel">
        <div className="erp-panel-header">
          <div>
            <h2 className="erp-panel-title">Page Directory</h2>
            <p className="mt-1 text-sm text-slate-500">Edit, publish, or unpublish managed website pages from one directory.</p>
          </div>
        </div>
        <div className="erp-panel-body">
          {loading ? (
            <div className="erp-empty">Loading website pages...</div>
          ) : pages.length === 0 ? (
            <div className="erp-empty">No website pages found.</div>
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">
              {pages.map((page) => {
                const definition = getWebsitePageDefinition(page.pageType);
                return (
                  <div key={`${page.tenantId ?? page.tenantLabel ?? "tenant"}-${page.pageType}`} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">{definition?.label ?? page.pageType}</p>
                        <h3 className="mt-1 text-lg font-semibold text-slate-900">{page.title}</h3>
                        <p className="mt-1 text-sm text-slate-500">{definition?.description ?? "Custom managed website page."}</p>
                      </div>
                      <span className={page.isPublished ? "erp-chip erp-chip-success" : "erp-chip erp-chip-warning"}>
                        {page.isPublished ? "Published" : "Draft"}
                      </span>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedPage(page)}
                        className="erp-action-btn erp-action-btn-primary"
                        disabled={busyKey === page.pageType}
                      >
                        Edit
                      </button>
                      {page.isPublished ? (
                        <button
                          type="button"
                          onClick={() => void handleUnpublish(page)}
                          className="erp-action-btn erp-action-btn-secondary"
                          disabled={busyKey === page.pageType}
                        >
                          Unpublish
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => void handlePublish(page)}
                          className="erp-action-btn erp-action-btn-secondary"
                          disabled={busyKey === page.pageType}
                        >
                          Publish
                        </button>
                      )}
                    </div>
                    <div className="mt-4 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
                      <div className="flex flex-wrap gap-x-6 gap-y-1">
                        <span><span className="font-semibold text-slate-900">Page:</span> {page.pageType}</span>
                        {page.tenantLabel ? <span><span className="font-semibold text-slate-900">Tenant:</span> {page.tenantLabel}</span> : null}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {selectedPage ? (
        <WebsitePageEditor
          pageType={selectedPage.pageType}
          initialTitle={selectedPage.title}
          initialContent={selectedPage.contentJson || "{}"}
          onSave={handleSave}
          onClose={() => setSelectedPage(null)}
        />
      ) : null}
    </StandardPageLayout>
  );
}
