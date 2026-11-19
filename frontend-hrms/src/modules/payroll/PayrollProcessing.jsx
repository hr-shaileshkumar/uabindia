import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  CreditCard,
  Play,
  CheckCircle2,
  AlertCircle,
  Download,
  ShieldCheck,
  FileText,
  Clock,
  Users,
  ChevronRight,
} from "lucide-react";
import { INITIAL_PAYROLL_RUNS } from "../../services/mockData";
import hrmsService from "../../services/hrmsService";
import { useNotification } from "../../context/NotificationContext";
import StatusBadge from "../../components/common/StatusBadge";

export const PayrollProcessing = () => {
  const { notifySuccess, notifyError } = useNotification();
  const [runs, setRuns] = useState(INITIAL_PAYROLL_RUNS);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [selectedMonth, setSelectedMonth] = useState("November 2026");

  useEffect(() => {
    hrmsService.getPayrollRuns().then(setRuns);
  }, []);

  const startWizard = () => {
    setWizardStep(1);
    setIsWizardOpen(true);
  };

  const handleCompleteRun = async () => {
    const newRun = await hrmsService.executePayrollRun({ payrollMonth: selectedMonth });
    setRuns((prev) => [newRun, ...prev]);
    setIsWizardOpen(false);
    notifySuccess(`Payroll cycle for ${selectedMonth} processed and locked`);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-0.5">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200/60">
              Compensation Engine
            </span>
            <span className="text-[11px] text-slate-400 font-mono">payroll.runs</span>
          </div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
            Unified Payroll Run Wizard
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Automated monthly salary computation, statutory compliance deductions, and bank payout file generation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/payroll/payslips"
            className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-2xs transition-colors flex items-center gap-1.5"
          >
            <FileText className="w-3.5 h-3.5 text-slate-500" />
            Employee Payslips
          </Link>

          <button
            onClick={startWizard}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-2xs shadow-blue-500/20 transition-colors"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            Launch Payroll Run
          </button>
        </div>
      </div>

      {/* Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3 rounded-xl bg-white border border-slate-100 shadow-2xs">
          <div className="text-[10px] font-bold text-slate-400 uppercase">Monthly Net Disbursed</div>
          <div className="text-xl font-bold text-slate-900 mt-0.5 font-mono">₹ 42,70,000</div>
          <div className="text-[10.5px] text-emerald-600 font-semibold mt-0.5">October Cycle Completed</div>
        </div>

        <div className="p-3 rounded-xl bg-white border border-slate-100 shadow-2xs">
          <div className="text-[10px] font-bold text-slate-400 uppercase">Statutory Deductions (EPF/ESI/PT)</div>
          <div className="text-xl font-bold text-slate-900 mt-0.5 font-mono">₹ 5,80,000</div>
          <div className="text-[10.5px] text-blue-600 font-semibold mt-0.5">ECR Challan Ready</div>
        </div>

        <div className="p-3 rounded-xl bg-white border border-slate-100 shadow-2xs">
          <div className="text-[10px] font-bold text-slate-400 uppercase">Staff Processed</div>
          <div className="text-xl font-bold text-slate-900 mt-0.5">48 Employees</div>
          <div className="text-[10.5px] text-amber-600 font-semibold mt-0.5">100% Direct Deposit</div>
        </div>
      </div>

      {/* Batches Table */}
      <div className="bg-white rounded-xl border border-slate-200/70 shadow-2xs overflow-hidden">
        <div className="px-3.5 py-2.5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-900">Historical Execution Batches</h3>
          <span className="text-[11px] text-slate-400">{runs.length} cycles recorded</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-bold select-none text-[10.5px] uppercase tracking-wider">
                <th className="px-3 py-2">Batch ID</th>
                <th className="px-3 py-2">Salary Month</th>
                <th className="px-3 py-2">Run Date</th>
                <th className="px-3 py-2">Total Gross</th>
                <th className="px-3 py-2">Statutory Deductions</th>
                <th className="px-3 py-2">Net Payable</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {runs.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-3 py-2 font-mono font-bold text-blue-600 text-[11px]">{r.id || r.runCode}</td>
                  <td className="px-3 py-2 font-bold text-slate-800">{r.payrollMonth || r.month}</td>
                  <td className="px-3 py-2 text-slate-600 text-[11px]">{r.runDate || r.processedDate}</td>
                  <td className="px-3 py-2 font-mono text-slate-800">
                    ₹ {Number(r.totalGross || 0).toLocaleString("en-IN")}
                  </td>
                  <td className="px-3 py-2 font-mono text-rose-600">
                    ₹ {Number(r.totalDeductions || 0).toLocaleString("en-IN")}
                  </td>
                  <td className="px-3 py-2 font-mono font-bold text-emerald-600">
                    ₹ {Number(r.totalNet || 0).toLocaleString("en-IN")}
                  </td>
                  <td className="px-3 py-2">
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="px-3 py-2 text-right">
                    <Link
                      to="/payroll/payslips"
                      className="px-2.5 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-50 rounded-md transition-colors inline-block"
                    >
                      View Payslips
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4-Step Interactive Payroll Wizard Modal */}
      {isWizardOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col animate-in zoom-in-95 duration-150">
            {/* Wizard Header */}
            <div className="px-6 py-5 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Monthly Payroll Execution Wizard
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Step {wizardStep} of 4:{" "}
                  {wizardStep === 1
                    ? "Attendance & LOP Verification"
                    : wizardStep === 2
                    ? "Earnings & Overtime Computation"
                    : wizardStep === 3
                    ? "Statutory Compliance Audit (PF/ESI/PT/TDS)"
                    : "Final Disbursement Lock & NEFT File"}
                </p>
              </div>
              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700">
                {selectedMonth}
              </span>
            </div>

            {/* Stepper Progress */}
            <div className="flex border-b border-slate-200 bg-white px-6 py-2.5 text-xs font-semibold">
              {[
                { s: 1, title: "1. Attendance" },
                { s: 2, title: "2. Earnings" },
                { s: 3, title: "3. Compliance" },
                { s: 4, title: "4. Disburse" },
              ].map((step) => (
                <div
                  key={step.s}
                  className={`flex-1 text-center py-1 border-b-2 transition-colors ${
                    wizardStep === step.s
                      ? "border-indigo-600 text-indigo-600 font-bold"
                      : wizardStep > step.s
                      ? "border-emerald-500 text-emerald-600"
                      : "border-transparent text-slate-400"
                  }`}
                >
                  {step.title}
                </div>
              ))}
            </div>

            {/* Step Body */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              {wizardStep === 1 && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-100 flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-indigo-900">Attendance Register Locked</h4>
                      <p className="text-indigo-700 mt-0.5">
                        Biometric clock-ins verified across all 7 location tiers. Total 8 active employees on payroll.
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-slate-700">
                    <div className="p-3 rounded-lg border border-slate-200">
                      <div className="text-[10px] text-slate-400 uppercase font-bold">Total Working Days</div>
                      <div className="text-base font-bold text-slate-800 mt-1">26 Days</div>
                    </div>
                    <div className="p-3 rounded-lg border border-slate-200">
                      <div className="text-[10px] text-slate-400 uppercase font-bold">Total LOP (Loss of Pay)</div>
                      <div className="text-base font-bold text-slate-800 mt-1">0 Days Deducted</div>
                    </div>
                  </div>
                </div>
              )}

              {wizardStep === 2 && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-100 flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-emerald-900">Earnings Components Computed</h4>
                      <p className="text-emerald-700 mt-0.5">
                        Basic, HRA, and Special Allowances calculated under standard salary structures.
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-slate-700">
                    <div className="p-3 rounded-lg border border-slate-200">
                      <div className="text-[10px] text-slate-400 uppercase font-bold">Total Base Gross</div>
                      <div className="text-base font-bold font-mono text-slate-800 mt-1">₹ 52,00,000</div>
                    </div>
                    <div className="p-3 rounded-lg border border-slate-200">
                      <div className="text-[10px] text-slate-400 uppercase font-bold">Approved Overtime Additions</div>
                      <div className="text-base font-bold font-mono text-slate-800 mt-1">₹ 34,500</div>
                    </div>
                  </div>
                </div>
              )}

              {wizardStep === 3 && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-100 flex items-start gap-3">
                    <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-blue-900">Statutory Compliance Formulae Verified</h4>
                      <p className="text-blue-700 mt-0.5">
                        EPF capped at ₹1,800/month, ESI exempt above ₹21k, PT standard ₹200, Tax TDS slabs applied.
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-slate-700">
                    <div className="p-3 rounded-lg border border-slate-200">
                      <div className="text-[10px] text-slate-400 uppercase font-bold">Total EPF (Employee)</div>
                      <div className="text-sm font-bold font-mono text-slate-800 mt-1">₹ 14,400</div>
                    </div>
                    <div className="p-3 rounded-lg border border-slate-200">
                      <div className="text-[10px] text-slate-400 uppercase font-bold">Total PT</div>
                      <div className="text-sm font-bold font-mono text-slate-800 mt-1">₹ 1,600</div>
                    </div>
                    <div className="p-3 rounded-lg border border-slate-200">
                      <div className="text-[10px] text-slate-400 uppercase font-bold">Estimated TDS</div>
                      <div className="text-sm font-bold font-mono text-slate-800 mt-1">₹ 6,08,000</div>
                    </div>
                  </div>
                </div>
              )}

              {wizardStep === 4 && (
                <div className="space-y-4 text-center py-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-2">
                    <CreditCard className="w-6 h-6" />
                  </div>
                  <h4 className="text-base font-bold text-slate-900">Ready to Lock & Disburse</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Total Net Payout of <strong className="text-slate-800 font-mono">₹ 45,76,000</strong> will be finalized and individual employee payslips will be generated.
                  </p>
                </div>
              )}
            </div>

            {/* Wizard Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setIsWizardOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>

              <div className="flex items-center gap-2">
                {wizardStep > 1 && (
                  <button
                    type="button"
                    onClick={() => setWizardStep((s) => s - 1)}
                    className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors"
                  >
                    Previous Step
                  </button>
                )}
                {wizardStep < 4 ? (
                  <button
                    type="button"
                    onClick={() => setWizardStep((s) => s + 1)}
                    className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    <span>Proceed to Step {wizardStep + 1}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleCompleteRun}
                    className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Lock & Disburse Batch
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayrollProcessing;
