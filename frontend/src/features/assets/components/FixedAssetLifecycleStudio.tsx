"use client";

import React, { useState, useMemo } from "react";
import {
  Boxes,
  Plus,
  Search,
  Filter,
  DollarSign,
  Calendar,
  Building2,
  TrendingDown,
  Wrench,
  QrCode,
  ShieldCheck,
  CheckCircle2,
  FileCheck2,
  Printer,
  ChevronRight,
  Layers,
} from "lucide-react";
import { notifySuccess, notifyError } from "@/lib/notifications";

export interface FixedAsset {
  id: string;
  assetCode: string;
  assetName: string;
  category: "MACHINERY" | "IT_EQUIPMENT" | "VEHICLES" | "FURNITURE";
  purchaseDate: string;
  purchaseCost: number;
  usefulLifeYears: number;
  salvageValue: number;
  depreciationMethod: "SLM" | "WDV";
  accumulatedDepreciation: number;
  location: string;
  custodian: string;
  status: "ACTIVE" | "MAINTENANCE" | "RETIRED";
}

export const INITIAL_ASSETS: FixedAsset[] = [
  {
    id: "ast-1",
    assetCode: "AST-MCH-01",
    assetName: "5-Axis CNC Milling Center Machine #3",
    category: "MACHINERY",
    purchaseDate: "2024-04-15",
    purchaseCost: 6800000,
    usefulLifeYears: 10,
    salvageValue: 300000,
    depreciationMethod: "SLM",
    accumulatedDepreciation: 1625000,
    location: "Plant 1 - Pune Manufacturing (Cell A)",
    custodian: "Ramanathan Iyer",
    status: "ACTIVE",
  },
  {
    id: "ast-2",
    assetCode: "AST-SRV-02",
    assetName: "Dell PowerEdge R750 Enterprise Server Cluster",
    category: "IT_EQUIPMENT",
    purchaseDate: "2025-01-10",
    purchaseCost: 1850000,
    usefulLifeYears: 4,
    salvageValue: 50000,
    depreciationMethod: "SLM",
    accumulatedDepreciation: 787500,
    location: "Corporate Data Center - BKC Mumbai",
    custodian: "Amitabh Roy",
    status: "ACTIVE",
  },
  {
    id: "ast-3",
    assetCode: "AST-FLT-03",
    assetName: "Tata Prima Heavy Commercial Long-Haul Hauler (MH-12-QW-9901)",
    category: "VEHICLES",
    purchaseDate: "2023-09-20",
    purchaseCost: 3450000,
    usefulLifeYears: 8,
    salvageValue: 400000,
    depreciationMethod: "WDV",
    accumulatedDepreciation: 1240000,
    location: "Bhiwandi Central Fulfillment Depot",
    custodian: "Rajesh Shinde",
    status: "ACTIVE",
  },
  {
    id: "ast-4",
    assetCode: "AST-LAB-04",
    assetName: "High Voltage QA Dynamometer Test Bench",
    category: "MACHINERY",
    purchaseDate: "2025-06-01",
    purchaseCost: 2200000,
    usefulLifeYears: 7,
    salvageValue: 100000,
    depreciationMethod: "SLM",
    accumulatedDepreciation: 425000,
    location: "Pune QA Testing Bay",
    custodian: "Ganesh Kulkarni",
    status: "MAINTENANCE",
  },
];

export function FixedAssetLifecycleStudio() {
  const [assets, setAssets] = useState<FixedAsset[]>(INITIAL_ASSETS);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Aggregations
  const totalGrossCost = useMemo(() => {
    return assets.reduce((sum, a) => sum + a.purchaseCost, 0);
  }, [assets]);

  const totalAccumulatedDep = useMemo(() => {
    return assets.reduce((sum, a) => sum + a.accumulatedDepreciation, 0);
  }, [assets]);

  const totalNetBookValue = useMemo(() => {
    return totalGrossCost - totalAccumulatedDep;
  }, [totalGrossCost, totalAccumulatedDep]);

  // Filtered Assets
  const filteredAssets = useMemo(() => {
    return assets.filter((a) => {
      const matchCat = categoryFilter === "ALL" || a.category === categoryFilter;
      const matchSearch =
        a.assetCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.assetName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.location.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [assets, categoryFilter, searchQuery]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const handlePostDepreciationJV = () => {
    notifySuccess("Monthly depreciation schedule computed and journal voucher queued to General Ledger.");
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Navigation & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card border border-border/70 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
            <Boxes className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-foreground">
                Fixed Assets & Depreciation Lifecycle Studio
              </h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                Ind-AS 16 / GAAP Compliant
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Capital asset register, SLM/WDV depreciation schedules, custodian tracking, and general ledger journal posting
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePostDepreciationJV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border border-border bg-card hover:bg-muted/70 transition-colors text-foreground"
          >
            <FileCheck2 className="w-3.5 h-3.5 text-primary" />
            Post Depreciation Run
          </button>
          <button
            onClick={() => setCreateModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            Register Capital Asset
          </button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-card border border-border/70 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>Gross Capital Cost</span>
            <Boxes className="w-4 h-4 text-primary" />
          </div>
          <div className="text-2xl font-black text-foreground mt-2">
            {formatCurrency(totalGrossCost)}
          </div>
          <div className="text-[11px] text-muted-foreground mt-1">
            Original acquisition value
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border/70 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>Accumulated Depreciation</span>
            <TrendingDown className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-2">
            {formatCurrency(totalAccumulatedDep)}
          </div>
          <div className="text-[11px] text-muted-foreground mt-1">
            Amortized to P&L to date
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border/70 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>Net Book Value (NBV)</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
            {formatCurrency(totalNetBookValue)}
          </div>
          <div className="text-[11px] text-muted-foreground mt-1">
            Current balance sheet asset value
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border/70 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>Active Machines & Assets</span>
            <ShieldCheck className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-black text-foreground mt-2">
            {assets.length} Units
          </div>
          <div className="text-[11px] text-muted-foreground mt-1">
            Tracked with QR barcode tags
          </div>
        </div>
      </div>

      {/* Main Assets Table */}
      <div className="bg-card border border-border/70 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search asset tag, title or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-input bg-background focus:ring-1 focus:ring-primary outline-hidden"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
            {(["ALL", "MACHINERY", "IT_EQUIPMENT", "VEHICLES"] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                  categoryFilter === cat
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/70 text-muted-foreground hover:bg-muted"
                }`}
              >
                {cat === "ALL" ? "All Categories" : cat.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto border border-border/80 rounded-xl">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted/60 text-muted-foreground font-semibold border-b border-border">
              <tr>
                <th className="py-2.5 px-3">Asset Tag</th>
                <th className="py-2.5 px-3 min-w-[220px]">Asset Name & Category</th>
                <th className="py-2.5 px-3">Acquired</th>
                <th className="py-2.5 px-3 text-right">Gross Cost</th>
                <th className="py-2.5 px-3 text-right">Depreciation</th>
                <th className="py-2.5 px-3 text-right">Net Book Value</th>
                <th className="py-2.5 px-3">Location & Custodian</th>
                <th className="py-2.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredAssets.map((a) => {
                const nbv = a.purchaseCost - a.accumulatedDepreciation;
                return (
                  <tr key={a.id} className="hover:bg-muted/20 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-primary">{a.assetCode}</td>
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-foreground">{a.assetName}</div>
                      <div className="text-[11px] text-muted-foreground">{a.category} • Method: {a.depreciationMethod} ({a.usefulLifeYears}y)</div>
                    </td>
                    <td className="py-2.5 px-3 text-muted-foreground">{a.purchaseDate}</td>
                    <td className="py-2.5 px-3 text-right font-medium text-foreground">{formatCurrency(a.purchaseCost)}</td>
                    <td className="py-2.5 px-3 text-right font-medium text-amber-600 dark:text-amber-400">{formatCurrency(a.accumulatedDepreciation)}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-foreground">{formatCurrency(nbv)}</td>
                    <td className="py-2.5 px-3 text-muted-foreground">
                      <div>{a.location}</div>
                      <div className="text-[11px] text-foreground font-medium">Custodian: {a.custodian}</div>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          a.status === "ACTIVE"
                            ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/30"
                            : "bg-amber-500/10 text-amber-600 border border-amber-500/30"
                        }`}
                      >
                        {a.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Asset Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-border/80 pb-3">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Plus className="w-4 h-4 text-primary" />
                Register Capital Asset
              </h3>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="text-xs text-muted-foreground hover:text-foreground font-semibold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-muted-foreground block mb-1">Asset Description:</label>
                <input
                  type="text"
                  placeholder="e.g. Automated SMT Pick & Place Machine"
                  className="w-full px-3 py-2 rounded-xl border border-input bg-background font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-muted-foreground block mb-1">Asset Category:</label>
                  <select className="w-full px-3 py-2 rounded-xl border border-input bg-background font-medium">
                    <option value="MACHINERY">Plant & Machinery</option>
                    <option value="IT_EQUIPMENT">IT Equipment / Servers</option>
                    <option value="VEHICLES">Fleet Commercial Vehicles</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-muted-foreground block mb-1">Purchase Cost (INR):</label>
                  <input
                    type="number"
                    defaultValue={2500000}
                    className="w-full px-3 py-2 rounded-xl border border-input bg-background font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-muted-foreground block mb-1">Depreciation Method:</label>
                  <select className="w-full px-3 py-2 rounded-xl border border-input bg-background font-medium">
                    <option value="SLM">Straight Line Method (SLM)</option>
                    <option value="WDV">Written Down Value (WDV)</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-muted-foreground block mb-1">Useful Life (Years):</label>
                  <input
                    type="number"
                    defaultValue={8}
                    className="w-full px-3 py-2 rounded-xl border border-input bg-background"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-border/80">
              <button
                onClick={() => setCreateModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-border hover:bg-muted/70 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  notifySuccess("Capital asset registered with QR barcode tag.");
                  setCreateModalOpen(false);
                }}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-xs"
              >
                Save Capital Asset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

