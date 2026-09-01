"use client";

import { Printer, X } from "lucide-react";
import { erpButtonClassName } from "@/components/workspace/styles";
import { formatCurrency } from "@/lib/formatters";

export type PrintLineItem = {
  id?: string;
  description: string;
  hsnCode?: string;
  quantity: number;
  unit?: string;
  rate: number;
  taxRate?: number;
  amount: number;
};

export type PrintDocumentProps = {
  documentType: "Tax Invoice" | "Purchase Order" | "Quotation" | "Payslip" | "Receipt";
  documentNumber: string;
  date: string;
  dueDate?: string;
  currency?: string;
  companyName?: string;
  companyGstin?: string;
  companyAddress?: string;
  companyEmail?: string;
  companyPhone?: string;
  partyName: string;
  partyGstin?: string;
  partyAddress?: string;
  partyEmail?: string;
  items: PrintLineItem[];
  subTotal: number;
  taxAmount: number;
  grandTotal: number;
  bankDetails?: {
    accountName?: string;
    accountNumber?: string;
    ifscCode?: string;
    bankName?: string;
  };
  notes?: string;
  terms?: string;
  onClose?: () => void;
};

export function ErpPrintDocument(props: PrintDocumentProps) {
  const {
    documentType,
    documentNumber,
    date,
    dueDate,
    currency = "USD",
    companyName = "UABINDIA ENTERPRISES PVT LTD",
    companyGstin = "27AAACU1234A1Z5",
    companyAddress = "Corporate Towers, Bandra Kurla Complex, Mumbai, Maharashtra 400051",
    companyEmail = "finance@uabindia.com",
    companyPhone = "+91 22 6123 4567",
    partyName,
    partyGstin,
    partyAddress,
    partyEmail,
    items,
    subTotal,
    taxAmount,
    grandTotal,
    bankDetails,
    notes,
    terms = "1. Payment terms: Net 30 days. 2. Subject to local corporate jurisdiction.",
    onClose,
  } = props;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col bg-white text-slate-900">
      {/* Top Action Bar (hidden in print) */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-3 print:hidden">
        <span className="text-xs font-semibold text-slate-600">
          Print Preview &middot; {documentType} #{documentNumber}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className={`${erpButtonClassName.primary} gap-1.5`}
          >
            <Printer className="h-4 w-4" />
            Print / Save PDF
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className={erpButtonClassName.secondary}
            >
              <X className="h-4 w-4" />
              Close
            </button>
          )}
        </div>
      </div>

      {/* Printable Invoice Page */}
      <div className="p-8 sm:p-12 max-w-4xl mx-auto w-full space-y-6 text-xs sm:text-sm">
        {/* Header */}
        <div className="flex justify-between items-start border-b border-slate-200 pb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">{companyName}</h1>
            <p className="mt-1 text-xs text-slate-500 max-w-sm">{companyAddress}</p>
            <p className="mt-1 text-xs text-slate-600 font-mono">GSTIN: {companyGstin}</p>
            <p className="text-xs text-slate-500">{companyEmail} &middot; {companyPhone}</p>
          </div>
          <div className="text-right">
            <span className="inline-block rounded bg-slate-900 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white">
              {documentType}
            </span>
            <p className="mt-2 text-sm font-bold text-slate-900 font-mono">#{documentNumber}</p>
            <p className="text-xs text-slate-500">Date: <span className="font-semibold text-slate-700">{date}</span></p>
            {dueDate && <p className="text-xs text-slate-500">Due Date: <span className="font-semibold text-slate-700">{dueDate}</span></p>}
          </div>
        </div>

        {/* Bill To */}
        <div className="grid grid-cols-2 gap-6 bg-slate-50 p-4 rounded-lg border border-slate-100">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Billed To</p>
            <p className="mt-1 font-bold text-slate-900">{partyName}</p>
            {partyAddress && <p className="text-xs text-slate-600 mt-0.5">{partyAddress}</p>}
            {partyEmail && <p className="text-xs text-slate-500 mt-0.5">{partyEmail}</p>}
            {partyGstin && <p className="text-xs font-mono text-slate-700 mt-1">GSTIN: {partyGstin}</p>}
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Place of Supply</p>
            <p className="mt-1 font-semibold text-slate-800">Standard Jurisdiction</p>
            <p className="text-xs text-slate-500 mt-1">Currency: {currency}</p>
          </div>
        </div>

        {/* Item Table */}
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b-2 border-slate-900 text-[11px] font-bold uppercase tracking-wider text-slate-700">
              <th className="py-2 text-left">#</th>
              <th className="py-2 text-left">Description</th>
              <th className="py-2 text-center">HSN/SAC</th>
              <th className="py-2 text-right">Qty</th>
              <th className="py-2 text-right">Rate</th>
              <th className="py-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((item, index) => (
              <tr key={index} className="text-xs">
                <td className="py-2.5 text-slate-400">{index + 1}</td>
                <td className="py-2.5 font-medium text-slate-900">{item.description}</td>
                <td className="py-2.5 text-center font-mono text-slate-500">{item.hsnCode || "—"}</td>
                <td className="py-2.5 text-right tabular-nums">{item.quantity} {item.unit || "NOS"}</td>
                <td className="py-2.5 text-right tabular-nums">{formatCurrency(item.rate, currency)}</td>
                <td className="py-2.5 text-right font-semibold tabular-nums">{formatCurrency(item.amount, currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals Breakdown */}
        <div className="flex justify-end pt-4 border-t border-slate-200">
          <div className="w-64 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span className="font-semibold tabular-nums">{formatCurrency(subTotal, currency)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Tax / Statutory:</span>
              <span className="font-semibold tabular-nums">{formatCurrency(taxAmount, currency)}</span>
            </div>
            <div className="flex justify-between border-t-2 border-slate-900 pt-2 text-sm font-bold text-slate-900">
              <span>Grand Total:</span>
              <span className="tabular-nums">{formatCurrency(grandTotal, currency)}</span>
            </div>
          </div>
        </div>

        {/* Bank Details & Signature Block */}
        <div className="grid grid-cols-2 gap-8 border-t border-slate-200 pt-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Bank Transfer Details</p>
            <p className="text-xs text-slate-700 mt-1">Bank: {bankDetails?.bankName || "HDFC Bank Ltd"}</p>
            <p className="text-xs text-slate-700">A/C: <span className="font-mono">{bankDetails?.accountNumber || "50200012345678"}</span></p>
            <p className="text-xs text-slate-700">IFSC: <span className="font-mono">{bankDetails?.ifscCode || "HDFC0000123"}</span></p>
            {notes && <p className="text-xs text-slate-500 mt-2 italic">{notes}</p>}
          </div>
          <div className="flex flex-col justify-end items-end text-center">
            <div className="h-14 w-40 border-b border-slate-400 mb-1" />
            <p className="text-xs font-semibold text-slate-800">Authorized Signatory</p>
            <p className="text-[10px] text-slate-400">{companyName}</p>
          </div>
        </div>

        {/* Terms */}
        <div className="border-t border-slate-100 pt-4 text-[10px] text-slate-400 leading-relaxed">
          <p className="font-semibold text-slate-500 mb-0.5">Terms & Conditions:</p>
          <p>{terms}</p>
        </div>
      </div>
    </div>
  );
}
