"use client";

import {
  DollarSign,
  FileText,
  ReceiptText,
  Calculator,
  Building,
  Calendar,
  Gift,
  TrendingDown,
  Users,
  BarChart2,
} from "lucide-react";
import { ErpModuleDashboard } from "@/components/dynamic/ErpModuleDashboard";

const LINKS = [
  { href: "/payroll/runs", label: "Payroll Runs", icon: DollarSign, desc: "Monthly salary processing and approval" },
  { href: "/payroll/payslips", label: "Payslips", icon: ReceiptText, desc: "Employee payslip archive" },
  { href: "/payroll/structures", label: "Salary Structures", icon: Calculator, desc: "CTC components and breakups" },
  { href: "/payroll/components", label: "Pay Components", icon: FileText, desc: "Earnings, deductions, and reimbursements" },
  { href: "/payroll/statutory", label: "Statutory Filings", icon: Building, desc: "PF, ESI, TDS compliance" },
  { href: "/payroll/bonus", label: "Bonus & Incentives", icon: Gift, desc: "Performance bonus and incentive plans" },
  { href: "/payroll/loans", label: "Salary Advances & Loans", icon: TrendingDown, desc: "Employee loan management" },
  { href: "/payroll/tax-declarations", label: "Tax Declarations", icon: FileText, desc: "Form 12BB and IT proofs" },
  { href: "/payroll/arrears", label: "Arrears Processing", icon: Calendar, desc: "Backdated salary corrections" },
  { href: "/payroll/final-settlement", label: "Full & Final", icon: Building, desc: "Exit settlement computation" },
];

export default function PayrollPage() {
  return (
    <ErpModuleDashboard
      moduleKey="payroll"
      title="Payroll & Compensation"
      subtitle="Salary processing, payslips, statutory filings, and compensation management."
      eyebrow="Payroll"
      icon={DollarSign}
      color="from-green-600 via-emerald-600 to-teal-600"
      statsEndpoint="/payroll/dashboard/stats"
      statsMapper={(data) => [
        { label: "This Month Payroll", value: data?.monthlyPayroll ? `₹${Number(data.monthlyPayroll).toLocaleString("en-IN")}` : "—", icon: DollarSign, tone: "positive" },
        { label: "Employees Processed", value: data?.processedCount ?? 0, icon: Users, tone: "positive" },
        { label: "Pending Approvals", value: data?.pendingApprovals ?? 0, icon: FileText, tone: "warning" },
        { label: "Tax Liability (MTD)", value: data?.taxLiability ? `₹${Number(data.taxLiability).toLocaleString("en-IN")}` : "—", icon: BarChart2, tone: "neutral" },
      ]}
      kpis={[
        { label: "This Month Payroll", value: "—", icon: DollarSign, tone: "positive" },
        { label: "Employees Processed", value: "—", icon: Users, tone: "positive" },
        { label: "Pending Approvals", value: "—", icon: FileText, tone: "warning" },
        { label: "Tax Liability (MTD)", value: "—", icon: BarChart2, tone: "neutral" },
      ]}
      links={LINKS}
      linksTitle="Payroll Workspaces"
    />
  );
}
