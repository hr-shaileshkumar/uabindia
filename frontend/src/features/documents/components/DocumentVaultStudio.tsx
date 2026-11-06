"use client";

import React, { useState, useMemo } from "react";
import {
  FileText,
  Folder,
  Upload,
  Download,
  Share2,
  Trash2,
  Lock,
  Eye,
  Plus,
  Search,
  Filter,
  FileCheck2,
  Building2,
  HardDrive,
  Shield,
  FileSpreadsheet,
  Clock,
} from "lucide-react";
import { notifySuccess, notifyError } from "@/lib/notifications";

export interface VaultDocument {
  id: string;
  name: string;
  category: "CONTRACTS" | "PROCUREMENT" | "HR_EMPLOYEE" | "COMPLIANCE" | "FINANCE";
  sizeMb: number;
  version: string;
  accessLevel: "PUBLIC" | "INTERNAL" | "CONFIDENTIAL";
  modifiedAt: string;
  modifiedBy: string;
  fileType: "PDF" | "DOCX" | "XLSX" | "ZIP";
}

export const INITIAL_DOCS: VaultDocument[] = [
  {
    id: "doc-1",
    name: "Master Sales Agreement - Bharat Heavy Electricals (BHEL).pdf",
    category: "CONTRACTS",
    sizeMb: 4.8,
    version: "v2.1",
    accessLevel: "CONFIDENTIAL",
    modifiedAt: "Yesterday, 04:15 PM",
    modifiedBy: "Rohan Varma",
    fileType: "PDF",
  },
  {
    id: "doc-2",
    name: "FY 2026-27 Q2 Consolidated Financial Statements & Trial Balance.xlsx",
    category: "FINANCE",
    sizeMb: 8.2,
    version: "v1.4",
    accessLevel: "CONFIDENTIAL",
    modifiedAt: "Today, 10:30 AM",
    modifiedBy: "Vikram Seth (CA)",
    fileType: "XLSX",
  },
  {
    id: "doc-3",
    name: "ISO 9001:2015 Quality Management Certificate - Pune Plant.pdf",
    category: "COMPLIANCE",
    sizeMb: 2.1,
    version: "v3.0",
    accessLevel: "INTERNAL",
    modifiedAt: "28 Oct 2026",
    modifiedBy: "Ganesh Kulkarni",
    fileType: "PDF",
  },
  {
    id: "doc-4",
    name: "Purchase Order PO-2026-8841 (Industrial Servo Motors).pdf",
    category: "PROCUREMENT",
    sizeMb: 1.2,
    version: "v1.0",
    accessLevel: "INTERNAL",
    modifiedAt: "Today, 09:15 AM",
    modifiedBy: "Sanjay Deshmukh",
    fileType: "PDF",
  },
  {
    id: "doc-5",
    name: "Employee Handbook & Code of Conduct 2026-27.docx",
    category: "HR_EMPLOYEE",
    sizeMb: 3.5,
    version: "v5.2",
    accessLevel: "PUBLIC",
    modifiedAt: "15 Oct 2026",
    modifiedBy: "Ramesh Pawar",
    fileType: "DOCX",
  },
];

export function DocumentVaultStudio() {
  const [docs, setDocs] = useState<VaultDocument[]>(INITIAL_DOCS);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  const filteredDocs = useMemo(() => {
    return docs.filter((d) => {
      const matchCat = selectedCategory === "ALL" || d.category === selectedCategory;
      const matchSearch =
        d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.modifiedBy.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [docs, selectedCategory, searchQuery]);

  const totalStorageMb = useMemo(() => docs.reduce((sum, d) => sum + d.sizeMb, 0), [docs]);

  return (
    <div className="space-y-6">
      {/* Top Banner Navigation & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card border border-border/70 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold">
            <HardDrive className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-foreground">
                Enterprise Document Vault & EDMS
              </h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-blue-500/10 text-blue-600 border border-blue-500/20">
                Encrypted File Storage
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Role-based access control (ACL), version-controlled corporate repository, and audit-logged file downloads
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setUploadModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-xs"
          >
            <Upload className="w-3.5 h-3.5" />
            Upload Document
          </button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-card border border-border/70 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>Archived Files</span>
            <FileText className="w-4 h-4 text-primary" />
          </div>
          <div className="text-2xl font-black text-foreground mt-2">
            {docs.length} Documents
          </div>
          <div className="text-[11px] text-muted-foreground mt-1">
            Across 5 secure vaults
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border/70 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>Encrypted Storage Used</span>
            <HardDrive className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
            {totalStorageMb.toFixed(1)} MB
          </div>
          <div className="text-[11px] text-muted-foreground mt-1">
            AES-256 cloud encryption
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border/70 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>Confidential C-Level</span>
            <Lock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-2">
            {docs.filter((d) => d.accessLevel === "CONFIDENTIAL").length} Files
          </div>
          <div className="text-[11px] text-muted-foreground mt-1">
            Strict RBAC authorization
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border/70 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>Version Audit Rate</span>
            <Shield className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-black text-foreground mt-2">
            100%
          </div>
          <div className="text-[11px] text-muted-foreground mt-1">
            Zero overwrite data loss
          </div>
        </div>
      </div>

      {/* Main Files Table */}
      <div className="bg-card border border-border/70 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search file name or author..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-input bg-background focus:ring-1 focus:ring-primary outline-hidden"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
            {(["ALL", "CONTRACTS", "FINANCE", "PROCUREMENT", "COMPLIANCE", "HR_EMPLOYEE"] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                  selectedCategory === cat
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/70 text-muted-foreground hover:bg-muted"
                }`}
              >
                {cat === "ALL" ? "All Vaults" : cat.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto border border-border/80 rounded-xl">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted/60 text-muted-foreground font-semibold border-b border-border">
              <tr>
                <th className="py-2.5 px-3 min-w-[260px]">File Name & Category</th>
                <th className="py-2.5 px-3 w-20 text-center">Version</th>
                <th className="py-2.5 px-3 text-right">Size</th>
                <th className="py-2.5 px-3">Access Level</th>
                <th className="py-2.5 px-3">Last Modified</th>
                <th className="py-2.5 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredDocs.map((doc) => (
                <tr key={doc.id} className="hover:bg-muted/20 transition-colors">
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary shrink-0" />
                      <div>
                        <div className="font-semibold text-foreground line-clamp-1">{doc.name}</div>
                        <div className="text-[11px] text-muted-foreground">{doc.category}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono font-bold text-primary">{doc.version}</td>
                  <td className="py-2.5 px-3 text-right text-muted-foreground font-mono">{doc.sizeMb} MB</td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        doc.accessLevel === "CONFIDENTIAL"
                          ? "bg-amber-500/10 text-amber-600 border border-amber-500/30"
                          : doc.accessLevel === "INTERNAL"
                          ? "bg-blue-500/10 text-blue-600 border border-blue-500/30"
                          : "bg-emerald-500/10 text-emerald-600 border border-emerald-500/30"
                      }`}
                    >
                      {doc.accessLevel}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-muted-foreground">
                    <div>{doc.modifiedAt}</div>
                    <div className="text-[10px] text-foreground font-medium">By {doc.modifiedBy}</div>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => notifySuccess(`Downloading ${doc.name}`)}
                        className="p-1.5 text-muted-foreground hover:text-primary rounded-lg hover:bg-primary/10 transition-colors"
                        title="Download file"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => notifySuccess(`Secure sharing link generated for ${doc.name}`)}
                        className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors"
                        title="Share link"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upload Modal */}
      {uploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-md w-full space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-border/80 pb-3">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Upload className="w-4 h-4 text-primary" />
                Upload to Document Vault
              </h3>
              <button
                onClick={() => setUploadModalOpen(false)}
                className="text-xs text-muted-foreground hover:text-foreground font-semibold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="border-2 border-dashed border-border rounded-xl p-6 text-center space-y-2 hover:border-primary/50 cursor-pointer">
                <Upload className="w-8 h-8 text-muted-foreground mx-auto" />
                <div className="font-semibold text-foreground">Click to select file or drag here</div>
                <div className="text-[11px] text-muted-foreground">PDF, DOCX, XLSX, ZIP up to 50MB</div>
              </div>

              <div>
                <label className="font-semibold text-muted-foreground block mb-1">Target Vault Category:</label>
                <select className="w-full px-3 py-2 rounded-xl border border-input bg-background font-medium">
                  <option value="CONTRACTS">Contracts & Agreements</option>
                  <option value="FINANCE">Financial Statements & Taxes</option>
                  <option value="PROCUREMENT">Procurement & POs</option>
                  <option value="COMPLIANCE">Statutory Compliance & QA</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-muted-foreground block mb-1">Access Authorization:</label>
                <select className="w-full px-3 py-2 rounded-xl border border-input bg-background font-medium">
                  <option value="INTERNAL">Internal Staff Access</option>
                  <option value="CONFIDENTIAL">Confidential (C-Level / Admin Only)</option>
                  <option value="PUBLIC">Public</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-border/80">
              <button
                onClick={() => setUploadModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-border hover:bg-muted/70 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  notifySuccess("Document uploaded and encrypted in vault.");
                  setUploadModalOpen(false);
                }}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-xs"
              >
                Upload File
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

