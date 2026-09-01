"use client";

import React, { useMemo, useState } from "react";
import { PlatformGlobalPageShell } from "@/components/platform/PlatformGlobalPageShell";
import { ErpDrawerFooter } from "@/components/workspace/page-kit";
import { getApiErrorMessage } from "@/lib/api-errors";
import { notifyError, notifySuccess } from "@/lib/notifications";
import {
  mapHolidayRecord,
  useHolidayMutations,
  usePlatformHolidays,
} from "@/features/platform/hooks/usePlatformHolidays";

export default function HolidayCalendarPage() {
  const currentYear = new Date().getFullYear();
  const { data = [], isLoading, isError, error, refetch } = usePlatformHolidays(currentYear);
  const { createHoliday } = useHolidayMutations();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    date: `${currentYear}-01-01`,
    type: "National",
    isOptional: false,
    description: "",
  });

  const holidays = useMemo(() => data.map(mapHolidayRecord), [data]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return holidays.filter((h) => {
      const matchesSearch =
        !q || h.name.toLowerCase().includes(q) || h.type.toLowerCase().includes(q) || h.appliesTo.toLowerCase().includes(q);
      const matchesType = typeFilter === "all" || h.type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [holidays, search, typeFilter]);

  const save = async () => {
    if (!form.name.trim() || !form.date) {
      notifyError("Holiday name and date are required.");
      return;
    }
    try {
      await createHoliday.mutateAsync({
        name: form.name.trim(),
        date: form.date,
        type: form.type,
        isOptional: form.isOptional,
        description: form.description.trim() || undefined,
      });
      notifySuccess("Holiday created.");
      setDrawerOpen(false);
      setForm({
        name: "",
        date: `${currentYear}-01-01`,
        type: "National",
        isOptional: false,
        description: "",
      });
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to create holiday."));
    }
  };

  return (
    <PlatformGlobalPageShell
      title="Holiday calendar"
      categoryTag="Platform"
      icon="calendar"
      kpiMetrics={[
        { label: `Year ${currentYear}`, value: holidays.length, tone: "info" },
        { label: "National", value: holidays.filter((h) => h.type === "National Public Holiday").length, tone: "positive" },
        { label: "Optional", value: holidays.filter((h) => h.type === "Optional Holiday").length, tone: "warning" },
      ]}
      searchValue={search}
      onSearchChange={setSearch}
      searchPlaceholder="Filter holiday name or type…"
      filterOptions={[
        {
          key: "type",
          label: "Type",
          value: typeFilter,
          onChange: setTypeFilter,
          options: [
            { label: "All types", value: "all" },
            { label: "National Public Holiday", value: "National Public Holiday" },
            { label: "State Holiday", value: "State Holiday" },
            { label: "Optional Holiday", value: "Optional Holiday" },
          ],
        },
      ]}
      primaryActionLabel="New holiday"
      onPrimaryAction={() => setDrawerOpen(true)}
      onRefresh={() => void refetch()}
      isLoading={isLoading}
      listKey="platform-holidays"
      listRows={filtered}
      getRowId={(row) => row.id}
      emptyMessage={`No holidays for ${currentYear}. Add national and optional holidays.`}
      listColumns={[
        { key: "name", label: "Holiday", dataType: "string" },
        { key: "date", label: "Date", dataType: "date" },
        { key: "dayOfWeek", label: "Day", dataType: "string" },
        { key: "type", label: "Type", dataType: "string" },
        { key: "appliesTo", label: "Applies to", dataType: "string" },
      ]}
      renderListRow={(h) => (
        <>
          <td className="erp-td font-semibold text-xs">{h.name}</td>
          <td className="erp-td font-mono text-xs">{h.date}</td>
          <td className="erp-td text-xs">{h.dayOfWeek}</td>
          <td className="erp-td">
            <span className="erp-chip erp-chip-neutral">{h.type}</span>
          </td>
          <td className="erp-td text-xs text-slate-500">{h.appliesTo}</td>
        </>
      )}
      isInspectorOpen={drawerOpen}
      onInspectorClose={() => setDrawerOpen(false)}
      inspectorTitle="New holiday"
      inspectorContent={
        <div className="erp-form-grid">
          {isError ? (
            <p className="md:col-span-2 text-xs text-rose-600">{getApiErrorMessage(error, "Failed to load holidays.")}</p>
          ) : null}
          <div className="erp-field md:col-span-2">
            <label className="erp-label">Name *</label>
            <input className="erp-input" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </div>
          <div className="erp-field">
            <label className="erp-label">Date *</label>
            <input className="erp-input" type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
          </div>
          <div className="erp-field">
            <label className="erp-label">Type</label>
            <select className="erp-input" value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
              <option value="National">National</option>
              <option value="State">State</option>
              <option value="Optional">Optional</option>
            </select>
          </div>
          <div className="erp-field md:col-span-2">
            <label className="erp-label">Applies to / notes</label>
            <input className="erp-input" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </div>
          <label className="erp-field flex items-center gap-2 text-xs md:col-span-2">
            <input type="checkbox" checked={form.isOptional} onChange={(e) => setForm((f) => ({ ...f, isOptional: e.target.checked }))} />
            Optional holiday
          </label>
          <div className="md:col-span-2">
            <ErpDrawerFooter onCancel={() => setDrawerOpen(false)} onSave={() => void save()} saving={createHoliday.isPending} saveLabel="Create holiday" />
          </div>
        </div>
      }
    />
  );
}
