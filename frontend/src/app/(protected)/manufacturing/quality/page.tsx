"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileCheck,
  Search,
  Plus,
  Clock,
  ExternalLink,
  ChevronRight,
  ClipboardList,
} from "lucide-react";
import apiClient from "@/services/apiClient";
import { cn } from "@/lib/utils";

interface InspectionLot {
  id: string;
  lotNumber: string;
  sourceType: string;
  referenceNumber: string;
  itemCode: string;
  itemName: string;
  batchNumber?: string;
  quantityToInspect: number;
  sampleQuantity: number;
  passedQuantity: number;
  rejectedQuantity: number;
  inspectionStatus: string;
  inspectorName?: string;
  inspectionDate: string;
  remarks?: string;
  parameterCount: number;
}

interface NcrItem {
  id: string;
  ncrNumber: string;
  lotNumber: string;
  severity: string;
  defectCategory: string;
  defectDescription: string;
  rootCause?: string;
  correctiveAction?: string;
  disposition: string;
  status: string;
}

export default function QualityManagementPage() {
  const [activeTab, setActiveTab] = useState<"lots" | "ncr">("lots");
  const [loading, setLoading] = useState(true);
  const [lots, setLots] = useState<InspectionLot[]>([]);
  const [ncrs, setNcrs] = useState<NcrItem[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [lotRes, ncrRes] = await Promise.all([
          apiClient.get("/quality/inspection-lots").catch(() => ({ data: { items: [] } })),
          apiClient.get("/quality/ncr").catch(() => ({ data: { items: [] } })),
        ]);
        if (lotRes.data?.items) setLots(lotRes.data.items);
        if (ncrRes.data?.items) setNcrs(ncrRes.data.items);
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
            <span className="rounded-md bg-purple-100 px-2.5 py-0.5 text-xs font-bold text-purple-800 dark:bg-purple-950/60 dark:text-purple-400">
              Quality Assurance (QA / QC)
            </span>
            <span className="text-xs text-slate-500">ISO 9001 / CoA Compliance</span>
          </div>
          <h1 className="mt-1 text-2xl font-black text-slate-900 tracking-tight dark:text-white">
            Quality Inspection &amp; Non-Conformance (NCR) Hub
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Inward GRN inspection, in-process production sampling, Certificate of Analysis (CoA) generation, and CAPA resolution.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("lots")}
            className={cn(
              "rounded-xl px-4 py-2 text-xs font-bold transition-all",
              activeTab === "lots"
                ? "bg-slate-900 text-white shadow-md dark:bg-blue-600"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
            )}
          >
            Inspection Lots
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("ncr")}
            className={cn(
              "rounded-xl px-4 py-2 text-xs font-bold transition-all",
              activeTab === "ncr"
                ? "bg-slate-900 text-white shadow-md dark:bg-blue-600"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
            )}
          >
            Non-Conformance (NCR / CAPA)
          </button>
        </div>
      </div>

      {activeTab === "lots" ? (
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 dark:bg-slate-950 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3">Lot Number</th>
                  <th className="px-4 py-3">Source &amp; Ref</th>
                  <th className="px-4 py-3">Item Name</th>
                  <th className="px-4 py-3">Lot Size</th>
                  <th className="px-4 py-3">Passed / Rejected</th>
                  <th className="px-4 py-3">Inspection Date</th>
                  <th className="px-4 py-3">QC Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {lots.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                      {loading ? "Loading QC Inspection Lots..." : "No active inspection lots pending."}
                    </td>
                  </tr>
                ) : (
                  lots.map((lot) => (
                    <tr key={lot.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                      <td className="px-4 py-3 font-mono font-bold text-slate-900 dark:text-white">
                        {lot.lotNumber}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{lot.sourceType}</span>
                        <div className="font-mono text-[10px] text-slate-400">{lot.referenceNumber || "-"}</div>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">
                        {lot.itemName}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-400">
                        {lot.quantityToInspect} units (Sample: {lot.sampleQuantity})
                      </td>
                      <td className="px-4 py-3 font-mono">
                        <span className="text-emerald-600 font-bold">{lot.passedQuantity} Pass</span>
                        {lot.rejectedQuantity > 0 && (
                          <span className="ml-2 text-rose-600 font-bold">/ {lot.rejectedQuantity} Rej</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {new Date(lot.inspectionDate).toLocaleDateString("en-IN")}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold",
                            lot.inspectionStatus === "Passed"
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400"
                              : lot.inspectionStatus === "Rejected"
                              ? "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-400"
                              : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400"
                          )}
                        >
                          {lot.inspectionStatus}
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
                  <th className="px-4 py-3">NCR Number</th>
                  <th className="px-4 py-3">Severity</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Defect Description</th>
                  <th className="px-4 py-3">Disposition</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {ncrs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                      {loading ? "Loading NCRs..." : "Zero Non-Conformance defects recorded!"}
                    </td>
                  </tr>
                ) : (
                  ncrs.map((n) => (
                    <tr key={n.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                      <td className="px-4 py-3 font-mono font-bold text-rose-600 dark:text-rose-400">
                        {n.ncrNumber}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">{n.severity}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{n.defectCategory}</td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{n.defectDescription}</td>
                      <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">{n.disposition}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-950/60 dark:text-amber-400">
                          {n.status}
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

