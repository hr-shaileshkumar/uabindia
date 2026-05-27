"use client";

import { useState } from "react";
import ModuleTablePage from "@/features/shared/components/ModuleTablePage";

type TaxRow = {
  id: string;
  taxType: string;
  period: string;
  taxableAmount: number;
  taxAmount: number;
  status: string;
};

export default function TaxManagementPage() {
  const [records] = useState<TaxRow[]>([]);

  return (
    <ModuleTablePage
      title="Tax Management"
      subtitle="Manage GST, TDS, corporate tax filings, and statutory compliance obligations."
      eyebrow="Finance / Compliance"
      icon="shield"
      toolbarTitle="Tax register"
      toolbarSubtitle="Track tax liabilities, filing deadlines, and payment status across all applicable tax heads."
      loading={false}
      rows={records}
      countLabel={(count) => `${count} tax entries`}
      emptyMessage="No tax records found."
      kpiCards={
        <div className="erp-kpi-grid">
          <div className="erp-kpi-card"><p className="erp-kpi-label">Total Entries</p><p className="erp-kpi-value">{records.length}</p><p className="erp-kpi-meta">All tax records</p></div>
          <div className="erp-kpi-card erp-kpi-card-success"><p className="erp-kpi-label">Filed</p><p className="erp-kpi-value erp-kpi-value-success">{records.filter(r => r.status === "Filed").length}</p><p className="erp-kpi-meta">Submitted returns</p></div>
          <div className="erp-kpi-card erp-kpi-card-warning"><p className="erp-kpi-label">Pending</p><p className="erp-kpi-value">{records.filter(r => r.status === "Pending").length}</p><p className="erp-kpi-meta">Due filing</p></div>
          <div className="erp-kpi-card erp-kpi-card-info"><p className="erp-kpi-label">Total Tax</p><p className="erp-kpi-value">{records.reduce((s, r) => s + r.taxAmount, 0).toLocaleString()}</p><p className="erp-kpi-meta">Sum of tax liabilities</p></div>
        </div>
      }
      columns={[
        { label: "Tax Type" },
        { label: "Period" },
        { label: "Taxable Amount" },
        { label: "Tax Amount" },
        { label: "Status" },
      ]}
      renderRow={(r) => (
        <tr key={r.id} className="erp-tr">
          <td className="erp-td text-slate-900">{r.taxType}</td>
          <td className="erp-td text-slate-600">{r.period}</td>
          <td className="erp-td text-slate-600">{r.taxableAmount.toLocaleString()}</td>
          <td className="erp-td font-medium text-slate-900">{r.taxAmount.toLocaleString()}</td>
          <td className="erp-td"><span className="erp-chip erp-chip-info">{r.status}</span></td>
        </tr>
      )}
    />
  );
}
