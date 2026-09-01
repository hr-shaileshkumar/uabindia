"use client";

import React, { useMemo, useState } from "react";
import { PlatformGlobalPageShell } from "@/components/platform/PlatformGlobalPageShell";
import { ErpDrawerFooter, ErpRowActions } from "@/components/workspace/page-kit";
import { getApiErrorMessage } from "@/lib/api-errors";
import { notifyError, notifySuccess } from "@/lib/notifications";
import { mapWebsitePage, useWebsitePageMutations, useWebsitePages } from "@/features/platform/hooks/useWebsitePages";

type PageRow = ReturnType<typeof mapWebsitePage>;

export default function WebsiteCMSPagesPage() {
  const { data = [], isLoading, isError, error, refetch } = useWebsitePages();
  const { updatePage, publishPage, unpublishPage } = useWebsitePageMutations();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [editing, setEditing] = useState<PageRow | null>(null);
  const [title, setTitle] = useState("");
  const [contentJson, setContentJson] = useState("{}");

  const pages = useMemo(() => data.map(mapWebsitePage), [data]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return pages.filter((p) => {
      const matchesSearch = !q || p.title.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q);
      const matchesStatus = statusFilter === "all" || p.status.toLowerCase() === statusFilter.toLowerCase();
      return matchesSearch && matchesStatus;
    });
  }, [pages, search, statusFilter]);

  const openEdit = (page: PageRow) => {
    setEditing(page);
    setTitle(page.title);
    setContentJson(page.contentJson || "{}");
  };

  const save = async () => {
    if (!editing) return;
    try {
      JSON.parse(contentJson || "{}");
    } catch {
      notifyError("Content JSON is invalid.");
      return;
    }
    try {
      await updatePage.mutateAsync({
        pageType: editing.pageType,
        payload: {
          title: title.trim() || editing.title,
          contentJson: contentJson.trim() || "{}",
          tenantId: editing.tenantId,
        },
      });
      notifySuccess("Page updated.");
      setEditing(null);
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to update page."));
    }
  };

  const togglePublish = async (page: PageRow) => {
    try {
      if (page.isPublished) {
        await unpublishPage.mutateAsync({ pageType: page.pageType, tenantId: page.tenantId });
        notifySuccess("Page unpublished.");
      } else {
        await publishPage.mutateAsync({ pageType: page.pageType, tenantId: page.tenantId });
        notifySuccess("Page published.");
      }
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to change publish state."));
    }
  };

  return (
    <PlatformGlobalPageShell
      title="Website pages"
      categoryTag="Platform"
      icon="globe"
      kpiMetrics={[
        { label: "Pages", value: pages.length, tone: "info" },
        { label: "Published", value: pages.filter((p) => p.isPublished).length, tone: "positive" },
        { label: "Draft", value: pages.filter((p) => !p.isPublished).length, tone: "warning" },
      ]}
      searchValue={search}
      onSearchChange={setSearch}
      searchPlaceholder="Filter title or slug…"
      filterOptions={[
        {
          key: "status",
          label: "Status",
          value: statusFilter,
          onChange: setStatusFilter,
          options: [
            { label: "All", value: "all" },
            { label: "Published", value: "published" },
            { label: "Draft", value: "draft" },
          ],
        },
      ]}
      onRefresh={() => void refetch()}
      isLoading={isLoading}
      listKey="platform-website-pages"
      listRows={filtered}
      getRowId={(row) => row.id}
      emptyMessage="No website pages found."
      listColumns={[
        { key: "title", label: "Title", dataType: "string" },
        { key: "slug", label: "Slug", dataType: "string" },
        { key: "template", label: "Page type", dataType: "string" },
        { key: "status", label: "Status", dataType: "string" },
        { key: "tenantName", label: "Tenant", dataType: "string" },
        { key: "actions", label: "Actions", locked: true },
      ]}
      renderListRow={(p) => (
        <>
          <td className="erp-td font-semibold text-xs">{p.title}</td>
          <td className="erp-td font-mono text-xs">{p.slug}</td>
          <td className="erp-td text-xs">{p.template}</td>
          <td className="erp-td">
            <span className={p.isPublished ? "erp-chip erp-chip-success" : "erp-chip erp-chip-warning"}>{p.status}</span>
          </td>
          <td className="erp-td text-xs text-slate-500">{p.tenantName ?? "—"}</td>
          <td className="erp-td">
            <ErpRowActions
              onEdit={{ label: "Edit", onClick: () => openEdit(p) }}
              extra={
                <button
                  type="button"
                  className="rounded-md px-2 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-100"
                  onClick={() => void togglePublish(p)}
                >
                  {p.isPublished ? "Unpublish" : "Publish"}
                </button>
              }
            />
          </td>
        </>
      )}
      isInspectorOpen={Boolean(editing)}
      onInspectorClose={() => setEditing(null)}
      inspectorTitle={editing ? `Edit ${editing.pageType}` : "Edit page"}
      inspectorContent={
        <div className="erp-form-grid">
          {isError ? (
            <p className="md:col-span-2 text-xs text-rose-600">{getApiErrorMessage(error, "Failed to load pages.")}</p>
          ) : null}
          <div className="erp-field md:col-span-2">
            <label className="erp-label">Title *</label>
            <input className="erp-input" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="erp-field md:col-span-2">
            <label className="erp-label">Content JSON</label>
            <textarea className="erp-input min-h-40 font-mono text-xs" value={contentJson} onChange={(e) => setContentJson(e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <ErpDrawerFooter onCancel={() => setEditing(null)} onSave={() => void save()} saving={updatePage.isPending} isEdit />
          </div>
        </div>
      }
    />
  );
}
