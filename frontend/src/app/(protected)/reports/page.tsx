"use client";

import {
  BarChart3,
  PieChart,
  FileSpreadsheet,
  TrendingUp,
  Users,
  DollarSign,
  Package,
  Settings,
} from "lucide-react";
import { UabModuleDashboard } from "@/components/dynamic/UabModuleDashboard";

const LINKS = [
  { href: "/reports/financial", label: "Financial Reports", icon: DollarSign, desc: "P&L, balance sheet, cash flow" },
  { href: "/reports/hr", label: "HR Reports", icon: Users, desc: "Headcount, attrition, and payroll" },
  { href: "/reports/payroll", label: "Payroll Reports", icon: FileSpreadsheet, desc: "Salary registers and statutory" },
  { href: "/reports/operations", label: "Operations Reports", icon: BarChart3, desc: "Sales, procurement, inventory" },
  { href: "/reports/compliance", label: "Compliance Reports", icon: PieChart, desc: "Regulatory and audit reports" },
  { href: "/reports/custom", label: "Custom Reports", icon: Settings, desc: "Build your own data reports" },
  { href: "/reports/builder", label: "Report Builder", icon: Settings, desc: "Drag-and-drop report designer" },
];

export default function ReportsPage() {
  return (
    <UabModuleDashboard
      moduleKey="reports"
      title="Reports & Analytics"
      subtitle="Business intelligence, financial statements, operational reports, and custom analytics."
      eyebrow="Reports"
      icon={BarChart3}
      color="from-violet-600 via-indigo-600 to-blue-600"
      links={LINKS}
      linksTitle="Report Categories"
    />
  );
}
