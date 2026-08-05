"use client";

import { useState } from "react";
import { FileText, Plus, Upload, Folder, Shield, Download, Trash2, Eye } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { FilterBar } from "@/components/ui/filter-bar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Document } from "@/types";

const INITIAL_DOCS: Document[] = [
  { id: "1", name: "Master Enterprise Service Agreement 2026.pdf", type: "Legal", size: 2400000, uploadedBy: "Sarah Jenkins", uploadedAt: "2026-08-01" },
  { id: "2", name: "Employee Handbook & HR Policies.pdf", type: "HR Policies", size: 4800000, uploadedBy: "HR Admin", uploadedAt: "2026-07-15" },
  { id: "3", name: "GST Quarterly Tax Filing Q1.pdf", type: "Finance", size: 1100000, uploadedBy: "Michael Chen", uploadedAt: "2026-07-10" },
];

export function DocumentList() {
  const [docs] = useState<Document[]>(INITIAL_DOCS);
  const [search, setSearch] = useState("");

  const filtered = docs.filter((d) => d.name.toLowerCase().includes(search.toLowerCase()) || (d.type || "").toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Document Vault & File Storage"
        subtitle="Secure enterprise document repository, version control, access policies, and compliance filing"
        breadcrumbs={[
          { label: "Documents", href: "/documents" },
          { label: "All Documents" },
        ]}
        actions={
          <Button size="sm" className="gap-2">
            <Upload className="h-4 w-4" />
            Upload File
          </Button>
        }
      />

      <FilterBar searchPlaceholder="Search document name or category..." searchValue={search} onSearchChange={setSearch} />

      <div className="space-y-3">
        {filtered.map((doc) => (
          <Card key={doc.id} className="hover:border-indigo-500/50 transition-colors">
            <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-10 w-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-foreground text-sm truncate">{doc.name}</p>
                    <Badge variant="outline" className="text-[10px]">
                      {doc.type || "General"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Size: {doc.size ? `${(doc.size / 1000000).toFixed(1)} MB` : "N/A"} • Uploaded by: {doc.uploadedBy} • Date: {doc.uploadedAt}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button size="sm" variant="ghost" className="h-8 px-2 text-xs">
                  <Eye className="h-3.5 w-3.5 mr-1" /> Preview
                </Button>
                <Button size="sm" variant="outline" className="h-8 px-2 text-xs gap-1">
                  <Download className="h-3.5 w-3.5" /> Download
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
