"use client";

import { useState } from "react";
import ModuleTablePage from "@/features/shared/components/ModuleTablePage";
import { CrudHeaderStats } from "@/components/erp/crud-workspace";

type TaxDeclarationRecord = {
  id: string;
  employeeName: string;
  financialYear: string;
  regime: string;
  declaredAmount: number;
  approvedAmount: number;
  status: string;
};

export default function TaxDeclarationsPage() {
  const [records] = useState<TaxDeclarationRecord[]>([]);

  return (
    <ModuleTablePage
      title="Tax Declarations"
      subtitle="Manage employee investment declarations, proof submission, and tax regime selections."
      eyebrow="Payroll / Compliance"
      icon="shield"
      toolbarTitle="Tax declaration register"
      toolbarSubtitle="Review employee investment declarations, approve proofs, and finalize tax computation."
      loading={false}
      rows={records}
      countLabel={(count) => `${count} declarations`}
      emptyMessage="No tax declarations found."
      headerStats={
        <CrudHeaderStats
          items={[
            { label: "Declarations", value: records.length, helper: "total" },
            {
              label: "Approved",
              value: records.filter((record) => record.status === "Approved").length,
              tone: "positive",
            },
            {
              label: "Pending",
              value: records.filter((record) => record.status === "Pending").length,
              tone: "warning",
            },
            {
              label: "New Regime",
              value: records.filter((record) => record.regime === "New").length,
              tone: "info",
            },
          ]}
        />
      }
      columns={[
        { label: "Employee" },
        { label: "FY" },
        { label: "Regime" },
        { label: "Declared" },
        { label: "Approved" },
        { label: "Status" },
      ]}
      renderRow={(r) => (
        <tr key={r.id} className="erp-tr">
          <td className="erp-td text-slate-900">{r.employeeName}</td>
          <td className="erp-td text-slate-600">{r.financialYear}</td>
          <td className="erp-td"><span className="erp-chip erp-chip-neutral">{r.regime}</span></td>
          <td className="erp-td text-slate-600">{r.declaredAmount.toLocaleString()}</td>
          <td className="erp-td text-slate-600">{r.approvedAmount.toLocaleString()}</td>
          <td className="erp-td"><span className="erp-chip erp-chip-info">{r.status}</span></td>
        </tr>
      )}
    />
  );
}
