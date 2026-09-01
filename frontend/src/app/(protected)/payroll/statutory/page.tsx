"use client";

import { useCallback, useEffect, useState } from "react";
import ModuleTablePage from "@/features/shared/components/ModuleTablePage";
import { CrudHeaderStats } from "@/components/workspace/crud-workspace";
import { SideDrawer } from "@/components/ui/side-drawer";
import { erpButtonClassName, erpFormInputClassName } from "@/components/workspace/styles";
import { payrollApi } from "@/services/modules";
import { getApiErrorMessage } from "@/lib/api-errors";

type StatutoryRecord = Record<string, unknown>;

type StatutoryRow = {
  id: string;
  type: string;
  period: string;
  status: string;
  total: number;
  records: StatutoryRecord[];
};

const currentMonthValue = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

const monthToIso = (value: string) => `${value}-01T00:00:00.000Z`;

const asNumber = (value: unknown) => (typeof value === "number" ? value : Number(value) || 0);

const asText = (value: unknown) => {
  if (value == null || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
};

export default function PayrollStatutoryPage() {
  const [month, setMonth] = useState(currentMonthValue);
  const [statutory, setStatutory] = useState<StatutoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openRow, setOpenRow] = useState<StatutoryRow | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const iso = monthToIso(month);
      const [pfRes, esiRes, ptRes, tdsRes] = await Promise.all([
        payrollApi.statutory.pf(iso),
        payrollApi.statutory.esi(iso),
        payrollApi.statutory.pt(iso),
        payrollApi.statutory.tds(iso),
      ]);

      const normalize = (type: string, data: Record<string, unknown>, totalKey: string): StatutoryRow => {
        const monthValue = data?.month;
        const period =
          typeof monthValue === "string" || typeof monthValue === "number"
            ? new Date(monthValue).toLocaleDateString("en-IN", { month: "short", year: "numeric" })
            : month;
        const records = Array.isArray(data?.records) ? (data.records as StatutoryRecord[]) : [];
        return {
          id: type,
          type,
          period,
          status: records.length ? "Generated" : "Pending",
          total: asNumber(data?.[totalKey]),
          records,
        };
      };

      setStatutory([
        normalize("PF", pfRes.data as Record<string, unknown>, "totalPF"),
        normalize("ESI", esiRes.data as Record<string, unknown>, "totalESI"),
        normalize("PT", ptRes.data as Record<string, unknown>, "totalPT"),
        normalize("TDS", tdsRes.data as Record<string, unknown>, "totalTDS"),
      ]);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Failed to load statutory records"));
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    void load();
  }, [load]);

  const drillColumns = openRow
    ? Object.keys(openRow.records[0] || {}).filter((key) => key !== "id" && key !== "employeeId")
    : [];

  return (
    <>
      <ModuleTablePage
        title="Statutory Compliance"
        subtitle="PF, ESI, PT, and other statutory filings."
        eyebrow="Payroll / Compliance"
        icon="shield"
        toolbarTitle="Compliance register"
        toolbarSubtitle="Track monthly statutory totals, then open a bucket to review employee-level contributions."
        loading={loading}
        error={error}
        onRetry={load}
        rows={statutory}
        countLabel={(count) => `${count} statutory buckets`}
        emptyMessage="No statutory records found."
        filters={
          <div className="flex flex-wrap items-end gap-2">
            <input
              type="month"
              className={erpFormInputClassName}
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              aria-label="Statutory month"
            />
            <button
              type="button"
              className={`${erpButtonClassName.secondary} h-9 text-xs`}
              onClick={async () => {
                try {
                  const iso = monthToIso(month);
                  const res = await payrollApi.statutory.pfEcr(iso);
                  const blob = new Blob([res.data], { type: "text/csv" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `pf-ecr-${month}.csv`;
                  a.click();
                  URL.revokeObjectURL(url);
                } catch {
                  setError("Failed to download PF ECR");
                }
              }}
            >
              PF ECR
            </button>
            <button
              type="button"
              className={`${erpButtonClassName.secondary} h-9 text-xs`}
              onClick={async () => {
                try {
                  const iso = monthToIso(month);
                  const res = await payrollApi.statutory.esiChallan(iso);
                  const blob = new Blob([res.data], { type: "text/csv" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `esi-challan-${month}.csv`;
                  a.click();
                  URL.revokeObjectURL(url);
                } catch {
                  setError("Failed to download ESI challan");
                }
              }}
            >
              ESI challan
            </button>
            <button
              type="button"
              className={`${erpButtonClassName.secondary} h-9 text-xs`}
              onClick={async () => {
                try {
                  const fy = Number(month.slice(0, 4));
                  const res = await payrollApi.statutory.form24q(Number(month.slice(5, 7)) >= 4 ? fy : fy - 1);
                  const blob = new Blob([res.data], { type: "text/csv" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `form24q-${month}.csv`;
                  a.click();
                  URL.revokeObjectURL(url);
                } catch {
                  setError("Failed to download Form 24Q");
                }
              }}
            >
              Form 24Q
            </button>
          </div>
        }
        headerStats={
          <CrudHeaderStats
            items={[
              { label: "Filings", value: statutory.length, helper: "statutory" },
              {
                label: "Generated",
                value: statutory.filter((record) => (record.status || "").toLowerCase() === "generated").length,
                tone: "positive",
              },
              {
                label: "Pending",
                value: statutory.filter((record) => (record.status || "").toLowerCase() === "pending").length,
                tone: "warning",
              },
              {
                label: "Amount",
                value: statutory.reduce((total, record) => total + (record.total || 0), 0).toLocaleString("en-IN"),
                helper: "sum",
                tone: "info",
              },
            ]}
          />
        }
        columns={[{ label: "Type" }, { label: "Period" }, { label: "Employees" }, { label: "Total" }, { label: "Status" }, { label: "Actions", className: "text-right" }]}
        renderRow={(item) => (
          <tr key={item.id} className="erp-tr">
            <td className="erp-td text-slate-900">{item.type}</td>
            <td className="erp-td text-slate-600">{item.period || "-"}</td>
            <td className="erp-td text-slate-600">{item.records.length}</td>
            <td className="erp-td text-slate-900 font-medium">₹ {item.total.toLocaleString("en-IN")}</td>
            <td className="erp-td">
              <span className={item.status === "Generated" ? "erp-chip erp-chip-success" : "erp-chip erp-chip-warning"}>
                {item.status}
              </span>
            </td>
            <td className="erp-td text-right">
              <button type="button" className={`${erpButtonClassName.ghost} h-8 px-2`} onClick={() => setOpenRow(item)}>
                View
              </button>
            </td>
          </tr>
        )}
      />
      <SideDrawer
        open={Boolean(openRow)}
        onClose={() => setOpenRow(null)}
        title={openRow ? `${openRow.type} · ${openRow.period}` : "Statutory detail"}
        subtitle={openRow ? `${openRow.records.length} employee record(s)` : undefined}
        width="lg"
      >
        {!openRow || openRow.records.length === 0 ? (
          <p className="text-sm text-slate-500">No employee-level records for this period yet. Complete a payroll run to generate them.</p>
        ) : (
          <div className="erp-table-wrap">
            <table className="erp-table">
              <thead className="erp-thead">
                <tr>
                  {drillColumns.map((col) => (
                    <th key={col} className="erp-th">
                      {col.replace(/([A-Z])/g, " $1").trim()}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {openRow.records.map((record, index) => (
                  <tr key={String(record.id ?? index)} className="erp-tr">
                    {drillColumns.map((col) => (
                      <td key={col} className="erp-td text-slate-600 text-xs">
                        {asText(record[col])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SideDrawer>
    </>
  );
}
