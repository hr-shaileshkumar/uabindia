"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { CrudHeaderStats } from "@/components/erp/crud-workspace";
import { FileText, Filter, Table, RefreshCw, Download, Settings, Layout } from "lucide-react";

export default function ReportsBuilderPage() {
  const [reportName, setReportName] = useState("Monthly Sales Summary");
  const [reportType, setReportType] = useState("sales");
  const [dateRange, setDateRange] = useState("last30days");

  const reportTypes = [
    { id: "sales", label: "Sales Reports", icon: Layout, description: "Sales orders, invoices, and revenue analysis" },
    { id: "inventory", label: "Inventory Reports", icon: Table, description: "Stock levels, movements, and valuations" },
    { id: "customers", label: "Customer Reports", icon: FileText, description: "Customer activity and lifetime value" },
    { id: "finance", label: "Financial Reports", icon: Filter, description: "Profit & loss, balance sheet, cash flow" },
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

  const recentReports = [
    { id: "1", name: "Monthly Sales Summary", type: "sales", date: "2 hours ago", status: "Ready" },
    { id: "2", name: "Inventory Valuation", type: "inventory", date: "Yesterday", status: "Ready" },
    { id: "3", name: "Customer Activity", type: "customers", date: "Yesterday", status: "Ready" },
    { id: "4", name: "Profit & Loss Statement", type: "finance", date: "2 days ago", status: "Ready" },
    { id: "5", name: "Payroll Summary", type: "hrms", date: "Last week", status: "Ready" },
  ];

  return (
    <StandardPageLayout
      title="Reports Builder"
      subtitle="Create, customize, and schedule reports across all ERP modules."
      eyebrow="Reports / Builder"
      icon="file-text"
      meta={
        <CrudHeaderStats
          items={[
            { label: "Available", value: reportTypes.length, helper: "report types" },
            { label: "Recent", value: recentReports.length, helper: "generated" },
            { label: "Saved", value: "12", helper: "templates" },
            { label: "Scheduled", value: "3", tone: "warning", helper: "scheduled runs" },
          ]}
        />
      }
      actions={
        <div className="flex flex-wrap gap-2">
          <Button variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button>
            <FileText className="mr-2 h-4 w-4" />
            Create Report
          </Button>
        </div>
      }
    >
      {/* Report Types Grid */}
      <Card>
        <CardHeader>
          <CardTitle>Report Types</CardTitle>
          <CardDescription>Select a report type to start building</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {reportTypes.map((type) => (
              <div
                key={type.id}
                className="rounded-lg border border-slate-200 bg-white p-4 transition-all hover:border-indigo-300 hover:shadow-md hover:bg-slate-50/50"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-indigo-100 p-2 text-indigo-600">
                      <type.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-slate-100">{type.label}</h3>
                      <p className="text-xs text-slate-500">{type.description}</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="h-6 text-xs">
                    Available
                  </Badge>
                </div>
                <Button variant="outline" className="mt-4 w-full text-xs" size="sm">
                  Use Template
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Report Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Configure Report</CardTitle>
          <CardDescription>Set parameters for your report</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="reportName">Report Name</Label>
              <Input
                id="reportName"
                value={reportName}
                onChange={(e) => setReportName(e.target.value)}
                placeholder="Enter report name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reportType">Report Type</Label>
              <select
                id="reportType"
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="h-10 w-full rounded-[var(--erp-radius-control)] border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-200"
              >
                {reportTypes.map((type) => (
                  <option key={type.id} value={type.id}>{type.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateRange">Date Range</Label>
              <select
                id="dateRange"
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="h-10 w-full rounded-[var(--erp-radius-control)] border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-200"
              >
                {dateRanges.map((range) => (
                  <option key={range.id} value={range.id}>{range.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="format">Output Format</Label>
              <select
                id="format"
                defaultValue="pdf"
                className="h-10 w-full rounded-[var(--erp-radius-control)] border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-200"
              >
                <option value="pdf">PDF</option>
                <option value="excel">Excel</option>
                <option value="csv">CSV</option>
                <option value="json">JSON</option>
              </select>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <Button>
              <FileText className="mr-2 h-4 w-4" />
              Preview Report
            </Button>
            <Button variant="outline">
              <Settings className="mr-2 h-4 w-4" />
              Customize Fields
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Reports */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Reports</CardTitle>
          <CardDescription>Previously generated reports and templates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-xs uppercase text-slate-700">
                <tr>
                  <th className="px-4 py-3">Report Name</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Generated</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {recentReports.map((report) => (
                  <tr key={report.id} className="border-b border-slate-200 hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{report.name}</td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary" className="text-xs">
                        {reportType}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{report.date}</td>
                    <td className="px-4 py-3">
                      <Badge variant="success">{report.status}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </StandardPageLayout>
  );
}
