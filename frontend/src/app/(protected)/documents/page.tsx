"use client";

import React, { useState } from "react";
import { FileText, Plus, Download, ShieldCheck, CheckCircle2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlatformGlobalPageShell, KpiMetricItem } from "@/components/platform/PlatformGlobalPageShell";
import { notifySuccess } from "@/lib/notifications";

interface DocTemplateRow {
  id: string;
  title: string;
  category: "Letter Template" | "Policy Document" | "Certificate" | "ID Card";
  digitalSignatureRequired: boolean;
  version: string;
  updatedAt: string;
}

const SEED_DOC_TEMPLATES: DocTemplateRow[] = [
  { id: "doc_1", title: "Standard Employment Offer Letter", category: "Letter Template", digitalSignatureRequired: true, version: "v2.4", updatedAt: "2026-07-28" },
  { id: "doc_2", title: "Corporate Code of Conduct Policy 2026", category: "Policy Document", digitalSignatureRequired: false, version: "v1.0", updatedAt: "2026-07-01" },
  { id: "doc_3", title: "Employee Experience & Relieving Certificate", category: "Certificate", digitalSignatureRequired: true, version: "v3.1", updatedAt: "2026-07-20" },
  { id: "doc_4", title: "Enterprise Smart Employee ID Card Template", category: "ID Card", digitalSignatureRequired: false, version: "v1.2", updatedAt: "2026-07-15" },
];

export default function DocumentVaultPage() {
  const [docs] = useState<DocTemplateRow[]>(SEED_DOC_TEMPLATES);
  const [search, setSearch] = useState("");

  const filteredDocs = docs.filter((d) => {
    const q = search.toLowerCase();
    return !q || d.title.toLowerCase().includes(q) || d.category.toLowerCase().includes(q);
  });

  const kpis: KpiMetricItem[] = [
    { label: "Document Templates", value: docs.length, tone: "info", icon: <FileText className="h-3.5 w-3.5" />, subtext: "Vault" },
    { label: "Digital Signatures", value: "eSign PKI", tone: "positive", icon: <ShieldCheck className="h-3.5 w-3.5" />, subtext: "Cryptographic" },
    { label: "Encrypted Storage", value: "AES-256", tone: "positive", icon: <Lock className="h-3.5 w-3.5" />, subtext: "S3 Vault" },
    { label: "ID Card Generator", value: "Ready", tone: "warning", icon: <CheckCircle2 className="h-3.5 w-3.5" />, subtext: "QR Code" },
  ];

  return (
    <PlatformGlobalPageShell
      title="Enterprise Document Center & Digital Signatures"
      subtitle="Manage HR letter templates, company policy documents, employee ID card generators, and cryptographic digital signatures."
      categoryTag="Core HRMS: Document Governance"
      kpiMetrics={kpis}
      searchPlaceholder="Filter document title or category..."
      searchValue={search}
      onSearchChange={setSearch}
      primaryActionLabel="New Document Template"
      onPrimaryAction={() => notifySuccess("Document template designer opened.")}
      primaryActionIcon={<Plus className="h-4 w-4 mr-1.5" />}
    >
      <div className="erp-table-wrap rounded-none border-0 shadow-none">
        <table className="erp-table">
          <thead className="erp-thead">
            <tr>
              <th className="erp-th">Document Template Title</th>
              <th className="erp-th">Category</th>
              <th className="erp-th">Digital eSign</th>
              <th className="erp-th">Version</th>
              <th className="erp-th">Last Updated</th>
              <th className="erp-th text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredDocs.map((d) => (
              <tr key={d.id} className="erp-tr hover:bg-slate-50/80 dark:hover:bg-slate-900/50 transition-colors">
                <td className="erp-td font-semibold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <FileText className="h-4 w-4 text-indigo-500" />
                  {d.title}
                </td>
                <td className="erp-td">
                  <Badge variant="outline" className="text-xs font-normal">
                    {d.category}
                  </Badge>
                </td>
                <td className="erp-td">
                  <span className={d.digitalSignatureRequired ? "erp-chip erp-chip-success" : "erp-chip erp-chip-neutral"}>
                    {d.digitalSignatureRequired ? "Required" : "Optional"}
                  </span>
                </td>
                <td className="erp-td font-mono text-xs text-indigo-600 dark:text-indigo-400 font-bold">{d.version}</td>
                <td className="erp-td font-mono text-xs text-slate-500">{d.updatedAt}</td>
                <td className="erp-td text-right">
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-indigo-600" onClick={() => notifySuccess(`Downloading ${d.title}`)}>
                    <Download className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PlatformGlobalPageShell>
  );
}
