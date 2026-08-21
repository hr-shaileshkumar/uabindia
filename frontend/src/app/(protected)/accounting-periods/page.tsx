"use client";

import { useCallback, useEffect, useState } from "react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { CrudHeaderStats } from "@/components/erp/crud-workspace";
import { ErpRefreshButton } from "@/components/erp/erp-page-kit";
import { financeApi } from "@/services/modules";
import { notifyError, notifySuccess } from "@/lib/notifications";
import { getApiErrorMessage } from "@/lib/api-errors";

const MONTHS = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];

function fiscalMonth(index: number): number {
  return ((index + 3) % 12) + 1;
}

type PeriodRow = {
  year: number;
  month: number;
  status?: string;
  closedAt?: string;
  notes?: string;
};

export default function AccountingPeriodsPage() {
  const now = new Date();
  const defaultYear = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  const [year, setYear] = useState(defaultYear);
  const [periods, setPeriods] = useState<PeriodRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (selectedYear: number) => {
    try {
      setLoading(true);
      setError(null);
      const [current, next] = await Promise.all([
        financeApi.periods.list(selectedYear),
        financeApi.periods.list(selectedYear + 1),
      ]);
      const rows = [
        ...(((current.data?.periods as PeriodRow[]) || [])),
        ...(((next.data?.periods as PeriodRow[]) || [])),
      ];
      setPeriods(rows);
    } catch (err) {
      const message = getApiErrorMessage(err, "Failed to load accounting periods.");
      setError(message);
      notifyError(message, "Periods");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(year);
  }, [load, year]);

  const statusFor = (month: number, periodYear: number) => {
    const row = periods.find((period) => period.year === periodYear && period.month === month);
    return row?.status === "Closed" ? "Closed" : "Open";
  };

  const toggle = async (month: number, periodYear: number, close: boolean) => {
    const key = `${periodYear}-${month}`;
    try {
      setBusyKey(key);
      if (close) {
        await financeApi.periods.close({ year: periodYear, month });
        notifySuccess(`${periodYear}-${String(month).padStart(2, "0")} closed.`, "Periods");
      } else {
        await financeApi.periods.reopen({ year: periodYear, month });
        notifySuccess(`${periodYear}-${String(month).padStart(2, "0")} reopened.`, "Periods");
      }
      await load(year);
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Period update failed."), "Periods");
    } finally {
      setBusyKey(null);
    }
  };

  const closedCount = MONTHS.filter((_, index) => {
    const month = fiscalMonth(index);
    const periodYear = month >= 4 ? year : year + 1;
    return statusFor(month, periodYear) === "Closed";
  }).length;

  return (
    <StandardPageLayout
      title="Accounting periods"
      subtitle="Close or reopen monthly books. Ledger posting rejects entries in a closed period."
      eyebrow="Finance / Period control"
      icon="calendar"
      meta={
        <CrudHeaderStats
          items={[
            { label: "FY", value: `${year}-${String(year + 1).slice(-2)}`, helper: "India" },
            { label: "Closed", value: closedCount, tone: closedCount === 12 ? "positive" : "warning" },
            { label: "Open", value: 12 - closedCount, tone: "info" },
          ]}
        />
      }
      actions={
        <>
          <select className="erp-select" value={year} onChange={(e) => setYear(Number(e.target.value))}>
            {Array.from({ length: 6 }, (_, index) => defaultYear - 2 + index).map((value) => (
              <option key={value} value={value}>
                FY {value}-{String(value + 1).slice(-2)}
              </option>
            ))}
          </select>
          <ErpRefreshButton onClick={() => void load(year)} loading={loading} />
        </>
      }
    >
      {error ? <div className="erp-alert-error">{error}</div> : null}

      <div className="erp-panel">
        <div className="erp-panel-header">
          <div>
            <h2 className="erp-panel-title">Monthly close</h2>
            <p className="mt-1 text-sm text-slate-500">April to March. Closed months cannot receive new journals.</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="erp-table">
            <thead className="erp-thead">
              <tr>
                <th className="erp-th">Month</th>
                <th className="erp-th">Calendar</th>
                <th className="erp-th">Status</th>
                <th className="erp-th text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {MONTHS.map((label, index) => {
                const month = fiscalMonth(index);
                const periodYear = month >= 4 ? year : year + 1;
                const status = statusFor(month, periodYear);
                const key = `${periodYear}-${month}`;
                const closed = status === "Closed";
                return (
                  <tr key={key} className="erp-tr">
                    <td className="erp-td font-semibold">{label}</td>
                    <td className="erp-td">{periodYear}-{String(month).padStart(2, "0")}</td>
                    <td className="erp-td">
                      <span className={closed ? "erp-chip erp-chip-neutral" : "erp-chip erp-chip-success"}>{status}</span>
                    </td>
                    <td className="erp-td text-right">
                      <button
                        type="button"
                        className={closed ? "erp-action-btn erp-action-btn-secondary text-xs" : "erp-action-btn erp-action-btn-primary text-xs"}
                        disabled={busyKey === key}
                        onClick={() => void toggle(month, periodYear, !closed)}
                      >
                        {busyKey === key ? "Saving…" : closed ? "Reopen" : "Close"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </StandardPageLayout>
  );
}
