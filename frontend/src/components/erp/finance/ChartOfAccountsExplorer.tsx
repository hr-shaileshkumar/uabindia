"use client";

import React, { useState, useMemo } from "react";
import {
  FolderTree,
  Plus,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownLeft,
  DollarSign,
  Layers,
  ChevronRight,
  ChevronDown,
  Building2,
  FileSpreadsheet,
  Download,
} from "lucide-react";
import { CHART_OF_ACCOUNTS_CATALOG, ChartAccountOption } from "./JournalVoucherStudio";
import Link from "next/link";

interface AccountWithBalance extends ChartAccountOption {
  balance: number;
  drCr: "Dr" | "Cr";
  status: "Active" | "Inactive";
}

const SAMPLE_COA_BALANCES: Record<string, { balance: number; drCr: "Dr" | "Cr" }> = {
  "1010": { balance: 145000, drCr: "Dr" },
  "1020": { balance: 8420000, drCr: "Dr" },
  "1025": { balance: 520000, drCr: "Dr" },
  "1040": { balance: 4120000, drCr: "Dr" },
  "1070": { balance: 185000, drCr: "Dr" },
  "1071": { balance: 185000, drCr: "Dr" },
  "1072": { balance: 310000, drCr: "Dr" },
  "1510": { balance: 12500000, drCr: "Dr" },
  "1520": { balance: 1840000, drCr: "Dr" },
  "2010": { balance: 2950000, drCr: "Cr" },
  "2020": { balance: 421700, drCr: "Cr" },
  "2030": { balance: 77600, drCr: "Cr" },
  "2035": { balance: 24500, drCr: "Cr" },
  "2050": { balance: 298000, drCr: "Cr" },
  "2051": { balance: 298000, drCr: "Cr" },
  "2052": { balance: 450000, drCr: "Cr" },
  "2100": { balance: 5000000, drCr: "Cr" },
  "3010": { balance: 10000000, drCr: "Cr" },
  "3020": { balance: 7540200, drCr: "Cr" },
  "4010": { balance: 18400000, drCr: "Cr" },
  "4020": { balance: 3200000, drCr: "Cr" },
  "4090": { balance: 145000, drCr: "Cr" },
  "5010": { balance: 5820000, drCr: "Dr" },
  "5020": { balance: 465600, drCr: "Dr" },
  "5030": { balance: 960000, drCr: "Dr" },
  "5040": { balance: 450000, drCr: "Dr" },
  "5050": { balance: 680000, drCr: "Dr" },
  "5060": { balance: 340000, drCr: "Dr" },
  "5090": { balance: 420000, drCr: "Dr" },
};

export function ChartOfAccountsExplorer() {
  const [activeTab, setActiveTab] = useState<"ALL" | "Asset" | "Liability" | "Equity" | "Revenue" | "Expense">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const accounts: AccountWithBalance[] = useMemo(() => {
    return CHART_OF_ACCOUNTS_CATALOG.map((acc) => ({
      ...acc,
      balance: SAMPLE_COA_BALANCES[acc.code]?.balance || 0,
      drCr: SAMPLE_COA_BALANCES[acc.code]?.drCr || (acc.type === "Asset" || acc.type === "Expense" ? "Dr" : "Cr"),
      status: "Active",
    }));
  }, []);

  const filteredAccounts = useMemo(() => {
    return accounts.filter((acc) => {
      const matchesTab = activeTab === "ALL" || acc.type === activeTab;
      const matchesSearch =
        acc.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        acc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        acc.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesTab && matchesSearch;
    });
  }, [accounts, activeTab, searchQuery]);

  const summaryByType = useMemo(() => {
    const summary: Record<string, { count: number; total: number }> = {
      Asset: { count: 0, total: 0 },
      Liability: { count: 0, total: 0 },
      Equity: { count: 0, total: 0 },
      Revenue: { count: 0, total: 0 },
      Expense: { count: 0, total: 0 },
    };
    accounts.forEach((acc) => {
      if (summary[acc.type]) {
        summary[acc.type].count++;
        summary[acc.type].total += acc.balance;
      }
    });
    return summary;
  }, [accounts]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card border border-border/70 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
            <FolderTree className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              Master Chart of Accounts (CoA)
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Standard 5-class ledger hierarchy for general ledger mapping, statutory reporting, and journal postings
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/finance/journal-entries"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            Create Journal Voucher
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {(["Asset", "Liability", "Equity", "Revenue", "Expense"] as const).map((type) => {
          const stats = summaryByType[type];
          return (
            <div
              key={type}
              onClick={() => setActiveTab(type)}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                activeTab === type
                  ? "bg-primary/5 border-primary shadow-xs ring-1 ring-primary"
                  : "bg-card border-border/70 hover:border-border"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  {type}
                </span>
                <span className="text-xs font-bold px-1.5 py-0.5 rounded-md bg-muted text-foreground">
                  {stats.count}
                </span>
              </div>
              <div className="text-base font-extrabold text-foreground mt-2">
                {formatCurrency(stats.total)}
              </div>
              <div className="text-[11px] text-muted-foreground mt-0.5">
                {type === "Asset" || type === "Expense" ? "Normal Debit" : "Normal Credit"}
              </div>
            </div>
          );
        })}
      </div>

      {/* Search & Tabs */}
      <div className="bg-card border border-border/70 rounded-2xl p-4 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search account code, title or group..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-input bg-background focus:ring-1 focus:ring-primary outline-hidden"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
            {(["ALL", "Asset", "Liability", "Equity", "Revenue", "Expense"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                  activeTab === tab
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/70 text-muted-foreground hover:bg-muted"
                }`}
              >
                {tab === "ALL" ? "All Heads" : tab}
              </button>
            ))}
          </div>
        </div>

        {/* Accounts Table */}
        <div className="overflow-x-auto border border-border/80 rounded-xl">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted/60 text-muted-foreground font-semibold border-b border-border">
              <tr>
                <th className="py-2.5 px-3 w-20">Code</th>
                <th className="py-2.5 px-3 min-w-[220px]">Account Head Name</th>
                <th className="py-2.5 px-3">Classification</th>
                <th className="py-2.5 px-3">Sub-Category</th>
                <th className="py-2.5 px-3 text-right">Ledger Balance</th>
                <th className="py-2.5 px-3 w-16 text-center">Type</th>
                <th className="py-2.5 px-3 w-20 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredAccounts.map((acc) => (
                <tr key={acc.code} className="hover:bg-muted/20 transition-colors">
                  <td className="py-2.5 px-3 font-mono font-bold text-primary">{acc.code}</td>
                  <td className="py-2.5 px-3 font-semibold text-foreground">{acc.name}</td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                        acc.type === "Asset"
                          ? "bg-blue-500/10 text-blue-600"
                          : acc.type === "Liability"
                          ? "bg-amber-500/10 text-amber-600"
                          : acc.type === "Equity"
                          ? "bg-purple-500/10 text-purple-600"
                          : acc.type === "Revenue"
                          ? "bg-emerald-500/10 text-emerald-600"
                          : "bg-rose-500/10 text-rose-600"
                      }`}
                    >
                      {acc.type}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-muted-foreground">{acc.category}</td>
                  <td className="py-2.5 px-3 text-right font-semibold text-foreground">
                    {formatCurrency(acc.balance)}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className="font-mono text-[11px] font-semibold text-muted-foreground">
                      {acc.drCr}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                      {acc.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

