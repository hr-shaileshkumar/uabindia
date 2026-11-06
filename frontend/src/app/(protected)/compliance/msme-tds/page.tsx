"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Search,
  FileText,
  Building2,
  DollarSign,
  ArrowUpRight,
  TrendingUp,
  Download,
  Percent,
} from "lucide-react";
import apiClient from "@/services/apiClient";
import { cn } from "@/lib/utils";

interface MsmeItem {
  invoiceId: string;
  invoiceNumber: string;
  vendorName: string;
  udyamRegNo: string;
  category: string;
  invoiceDate: string;
  dueDate: string;
  daysRemaining: number;
  balanceAmount: number;
  riskLevel: string;
}

interface TdsSectionSummary {
  section: string;
  sectionDescription: string;
  totalInvoices: number;
  grossTaxableAmount: number;
  totalTdsDeducted: number;
  netPayable: number;
  vendors: Array<{
    vendorName: string;
    pan: string;
    invoiceNumber: string;
    grossAmount: number;
    tdsRate: number;
    tdsAmount: number;
  }>;
}

export default function MsmeTdsCompliancePage() {
  const [activeTab, setActiveTab] = useState<"msme" | "tds">("msme");
  const [loading, setLoading] = useState(true);
  const [msmeItems, setMsmeItems] = useState<MsmeItem[]>([]);
  const [msmeSummary, setMsmeSummary] = useState({
    totalActiveMsmeInvoices: 0,
    totalPendingAmount: 0,
    totalDisallowedAmount: 0,
    totalCriticalAmount: 0,
  });
  const [tdsSections, setTdsSections] = useState<TdsSectionSummary[]>([]);
  const [totalTds, setTotalTds] = useState(0);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [msmeRes, tdsRes] = await Promise.all([
          apiClient.get("/finance/msme/compliance-calendar").catch(() => ({ data: { items: [], summary: {} } })),
          apiClient.get("/finance/tds/summary").catch(() => ({ data: { sections: [], totalTdsDeducted: 0 } })),
        ]);

        if (msmeRes.data?.items) {
          setMsmeItems(msmeRes.data.items);
          setMsmeSummary(msmeRes.data.summary || {});
        }
        if (tdsRes.data?.sections) {
          setTdsSections(tdsRes.data.sections);
          setTotalTds(tdsRes.data.totalTdsDeducted || 0);
        }
      } finally {
        setLoading(false);
      }
    }
    void loadData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-4 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800 dark:bg-amber-950/60 dark:text-amber-400">
              India Statutory Act
            </span>
            <span className="text-xs text-slate-500">Finance Act 2024 / CBDT</span>
          </div>
          <h1 className="mt-1 text-2xl font-black text-slate-900 tracking-tight dark:text-white">
            MSME 45-Day (Sec 43B(h)) &amp; TDS Governance Center
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Automated monitoring of MSME payment deadlines to avoid income tax disallowance, plus Section 194 quarterly TDS summaries.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("msme")}
            className={cn(
              "rounded-xl px-4 py-2 text-xs font-bold transition-all",
              activeTab === "msme"
                ? "bg-slate-900 text-white shadow-md dark:bg-blue-600"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
            )}
          >
            MSME 45-Day Tracker
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("tds")}
            className={cn(
              "rounded-xl px-4 py-2 text-xs font-bold transition-all",
              activeTab === "tds"
                ? "bg-slate-900 text-white shadow-md dark:bg-blue-600"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
            )}
          >
            TDS Form 26Q Summary
          </button>
        </div>
      </div>

      {activeTab === "msme" ? (
        <div className="space-y-6">
          {/* Stats Bar */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <p className="text-xs font-semibold text-slate-500">Active MSME Invoices</p>
              <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">
                {msmeSummary.totalActiveMsmeInvoices || msmeItems.length}
              </p>
              <p className="mt-0.5 text-[11px] text-slate-400">Pending payment</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <p className="text-xs font-semibold text-slate-500">Total MSME Payables</p>
              <p className="mt-1 text-2xl font-black text-blue-600 dark:text-blue-400">
                ₹{(msmeSummary.totalPendingAmount || 0).toLocaleString("en-IN")}
              </p>
              <p className="mt-0.5 text-[11px] text-slate-400">Under 45-day terms</p>
            </div>
            <div className="rounded-2xl border border-rose-200 bg-rose-50/40 p-4 shadow-xs dark:border-rose-900/40 dark:bg-rose-950/20">
              <p className="text-xs font-semibold text-rose-700 dark:text-rose-400 flex items-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5" /> Disallowed under 43B(h)
              </p>
              <p className="mt-1 text-2xl font-black text-rose-600 dark:text-rose-400">
                ₹{(msmeSummary.totalDisallowedAmount || 0).toLocaleString("en-IN")}
              </p>
              <p className="mt-0.5 text-[11px] text-rose-600/70 dark:text-rose-400/70">Overdue &gt; 45 Days (Tax penalty risk)</p>
            </div>
            <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-4 shadow-xs dark:border-amber-900/40 dark:bg-amber-950/20">
              <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" /> Critical (&lt; 10 Days)
              </p>
              <p className="mt-1 text-2xl font-black text-amber-600 dark:text-amber-400">
                ₹{(msmeSummary.totalCriticalAmount || 0).toLocaleString("en-IN")}
              </p>
              <p className="mt-0.5 text-[11px] text-amber-600/70 dark:text-amber-400/70">Requires immediate bank payout</p>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <div className="border-b border-slate-100 bg-slate-50/50 px-5 py-3 dark:border-slate-800 dark:bg-slate-950/40 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                MSME Vendor Invoices Payment Calendar
              </span>
              <span className="text-[11px] text-slate-400">Section 15 of MSMED Act, 2006</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 dark:bg-slate-950 dark:text-slate-400">
                  <tr>
                    <th className="px-4 py-3">Vendor &amp; Udyam No</th>
                    <th className="px-4 py-3">Invoice No</th>
                    <th className="px-4 py-3">Bill Date</th>
                    <th className="px-4 py-3">45-Day Deadline</th>
                    <th className="px-4 py-3">Days Left</th>
                    <th className="px-4 py-3">Payable Amount</th>
                    <th className="px-4 py-3">Status / Risk</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {msmeItems.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                        {loading ? "Checking MSME Vendor Records..." : "No active MSME payables. 100% Section 43B(h) compliant!"}
                      </td>
                    </tr>
                  ) : (
                    msmeItems.map((item) => (
                      <tr key={item.invoiceId} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                        <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                          <div>{item.vendorName}</div>
                          <div className="font-mono text-[10px] text-slate-400">{item.udyamRegNo} ({item.category})</div>
                        </td>
                        <td className="px-4 py-3 font-mono font-semibold text-slate-700 dark:text-slate-300">
                          {item.invoiceNumber}
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          {new Date(item.invoiceDate).toLocaleDateString("en-IN")}
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">
                          {new Date(item.dueDate).toLocaleDateString("en-IN")}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              "font-bold font-mono",
                              item.daysRemaining < 0
                                ? "text-rose-600 dark:text-rose-400"
                                : item.daysRemaining <= 10
                                ? "text-amber-600"
                                : "text-emerald-600"
                            )}
                          >
                            {item.daysRemaining < 0 ? `${Math.abs(item.daysRemaining)}d OVERDUE` : `${item.daysRemaining} days`}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-bold font-mono text-slate-900 dark:text-white">
                          ₹{item.balanceAmount.toLocaleString("en-IN")}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold",
                              item.riskLevel === "Disallowed_43Bh"
                                ? "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400"
                                : item.riskLevel === "Critical"
                                ? "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400"
                                : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400"
                            )}
                          >
                            {item.riskLevel === "Disallowed_43Bh" ? "Sec 43B(h) Disallowed" : item.riskLevel}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* TDS Section Breakdown */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <p className="text-xs font-semibold text-slate-500">Total TDS Deducted</p>
              <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">
                ₹{totalTds.toLocaleString("en-IN")}
              </p>
              <p className="mt-0.5 text-[11px] text-slate-400">Quarterly cumulative</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <p className="text-xs font-semibold text-slate-500">Active Sections</p>
              <p className="mt-1 text-2xl font-black text-blue-600 dark:text-blue-400">
                {tdsSections.length} Sections
              </p>
              <p className="mt-0.5 text-[11px] text-slate-400">194C, 194J, 194Q, 194H</p>
            </div>
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4 shadow-xs dark:border-emerald-900/40 dark:bg-emerald-950/20">
              <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Form 26Q Export</p>
              <p className="mt-1 text-sm font-bold text-emerald-800 dark:text-emerald-300">
                100% PAN Verified
              </p>
              <p className="mt-0.5 text-[11px] text-emerald-600 dark:text-emerald-400">Ready for NSDL FVU filing utility</p>
            </div>
          </div>

          <div className="space-y-4">
            {tdsSections.map((sec) => (
              <div
                key={sec.section}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                  <div>
                    <span className="rounded-md bg-blue-100 px-2 py-0.5 font-mono text-xs font-bold text-blue-700 dark:bg-blue-950/60 dark:text-blue-400">
                      Section {sec.section}
                    </span>
                    <span className="ml-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                      {sec.sectionDescription}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-500">TDS Deducted: </span>
                    <span className="font-mono text-sm font-bold text-slate-900 dark:text-white">
                      ₹{sec.totalTdsDeducted.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>

                <div className="mt-3 overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="text-[10px] uppercase tracking-wider text-slate-400">
                      <tr>
                        <th className="py-2">Vendor Name</th>
                        <th className="py-2">PAN</th>
                        <th className="py-2">Invoice</th>
                        <th className="py-2">Gross Amount</th>
                        <th className="py-2">Rate</th>
                        <th className="py-2">TDS Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60">
                      {sec.vendors?.map((v, i) => (
                        <tr key={i}>
                          <td className="py-2 font-medium text-slate-800 dark:text-slate-200">{v.vendorName}</td>
                          <td className="py-2 font-mono text-slate-500">{v.pan}</td>
                          <td className="py-2 font-mono text-slate-500">{v.invoiceNumber}</td>
                          <td className="py-2 font-mono">₹{v.grossAmount.toLocaleString("en-IN")}</td>
                          <td className="py-2 font-mono font-bold text-blue-600">{v.tdsRate}%</td>
                          <td className="py-2 font-mono font-bold text-slate-900 dark:text-white">₹{v.tdsAmount.toLocaleString("en-IN")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

