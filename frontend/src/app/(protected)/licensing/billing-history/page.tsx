"use client";

import { useState } from "react";
import ModuleTablePage from "@/features/shared/components/ModuleTablePage";
import { CrudHeaderStats } from "@/components/erp/crud-workspace";

type BillingRow = {
  id: string;
  invoiceNumber: string;
  period: string;
  amount: number;
  plan: string;
  paidDate: string;
  status: string;
};

export default function LicensingBillingHistoryPage() {
  const [records] = useState<BillingRow[]>([]);

  return (
    <ModuleTablePage
      title="Billing History"
      subtitle="Review historical billing records, invoices, and payment confirmations for your subscription."
      eyebrow="Licensing / Billing"
      icon="payroll"
      toolbarTitle="Billing ledger"
      toolbarSubtitle="Track all billing cycles, invoice amounts, and payment state for your ERP subscription."
      loading={false}
      rows={records}
      countLabel={(count) => `${count} billing records`}
      emptyMessage="No billing records found."
      headerStats={
        <CrudHeaderStats
          items={[
            { label: "Invoices", value: records.length, helper: "total" },
            {
              label: "Paid",
              value: records.filter((record) => record.status === "Paid").length,
              tone: "positive",
            },
            {
              label: "Pending",
              value: records.filter((record) => record.status === "Pending").length,
              tone: "warning",
            },
            {
              label: "Billed",
              value: records.reduce((total, record) => total + record.amount, 0).toLocaleString(),
              helper: "cumulative",
              tone: "info",
            },
          ]}
        />
      }
      columns={[
        { label: "Invoice #" },
        { label: "Period" },
        { label: "Plan" },
        { label: "Amount" },
        { label: "Paid Date" },
        { label: "Status" },
      ]}
      renderRow={(r) => (
        <tr key={r.id} className="erp-tr">
          <td className="erp-td text-slate-900 font-mono text-xs">{r.invoiceNumber}</td>
          <td className="erp-td text-slate-600">{r.period}</td>
          <td className="erp-td"><span className="erp-chip erp-chip-neutral">{r.plan}</span></td>
          <td className="erp-td text-slate-600">{r.amount.toLocaleString()}</td>
          <td className="erp-td text-slate-600">{r.paidDate || "-"}</td>
          <td className="erp-td"><span className={`erp-chip ${r.status === "Paid" ? "erp-chip-success" : "erp-chip-warning"}`}>{r.status}</span></td>
        </tr>
      )}
    />
  );
}
