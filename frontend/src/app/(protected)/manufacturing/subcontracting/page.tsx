"use client";

import React, { useState, useEffect } from "react";
import {
  Truck,
  FileText,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Building2,
  Search,
  Plus,
} from "lucide-react";
import apiClient from "@/services/apiClient";
import { cn } from "@/lib/utils";

interface SubcontractOrder {
  id: string;
  orderNumber: string;
  deliveryChallanNumber: string;
  challanDate: string;
  jobWorkerName: string;
  jobWorkerGstin: string;
  processDescription: string;
  expectedReturnDate: string;
  daysUntilOverdue: number;
  totalRawMaterialValue: number;
  agreedServiceRate: number;
  serviceTaxAmount: number;
  totalServiceAmount: number;
  status: string;
  issuedItemsCount: number;
  receivedItemsCount: number;
}

export default function SubcontractingJobWorkPage() {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<SubcontractOrder[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const res = await apiClient.get("/manufacturing/subcontracting").catch(() => ({ data: { items: [] } }));
        if (res.data?.items) setOrders(res.data.items);
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
            <span className="rounded-md bg-indigo-100 px-2.5 py-0.5 text-xs font-bold text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-400">
              GST Rule 55 / Section 143
            </span>
            <span className="text-xs text-slate-500">Job Work Compliance</span>
          </div>
          <h1 className="mt-1 text-2xl font-black text-slate-900 tracking-tight dark:text-white">
            Subcontracting &amp; Job Work Delivery Challans
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Dispatch materials to external job workers (plating, coating, machining) under statutory GST Delivery Challan with 180-day return aging.
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 dark:bg-slate-950 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3">Challan &amp; Order No</th>
                <th className="px-4 py-3">Job Worker (Vendor)</th>
                <th className="px-4 py-3">Process</th>
                <th className="px-4 py-3">Challan Date</th>
                <th className="px-4 py-3">GST 180-Day Deadline</th>
                <th className="px-4 py-3">Raw Material Value</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    {loading ? "Loading Subcontracting Challans..." : "No active job work challans found."}
                  </td>
                </tr>
              ) : (
                orders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3 font-mono">
                      <div className="font-bold text-slate-900 dark:text-white">{o.deliveryChallanNumber}</div>
                      <div className="text-[10px] text-slate-400">{o.orderNumber}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">{o.jobWorkerName}</div>
                      <div className="font-mono text-[10px] text-slate-400">{o.jobWorkerGstin}</div>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300">
                      {o.processDescription}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {new Date(o.challanDate).toLocaleDateString("en-IN")}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {new Date(o.expectedReturnDate).toLocaleDateString("en-IN")}
                      </span>
                      <span
                        className={cn(
                          "ml-2 text-[10px] font-bold",
                          o.daysUntilOverdue < 30 ? "text-rose-600" : "text-emerald-600"
                        )}
                      >
                        ({o.daysUntilOverdue}d left)
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-slate-900 dark:text-white">
                      ₹{o.totalRawMaterialValue.toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:bg-blue-950/60 dark:text-blue-400">
                        {o.status}
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
  );
}

