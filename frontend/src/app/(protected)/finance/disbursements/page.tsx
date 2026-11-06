"use client";

import React, { useState, useEffect } from "react";
import {
  CreditCard,
  Building2,
  CheckCircle2,
  Clock,
  Download,
  AlertTriangle,
  Play,
  ArrowRight,
  Send,
  Loader2,
} from "lucide-react";
import apiClient from "@/services/apiClient";
import { cn } from "@/lib/utils";

interface DisbursementBatch {
  id: string;
  batchNumber: string;
  disbursementType: string;
  paymentMode: string;
  debitAccountNumber: string;
  totalAmount: number;
  totalBeneficiaries: number;
  status: string;
  gatewayProvider?: string;
  gatewayTransactionReference?: string;
  processedAt?: string;
  createdAt: string;
  successfulCount: number;
  pendingCount: number;
}

export default function ConnectedBankingDisbursementsPage() {
  const [loading, setLoading] = useState(true);
  const [batches, setBatches] = useState<DisbursementBatch[]>([]);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchBatches = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get("/finance/banking/disbursements").catch(() => ({ data: { items: [] } }));
      if (res.data?.items) setBatches(res.data.items);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchBatches();
  }, []);

  const handleExecutePayout = async (id: string) => {
    try {
      setProcessingId(id);
      const res = await apiClient.post(`/finance/banking/disbursements/${id}/execute-payout`);
      alert(res.data?.message || "Payout processed successfully!");
      await fetchBatches();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Payout failed";
      alert(`Payout Execution Error: ${msg}`);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-4 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400">
              Open Banking API &amp; NPCI Gateway
            </span>
            <span className="text-xs text-slate-500">Instant Direct Disbursement</span>
          </div>
          <h1 className="mt-1 text-2xl font-black text-slate-900 tracking-tight dark:text-white">
            Connected Banking &amp; Batch Payout Center
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            One-click direct bank disbursements for vendor purchase invoices and monthly employee payroll via NEFT/RTGS/IMPS.
          </p>
        </div>
      </div>

      {/* Batches Table */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 dark:bg-slate-950 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3">Batch Number</th>
                <th className="px-4 py-3">Disbursement Type</th>
                <th className="px-4 py-3">Mode &amp; Debit Acc</th>
                <th className="px-4 py-3">Beneficiaries</th>
                <th className="px-4 py-3">Total Amount</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {batches.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    {loading ? "Loading Banking Disbursement Batches..." : "No disbursement batches created yet."}
                  </td>
                </tr>
              ) : (
                batches.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3 font-mono">
                      <div className="font-bold text-slate-900 dark:text-white">{b.batchNumber}</div>
                      <div className="text-[10px] text-slate-400">
                        {new Date(b.createdAt).toLocaleDateString("en-IN")}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">
                      {b.disbursementType}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-bold font-mono text-slate-900 dark:text-white">{b.paymentMode}</span>
                      <div className="font-mono text-[10px] text-slate-400">Acc: {b.debitAccountNumber}</div>
                    </td>
                    <td className="px-4 py-3 font-mono font-semibold text-slate-700 dark:text-slate-300">
                      {b.totalBeneficiaries} Accounts
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-slate-900 dark:text-white">
                      ₹{b.totalAmount.toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold",
                          b.status === "Success"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400"
                            : b.status === "Processing"
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-400"
                            : "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300"
                        )}
                      >
                        {b.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {b.status === "Draft" && (
                          <button
                            type="button"
                            disabled={processingId === b.id}
                            onClick={() => handleExecutePayout(b.id)}
                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-2xs"
                          >
                            {processingId === b.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Send className="h-3 w-3" />
                            )}
                            Execute Payout
                          </button>
                        )}
                        <a
                          href={`/api/v1/finance/banking/disbursements/${b.id}/export-bank-file`}
                          download
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200"
                        >
                          <Download className="h-3 w-3" /> Bank File
                        </a>
                      </div>
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

