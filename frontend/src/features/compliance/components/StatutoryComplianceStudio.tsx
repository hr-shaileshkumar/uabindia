"use client";

import React, { useState, useMemo } from "react";
import {
  ShieldCheck,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Plus,
  Search,
  Filter,
  FileText,
  Upload,
  Download,
  Building2,
  Lock,
  ChevronRight,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { notifySuccess, notifyError } from "@/lib/notifications";

export interface ComplianceFiling {
  id: string;
  actTitle: string;
  formName: string;
  regulatoryBody: "EPFO" | "ESIC" | "GST_NETWORK" | "INCOME_TAX" | "LABOUR_MINISTRY";
  period: string;
  dueDate: string;
  taxAmountPayable: number;
  challanNumber?: string;
  status: "FILED_VERIFIED" | "PENDING_REVIEW" | "DRAFTING" | "OVERDUE";
  owner: string;
}

export const INITIAL_FILINGS: ComplianceFiling[] = [
  {
    id: "f-1",
    actTitle: "Employees' Provident Funds & MP Act, 1952",
    formName: "Electronic Challan cum Return (ECR)",
    regulatoryBody: "EPFO",
    period: "October 2026",
    dueDate: "2026-11-15",
    taxAmountPayable: 116400,
    challanNumber: "EPF-2026-09881234",
    status: "FILED_VERIFIED",
    owner: "Ramesh Pawar (Statutory Payroll Lead)",
  },
  {
    id: "f-2",
    actTitle: "Central Goods & Services Tax (CGST) Act, 2017",
    formName: "GSTR-1 (Outward Supplies of Goods & Services)",
    regulatoryBody: "GST_NETWORK",
    period: "October 2026",
    dueDate: "2026-11-11",
    taxAmountPayable: 1485000,
    status: "PENDING_REVIEW",
    owner: "Vikram Seth (Chartered Accountant)",
  },
  {
    id: "f-3",
    actTitle: "Central Goods & Services Tax (CGST) Act, 2017",
    formName: "GSTR-3B (Monthly Summary & Tax Payment)",
    regulatoryBody: "GST_NETWORK",
    period: "October 2026",
    dueDate: "2026-11-20",
    taxAmountPayable: 842000,
    status: "DRAFTING",
    owner: "Vikram Seth (Chartered Accountant)",
  },
  {
    id: "f-4",
    actTitle: "Income Tax Act, 1961 (Withholding TDS)",
    formName: "Form 24Q (Salary TDS) - Q2 Return",
    regulatoryBody: "INCOME_TAX",
    period: "Q2 (Jul - Sep 2026)",
    dueDate: "2026-10-31",
    taxAmountPayable: 245000,
    challanNumber: "TDS-IT-2026-00441",
    status: "FILED_VERIFIED",
    owner: "Vikram Seth (Chartered Accountant)",
  },
  {
    id: "f-5",
    actTitle: "Employees' State Insurance (ESI) Act, 1948",
    formName: "Monthly Statutory Contribution Return",
    regulatoryBody: "ESIC",
    period: "October 2026",
    dueDate: "2026-11-15",
    taxAmountPayable: 38200,
    status: "PENDING_REVIEW",
    owner: "Ramesh Pawar (Statutory Payroll Lead)",
  },
  {
    id: "f-6",
    actTitle: "The Factories Act, 1948 & State Safety Rules",
    formName: "Annual Factory Safety & Welfare Audit Filing",
    regulatoryBody: "LABOUR_MINISTRY",
    period: "FY 2026-27",
    dueDate: "2026-12-31",
    taxAmountPayable: 0,
    status: "DRAFTING",
    owner: "Ramanathan Iyer (Plant Head Pune)",
  },
];

export function StatutoryComplianceStudio() {
  const [filings, setFilings] = useState<ComplianceFiling[]>(INITIAL_FILINGS);
  const [searchQuery, setSearchQuery] = useState("");
  const [bodyFilter, setBodyFilter] = useState("ALL");
  const [markModalItem, setMarkModalItem] = useState<ComplianceFiling | null>(null);

  // Filtered
  const filteredFilings = useMemo(() => {
    return filings.filter((f) => {
      const matchBody = bodyFilter === "ALL" || f.regulatoryBody === bodyFilter;
      const matchSearch =
        f.actTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.formName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.regulatoryBody.toLowerCase().includes(searchQuery.toLowerCase());
      return matchBody && matchSearch;
    });
  }, [filings, bodyFilter, searchQuery]);

  // Statistics
  const filedCount = useMemo(() => filings.filter((f) => f.status === "FILED_VERIFIED").length, [filings]);
  const pendingCount = useMemo(() => filings.filter((f) => f.status !== "FILED_VERIFIED").length, [filings]);
  const totalDuesPayable = useMemo(() => filings.reduce((sum, f) => sum + f.taxAmountPayable, 0), [filings]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const handleConfirmFiling = () => {
    if (!markModalItem) return;
    setFilings((prev) =>
      prev.map((f) =>
        f.id === markModalItem.id
          ? {
              ...f,
              status: "FILED_VERIFIED",
              challanNumber: `ACK-${Date.now().toString().slice(-8)}`,
            }
          : f
      )
    );
    notifySuccess(`Compliance filing for ${markModalItem.formName} marked as Verified.`);
    setMarkModalItem(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Navigation & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card border border-border/70 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center font-bold">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-foreground">
                Statutory Compliance & Indian Regulatory Center
              </h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                100% Adherence
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              EPF, ESIC, GST GSTR-1/3B, Withholding TDS, and Factory Act compliance calendar with electronic challan verification
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => notifySuccess("Compliance Audit Certificate generated as PDF.")}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border border-border bg-card hover:bg-muted/70 transition-colors text-foreground"
          >
            <Download className="w-3.5 h-3.5" />
            Audit Certificate
          </button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-card border border-border/70 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>Verified Filings (MTD)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
            {filedCount} / {filings.length}
          </div>
          <div className="text-[11px] text-muted-foreground mt-1">
            Electronic challans archived
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border/70 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>Upcoming Filings Due</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-2">
            {pendingCount} Filings
          </div>
          <div className="text-[11px] text-muted-foreground mt-1">
            Next deadline: 11 Nov (GSTR-1)
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border/70 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>Total Statutory Dues</span>
            <FileText className="w-4 h-4 text-primary" />
          </div>
          <div className="text-2xl font-black text-foreground mt-2">
            {formatCurrency(totalDuesPayable)}
          </div>
          <div className="text-[11px] text-muted-foreground mt-1">
            Reconciled with General Ledger
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border/70 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>Statutory Penalties Incurred</span>
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
            ₹0.00
          </div>
          <div className="text-[11px] text-muted-foreground mt-1">
            Zero regulatory default risk
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-card border border-border/70 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search compliance act, form or body..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-input bg-background focus:ring-1 focus:ring-primary outline-hidden"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
            {(["ALL", "EPFO", "GST_NETWORK", "INCOME_TAX", "ESIC"] as const).map((b) => (
              <button
                key={b}
                onClick={() => setBodyFilter(b)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                  bodyFilter === b
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/70 text-muted-foreground hover:bg-muted"
                }`}
              >
                {b === "ALL" ? "All Authorities" : b.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto border border-border/80 rounded-xl">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted/60 text-muted-foreground font-semibold border-b border-border">
              <tr>
                <th className="py-2.5 px-3">Regulatory Body</th>
                <th className="py-2.5 px-3 min-w-[220px]">Act & Return Form</th>
                <th className="py-2.5 px-3">Period</th>
                <th className="py-2.5 px-3">Statutory Due Date</th>
                <th className="py-2.5 px-3 text-right">Tax / Dues (₹)</th>
                <th className="py-2.5 px-3">Challan / Acknowledgement</th>
                <th className="py-2.5 px-3 text-center">Filing Status</th>
                <th className="py-2.5 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredFilings.map((f) => (
                <tr key={f.id} className="hover:bg-muted/20 transition-colors">
                  <td className="py-2.5 px-3">
                    <span className="font-bold text-foreground bg-muted px-2 py-0.5 rounded-md text-[10px]">
                      {f.regulatoryBody}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="font-semibold text-foreground">{f.formName}</div>
                    <div className="text-[11px] text-muted-foreground">{f.actTitle}</div>
                  </td>
                  <td className="py-2.5 px-3 font-medium text-foreground">{f.period}</td>
                  <td className="py-2.5 px-3 font-semibold text-foreground">{f.dueDate}</td>
                  <td className="py-2.5 px-3 text-right font-bold text-foreground">
                    {f.taxAmountPayable > 0 ? formatCurrency(f.taxAmountPayable) : "—"}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-[11px] text-primary">
                    {f.challanNumber || "Pending Generation"}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        f.status === "FILED_VERIFIED"
                          ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/30"
                          : f.status === "PENDING_REVIEW"
                          ? "bg-amber-500/10 text-amber-600 border border-amber-500/30"
                          : "bg-blue-500/10 text-blue-600 border border-blue-500/30"
                      }`}
                    >
                      {f.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    {f.status !== "FILED_VERIFIED" ? (
                      <button
                        onClick={() => setMarkModalItem(f)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                      >
                        <Upload className="w-3 h-3" />
                        Upload Challan
                      </button>
                    ) : (
                      <span className="text-[11px] text-emerald-600 font-semibold flex items-center justify-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upload / Confirm Challan Modal */}
      {markModalItem && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-md w-full space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-border/80 pb-3">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Upload className="w-4 h-4 text-primary" />
                Upload Statutory Filing Challan
              </h3>
              <button
                onClick={() => setMarkModalItem(null)}
                className="text-xs text-muted-foreground hover:text-foreground font-semibold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-muted-foreground block text-[11px]">Return Form:</span>
                <span className="font-bold text-foreground">{markModalItem.formName}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[11px]">Authority & Period:</span>
                <span className="text-foreground">{markModalItem.regulatoryBody} • {markModalItem.period}</span>
              </div>
              <div>
                <label className="font-semibold text-muted-foreground block mb-1">Bank Challan / Acknowledgement #:</label>
                <input
                  type="text"
                  placeholder="e.g. CIN / BRN / EPFO Challan No"
                  defaultValue={`ACK-${Date.now().toString().slice(-8)}`}
                  className="w-full px-3 py-2 rounded-xl border border-input bg-background font-mono font-bold"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-border/80">
              <button
                onClick={() => setMarkModalItem(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-border hover:bg-muted/70 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmFiling}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-xs"
              >
                Confirm Verified Filing
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

