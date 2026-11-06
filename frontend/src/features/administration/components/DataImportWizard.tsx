"use client";

import React, { useState, useMemo, useRef } from "react";
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Download,
  RefreshCw,
  Trash2,
  Database,
  FileText,
  Sparkles,
  Users,
  Package,
  ShoppingBag,
  Building2,
  BookOpen,
} from "lucide-react";
import apiClient from "@/services/apiClient";
import { notifySuccess, notifyError } from "@/lib/notifications";
import { getApiErrorMessage } from "@/lib/api-errors";

interface EntityConfig {
  key: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  apiEndpoint: string;
  fields: {
    key: string;
    label: string;
    required?: boolean;
    sampleValue: string;
    description?: string;
  }[];
}

const IMPORT_ENTITIES: EntityConfig[] = [
  {
    key: "employees",
    name: "Employees",
    description: "Employee directory, department assignments, and contact details",
    icon: Users,
    apiEndpoint: "/hrms/employees",
    fields: [
      { key: "firstName", label: "First Name", required: true, sampleValue: "Rahul" },
      { key: "lastName", label: "Last Name", required: true, sampleValue: "Sharma" },
      { key: "email", label: "Email Address", required: true, sampleValue: "rahul.sharma@example.com" },
      { key: "phone", label: "Phone Number", sampleValue: "+919876543210" },
      { key: "department", label: "Department", sampleValue: "Engineering" },
      { key: "designation", label: "Designation", sampleValue: "Senior Software Engineer" },
      { key: "joiningDate", label: "Joining Date", sampleValue: "2025-04-01" },
    ],
  },
  {
    key: "customers",
    name: "Customers & Clients",
    description: "CRM customer master with GSTIN and billing address",
    icon: Building2,
    apiEndpoint: "/crm/customers",
    fields: [
      { key: "name", label: "Customer Name", required: true, sampleValue: "Acme Enterprises Ltd" },
      { key: "email", label: "Email", sampleValue: "contact@acme.com" },
      { key: "phone", label: "Phone", sampleValue: "+919811223344" },
      { key: "gstin", label: "GSTIN", sampleValue: "27AABCU9603R1ZM" },
      { key: "address", label: "Address", sampleValue: "Plot 42, MIDC Industrial Area" },
      { key: "city", label: "City", sampleValue: "Mumbai" },
      { key: "state", label: "State", sampleValue: "Maharashtra" },
      { key: "pincode", label: "Pincode", sampleValue: "400093" },
    ],
  },
  {
    key: "vendors",
    name: "Suppliers & Vendors",
    description: "Procurement vendor database with tax and payment terms",
    icon: ShoppingBag,
    apiEndpoint: "/procurement/vendors",
    fields: [
      { key: "name", label: "Vendor Name", required: true, sampleValue: "Apex Industrial Supplies" },
      { key: "email", label: "Email", sampleValue: "billing@apexsupplies.in" },
      { key: "phone", label: "Phone", sampleValue: "+919822334455" },
      { key: "gstin", label: "GSTIN", sampleValue: "07AAACB1234P1Z5" },
      { key: "pan", label: "PAN", sampleValue: "AAACB1234P" },
      { key: "paymentTerms", label: "Payment Terms", sampleValue: "Net 30" },
      { key: "city", label: "City", sampleValue: "New Delhi" },
    ],
  },
  {
    key: "items",
    name: "Items & Products",
    description: "Inventory catalog with HSN codes, tax rates, and prices",
    icon: Package,
    apiEndpoint: "/inventory/items",
    fields: [
      { key: "itemCode", label: "Item / SKU Code", required: true, sampleValue: "SKU-1001" },
      { key: "name", label: "Item Name", required: true, sampleValue: "Industrial Motor 5HP" },
      { key: "category", label: "Category", sampleValue: "Motors & Machinery" },
      { key: "hsnCode", label: "HSN / SAC Code", sampleValue: "8501" },
      { key: "unit", label: "Unit of Measure", sampleValue: "PCS" },
      { key: "sellingPrice", label: "Selling Price (₹)", sampleValue: "18500.00" },
      { key: "purchasePrice", label: "Purchase Price (₹)", sampleValue: "14200.00" },
      { key: "taxRate", label: "GST Rate (%)", sampleValue: "18" },
    ],
  },
  {
    key: "chart-of-accounts",
    name: "Chart of Accounts",
    description: "General Ledger account master for Indian accounting standards",
    icon: BookOpen,
    apiEndpoint: "/finance/chart-of-accounts",
    fields: [
      { key: "code", label: "Account Code", required: true, sampleValue: "1010" },
      { key: "name", label: "Account Name", required: true, sampleValue: "HDFC Operating Bank Account" },
      { key: "type", label: "Account Type (Asset/Liability/Equity/Revenue/Expense)", required: true, sampleValue: "Asset" },
      { key: "subType", label: "Sub-Type", sampleValue: "Bank" },
      { key: "description", label: "Description", sampleValue: "Primary corporate banking account" },
    ],
  },
];

// Helper to parse CSV text into headers and rows
function parseCsv(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = text
    .split(/\r\n|\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  if (lines.length === 0) return { headers: [], rows: [] };

  // Split line respecting double quotes
  const splitLine = (line: string): string[] => {
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

  const headers = splitLine(lines[0]);
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = splitLine(lines[i]);
    if (values.every((v) => v === "")) continue;
    const rowObj: Record<string, string> = {};
    headers.forEach((h, colIdx) => {
      rowObj[h] = values[colIdx] || "";
    });
    rows.push(rowObj);
  }

  return { headers, rows };
}

export function DataImportWizard() {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedEntityKey, setSelectedEntityKey] = useState<string>("employees");
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<Record<string, string>[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({}); // entityFieldKey -> csvHeaderName
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [importProgress, setImportProgress] = useState<number>(0);
  const [importResult, setImportResult] = useState<{ success: number; failed: number } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentEntity = useMemo(
    () => IMPORT_ENTITIES.find((e) => e.key === selectedEntityKey) || IMPORT_ENTITIES[0],
    [selectedEntityKey]
  );

  // Auto-generate sample CSV template for the selected entity
  const handleDownloadTemplate = () => {
    const headers = currentEntity.fields.map((f) => f.label);
    const sampleValues = currentEntity.fields.map((f) => `"${f.sampleValue}"`);
    const csvContent = `\uFEFF${headers.join(",")}\n${sampleValues.join(",")}\n`;

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${currentEntity.key}-import-template.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    notifySuccess(`Downloaded sample template for ${currentEntity.name}`);
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const { headers, rows } = parseCsv(text);
      if (headers.length === 0 || rows.length === 0) {
        notifyError("The uploaded CSV file is empty or formatted incorrectly.");
        return;
      }

      setCsvHeaders(headers);
      setRawRows(rows);

      // Auto-match headers to schema fields by similarity
      const initialMapping: Record<string, string> = {};
      currentEntity.fields.forEach((field) => {
        const exactMatch = headers.find(
          (h) =>
            h.toLowerCase() === field.label.toLowerCase() ||
            h.toLowerCase() === field.key.toLowerCase() ||
            h.toLowerCase().replace(/[^a-z0-9]/g, "") === field.key.toLowerCase().replace(/[^a-z0-9]/g, "")
        );
        if (exactMatch) {
          initialMapping[field.key] = exactMatch;
        }
      });
      setColumnMapping(initialMapping);
      setStep(3);
      notifySuccess(`Parsed ${rows.length} rows from ${file.name}`);
    };
    reader.readAsText(file);
  };

  // Map rows using current columnMapping
  const stagedRecords = useMemo(() => {
    return rawRows.map((rawRow, idx) => {
      const mappedRecord: Record<string, any> = { _rowIndex: idx + 1 };
      const missingRequired: string[] = [];

      currentEntity.fields.forEach((f) => {
        const mappedHeader = columnMapping[f.key];
        const val = mappedHeader ? rawRow[mappedHeader] : "";
        mappedRecord[f.key] = val;

        if (f.required && (!val || val.trim() === "")) {
          missingRequired.push(f.label);
        }
      });

      mappedRecord._isValid = missingRequired.length === 0;
      mappedRecord._errors = missingRequired;
      return mappedRecord;
    });
  }, [rawRows, columnMapping, currentEntity]);

  const validCount = useMemo(() => stagedRecords.filter((r) => r._isValid).length, [stagedRecords]);
  const invalidCount = stagedRecords.length - validCount;

  // Execute batch commit
  const handleCommitImport = async () => {
    const validRows = stagedRecords.filter((r) => r._isValid);
    if (validRows.length === 0) {
      notifyError("No valid rows to import. Please check column mappings or fix missing required fields.");
      return;
    }

    setIsImporting(true);
    setImportProgress(10);

    let successCount = 0;
    let failedCount = 0;

    try {
      const cleanRecords = validRows.map((r) => {
        const { _rowIndex, _isValid, _errors, ...clean } = r;
        return clean;
      });

      setImportProgress(40);
      const res = await apiClient.post<{ data: { totalRecords: number; successCount: number; failedCount: number; errors: string[] } }>(
        "/api/v1/data-import/batch",
        {
          entityKey: currentEntity.key,
          records: cleanRecords,
          runAsync: cleanRecords.length > 100,
        }
      );

      const batchData = res.data?.data;
      successCount = batchData?.successCount ?? cleanRecords.length;
      failedCount = batchData?.failedCount ?? 0;
      setImportProgress(100);

      setImportResult({ success: successCount, failed: failedCount });
      notifySuccess(`Import completed! ${successCount} records imported successfully.`);
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed during import processing."));
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
            <Database className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Universal Data Import & ETL Staging Studio
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Bulk onboard records from spreadsheets with visual field mapping, automated validation, and staging.
            </p>
          </div>
        </div>

        {/* Wizard Stepper Pills */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
          <div className={`px-2.5 py-1 rounded-lg ${step === 1 ? "bg-white dark:bg-slate-900 text-blue-600 shadow-2xs" : "text-slate-500"}`}>
            1. Target Entity
          </div>
          <div className={`px-2.5 py-1 rounded-lg ${step === 2 ? "bg-white dark:bg-slate-900 text-blue-600 shadow-2xs" : "text-slate-500"}`}>
            2. Upload File
          </div>
          <div className={`px-2.5 py-1 rounded-lg ${step === 3 ? "bg-white dark:bg-slate-900 text-blue-600 shadow-2xs" : "text-slate-500"}`}>
            3. Map Fields
          </div>
          <div className={`px-2.5 py-1 rounded-lg ${step === 4 ? "bg-white dark:bg-slate-900 text-blue-600 shadow-2xs" : "text-slate-500"}`}>
            4. Stage & Commit
          </div>
        </div>
      </div>

      {/* Step 1: Entity Selector */}
      {step === 1 && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">Select Business Object to Import</h2>
            <p className="text-xs text-slate-500">
              Choose the entity you wish to populate. The system will prepare the matching schema and validation rules.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {IMPORT_ENTITIES.map((ent) => {
              const Icon = ent.icon;
              const isSelected = selectedEntityKey === ent.key;
              return (
                <div
                  key={ent.key}
                  onClick={() => setSelectedEntityKey(ent.key)}
                  className={`p-4 rounded-2xl border cursor-pointer transition flex flex-col justify-between ${
                    isSelected
                      ? "border-blue-500 bg-blue-50/40 dark:border-blue-500/80 dark:bg-blue-950/20 shadow-xs"
                      : "border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800/50"
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className={`p-2.5 rounded-xl ${isSelected ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      {isSelected && <CheckCircle2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{ent.name}</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{ent.description}</p>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                    <span>{ent.fields.length} schema fields</span>
                    <span>{ent.fields.filter((f) => f.required).length} required</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end pt-4">
            <button
              onClick={() => setStep(2)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition"
            >
              <span>Next: Upload File</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Download Template & File Upload */}
      {step === 2 && (
        <div className="space-y-6 max-w-2xl mx-auto animate-in fade-in duration-150">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Step 2: Prepare & Upload Spreadsheet
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">Target Entity: {currentEntity.name}</p>
              </div>

              <button
                onClick={handleDownloadTemplate}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition"
              >
                <Download className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                Download Sample CSV
              </button>
            </div>

            {/* Drag and Drop Zone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 rounded-2xl p-10 text-center cursor-pointer transition bg-slate-50/50 dark:bg-slate-800/20 flex flex-col items-center justify-center space-y-3"
            >
              <div className="p-3.5 rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
                <UploadCloud className="h-8 w-8" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Click to browse or drop your CSV file here
                </p>
                <p className="text-xs text-slate-400">Supports standard CSV with UTF-8 encoding (up to 10,000 rows)</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={() => setStep(1)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Visual Column Mapper */}
      {step === 3 && (
        <div className="space-y-5 animate-in fade-in duration-150">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">Step 3: Map Columns</h2>
              <p className="text-xs text-slate-500">
                Match the columns in your uploaded file with the required system fields.
              </p>
            </div>

            <span className="text-xs font-medium text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
              {rawRows.length} rows detected
            </span>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-400">
                  <th className="py-3 px-4 font-semibold w-1/3">Target System Field</th>
                  <th className="py-3 px-4 font-semibold w-1/3">Source File Header</th>
                  <th className="py-3 px-4 font-semibold w-1/3">Sample Value from File</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {currentEntity.fields.map((f) => {
                  const mappedHeader = columnMapping[f.key] || "";
                  const previewVal = mappedHeader && rawRows[0] ? rawRows[0][mappedHeader] : "";

                  return (
                    <tr key={f.key} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-slate-900 dark:text-slate-100">{f.label}</span>
                          {f.required && <span className="text-rose-500 font-bold">*</span>}
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">{f.key}</span>
                      </td>

                      <td className="py-3 px-4">
                        <select
                          value={mappedHeader}
                          onChange={(e) => {
                            const val = e.target.value;
                            setColumnMapping((prev) => ({ ...prev, [f.key]: val }));
                          }}
                          className={`w-full py-1.5 px-2.5 rounded-xl text-xs border ${
                            mappedHeader
                              ? "border-emerald-300 bg-emerald-50/30 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-300"
                              : f.required
                              ? "border-rose-300 bg-rose-50/20 dark:border-rose-800"
                              : "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
                          }`}
                        >
                          <option value="">-- Ignore Field --</option>
                          {csvHeaders.map((h) => (
                            <option key={h} value={h}>
                              {h}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-400 truncate max-w-xs">
                        {previewVal || <span className="text-slate-300 dark:text-slate-600">—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => setStep(2)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </button>
            <button
              onClick={() => setStep(4)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition"
            >
              <span>Next: Stage & Validate</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Staging Grid & Commit */}
      {step === 4 && (
        <div className="space-y-5 animate-in fade-in duration-150">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">Step 4: Staging & Validation Preview</h2>
              <p className="text-xs text-slate-500">
                Review verified rows before committing them to the permanent database.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800 font-semibold">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {validCount} Valid
              </span>
              {invalidCount > 0 && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-800 font-semibold">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {invalidCount} Errors
                </span>
              )}
            </div>
          </div>

          {/* Progress Bar (during import) */}
          {isImporting && (
            <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-5 dark:border-blue-900/40 dark:bg-blue-950/20 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-blue-900 dark:text-blue-300">
                <span className="flex items-center gap-2">
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  Committing records to database...
                </span>
                <span>{importProgress}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-blue-200/60 dark:bg-blue-900/60 overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all duration-200"
                  style={{ width: `${importProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Import Result Summary Card */}
          {importResult && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5 dark:border-emerald-900/40 dark:bg-emerald-950/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Batch Import Complete</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {importResult.success} records created successfully.{" "}
                    {importResult.failed > 0 && `${importResult.failed} failed.`}
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setStep(1);
                  setImportResult(null);
                  setRawRows([]);
                }}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-2xs transition"
              >
                Done / Start New Import
              </button>
            </div>
          )}

          {/* Staging Grid Table */}
          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm dark:border-slate-800 dark:bg-slate-900 max-h-96 overflow-y-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-800/90 backdrop-blur-xs border-b border-slate-200 dark:border-slate-800">
                <tr className="text-slate-600 dark:text-slate-400 font-semibold">
                  <th className="py-2.5 px-3 w-12 text-center">Row</th>
                  <th className="py-2.5 px-3 w-20 text-center">Status</th>
                  {currentEntity.fields.map((f) => (
                    <th key={f.key} className="py-2.5 px-3 whitespace-nowrap">
                      {f.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
                {stagedRecords.slice(0, 100).map((row) => (
                  <tr
                    key={row._rowIndex}
                    className={
                      row._isValid
                        ? "hover:bg-slate-50/50 dark:hover:bg-slate-800/30"
                        : "bg-rose-50/40 dark:bg-rose-950/20"
                    }
                  >
                    <td className="py-2 px-3 text-center text-slate-400">{row._rowIndex}</td>
                    <td className="py-2 px-3 text-center">
                      {row._isValid ? (
                        <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
                          OK
                        </span>
                      ) : (
                        <span
                          title={`Missing: ${row._errors.join(", ")}`}
                          className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300 cursor-help"
                        >
                          ERR
                        </span>
                      )}
                    </td>
                    {currentEntity.fields.map((f) => (
                      <td key={f.key} className="py-2 px-3 truncate max-w-xs text-slate-700 dark:text-slate-300">
                        {row[f.key] || <span className="text-slate-300 dark:text-slate-600">—</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => setStep(3)}
              disabled={isImporting}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800 disabled:opacity-50"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Mapping
            </button>

            <button
              onClick={handleCommitImport}
              disabled={isImporting || validCount === 0 || importResult !== null}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition disabled:opacity-50"
            >
              {isImporting ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  Importing ({importProgress}%)...
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  Commit {validCount} Records to Database
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
