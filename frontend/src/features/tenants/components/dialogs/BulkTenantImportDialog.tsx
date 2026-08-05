"use client";

import { useState, useRef } from "react";
import { useCreateTenant } from "../../hooks/useTenants";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { notifyError, notifySuccess } from "@/lib/notifications";
import { Upload, AlertCircle, CheckCircle } from "lucide-react";

interface BulkTenantImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete: () => void;
}

interface ImportRow {
  name: string;
  subdomain: string;
  adminName: string;
  adminEmail: string;
  subscriptionPlan: "Basic" | "Premium" | "Enterprise";
  status: "active" | "inactive" | "suspended" | "trial";
  errors: string[];
}

export function BulkTenantImportDialog({
  open,
  onOpenChange,
  onImportComplete,
}: BulkTenantImportDialogProps) {
  const [csvText, setCsvText] = useState("");
  const [parsedRows, setParsedRows] = useState<ImportRow[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const createTenantMutation = useCreateTenant();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvText(text);
      parseCsv(text);
    };
    reader.readAsText(file);
  };

  const parseCsv = (text: string) => {
    const lines = text.split(/\r?\n/);
    const rows: ImportRow[] = [];

    // Simple parsing, skipping empty lines and header if it contains keywords
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const columns = line.split(",").map((c) => c.trim().replace(/^["']|["']$/g, ""));
      
      // Skip header row
      if (i === 0 && columns.some(col => col.toLowerCase().includes("subdomain") || col.toLowerCase().includes("email"))) {
        continue;
      }

      if (columns.length < 4) continue;

      const [name, subdomain, adminName, adminEmail, plan, status] = columns;
      const errors: string[] = [];

      if (!name) errors.push("Tenant Name is required");
      if (!subdomain || !/^[a-z0-9-]+$/.test(subdomain)) {
        errors.push("Subdomain is required and must be alphanumeric with hyphens");
      }
      if (!adminName) errors.push("Admin Name is required");
      if (!adminEmail || !adminEmail.includes("@")) errors.push("Valid Admin Email is required");

      const normalizedPlan = (plan === "Premium" || plan === "Enterprise") ? plan : "Basic";
      const normalizedStatus = (status === "active" || status === "inactive" || status === "suspended") ? status : "trial";

      rows.push({
        name,
        subdomain,
        adminName,
        adminEmail,
        subscriptionPlan: normalizedPlan,
        status: normalizedStatus,
        errors,
      });
    }

    setParsedRows(rows);
  };

  const handleImport = async () => {
    const validRows = parsedRows.filter((r) => r.errors.length === 0);
    if (validRows.length === 0) {
      notifyError("No valid rows to import.");
      return;
    }

    setIsImporting(true);
    setImportProgress(0);
    let successCount = 0;

    for (let i = 0; i < validRows.length; i++) {
      const row = validRows[i];
      try {
        await createTenantMutation.mutateAsync({
          name: row.name,
          subdomain: row.subdomain,
          adminName: row.adminName,
          adminEmail: row.adminEmail,
          subscriptionPlan: row.subscriptionPlan,
          status: row.status,
          whiteLabelEnabled: false,
          timezone: "UTC",
        });
        successCount++;
      } catch (err: unknown) {
        console.error(`Failed to import tenant ${row.name}:`, err);
      }
      setImportProgress(Math.round(((i + 1) / validRows.length) * 100));
    }

    setIsImporting(false);
    notifySuccess(`Successfully imported ${successCount} of ${validRows.length} tenants.`);
    onImportComplete();
    onOpenChange(false);
    setCsvText("");
    setParsedRows([]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Import Tenants</DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Upload a CSV file or paste raw CSV data to provision multiple tenants.
          </p>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex flex-col gap-2">
            <Label>Expected Format (CSV)</Label>
            <div className="bg-slate-100 dark:bg-slate-900 p-3 rounded-md font-mono text-xs text-slate-700 dark:text-slate-300">
              Name,Subdomain,AdminName,AdminEmail,Plan,Status
              <br />
              Acme Corp,acme,Jane Doe,jane@acme.com,Enterprise,active
              <br />
              Beta LLC,beta,John Smith,john@beta.com,Basic,trial
            </div>
          </div>

          <div className="flex items-center gap-4">
            <input
              type="file"
              accept=".csv"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex gap-2 items-center justify-center border-dashed border-2 h-20"
            >
              <Upload className="h-5 w-5" />
              Upload CSV File
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="csvText">Or Paste CSV Content</Label>
            <textarea
              id="csvText"
              rows={4}
              value={csvText}
              onChange={(e) => {
                setCsvText(e.target.value);
                parseCsv(e.target.value);
              }}
              placeholder="Paste your CSV rows here..."
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>

          {parsedRows.length > 0 && (
            <div className="space-y-2">
              <Label>Preview & Validation ({parsedRows.length} Rows)</Label>
              <div className="border rounded-md divide-y max-h-48 overflow-y-auto">
                {parsedRows.map((row, idx) => (
                  <div key={idx} className="p-2 flex items-center justify-between text-xs">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-semibold">{row.name || "(No Name)"}</span>
                      <span className="text-slate-500">
                        {row.subdomain}.example.com · {row.adminEmail}
                      </span>
                    </div>
                    <div>
                      {row.errors.length > 0 ? (
                        <div className="flex items-center gap-1 text-red-600 font-medium" title={row.errors.join(", ")}>
                          <AlertCircle className="h-4 w-4 shrink-0" />
                          Invalid
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-emerald-600 font-medium">
                          <CheckCircle className="h-4 w-4 shrink-0" />
                          Ready
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {isImporting && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span>Importing Tenants...</span>
                <span>{importProgress}%</span>
              </div>
              <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-600 transition-all duration-300"
                  style={{ width: `${importProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isImporting}>
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={isImporting || parsedRows.filter((r) => r.errors.length === 0).length === 0}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            Import Tenants
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
