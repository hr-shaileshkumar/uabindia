"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { hrApi } from "@/services/hrApi";
import ProtectedRoute from "@/components/ProtectedRoute";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { usePermissions } from "@/context/PermissionContext";
import { PERMISSIONS } from "@/constants/permissions";

type DocumentItem = {
  id: string;
  fileName: string;
  module?: string;
  category?: string;
  description?: string;
  fileSizeBytes: number;
  createdAt?: string;
};

const formatBytes = (bytes: number): string => {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const exp = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** exp;
  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[exp]}`;
};

export default function DocumentsPage() {
  const { hasPermission, loading: permissionLoading } = usePermissions();
  const [docs, setDocs] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [category, setCategory] = useState("general");
  const [moduleName, setModuleName] = useState("erp");
  const [description, setDescription] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const canUpload = hasPermission([
    PERMISSIONS.DOCUMENTS_CREATE,
    "resource:documents.create",
    "documents.upload",
    "module:erp",
  ]);

  const totalSize = useMemo(() => docs.reduce((sum, d) => sum + (d.fileSizeBytes || 0), 0), [docs]);

  const loadDocuments = useCallback(async (filters?: { module?: string; category?: string }) => {
    try {
      setLoading(true);
      setError(null);
      const res = await hrApi.documents.list(filters);
      const data = Array.isArray(res.data) ? (res.data as DocumentItem[]) : [];
      setDocs(data);
    } catch (err: any) {
      setError(err?.message || "Failed to load documents");
    } finally {
      setLoading(false);
    }
  }, []);

  const upload = async () => {
    if (!selectedFile) return;
    try {
      setUploading(true);
      setError(null);
      const form = new FormData();
      form.append("file", selectedFile);
      form.append("module", moduleName || "erp");
      form.append("category", category || "general");
      if (description.trim()) form.append("description", description.trim());

      await hrApi.documents.upload(form);
      setSelectedFile(null);
      setDescription("");
      await loadDocuments({ module: moduleName || undefined, category: category || undefined });
    } catch (err: any) {
      setError(err?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const download = async (doc: DocumentItem) => {
    const res = await hrApi.documents.download(doc.id);
    const blob = new Blob([res.data], { type: "application/octet-stream" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = doc.fileName || "document";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const remove = async (id: string) => {
    try {
      await hrApi.documents.delete(id);
      setDocs((prev) => prev.filter((d) => d.id !== id));
    } catch {
      // noop
    }
  };

  useEffect(() => {
    void loadDocuments({ module: "erp", category: "general" });
  }, [loadDocuments]);

  return (
    <ProtectedRoute
      loading={permissionLoading}
      permission={[
        PERMISSIONS.DOCUMENTS_VIEW,
        "resource:documents.view",
        "module:erp",
        "erp.view",
      ]}
    >
      <StandardPageLayout
        title="Documents"
        subtitle="Employee, project, and report artifacts in one controlled workspace."
        eyebrow="Operations / Document Control"
        icon="file"
        actions={
          <button
            type="button"
            onClick={() => {
              void loadDocuments({ module: moduleName || undefined, category: category || undefined });
            }}
            className="erp-action-btn erp-action-btn-secondary"
          >
            Refresh list
          </button>
        }
      >
        {error && <div className="erp-alert-error">{error}</div>}

        {/* KPI summary cards */}
        <div className="erp-kpi-grid mb-4">
          <div className="erp-kpi-card"><p className="erp-kpi-label">Total Documents</p><p className="erp-kpi-value">{docs.length}</p><p className="erp-kpi-meta">Uploaded files</p></div>
          <div className="erp-kpi-card erp-kpi-card-info"><p className="erp-kpi-label">Total Size</p><p className="erp-kpi-value text-sm">{formatBytes(totalSize)}</p><p className="erp-kpi-meta">Storage consumed</p></div>
          <div className="erp-kpi-card erp-kpi-card-success"><p className="erp-kpi-label">Modules</p><p className="erp-kpi-value erp-kpi-value-success">{new Set(docs.map(d => d.module).filter(Boolean)).size}</p><p className="erp-kpi-meta">Source modules</p></div>
          <div className="erp-kpi-card erp-kpi-card-warning"><p className="erp-kpi-label">Categories</p><p className="erp-kpi-value">{new Set(docs.map(d => d.category).filter(Boolean)).size}</p><p className="erp-kpi-meta">Document categories</p></div>
        </div>

        {canUpload && (
          <div className="erp-panel">
            <div className="erp-panel-header">
              <div>
                <h2 className="erp-panel-title">Upload new document</h2>
                <p className="mt-1 text-sm text-slate-500">Capture module, category, and description before pushing artifacts into the document library.</p>
              </div>
            </div>
            <div className="erp-panel-body space-y-4">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div>
                  <label className="erp-label">Module</label>
                  <input
                    type="text"
                    value={moduleName}
                    onChange={(e) => setModuleName(e.target.value)}
                    placeholder="erp / hrms / payroll"
                    className="erp-input"
                  />
                </div>
                <div>
                  <label className="erp-label">Category</label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="general"
                    className="erp-input"
                  />
                </div>
                <div>
                  <label className="erp-label">Description</label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Business context"
                    className="erp-input"
                  />
                </div>
                <div>
                  <label className="erp-label">File</label>
                  <input
                    type="file"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    className="erp-input file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:font-semibold file:text-slate-700"
                  />
                </div>
              </div>
              <div className="erp-form-actions">
                <button
                  type="button"
                  disabled={!selectedFile || uploading}
                  onClick={() => {
                    void upload();
                  }}
                  className="erp-action-btn erp-action-btn-primary disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {uploading ? "Uploading..." : "Upload"}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="erp-panel">
          <div className="erp-table-toolbar">
            <div>
              <div className="erp-table-title">Document library</div>
              <div className="erp-table-subtitle">Browse uploaded files, origin module, and audit-friendly metadata in a mobile-safe enterprise table.</div>
            </div>
            <span className="erp-toolbar-badge">{docs.length} files • {formatBytes(totalSize)}</span>
          </div>

          {loading ? (
            <div className="erp-panel-body">
              <div className="erp-loading">Loading documents...</div>
            </div>
          ) : docs.length === 0 ? (
            <div className="erp-panel-body">
              <div className="erp-empty">No documents found. Upload one to get started.</div>
            </div>
          ) : (
            <div className="erp-table-wrap rounded-none border-0 shadow-none">
              <table className="erp-table">
                <thead className="erp-thead">
                  <tr>
                    <th className="erp-th">File</th>
                    <th className="erp-th">Module</th>
                    <th className="erp-th">Category</th>
                    <th className="erp-th">Size</th>
                    <th className="erp-th">Uploaded</th>
                    <th className="erp-th text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {docs.map((doc) => (
                    <tr key={doc.id} className="erp-tr">
                      <td className="erp-td">
                        <div className="erp-row-title">{doc.fileName}</div>
                        {doc.description && <div className="erp-row-meta">{doc.description}</div>}
                      </td>
                      <td className="erp-td text-slate-700">{doc.module || "general"}</td>
                      <td className="erp-td text-slate-700">{doc.category || "general"}</td>
                      <td className="erp-td text-slate-700">{formatBytes(doc.fileSizeBytes || 0)}</td>
                      <td className="erp-td text-slate-700">{doc.createdAt ? new Date(doc.createdAt).toLocaleString() : "—"}</td>
                      <td className="erp-td text-right">
                        <div className="flex flex-wrap justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              void download(doc);
                            }}
                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            Download
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              void remove(doc.id);
                            }}
                            className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </StandardPageLayout>
    </ProtectedRoute>
  );
}
