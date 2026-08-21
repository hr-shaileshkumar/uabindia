"use client";

import React, { useMemo, useState } from "react";
import { Calendar, CheckCircle2, ShieldCheck, MapPin } from "lucide-react";
import { PlatformGlobalPageShell, KpiMetricItem } from "@/components/platform/PlatformGlobalPageShell";
import { getApiErrorMessage } from "@/lib/api-errors";
import { mapHolidayRecord, usePlatformHolidays } from "@/features/platform/hooks/usePlatformHolidays";

export default function HolidayCalendarPage() {
  const currentYear = new Date().getFullYear();
  const { data = [], isLoading, isError, error, refetch } = usePlatformHolidays(currentYear);
  const [search, setSearch] = useState("");

  const holidays = useMemo(() => data.map(mapHolidayRecord), [data]);

  const filteredHolidays = holidays.filter((h) => {
    const q = search.toLowerCase();
    return !q || h.name.toLowerCase().includes(q) || h.type.toLowerCase().includes(q) || h.appliesTo.toLowerCase().includes(q);
  });

  const kpis: KpiMetricItem[] = [
    { label: `Holidays ${currentYear}`, value: holidays.length, tone: "info", icon: <Calendar className="h-3.5 w-3.5" />, subtext: "Live API" },
    { label: "National Holidays", value: holidays.filter((h) => h.type === "National Public Holiday").length, tone: "positive", icon: <CheckCircle2 className="h-3.5 w-3.5" />, subtext: "Mandatory" },
    { label: "State Holidays", value: holidays.filter((h) => h.type === "State Holiday").length, tone: "warning", icon: <MapPin className="h-3.5 w-3.5" />, subtext: "Regional" },
    { label: "Optional", value: holidays.filter((h) => h.type === "Optional Holiday").length, tone: "info", icon: <ShieldCheck className="h-3.5 w-3.5" />, subtext: "Optional" },
  ];

  return (
    <PlatformGlobalPageShell
      title="Holidays"
      icon="calendar"
      kpiMetrics={kpis}
      searchPlaceholder="Filter holiday name, type, or location..."
      searchValue={search}
      onSearchChange={setSearch}
      onRefresh={() => void refetch()}
      isLoading={isLoading}
      listKey="platform-holidays"
      listRows={filteredHolidays}
      listColumns={[
        { key: "name", label: "Holiday" },
        { key: "date", label: "Date" },
        { key: "dayOfWeek", label: "Day" },
        { key: "type", label: "Type" },
        { key: "appliesTo", label: "Locations", className: "text-right" },
      ]}
      getRowId={(row) => row.id}
      emptyMessage={`No holidays configured for ${currentYear}.`}
      renderListRow={(h) => (
        <tr key={h.id} className="erp-tr">
          <td className="erp-td font-semibold">{h.name}</td>
          <td className="erp-td font-mono">{h.date}</td>
          <td className="erp-td">{h.dayOfWeek}</td>
          <td className="erp-td">
            <span className="erp-chip erp-chip-neutral">{h.type}</span>
          </td>
          <td className="erp-td text-right">{h.appliesTo}</td>
        </tr>
      )}
    >
      {isError ? <div className="erp-alert-error text-sm">{getApiErrorMessage(error, "Failed to load holiday calendar.")}</div> : null}
    </PlatformGlobalPageShell>
  );
}
