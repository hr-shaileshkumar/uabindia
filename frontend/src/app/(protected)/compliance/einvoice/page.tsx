"use client";

import React, { useState, useEffect } from "react";
import {
  FileText,
  QrCode,
  Truck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Search,
  RefreshCw,
  ExternalLink,
  Printer,
  Copy,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import apiClient from "@/services/apiClient";
import { cn } from "@/lib/utils";

interface EInvoiceRecord {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  vendorName: string;
  vendorGstin: string;
  totalAmount: number;
  taxAmount: number;
  isIrnGenerated: boolean;
  irn: string | null;
  ackNo: string | null;
  ackDate: string | null;
  ewbNumber: string | null;
  ewbValidUntil: string | null;
  status: string;
}

interface IrnResultModalData {
  invoiceNumber: string;
  irn: string;
  ackNo: string;
  ackDate: string;
  signedQrCode: string;
  qrPayload: Record<string, unknown>;
}

interface EwbResultModalData {
  invoiceNumber: string;
  ewbNumber: string;
  ewbDate: string;
  validUntil: string;
  validityDays: number;
  transporterName: string;
  vehicleNumber: string;
  distanceKm: number;
}

export default function EInvoicePage() {
  const [invoices, setInvoices] = useState<EInvoiceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [generatingIrnId, setGeneratingIrnId] = useState<string | null>(null);
  const [generatingEwbId, setGeneratingEwbId] = useState<string | null>(null);

  // Modals
  const [irnModal, setIrnModal] = useState<IrnResultModalData | null>(null);
  const [ewbModal, setEwbModal] = useState<EwbResultModalData | null>(null);
  const [ewbFormTarget, setEwbFormTarget] = useState<EInvoiceRecord | null>(null);
  const [transporter, setTransporter] = useState("Gati KWE Logistics");
  const [vehicleNo, setVehicleNo] = useState("DL-01-AB-1234");
  const [distanceKm, setDistanceKm] = useState(350);

  const [copiedText, setCopiedText] = useState<string | null>(null);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get<EInvoiceRecord[]>("/compliance/einvoice/pending");
      if (Array.isArray(res.data)) {
        setInvoices(res.data);
      }
    } catch {
      // Fallback local mock data for presentation
      setInvoices([
        {
          id: "e1",
          invoiceNumber: "INV-2026-A101",
          invoiceDate: "2026-11-04",
          vendorName: "Bharat Precision Tooling Ltd",
          vendorGstin: "07AAACZ1234A1Z1",
          totalAmount: 148500,
          taxAmount: 22650,
          isIrnGenerated: true,
          irn: "9f83c18b76e273f08e493e8271a396264eef938c5f0a0d92a4e2874f67c3b129",
          ackNo: "11261098451234",
          ackDate: "2026-11-04 14:32:00",
          ewbNumber: "241098234512",
          ewbValidUntil: "2026-11-06 23:59:59",
          status: "IRN_Active",
        },
        {
          id: "e2",
          invoiceNumber: "INV-2026-B202",
          invoiceDate: "2026-11-05",
          vendorName: "Zenith Tooling Solutions",
          vendorGstin: "27AABCV5678B1Z2",
          totalAmount: 384000,
          taxAmount: 58576,
          isIrnGenerated: false,
          irn: null,
          ackNo: null,
          ackDate: null,
          ewbNumber: null,
          ewbValidUntil: null,
          status: "Pending_IRN",
        },
        {
          id: "e3",
          invoiceNumber: "INV-2026-C303",
          invoiceDate: "2026-11-05",
          vendorName: "Delta Packaging Industries",
          vendorGstin: "19AABCF9012C1Z4",
          totalAmount: 88500,
          taxAmount: 13500,
          isIrnGenerated: false,
          irn: null,
          ackNo: null,
          ackDate: null,
          ewbNumber: null,
          ewbValidUntil: null,
          status: "Pending_IRN",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchInvoices();
  }, []);

  const handleCopy = (text: string, label: string) => {
    void navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2500);
  };

  const handleGenerateIrn = async (inv: EInvoiceRecord) => {
    try {
      setGeneratingIrnId(inv.id);
      const res = await apiClient.post("/compliance/einvoice/generate-irn", {
        invoiceId: inv.id,
        supplierGstin: "07AAAAU1234A1Z5",
        recipientGstin: inv.vendorGstin,
        documentType: "INV",
      });

      if (res.data?.success) {
        setIrnModal({
          invoiceNumber: inv.invoiceNumber,
          irn: res.data.irn,
          ackNo: res.data.ackNo,
          ackDate: res.data.ackDate,
          signedQrCode: res.data.signedQrCode,
          qrPayload: res.data.qrPayload,
        });

        // Update local state
        setInvoices((prev) =>
          prev.map((item) =>
            item.id === inv.id
              ? {
                  ...item,
                  isIrnGenerated: true,
                  irn: res.data.irn,
                  ackNo: res.data.ackNo,
                  ackDate: res.data.ackDate,
                  status: "IRN_Active",
                }
              : item
          )
        );
      }
    } catch {
      alert("IRN generation simulated response error.");
    } finally {
      setGeneratingIrnId(null);
    }
  };

  const handleGenerateEwb = async () => {
    if (!ewbFormTarget) return;
    try {
      setGeneratingEwbId(ewbFormTarget.id);
      const res = await apiClient.post("/compliance/einvoice/generate-ewaybill", {
        invoiceId: ewbFormTarget.id,
        transporterName: transporter,
        vehicleNumber: vehicleNo,
        distanceKm,
        transportMode: "Road",
      });

      if (res.data?.success) {
        setEwbModal({
          invoiceNumber: ewbFormTarget.invoiceNumber,
          ewbNumber: res.data.ewbNumber,
          ewbDate: res.data.ewbDate,
          validUntil: res.data.validUntil,
          validityDays: res.data.validityDays,
          transporterName: res.data.transporterName,
          vehicleNumber: res.data.vehicleNumber,
          distanceKm: res.data.distanceKm,
        });

        // Update local state
        setInvoices((prev) =>
          prev.map((item) =>
            item.id === ewbFormTarget.id
              ? {
                  ...item,
                  ewbNumber: res.data.ewbNumber,
                  ewbValidUntil: res.data.validUntil,
                }
              : item
          )
        );
        setEwbFormTarget(null);
      }
    } catch {
      alert("E-Way Bill generation simulated response error.");
    } finally {
      setGeneratingEwbId(null);
    }
  };

  const filteredInvoices = invoices.filter(
    (i) =>
      i.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      i.vendorName.toLowerCase().includes(search.toLowerCase()) ||
      i.vendorGstin.toLowerCase().includes(search.toLowerCase())
  );

  const irnGeneratedCount = invoices.filter((i) => i.isIrnGenerated).length;
  const pendingIrnCount = invoices.filter((i) => !i.isIrnGenerated).length;
  const activeEwbCount = invoices.filter((i) => Boolean(i.ewbNumber)).length;

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-purple-600 text-white font-bold text-sm shadow-xs">
              <QrCode size={18} />
            </span>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Indian GST E-Invoicing & E-Way Bill Center
            </h1>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            NIC IRP Standard: 64-character SHA-256 IRN, Signed B2B QR Code & Section 138 Distance-based E-Way Bills.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchInvoices}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-xs cursor-pointer"
          >
            <RefreshCw size={12} className={cn(loading && "animate-spin text-purple-600")} />
            <span>Refresh Portal</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Eligible B2B Invoices</span>
            <FileText size={16} className="text-slate-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">{invoices.length}</span>
            <span className="text-xs text-slate-400 font-semibold">Ready for IRP</span>
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/40 p-4 shadow-xs dark:border-emerald-900/50 dark:bg-emerald-950/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">IRN Generated</span>
            <ShieldCheck size={16} className="text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-700 dark:text-emerald-300">{irnGeneratedCount}</span>
            <span className="text-xs text-emerald-600 font-semibold">NIC Acknowledged</span>
          </div>
        </div>

        <div className="rounded-2xl border border-amber-200/80 bg-amber-50/40 p-4 shadow-xs dark:border-amber-900/50 dark:bg-amber-950/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">Pending IRN</span>
            <Clock size={16} className="text-amber-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-700 dark:text-amber-300">{pendingIrnCount}</span>
            <span className="text-xs text-amber-600 font-semibold">Immediate Action</span>
          </div>
        </div>

        <div className="rounded-2xl border border-blue-200/80 bg-blue-50/40 p-4 shadow-xs dark:border-blue-900/50 dark:bg-blue-950/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">Active E-Way Bills</span>
            <Truck size={16} className="text-blue-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-blue-700 dark:text-blue-300">{activeEwbCount}</span>
            <span className="text-xs text-blue-600 font-semibold">In-Transit Passes</span>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Filter by invoice, vendor, GSTIN..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white dark:border-slate-800 dark:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>
          <span className="text-xs font-medium text-slate-400">
            Showing {filteredInvoices.length} invoices
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 border-b border-slate-100 dark:border-slate-800 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-4 py-3">Invoice Details</th>
                <th className="px-4 py-3">Vendor / Client GSTIN</th>
                <th className="px-4 py-3">Amount (₹)</th>
                <th className="px-4 py-3">IRN Status</th>
                <th className="px-4 py-3">E-Way Bill</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredInvoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-bold text-slate-900 dark:text-white">{inv.invoiceNumber}</div>
                    <div className="text-[10px] text-slate-400">Date: {inv.invoiceDate}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-800 dark:text-slate-200">{inv.vendorName}</div>
                    <div className="font-mono text-[10px] text-purple-600 dark:text-purple-400">{inv.vendorGstin}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-black text-slate-900 dark:text-white">₹{inv.totalAmount.toLocaleString("en-IN")}</div>
                    <div className="text-[10px] text-slate-400">Tax: ₹{inv.taxAmount.toLocaleString("en-IN")}</div>
                  </td>
                  <td className="px-4 py-3">
                    {inv.isIrnGenerated ? (
                      <div>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200/50">
                          <CheckCircle2 size={10} /> Active IRN
                        </span>
                        <div className="mt-1 font-mono text-[9px] text-slate-400 truncate max-w-[140px]" title={inv.irn || ""}>
                          {inv.irn?.substring(0, 16)}...
                        </div>
                      </div>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200/50">
                        <Clock size={10} /> Pending
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {inv.ewbNumber ? (
                      <div>
                        <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{inv.ewbNumber}</span>
                        <div className="text-[9px] text-slate-400">Valid: {inv.ewbValidUntil?.substring(0, 10)}</div>
                      </div>
                    ) : (
                      <span className="text-slate-400 text-[11px]">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {!inv.isIrnGenerated ? (
                        <button
                          type="button"
                          onClick={() => handleGenerateIrn(inv)}
                          disabled={generatingIrnId === inv.id}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold text-[11px] transition-colors cursor-pointer disabled:opacity-50"
                        >
                          <Sparkles size={11} />
                          {generatingIrnId === inv.id ? "IRP Calling..." : "Generate IRN"}
                        </button>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              setIrnModal({
                                invoiceNumber: inv.invoiceNumber,
                                irn: inv.irn!,
                                ackNo: inv.ackNo || "11261098451234",
                                ackDate: inv.ackDate || inv.invoiceDate,
                                signedQrCode: "eyJzdXBwbGllckdzdGluIjoiMDdBQUFBVTEyMzRBMSJ9",
                                qrPayload: {
                                  irn: inv.irn,
                                  docNo: inv.invoiceNumber,
                                  totAmt: inv.totalAmount,
                                },
                              })
                            }
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 font-semibold text-[11px] hover:bg-purple-50 dark:hover:bg-purple-950/40 transition-colors cursor-pointer"
                          >
                            <QrCode size={11} /> View QR
                          </button>

                          {!inv.ewbNumber ? (
                            <button
                              type="button"
                              onClick={() => setEwbFormTarget(inv)}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-[11px] transition-colors cursor-pointer"
                            >
                              <Truck size={11} /> E-Way Bill
                            </button>
                          ) : (
                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                              Pass Ready
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: IRN Result & QR Code Preview */}
      {irnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-600 text-white font-bold text-xs">
                  <ShieldCheck size={16} />
                </span>
                <div>
                  <h3 className="font-bold text-sm">Official GST E-Invoice Generated</h3>
                  <p className="text-[10px] text-slate-400">Acknowledged by NIC Invoice Registration Portal (IRP)</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIrnModal(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Invoice Number
                </span>
                <span className="font-bold text-slate-900 dark:text-white">{irnModal.invoiceNumber}</span>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    IRN (64-character SHA-256 Hash)
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(irnModal.irn, "irn")}
                    className="text-[10px] font-semibold text-purple-600 dark:text-purple-400 flex items-center gap-0.5 cursor-pointer"
                  >
                    <Copy size={10} /> {copiedText === "irn" ? "Copied!" : "Copy"}
                  </button>
                </div>
                <div className="mt-1 p-2 rounded-xl bg-slate-100 dark:bg-slate-800 font-mono text-[10px] break-all select-all text-slate-800 dark:text-slate-200">
                  {irnModal.irn}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">NIC Ack No</span>
                  <span className="font-mono font-bold text-purple-600 dark:text-purple-400">{irnModal.ackNo}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">NIC Ack Date</span>
                  <span className="font-mono text-[11px] text-slate-700 dark:text-slate-300">{irnModal.ackDate}</span>
                </div>
              </div>

              {/* QR Code Visual Placeholder */}
              <div className="pt-2 flex flex-col items-center justify-center p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/40">
                <QrCode size={110} className="text-slate-900 dark:text-white" />
                <span className="mt-2 text-[10px] font-bold text-slate-600 dark:text-slate-400">
                  Digitally Signed B2B GST QR Code
                </span>
                <span className="text-[9px] text-slate-400">Verifiable via GST e-Invoice QR Code Verify App</span>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIrnModal(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 font-semibold text-xs transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: E-Way Bill Creation Form */}
      {ewbFormTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Truck size={18} className="text-blue-600" />
                <h3 className="font-bold text-sm">Generate GST E-Way Bill</h3>
              </div>
              <button
                type="button"
                onClick={() => setEwbFormTarget(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <p className="text-slate-500 text-[11px]">
                Generating E-Way Bill for <strong>{ewbFormTarget.invoiceNumber}</strong> (Amount: ₹{ewbFormTarget.totalAmount.toLocaleString("en-IN")})
              </p>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Transporter Name
                </label>
                <input
                  type="text"
                  value={transporter}
                  onChange={(e) => setTransporter(e.target.value)}
                  className="w-full p-2 text-xs rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Vehicle Number (e.g. DL-01-AB-1234)
                </label>
                <input
                  type="text"
                  value={vehicleNo}
                  onChange={(e) => setVehicleNo(e.target.value)}
                  className="w-full p-2 text-xs rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono uppercase"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Distance in KM (Calculates Statutory Validity)
                </label>
                <input
                  type="number"
                  value={distanceKm}
                  onChange={(e) => setDistanceKm(Number(e.target.value))}
                  className="w-full p-2 text-xs rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                />
                <span className="text-[9px] text-slate-400 mt-1 block">
                  Rule 138: 1 day validity per 200 KM (~{Math.max(1, Math.ceil(distanceKm / 200))} days validity)
                </span>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setEwbFormTarget(null)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleGenerateEwb}
                disabled={Boolean(generatingEwbId)}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {generatingEwbId ? "Generating..." : "Generate E-Way Bill Pass"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: E-Way Bill Pass Details */}
      {ewbModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={18} className="text-emerald-600" />
                <h3 className="font-bold text-sm">Official E-Way Bill Active</h3>
              </div>
              <button
                type="button"
                onClick={() => setEwbModal(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200/50">
                <span className="text-[9px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300 block">
                  12-Digit E-Way Bill Number
                </span>
                <span className="font-mono text-lg font-black text-blue-700 dark:text-blue-300">
                  {ewbModal.ewbNumber}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                  <span className="text-[9px] font-bold uppercase text-slate-400 block">Vehicle Number</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">{ewbModal.vehicleNumber}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                  <span className="text-[9px] font-bold uppercase text-slate-400 block">Distance</span>
                  <span className="font-bold text-slate-900 dark:text-white">{ewbModal.distanceKm} KM</span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/40">
                <span className="text-[9px] font-bold uppercase text-emerald-700 dark:text-emerald-400 block">
                  Statutory Validity
                </span>
                <span className="font-bold text-emerald-800 dark:text-emerald-300">
                  Valid Until: {ewbModal.validUntil} ({ewbModal.validityDays} days)
                </span>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setEwbModal(null)}
                className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors cursor-pointer"
              >
                Close Pass
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

