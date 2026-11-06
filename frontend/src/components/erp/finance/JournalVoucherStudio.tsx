"use client";

import React, { useState, useMemo } from "react";
import {
  BookOpen,
  Plus,
  Trash2,
  Printer,
  Save,
  CheckCircle2,
  Clock,
  Building2,
  Calendar,
  Layers,
  ArrowLeft,
  Share2,
  ShieldCheck,
  Sparkles,
  AlertCircle,
  Copy,
  Scale,
  RefreshCw,
  Search,
  FileCheck2,
  ArrowRightLeft,
} from "lucide-react";
import { notifySuccess, notifyError } from "@/lib/notifications";

export interface JournalLineItem {
  id: string;
  accountCode: string;
  accountName: string;
  accountType: "Asset" | "Liability" | "Equity" | "Revenue" | "Expense";
  debit: number;
  credit: number;
  costCenter: string;
  referenceNo: string;
  narration: string;
}

export interface ChartAccountOption {
  code: string;
  name: string;
  type: "Asset" | "Liability" | "Equity" | "Revenue" | "Expense";
  category: string;
}

export const CHART_OF_ACCOUNTS_CATALOG: ChartAccountOption[] = [
  // Assets
  { code: "1010", name: "Cash on Hand", type: "Asset", category: "Current Assets" },
  { code: "1020", name: "HDFC Bank Operating A/c", type: "Asset", category: "Bank Balances" },
  { code: "1025", name: "ICICI Bank Payroll A/c", type: "Asset", category: "Bank Balances" },
  { code: "1040", name: "Trade Accounts Receivable", type: "Asset", category: "Current Assets" },
  { code: "1070", name: "GST Input Tax Credit (ITC - CGST)", type: "Asset", category: "Duties & Taxes" },
  { code: "1071", name: "GST Input Tax Credit (ITC - SGST)", type: "Asset", category: "Duties & Taxes" },
  { code: "1072", name: "GST Input Tax Credit (ITC - IGST)", type: "Asset", category: "Duties & Taxes" },
  { code: "1510", name: "Plant & Machinery (Capital Asset)", type: "Asset", category: "Fixed Assets" },
  { code: "1520", name: "Computer & Server Equipment", type: "Asset", category: "Fixed Assets" },

  // Liabilities
  { code: "2010", name: "Trade Accounts Payable (Creditors)", type: "Liability", category: "Current Liabilities" },
  { code: "2020", name: "Salaries & Wages Payable", type: "Liability", category: "Provisions" },
  { code: "2030", name: "Provident Fund (PF) Payable", type: "Liability", category: "Statutory Dues" },
  { code: "2035", name: "TDS Payable u/s 194C / 194J", type: "Liability", category: "Statutory Dues" },
  { code: "2050", name: "GST Output CGST Payable", type: "Liability", category: "Duties & Taxes" },
  { code: "2051", name: "GST Output SGST Payable", type: "Liability", category: "Duties & Taxes" },
  { code: "2052", name: "GST Output IGST Payable", type: "Liability", category: "Duties & Taxes" },
  { code: "2100", name: "Working Capital Loan (SBI)", type: "Liability", category: "Long-Term Debt" },

  // Equity
  { code: "3010", name: "Share Capital Equity", type: "Equity", category: "Equity" },
  { code: "3020", name: "Retained Earnings / Surplus", type: "Equity", category: "Reserves & Surplus" },

  // Revenue
  { code: "4010", name: "Domestic Sales Revenue (Goods)", type: "Revenue", category: "Operating Revenue" },
  { code: "4020", name: "Service & Implementation Fees", type: "Revenue", category: "Operating Revenue" },
  { code: "4090", name: "Interest & Other Non-Op Income", type: "Revenue", category: "Other Income" },

  // Expenses
  { code: "5010", name: "Salaries, Allowances & Bonuses", type: "Expense", category: "Personnel Expenses" },
  { code: "5020", name: "Employer PF & ESI Contribution", type: "Expense", category: "Personnel Expenses" },
  { code: "5030", name: "Office Rent & Facility Maintenance", type: "Expense", category: "Administrative" },
  { code: "5040", name: "Cloud Infrastructure & SaaS Software", type: "Expense", category: "IT & Technology" },
  { code: "5050", name: "Freight, Shipping & Logistics Expenses", type: "Expense", category: "Operating Expenses" },
  { code: "5060", name: "Fleet Fuel & Vehicle Servicing", type: "Expense", category: "Operating Expenses" },
  { code: "5090", name: "Depreciation & Amortization", type: "Expense", category: "Non-Cash Expenses" },
];

export const COST_CENTERS = [
  "General Corporate / HQ Mumbai",
  "R&D & Engineering - Bengaluru",
  "Plant 1 - Pune Manufacturing",
  "Logistics & Fleet Operations Hub",
  "Sales & Marketing - North Zone",
  "Support & Customer Success",
];

export function JournalVoucherStudio() {
  const [viewMode, setViewMode] = useState<"STUDIO" | "PRINT">("STUDIO");
  const [voucherNumber, setVoucherNumber] = useState(`JV-2026-${Math.floor(1000 + Math.random() * 9000)}`);
  const [voucherType, setVoucherType] = useState<"General Journal" | "Payment" | "Receipt" | "Contra" | "Adjustment">("General Journal");
  const [postingDate, setPostingDate] = useState(new Date().toISOString().split("T")[0]);
  const [period, setPeriod] = useState("FY 2026-27 / P-08");
  const [currency, setCurrency] = useState("INR");
  const [narration, setNarration] = useState("Monthly enterprise payroll expense booking and statutory accrual provisions for head office and technical staff.");
  const [status, setStatus] = useState<"Draft" | "Posted" | "Reversed">("Draft");

  // Journal line items
  const [lines, setLines] = useState<JournalLineItem[]>([
    {
      id: "l-1",
      accountCode: "5010",
      accountName: "Salaries, Allowances & Bonuses",
      accountType: "Expense",
      debit: 485000,
      credit: 0,
      costCenter: "General Corporate / HQ Mumbai",
      referenceNo: "PAY-NOV-2026",
      narration: "Gross salary booking for November 2026",
    },
    {
      id: "l-2",
      accountCode: "5020",
      accountName: "Employer PF & ESI Contribution",
      accountType: "Expense",
      debit: 38800,
      credit: 0,
      costCenter: "General Corporate / HQ Mumbai",
      referenceNo: "PF-NOV-2026",
      narration: "Employer contribution towards EPF / EPS",
    },
    {
      id: "l-3",
      accountCode: "2030",
      accountName: "Provident Fund (PF) Payable",
      accountType: "Liability",
      debit: 0,
      credit: 77600,
      costCenter: "General Corporate / HQ Mumbai",
      referenceNo: "STAT-PF-NOV",
      narration: "Employee + Employer PF statutory payable",
    },
    {
      id: "l-4",
      accountCode: "2035",
      accountName: "TDS Payable u/s 194C / 194J",
      accountType: "Liability",
      debit: 0,
      credit: 24500,
      costCenter: "General Corporate / HQ Mumbai",
      referenceNo: "TDS-IT-NOV",
      narration: "Withholding tax deducted at source",
    },
    {
      id: "l-5",
      accountCode: "2020",
      accountName: "Salaries & Wages Payable",
      accountType: "Liability",
      debit: 0,
      credit: 421700,
      costCenter: "General Corporate / HQ Mumbai",
      referenceNo: "NET-PAY-NOV",
      narration: "Net payroll disbursement obligation to bank",
    },
  ]);

  // Totals & Balance calculations
  const totalDebit = useMemo(() => {
    return lines.reduce((sum, item) => sum + (Number(item.debit) || 0), 0);
  }, [lines]);

  const totalCredit = useMemo(() => {
    return lines.reduce((sum, item) => sum + (Number(item.credit) || 0), 0);
  }, [lines]);

  const difference = useMemo(() => {
    return Math.abs(totalDebit - totalCredit);
  }, [totalDebit, totalCredit]);

  const isBalanced = useMemo(() => {
    return difference < 0.01 && totalDebit > 0;
  }, [difference, totalDebit]);

  // Account selector handler
  const handleAccountChange = (id: string, code: string) => {
    const matched = CHART_OF_ACCOUNTS_CATALOG.find((a) => a.code === code);
    setLines((prev) =>
      prev.map((l) =>
        l.id === id
          ? {
              ...l,
              accountCode: code,
              accountName: matched ? matched.name : "Custom Account",
              accountType: matched ? matched.type : "Expense",
            }
          : l
      )
    );
  };

  const handleFieldChange = (id: string, field: keyof JournalLineItem, value: any) => {
    setLines((prev) =>
      prev.map((l) => {
        if (l.id !== id) return l;
        if (field === "debit") {
          const deb = Math.max(0, Number(value) || 0);
          return { ...l, debit: deb, credit: deb > 0 ? 0 : l.credit };
        }
        if (field === "credit") {
          const cred = Math.max(0, Number(value) || 0);
          return { ...l, credit: cred, debit: cred > 0 ? 0 : l.debit };
        }
        return { ...l, [field]: value };
      })
    );
  };

  const addLine = () => {
    const newLine: JournalLineItem = {
      id: `line-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      accountCode: "5030",
      accountName: "Office Rent & Facility Maintenance",
      accountType: "Expense",
      debit: 0,
      credit: 0,
      costCenter: COST_CENTERS[0],
      referenceNo: "",
      narration: "",
    };
    setLines([...lines, newLine]);
  };

  const removeLine = (id: string) => {
    if (lines.length <= 2) {
      notifyError("Double-entry vouchers require a minimum of 2 leg entries.");
      return;
    }
    setLines(lines.filter((l) => l.id !== id));
  };

  const autoBalanceEntry = () => {
    if (isBalanced) {
      notifySuccess("Voucher is already perfectly balanced!");
      return;
    }
    const diff = totalDebit - totalCredit;
    if (diff > 0) {
      // Credit side is short: add credit balancing row
      const balancingRow: JournalLineItem = {
        id: `bal-${Date.now()}`,
        accountCode: "1020",
        accountName: "HDFC Bank Operating A/c",
        accountType: "Asset",
        debit: 0,
        credit: diff,
        costCenter: COST_CENTERS[0],
        referenceNo: "AUTO-BAL",
        narration: "Balancing settlement entry",
      };
      setLines([...lines, balancingRow]);
    } else {
      // Debit side is short: add debit balancing row
      const balancingRow: JournalLineItem = {
        id: `bal-${Date.now()}`,
        accountCode: "1040",
        accountName: "Trade Accounts Receivable",
        accountType: "Asset",
        debit: Math.abs(diff),
        credit: 0,
        costCenter: COST_CENTERS[0],
        referenceNo: "AUTO-BAL",
        narration: "Balancing settlement entry",
      };
      setLines([...lines, balancingRow]);
    }
    notifySuccess("Balancing leg auto-generated successfully.");
  };

  const handlePost = () => {
    if (!isBalanced) {
      notifyError(`Cannot post unbalanced journal! Discrepancy of ₹${difference.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`);
      return;
    }
    setStatus("Posted");
    notifySuccess(`Journal Voucher ${voucherNumber} posted to General Ledger successfully!`);
  };

  const handleReverse = () => {
    setStatus("Reversed");
    notifySuccess(`Journal Voucher ${voucherNumber} marked as Reversed.`);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(val);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Navigation & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card border border-border/70 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-foreground">
                Double-Entry Financial Journal Studio
              </h1>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                  status === "Posted"
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                    : status === "Reversed"
                    ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                    : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                }`}
              >
                {status}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              GAAP & Ind-AS compliant real-time ledger voucher creation, multi-leg debit/credit balancing, and cost center allocation
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto flex-wrap">
          {viewMode === "PRINT" ? (
            <button
              onClick={() => setViewMode("STUDIO")}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border border-border bg-card hover:bg-muted/70 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Studio
            </button>
          ) : (
            <button
              onClick={() => setViewMode("PRINT")}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border border-border bg-card hover:bg-muted/70 transition-colors text-foreground"
            >
              <Printer className="w-3.5 h-3.5" />
              Official Ledger Slip Preview
            </button>
          )}

          {viewMode === "STUDIO" && (
            <>
              <button
                onClick={autoBalanceEntry}
                disabled={isBalanced}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-border/80 bg-background hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-foreground"
                title="Automatically calculate and append the missing balancing leg"
              >
                <ArrowRightLeft className="w-3.5 h-3.5 text-primary" />
                Auto-Balance
              </button>

              {status === "Posted" ? (
                <button
                  onClick={handleReverse}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border border-rose-500/30 text-rose-600 bg-rose-500/10 hover:bg-rose-500/20 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Reverse Voucher
                </button>
              ) : (
                <button
                  onClick={handlePost}
                  disabled={!isBalanced}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed shadow-xs transition-colors"
                >
                  <FileCheck2 className="w-3.5 h-3.5" />
                  Post to General Ledger
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {viewMode === "PRINT" ? (
        /* Official Letterhead Ledger Slip View */
        <div className="bg-card border border-border rounded-2xl p-8 max-w-4xl mx-auto shadow-md print:shadow-none print:border-none space-y-6">
          <div className="flex justify-between items-start border-b border-border/80 pb-6">
            <div>
              <div className="text-2xl font-black tracking-tight text-foreground">
                UAB GLOBAL ENTERPRISES LIMITED
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                CIN: L72200MH2026PLC994821 | GSTIN: 27AABCU1234F1Z6
              </p>
              <p className="text-xs text-muted-foreground">
                Tower 5, World Finance Center, BKC, Bandra East, Mumbai - 400051
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs uppercase font-extrabold tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-md">
                Official Journal Voucher
              </span>
              <div className="text-base font-bold text-foreground mt-2">{voucherNumber}</div>
              <div className="text-xs text-muted-foreground">Posting Date: {postingDate}</div>
              <div className="text-xs text-muted-foreground">Period: {period}</div>
            </div>
          </div>

          <div className="text-xs text-muted-foreground italic bg-muted/40 p-3 rounded-xl border border-border/50">
            <span className="font-semibold text-foreground not-italic">General Narration: </span>
            {narration}
          </div>

          {/* Ledger Table */}
          <div className="overflow-x-auto border border-border/80 rounded-xl">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/70 text-muted-foreground font-semibold border-b border-border">
                <tr>
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Account Code & Head</th>
                  <th className="py-2.5 px-3">Cost Center</th>
                  <th className="py-2.5 px-3">Reference</th>
                  <th className="py-2.5 px-3 text-right">Debit (INR)</th>
                  <th className="py-2.5 px-3 text-right">Credit (INR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {lines.map((l, idx) => (
                  <tr key={l.id}>
                    <td className="py-2.5 px-3 text-muted-foreground">{idx + 1}</td>
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-foreground">
                        [{l.accountCode}] {l.accountName}
                      </div>
                      <div className="text-[11px] text-muted-foreground italic">{l.narration || "—"}</div>
                    </td>
                    <td className="py-2.5 px-3 text-muted-foreground">{l.costCenter}</td>
                    <td className="py-2.5 px-3 text-muted-foreground font-mono">{l.referenceNo || "—"}</td>
                    <td className="py-2.5 px-3 text-right font-semibold text-foreground">
                      {l.debit > 0 ? formatCurrency(l.debit) : "—"}
                    </td>
                    <td className="py-2.5 px-3 text-right font-semibold text-foreground">
                      {l.credit > 0 ? formatCurrency(l.credit) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-muted/90 font-bold border-t border-border">
                <tr>
                  <td colSpan={4} className="py-3 px-3 text-right text-xs uppercase tracking-wider">
                    Total Ledger Leg Sum:
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-foreground">
                    {formatCurrency(totalDebit)}
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-foreground">
                    {formatCurrency(totalCredit)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="flex justify-between items-end pt-12 border-t border-border/80">
            <div className="text-center">
              <div className="w-44 border-b border-border/80 mb-1"></div>
              <p className="text-[11px] font-semibold text-muted-foreground">Prepared By (Accounts Officer)</p>
            </div>
            <div className="text-center">
              <div className="w-44 border-b border-border/80 mb-1"></div>
              <p className="text-[11px] font-semibold text-muted-foreground">Verified & Reviewed By</p>
            </div>
            <div className="text-center">
              <div className="w-44 border-b border-border/80 mb-1"></div>
              <p className="text-[11px] font-semibold text-muted-foreground">Authorised Signatory (CFO / Controller)</p>
            </div>
          </div>
        </div>
      ) : (
        /* Active Journal Studio Workspace */
        <div className="space-y-6">
          {/* Header Metadata Grid */}
          <div className="bg-card border border-border/70 rounded-2xl p-5 shadow-xs">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                  Voucher Number
                </label>
                <input
                  type="text"
                  value={voucherNumber}
                  onChange={(e) => setVoucherNumber(e.target.value)}
                  className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-input bg-background focus:ring-1 focus:ring-primary outline-hidden"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                  Voucher Type
                </label>
                <select
                  value={voucherType}
                  onChange={(e) => setVoucherType(e.target.value as any)}
                  className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-input bg-background focus:ring-1 focus:ring-primary outline-hidden"
                >
                  <option value="General Journal">General Journal (Standard)</option>
                  <option value="Payment">Payment Voucher (Bank/Cash Out)</option>
                  <option value="Receipt">Receipt Voucher (Bank/Cash In)</option>
                  <option value="Contra">Contra Voucher (Fund Transfer)</option>
                  <option value="Adjustment">Adjustment / Rectification Entry</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                  Posting Date
                </label>
                <input
                  type="date"
                  value={postingDate}
                  onChange={(e) => setPostingDate(e.target.value)}
                  className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-input bg-background focus:ring-1 focus:ring-primary outline-hidden"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                  Financial Period
                </label>
                <input
                  type="text"
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-input bg-background focus:ring-1 focus:ring-primary outline-hidden"
                />
              </div>

              <div className="md:col-span-4">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                  General Narration / Audit Trail Remarks
                </label>
                <textarea
                  rows={2}
                  value={narration}
                  onChange={(e) => setNarration(e.target.value)}
                  placeholder="Detail the economic substance and authorization basis of this voucher..."
                  className="w-full text-xs px-3 py-2 rounded-xl border border-input bg-background focus:ring-1 focus:ring-primary outline-hidden resize-none"
                />
              </div>
            </div>
          </div>

          {/* Balance Status Bar */}
          <div
            className={`p-4 rounded-2xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-3 ${
              isBalanced
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
                : "bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold ${
                  isBalanced ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
                }`}
              >
                <Scale className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold flex items-center gap-2">
                  {isBalanced ? "Voucher Balanced (Total Debits = Total Credits)" : "Voucher Unbalanced!"}
                  {isBalanced && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                </div>
                <div className="text-xs opacity-90">
                  {isBalanced
                    ? "Both debit and credit totals match exactly. Ready for general ledger posting."
                    : `Discrepancy: ${formatCurrency(difference)}. Debits and Credits must balance to zero before posting.`}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs font-semibold">
              <div className="bg-card/80 px-3 py-1.5 rounded-xl border border-border">
                <span className="text-muted-foreground mr-1.5">Total Debits:</span>
                <span className="font-bold text-foreground">{formatCurrency(totalDebit)}</span>
              </div>
              <div className="bg-card/80 px-3 py-1.5 rounded-xl border border-border">
                <span className="text-muted-foreground mr-1.5">Total Credits:</span>
                <span className="font-bold text-foreground">{formatCurrency(totalCredit)}</span>
              </div>
            </div>
          </div>

          {/* Split Debit / Credit Rows Table */}
          <div className="bg-card border border-border/70 rounded-2xl overflow-hidden shadow-xs">
            <div className="p-4 border-b border-border/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-foreground">Split Accounting Legs</h2>
                <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-md font-semibold">
                  {lines.length} Rows
                </span>
              </div>
              <button
                onClick={addLine}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Ledger Row
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/50 text-muted-foreground font-semibold border-b border-border">
                  <tr>
                    <th className="py-2.5 px-3 w-10 text-center">#</th>
                    <th className="py-2.5 px-3 min-w-[260px]">Account Head & Category</th>
                    <th className="py-2.5 px-3 min-w-[180px]">Cost Center</th>
                    <th className="py-2.5 px-3 min-w-[130px]">Ref / Bill #</th>
                    <th className="py-2.5 px-3 min-w-[130px] text-right">Debit Amount (₹)</th>
                    <th className="py-2.5 px-3 min-w-[130px] text-right">Credit Amount (₹)</th>
                    <th className="py-2.5 px-3 min-w-[200px]">Row Narration</th>
                    <th className="py-2.5 px-3 w-10 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {lines.map((l, index) => (
                    <tr key={l.id} className="hover:bg-muted/20 transition-colors">
                      <td className="py-3 px-3 text-center text-muted-foreground font-medium">
                        {index + 1}
                      </td>

                      {/* Account Selector */}
                      <td className="py-3 px-3">
                        <select
                          value={l.accountCode}
                          onChange={(e) => handleAccountChange(l.id, e.target.value)}
                          className="w-full text-xs font-medium px-2 py-1.5 rounded-lg border border-input bg-background focus:ring-1 focus:ring-primary outline-hidden"
                        >
                          {CHART_OF_ACCOUNTS_CATALOG.map((acc) => (
                            <option key={acc.code} value={acc.code}>
                              [{acc.code}] {acc.name} ({acc.type})
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Cost Center */}
                      <td className="py-3 px-3">
                        <select
                          value={l.costCenter}
                          onChange={(e) => handleFieldChange(l.id, "costCenter", e.target.value)}
                          className="w-full text-xs px-2 py-1.5 rounded-lg border border-input bg-background focus:ring-1 focus:ring-primary outline-hidden"
                        >
                          {COST_CENTERS.map((cc) => (
                            <option key={cc} value={cc}>
                              {cc}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Reference No */}
                      <td className="py-3 px-3">
                        <input
                          type="text"
                          value={l.referenceNo}
                          onChange={(e) => handleFieldChange(l.id, "referenceNo", e.target.value)}
                          placeholder="Doc/Inv ref"
                          className="w-full text-xs px-2 py-1.5 rounded-lg border border-input bg-background focus:ring-1 focus:ring-primary outline-hidden"
                        >
                        </input>
                      </td>

                      {/* Debit */}
                      <td className="py-3 px-3 text-right">
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={l.debit === 0 ? "" : l.debit}
                          onChange={(e) => handleFieldChange(l.id, "debit", e.target.value)}
                          placeholder="0.00"
                          className="w-full text-right text-xs font-semibold px-2 py-1.5 rounded-lg border border-input bg-background focus:ring-1 focus:ring-primary outline-hidden"
                        />
                      </td>

                      {/* Credit */}
                      <td className="py-3 px-3 text-right">
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={l.credit === 0 ? "" : l.credit}
                          onChange={(e) => handleFieldChange(l.id, "credit", e.target.value)}
                          placeholder="0.00"
                          className="w-full text-right text-xs font-semibold px-2 py-1.5 rounded-lg border border-input bg-background focus:ring-1 focus:ring-primary outline-hidden"
                        />
                      </td>

                      {/* Row Narration */}
                      <td className="py-3 px-3">
                        <input
                          type="text"
                          value={l.narration}
                          onChange={(e) => handleFieldChange(l.id, "narration", e.target.value)}
                          placeholder="Line item description"
                          className="w-full text-xs px-2 py-1.5 rounded-lg border border-input bg-background focus:ring-1 focus:ring-primary outline-hidden"
                        />
                      </td>

                      {/* Action */}
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => removeLine(l.id)}
                          className="p-1.5 text-muted-foreground hover:text-rose-500 rounded-lg hover:bg-rose-500/10 transition-colors"
                          title="Delete row"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-muted/50 font-bold border-t border-border">
                  <tr>
                    <td colSpan={4} className="py-3 px-3 text-right text-xs uppercase tracking-wider text-muted-foreground">
                      Total Ledger Summary:
                    </td>
                    <td className="py-3 px-3 text-right font-extrabold text-foreground text-xs">
                      {formatCurrency(totalDebit)}
                    </td>
                    <td className="py-3 px-3 text-right font-extrabold text-foreground text-xs">
                      {formatCurrency(totalCredit)}
                    </td>
                    <td colSpan={2} className="py-3 px-3 text-xs text-muted-foreground">
                      {isBalanced ? (
                        <span className="text-emerald-600 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Balanced (₹0.00 Diff)
                        </span>
                      ) : (
                        <span className="text-rose-600 font-semibold flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" /> Diff: {formatCurrency(difference)}
                        </span>
                      )}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

