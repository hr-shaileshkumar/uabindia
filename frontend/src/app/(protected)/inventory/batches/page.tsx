"use client";

import React, { useState, useEffect } from "react";
import {
  Boxes,
  Barcode,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Search,
  Plus,
  ShieldCheck,
  PackageCheck,
  ChevronRight,
  Filter,
} from "lucide-react";
import apiClient from "@/services/apiClient";
import { cn } from "@/lib/utils";

interface BatchItem {
  id: string;
  batchNumber: string;
  lotNumber?: string;
  itemCode: string;
  itemName: string;
  warehouseName: string;
  manufactureDate?: string;
  expiryDate?: string;
  daysToExpiry?: number;
  quantityReceived: number;
  quantityCurrent: number;
  unitCost: number;
  totalValue: number;
  status: string;
}

interface SerialItem {
  id: string;
  serialNumber: string;
  itemCode: string;
  itemName: string;
  warehouseName: string;
  batchNumber?: string;
  status: string;
  warrantyExpiryDate?: string;
  assignedCustomerOrProject?: string;
}

export default function BatchAndSerialTraceabilityPage() {
  const [activeTab, setActiveTab] = useState<"batches" | "serials">("batches");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [batches, setBatches] = useState<BatchItem[]>([]);
  const [serials, setSerials] = useState<SerialItem[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [bRes, sRes] = await Promise.all([
          apiClient.get("/inventory/batches").catch(() => ({ data: { items: [] } })),
          apiClient.get("/inventory/serials").catch(() => ({ data: { items: [] } })),
        ]);
        if (bRes.data?.items) setBatches(bRes.data.items);
        if (sRes.data?.items) setSerials(sRes.data.items);
      } finally {
        setLoading(false);
      }
    }
    void loadData();
  }, []);

  const filteredBatches = batches.filter(
    (b) =>
      b.batchNumber.toLowerCase().includes(search.toLowerCase()) ||
      b.itemName.toLowerCase().includes(search.toLowerCase()) ||
      b.itemCode.toLowerCase().includes(search.toLowerCase())
  );

  const filteredSerials = serials.filter(
    (s) =>
      s.serialNumber.toLowerCase().includes(search.toLowerCase()) ||
      s.itemName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-4 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400">
              Traceability &amp; FEFO Engine
            </span>
            <span className="text-xs text-slate-500">Pharma / FMCG / Electronics Grade</span>
          </div>
          <h1 className="mt-1 text-2xl font-black text-slate-900 tracking-tight dark:text-white">
            Batch &amp; Serial Number Traceability Center
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            First-Expired-First-Out (FEFO) stock priority, manufacturing lot tracking, and per-unit serial lifecycle control.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("batches")}
            className={cn(
              "rounded-xl px-4 py-2 text-xs font-bold transition-all",
              activeTab === "batches"
                ? "bg-slate-900 text-white shadow-md dark:bg-blue-600"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
            )}
          >
            Batch Inventory (FEFO)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("serials")}
            className={cn(
              "rounded-xl px-4 py-2 text-xs font-bold transition-all",
              activeTab === "serials"
                ? "bg-slate-900 text-white shadow-md dark:bg-blue-600"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
            )}
          >
            Serial Number Registry
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Batch No, Serial No, SKU, or Product Name..."
            className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 py-2 text-xs focus:border-blue-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
          />
        </div>
      </div>

      {activeTab === "batches" ? (
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 dark:bg-slate-950 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3">Batch Number</th>
                  <th className="px-4 py-3">Item / SKU</th>
                  <th className="px-4 py-3">Warehouse</th>
                  <th className="px-4 py-3">Mfg Date</th>
                  <th className="px-4 py-3">Expiry Date (FEFO)</th>
                  <th className="px-4 py-3">Quantity Available</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredBatches.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                      {loading ? "Loading Batches..." : "No active batches found."}
                    </td>
                  </tr>
                ) : (
                  filteredBatches.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                      <td className="px-4 py-3 font-mono font-bold text-slate-900 dark:text-white">
                        {b.batchNumber}
                        {b.lotNumber && <span className="ml-1 text-[10px] text-slate-400">({b.lotNumber})</span>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">{b.itemName}</div>
                        <div className="font-mono text-[10px] text-slate-400">{b.itemCode}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{b.warehouseName}</td>
                      <td className="px-4 py-3 text-slate-500">
                        {b.manufactureDate ? new Date(b.manufactureDate).toLocaleDateString("en-IN") : "-"}
                      </td>
                      <td className="px-4 py-3">
                        {b.expiryDate ? (
                          <div>
                            <span className="font-medium text-slate-800 dark:text-slate-200">
                              {new Date(b.expiryDate).toLocaleDateString("en-IN")}
                            </span>
                            {b.daysToExpiry != null && (
                              <span
                                className={cn(
                                  "ml-2 text-[10px] font-bold",
                                  b.daysToExpiry < 30 ? "text-rose-600" : "text-emerald-600"
                                )}
                              >
                                ({b.daysToExpiry}d left)
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400">Non-expiring</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-slate-900 dark:text-white">
                        {b.quantityCurrent.toLocaleString("en-IN")} units
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400">
                          {b.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 dark:bg-slate-950 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3">Serial Number</th>
                  <th className="px-4 py-3">Product Name</th>
                  <th className="px-4 py-3">Batch Link</th>
                  <th className="px-4 py-3">Current Location</th>
                  <th className="px-4 py-3">Warranty Expiry</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredSerials.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                      {loading ? "Loading Serial Numbers..." : "No serial numbers registered yet."}
                    </td>
                  </tr>
                ) : (
                  filteredSerials.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                      <td className="px-4 py-3 font-mono font-bold text-blue-600 dark:text-blue-400">
                        {s.serialNumber}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">
                        {s.itemName} ({s.itemCode})
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-500">{s.batchNumber || "-"}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{s.warehouseName}</td>
                      <td className="px-4 py-3 text-slate-500">
                        {s.warrantyExpiryDate ? new Date(s.warrantyExpiryDate).toLocaleDateString("en-IN") : "Standard"}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:bg-blue-950/60 dark:text-blue-400">
                          {s.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

