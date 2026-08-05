"use client";

import { useState } from "react";
import { Download, FileSpreadsheet, FileText, Check, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface ExportDialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  columns: { key: string; label: string }[];
  onExport: (selectedColumns: string[], format: "csv" | "excel" | "pdf") => void;
}

export function ExportDialog({
  open,
  onClose,
  title = "Export Data Records",
  columns,
  onExport,
}: ExportDialogProps) {
  const [selectedFormat, setSelectedFormat] = useState<"csv" | "excel" | "pdf">("csv");
  const [selectedCols, setSelectedCols] = useState<string[]>(columns.map((c) => c.key));

  const toggleColumn = (key: string) => {
    if (selectedCols.includes(key)) {
      if (selectedCols.length === 1) return; // keep at least 1
      setSelectedCols(selectedCols.filter((k) => k !== key));
    } else {
      setSelectedCols([...selectedCols, key]);
    }
  };

  const toggleAll = () => {
    if (selectedCols.length === columns.length) {
      setSelectedCols([columns[0].key]);
    } else {
      setSelectedCols(columns.map((c) => c.key));
    }
  };

  const handleConfirm = () => {
    onExport(selectedCols, selectedFormat);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-indigo-500" />
            {title}
          </DialogTitle>
          <DialogDescription>Select format and columns to include in the exported report.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Format Selector */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Export Format</Label>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setSelectedFormat("csv")}
                className={`flex flex-col items-center justify-center p-3 rounded-lg border text-xs font-medium transition-colors ${
                  selectedFormat === "csv" ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400" : "border-border hover:bg-muted"
                }`}
              >
                <FileText className="h-5 w-5 mb-1" />
                CSV Format
              </button>
              <button
                onClick={() => setSelectedFormat("excel")}
                className={`flex flex-col items-center justify-center p-3 rounded-lg border text-xs font-medium transition-colors ${
                  selectedFormat === "excel" ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400" : "border-border hover:bg-muted"
                }`}
              >
                <FileSpreadsheet className="h-5 w-5 mb-1" />
                Excel (.xlsx)
              </button>
              <button
                onClick={() => setSelectedFormat("pdf")}
                className={`flex flex-col items-center justify-center p-3 rounded-lg border text-xs font-medium transition-colors ${
                  selectedFormat === "pdf" ? "border-rose-500 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400" : "border-border hover:bg-muted"
                }`}
              >
                <FileText className="h-5 w-5 mb-1 text-rose-500" />
                PDF Document
              </button>
            </div>
          </div>

          {/* Column Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Included Fields ({selectedCols.length}/{columns.length})</Label>
              <button onClick={toggleAll} className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">
                {selectedCols.length === columns.length ? "Deselect All" : "Select All"}
              </button>
            </div>
            <div className="max-h-48 overflow-y-auto space-y-2 p-3 rounded-lg border border-border bg-muted/20">
              {columns.map((col) => (
                <div key={col.key} className="flex items-center space-x-2 text-sm">
                  <Checkbox
                    id={`col-${col.key}`}
                    checked={selectedCols.includes(col.key)}
                    onCheckedChange={() => toggleColumn(col.key)}
                  />
                  <Label htmlFor={`col-${col.key}`} className="text-sm font-normal cursor-pointer">
                    {col.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} className="gap-2">
            <Download className="h-4 w-4" /> Download Report
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
