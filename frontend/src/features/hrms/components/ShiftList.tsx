"use client";

import { useMemo, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { CrudCard, CrudHeaderStats } from "@/components/workspace/crud-workspace";
import { ErpCreateButton, ErpDrawerFooter, ErpRefreshButton, ErpRowActions } from "@/components/workspace/page-kit";
import { useErpListView } from "@/components/workspace/list-view";
import { StatusBadge } from "@/components/workspace/status-badge";
import {
  erpFormInputClassName,
  erpFormLabelClassName,
  erpTableRowHoverClassName,
  erpTableTdClassName,
} from "@/components/workspace/styles";
import { SideDrawer } from "@/components/ui/side-drawer";
import { getApiErrorMessage } from "@/lib/api-errors";
import apiClient from "@/services/apiClient";

export interface ShiftItem {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  breakDuration: number;
  isNightShift: boolean;
  isActive: boolean;
  shiftType?: string;
  statusLabel?: string;
}

type ShiftRecord = {
  id: string;
  name?: string;
  shiftName?: string;
  startTime?: string;
  endTime?: string;
  breakDurationMinutes?: number;
  breakDuration?: number;
  isNightShift?: boolean;
  isActive?: boolean;
};

const parseShifts = (raw: unknown): ShiftRecord[] => {
  if (Array.isArray(raw)) return raw as ShiftRecord[];
  if (raw && typeof raw === "object") {
    const obj = raw as { shifts?: ShiftRecord[]; data?: ShiftRecord[] };
    return obj.shifts ?? obj.data ?? [];
  }
  return [];
};

const mapShift = (record: ShiftRecord): ShiftItem => ({
  id: record.id,
  name: record.name ?? record.shiftName ?? "Shift",
  startTime: record.startTime ?? "—",
  endTime: record.endTime ?? "—",
  breakDuration: record.breakDurationMinutes ?? record.breakDuration ?? 0,
  isNightShift: Boolean(record.isNightShift),
  isActive: record.isActive ?? true,
  shiftType: record.isNightShift ? "Night" : "Day",
  statusLabel: record.isActive ?? true ? "Active" : "Inactive",
});

export function ShiftList() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<ShiftItem | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    startTime: "09:00",
    endTime: "18:00",
    breakDuration: 60,
    isNightShift: false,
  });

  const { data: raw, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["hrms", "shifts"],
    queryFn: async () => {
      const { data } = await apiClient.get("/shifts/shifts");
      return data;
    },
    staleTime: 30_000,
  });

  const shifts = useMemo(() => parseShifts(raw).map(mapShift), [raw]);
  const activeCount = shifts.filter((s) => s.isActive).length;

  const handleOpenDrawer = (shift?: ShiftItem) => {
    if (shift) {
      setEditingShift(shift);
      setFormData({
        name: shift.name,
        startTime: shift.startTime,
        endTime: shift.endTime,
        breakDuration: shift.breakDuration,
        isNightShift: shift.isNightShift,
      });
    } else {
      setEditingShift(null);
      setFormData({ name: "", startTime: "09:00", endTime: "18:00", breakDuration: 60, isNightShift: false });
    }
    setDrawerOpen(true);
  };

  const list = useErpListView({
    listKey: "hrms-shifts",
    rows: shifts,
    columns: [
      { key: "name", label: "Shift" },
      { key: "startTime", label: "Start" },
      { key: "endTime", label: "End" },
      { key: "breakDuration", label: "Break (mins)" },
      { key: "shiftType", label: "Type" },
      { key: "statusLabel", label: "Status" },
      { key: "actions", label: "Actions", className: "text-right", locked: true },
    ],
    getRowId: (shift) => shift.id,
    loading: isLoading,
    emptyMessage: "Work shifts will appear here once defined through the shifts API.",
    onCreate: () => handleOpenDrawer(),
    createLabel: "Add Shift",
    onRefresh: () => void refetch(),
    renderRow: (shift) => (
      <tr key={shift.id} className={erpTableRowHoverClassName}>
        <td className={`${erpTableTdClassName} font-semibold text-slate-900`}>
          <div className="flex items-center gap-2">
            {shift.isNightShift ? (
              <Moon className="h-4 w-4 shrink-0 text-slate-500" />
            ) : (
              <Sun className="h-4 w-4 shrink-0 text-amber-500" />
            )}
            {shift.name}
          </div>
        </td>
        <td className={erpTableTdClassName}>{shift.startTime}</td>
        <td className={erpTableTdClassName}>{shift.endTime}</td>
        <td className={erpTableTdClassName}>{shift.breakDuration}</td>
        <td className={erpTableTdClassName}>
          <StatusBadge tone={shift.isNightShift ? "info" : "neutral"}>{shift.shiftType}</StatusBadge>
        </td>
        <td className={erpTableTdClassName}>
          <StatusBadge tone={shift.isActive ? "positive" : "neutral"}>{shift.statusLabel}</StatusBadge>
        </td>
        <td className={`${erpTableTdClassName} text-right`}>
          <ErpRowActions
            onEdit={{ label: "Edit shift", onClick: () => handleOpenDrawer(shift), disabled: true }}
          />
        </td>
      </tr>
    ),
  });

  return (
    <StandardPageLayout
      title="Shift & Roster Management"
      subtitle="Configure work shifts, timings, break durations, and night rosters."
      eyebrow="HRMS / Shifts"
      icon="clock"
      meta={
        <CrudHeaderStats
          items={[
            { label: "Shifts", value: shifts.length, helper: "configured" },
            { label: "Active", value: activeCount, tone: "positive" },
            { label: "Night", value: shifts.filter((s) => s.isNightShift).length, tone: "info" },
          ]}
        />
      }
      actions={
        <>
          <ErpRefreshButton onClick={() => void refetch()} loading={isLoading || isFetching} />
          {list.headerTools}
          <ErpCreateButton label="Add Shift" onClick={() => handleOpenDrawer()} disabled />
        </>
      }
      filters={list.filterBar}
    >
      {isError ? (
        <div className="erp-alert-error text-sm">{getApiErrorMessage(error, "Failed to load shifts.")}</div>
      ) : null}

      <CrudCard>{list.table}</CrudCard>

      <SideDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={editingShift ? "Edit Shift" : "Create Shift"}
        subtitle="Shift creation will persist once the shifts write API is wired from this form."
        footer={
          <ErpDrawerFooter
            onCancel={() => setDrawerOpen(false)}
            onSave={() => setDrawerOpen(false)}
            saveLabel="Save Shift"
            disabled
          />
        }
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="shiftName" className={erpFormLabelClassName}>
              Shift name
            </label>
            <input
              id="shiftName"
              placeholder="e.g. General day shift"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={`${erpFormInputClassName} mt-1`}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="startTime" className={erpFormLabelClassName}>
                Start time
              </label>
              <input
                id="startTime"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className={`${erpFormInputClassName} mt-1`}
              />
            </div>
            <div>
              <label htmlFor="endTime" className={erpFormLabelClassName}>
                End time
              </label>
              <input
                id="endTime"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className={`${erpFormInputClassName} mt-1`}
              />
            </div>
          </div>
          <div>
            <label htmlFor="break" className={erpFormLabelClassName}>
              Break duration (minutes)
            </label>
            <input
              id="break"
              type="number"
              value={formData.breakDuration}
              onChange={(e) => setFormData({ ...formData, breakDuration: Number(e.target.value) })}
              className={`${erpFormInputClassName} mt-1`}
            />
          </div>
        </div>
      </SideDrawer>
    </StandardPageLayout>
  );
}
