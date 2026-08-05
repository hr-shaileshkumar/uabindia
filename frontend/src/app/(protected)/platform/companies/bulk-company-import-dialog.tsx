"use client";

import { useState, useRef } from "react";
import { useCompanyMutations, useTenants } from "@/features/companies/hooks";
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

interface BulkCompanyImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete: () => void;
}

interface ImportRow {
  name: string;
  legalName?: string;
  code?: string;
  city?: string;
  email?: string;
  errors: string[];
}

export function BulkCompanyImportDialog({
  open,
  onOpenChange,
  onImportComplete,
}: BulkCompanyImportDialogProps) {
  const [csvText, setCsvText] = useState("");
  const [parsedRows, setParsedRows] = useState<ImportRow[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const tenantsQuery = useTenants(true); // SuperAdmin mode to see all tenants
  const { createCompanyMutation } = useCompanyMutations();

  const tenants = tenantsQuery.data?.tenants || [];

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

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const columns = line.split(",").map((c) => c.trim().replace(/^["']|["']$/g, ""));
      
      // Skip header row
      if (i === 0 && columns.some(col => col.toLowerCase().includes("legal") || col.toLowerCase().includes("email"))) {
        continue;
      }

      if (columns.length < 1) continue;

      const [name, legalName, code, city, email] = columns;
      const errors: string[] = [];

      if (!name) errors.push("Company Name is required");
      if (email && !email.includes("@")) errors.push("Valid Email is required");

      rows.push({
        name,
        legalName: legalName || undefined,
        code: code || undefined,
        city: city || undefined,
        email: email || undefined,
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

    const selectedTenant = tenants.find((t) => t.id === selectedTenantId);
    if (!selectedTenant) {
      notifyError("Please select a target Tenant for the import.");
      return;
    }

    setIsImporting(true);
    setImportProgress(0);
    let successCount = 0;

    for (let i = 0; i < validRows.length; i++) {
      const row = validRows[i];
      try {
        await createCompanyMutation.mutateAsync({
          payload: {
            name: row.name,
            legalName: row.legalName,
            code: row.code,
            city: row.city,
            email: row.email,
            isActive: true,
          },
          tenant: selectedTenant.subdomain,
        });
        successCount++;
      } catch (err: unknown) {
        console.error(`Failed to import company ${row.name}:`, err);
      }
      setImportProgress(Math.round(((i + 1) / validRows.length) * 100));
    }

    setIsImporting(false);
    notifySuccess(`Successfully imported ${successCount} of ${validRows.length} companies.`);
    onImportComplete();
    onOpenChange(false);
    setCsvText("");
    setParsedRows([]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Import Companies</DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Upload a CSV file or paste raw CSV data to create multiple companies.
          </p>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="targetTenant">Target Tenant *</Label>
            <select
              id="targetTenant"
              value={selectedTenantId}
              onChange={(e) => setSelectedTenantId(e.target.value)}
              className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <option value="">Select Tenant...</option>
              {tenants.map((tenant) => (
                <option key={tenant.id} value={tenant.id}>
                  {tenant.name} ({tenant.subdomain})
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <Label>Expected Format (CSV)</Label>
            <div className="bg-slate-100 dark:bg-slate-900 p-3 rounded-md font-mono text-xs text-slate-700 dark:text-slate-300">
              Name,LegalName,Code,City,Email
              <br />
              Acme Industries,Acme Industries Ltd,ACM,New York,info@acme.com
              <br />
              Beta Logistics,Beta Logistics LLC,BTA,Chicago,contact@beta.com
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
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none"
            />
          </div>

          {parsedRows.length > 0 && (
            <div className="space-y-2">
              <Label>Preview & Validation ({parsedRows.length} Rows)</Label>
              <div className="border rounded-md divide-y max-h-40 overflow-y-auto">
                {parsedRows.map((row, idx) => (
                  <div key={idx} className="p-2 flex items-center justify-between text-xs">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-semibold">{row.name || "(No Name)"}</span>
                      <span className="text-slate-500">
                        {row.code ? `[${row.code}] ` : ""}{row.city || "No City"} · {row.email || "No Email"}
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
                <span>Importing Companies...</span>
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
            disabled={isImporting || !selectedTenantId || parsedRows.filter((r) => r.errors.length === 0).length === 0}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            Import Companies
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
