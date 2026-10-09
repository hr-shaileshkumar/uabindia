"use client";

import { useRef } from "react";
import { Printer, Download, X, Building2, CheckCircle2, ShieldCheck } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

export type DocumentLineItem = {
  id?: string;
  description: string;
  hsnSac?: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  taxRatePercent?: number;
  taxAmount?: number;
  totalAmount: number;
};

export type PrintableDocumentData = {
  documentType: "TAX INVOICE" | "PURCHASE ORDER" | "COMMERCIAL QUOTATION" | "DELIVERY CHALLAN";
  documentNumber: string;
  documentDate: string;
  dueDate?: string;
  referenceNumber?: string;
  // Seller / Company
  companyName: string;
  companyAddress: string;
  companyGstin?: string;
  companyPan?: string;
  companyEmail?: string;
  companyPhone?: string;
  // Buyer / Customer / Vendor
  recipientName: string;
  recipientAddress: string;
  recipientGstin?: string;
  recipientPan?: string;
  recipientPhone?: string;
  // Items & Calculations
  lineItems: DocumentLineItem[];
  subtotal: number;
  cgstAmount?: number;
  sgstAmount?: number;
  igstAmount?: number;
  discountAmount?: number;
  grandTotal: number;
  currency?: string;
  amountInWords?: string;
  // Bank Details
  bankDetails?: {
    bankName: string;
    accountNumber: string;
    ifscCode: string;
    branch: string;
  };
  termsAndConditions?: string[];
  notes?: string;
};

type PrintableDocumentModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: PrintableDocumentData;
};

export function PrintableDocumentModal({
  open,
  onOpenChange,
  data,
}: PrintableDocumentModalProps) {
  const printContentRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const currency = data.currency || "INR";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto rounded-3xl border-slate-200 p-0 shadow-2xl dark:border-slate-800 dark:bg-slate-950 sm:max-w-4xl print:border-none print:shadow-none print:m-0 print:p-0 print:max-w-full">
        {/* Action Header Bar (Hidden during printing) */}
        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white/95 px-6 py-3.5 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95 print:hidden">
          <div className="flex items-center gap-2">
            <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700 dark:bg-blue-950/60 dark:text-blue-400">
              {data.documentType}
            </span>
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              {data.documentNumber}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={handlePrint}
              className="h-8 gap-1.5 bg-blue-600 px-3 text-xs font-semibold text-white shadow-xs hover:bg-blue-700"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print / Save PDF</span>
            </Button>
          </div>
        </div>

        {/* Printable Document Area */}
        <div ref={printContentRef} className="p-8 sm:p-10 bg-white text-slate-900 print:p-4 font-sans text-xs">
          {/* Header Card */}
          <div className="flex justify-between items-start border-b border-slate-300 pb-6">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-700 text-white font-black text-lg">
                  U
                </div>
                <div>
                  <h1 className="text-xl font-black tracking-tight text-slate-900 uppercase">
                    {data.companyName}
                  </h1>
                  <p className="text-[11px] text-slate-500 font-medium">{data.companyAddress}</p>
                </div>
              </div>
              <div className="mt-3 space-y-0.5 text-[11px] text-slate-600">
                {data.companyGstin && <p><strong>GSTIN:</strong> {data.companyGstin}</p>}
                {data.companyPan && <p><strong>PAN:</strong> {data.companyPan}</p>}
                {data.companyEmail && <p><strong>Email:</strong> {data.companyEmail}</p>}
              </div>
            </div>

            <div className="text-right">
              <span className="inline-block rounded-md bg-slate-900 px-3 py-1 text-sm font-extrabold uppercase tracking-wider text-white">
                {data.documentType}
              </span>
              <div className="mt-3 space-y-1 text-xs">
                <p><strong>Document No:</strong> <span className="font-mono font-bold text-blue-700">{data.documentNumber}</span></p>
                <p><strong>Date:</strong> {data.documentDate}</p>
                {data.dueDate && <p><strong>Due Date:</strong> {data.dueDate}</p>}
                {data.referenceNumber && <p><strong>Ref / PO:</strong> {data.referenceNumber}</p>}
              </div>
            </div>
          </div>

          {/* Recipient / Billed To Section */}
          <div className="mt-6 grid grid-cols-2 gap-6 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Billed / Issued To</p>
              <h2 className="mt-1 text-sm font-bold text-slate-900">{data.recipientName}</h2>
              <p className="mt-0.5 text-[11px] text-slate-600 leading-relaxed">{data.recipientAddress}</p>
              <div className="mt-2 space-y-0.5 text-[11px] text-slate-600">
                {data.recipientGstin && <p><strong>GSTIN:</strong> {data.recipientGstin}</p>}
                {data.recipientPan && <p><strong>PAN:</strong> {data.recipientPan}</p>}
                {data.recipientPhone && <p><strong>Phone:</strong> {data.recipientPhone}</p>}
              </div>
            </div>

            <div className="border-l border-slate-200 pl-6">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Payment & Bank Details</p>
              {data.bankDetails ? (
                <div className="mt-1 space-y-0.5 text-[11px] text-slate-700">
                  <p><strong>Bank:</strong> {data.bankDetails.bankName}</p>
                  <p><strong>A/C No:</strong> <span className="font-mono">{data.bankDetails.accountNumber}</span></p>
                  <p><strong>IFSC Code:</strong> <span className="font-mono">{data.bankDetails.ifscCode}</span></p>
                  <p><strong>Branch:</strong> {data.bankDetails.branch}</p>
                </div>
              ) : (
                <p className="mt-1 text-[11px] text-slate-500">Standard Net-30 payment terms apply via bank transfer or online portal.</p>
              )}
            </div>
          </div>

          {/* Line Items Table */}
          <div className="mt-6 overflow-hidden rounded-xl border border-slate-300">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 font-bold text-slate-700 border-b border-slate-300">
                  <th className="py-2.5 px-3 w-10">#</th>
                  <th className="py-2.5 px-3">Item Description</th>
                  <th className="py-2.5 px-3 w-20 text-center">HSN/SAC</th>
                  <th className="py-2.5 px-3 w-16 text-right">Qty</th>
                  <th className="py-2.5 px-3 w-24 text-right">Rate</th>
                  {data.cgstAmount != null && <th className="py-2.5 px-3 w-16 text-right">Tax%</th>}
                  <th className="py-2.5 px-3 w-28 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {data.lineItems.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-2 px-3 text-slate-400">{idx + 1}</td>
                    <td className="py-2 px-3 font-semibold text-slate-900">{item.description}</td>
                    <td className="py-2 px-3 text-center text-slate-500 font-mono">{item.hsnSac || "-"}</td>
                    <td className="py-2 px-3 text-right font-medium">{item.quantity} {item.unit}</td>
                    <td className="py-2 px-3 text-right font-mono">{formatCurrency(item.unitPrice, currency)}</td>
                    {data.cgstAmount != null && (
                      <td className="py-2 px-3 text-right text-slate-600">{item.taxRatePercent ?? 18}%</td>
                    )}
                    <td className="py-2 px-3 text-right font-bold text-slate-900 font-mono">
                      {formatCurrency(item.totalAmount, currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals & Summary */}
          <div className="mt-4 flex justify-between items-start">
            <div className="max-w-md text-[11px] text-slate-500">
              {data.amountInWords && (
                <div className="rounded-lg bg-slate-50 p-2.5 border border-slate-200">
                  <span className="font-bold text-slate-700 uppercase text-[10px]">Amount in Words:</span>
                  <p className="italic font-semibold text-slate-800">{data.amountInWords}</p>
                </div>
              )}
              {data.termsAndConditions && data.termsAndConditions.length > 0 && (
                <div className="mt-3">
                  <p className="font-bold text-slate-700 text-[10px] uppercase">Terms & Conditions:</p>
                  <ul className="list-disc pl-4 mt-0.5 space-y-0.5">
                    {data.termsAndConditions.map((term, i) => (
                      <li key={i}>{term}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="w-64 space-y-1.5 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Sub Total:</span>
                <span className="font-mono font-semibold">{formatCurrency(data.subtotal, currency)}</span>
              </div>
              {data.discountAmount ? (
                <div className="flex justify-between py-1 border-b border-slate-100 text-emerald-600">
                  <span>Discount:</span>
                  <span className="font-mono font-semibold">- {formatCurrency(data.discountAmount, currency)}</span>
                </div>
              ) : null}
              {data.cgstAmount ? (
                <div className="flex justify-between py-1 border-b border-slate-100 text-slate-600">
                  <span>CGST:</span>
                  <span className="font-mono font-semibold">{formatCurrency(data.cgstAmount, currency)}</span>
                </div>
              ) : null}
              {data.sgstAmount ? (
                <div className="flex justify-between py-1 border-b border-slate-100 text-slate-600">
                  <span>SGST:</span>
                  <span className="font-mono font-semibold">{formatCurrency(data.sgstAmount, currency)}</span>
                </div>
              ) : null}
              {data.igstAmount ? (
                <div className="flex justify-between py-1 border-b border-slate-100 text-slate-600">
                  <span>IGST:</span>
                  <span className="font-mono font-semibold">{formatCurrency(data.igstAmount, currency)}</span>
                </div>
              ) : null}
              <div className="flex justify-between py-2 border-t-2 border-slate-900 text-sm font-black text-slate-900">
                <span>Grand Total:</span>
                <span className="font-mono text-blue-700">{formatCurrency(data.grandTotal, currency)}</span>
              </div>
            </div>
          </div>

          {/* Footer Signature */}
          <div className="mt-12 pt-6 border-t border-slate-200 flex justify-between items-end">
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>Computer Generated Document. Verified via UabIndia Platform.</span>
            </div>
            <div className="text-center w-48">
              <div className="h-12 border-b border-slate-400 flex items-end justify-center pb-1">
                <span className="text-[10px] italic text-slate-400">Authorized Signature</span>
              </div>
              <p className="mt-1 text-[10px] font-bold uppercase text-slate-700">{data.companyName}</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
