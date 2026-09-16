"use client";

import React, { useState, useRef } from "react";
import {
  Upload,
  Download,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  X,
  RefreshCw,
  FileText,
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import apiClient from "@/services/apiClient";
import { notifySuccess, notifyError } from "@/lib/notifications";
import { getApiErrorMessage } from "@/lib/api-errors";
import { cn } from "@/lib/utils";

export interface ImportFieldDefinition {
  key: string;
  label: string;
  required?: boolean;
  example?: string;
}

interface UniversalBulkImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityName: string;
  apiEndpoint: string;
  fields: ImportFieldDefinition[];
  onImportComplete?: () => void;
}

interface ParsedRow {
  rowNumber: number;
  data: Record<string, string>;
  errors: string[];
  isValid: boolean;
}

export function UniversalBulkImportModal({
  open,
  onOpenChange,
  entityName,
  apiEndpoint,
  fields,
  onImportComplete,
}: UniversalBulkImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [activeTab, setActiveTab] = useState<"upload" | "preview">("upload");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Generate and download a sample CSV template with instructions
  const handleDownloadTemplate = () => {
    const headers = fields.map((f) => `"${f.label}"`).join(",");
    const exampleRow = fields
      .map((f) => `"${f.example || (f.required ? "Required Value" : "Optional")}"`)
      .join(",");
    const csvContent = "data:text/csv;charset=utf-8," + [headers, exampleRow].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${entityName.toLowerCase().replace(/\s+/g, "_")}_import_template.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Parse CSV File and Validate
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith(".csv") && !selectedFile.name.endsWith(".txt")) {
      notifyError("Please select a valid .csv file.");
      return;
    }

    setFile(selectedFile);
    setIsParsing(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (!text) {
          notifyError("File is empty.");
          setIsParsing(false);
          return;
        }

        const lines = text
          .split(/\r\n|\n/)
          .map((l) => l.trim())
          .filter((l) => l.length > 0);

        if (lines.length < 2) {
          notifyError("CSV must contain a header row and at least one data row.");
          setIsParsing(false);
          return;
        }

        // Header mapping
        const rawHeaders = lines[0].split(",").map((h) => h.replace(/^["']|["']$/g, "").trim());
        const headerMap: Record<number, ImportFieldDefinition> = {};

        rawHeaders.forEach((rawH, idx) => {
          const matched = fields.find(
            (f) =>
              f.label.toLowerCase() === rawH.toLowerCase() ||
              f.key.toLowerCase() === rawH.toLowerCase()
          );
          if (matched) {
            headerMap[idx] = matched;
          }
        });

        const rows: ParsedRow[] = [];

        for (let i = 1; i < lines.length; i++) {
          const rawValues = lines[i].split(",").map((v) => v.replace(/^["']|["']$/g, "").trim());
          const rowData: Record<string, string> = {};
          const rowErrors: string[] = [];

          rawValues.forEach((val, colIdx) => {
            const field = headerMap[colIdx];
            if (field) {
              rowData[field.key] = val;
            }
          });

          // Validate required fields
          fields.forEach((f) => {
            if (f.required && (!rowData[f.key] || rowData[f.key].trim() === "")) {
              rowErrors.push(`Missing required field: ${f.label}`);
            }
          });

          rows.push({
            rowNumber: i + 1,
            data: rowData,
            errors: rowErrors,
            isValid: rowErrors.length === 0,
          });
        }

        setParsedRows(rows);
        setActiveTab("preview");
      } catch {
        notifyError("Failed to parse CSV file. Please check the file formatting.");
      } finally {
        setIsParsing(false);
      }
    };

    reader.readAsText(selectedFile);
  };

  const validRowCount = parsedRows.filter((r) => r.isValid).length;
  const invalidRowCount = parsedRows.length - validRowCount;

  // Execute Import
  const handleExecuteImport = async () => {
    const validData = parsedRows.filter((r) => r.isValid).map((r) => r.data);
    if (validData.length === 0) {
      notifyError("No valid rows available to import.");
      return;
    }

    try {
      setIsImporting(true);
      // Attempt batch upload or individual record dispatch
      try {
        await apiClient.post(`${apiEndpoint}/bulk`, { records: validData });
      } catch {
        // Fallback: post records individually if no explicit /bulk endpoint
        for (const item of validData) {
          await apiClient.post(apiEndpoint, item);
        }
      }

      notifySuccess(`Successfully imported ${validData.length} ${entityName} record(s).`);
      onOpenChange(false);
      onImportComplete?.();
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Import failed. Some records could not be saved."));
    } finally {
      setIsImporting(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setParsedRows([]);
    setActiveTab("upload");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl overflow-hidden rounded-2xl border border-slate-200 bg-white p-0 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Bulk Import {entityName}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Upload CSV file with multiple records to import in bulk.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6">
          {activeTab === "upload" ? (
            <div className="space-y-6">
              {/* Step 1: Download Template */}
              <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4 dark:border-blue-900/40 dark:bg-blue-950/30">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h4 className="text-xs font-bold text-blue-900 dark:text-blue-200">
                      Step 1: Download Template
                    </h4>
                    <p className="mt-1 text-xs text-blue-700 dark:text-blue-300">
                      Download the official template pre-configured with all standard {entityName} fields.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleDownloadTemplate}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-xs font-semibold text-blue-700 shadow-2xs hover:bg-blue-50 dark:border-blue-800 dark:bg-slate-900 dark:text-blue-300"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download CSV Template
                  </button>
                </div>
              </div>

              {/* Step 2: Upload File Dropzone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="group relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/50 p-8 text-center transition-all hover:border-indigo-500 hover:bg-indigo-50/20 dark:border-slate-700 dark:bg-slate-800/30"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.txt"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-md transition-transform group-hover:scale-105 dark:bg-slate-800">
                  <Upload className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h3 className="mt-3 text-sm font-bold text-slate-800 dark:text-slate-200">
                  Click to select or drag and drop your completed CSV file
                </h3>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Supported formats: Standard comma-separated .CSV (up to 5,000 rows)
                </p>
              </div>

              {/* Field Reference preview */}
              <div>
                <h5 className="mb-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Configured Fields ({fields.length}):
                </h5>
                <div className="flex flex-wrap gap-1.5">
                  {fields.map((f) => (
                    <span
                      key={f.key}
                      className={cn(
                        "inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium border",
                        f.required
                          ? "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800"
                          : "bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
                      )}
                    >
                      {f.label} {f.required && "*"}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Step 3: Verification & Error Preview */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {validRowCount} Ready to Import
                  </span>
                  {invalidRowCount > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-lg bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300">
                      <AlertCircle className="h-3.5 w-3.5" />
                      {invalidRowCount} Row(s) with Errors
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-xs font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
                >
                  Choose Different File
                </button>
              </div>

              {/* Table Preview */}
              <div className="max-h-72 overflow-y-auto rounded-xl border border-slate-200 shadow-2xs dark:border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    <tr>
                      <th className="px-3 py-2">Row</th>
                      <th className="px-3 py-2">Status</th>
                      {fields.slice(0, 4).map((f) => (
                        <th key={f.key} className="px-3 py-2">
                          {f.label}
                        </th>
                      ))}
                      <th className="px-3 py-2">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {parsedRows.map((row) => (
                      <tr
                        key={row.rowNumber}
                        className={row.isValid ? "bg-white dark:bg-slate-900" : "bg-rose-50/50 dark:bg-rose-950/20"}
                      >
                        <td className="px-3 py-2 font-mono text-slate-500">{row.rowNumber}</td>
                        <td className="px-3 py-2">
                          {row.isValid ? (
                            <span className="text-emerald-600 font-semibold flex items-center gap-1">
                              <CheckCircle2 className="h-3.5 w-3.5" /> Valid
                            </span>
                          ) : (
                            <span className="text-rose-600 font-semibold flex items-center gap-1">
                              <AlertCircle className="h-3.5 w-3.5" /> Error
                            </span>
                          )}
                        </td>
                        {fields.slice(0, 4).map((f) => (
                          <td key={f.key} className="px-3 py-2 text-slate-800 dark:text-slate-200">
                            {row.data[f.key] || "—"}
                          </td>
                        ))}
                        <td className="px-3 py-2 text-rose-600 text-[11px]">
                          {row.errors.join("; ")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/50 px-6 py-3.5 dark:border-slate-800 dark:bg-slate-950/50">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-lg border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
          >
            Cancel
          </button>
          {activeTab === "preview" && (
            <button
              type="button"
              onClick={handleExecuteImport}
              disabled={isImporting || validRowCount === 0}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 disabled:opacity-50"
            >
              {isImporting ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  Importing records…
                </>
              ) : (
                <>
                  <Upload className="h-3.5 w-3.5" />
                  Import {validRowCount} Record(s)
                </>
              )}
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default UniversalBulkImportModal;
