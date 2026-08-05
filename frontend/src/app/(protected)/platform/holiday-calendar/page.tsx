"use client";

import React, { useState } from "react";
import { Calendar, Plus, Eye, CheckCircle2, ShieldCheck, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlatformGlobalPageShell, KpiMetricItem } from "@/components/platform/PlatformGlobalPageShell";
import { notifySuccess } from "@/lib/notifications";

interface HolidayRow {
  id: string;
  name: string;
  date: string;
  dayOfWeek: string;
  type: "National Public Holiday" | "State Holiday" | "Optional Holiday";
  appliesTo: string;
}

const SEED_HOLIDAYS: HolidayRow[] = [
  { id: "hol_1", name: "Independence Day", date: "2026-08-15", dayOfWeek: "Saturday", type: "National Public Holiday", appliesTo: "All Branches & Locations" },
  { id: "hol_2", name: "Ganesh Chaturthi", date: "2026-09-14", dayOfWeek: "Monday", type: "State Holiday", appliesTo: "Maharashtra Branches" },
  { id: "hol_3", name: "Mahatma Gandhi Jayanti", date: "2026-10-02", dayOfWeek: "Friday", type: "National Public Holiday", appliesTo: "All Branches & Locations" },
  { id: "hol_4", name: "Diwali Laxmi Pujan", date: "2026-11-08", dayOfWeek: "Sunday", type: "National Public Holiday", appliesTo: "All Branches & Locations" },
];

export default function HolidayCalendarPage() {
  const [holidays] = useState<HolidayRow[]>(SEED_HOLIDAYS);
  const [search, setSearch] = useState("");

  const filteredHolidays = holidays.filter((h) => {
    const q = search.toLowerCase();
    return !q || h.name.toLowerCase().includes(q) || h.type.toLowerCase().includes(q) || h.appliesTo.toLowerCase().includes(q);
  });

  const kpis: KpiMetricItem[] = [
    { label: "Public Holidays 2026", value: holidays.length, tone: "info", icon: <Calendar className="h-3.5 w-3.5" />, subtext: "Annual List" },
    { label: "National Holidays", value: holidays.filter((h) => h.type === "National Public Holiday").length, tone: "positive", icon: <CheckCircle2 className="h-3.5 w-3.5" />, subtext: "Mandatory" },
    { label: "State Holidays", value: holidays.filter((h) => h.type === "State Holiday").length, tone: "warning", icon: <MapPin className="h-3.5 w-3.5" />, subtext: "State Specific" },
    { label: "Weekend Rule", value: "5-Day Work Week", tone: "positive", icon: <ShieldCheck className="h-3.5 w-3.5" />, subtext: "Sat & Sun Off" },
  ];

  return (
    <PlatformGlobalPageShell
      title="Holiday Calendars & Working Day Rules"
      subtitle="Configure branch-specific annual holiday calendars, state public holidays, optional leaves, and weekend shift rules."
      categoryTag="Organization Architecture"
      kpiMetrics={kpis}
      searchPlaceholder="Filter holiday name, type, or location..."
      searchValue={search}
      onSearchChange={setSearch}
      primaryActionLabel="Add Public Holiday"
      onPrimaryAction={() => notifySuccess("Holiday modal opened.")}
      primaryActionIcon={<Plus className="h-4 w-4 mr-1.5" />}
    >
      <div className="erp-table-wrap rounded-none border-0 shadow-none">
        <table className="erp-table">
          <thead className="erp-thead">
            <tr>
              <th className="erp-th">Holiday Title</th>
              <th className="erp-th">Date</th>
              <th className="erp-th">Day of Week</th>
              <th className="erp-th">Holiday Type</th>
              <th className="erp-th text-right">Applicable Locations</th>
            </tr>
          </thead>
          <tbody>
            {filteredHolidays.map((h) => (
              <tr key={h.id} className="erp-tr hover:bg-slate-50/80 dark:hover:bg-slate-900/50 transition-colors">
                <td className="erp-td font-semibold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-indigo-500" />
                  {h.name}
                </td>
                <td className="erp-td font-mono font-bold text-xs text-indigo-600 dark:text-indigo-400">{h.date}</td>
                <td className="erp-td text-xs text-slate-700 dark:text-slate-300">{h.dayOfWeek}</td>
                <td className="erp-td">
                  <Badge variant="outline" className="text-xs font-normal">
                    {h.type}
                  </Badge>
                </td>
                <td className="erp-td text-right font-semibold text-xs text-slate-700 dark:text-slate-300">{h.appliesTo}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PlatformGlobalPageShell>
  );
}
