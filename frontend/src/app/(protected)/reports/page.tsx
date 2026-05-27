"use client";

import Link from "next/link";
import StandardPageLayout from "@/components/layout/StandardPageLayout";

export default function ReportsDashboardPage() {
  const reportTiles = [
    {
      href: "/erp/reports/hr",
      title: "HR Reports",
      description: "Headcount, attendance, leave, and workforce planning insights.",
      icon: "📊",
      meta: "People analytics",
    },
    {
      href: "/erp/reports/payroll",
      title: "Payroll Reports",
      description: "Salary structures, payout trends, deductions, and processing views.",
      icon: "💰",
      meta: "Finance operations",
    },
    {
      href: "/erp/reports/compliance",
      title: "Compliance Reports",
      description: "Audit-ready statutory, quality, and module-usage reporting.",
      icon: "🛡️",
      meta: "Governance layer",
    },
  ];

  return (
    <StandardPageLayout
      title="Analytics & Reports"
      subtitle="Unified insight layer for HR, payroll, compliance, and executive reporting."
      actions={<Link href="/erp/dashboard" className="erp-action-btn erp-action-btn-secondary">Back to ERP</Link>}
    >
      <div className="erp-tile-grid">
        {reportTiles.map((tile) => (
          <Link key={tile.href} href={tile.href} className="erp-tile">
            <span className="erp-tile-icon" aria-hidden>{tile.icon}</span>
            <div className="erp-tile-title">{tile.title}</div>
            <p className="erp-tile-desc">{tile.description}</p>
            <div className="erp-tile-meta">{tile.meta}</div>
          </Link>
        ))}
      </div>
    </StandardPageLayout>
  );
}
