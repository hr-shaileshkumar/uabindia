"use client";

import { useCallback, useEffect, useState } from "react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { CrudHeaderStats } from "@/components/erp/crud-workspace";
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
} from "@/components/erp/erpStyles";
import { FileText, Filter, Table, RefreshCw, Layout, Download } from "lucide-react";
import Link from "next/link";
import { reportsApi } from "@/services/modules";
import { notifyError, notifySuccess } from "@/lib/notifications";
import { getApiErrorMessage } from "@/lib/api-errors";
import { ErpRefreshButton } from "@/components/erp/erp-page-kit";
import { ROUTES } from "@/constants/routes";

type CustomReportRow = {
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

const reportTypes = [
  { id: "sales", label: "Sales Reports", icon: Layout, description: "Sales orders, invoices, and revenue analysis" },
  { id: "inventory", label: "Inventory Reports", icon: Table, description: "Stock levels, movements, and valuations" },
  { id: "customers", label: "Customer Reports", icon: FileText, description: "Customer activity and lifetime value" },
  { id: "finance", label: "Financial Reports", icon: Filter, description: "Profit & loss, journals, and cash movement" },
  { id: "hrms", label: "HR & Payroll Reports", icon: RefreshCw, description: "Employee data, payroll, and attendance" },
];

const dateRanges = [
  { id: "today", label: "Today" },
  { id: "yesterday", label: "Yesterday" },
  { id: "last7days", label: "Last 7 Days" },
  { id: "last30days", label: "Last 30 Days" },
  { id: "thisMonth", label: "This Month" },
  { id: "lastMonth", label: "Last Month" },
  { id: "thisYear", label: "This Year" },
];

const asList = (raw: unknown): CustomReportRow[] => {
  if (Array.isArray(raw)) return raw as CustomReportRow[];
  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    if (Array.isArray(obj.data)) return obj.data as CustomReportRow[];
  }
  return [];
};

export default function ReportsBuilderPage() {
  const [reportName, setReportName] = useState("");
  const [reportType, setReportType] = useState("sales");
  const [dateRange, setDateRange] = useState("last30days");
  const [outputFormat, setOutputFormat] = useState("pdf");
  const [schedule, setSchedule] = useState("Manual");
  const [records, setRecords] = useState<CustomReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

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

  const useTemplate = (typeId: string, label: string) => {
    setReportType(typeId);
    if (!reportName.trim()) setReportName(label);
  };

  const payload = () => ({
    name: reportName.trim(),
    reportType,
    dateRange,
    outputFormat,
    schedule,
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
        notifySuccess("Report saved and run.");
      } else {
        notifySuccess("Report saved.");
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

  const handleActivate = async (id: string) => {
    try {
      await reportsApi.custom.activate(id);
      notifySuccess("Report activated.");
      void load();
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Activate failed."));
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
      void load();
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Export failed."));
    }
  };

  const selectClassName = `${erpFormInputClassName} px-3`;

  return (
    <StandardPageLayout
      title="Reports Builder"
      icon="file-text"
      meta={
        <CrudHeaderStats
          items={[
            { label: "Types", value: reportTypes.length, helper: "templates" },
            { label: "Saved", value: loading ? "…" : records.length, helper: "reports" },
            {
              label: "Scheduled",
              value: loading ? "…" : records.filter((r) => r.schedule && r.schedule !== "Manual").length,
              tone: "warning",
              helper: "recurring",
            },
          ]}
        />
      }
      actions={
        <div className="flex flex-wrap gap-2">
          <Link href={ROUTES.REPORTS_CUSTOM} className={erpButtonClassName.secondary}>
            Custom catalog
          </Link>
          <ErpRefreshButton onClick={() => void load()} loading={loading} />
          <button
            type="button"
            className={`${erpButtonClassName.primary} gap-2`}
            disabled={saving}
            onClick={() => void handleSave(false)}
          >
            <FileText className="h-4 w-4" />
            {saving ? "Saving…" : "Save report"}
          </button>
        </div>
      }
    >
      {error ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>
      ) : null}

      <section className={erpPanelClassName}>
        <div className={erpPanelHeaderClassName}>
          <div>
            <h2 className={erpPanelTitleClassName}>Report types</h2>
            <p className="text-sm text-slate-500">Select a template to prefill the builder</p>
          </div>
        </div>
        <div className={erpPanelBodyClassName}>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {reportTypes.map((type) => (
              <div
                key={type.id}
                className={`rounded-lg border bg-white p-4 transition-all hover:border-slate-300 hover:bg-slate-50/50 hover:shadow-sm ${
                  reportType === type.id ? "border-[#2563eb]" : "border-slate-200"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-slate-100 p-2 text-slate-700">
                      <type.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">{type.label}</h3>
                      <p className="text-xs text-slate-500">{type.description}</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="h-6 text-xs">
                    Live
                  </Badge>
                </div>
                <button
                  type="button"
                  className={`${erpButtonClassName.secondary} mt-4 h-8 w-full text-xs`}
                  onClick={() => useTemplate(type.id, type.label)}
                >
                  Use template
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={erpSectionClassName}>
        <div className="mb-4 border-b border-slate-100 pb-3">
          <h2 className="text-base font-semibold text-slate-900">Configure report</h2>
          <p className="text-sm text-slate-500">Parameters are stored with the saved definition</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="reportName">Report name</Label>
            <input
              id="reportName"
              value={reportName}
              onChange={(e) => setReportName(e.target.value)}
              placeholder="Enter report name"
              className={`${erpFormInputClassName} px-3`}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reportType">Report type</Label>
            <select id="reportType" value={reportType} onChange={(e) => setReportType(e.target.value)} className={selectClassName}>
              {reportTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="dateRange">Date range</Label>
            <select id="dateRange" value={dateRange} onChange={(e) => setDateRange(e.target.value)} className={selectClassName}>
              {dateRanges.map((range) => (
                <option key={range.id} value={range.id}>
                  {range.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="format">Output format</Label>
            <select id="format" value={outputFormat} onChange={(e) => setOutputFormat(e.target.value)} className={selectClassName}>
              <option value="pdf">PDF</option>
              <option value="excel">Excel</option>
              <option value="csv">CSV</option>
              <option value="json">JSON</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="schedule">Schedule</Label>
            <select id="schedule" value={schedule} onChange={(e) => setSchedule(e.target.value)} className={selectClassName}>
              <option value="Manual">Manual</option>
              <option value="Daily">Daily</option>
              <option value="Weekly">Weekly</option>
              <option value="Monthly">Monthly</option>
            </select>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <button
            type="button"
            className={`${erpButtonClassName.primary} gap-2`}
            disabled={saving}
            onClick={() => void handleSave(true)}
          >
            <FileText className="h-4 w-4" />
            Save and run
          </button>
        </div>
      </section>

      <section className={erpPanelClassName}>
        <div className={erpPanelHeaderClassName}>
          <div>
            <h2 className={erpPanelTitleClassName}>Saved reports</h2>
            <p className="text-sm text-slate-500">Live definitions from this tenant</p>
          </div>
        </div>
        <div className={erpPanelBodyClassName}>
          <div className={erpTableWrapClassName}>
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className={erpTableThClassName}>Report name</th>
                  <th className={erpTableThClassName}>Type</th>
                  <th className={erpTableThClassName}>Last run</th>
                  <th className={erpTableThClassName}>Status</th>
                  <th className={erpTableThClassName}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className={`${erpTableTdClassName} py-8 text-center text-slate-500`}>
                      Loading…
                    </td>
                  </tr>
                ) : records.length === 0 ? (
                  <tr>
                    <td colSpan={5} className={`${erpTableTdClassName} py-8 text-center text-slate-500`}>
                      No saved reports yet. Use a template and save.
                    </td>
                  </tr>
                ) : (
                  records.map((report) => (
                    <tr key={report.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                      <td className={`${erpTableTdClassName} font-medium text-slate-900`}>
                        {report.name}
                        {report.lastRunSummary ? <p className="text-xs font-normal text-slate-500">{report.lastRunSummary}</p> : null}
                      </td>
                      <td className={erpTableTdClassName}>
                        <Badge variant="secondary" className="text-xs">
                          {report.reportType}
                        </Badge>
                      </td>
                      <td className={`${erpTableTdClassName} text-slate-500`}>
                        {report.lastRunAt ? new Date(report.lastRunAt).toLocaleString("en-IN") : "Never"}
                      </td>
                      <td className={erpTableTdClassName}>
                        <Badge variant={report.status === "Active" ? "success" : "secondary"}>{report.status}</Badge>
                      </td>
                      <td className={erpTableTdClassName}>
                        <div className="flex flex-wrap gap-1">
                          <button
                            type="button"
                            className={`${erpButtonClassName.ghost} h-8 px-2`}
                            onClick={() => void handleRun(report.id)}
                          >
                            Run
                          </button>
                          {report.status !== "Active" ? (
                            <button
                              type="button"
                              className={`${erpButtonClassName.ghost} h-8 px-2`}
                              onClick={() => void handleActivate(report.id)}
                            >
                              Activate
                            </button>
                          ) : null}
                          <button
                            type="button"
                            className={`${erpButtonClassName.ghost} h-8 gap-1 px-2`}
                            onClick={() => void handleExport(report)}
                            title="Export JSON"
                          >
                            <Download className="h-3.5 w-3.5" />
                            Export
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
    </StandardPageLayout>
  );
}
