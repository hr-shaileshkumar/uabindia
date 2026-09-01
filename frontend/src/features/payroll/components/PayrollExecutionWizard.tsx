"use client";

import React, { useState } from "react";
import {
  Calendar,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  DollarSign,
  Users,
  ShieldCheck,
  FileText,
  Lock,
  Download,
  Send,
  Building2,
  Sparkles,
  RefreshCw,
  Clock,
  Layers,
  HelpCircle,
  FileCheck2,
  Check,
  AlertTriangle,
} from "lucide-react";
import { StatusBadge } from "@/components/workspace/status-badge";
import { notifySuccess, notifyError } from "@/lib/notifications";
import { formatCurrency } from "@/lib/formatters";
import { useLocalization } from "@/context/LocalizationContext";

interface PayrollExecutionWizardProps {
  onClose: () => void;
  onComplete?: () => void;
}

const STEPS = [
  { id: 1, title: "Scope & Period", desc: "Select Month & Branch" },
  { id: 2, title: "Lock Attendance", desc: "Validate Working Days" },
  { id: 3, title: "Sync Leaves", desc: "Process LWP & Leaves" },
  { id: 4, title: "Compute Pay", desc: "Run Earnings & Deductions" },
  { id: 5, title: "Exceptions", desc: "Audit Anomalies & Flags" },
  { id: 6, title: "Preview Register", desc: "Review Salary Sheet" },
  { id: 7, title: "Approvals", desc: "Finance Head Sign-Off" },
  { id: 8, title: "Post to Ledger", desc: "Auto-Journal Voucher" },
  { id: 9, title: "Batch Payslips", desc: "Generate Digital PDFs" },
  { id: 10, title: "Bank Payout", desc: "Export Bank NEFT File" },
];

export function PayrollExecutionWizard({ onClose, onComplete }: PayrollExecutionWizardProps) {
  const { activeCountry } = useLocalization();
  const [currentStep, setCurrentStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);

  // Form & Wizard State
  const [payPeriod, setPayPeriod] = useState("August 2026");
  const [payrollType, setPayrollType] = useState("Regular Monthly");
  const [companyScope, setCompanyScope] = useState("All Companies & Branches");
  const [attendanceLocked, setAttendanceLocked] = useState(false);
  const [leavesSynced, setLeavesSynced] = useState(false);
  const [computed, setComputed] = useState(false);
  const [approved, setApproved] = useState(false);
  const [ledgerPosted, setLedgerPosted] = useState(false);
  const [payslipsGenerated, setPayslipsGenerated] = useState(false);

  const handleNext = () => {
    if (currentStep < 10) {
      setCurrentStep((s) => s + 1);
    } else {
      notifySuccess("Payroll run successfully executed and locked for disbursement.", "Payroll");
      onComplete?.();
      onClose();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep((s) => s - 1);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 sm:p-6 overflow-y-auto">
      <div className="relative flex flex-col w-full max-w-5xl rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/20">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                10-Step Enterprise Payroll Execution Wizard
                <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                  {payPeriod}
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                End-to-end statutory payroll run with audit compliance, ledger posting, and bank disbursement.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
          >
            ✕
          </button>
        </div>

        {/* Stepper Bar */}
        <div className="overflow-x-auto border-b border-slate-100 bg-slate-50/70 px-6 py-3 dark:border-slate-800 dark:bg-slate-950/40">
          <div className="flex items-center gap-2 min-w-[750px]">
            {STEPS.map((step, idx) => {
              const isCompleted = currentStep > step.id;
              const isCurrent = currentStep === step.id;
              return (
                <React.Fragment key={step.id}>
                  <button
                    type="button"
                    onClick={() => {
                      if (step.id < currentStep) setCurrentStep(step.id);
                    }}
                    className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs font-medium transition-all ${
                      isCurrent
                        ? "bg-white text-indigo-600 shadow-xs ring-1 ring-slate-200 dark:bg-slate-800 dark:text-indigo-400 dark:ring-slate-700 font-bold"
                        : isCompleted
                        ? "text-emerald-700 hover:bg-white/60 dark:text-emerald-400"
                        : "text-slate-400 cursor-not-allowed"
                    }`}
                  >
                    <div
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                        isCompleted
                          ? "bg-emerald-600 text-white"
                          : isCurrent
                          ? "bg-indigo-600 text-white"
                          : "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                      }`}
                    >
                      {isCompleted ? <Check className="h-3 w-3" /> : step.id}
                    </div>
                    <span className="truncate">{step.title}</span>
                  </button>
                  {idx < STEPS.length - 1 && (
                    <div
                      className={`h-0.5 w-3 shrink-0 ${
                        isCompleted ? "bg-emerald-500" : "bg-slate-200 dark:bg-slate-800"
                      }`}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Step Body Content */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8">
          {/* STEP 1: Scope & Period */}
          {currentStep === 1 && (
            <div className="space-y-6 max-w-2xl">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Step 1: Select Payroll Period & Company Scope
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Choose the monthly pay period cycle and organizational branches to process.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Pay Period (Month & Year)
                  </label>
                  <select
                    value={payPeriod}
                    onChange={(e) => setPayPeriod(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="August 2026">August 2026 (01-Aug-2026 to 31-Aug-2026)</option>
                    <option value="July 2026">July 2026 (01-Jul-2026 to 31-Jul-2026)</option>
                    <option value="September 2026">September 2026 (01-Sep-2026 to 30-Sep-2026)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Run Type</label>
                  <select
                    value={payrollType}
                    onChange={(e) => setPayrollType(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="Regular Monthly">Regular Monthly Payroll</option>
                    <option value="Bonus & Arrears">Special Bonus & Arrears Run</option>
                    <option value="Off-cycle Payout">Off-cycle Interim Settlement</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Company & Branches Scope</label>
                  <select
                    value={companyScope}
                    onChange={(e) => setCompanyScope(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="All Companies & Branches">All Active Companies & Global Branch Offices (142 Employees)</option>
                    <option value="Global Corporate HQ">Global Corporate Headquarters (54 Employees)</option>
                    <option value="Regional Field Operations">Regional Field & Operating Units (88 Employees)</option>
                  </select>
                </div>
              </div>

              <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4 text-xs text-blue-900 dark:border-blue-950 dark:bg-blue-950/30 dark:text-blue-200">
                <p className="font-bold flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-blue-600" />
                  Global & Regional Statutory Compliance Baseline
                </p>
                <p className="mt-1 text-[11px] text-blue-800/80 dark:text-blue-300/80">
                  Standard EPF (12%), ESIC (0.75%), Regional/State Professional Taxes, and Income Tax TDS regulations will be applied automatically.
                </p>
              </div>
            </div>
          )}

          {/* STEP 2: Lock Attendance */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Step 2: Validate & Lock Monthly Attendance
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Review daily biometric logs, FRS punches, and lock monthly payable days before calculation.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50">
                  <p className="text-[11px] font-semibold uppercase text-slate-400">Total Eligible Staff</p>
                  <p className="mt-1 text-xl font-extrabold text-slate-900 dark:text-white">142</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50">
                  <p className="text-[11px] font-semibold uppercase text-slate-400">Total Work Days</p>
                  <p className="mt-1 text-xl font-extrabold text-slate-900 dark:text-white">26 Days</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50">
                  <p className="text-[11px] font-semibold uppercase text-slate-400">Approved OT Hours</p>
                  <p className="mt-1 text-xl font-extrabold text-indigo-600 dark:text-indigo-400">84.5 hrs</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50">
                  <p className="text-[11px] font-semibold uppercase text-slate-400">Missing Punches</p>
                  <p className="mt-1 text-xl font-extrabold text-emerald-600 dark:text-emerald-400">0 (Resolved)</p>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">
                    Attendance Freeze & Snapshot Lock
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Locking attendance prevents any new punch modifications for {payPeriod}.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setAttendanceLocked(true);
                    notifySuccess("Attendance records frozen and locked for payroll calculation.", "Attendance");
                  }}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold ${
                    attendanceLocked
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-900 text-white hover:bg-slate-800 dark:bg-indigo-600"
                  }`}
                >
                  <Lock className="h-3.5 w-3.5" />
                  {attendanceLocked ? "Attendance Locked ✓" : "Freeze & Lock Attendance"}
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Sync Leaves */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Step 3: Synchronize Approved Leaves & LWP Deductions
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Fetch approved paid leaves and flag unauthorized absences for Loss of Pay (LOP/LWP) deductions.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                  <p className="text-xs font-bold text-slate-900 dark:text-white">Casual & Sick Leaves (Paid)</p>
                  <p className="mt-2 text-2xl font-extrabold text-indigo-600">42 Days</p>
                  <p className="text-[11px] text-slate-400 mt-1">Fully paid as per company leave quota.</p>
                </div>
                <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                  <p className="text-xs font-bold text-slate-900 dark:text-white">Earned Leaves (EL)</p>
                  <p className="mt-2 text-2xl font-extrabold text-blue-600">18 Days</p>
                  <p className="text-[11px] text-slate-400 mt-1">Accrued and approved by department heads.</p>
                </div>
                <div className="rounded-xl border border-rose-100 bg-rose-50/50 p-4 dark:border-rose-950 dark:bg-rose-950/20">
                  <p className="text-xs font-bold text-rose-900 dark:text-rose-300">Loss of Pay (LWP Deductions)</p>
                  <p className="mt-2 text-2xl font-extrabold text-rose-600">3 Days</p>
                  <p className="text-[11px] text-rose-700/80 dark:text-rose-400/80 mt-1">
                    2 employees flagged with unapproved leave. Pro-rata deduction will be applied.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setLeavesSynced(true);
                  notifySuccess("Leave and LWP records synchronized.", "Leave Engine");
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-500"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                {leavesSynced ? "Leaves Synchronized ✓" : "Sync Leave Balances"}
              </button>
            </div>
          )}

          {/* STEP 4: Compute Pay */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Step 4: Compute Earnings & Statutory Deductions
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Run the mathematical payroll calculation engine across all formula-based salary structures.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 dark:border-slate-800 dark:bg-slate-900/40 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3 dark:border-slate-800">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Summary Metric</span>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Total Computed ({activeCountry.currencySymbol})</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 dark:text-slate-400">Total Gross Salary CTC</span>
                  <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(4850000, activeCountry.currency)}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 dark:text-slate-400">Total Basic Wages</span>
                  <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(2425000, activeCountry.currency)}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-rose-600 dark:text-rose-400">
                  <span>Mandatory Social Security / Pension Deductions</span>
                  <span className="font-bold">-{formatCurrency(291000, activeCountry.currency)}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-rose-600 dark:text-rose-400">
                  <span>Statutory Healthcare & Insurance</span>
                  <span className="font-bold">-{formatCurrency(36375, activeCountry.currency)}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-rose-600 dark:text-rose-400">
                  <span>Withholding & Payroll Taxes</span>
                  <span className="font-bold">-{formatCurrency(240000, activeCountry.currency)}</span>
                </div>
                <div className="flex items-center justify-between border-t border-slate-200 pt-3 text-sm font-extrabold text-emerald-600 dark:border-slate-800 dark:text-emerald-400">
                  <span>Net Payout Amount</span>
                  <span>{formatCurrency(4282625, activeCountry.currency)}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setComputed(true);
                  notifySuccess("Payroll calculation completed for 142 employees.", "Payroll Engine");
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-500"
              >
                <Sparkles className="h-3.5 w-3.5" />
                {computed ? "Computation Completed ✓" : "Run Calculation Engine"}
              </button>
            </div>
          )}

          {/* STEP 5: Exceptions */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Step 5: Exceptions, Discrepancies & Anomaly Audit
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Automated checks to ensure no negative take-homes, missing bank details, or invalid statutory numbers.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 text-xs dark:border-emerald-950 dark:bg-emerald-950/20">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                    <div>
                      <p className="font-bold text-emerald-900 dark:text-emerald-200">Negative Net Salary Audit</p>
                      <p className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80">
                        0 employees found with negative or zero net take-home pay.
                      </p>
                    </div>
                  </div>
                  <span className="font-bold text-emerald-700">PASSED ✓</span>
                </div>

                <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 text-xs dark:border-emerald-950 dark:bg-emerald-950/20">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                    <div>
                      <p className="font-bold text-emerald-900 dark:text-emerald-200">Bank Account & IFSC Validation</p>
                      <p className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80">
                        142 / 142 employees have verified disbursement bank accounts.
                      </p>
                    </div>
                  </div>
                  <span className="font-bold text-emerald-700">PASSED ✓</span>
                </div>

                <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 text-xs dark:border-emerald-950 dark:bg-emerald-950/20">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                    <div>
                      <p className="font-bold text-emerald-900 dark:text-emerald-200">PAN & UAN Linking Check</p>
                      <p className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80">
                        All employees verified with valid income tax PAN and EPFO UAN.
                      </p>
                    </div>
                  </div>
                  <span className="font-bold text-emerald-700">PASSED ✓</span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: Preview Register */}
          {currentStep === 6 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Step 6: Master Salary Register Sheet Preview
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Review line-by-line employee calculations before sending for finance approval.
                </p>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-[11px] font-semibold uppercase text-slate-500 dark:bg-slate-800/60">
                    <tr>
                      <th className="px-4 py-3">Emp Code</th>
                      <th className="px-4 py-3">Employee Name</th>
                      <th className="px-4 py-3">Designation</th>
                      <th className="px-4 py-3">Gross Salary</th>
                      <th className="px-4 py-3">PF (12%)</th>
                      <th className="px-4 py-3">TDS Tax</th>
                      <th className="px-4 py-3">Net Take-Home</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {[
                      { code: "EMP-00124", name: "Rahul Kumar", desig: "HR Executive", gross: 45000, pf: 2700, tds: 1500, net: 40800 },
                      { code: "EMP-00125", name: "Priya Sharma", desig: "Senior Developer", gross: 85000, pf: 5100, tds: 6500, net: 73400 },
                      { code: "EMP-00126", name: "Amit Verma", desig: "Field Operations Specialist", gross: 38000, pf: 2280, tds: 1000, net: 34720 },
                      { code: "EMP-00127", name: "Suman Patel", desig: "Accounts Manager", gross: 65000, pf: 3900, tds: 4200, net: 56900 },
                    ].map((row) => (
                      <tr key={row.code} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        <td className="px-4 py-3 font-mono font-bold text-slate-900 dark:text-white">{row.code}</td>
                        <td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-200">{row.name}</td>
                        <td className="px-4 py-3 text-slate-500">{row.desig}</td>
                        <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">{formatCurrency(row.gross, activeCountry.currency)}</td>
                        <td className="px-4 py-3 text-rose-600">-{formatCurrency(row.pf, activeCountry.currency)}</td>
                        <td className="px-4 py-3 text-rose-600">-{formatCurrency(row.tds, activeCountry.currency)}</td>
                        <td className="px-4 py-3 font-extrabold text-emerald-600">{formatCurrency(row.net, activeCountry.currency)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* STEP 7: Approvals */}
          {currentStep === 7 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Step 7: Multi-Level Finance & Management Approval
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Sequential workflow authorization to disburse {formatCurrency(4282625, activeCountry.currency)} for {payPeriod}.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-xl border border-slate-200 p-4 text-xs dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-white font-bold">1</div>
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">Prepared by Payroll Specialist</p>
                      <p className="text-[11px] text-slate-400">Verified working days and LWP</p>
                    </div>
                  </div>
                  <span className="rounded bg-emerald-50 px-2 py-0.5 font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                    APPROVED ✓
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-xl border border-slate-200 p-4 text-xs dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-white font-bold">2</div>
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">Reviewed by HR Head</p>
                      <p className="text-[11px] text-slate-400">Headcount and overtime validated</p>
                    </div>
                  </div>
                  <span className="rounded bg-emerald-50 px-2 py-0.5 font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                    APPROVED ✓
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-xl border border-indigo-200 bg-indigo-50/50 p-4 text-xs dark:border-indigo-950 dark:bg-indigo-950/20">
                  <div className="flex items-center gap-3">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 text-white font-bold">3</div>
                    <div>
                      <p className="font-bold text-indigo-950 dark:text-indigo-200">Finance Director Final Authorization</p>
                      <p className="text-[11px] text-indigo-700/80 dark:text-indigo-400/80">Funds disbursement approval</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setApproved(true);
                      notifySuccess("Final finance authorization recorded.", "Workflow");
                    }}
                    className="rounded-xl bg-indigo-600 px-3.5 py-1.5 font-bold text-white shadow-sm hover:bg-indigo-500"
                  >
                    {approved ? "Authorized ✓" : "Authorize Payout"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 8: Post to Ledger */}
          {currentStep === 8 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Step 8: Automatic General Ledger Voucher Posting
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Double-entry accounting journal voucher generated automatically into Chart of Accounts.
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/40 text-xs space-y-2">
                <div className="flex justify-between font-mono font-bold text-slate-700 dark:text-slate-300">
                  <span>JV-2026-PAY-0826</span>
                  <span>Date: 31-Aug-2026</span>
                </div>
                <div className="border-t border-slate-200 pt-2 space-y-1.5 font-mono text-[11px] dark:border-slate-700">
                  <div className="flex justify-between text-slate-900 dark:text-white">
                    <span>DR. Salary & Wages Expense (#50100)</span>
                    <span>{formatCurrency(4850000, activeCountry.currency)}</span>
                  </div>
                  <div className="flex justify-between text-rose-600 pl-4">
                    <span>CR. Pension / Social Security Payable (#20210)</span>
                    <span>{formatCurrency(291000, activeCountry.currency)}</span>
                  </div>
                  <div className="flex justify-between text-rose-600 pl-4">
                    <span>CR. Statutory Insurance Payable (#20220)</span>
                    <span>{formatCurrency(36375, activeCountry.currency)}</span>
                  </div>
                  <div className="flex justify-between text-rose-600 pl-4">
                    <span>CR. Withholding Tax Payable (#20230)</span>
                    <span>{formatCurrency(240000, activeCountry.currency)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-600 font-bold pl-4">
                    <span>CR. Net Salary Payable (#20150)</span>
                    <span>{formatCurrency(4282625, activeCountry.currency)}</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setLedgerPosted(true);
                  notifySuccess("Journal Voucher JV-2026-PAY-0826 posted to General Ledger.", "Finance");
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-500"
              >
                <FileCheck2 className="h-3.5 w-3.5" />
                {ledgerPosted ? "Posted to Ledger ✓" : "Commit Financial Ledger Posting"}
              </button>
            </div>
          )}

          {/* STEP 9: Batch Payslips */}
          {currentStep === 9 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Step 9: Batch Generate Digital PDF Payslips
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Cryptographically sign and publish payslips to Employee Self-Service (ESS) portals.
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 p-6 text-center dark:border-slate-800 space-y-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 mx-auto dark:bg-indigo-950 dark:text-indigo-400">
                  <FileText className="h-6 w-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  142 Employee Payslips Ready for Batch Processing
                </h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  PDFs will be generated with encrypted tamper-proof digital seals and uploaded to employee document vaults.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setPayslipsGenerated(true);
                    notifySuccess("142 PDF payslips generated and published to ESS portal.", "Payslip Engine");
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-500"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  {payslipsGenerated ? "142 Payslips Generated ✓" : "Generate & Publish All 142 Payslips"}
                </button>
              </div>
            </div>
          )}

          {/* STEP 10: Bank Payout */}
          {currentStep === 10 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Step 10: Bank Direct Disbursement & Notifications
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Download standard NEFT/RTGS bank payout transfer file and trigger SMS/Email notifications.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-200 p-5 dark:border-slate-800 space-y-3">
                  <div className="flex items-center gap-2 font-bold text-xs text-slate-900 dark:text-white">
                    <Download className="h-4 w-4 text-indigo-600" />
                    Bank NEFT/RTGS Transfer File
                  </div>
                  <p className="text-xs text-slate-500">
                    Standard bank file formatted for HDFC, SBI, ICICI, and PNB direct corporate salary disbursement.
                  </p>
                  <button
                    type="button"
                    onClick={() => notifySuccess("Bank Transfer File (CSV) downloaded.", "Payout")}
                    className="w-full inline-flex justify-center items-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download Bank Payout Sheet (.csv)
                  </button>
                </div>

                <div className="rounded-xl border border-slate-200 p-5 dark:border-slate-800 space-y-3">
                  <div className="flex items-center gap-2 font-bold text-xs text-slate-900 dark:text-white">
                    <Send className="h-4 w-4 text-emerald-600" />
                    Employee Payout Alerts
                  </div>
                  <p className="text-xs text-slate-500">
                    Trigger automated SMS and Email alerts with payslip download links to all 142 employees.
                  </p>
                  <button
                    type="button"
                    onClick={() => notifySuccess("Disbursement alerts queued for dispatch.", "Communication")}
                    className="w-full inline-flex justify-center items-center gap-1.5 rounded-xl bg-emerald-600 py-2 text-xs font-bold text-white hover:bg-emerald-500"
                  >
                    <Send className="h-3.5 w-3.5" />
                    Dispatch Salary SMS & Email
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation Actions */}
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 px-6 py-4 dark:border-slate-800 dark:bg-slate-950/40">
          <button
            type="button"
            onClick={handleBack}
            disabled={currentStep === 1}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Previous Step
          </button>

          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-400">
              Step {currentStep} of 10
            </span>
            <button
              type="button"
              onClick={handleNext}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-500"
            >
              <span>{currentStep === 10 ? "Complete & Lock Run" : "Next Step"}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
