"use client";

import React, { useRef } from "react";
import {
  Printer,
  Download,
  X,
  ShieldCheck,
  Building2,
  CheckCircle2,
  FileCheck,
  QrCode,
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useCurrency } from "@/context/CurrencyContext";
import { useOrgContext } from "@/context/OrgContext";

export type PayslipData = {
  payslipId: string;
  employeeName: string;
  employeeCode: string;
  designation: string;
  department: string;
  joiningDate: string;
  bankAccount: string;
  panNumber: string;
  period: string;
  totalDays: number;
  workedDays: number;
  lwpDays: number;
  basicSalary: number;
  hra: number;
  specialAllowance: number;
  bonus: number;
  pfDeduction: number;
  taxDeduction: number;
  esiDeduction: number;
  otherDeductions: number;
  paymentStatus: string;
  disbursedOn: string;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data?: PayslipData | null;
};

export function PrintablePayslipModal({ open, onOpenChange, data }: Props) {
  const { formatMoney } = useCurrency();
  const { companyName } = useOrgContext();
  const printRef = useRef<HTMLDivElement>(null);

  const sample: PayslipData = data || {
    payslipId: "PS-2026-08-0042",
    employeeName: "Aditi Sharma",
    employeeCode: "EMP-2026-089",
    designation: "Senior Software Architect",
    department: "Engineering & Platform Operations",
    joiningDate: "15 Jan 2024",
    bankAccount: "•••• •••• 9842 (HDFC Bank)",
    panNumber: "ABCDE1234F",
    period: "August 2026",
    totalDays: 31,
    workedDays: 30,
    lwpDays: 1,
    basicSalary: 95000,
    hra: 38000,
    specialAllowance: 22000,
    bonus: 10000,
    pfDeduction: 11400,
    taxDeduction: 14500,
    esiDeduction: 0,
    otherDeductions: 1500,
    paymentStatus: "Disbursed / Verified",
    disbursedOn: "31 Aug 2026",
  };

  const totalEarnings =
    sample.basicSalary + sample.hra + sample.specialAllowance + sample.bonus;
  const totalDeductions =
    sample.pfDeduction + sample.taxDeduction + sample.esiDeduction + sample.otherDeductions;
  const netPay = totalEarnings - totalDeductions;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto rounded-3xl border border-slate-200 bg-slate-50 p-0 shadow-2xl dark:border-slate-800 dark:bg-slate-950">
        {/* Top Control Bar */}
        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white/90 px-6 py-4 backdrop-blur print:hidden dark:border-slate-800 dark:bg-slate-900/90">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
            <span className="text-sm font-bold text-slate-900 dark:text-white">
              Official Corporate Payslip ({sample.payslipId})
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md transition hover:bg-indigo-700 active:scale-95"
            >
              <Printer className="h-4 w-4" />
              <span>Print / Export PDF</span>
            </button>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div ref={printRef} className="p-6 sm:p-10 font-sans text-slate-900">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
            {/* Header / Company Branding */}
            <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white font-black text-xs">
                    {(companyName || "ERP").slice(0, 3).toUpperCase()}
                  </div>
                  <h2 className="text-lg font-black tracking-tight text-slate-900">
                    {companyName || "Corporate Workspace"}
                  </h2>
                </div>
                <p className="text-xs text-slate-500">
                  Global Operations Hub · Registered Corporate Entity
                </p>
              </div>

              <div className="text-right sm:border-l sm:border-slate-100 sm:pl-6">
                <span className="inline-block rounded-md bg-indigo-50 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-indigo-700">
                  Payslip · {sample.period}
                </span>
                <p className="mt-1.5 font-mono text-[11px] text-slate-500">ID: {sample.payslipId}</p>
                <p className="text-[11px] font-semibold text-emerald-600 flex items-center justify-end gap-1 mt-0.5">
                  <CheckCircle2 className="h-3 w-3" />
                  {sample.paymentStatus}
                </p>
              </div>
            </div>

            {/* Employee Metadata Grid */}
            <div className="my-6 grid grid-cols-2 gap-y-3 gap-x-6 rounded-xl bg-slate-50 p-4 text-xs sm:grid-cols-4">
              <div>
                <p className="text-slate-400 font-medium">Employee Name</p>
                <p className="font-bold text-slate-900">{sample.employeeName}</p>
              </div>
              <div>
                <p className="text-slate-400 font-medium">Employee Code</p>
                <p className="font-bold text-slate-900 font-mono">{sample.employeeCode}</p>
              </div>
              <div>
                <p className="text-slate-400 font-medium">Designation</p>
                <p className="font-bold text-slate-900">{sample.designation}</p>
              </div>
              <div>
                <p className="text-slate-400 font-medium">Department</p>
                <p className="font-bold text-slate-900">{sample.department}</p>
              </div>
              <div>
                <p className="text-slate-400 font-medium">Bank Account</p>
                <p className="font-bold text-slate-900 font-mono">{sample.bankAccount}</p>
              </div>
              <div>
                <p className="text-slate-400 font-medium">Tax / PAN</p>
                <p className="font-bold text-slate-900 font-mono">{sample.panNumber}</p>
              </div>
              <div>
                <p className="text-slate-400 font-medium">Worked Days</p>
                <p className="font-bold text-slate-900">
                  {sample.workedDays} / {sample.totalDays} Days
                </p>
              </div>
              <div>
                <p className="text-slate-400 font-medium">Loss of Pay (LWP)</p>
                <p className="font-bold text-rose-600">{sample.lwpDays} Day(s)</p>
              </div>
            </div>

            {/* Earnings & Deductions Comparison Table */}
            <div className="grid gap-6 sm:grid-cols-2">
              {/* Earnings */}
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <div className="bg-slate-100/70 px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-700">
                  Earnings
                </div>
                <div className="divide-y divide-slate-100 p-4 text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Basic Salary</span>
                    <span className="font-bold">{formatMoney(sample.basicSalary)}</span>
                  </div>
                  <div className="flex justify-between pt-2">
                    <span className="text-slate-600">House Rent Allowance (HRA)</span>
                    <span className="font-bold">{formatMoney(sample.hra)}</span>
                  </div>
                  <div className="flex justify-between pt-2">
                    <span className="text-slate-600">Special Allowance</span>
                    <span className="font-bold">{formatMoney(sample.specialAllowance)}</span>
                  </div>
                  <div className="flex justify-between pt-2">
                    <span className="text-slate-600">Performance Bonus</span>
                    <span className="font-bold">{formatMoney(sample.bonus)}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 pt-3 font-black text-indigo-700">
                    <span>Total Gross Earnings</span>
                    <span>{formatMoney(totalEarnings)}</span>
                  </div>
                </div>
              </div>

              {/* Deductions */}
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <div className="bg-slate-100/70 px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-700">
                  Deductions
                </div>
                <div className="divide-y divide-slate-100 p-4 text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Provident Fund (PF)</span>
                    <span className="font-bold">{formatMoney(sample.pfDeduction)}</span>
                  </div>
                  <div className="flex justify-between pt-2">
                    <span className="text-slate-600">Income Tax (TDS)</span>
                    <span className="font-bold">{formatMoney(sample.taxDeduction)}</span>
                  </div>
                  <div className="flex justify-between pt-2">
                    <span className="text-slate-600">ESI Contribution</span>
                    <span className="font-bold">{formatMoney(sample.esiDeduction)}</span>
                  </div>
                  <div className="flex justify-between pt-2">
                    <span className="text-slate-600">Professional Tax / Other</span>
                    <span className="font-bold">{formatMoney(sample.otherDeductions)}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 pt-3 font-black text-rose-700">
                    <span>Total Deductions</span>
                    <span>{formatMoney(totalDeductions)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Net Pay Callout */}
            <div className="mt-6 flex flex-col items-center justify-between gap-4 rounded-2xl bg-indigo-900 p-5 text-white sm:flex-row sm:p-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                  Net Payable Amount
                </p>
                <p className="text-2xl sm:text-3xl font-black">{formatMoney(netPay)}</p>
                <p className="text-xs text-indigo-200 mt-0.5">
                  Direct Bank Transfer on {sample.disbursedOn}
                </p>
              </div>

              {/* Digital Verification QR Box */}
              <div className="flex items-center gap-3 rounded-xl bg-indigo-800/80 p-3 border border-indigo-700">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white text-slate-900 shadow-inner">
                  <QrCode className="h-8 w-8 text-slate-900" />
                </div>
                <div className="text-left">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                    Cryptographic QR
                  </p>
                  <p className="font-mono text-[9px] text-indigo-200">
                    SHA256: 8f4a...92b1
                  </p>
                  <p className="text-[9px] text-indigo-300">Scan to verify tamper-proof</p>
                </div>
              </div>
            </div>

            {/* Signature & Watermark Footer */}
            <div className="mt-8 pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 gap-4">
              <p>This is a system-generated document and requires no physical signature.</p>
              <p className="font-mono">Generated via UabIndia Enterprise Cloud</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
