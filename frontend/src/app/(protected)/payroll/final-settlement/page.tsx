"use client";

import { useState } from "react";
import ModuleTablePage from "@/features/shared/components/ModuleTablePage";
import { CrudHeaderStats } from "@/components/erp/crud-workspace";

type FinalSettlementRecord = {
  id: string;
  employeeName: string;
  exitDate: string;
  gratuity: number;
  leaveEncashment: number;
  totalSettlement: number;
  status: string;
};

export default function FinalSettlementPage() {
  const [records] = useState<FinalSettlementRecord[]>([]);

  return (
    <ModuleTablePage
      title="Final Settlement"
      subtitle="Process full-and-final settlements for exiting employees including gratuity and leave encashment."
      eyebrow="Payroll / Compliance"
      icon="file"
      toolbarTitle="F&F settlement register"
      toolbarSubtitle="Review and process full-and-final settlement breakdowns for separated employees."
      loading={false}
      rows={records}
      countLabel={(count) => `${count} settlement records`}
      emptyMessage="No final settlement records found."
      headerStats={
        <CrudHeaderStats
          items={[
            { label: "Settlements", value: records.length, helper: "total" },
            {
              label: "Settled",
              value: records.filter((record) => record.status === "Settled").length,
              tone: "positive",
            },
            {
              label: "Pending",
              value: records.filter((record) => record.status === "Pending").length,
              tone: "warning",
            },
            {
              label: "Paid Out",
              value: records.reduce((total, record) => total + record.totalSettlement, 0).toLocaleString(),
              helper: "f&f",
              tone: "info",
            },
          ]}
        />
      }
      columns={[
        { label: "Employee" },
        { label: "Exit Date" },
        { label: "Gratuity" },
        { label: "Leave Encashment" },
        { label: "Total" },
        { label: "Status" },
      ]}
      renderRow={(r) => (
        <tr key={r.id} className="erp-tr">
          <td className="erp-td text-slate-900">{r.employeeName}</td>
          <td className="erp-td text-slate-600">{r.exitDate}</td>
          <td className="erp-td text-slate-600">{r.gratuity.toLocaleString()}</td>
          <td className="erp-td text-slate-600">{r.leaveEncashment.toLocaleString()}</td>
          <td className="erp-td font-medium text-slate-900">{r.totalSettlement.toLocaleString()}</td>
          <td className="erp-td"><span className="erp-chip erp-chip-info">{r.status}</span></td>
        </tr>
      )}
    />
  );
}
