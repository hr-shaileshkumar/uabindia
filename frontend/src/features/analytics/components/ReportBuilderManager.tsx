"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { CrudHeaderStats } from "@/components/workspace/crud-workspace";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  erpButtonClassName,
  erpFormInputClassName,
  erpPanelClassName,
  erpPanelBodyClassName,
  erpPanelHeaderClassName,
  erpPanelTitleClassName,
  erpSectionClassName,
  erpTableThClassName,
  erpTableTdClassName,
  erpTableWrapClassName,
} from "@/components/workspace/styles";
import {
  FileText,
  Filter,
  Table,
  RefreshCw,
  Layout,
  Download,
  Plus,
  Trash2,
  Eye,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { reportsApi } from "@/services/modules";
import { notifyError, notifySuccess } from "@/lib/notifications";
import { getApiErrorMessage } from "@/lib/api-errors";
import { ErpRefreshButton } from "@/components/workspace/page-kit";
import { ROUTES } from "@/constants/routes";

export type CustomReportRow = {
  id: string;
  name?: string;
  reportType?: string;
  dateRange?: string;
  outputFormat?: string;
  schedule?: string;
  status?: string;
  lastRunAt?: string;
  lastRowCount?: number;
  lastRunSummary?: string;
};

export type FilterCondition = {
  id: string;
  field: string;
  operator: string;
  value: string;
};

export const REPORT_MODULES = [
  {
    id: "sales",
    label: "Sales & Invoicing",
    icon: Layout,
    description: "Revenue, customer invoices, and sales orders",
    availableFields: ["InvoiceNumber", "CustomerName", "InvoiceDate", "TaxableAmount", "GSTAmount", "TotalAmount", "PaymentStatus"],
  },
  {
    id: "inventory",
    label: "Inventory & Warehouse",
    icon: Table,
    description: "Stock levels, valuation, movements, and reorders",
    availableFields: ["ItemCode", "ItemName", "Warehouse", "CurrentStock", "ReorderLevel", "UnitCost", "TotalValuation"],
  },
  {
    id: "hrms",
    label: "HR & Payroll",
    icon: RefreshCw,
    description: "Headcount, attendance, payroll runs, and taxes",
    availableFields: ["EmployeeCode", "EmployeeName", "Department", "Designation", "GrossSalary", "NetPayable", "PF_Deduction"],
  },
  {
    id: "finance",
    label: "Financial General Ledger",
    icon: Filter,
    description: "Chart of Accounts, journal vouchers, and cashflow",
    availableFields: ["VoucherNumber", "AccountCode", "AccountName", "DebitAmount", "CreditAmount", "EntryDate", "Status"],
  },
];

export const DATE_RANGES = [
  { id: "thisMonth", label: "This Month (MTD)" },
  { id: "lastMonth", label: "Last Month" },
  { id: "last30days", label: "Last 30 Days" },
  { id: "thisQuarter", label: "Current Quarter (Q2 FY26)" },
  { id: "thisYear", label: "Full Fiscal Year 2026" },
];

const asList = (raw: unknown): CustomReportRow[] => {
  if (Array.isArray(raw)) return raw as CustomReportRow[];
  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    if (Array.isArray(obj.data)) return obj.data as CustomReportRow[];
  }
  return [];
};

export function ReportBuilderManager() {
  const [reportName, setReportName] = useState("");
  const [reportType, setReportType] = useState("sales");
  const [dateRange, setDateRange] = useState("thisMonth");
  const [outputFormat, setOutputFormat] = useState("pdf");
  const [schedule, setSchedule] = useState("Manual");
  const [selectedFields, setSelectedFields] = useState<string[]>([
    "InvoiceNumber",
    "CustomerName",
    "InvoiceDate",
    "TotalAmount",
    "PaymentStatus",
  ]);
  const [filters, setFilters] = useState<FilterCondition[]>([
    { id: "1", field: "PaymentStatus", operator: "equals", value: "Paid" },
  ]);
  const [records, setRecords] = useState<CustomReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [previewActive, setPreviewActive] = useState(true);

  const activeModuleConfig = useMemo(
    () => REPORT_MODULES.find((m) => m.id === reportType) || REPORT_MODULES[0]!,
    [reportType],
  );

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await reportsApi.custom.list();
      setRecords(asList(res.data));
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to load reports"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const selectModule = (typeId: string, label: string) => {
    setReportType(typeId);
    if (!reportName.trim()) setReportName(`${label} Report`);
    const mod = REPORT_MODULES.find((m) => m.id === typeId);
    if (mod) {
      setSelectedFields(mod.availableFields.slice(0, 5));
    }
  };

  const toggleField = (field: string) => {
    setSelectedFields((prev) =>
      prev.includes(field) ? prev.filter((f) => f !== field) : [...prev, field],
    );
  };

  const addFilter = () => {
    setFilters((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        field: activeModuleConfig.availableFields[0] || "Status",
        operator: "equals",
        value: "",
      },
    ]);
  };

  const removeFilter = (id: string) => {
    setFilters((prev) => prev.filter((f) => f.id !== id));
  };

  const updateFilter = (id: string, key: keyof FilterCondition, val: string) => {
    setFilters((prev) => prev.map((f) => (f.id === id ? { ...f, [key]: val } : f)));
  };

  const payload = () => ({
    name: reportName.trim() || `${activeModuleConfig.label} Custom Report`,
    reportType,
    dateRange,
    outputFormat,
    schedule,
    columns: selectedFields,
    filters,
  });

  const handleSave = async (runAfter: boolean) => {
    if (!reportName.trim()) {
      notifyError("Enter a report name.");
      return;
    }
    try {
      setSaving(true);
      const created = await reportsApi.custom.create(payload());
      const id = (created.data as CustomReportRow | undefined)?.id;
      if (runAfter && id) {
        await reportsApi.custom.run(id);
        notifySuccess("Report configuration saved and executed.");
      } else {
        notifySuccess("Report configuration saved.");
      }
      setReportName("");
      void load();
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to save report."));
    } finally {
      setSaving(false);
    }
  };

  const handleRun = async (id: string) => {
    try {
      const res = await reportsApi.custom.run(id);
      notifySuccess("Report run complete.");
      void load();
      return res.data;
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Run failed."));
      return null;
    }
  };

  const handleExport = async (report: CustomReportRow) => {
    try {
      const runPayload = await reportsApi.custom.run(report.id);
      const blob = new Blob(
        [
          JSON.stringify(
            {
              report: {
                id: report.id,
                name: report.name,
                reportType: report.reportType,
                dateRange: report.dateRange,
                outputFormat: report.outputFormat || outputFormat,
                schedule: report.schedule,
              },
              exportedAt: new Date().toISOString(),
              result: runPayload.data,
            },
            null,
            2
          ),
        ],
        { type: "application/json" }
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${(report.name || "report").replace(/\s+/g, "-").toLowerCase()}-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      notifySuccess("Report exported as JSON.");
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Export failed."));
    }
  };

  const selectClassName = `${erpFormInputClassName} px-3`;

  return (
    <StandardPageLayout
      title="Visual Report Builder & Query Designer"
      subtitle="Configure custom multi-module queries, filter conditions, and recurring export schedules."
      eyebrow="Business Intelligence & Analytics"
      icon="file-text"
      meta={
        <CrudHeaderStats
          items={[
            { label: "Data Modules", value: REPORT_MODULES.length, helper: "connected" },
            { label: "Saved Reports", value: loading ? "…" : records.length, helper: "templates" },
            {
              label: "Recurring",
              value: loading ? "…" : records.filter((r) => r.schedule && r.schedule !== "Manual").length,
              tone: "warning",
              helper: "scheduled",
            },
          ]}
        />
      }
      actions={
        <div className="flex flex-wrap gap-2">
          <Link href={ROUTES.REPORTS_CUSTOM} className={erpButtonClassName.secondary}>
            Report Catalog
          </Link>
          <ErpRefreshButton onClick={() => void load()} loading={loading} />
          <button
            type="button"
            className={`${erpButtonClassName.primary} gap-2 cursor-pointer`}
            disabled={saving}
            onClick={() => void handleSave(false)}
          >
            <FileText className="h-4 w-4" />
            {saving ? "Saving…" : "Save Definition"}
          </button>
        </div>
      }
    >
      {error ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:bg-rose-950/50 dark:border-rose-800 dark:text-rose-300">{error}</p>
      ) : null}

      <div className="space-y-6">
        {/* Step 1: Module Template Picker */}
        <section className={erpPanelClassName}>
          <div className={erpPanelHeaderClassName}>
            <div>
              <h2 className={erpPanelTitleClassName}>1. Select Target Data Source</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Pick the core ERP module to query records from</p>
            </div>
          </div>
          <div className={erpPanelBodyClassName}>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {REPORT_MODULES.map((mod) => {
                const isSelected = reportType === mod.id;
                return (
                  <button
                    key={mod.id}
                    type="button"
                    onClick={() => selectModule(mod.id, mod.label)}
                    className={`flex flex-col text-left rounded-2xl border p-4 transition-all cursor-pointer ${
                      isSelected
                        ? "border-blue-600 bg-blue-50/50 shadow-xs ring-2 ring-blue-500/20 dark:bg-blue-950/40 dark:border-blue-500"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800/60"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className={`rounded-xl p-2.5 ${isSelected ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"}`}>
                        <mod.icon className="h-5 w-5" />
                      </div>
                      {isSelected ? (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        </span>
                      ) : null}
                    </div>
                    <h3 className="mt-3 text-xs font-bold text-slate-900 dark:text-white">{mod.label}</h3>
                    <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">{mod.description}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Step 2 & 3: Columns Selector & Filter Rules */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Column Attributes Selector */}
          <section className={erpSectionClassName}>
            <div className="mb-3 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">2. Output Columns ({selectedFields.length})</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Click to include or exclude attributes from export</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {activeModuleConfig.availableFields.map((field) => {
                const active = selectedFields.includes(field);
                return (
                  <button
                    key={field}
                    type="button"
                    onClick={() => toggleField(field)}
                    className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium transition cursor-pointer ${
                      active
                        ? "border-blue-300 bg-blue-50 text-blue-700 font-semibold dark:border-blue-700 dark:bg-blue-950/60 dark:text-blue-300"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                    }`}
                  >
                    {active ? <CheckCircle2 className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" /> : <Plus className="h-3.5 w-3.5 text-slate-400" />}
                    {field}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Filter Rules Designer */}
          <section className={erpSectionClassName}>
            <div className="mb-3 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">3. Filter Conditions</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Narrow data using logical condition matching</p>
              </div>
              <button
                type="button"
                onClick={addFilter}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 cursor-pointer"
              >
                <Plus className="h-3 w-3" /> Add Rule
              </button>
            </div>

            <div className="space-y-2.5 pt-1">
              {filters.length === 0 ? (
                <p className="py-4 text-center text-xs text-slate-400">No filter rules applied (Includes all records).</p>
              ) : (
                filters.map((filter) => (
                  <div key={filter.id} className="flex items-center gap-2">
                    <select
                      value={filter.field}
                      onChange={(e) => updateFilter(filter.id, "field", e.target.value)}
                      className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                    >
                      {activeModuleConfig.availableFields.map((f) => (
                        <option key={f} value={f}>
                          {f}
                        </option>
                      ))}
                    </select>

                    <select
                      value={filter.operator}
                      onChange={(e) => updateFilter(filter.id, "operator", e.target.value)}
                      className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                    >
                      <option value="equals">equals</option>
                      <option value="contains">contains</option>
                      <option value="greater_than">greater than</option>
                      <option value="less_than">less than</option>
                    </select>

                    <input
                      value={filter.value}
                      onChange={(e) => updateFilter(filter.id, "value", e.target.value)}
                      placeholder="Value"
                      className="h-8 flex-1 rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    />

                    <button
                      type="button"
                      onClick={() => removeFilter(filter.id)}
                      className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        {/* Step 4: Configuration Form */}
        <section className={erpSectionClassName}>
          <div className="mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">4. Report Execution Parameters</h3>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Report Name *</Label>
              <input
                value={reportName}
                onChange={(e) => setReportName(e.target.value)}
                placeholder="e.g. Q2 FY26 Paid Invoices"
                className={selectClassName}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Date Range</Label>
              <select value={dateRange} onChange={(e) => setDateRange(e.target.value)} className={selectClassName}>
                {DATE_RANGES.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Output Format</Label>
              <select value={outputFormat} onChange={(e) => setOutputFormat(e.target.value)} className={selectClassName}>
                <option value="pdf">PDF Document (.pdf)</option>
                <option value="excel">Microsoft Excel (.xlsx)</option>
                <option value="csv">CSV Spreadsheet (.csv)</option>
                <option value="json">JSON Data Stream (.json)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Recurring Schedule</Label>
              <select value={schedule} onChange={(e) => setSchedule(e.target.value)} className={selectClassName}>
                <option value="Manual">Manual On-Demand</option>
                <option value="Daily">Daily at 08:00 AM</option>
                <option value="Weekly">Weekly (Every Monday)</option>
                <option value="Monthly">Monthly 1st Date</option>
              </select>
            </div>
          </div>

          <div className="mt-5 flex items-center gap-3">
            <button
              type="button"
              className={`${erpButtonClassName.primary} gap-2 cursor-pointer`}
              disabled={saving}
              onClick={() => void handleSave(true)}
            >
              <FileText className="h-4 w-4" />
              Save and Run Now
            </button>
            <button
              type="button"
              className={`${erpButtonClassName.secondary} cursor-pointer`}
              onClick={() => setPreviewActive(!previewActive)}
            >
              <Eye className="h-4 w-4" />
              {previewActive ? "Hide Preview" : "Show Live Preview"}
            </button>
          </div>
        </section>

        {/* Step 5: Live Query Preview Table */}
        {previewActive ? (
          <section className={erpPanelClassName}>
            <div className={erpPanelHeaderClassName}>
              <div className="flex items-center justify-between w-full">
                <div>
                  <h3 className={erpPanelTitleClassName}>Live Schema Preview</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Simulated result structure based on selected columns</p>
                </div>
                <Badge variant="outline" className="text-xs font-mono">
                  {selectedFields.length} Columns
                </Badge>
              </div>
            </div>
            <div className={erpPanelBodyClassName}>
              <div className={erpTableWrapClassName}>
                <table className="w-full text-xs">
                  <thead>
                    <tr>
                      {selectedFields.map((field) => (
                        <th key={field} className={erpTableThClassName}>
                          {field}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[1, 2, 3].map((rowIdx) => (
                      <tr key={rowIdx} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        {selectedFields.map((field) => (
                          <td key={field} className={erpTableTdClassName}>
                            <span className="font-mono text-slate-600 dark:text-slate-400">
                              {field.includes("Amount") || field.includes("Salary") || field.includes("Cost")
                                ? `₹${(rowIdx * 14500).toLocaleString("en-IN")}`
                                : field.includes("Date")
                                  ? "2026-08-23"
                                  : field.includes("Status")
                                    ? "Active / Paid"
                                    : `${field} Sample #${rowIdx}`}
                            </span>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        ) : null}

        {/* Saved Definitions Catalog */}
        <section className={erpPanelClassName}>
          <div className={erpPanelHeaderClassName}>
            <div>
              <h2 className={erpPanelTitleClassName}>Saved Custom Definitions</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Live query definitions stored for this tenant</p>
            </div>
          </div>
          <div className={erpPanelBodyClassName}>
            <div className={erpTableWrapClassName}>
              <table className="w-full text-xs">
                <thead>
                  <tr>
                    <th className={erpTableThClassName}>Report Name</th>
                    <th className={erpTableThClassName}>Module Source</th>
                    <th className={erpTableThClassName}>Last Executed</th>
                    <th className={erpTableThClassName}>Status</th>
                    <th className={erpTableThClassName}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5} className={`${erpTableTdClassName} py-8 text-center text-slate-400`}>
                        Loading definitions…
                      </td>
                    </tr>
                  ) : records.length === 0 ? (
                    <tr>
                      <td colSpan={5} className={`${erpTableTdClassName} py-8 text-center text-slate-400`}>
                        No custom reports created yet. Configure fields above and click Save.
                      </td>
                    </tr>
                  ) : (
                    records.map((report) => (
                      <tr key={report.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className={`${erpTableTdClassName} font-semibold text-slate-900 dark:text-white`}>{report.name}</td>
                        <td className={erpTableTdClassName}>
                          <Badge variant="secondary" className="text-[10px]">
                            {report.reportType}
                          </Badge>
                        </td>
                        <td className={`${erpTableTdClassName} text-slate-500 dark:text-slate-400`}>
                          {report.lastRunAt ? new Date(report.lastRunAt).toLocaleString("en-IN") : "Never"}
                        </td>
                        <td className={erpTableTdClassName}>
                          <Badge variant={report.status === "Active" ? "success" : "secondary"}>
                            {report.status || "Active"}
                          </Badge>
                        </td>
                        <td className={erpTableTdClassName}>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              className={`${erpButtonClassName.ghost} h-7 px-2 text-xs cursor-pointer`}
                              onClick={() => void handleRun(report.id)}
                            >
                              Run
                            </button>
                            <button
                              type="button"
                              className={`${erpButtonClassName.ghost} h-7 gap-1 px-2 text-xs cursor-pointer`}
                              onClick={() => void handleExport(report)}
                            >
                              <Download className="h-3 w-3" /> Export
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </StandardPageLayout>
  );
}

export default ReportBuilderManager;
