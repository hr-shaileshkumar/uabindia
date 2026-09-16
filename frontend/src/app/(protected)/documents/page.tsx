"use client";

import { DynamicPage } from "@/components/dynamic/DynamicPage";

import { useCallback, useMemo, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Download, Upload } from "lucide-react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { CrudCard, CrudHeaderStats } from "@/components/workspace/crud-workspace";
import {
  ErpCreateButton,
  ErpDrawerFooter,
  ErpRefreshButton,
  ErpRowActions,
  ErpSearchFilter,
} from "@/components/workspace/page-kit";
import { SideDrawer } from "@/components/ui/side-drawer";
import { UniversalDeleteDialog } from "@/components/workspace/templates/UniversalDeleteDialog";
import { useErpListView } from "@/components/workspace/list-view";
import { appApi } from "@/services/modules";
import { getApiErrorMessage } from "@/lib/api-errors";
import { notifyError, notifySuccess } from "@/lib/notifications";
import { mapDocumentRecord, useDocuments, documentsQueryKey } from "@/features/administration/hooks/useDocuments";

function LegacyDocumentVaultPage() {
  const queryClient = useQueryClient();
  const { data = [], isLoading, isError, error, refetch } = useDocuments();
  const [search, setSearch] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [module, setModule] = useState("general");
  const [category, setCategory] = useState("general");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const docs = useMemo(() => data.map(mapDocumentRecord), [data]);
  const filteredDocs = useMemo(() => {
    const q = search.toLowerCase();
    return docs.filter(
      (d) => !q || d.title.toLowerCase().includes(q) || d.category.toLowerCase().includes(q) || d.module.toLowerCase().includes(q)
    );
  }, [docs, search]);

  const upload = useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData();
      form.append("file", file);
      form.append("module", module || "general");
      form.append("category", category || "general");
      if (description) form.append("description", description);
      if (tags) form.append("tags", tags);
      await appApi.documents.upload(form);
    },
    onSuccess: async () => {
      notifySuccess("Document uploaded.");
      setDrawerOpen(false);
      setDescription("");
      setTags("");
      if (fileRef.current) fileRef.current.value = "";
      await queryClient.invalidateQueries({ queryKey: documentsQueryKey() });
    },
    onError: (err) => notifyError(getApiErrorMessage(err, "Upload failed.")),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => appApi.documents.delete(id),
    onSuccess: async () => {
      notifySuccess("Document deleted.");
      setDeleteId(null);
      await queryClient.invalidateQueries({ queryKey: documentsQueryKey() });
    },
    onError: (err) => notifyError(getApiErrorMessage(err, "Delete failed.")),
  });

  const download = useCallback(async (id: string, fileName: string) => {
    try {
      const res = await appApi.documents.download(id);
      const blob = new Blob([res.data]);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Download failed."));
    }
  }, []);

  const list = useErpListView({
    listKey: "documents-vault",
    rows: filteredDocs,
    columns: [
      { key: "title", label: "File name", dataType: "string" },
      { key: "category", label: "Category", dataType: "string" },
      { key: "module", label: "Module", dataType: "string" },
      { key: "updatedAt", label: "Uploaded", dataType: "string" },
      { key: "actions", label: "Actions", locked: true },
    ],
    getRowId: (row) => row.id,
    loading: isLoading,
    emptyMessage: "No documents uploaded yet.",
    emptyAction: <ErpCreateButton label="Upload" onClick={() => setDrawerOpen(true)} />,
    onCreate: () => setDrawerOpen(true),
    createLabel: "Upload",
    onRefresh: () => void refetch(),
    renderRow: (row) => (
      <>
        <td className="erp-td text-xs font-semibold">{row.title}</td>
        <td className="erp-td text-xs">{row.category}</td>
        <td className="erp-td text-xs">{row.module}</td>
        <td className="erp-td text-xs text-slate-500">{row.updatedAt}</td>
        <td className="erp-td">
          <ErpRowActions
            onView={{
              label: "Download",
              onClick: () => void download(row.id, row.title),
            }}
            onDelete={{
              label: "Delete",
              onClick: () => setDeleteId(row.id),
            }}
            extra={
              <button
                type="button"
                title="Download"
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100"
                onClick={() => void download(row.id, row.title)}
              >
                <Download className="h-4 w-4" />
              </button>
            }
          />
        </td>
      </>
    ),
  });

  const stats = [
    { label: "Documents", value: docs.length, tone: "info" as const },
    { label: "Categories", value: new Set(docs.map((d) => d.category)).size, tone: "positive" as const },
    { label: "Visible", value: filteredDocs.length, tone: "neutral" as const },
  ];

  return (
    <StandardPageLayout
      title="Documents"
      subtitle="Centralized file store for employee records, contracts, policies, and shared company files."
      eyebrow="Operations / Documents"
      icon="file"
      meta={<CrudHeaderStats items={stats} />}
      actions={
        <>
          <ErpRefreshButton onClick={() => void refetch()} loading={isLoading} />
          {list.headerTools}
          <ErpCreateButton label="Upload" onClick={() => setDrawerOpen(true)} />
        </>
      }
      filters={
        <>
          <ErpSearchFilter value={search} onChange={setSearch} placeholder="Filter title, category, or module…" />
          {list.filterBar}
        </>
      }
    >
      {isError ? (
        <div className="erp-alert-error">{getApiErrorMessage(error, "Failed to load documents.")}</div>
      ) : null}

      <CrudCard>{list.table}</CrudCard>

      <SideDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Upload document"
        footer={
          <ErpDrawerFooter
            onCancel={() => setDrawerOpen(false)}
            onSave={() => {
              const file = fileRef.current?.files?.[0];
              if (!file) {
                notifyError("Choose a file to upload.");
                return;
              }
              upload.mutate(file);
            }}
            saving={upload.isPending}
            saveLabel="Upload"
          />
        }
      >
        <div className="erp-form-grid">
          <div className="erp-field md:col-span-2">
            <label className="erp-label">File</label>
            <input ref={fileRef} type="file" className="erp-input" />
          </div>
          <div className="erp-field">
            <label className="erp-label">Module</label>
            <input className="erp-input" value={module} onChange={(e) => setModule(e.target.value)} />
          </div>
          <div className="erp-field">
            <label className="erp-label">Category</label>
            <input className="erp-input" value={category} onChange={(e) => setCategory(e.target.value)} />
          </div>
          <div className="erp-field md:col-span-2">
            <label className="erp-label">Description</label>
            <textarea className="erp-input min-h-20" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="erp-field md:col-span-2">
            <label className="erp-label">Tags</label>
            <input className="erp-input" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="policy, hr, …" />
          </div>
          <p className="md:col-span-2 flex items-center gap-2 text-xs text-slate-500">
            <Upload className="h-3.5 w-3.5" /> Max 10 MB per file.
          </p>
        </div>
      </SideDrawer>

      <UniversalDeleteDialog
        open={Boolean(deleteId)}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete document"
        description="This removes the document from the vault. Storage cleanup follows tenant policy."
        onConfirm={() => {
          if (deleteId) remove.mutate(deleteId);
        }}
        loading={remove.isPending}
      />
    </StandardPageLayout>
  );
}

export default function DocumentVaultPage() {
  return (
    <DynamicPage
      pageKey="documents.vault"
      fallback={<LegacyDocumentVaultPage />}
      renderMode="auto"
    />
  );
}
