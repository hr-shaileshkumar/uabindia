"use client";

import React, { useState } from "react";
import { Paperclip, Upload, FileText, Download, Trash2, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface RecordAttachment {
  id: string;
  fileName: string;
  fileSize: string;
  fileType: string;
  url: string;
  uploadedAt: string;
  uploadedBy?: string;
}

interface DynamicRecordAttachmentsProps {
  attachments?: RecordAttachment[];
  onUpload?: (files: File[]) => Promise<void> | void;
  onDelete?: (attachmentId: string) => Promise<void> | void;
  readOnly?: boolean;
}

export function DynamicRecordAttachments({
  attachments = [],
  onUpload,
  onDelete,
  readOnly = false,
}: DynamicRecordAttachmentsProps) {
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0 || !onUpload) return;
    try {
      setIsUploading(true);
      await onUpload(files);
      e.target.value = "";
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="rounded-xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-6">
      <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Paperclip className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <span>Documents & Attachments Hub</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Attach verified ID proofs, certificates, invoices, vouchers, and contracts.
          </p>
        </div>

        {!readOnly && onUpload && (
          <label className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer self-start sm:self-auto">
            {isUploading ? (
              <>
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>Uploading…</span>
              </>
            ) : (
              <>
                <Upload className="h-3.5 w-3.5" />
                <span>Upload Files</span>
              </>
            )}
            <input
              id="record-attachments-file-input"
              name="record_attachments_file"
              type="file"
              multiple
              className="sr-only"
              disabled={isUploading}
              onChange={(e) => void handleFileChange(e)}
            />
          </label>
        )}
      </div>

      {/* Attachments Grid */}
      {attachments.length === 0 ? (
        <div className="py-10 text-center text-xs text-slate-400 dark:text-slate-500 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
          <Paperclip className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600 mb-2 stroke-1" />
          <p className="font-medium">No files attached to this record yet.</p>
          <p className="text-[11px] text-slate-400 mt-1">Upload PDF, PNG, JPG, or DOCX documents.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {attachments.map((file) => {
            const isImage = file.fileType.startsWith("image/") || /\.(jpg|jpeg|png|webp)$/i.test(file.fileName);

            return (
              <div
                key={file.id}
                className="group relative rounded-lg border border-slate-200/80 bg-white p-3 shadow-2xs hover:shadow-xs transition-all dark:border-slate-800 dark:bg-slate-850 flex items-start gap-3"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40">
                  {isImage ? <ImageIcon className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-slate-900 dark:text-white" title={file.fileName}>
                    {file.fileName}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400">
                    <span>{file.fileSize}</span>
                    <span>&middot;</span>
                    <span>{file.uploadedAt}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 rounded text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                    title="Download / View"
                  >
                    <Download className="h-3.5 w-3.5" />
                  </a>
                  {!readOnly && onDelete && (
                    <button
                      type="button"
                      onClick={() => void onDelete(file.id)}
                      className="p-1 rounded text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                      title="Delete file"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
