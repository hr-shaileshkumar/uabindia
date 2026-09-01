"use client";

import { useState, useRef, type ChangeEvent, type DragEvent } from "react";
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  X,
  ArrowRight,
  RefreshCw,
  Download,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { notifyError, notifySuccess } from "@/lib/notifications";
import { cn } from "@/lib/utils";

export type ImportColumnDefinition = {
  key: string;
  label: string;
  required?: boolean;
  type?: "string" | "number" | "email" | "currency";
  sample?: string;
};

type BulkImportModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityName: string;
  columns: ImportColumnDefinition[];
  onImport: (rows: Record<string, unknown>[]) => Promise<void>;
  sampleData?: Record<string, string>[];
};

function parseCsv(text: string): { headers: string[]; rows: string[][] } {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length === 0) return { headers: [], rows: [] };

  const parseLine = (line: string): string[] => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        result.push(current.trim().replace(/^"|"$/g, ""));
        current = "";
      } else {
        current += char;
      }
    }
    result.push(current.trim().replace(/^"|"$/g, ""));
    return result;
  };

  const headers = parseLine(lines[0]);
  const rows = lines.slice(1).map(parseLine);
  return { headers, rows };
}

export function BulkImportModal({
  open,
  onOpenChange,
  entityName,
  columns,
  onImport,
  sampleData,
}: BulkImportModalProps) {
  const [step, setStep] = useState<"upload" | "mapping" | "preview" | "importing">("upload");
  const [fileName, setFileName] = useState<string>("");
  const [rawHeaders, setRawHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<string[][]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({}); // entityKey -> csvHeader
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setStep("upload");
    setFileName("");
    setRawHeaders([]);
    setRawRows([]);
    setColumnMapping({});
    setImporting(false);
    setImportProgress(0);
  };

  const handleClose = () => {
    reset();
    onOpenChange(false);
  };

  const handleFileProcess = (file: File) => {
    if (!file.name.endsWith(".csv") && !file.name.endsWith(".txt") && !file.name.endsWith(".tsv")) {
      notifyError("Please upload a valid CSV or TSV file.");
      return;
    }
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const { headers, rows } = parseCsv(text);
      if (headers.length === 0 || rows.length === 0) {
        notifyError("CSV file is empty or missing data rows.");
        return;
      }
      setRawHeaders(headers);
      setRawRows(rows);

      // Auto-map columns matching label or key (case-insensitive)
      const autoMap: Record<string, string> = {};
      columns.forEach((col) => {
        const match = headers.find(
          (h) =>
            h.toLowerCase() === col.key.toLowerCase() ||
            h.toLowerCase() === col.label.toLowerCase() ||
            h.toLowerCase().includes(col.key.toLowerCase()) ||
            col.label.toLowerCase().includes(h.toLowerCase())
        );
        if (match) autoMap[col.key] = match;
      });
      setColumnMapping(autoMap);
      setStep("mapping");
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileProcess(e.target.files[0]);
    }
  };

  const downloadSampleCsv = () => {
    const headers = columns.map((c) => c.label).join(",");
    let content = headers + "\n";
    if (sampleData && sampleData.length) {
      content += sampleData.map((d) => columns.map((c) => d[c.key] || "").join(",")).join("\n");
    } else {
      content += columns.map((c) => `Sample ${c.label}`).join(",") + "\n";
    }
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${entityName.toLowerCase()}-import-template.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Convert raw rows to mapped entity objects
  const parsedEntities = rawRows.map((row) => {
    const obj: Record<string, unknown> = {};
    columns.forEach((col) => {
      const csvColName = columnMapping[col.key];
      if (csvColName) {
        const headerIndex = rawHeaders.indexOf(csvColName);
        if (headerIndex >= 0) {
          const val = row[headerIndex] ?? "";
          if (col.type === "number" || col.type === "currency") {
            obj[col.key] = Number(val.replace(/[^0-9.-]+/g, "")) || 0;
          } else {
            obj[col.key] = val;
          }
        }
      }
    });
    return obj;
  });

  // Validate parsed rows
  const validationResults = parsedEntities.map((entity) => {
    const errors: string[] = [];
    columns.forEach((col) => {
      if (col.required && (!entity[col.key] || String(entity[col.key]).trim() === "")) {
        errors.push(`${col.label} is required`);
      }
      if (col.type === "email" && entity[col.key]) {
        const emailStr = String(entity[col.key]);
        if (!emailStr.includes("@") || !emailStr.includes(".")) {
          errors.push(`Invalid email in ${col.label}`);
        }
      }
    });
    return { valid: errors.length === 0, errors };
  });

  const validCount = validationResults.filter((v) => v.valid).length;
  const invalidCount = validationResults.filter((v) => !v.valid).length;

  const executeImport = async () => {
    try {
      setImporting(true);
      setStep("importing");
      setImportProgress(20);
      const validRows = parsedEntities.filter((_, idx) => validationResults[idx].valid);
      setImportProgress(50);
      await onImport(validRows);
      setImportProgress(100);
      notifySuccess(`Successfully imported ${validRows.length} ${entityName} records.`);
      setTimeout(() => {
        handleClose();
      }, 700);
    } catch (err: unknown) {
      notifyError(err instanceof Error ? err.message : "Failed to import records.");
      setStep("preview");
    } finally {
      setImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => (!v ? handleClose() : onOpenChange(v))}>
      <DialogContent className="max-w-3xl overflow-hidden rounded-3xl border-slate-200 p-0 shadow-2xl dark:border-slate-800 dark:bg-slate-900 sm:max-w-3xl">
        <div className="border-b border-slate-100 bg-slate-50/70 px-6 py-4 dark:border-slate-800 dark:bg-slate-800/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
                <FileSpreadsheet className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-slate-900 dark:text-white">
                  Bulk Import {entityName}
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Upload CSV or Excel data file to batch-import records with column mapping.
                </DialogDescription>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={downloadSampleCsv} className="h-8 gap-1.5 text-xs">
              <Download className="h-3.5 w-3.5" />
              <span>Download Template</span>
            </Button>
          </div>

          {/* Stepper Header */}
          <div className="mt-4 flex items-center gap-2 text-xs font-semibold">
            <span className={cn("rounded-md px-2 py-0.5", step === "upload" ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-700")}>
              1. Upload File
            </span>
            <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
            <span className={cn("rounded-md px-2 py-0.5", step === "mapping" ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-700")}>
              2. Map Columns
            </span>
            <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
            <span className={cn("rounded-md px-2 py-0.5", step === "preview" ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-700")}>
              3. Review & Import
            </span>
          </div>
        </div>

        <div className="p-6">
          {/* Step 1: Upload Dropzone */}
          {step === "upload" && (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/50 px-6 py-12 text-center transition-all hover:border-blue-500 hover:bg-blue-50/20 cursor-pointer dark:border-slate-700 dark:bg-slate-900/40"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt,.tsv"
                onChange={handleFileInputChange}
                className="hidden"
              />
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 shadow-sm dark:bg-blue-950 dark:text-blue-400">
                <UploadCloud className="h-6 w-6" />
              </div>
              <p className="mt-4 text-sm font-semibold text-slate-900 dark:text-white">
                Drag and drop your CSV file here, or browse
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Supports .CSV, .TSV with comma or tab separated fields
              </p>
            </div>
          )}

          {/* Step 2: Column Mapping */}
          {step === "mapping" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3 text-xs text-slate-600 dark:bg-slate-800">
                <span>File: <strong>{fileName}</strong> ({rawRows.length} rows found)</span>
                <Button variant="ghost" size="sm" onClick={() => setStep("upload")} className="h-7 text-xs">
                  Change File
                </Button>
              </div>

              <div className="max-h-72 overflow-y-auto space-y-2.5 pr-1">
                {columns.map((col) => (
                  <div
                    key={col.key}
                    className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-3 shadow-xs dark:border-slate-800 dark:bg-slate-900"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">{col.label}</span>
                        {col.required && <span className="text-xs text-rose-500 font-bold">*</span>}
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono">Field: {col.key}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={columnMapping[col.key] || ""}
                        onChange={(e) =>
                          setColumnMapping((prev) => ({
                            ...prev,
                            [col.key]: e.target.value,
                          }))
                        }
                        className="erp-select max-w-[200px] text-xs"
                      >
                        <option value="">-- Skip Field --</option>
                        {rawHeaders.map((header) => (
                          <option key={header} value={header}>
                            CSV: {header}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button variant="outline" onClick={() => setStep("upload")}>Back</Button>
                <Button onClick={() => setStep("preview")} className="bg-blue-600 text-white hover:bg-blue-700">
                  <span>Continue to Preview</span>
                  <ArrowRight className="h-4 w-4 ml-1.5" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Review and Preview */}
          {step === "preview" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="bg-emerald-600 text-white text-xs">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    {validCount} Ready to Import
                  </Badge>
                  {invalidCount > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      {invalidCount} Invalid Rows
                    </Badge>
                  )}
                </div>
                <span className="text-xs text-slate-500">Previewing first 5 rows</span>
              </div>

              <div className="max-h-60 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
                <table className="erp-table text-xs">
                  <thead className="erp-thead">
                    <tr>
                      <th className="erp-th">Status</th>
                      {columns
                        .filter((c) => columnMapping[c.key])
                        .map((col) => (
                          <th key={col.key} className="erp-th">{col.label}</th>
                        ))}
                    </tr>
                  </thead>
                  <tbody>
                    {parsedEntities.slice(0, 5).map((row, idx) => {
                      const val = validationResults[idx];
                      return (
                        <tr key={idx} className="erp-tr">
                          <td className="erp-td">
                            {val.valid ? (
                              <span className="text-emerald-600 font-semibold text-[11px]">Valid</span>
                            ) : (
                              <span className="text-rose-600 font-semibold text-[11px]" title={val.errors.join(", ")}>
                                Error
                              </span>
                            )}
                          </td>
                          {columns
                            .filter((c) => columnMapping[c.key])
                            .map((col) => (
                              <td key={col.key} className="erp-td">
                                {String(row[col.key] || "-")}
                              </td>
                            ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button variant="outline" onClick={() => setStep("mapping")}>Back to Mapping</Button>
                <Button
                  onClick={() => void executeImport()}
                  disabled={validCount === 0}
                  className="bg-emerald-600 text-white hover:bg-emerald-700 font-bold"
                >
                  Confirm & Import ({validCount} Records)
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Progress Indicator */}
          {step === "importing" && (
            <div className="py-10 text-center space-y-4">
              <RefreshCw className="h-10 w-10 animate-spin text-blue-600 mx-auto" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Ingesting {entityName} Records…
              </h3>
              <div className="w-full bg-slate-200 rounded-full h-2 max-w-md mx-auto overflow-hidden">
                <div
                  className="bg-blue-600 h-full transition-all duration-300 rounded-full"
                  style={{ width: `${importProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
