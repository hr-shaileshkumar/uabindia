"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Calculator, FileText, Landmark, Receipt, Scale, Wallet } from "lucide-react";
import { ModuleWorkspaceHub } from "@/components/workspace/module-workspace-hub";
import {
  erpPanelBodyClassName,
  erpPanelClassName,
  erpPanelHeaderClassName,
  erpPanelTitleClassName,
} from "@/components/workspace/styles";
import { ROUTES } from "@/constants/routes";
import { payrollApi } from "@/services/modules";
import { getApiErrorMessage } from "@/lib/api-errors";
import type { PayrollOverviewStats, PayrollRunSummary } from "@/types";

const LINKS = [
  { href: ROUTES.PAYROLL_RUNS, label: "Payroll runs", icon: Calculator, desc: "Process monthly salary cycles" },
  { href: ROUTES.PAYROLL_PAYSLIPS, label: "Payslips", icon: FileText, desc: "Employee payslip register" },
  { href: ROUTES.PAYROLL_STRUCTURES, label: "Structures", icon: Scale, desc: "CTC templates and components" },
  { href: ROUTES.PAYROLL_STATUTORY, label: "Statutory", icon: Landmark, desc: "PF, ESI, PT, and TDS setup" },
  { href: ROUTES.PAYROLL_TAX_DECLARATIONS, label: "Tax declarations", icon: Receipt, desc: "Employee investment proofs" },
  { href: ROUTES.PAYROLL_REIMBURSEMENTS, label: "Reimbursements", icon: Wallet, desc: "Claims and payouts" },
  { href: ROUTES.PAYROLL_LOANS, label: "Loans", icon: Wallet, desc: "Salary advances and recoveries" },
  { href: ROUTES.PAYROLL_FINAL_SETTLEMENT, label: "Final settlement", icon: Scale, desc: "Full and final on exit" },
];

const formatCurrency = (value?: number) =>
  value != null ? `₹${value.toLocaleString("en-IN")}` : "₹0";

export default function PayrollPage() {
  const [stats, setStats] = useState<PayrollOverviewStats | null>(null);
  const [runs, setRuns] = useState<PayrollRunSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    Promise.all([payrollApi.dashboard(), payrollApi.runs.list()])
      .then(([dashRes, runRes]) => {
        if (!alive) return;
        setStats(dashRes.data as PayrollOverviewStats);
        const payload = runRes.data as PayrollRunSummary[] | { data?: PayrollRunSummary[]; records?: PayrollRunSummary[] };
        setRuns(Array.isArray(payload) ? payload : payload?.records ?? payload?.data ?? []);
      })
      .catch((err) => {
        if (!alive) return;
        setError(getApiErrorMessage(err, "Could not load payroll snapshot."));
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <ModuleWorkspaceHub
      title="Payroll"
      subtitle="Salary processing, statutory India compliance, reimbursements, and settlements."
      eyebrow="People"
      icon="wallet"
      loading={loading}
      error={error}
      links={LINKS}
      linksTitle="Payroll workspaces"
      stats={[
        { label: "Runs", value: stats?.totalRuns ?? runs.length, helper: "All cycles", href: ROUTES.PAYROLL_RUNS, icon: Calculator },
        { label: "Completed", value: stats?.completedRuns ?? 0, helper: "Posted", href: ROUTES.PAYROLL_RUNS, icon: Scale },
        { label: "Payslips", value: stats?.totalPayslips ?? 0, helper: "Issued", href: ROUTES.PAYROLL_PAYSLIPS, icon: FileText },
        { label: "Payout", value: formatCurrency(stats?.totalPayout), helper: "Gross processed", href: ROUTES.PAYROLL_RUNS, icon: Wallet },
      ]}
    >
      <section className={erpPanelClassName}>
        <div className={erpPanelHeaderClassName}>
          <h2 className={erpPanelTitleClassName}>Latest runs</h2>
          <Link href={ROUTES.PAYROLL_RUNS} className="text-xs font-semibold text-slate-700 hover:text-slate-900">
            View all
          </Link>
        </div>
        <div className={`${erpPanelBodyClassName} space-y-2 text-sm`}>
          {loading ? (
            <p className="text-slate-500">Loading…</p>
          ) : runs.slice(0, 5).length === 0 ? (
            <p className="text-slate-500">No payroll runs yet.</p>
          ) : (
            runs.slice(0, 5).map((run) => (
              <div key={run.id} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2">
                <span className="truncate font-medium text-slate-800">
                  {run.runDate ? new Date(run.runDate).toLocaleDateString("en-IN") : run.id}
                </span>
                <span className="text-xs text-slate-500">{run.status || "Draft"}</span>
              </div>
            ))
          )}
        </div>
      </section>
    </ModuleWorkspaceHub>
  );
}
