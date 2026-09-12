import { useMemo } from "react";
import { AlertCircle, CheckCircle2, Landmark, Scale } from "lucide-react";
import type { KpiMetricItem } from "@/components/administration/AdministrationGlobalPageShell";
import { formatCurrency } from "@/lib/formatters";
import type { ReconciliationRow } from "../types/reconciliation.types";

export function useReconciliationKpis(records: ReconciliationRow[]): KpiMetricItem[] {
  return useMemo((): KpiMetricItem[] => {
    const totalCount = records.length;
    const matchedCount = records.filter(
      (r) => r.status === "Matched" || Math.abs(r.difference || 0) < 0.01
    ).length;
    const discrepancyCount = records.filter(
      (r) => r.status === "Unmatched" || Math.abs(r.difference || 0) >= 0.01
    ).length;
    const netVarianceExposure = records.reduce((sum, r) => sum + Math.abs(r.difference || 0), 0);

    return [
      {
        label: "Total Statements",
        value: totalCount.toLocaleString(),
        subtext: "treasury accounts tracked",
        icon: <Landmark className="w-5 h-5" />,
        tone: "neutral",
      },
      {
        label: "Matched Zero-Delta",
        value: matchedCount.toLocaleString(),
        subtext: `${totalCount > 0 ? Math.round((matchedCount / totalCount) * 100) : 0}% accuracy`,
        icon: <CheckCircle2 className="w-5 h-5" />,
        tone: "positive",
      },
      {
        label: "Variance Discrepancies",
        value: discrepancyCount.toLocaleString(),
        subtext: "require audit investigations",
        icon: <AlertCircle className="w-5 h-5" />,
        tone: discrepancyCount > 0 ? "negative" : "positive",
      },
      {
        label: "Net Variance Exposure",
        value: formatCurrency(netVarianceExposure, "INR"),
        subtext: "absolute ledger deviations",
        icon: <Scale className="w-5 h-5" />,
        tone: netVarianceExposure > 0 ? "warning" : "positive",
      },
    ];
  }, [records]);
}
