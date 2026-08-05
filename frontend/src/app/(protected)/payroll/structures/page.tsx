"use client";

import { useEffect, useState } from "react";
import ModuleTablePage from "@/features/shared/components/ModuleTablePage";
import { CrudHeaderStats } from "@/components/erp/crud-workspace";
import { hrApi } from "@/services/hrApi";

type PayrollStructure = {
  id: string;
  name?: string;
  status?: string;
  createdAt?: string;
};

export default function PayrollStructuresPage() {
  const [structures, setStructures] = useState<PayrollStructure[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recentCutoff] = useState(() => Date.now() - 30 * 86400000);

  useEffect(() => {
    const fetchStructures = async () => {
      try {
        setLoading(true);
        const res = await hrApi.payroll.structures.list();
        setStructures(Array.isArray(res.data) ? res.data : []);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load structures");
      } finally {
        setLoading(false);
      }
    };

    void fetchStructures();
  }, []);

  return (
    <ModuleTablePage
      title="Payroll Structures"
      subtitle="Manage salary structures and components."
      eyebrow="Payroll / Master Setup"
      icon="settings"
      toolbarTitle="Structure registry"
      toolbarSubtitle="Maintain salary structures, status, and creation history from a standardized payroll catalog view."
      loading={loading}
      error={error}
      rows={structures}
      countLabel={(count) => `${count} structures`}
      emptyMessage="No structures found."
      headerStats={
        <CrudHeaderStats
          items={[
            { label: "Structures", value: structures.length, helper: "total" },
            {
              label: "Active",
              value: structures.filter((structure) => !structure.status || (structure.status || "").toLowerCase() === "active").length,
              tone: "positive",
            },
            {
              label: "Inactive",
              value: structures.filter((structure) => (structure.status || "").toLowerCase() === "inactive").length,
              tone: "warning",
            },
            {
              label: "Recent",
              value: structures.filter((structure) => {
                const createdAt = structure.createdAt ? new Date(structure.createdAt) : null;
                return createdAt !== null && createdAt.getTime() >= recentCutoff;
              }).length,
              helper: "30 days",
              tone: "info",
            },
          ]}
        />
      }
      columns={[
        { label: "Name" },
        { label: "Status" },
        { label: "Created" },
      ]}
      renderRow={(structure) => (
        <tr key={structure.id} className="erp-tr">
          <td className="erp-td text-slate-900">{structure.name || "Structure"}</td>
          <td className="erp-td text-slate-600">{structure.status || "Active"}</td>
          <td className="erp-td text-slate-600">{structure.createdAt ? new Date(structure.createdAt).toLocaleDateString() : "-"}</td>
        </tr>
      )}
    />
  );
}
