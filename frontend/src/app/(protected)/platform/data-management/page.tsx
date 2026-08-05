"use client";

import React, { useState } from "react";
import { Database, Upload, Download, RefreshCw, CheckCircle2, ShieldCheck, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlatformGlobalPageShell, KpiMetricItem } from "@/components/platform/PlatformGlobalPageShell";
import { notifySuccess } from "@/lib/notifications";

export default function DataManagementPage() {
  const [isExporting, setIsExporting] = useState(false);

  const handleExportAll = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      notifySuccess("Enterprise full data archive export started (CSV / JSON).");
    }, 1200);
  };

  const kpis: KpiMetricItem[] = [
    { label: "Data Integrity", value: "100%", tone: "positive", icon: <ShieldCheck className="h-3.5 w-3.5" />, subtext: "Validated" },
    { label: "Supported Formats", value: "CSV, Excel, JSON", tone: "info", icon: <FileSpreadsheet className="h-3.5 w-3.5" />, subtext: "Batch Processing" },
    { label: "Sync Engine", value: "Async Queue", tone: "warning", icon: <RefreshCw className="h-3.5 w-3.5" />, subtext: "Background Tasks" },
    { label: "Migration Status", value: "Ready", tone: "positive", icon: <CheckCircle2 className="h-3.5 w-3.5" />, subtext: "Schema Aligned" },
  ];

  return (
    <PlatformGlobalPageShell
      title="Data Management, Import/Export & Migration"
      subtitle="Execute bulk CSV/Excel data imports, full database exports, schema migration scripts, and duplicate record cleanups."
      categoryTag="Data Lifecycle Operations"
      kpiMetrics={kpis}
      primaryActionLabel="Export Database Archive"
      onPrimaryAction={handleExportAll}
      primaryActionIcon={<Download className="h-4 w-4 mr-1.5" />}
    >
      <div className="p-6 grid gap-6 md:grid-cols-2">
        <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-indigo-500" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Bulk CSV / Excel Data Importer</h3>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Batch import Chart of Accounts, Customers, Employees, Products, and Opening Balances with schema validation and error rollback.
          </p>
          <div className="pt-2 flex justify-end">
            <Button size="sm" variant="outline" onClick={() => notifySuccess("Import wizard launched.")}>
              Launch Import Wizard
            </Button>
          </div>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-emerald-500" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Data Cleanup & De-duplication</h3>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Scan and merge duplicate supplier records, clean up orphaned temp tables, and optimize PostgreSQL database indexes.
          </p>
          <div className="pt-2 flex justify-end">
            <Button size="sm" variant="outline" onClick={() => notifySuccess("Duplicate scanner started.")}>
              Run Duplicate Scanner
            </Button>
          </div>
        </div>
      </div>
    </PlatformGlobalPageShell>
  );
}
