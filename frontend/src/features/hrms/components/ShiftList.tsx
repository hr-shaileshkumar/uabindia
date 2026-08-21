"use client";

import { useMemo, useState } from "react";
import { Edit2, Moon, Plus, Sun } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { CrudCard, CrudHeaderStats } from "@/components/erp/crud-workspace";
import { EmptyState } from "@/components/erp/empty-state";
import { StatusBadge } from "@/components/erp/status-badge";
import {
  erpButtonClassName,
  erpFormInputClassName,
  erpFormLabelClassName,
  erpPanelClassName,
} from "@/components/erp/erpStyles";
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

  const { data: raw, isLoading, isError, error, refetch } = useQuery({
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

  return (
    <StandardPageLayout
      title="Shift & Roster Management"
      subtitle="Configure work shifts, timings, break durations, and night rosters."
      eyebrow="HRMS"
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
          <button type="button" onClick={() => handleOpenDrawer()} className={`${erpButtonClassName.primary} gap-1.5`} disabled>
            <Plus className="h-4 w-4" />
            Add Shift
          </button>
          <button type="button" onClick={() => void refetch()} className={erpButtonClassName.secondary}>
            Refresh
          </button>
        </>
      }
    >
      {isError && (
        <div className="erp-alert-error text-sm">{getApiErrorMessage(error, "Failed to load shifts.")}</div>
      )}

      <CrudCard title="Shift definitions" description="Live shift roster from the HRMS shifts API.">
        {isLoading ? (
          <div className="erp-loading">Loading shifts…</div>
        ) : shifts.length === 0 ? (
          <EmptyState
            title="No shifts configured"
            description="Work shifts will appear here once defined through the shifts API."
            ctaLabel="Refresh list"
            onClick={() => void refetch()}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {shifts.map((shift) => (
              <article key={shift.id} className={`${erpPanelClassName} p-4`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {shift.isNightShift ? (
                      <Moon className="h-5 w-5 shrink-0 text-slate-500" />
                    ) : (
                      <Sun className="h-5 w-5 shrink-0 text-amber-500" />
                    )}
                    <div>
                      <p className="text-base font-semibold text-slate-900">{shift.name}</p>
                      <p className="text-xs text-slate-500">
                        {shift.startTime} – {shift.endTime}
                      </p>
                    </div>
                  </div>
                  <StatusBadge tone={shift.isNightShift ? "info" : "neutral"}>
                    {shift.isNightShift ? "Night" : "Day"}
                  </StatusBadge>
                </div>
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="text-slate-500">Break duration</span>
                  <span className="font-medium text-slate-800">{shift.breakDuration} mins</span>
                </div>
                <div className="mt-3 flex justify-end border-t border-slate-100 pt-3">
                  <button
                    type="button"
                    onClick={() => handleOpenDrawer(shift)}
                    className={`${erpButtonClassName.ghost} h-8 gap-1 px-2 text-xs`}
                    disabled
                  >
                    <Edit2 className="h-3.5 w-3.5" /> Edit
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </CrudCard>

      <SideDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={editingShift ? "Edit Shift" : "Create Shift"}
        subtitle="Shift creation will persist once the shifts write API is wired from this form."
        footer={
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setDrawerOpen(false)} className={erpButtonClassName.secondary}>
              Cancel
            </button>
            <button type="button" onClick={() => setDrawerOpen(false)} className={erpButtonClassName.primary} disabled>
              Save Shift
            </button>
          </div>
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
