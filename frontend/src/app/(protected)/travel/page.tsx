"use client";

import React, { useState } from "react";
import { Plane, Plus, Eye, Wallet, CheckCircle2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlatformGlobalPageShell, KpiMetricItem } from "@/components/platform/PlatformGlobalPageShell";
import { notifySuccess } from "@/lib/notifications";

interface TravelRequestRow {
  id: string;
  employeeName: string;
  destination: string;
  purpose: string;
  travelDates: string;
  estimatedExpense: string;
  status: "Approved" | "Pending Approval" | "Reimbursed";
}

const SEED_TRAVEL: TravelRequestRow[] = [
  { id: "tr_1", employeeName: "Rahul Sharma", destination: "Bengaluru, India", purpose: "Client Architecture Onsite", travelDates: "12 Aug - 15 Aug", estimatedExpense: "₹18,500", status: "Approved" },
  { id: "tr_2", employeeName: "Priya Nair", destination: "Delhi NCR", purpose: "Government Tender Negotiation", travelDates: "18 Aug - 20 Aug", estimatedExpense: "₹24,000", status: "Pending Approval" },
  { id: "tr_3", employeeName: "Amit Verma", destination: "Hyderabad", purpose: "Regional Branch Opening", travelDates: "01 Aug - 03 Aug", estimatedExpense: "₹12,200", status: "Reimbursed" },
];

export default function TravelExpensePage() {
  const [travels] = useState<TravelRequestRow[]>(SEED_TRAVEL);
  const [search, setSearch] = useState("");

  const filteredTravels = travels.filter((t) => {
    const q = search.toLowerCase();
    return !q || t.employeeName.toLowerCase().includes(q) || t.destination.toLowerCase().includes(q) || t.purpose.toLowerCase().includes(q);
  });

  const kpis: KpiMetricItem[] = [
    { label: "Active Tour Plans", value: travels.length, tone: "info", icon: <Plane className="h-3.5 w-3.5" />, subtext: "Corporate Travel" },
    { label: "Total Approved Expense", value: "₹54,700", tone: "positive", icon: <Wallet className="h-3.5 w-3.5" />, subtext: "Reimbursements" },
    { label: "Destinations Covered", value: new Set(travels.map((t) => t.destination)).size, tone: "warning", icon: <MapPin className="h-3.5 w-3.5" />, subtext: "Cities" },
    { label: "Mileage Policy", value: "Standard Rate", tone: "positive", icon: <CheckCircle2 className="h-3.5 w-3.5" />, subtext: "Automated" },
  ];

  return (
    <PlatformGlobalPageShell
      title="Corporate Travel, Tour Plans & Expense Claims"
      subtitle="Manage employee tour itineraries, flight/hotel booking approvals, mileage rates, and reimbursement claims."
      categoryTag="Layer 2: Corporate Travel & Expenses"
      kpiMetrics={kpis}
      searchPlaceholder="Filter employee name, destination, or purpose..."
      searchValue={search}
      onSearchChange={setSearch}
      primaryActionLabel="New Tour Plan"
      onPrimaryAction={() => notifySuccess("Tour plan wizard opened.")}
      primaryActionIcon={<Plus className="h-4 w-4 mr-1.5" />}
    >
      <div className="erp-table-wrap rounded-none border-0 shadow-none">
        <table className="erp-table">
          <thead className="erp-thead">
            <tr>
              <th className="erp-th">Employee Name</th>
              <th className="erp-th">Destination City</th>
              <th className="erp-th">Official Purpose</th>
              <th className="erp-th">Travel Dates</th>
              <th className="erp-th">Estimated Expense</th>
              <th className="erp-th text-right">Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredTravels.map((t) => (
              <tr key={t.id} className="erp-tr hover:bg-slate-50/80 dark:hover:bg-slate-900/50 transition-colors">
                <td className="erp-td font-semibold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <Plane className="h-4 w-4 text-indigo-500" />
                  {t.employeeName}
                </td>
                <td className="erp-td font-semibold text-xs text-slate-800 dark:text-slate-200">{t.destination}</td>
                <td className="erp-td text-xs text-slate-600 dark:text-slate-400">{t.purpose}</td>
                <td className="erp-td font-mono text-xs text-slate-500">{t.travelDates}</td>
                <td className="erp-td font-mono text-xs text-emerald-600 dark:text-emerald-400 font-bold">{t.estimatedExpense}</td>
                <td className="erp-td text-right">
                  <span className={t.status === "Approved" || t.status === "Reimbursed" ? "erp-chip erp-chip-success" : "erp-chip erp-chip-warning"}>
                    {t.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PlatformGlobalPageShell>
  );
}
