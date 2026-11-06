"use client";

import React, { useState, useMemo } from "react";
import {
  FileText,
  Plus,
  Trash2,
  Printer,
  Save,
  CheckCircle2,
  Clock,
  Building2,
  User,
  Calendar,
  CreditCard,
  Percent,
  Layers,
  ChevronDown,
  ArrowLeft,
  Share2,
  ShieldCheck,
  Sparkles,
  Download,
  AlertCircle,
  Copy,
} from "lucide-react";
import { notifySuccess, notifyError } from "@/lib/notifications";

export interface VoucherLineItem {
  id: string;
  itemCode: string;
  itemName: string;
  hsnCode: string;
  quantity: number;
  uom: string;
  rate: number;
  discountPct: number;
  gstRate: number; // e.g. 18 for 18%
}

export interface DocumentVoucherProps {
  documentType: "PURCHASE_ORDER" | "SALES_ORDER" | "TAX_INVOICE" | "GOODS_RECEIPT";
  title?: string;
  defaultPrefix?: string;
}

export function EnterpriseDocumentVoucher({
  documentType,
  title = documentType === "PURCHASE_ORDER"
    ? "Purchase Order Studio"
    : documentType === "SALES_ORDER"
    ? "Sales Order & Invoicing Studio"
    : "Document Voucher Studio",
  defaultPrefix = documentType === "PURCHASE_ORDER"
    ? "PO"
    : documentType === "SALES_ORDER"
    ? "SO"
    : "DOC",
}: DocumentVoucherProps) {
  const isPurchase = documentType === "PURCHASE_ORDER" || documentType === "GOODS_RECEIPT";

  // Mode: Editor vs Official Letterhead Print Preview
  const [viewMode, setViewMode] = useState<"EDITOR" | "PRINT">("EDITOR");

  // Document Header
  const [docNumber, setDocNumber] = useState(`${defaultPrefix}-2026-${Math.floor(1000 + Math.random() * 9000)}`);
  const [docDate, setDocDate] = useState(new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState(new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0]);
  const [status, setStatus] = useState<"Draft" | "Approved" | "Dispatched" | "Closed">("Draft");
  const [partyName, setPartyName] = useState(isPurchase ? "Bharat Heavy Electricals & Precision Components Ltd" : "Apex Global Infotech Private Limited");
  const [partyGstin, setPartyGstin] = useState(isPurchase ? "27AAACB1234F1Z5" : "10AACCA9988D1Z2");
  const [partyAddress, setPartyAddress] = useState("Plot No. 42, Industrial Growth Center, Phase-II, Navi Mumbai, MH - 400705");
  const [paymentTerms, setPaymentTerms] = useState("Net 30 Days");
  const [notes, setNotes] = useState("Goods must strictly adhere to ISO 9001 quality specifications. Delivery with warranty certificate.");
  const [isInterState, setIsInterState] = useState(false); // Intra-state (CGST+SGST) vs Inter-state (IGST)

  // Line Items
  const [items, setItems] = useState<VoucherLineItem[]>([
    {
      id: "line-1",
      itemCode: "ITM-IND-01",
      itemName: "Heavy-Duty Industrial Servo Motor 15KW",
      hsnCode: "8501",
      quantity: 5,
      uom: "Nos",
      rate: 34500,
      discountPct: 5,
      gstRate: 18,
    },
    {
      id: "line-2",
      itemCode: "ITM-CAB-04",
      itemName: "Shielded Copper Control Cable 4-Core (100m Roll)",
      hsnCode: "8544",
      quantity: 12,
      uom: "Roll",
      rate: 4200,
      discountPct: 0,
      gstRate: 18,
    },
    {
      id: "line-3",
      itemCode: "ITM-VAL-09",
      itemName: "High-Pressure Hydraulic Solenoid Valve",
      hsnCode: "8481",
      quantity: 8,
      uom: "Nos",
      rate: 7800,
      discountPct: 2,
      gstRate: 12,
    },
  ]);

  // Add Line
  const addLineItem = () => {
    const newItem: VoucherLineItem = {
      id: `line-${Date.now()}`,
      itemCode: `ITM-NEW-${items.length + 1}`,
      itemName: "Enter item description or product name",
      hsnCode: "8471",
      quantity: 1,
      uom: "Nos",
      rate: 1000,
      discountPct: 0,
      gstRate: 18,
    };
    setItems([...items, newItem]);
  };

  // Remove Line
  const removeLineItem = (id: string) => {
    if (items.length <= 1) {
      notifyError("At least one line item is required in a voucher.");
      return;
    }
    setItems(items.filter((item) => item.id !== id));
  };

  // Update Line
  const updateLine = (id: string, field: keyof VoucherLineItem, value: any) => {
    setItems(
      items.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  // Calculations
  const calculatedLines = useMemo(() => {
    return items.map((line) => {
      const gross = line.quantity * line.rate;
      const discount = gross * (line.discountPct / 100);
      const taxable = gross - discount;
      const taxAmount = taxable * (line.gstRate / 100);
      const total = taxable + taxAmount;
      return {
        ...line,
        gross,
        discount,
        taxable,
        taxAmount,
        total,
      };
    });
  }, [items]);

  const subtotal = useMemo(() => calculatedLines.reduce((acc, l) => acc + l.taxable, 0), [calculatedLines]);
  const totalTax = useMemo(() => calculatedLines.reduce((acc, l) => acc + l.taxAmount, 0), [calculatedLines]);
  const totalDiscount = useMemo(() => calculatedLines.reduce((acc, l) => acc + l.discount, 0), [calculatedLines]);
  const grandTotal = useMemo(() => Math.round(subtotal + totalTax), [subtotal, totalTax]);
  const roundOff = useMemo(() => +(grandTotal - (subtotal + totalTax)).toFixed(2), [grandTotal, subtotal, totalTax]);

  // Number to Words Converter (Indian Currency format)
  const amountInWords = useMemo(() => {
    const a = [
      "", "One ", "Two ", "Three ", "Four ", "Five ", "Six ", "Seven ", "Eight ", "Nine ",
      "Ten ", "Eleven ", "Twelve ", "Thirteen ", "Fourteen ", "Fifteen ", "Sixteen ", "Seventeen ", "Eighteen ", "Nineteen ",
    ];
    const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

    const inWords = (num: number): string => {
      if ((num = num.toString().length > 9 ? parseFloat(num.toString().slice(0, 9)) : num) == 0) return "";
      const n = ("000000000" + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
      if (!n) return "";
      let str = "";
      str += Number(n[1]) != 0 ? (a[Number(n[1])] || b[n[1][0] as any] + " " + a[n[1][1] as any]) + "Crore " : "";
      str += Number(n[2]) != 0 ? (a[Number(n[2])] || b[n[2][0] as any] + " " + a[n[2][1] as any]) + "Lakh " : "";
      str += Number(n[3]) != 0 ? (a[Number(n[3])] || b[n[3][0] as any] + " " + a[n[3][1] as any]) + "Thousand " : "";
      str += Number(n[4]) != 0 ? (a[Number(n[4])] || b[n[4][0] as any] + " " + a[n[4][1] as any]) + "Hundred " : "";
      str += Number(n[5]) != 0 ? (str != "" ? "and " : "") + (a[Number(n[5])] || b[n[5][0] as any] + " " + a[n[5][1] as any]) + "Only" : "Only";
      return "Rupees " + str;
    };
    return inWords(grandTotal);
  }, [grandTotal]);

  const handleSave = () => {
    notifySuccess(`${isPurchase ? "Purchase Order" : "Sales Order"} ${docNumber} saved.`);
  };

  const handleApprove = () => {
    setStatus("Approved");
    notifySuccess(`${docNumber} approved & finalized in accounting ledger.`);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Toolbar */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-800 border border-blue-200">
                <FileText size={12} />
                {isPurchase ? "Procurement & Trade" : "Commercial Sales"}
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-300">
                {docNumber}
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold border ${
                  status === "Approved"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-amber-50 text-amber-700 border-amber-200"
                }`}
              >
                {status}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
              {title}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Enterprise GST line-item matrix with automated SAC tax computation, party validation, and official print layout.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setViewMode(viewMode === "EDITOR" ? "PRINT" : "EDITOR")}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              {viewMode === "EDITOR" ? (
                <>
                  <Printer size={14} className="text-blue-600" />
                  Print / Letterhead View
                </>
              ) : (
                <>
                  <ArrowLeft size={14} />
                  Back to Line Editor
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <Save size={14} />
              Save Draft
            </button>
            <button
              type="button"
              onClick={handleApprove}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition cursor-pointer"
            >
              <CheckCircle2 size={14} />
              Approve &amp; Dispatch
            </button>
          </div>
        </div>
      </div>

      {/* 2. LIVE OFFICIAL LETTERHEAD VIEW (When in Print Mode) */}
      {viewMode === "PRINT" ? (
        <div className="mx-auto max-w-4xl rounded-2xl border border-slate-200 bg-white p-8 shadow-xl text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 print:border-none print:shadow-none">
          {/* Header */}
          <div className="flex items-start justify-between border-b border-slate-200 pb-6">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 font-black text-white text-lg">
                  U
                </div>
                <div>
                  <h2 className="text-xl font-black tracking-tight">UabIndia Technologies Corp</h2>
                  <p className="text-xs text-slate-500">Corporate Headquarters • Mumbai, Maharashtra</p>
                </div>
              </div>
              <div className="mt-3 text-xs text-slate-600 space-y-0.5">
                <p>GSTIN: <span className="font-mono font-bold">27AABCB9999F1Z1</span></p>
                <p>Email: trade@uabindia.in • Tel: +91 22 6123 4567</p>
              </div>
            </div>

            <div className="text-right space-y-1">
              <span className="rounded-lg bg-blue-50 px-3 py-1 font-mono text-sm font-black text-blue-800 uppercase tracking-wider border border-blue-200">
                {isPurchase ? "PURCHASE ORDER" : "TAX INVOICE"}
              </span>
              <div className="text-xs space-y-0.5 pt-2">
                <p>Document #: <span className="font-mono font-bold">{docNumber}</span></p>
                <p>Date: <span className="font-medium">{docDate}</span></p>
                <p>Due Date: <span className="font-medium">{dueDate}</span></p>
              </div>
            </div>
          </div>

          {/* Parties */}
          <div className="grid grid-cols-2 gap-6 py-6 border-b border-slate-200 text-xs">
            <div>
              <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">
                {isPurchase ? "Vendor / Supplier Details:" : "Customer / Consignee Details:"}
              </span>
              <p className="font-bold text-sm text-slate-900 mt-1 dark:text-white">{partyName}</p>
              <p className="text-slate-600 mt-0.5">{partyAddress}</p>
              <p className="mt-1 font-mono">GSTIN: <span className="font-bold">{partyGstin}</span></p>
            </div>
            <div className="text-right">
              <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">
                Commercial Terms:
              </span>
              <p className="font-semibold text-slate-800 mt-1">Payment: {paymentTerms}</p>
              <p className="text-slate-600">Tax Type: {isInterState ? "Inter-State (IGST)" : "Intra-State (CGST + SGST)"}</p>
              <p className="text-slate-600">Currency: INR (₹) Indian Rupee</p>
            </div>
          </div>

          {/* Print Table */}
          <table className="w-full text-left text-xs my-6">
            <thead className="bg-slate-50 border-y border-slate-200 text-[11px] font-bold text-slate-600 uppercase">
              <tr>
                <th className="py-2.5 px-3">#</th>
                <th className="py-2.5 px-3">Item Description</th>
                <th className="py-2.5 px-3">HSN</th>
                <th className="py-2.5 px-3 text-right">Qty</th>
                <th className="py-2.5 px-3 text-right">Rate</th>
                <th className="py-2.5 px-3 text-right">Taxable</th>
                <th className="py-2.5 px-3 text-right">GST</th>
                <th className="py-2.5 px-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {calculatedLines.map((line, idx) => (
                <tr key={line.id}>
                  <td className="py-2.5 px-3 font-mono text-slate-400">{idx + 1}</td>
                  <td className="py-2.5 px-3 font-bold">{line.itemName}</td>
                  <td className="py-2.5 px-3 font-mono text-slate-500">{line.hsnCode}</td>
                  <td className="py-2.5 px-3 text-right font-mono">{line.quantity} {line.uom}</td>
                  <td className="py-2.5 px-3 text-right font-mono">₹{line.rate.toLocaleString("en-IN")}</td>
                  <td className="py-2.5 px-3 text-right font-mono font-semibold">₹{line.taxable.toLocaleString("en-IN")}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-500">{line.gstRate}%</td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold">₹{Math.round(line.total).toLocaleString("en-IN")}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Total Box */}
          <div className="flex justify-between items-start border-t border-slate-200 pt-4 text-xs">
            <div className="max-w-md">
              <span className="font-bold text-slate-500 uppercase text-[10px]">Amount in Words:</span>
              <p className="font-bold text-slate-800 text-xs mt-0.5 italic">{amountInWords}</p>
              <div className="mt-4 text-[11px] text-slate-500">
                <span className="font-bold">Instructions &amp; Notes:</span>
                <p>{notes}</p>
              </div>
            </div>

            <div className="w-64 space-y-1.5 font-medium">
              <div className="flex justify-between text-slate-600">
                <span>Taxable Amount:</span>
                <span className="font-mono">₹{subtotal.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Total GST Output:</span>
                <span className="font-mono">₹{totalTax.toLocaleString("en-IN")}</span>
              </div>
              {roundOff !== 0 && (
                <div className="flex justify-between text-slate-500 text-[11px]">
                  <span>Round-off:</span>
                  <span className="font-mono">{roundOff > 0 ? `+₹${roundOff}` : `-₹${Math.abs(roundOff)}`}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-slate-300 pt-2 text-sm font-black text-slate-900 dark:text-white">
                <span>Grand Total:</span>
                <span className="font-mono text-blue-600">₹{grandTotal.toLocaleString("en-IN")}</span>
              </div>
            </div>
          </div>

          <div className="mt-12 flex justify-between items-end border-t border-slate-200 pt-6 text-xs text-slate-500">
            <div>
              <p>Prepared by: System ERP Operator</p>
              <p className="text-[10px] text-slate-400">Electronically generated document. Requires no physical signature.</p>
            </div>
            <div className="text-right">
              <div className="h-10 border-b border-dashed border-slate-300 w-44 ml-auto mb-1" />
              <p className="font-bold text-slate-700">Authorized Signatory</p>
            </div>
          </div>
        </div>
      ) : (
        /* 3. INTERACTIVE LINE-ITEM SPREADSHEET EDITOR */
        <div className="space-y-6">
          {/* Header Card */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 text-xs">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-4 flex items-center gap-2">
              <Building2 size={16} className="text-blue-600" />
              Document Header &amp; Commercial Terms
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Document Number
                </label>
                <input
                  type="text"
                  value={docNumber}
                  onChange={(e) => setDocNumber(e.target.value)}
                  className="w-full font-mono uppercase font-bold rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isPurchase ? "Vendor / Supplier Name" : "Customer / Client Name"}
                </label>
                <input
                  type="text"
                  value={partyName}
                  onChange={(e) => setPartyName(e.target.value)}
                  className="w-full font-semibold rounded-xl border border-slate-200 px-3 py-2 text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Party GSTIN / Tax ID
                </label>
                <input
                  type="text"
                  value={partyGstin}
                  onChange={(e) => setPartyGstin(e.target.value.toUpperCase())}
                  className="w-full font-mono uppercase rounded-xl border border-slate-200 px-3 py-2 text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Payment Terms
                </label>
                <select
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  className="w-full font-semibold rounded-xl border border-slate-200 px-3 py-2"
                >
                  <option value="Net 30 Days">Net 30 Days</option>
                  <option value="Net 15 Days">Net 15 Days</option>
                  <option value="100% Advance">100% Advance</option>
                  <option value="Due upon Receipt">Due upon Receipt</option>
                  <option value="Cash on Delivery (COD)">Cash on Delivery (COD)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Document Date
                </label>
                <input
                  type="date"
                  value={docDate}
                  onChange={(e) => setDocDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Due / Delivery Date
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 font-mono"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Tax Supply Location
                </label>
                <div className="flex items-center gap-4 mt-2">
                  <label className="flex items-center gap-2 cursor-pointer font-semibold">
                    <input
                      type="radio"
                      checked={!isInterState}
                      onChange={() => setIsInterState(false)}
                      className="text-blue-600"
                    />
                    <span>Intra-State Supply (CGST + SGST)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer font-semibold">
                    <input
                      type="radio"
                      checked={isInterState}
                      onChange={() => setIsInterState(true)}
                      className="text-blue-600"
                    />
                    <span>Inter-State Supply (IGST)</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                  Itemized Line Details &amp; SAC Rates
                </h3>
                <p className="text-xs text-slate-400">Tab through fields to edit rates, discounts, and GST percentages.</p>
              </div>
              <button
                type="button"
                onClick={addLineItem}
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-100 transition border border-blue-200 cursor-pointer"
              >
                <Plus size={14} /> Add Line Item
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-extrabold text-slate-500 uppercase">
                  <tr>
                    <th className="py-2.5 px-2 w-10">#</th>
                    <th className="py-2.5 px-3 min-w-[220px]">Item Description</th>
                    <th className="py-2.5 px-2 w-24">HSN/SAC</th>
                    <th className="py-2.5 px-2 w-20 text-right">Qty</th>
                    <th className="py-2.5 px-2 w-20">UOM</th>
                    <th className="py-2.5 px-2 w-28 text-right">Rate (₹)</th>
                    <th className="py-2.5 px-2 w-20 text-right">Disc %</th>
                    <th className="py-2.5 px-2 w-24">GST %</th>
                    <th className="py-2.5 px-3 text-right w-28">Amount (₹)</th>
                    <th className="py-2.5 px-2 w-10 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {calculatedLines.map((line, idx) => (
                    <tr key={line.id} className="hover:bg-slate-50/70">
                      <td className="py-2 px-2 text-slate-400 font-mono">{idx + 1}</td>
                      <td className="py-2 px-2">
                        <input
                          type="text"
                          value={line.itemName}
                          onChange={(e) => updateLine(line.id, "itemName", e.target.value)}
                          className="w-full rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-800"
                        />
                      </td>
                      <td className="py-2 px-2">
                        <input
                          type="text"
                          value={line.hsnCode}
                          onChange={(e) => updateLine(line.id, "hsnCode", e.target.value)}
                          className="w-full font-mono rounded-lg border border-slate-200 px-2 py-1 text-xs"
                        />
                      </td>
                      <td className="py-2 px-2">
                        <input
                          type="number"
                          min="1"
                          value={line.quantity}
                          onChange={(e) => updateLine(line.id, "quantity", Number(e.target.value) || 1)}
                          className="w-full text-right font-mono rounded-lg border border-slate-200 px-2 py-1 text-xs"
                        />
                      </td>
                      <td className="py-2 px-2">
                        <select
                          value={line.uom}
                          onChange={(e) => updateLine(line.id, "uom", e.target.value)}
                          className="w-full rounded-lg border border-slate-200 px-1 py-1 text-xs font-semibold"
                        >
                          <option value="Nos">Nos</option>
                          <option value="Kg">Kg</option>
                          <option value="Mtr">Mtr</option>
                          <option value="Roll">Roll</option>
                          <option value="Box">Box</option>
                          <option value="Hrs">Hrs</option>
                        </select>
                      </td>
                      <td className="py-2 px-2">
                        <input
                          type="number"
                          value={line.rate}
                          onChange={(e) => updateLine(line.id, "rate", Number(e.target.value) || 0)}
                          className="w-full text-right font-mono font-bold rounded-lg border border-slate-200 px-2 py-1 text-xs"
                        />
                      </td>
                      <td className="py-2 px-2">
                        <input
                          type="number"
                          value={line.discountPct}
                          onChange={(e) => updateLine(line.id, "discountPct", Number(e.target.value) || 0)}
                          className="w-full text-right font-mono rounded-lg border border-slate-200 px-2 py-1 text-xs"
                        />
                      </td>
                      <td className="py-2 px-2">
                        <select
                          value={line.gstRate}
                          onChange={(e) => updateLine(line.id, "gstRate", Number(e.target.value))}
                          className="w-full rounded-lg border border-slate-200 px-1 py-1 text-xs font-bold"
                        >
                          <option value={0}>0% (Exempt)</option>
                          <option value={5}>5% GST</option>
                          <option value={12}>12% GST</option>
                          <option value={18}>18% Standard</option>
                          <option value={28}>28% Luxury</option>
                        </select>
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                        ₹{Math.round(line.total).toLocaleString("en-IN")}
                      </td>
                      <td className="py-2 px-2 text-center">
                        <button
                          type="button"
                          onClick={() => removeLineItem(line.id)}
                          className="rounded p-1 text-slate-400 hover:text-rose-600 transition"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Total Summary Footer */}
            <div className="mt-6 flex flex-col lg:flex-row items-start justify-between gap-6 border-t border-slate-100 pt-5 text-xs">
              <div className="max-w-lg w-full space-y-2">
                <label className="block font-bold text-slate-700">Terms &amp; Operational Instructions:</label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs"
                />
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 text-slate-600 text-[11px]">
                  <span className="font-bold">Words:</span> {amountInWords}
                </div>
              </div>

              <div className="w-full lg:w-80 space-y-2 rounded-xl bg-slate-50 p-4 border border-slate-200/80">
                <div className="flex justify-between text-slate-600 font-medium">
                  <span>Gross Taxable Subtotal:</span>
                  <span className="font-mono">₹{subtotal.toLocaleString("en-IN")}</span>
                </div>
                {totalDiscount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-medium">
                    <span>Total Discount:</span>
                    <span className="font-mono">-₹{totalDiscount.toLocaleString("en-IN")}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-600 font-medium">
                  <span>GST Taxes ({isInterState ? "IGST" : "CGST + SGST"}):</span>
                  <span className="font-mono">₹{totalTax.toLocaleString("en-IN")}</span>
                </div>
                <div className="border-t border-slate-200 pt-2 flex justify-between text-base font-black text-slate-900 dark:text-white">
                  <span>Net Payable Total:</span>
                  <span className="font-mono text-blue-600">₹{grandTotal.toLocaleString("en-IN")}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EnterpriseDocumentVoucher;

