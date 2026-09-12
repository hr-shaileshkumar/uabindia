"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Clock,
  Sun,
  Moon,
  Plus,
  Search,
  Download,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Trash2,
  Edit,
  Eye,
  Users,
  Copy,
  Check,
  Calendar,
  Coffee,
  Sparkles,
  UserCheck,
} from "lucide-react";
import {
  AdministrationGlobalPageShell,
  type KpiMetricItem,
} from "@/components/administration/AdministrationGlobalPageShell";
import { SideDrawer } from "@/components/ui/side-drawer";
import { ErpDrawerFooter } from "@/components/workspace/page-kit";
import { UniversalDeleteDialog } from "@/components/workspace/templates/UniversalDeleteDialog";
import { useShifts } from "@/features/hrms/shifts";
import { hrmsApi } from "@/services/modules";
import { notifyError, notifySuccess } from "@/lib/notifications";
import { getApiErrorMessage } from "@/lib/api-errors";
import { usePermissions } from "@/context/PermissionContext";

export interface ShiftItem {
  id: string;
  shiftCode: string;
  name: string;
  description?: string;
  startTime: string;
  endTime: string;
  durationHours: number;
  breakDuration: number;
  gracePeriodMinutes: number;
  isNightShift: boolean;
  nightShiftAllowance: number;
  isActive: boolean;
  shiftType: string;
  minEmployeesRequired?: number;
  maxEmployeesAllowed?: number;
  departmentId?: string;
  createdAt?: string;
}

export type ShiftAssignmentRow = {
  id: string;
  shiftId: string;
  shiftName?: string;
  employeeId: string;
  employeeName?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
};

const SHIFT_TYPES = ["General", "Morning", "Evening", "Night", "Rotational", "Split"] as const;

const emptyShift = () => ({
  shiftCode: "",
  name: "",
  description: "",
  shiftType: "General",
  startTime: "09:00",
  endTime: "18:00",
  durationHours: 9,
  breakDuration: 60,
  gracePeriodMinutes: 15,
  isNightShift: false,
  nightShiftAllowance: 0,
  isActive: true,
  minEmployeesRequired: 1,
  maxEmployeesAllowed: 50,
});

export function ShiftList() {
  const { hasPermission, isSuperAdmin } = usePermissions();
  const canManage =
    isSuperAdmin ||
    hasPermission(["hr.shifts.create", "hr.shifts.edit", "hr.shifts.manage", "hrms.admin"]);

  const {
    getShifts,
    createShift,
    updateShift,
    deleteShift,
    assignShift,
    getRoster,
    loading,
    error,
  } = useShifts();

  const [shifts, setShifts] = useState<ShiftItem[]>([]);
  const [assignments, setAssignments] = useState<ShiftAssignmentRow[]>([]);
  const [employees, setEmployees] = useState<{ id: string; fullName: string; employeeCode?: string }[]>([]);

  // Navigation & View
  const [activeTab, setActiveTab] = useState<"shifts" | "roster">("shifts");

  // Filters
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Drawer States
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<"view" | "create" | "edit">("create");
  const [selectedShift, setSelectedShift] = useState<ShiftItem | null>(null);
  const [formTab, setFormTab] = useState<"timing" | "rules">("timing");
  const [formData, setFormData] = useState(emptyShift());
  const [savingShift, setSavingShift] = useState(false);

  // Assign Drawer
  const [isAssignDrawerOpen, setIsAssignDrawerOpen] = useState(false);
  const [assignForm, setAssignForm] = useState({
    shiftId: "",
    employeeId: "",
  });
  const [savingAssign, setSavingAssign] = useState(false);

  // Delete Dialog
  const [deleteShiftRecord, setDeleteShiftRecord] = useState<ShiftItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Quick-copy
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const data = await getShifts();
      const rawShifts: Record<string, unknown>[] = Array.isArray(data)
        ? (data as Record<string, unknown>[])
        : Array.isArray((data as { data?: unknown })?.data)
        ? ((data as { data: Record<string, unknown>[] }).data)
        : [];

      const parsed: ShiftItem[] = rawShifts.map((s, idx) => ({
        id: String(s.id),
        shiftCode: String(s.shiftCode ?? s.code ?? `SH-${idx + 1}`),
        name: String(s.name ?? s.shiftName ?? "Work Shift"),
        description: s.description ? String(s.description) : undefined,
        startTime: String(s.startTime ?? "09:00"),
        endTime: String(s.endTime ?? "18:00"),
        durationHours: Number(s.durationHours ?? 9),
        breakDuration: Number(s.breakDurationMinutes ?? s.breakDuration ?? 60),
        gracePeriodMinutes: Number(s.gracePeriodMinutes ?? 15),
        isNightShift: Boolean(s.isNightShift),
        nightShiftAllowance: Number(s.nightShiftAllowance ?? 0),
        isActive: s.isActive !== undefined ? Boolean(s.isActive) : true,
        shiftType: String(s.shiftType ?? (s.isNightShift ? "Night" : "General")),
        minEmployeesRequired: s.minEmployeesRequired ? Number(s.minEmployeesRequired) : 1,
        maxEmployeesAllowed: s.maxEmployeesAllowed ? Number(s.maxEmployeesAllowed) : 50,
        createdAt: s.createdAt ? String(s.createdAt) : undefined,
      }));

      setShifts(parsed);

      // Load roster
      try {
        const rosterData = await getRoster();
        const rawRoster = Array.isArray(rosterData) ? rosterData : [];
        setAssignments(rawRoster as ShiftAssignmentRow[]);
      } catch {
        setAssignments([]);
      }
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to load shifts."), "Shifts");
    }
  }, [getShifts, getRoster]);

  // Load workforce for shift assignment
  const loadEmployees = useCallback(async () => {
    try {
      const res = await hrmsApi.hrms.employees.list(1, 200);
      const raw = res.data;
      const list = Array.isArray(raw)
        ? raw
        : Array.isArray((raw as { data?: unknown })?.data)
        ? ((raw as { data: unknown[] }).data)
        : [];
      setEmployees(
        (list as Record<string, unknown>[]).map((e) => ({
          id: String(e.id),
          fullName: String(
            e.fullName ?? (`${e.firstName ?? ""} ${e.lastName ?? ""}`.trim() || e.employeeCode || e.id)
          ),
          employeeCode: e.employeeCode ? String(e.employeeCode) : undefined,
        }))
      );
    } catch {
      setEmployees([]);
    }
  }, []);

  useEffect(() => {
    void loadData();
    void loadEmployees();
  }, [loadData, loadEmployees]);

  // KPIs
  const totalShiftsCount = shifts.length;
  const activeShiftsCount = useMemo(() => shifts.filter((s) => s.isActive).length, [shifts]);
  const nightShiftsCount = useMemo(() => shifts.filter((s) => s.isNightShift).length, [shifts]);
  const avgDurationHours = useMemo(() => {
    if (shifts.length === 0) return 0;
    const total = shifts.reduce((sum, s) => sum + (Number(s.durationHours) || 8), 0);
    return Math.round((total / shifts.length) * 10) / 10;
  }, [shifts]);

  const kpis: KpiMetricItem[] = [
    {
      label: "Configured Work Shifts",
      value: `${totalShiftsCount} Shifts`,
      tone: "info",
      subtext: `${SHIFT_TYPES.length} operational timing bands`,
    },
    {
      label: "Active Operational Rosters",
      value: `${activeShiftsCount} Active`,
      tone: "positive",
      subtext: `${totalShiftsCount > 0 ? Math.round((activeShiftsCount / totalShiftsCount) * 100) : 0}% active scheduling`,
    },
    {
      label: "Night & Graveyard Shifts",
      value: `${nightShiftsCount} Night Rosters`,
      tone: "warning",
      subtext: "Includes statutory night shift allowances",
    },
    {
      label: "Avg Workday Duration",
      value: `${avgDurationHours} Hours`,
      tone: "neutral",
      subtext: "Standard workforce shift span",
    },
  ];

  // Filtered Shifts
  const filteredShifts = useMemo(() => {
    return shifts.filter((s) => {
      const q = search.trim().toLowerCase();
      if (typeFilter !== "ALL" && s.shiftType !== typeFilter) return false;
      if (statusFilter === "active" && !s.isActive) return false;
      if (statusFilter === "inactive" && s.isActive) return false;

      if (q) {
        const nameMatch = s.name.toLowerCase().includes(q);
        const codeMatch = s.shiftCode.toLowerCase().includes(q);
        const typeMatch = s.shiftType.toLowerCase().includes(q);
        const timeMatch = `${s.startTime} ${s.endTime}`.includes(q);
        return nameMatch || codeMatch || typeMatch || timeMatch;
      }
      return true;
    });
  }, [shifts, typeFilter, statusFilter, search]);

  // Copy code
  const handleCopyCode = (code: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 1800);
  };

  // Open Create Drawer
  const handleOpenCreate = () => {
    setSelectedShift(null);
    setFormData(emptyShift());
    setFormTab("timing");
    setDrawerMode("create");
    setIsDrawerOpen(true);
  };

  // Open Edit Drawer
  const handleOpenEdit = (shift: ShiftItem) => {
    setSelectedShift(shift);
    setFormData({
      shiftCode: shift.shiftCode,
      name: shift.name,
      description: shift.description ?? "",
      shiftType: shift.shiftType,
      startTime: shift.startTime,
      endTime: shift.endTime,
      durationHours: shift.durationHours,
      breakDuration: shift.breakDuration,
      gracePeriodMinutes: shift.gracePeriodMinutes,
      isNightShift: shift.isNightShift,
      nightShiftAllowance: shift.nightShiftAllowance,
      isActive: shift.isActive,
      minEmployeesRequired: shift.minEmployeesRequired ?? 1,
      maxEmployeesAllowed: shift.maxEmployeesAllowed ?? 50,
    });
    setFormTab("timing");
    setDrawerMode("edit");
    setIsDrawerOpen(true);
  };

  // Open View Drawer
  const handleOpenView = (shift: ShiftItem) => {
    setSelectedShift(shift);
    setDrawerMode("view");
    setIsDrawerOpen(true);
  };

  // Submit Shift Form
  const handleSaveShift = async () => {
    if (!formData.name.trim()) {
      notifyError("Shift Name is required.", "Validation");
      return;
    }
    if (!formData.shiftCode.trim()) {
      notifyError("Shift Code is required.", "Validation");
      return;
    }

    try {
      setSavingShift(true);
      const payload = {
        shiftName: formData.name.trim(),
        name: formData.name.trim(),
        shiftCode: formData.shiftCode.trim().toUpperCase(),
        description: formData.description.trim() || undefined,
        shiftType: formData.shiftType,
        startTime: formData.startTime,
        endTime: formData.endTime,
        durationHours: Number(formData.durationHours) || 8,
        breakDurationMinutes: Number(formData.breakDuration) || 60,
        gracePeriodMinutes: Number(formData.gracePeriodMinutes) || 15,
        isNightShift: formData.isNightShift,
        nightShiftAllowance: Number(formData.nightShiftAllowance) || 0,
        isActive: formData.isActive,
        minEmployeesRequired: Number(formData.minEmployeesRequired) || 1,
        maxEmployeesAllowed: Number(formData.maxEmployeesAllowed) || 50,
      };

      if (drawerMode === "edit" && selectedShift) {
        if (updateShift) {
          await updateShift(selectedShift.id, payload);
        }
        notifySuccess(`Shift '${payload.shiftCode}' updated successfully.`, "Shifts");
      } else {
        await createShift(payload);
        notifySuccess(`Shift '${payload.shiftCode}' created successfully.`, "Shifts");
      }

      setIsDrawerOpen(false);
      await loadData();
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to save shift."), "Shifts");
    } finally {
      setSavingShift(false);
    }
  };

  // Delete Shift
  const handleConfirmDelete = async () => {
    if (!deleteShiftRecord) return;
    try {
      setDeleting(true);
      if (deleteShift) {
        await deleteShift(deleteShiftRecord.id);
      }
      notifySuccess(`Shift '${deleteShiftRecord.shiftCode}' deleted.`, "Shifts");
      setDeleteShiftRecord(null);
      if (selectedShift?.id === deleteShiftRecord.id) {
        setIsDrawerOpen(false);
      }
      await loadData();
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to delete shift."), "Shifts");
    } finally {
      setDeleting(false);
    }
  };

  // Open Assign Modal
  const openAssignModal = (targetShiftId?: string) => {
    setAssignForm({
      shiftId: targetShiftId || (shifts[0]?.id ?? ""),
      employeeId: "",
    });
    setIsAssignDrawerOpen(true);
  };

  // Submit Assignment
  const handleSaveAssignment = async () => {
    if (!assignForm.shiftId) {
      notifyError("Please select a shift.", "Validation");
      return;
    }
    if (!assignForm.employeeId) {
      notifyError("Please select an employee.", "Validation");
      return;
    }

    try {
      setSavingAssign(true);
      await assignShift(assignForm.employeeId, assignForm.shiftId);
      notifySuccess("Employee assigned to shift successfully.", "Shift Assignment");
      setIsAssignDrawerOpen(false);
      await loadData();
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to assign employee to shift."), "Shift Assignment");
    } finally {
      setSavingAssign(false);
    }
  };

  // Export CSV
  const handleExportCsv = () => {
    if (shifts.length === 0) {
      notifyError("No shifts to export.", "Export");
      return;
    }

    const headers = [
      "Shift Code",
      "Shift Name",
      "Shift Type",
      "Start Time",
      "End Time",
      "Duration (Hours)",
      "Break (Minutes)",
      "Grace Period (Minutes)",
      "Night Shift",
      "Night Allowance (INR)",
      "Status",
    ];

    const rows = filteredShifts.map((s) => [
      `"${s.shiftCode}"`,
      `"${s.name.replace(/"/g, '""')}"`,
      `"${s.shiftType}"`,
      `"${s.startTime}"`,
      `"${s.endTime}"`,
      s.durationHours,
      s.breakDuration,
      s.gracePeriodMinutes,
      s.isNightShift ? "Yes" : "No",
      s.nightShiftAllowance,
      s.isActive ? "Active" : "Inactive",
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Work_Shifts_Master_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    notifySuccess("Shift schedule exported successfully.", "CSV Export");
  };

  return (
    <>
      <AdministrationGlobalPageShell
        title="Shift & Roster Management"
        subtitle="Configure work schedules, working hours, break durations, grace periods, and night shift rosters."
        categoryTag="HRMS & Talent / Workforce Scheduling"
        icon="clock"
        kpiMetrics={kpis}
        onRefresh={() => void loadData()}
        onExportCsv={handleExportCsv}
        primaryActionLabel={canManage ? "Add Shift" : undefined}
        onPrimaryAction={canManage ? handleOpenCreate : undefined}
        secondaryActions={[
          {
            label: "Assign Shift",
            onClick: () => openAssignModal(),
            icon: <UserCheck className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />,
          },
        ]}
      >
        {/* Error state */}
        {error ? (
          <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 flex items-start gap-3 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300">
            <AlertCircle className="h-5 w-5 shrink-0 text-rose-600 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">Unable to complete shift operation</p>
              <p className="text-xs mt-0.5 text-rose-600 dark:text-rose-400">{error}</p>
            </div>
            <button
              type="button"
              onClick={() => void loadData()}
              className="text-xs font-semibold text-rose-700 underline hover:no-underline"
            >
              Retry
            </button>
          </div>
        ) : null}

        {/* Filters and View Switcher */}
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by shift name, code, timing (e.g. 09:00), or shift type..."
                className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
              {search ? (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600"
                >
                  Clear
                </button>
              ) : null}
            </div>

            {/* View Switcher */}
            <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 self-start md:self-auto shrink-0 dark:bg-slate-800">
              <button
                type="button"
                onClick={() => setActiveTab("shifts")}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                  activeTab === "shifts"
                    ? "bg-white text-indigo-600 shadow-sm dark:bg-slate-700 dark:text-indigo-400"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-400"
                }`}
              >
                <Clock className="h-3.5 w-3.5" />
                Shift Definitions ({shifts.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("roster")}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                  activeTab === "roster"
                    ? "bg-white text-indigo-600 shadow-sm dark:bg-slate-700 dark:text-indigo-400"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-400"
                }`}
              >
                <Users className="h-3.5 w-3.5" />
                Workforce Rostering ({assignments.length})
              </button>
            </div>
          </div>

          {/* Sub Filters */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value="ALL">All Shift Types</option>
                {SHIFT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value="ALL">All Status</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>

              {search || typeFilter !== "ALL" || statusFilter !== "ALL" ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setTypeFilter("ALL");
                    setStatusFilter("ALL");
                  }}
                  className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold px-2 py-1 dark:text-indigo-400"
                >
                  Reset Filters
                </button>
              ) : null}
            </div>

            <span className="text-xs text-slate-500 font-medium">
              Showing {filteredShifts.length} of {shifts.length} shifts
            </span>
          </div>
        </div>

        {/* Content Table */}
        {activeTab === "shifts" ? (
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden dark:border-slate-800 dark:bg-slate-900">
            {loading && shifts.length === 0 ? (
              <div className="p-6 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-12 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
                ))}
              </div>
            ) : filteredShifts.length === 0 ? (
              <div className="py-16 text-center px-4">
                <div className="inline-flex p-4 rounded-full bg-indigo-50 text-indigo-600 mb-3 dark:bg-indigo-950/50 dark:text-indigo-400">
                  <Clock className="h-8 w-8" />
                </div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">No shifts found</h3>
                <p className="max-w-md mx-auto mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {shifts.length === 0
                    ? "Define your organization's shift timings, grace periods, and break rules."
                    : "No shifts match the selected filters. Try clearing your filters."}
                </p>
                {shifts.length === 0 && canManage ? (
                  <button
                    type="button"
                    onClick={handleOpenCreate}
                    className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition"
                  >
                    <Plus className="h-4 w-4" />
                    Add First Shift
                  </button>
                ) : null}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/75 text-xs font-semibold text-slate-500 uppercase tracking-wider dark:border-slate-800 dark:bg-slate-800/60">
                      <th className="py-3.5 pl-6 pr-3">Shift Code</th>
                      <th className="px-3 py-3.5">Shift Name & Type</th>
                      <th className="px-3 py-3.5">Working Hours</th>
                      <th className="px-3 py-3.5">Break Duration</th>
                      <th className="px-3 py-3.5">Grace Period</th>
                      <th className="px-3 py-3.5 text-center">Status</th>
                      <th className="py-3.5 pl-3 pr-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredShifts.map((shift) => (
                      <tr key={shift.id} className="hover:bg-slate-50/70 transition dark:hover:bg-slate-800/50">
                        <td className="py-3.5 pl-6 pr-3 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={(e) => handleCopyCode(shift.shiftCode, e)}
                            className="inline-flex items-center gap-1 font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 hover:bg-indigo-50 hover:text-indigo-700 transition dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                          >
                            {shift.shiftCode}
                            {copiedCode === shift.shiftCode ? (
                              <Check className="h-3 w-3 text-emerald-600" />
                            ) : (
                              <Copy className="h-2.5 w-2.5 text-slate-400" />
                            )}
                          </button>
                        </td>

                        <td className="px-3 py-3.5">
                          <div className="flex items-center gap-3">
                            <div
                              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-semibold text-xs shadow-sm ${
                                shift.isNightShift
                                  ? "bg-slate-800 text-indigo-300"
                                  : "bg-amber-500 text-white"
                              }`}
                            >
                              {shift.isNightShift ? (
                                <Moon className="h-4 w-4" />
                              ) : (
                                <Sun className="h-4 w-4" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <span
                                onClick={() => handleOpenView(shift)}
                                className="font-medium text-slate-900 cursor-pointer hover:text-indigo-600 transition truncate block dark:text-white dark:hover:text-indigo-400"
                              >
                                {shift.name}
                              </span>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                                  {shift.shiftType}
                                </span>
                                {shift.nightShiftAllowance > 0 ? (
                                  <span className="text-[10px] text-amber-600 font-semibold px-1.5 py-0.2 rounded bg-amber-50 dark:bg-amber-950/40 dark:text-amber-300">
                                    +₹{shift.nightShiftAllowance} Allowance
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-3 py-3.5 whitespace-nowrap">
                          <div className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-200">
                            {shift.startTime} – {shift.endTime}
                          </div>
                          <span className="text-[11px] text-slate-400">({shift.durationHours} hrs span)</span>
                        </td>

                        <td className="px-3 py-3.5 whitespace-nowrap text-xs text-slate-600 dark:text-slate-400">
                          <div className="flex items-center gap-1.5">
                            <Coffee className="h-3.5 w-3.5 text-slate-400" />
                            <span>{shift.breakDuration} mins</span>
                          </div>
                        </td>

                        <td className="px-3 py-3.5 whitespace-nowrap text-xs text-slate-600 dark:text-slate-400">
                          {shift.gracePeriodMinutes} mins grace
                        </td>

                        <td className="px-3 py-3.5 whitespace-nowrap text-center">
                          {shift.isActive ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-medium rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60">
                              <CheckCircle2 className="h-3 w-3" /> Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-medium rounded-full bg-slate-100 text-slate-600 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
                              <XCircle className="h-3 w-3" /> Inactive
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 pl-3 pr-6 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {canManage ? (
                              <button
                                type="button"
                                onClick={() => openAssignModal(shift.id)}
                                className="px-2 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-md transition dark:bg-indigo-950/60 dark:text-indigo-300"
                                title="Assign to staff"
                              >
                                Assign
                              </button>
                            ) : null}

                            <button
                              type="button"
                              onClick={() => handleOpenView(shift)}
                              className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                              title="Inspect details"
                            >
                              <Eye className="h-4 w-4" />
                            </button>

                            {canManage ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleOpenEdit(shift)}
                                  className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-blue-400"
                                  title="Edit shift"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setDeleteShiftRecord(shift)}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition dark:hover:bg-rose-950/40 dark:hover:text-rose-400"
                                  title="Delete shift"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          /* Roster Register */
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden dark:border-slate-800 dark:bg-slate-900">
            {assignments.length === 0 ? (
              <div className="py-16 text-center px-4">
                <div className="inline-flex p-4 rounded-full bg-indigo-50 text-indigo-600 mb-3 dark:bg-indigo-950/50 dark:text-indigo-400">
                  <Calendar className="h-8 w-8" />
                </div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">No shift assignments active</h3>
                <p className="max-w-md mx-auto mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Assign employees to configured daytime or night shifts for accurate attendance and biometric roster mapping.
                </p>
                {canManage ? (
                  <button
                    type="button"
                    onClick={() => openAssignModal()}
                    className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition"
                  >
                    <UserCheck className="h-4 w-4" />
                    Assign First Employee
                  </button>
                ) : null}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/75 text-xs font-semibold text-slate-500 uppercase tracking-wider dark:border-slate-800 dark:bg-slate-800/60">
                      <th className="py-3.5 pl-6 pr-3">Employee</th>
                      <th className="px-3 py-3.5">Assigned Shift</th>
                      <th className="px-3 py-3.5">Effective Range</th>
                      <th className="px-3 py-3.5 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {assignments.map((row) => (
                      <tr key={row.id} className="hover:bg-slate-50/70 transition dark:hover:bg-slate-800/50">
                        <td className="py-3.5 pl-6 pr-3 font-medium text-slate-900 dark:text-white">
                          {row.employeeName || row.employeeId}
                        </td>
                        <td className="px-3 py-3.5 text-xs text-slate-700 dark:text-slate-300">
                          {row.shiftName || row.shiftId}
                        </td>
                        <td className="px-3 py-3.5 text-xs text-slate-500 dark:text-slate-400">
                          {row.startDate ? new Date(row.startDate).toLocaleDateString("en-IN") : "Permanent"}
                        </td>
                        <td className="px-3 py-3.5 text-center">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-medium rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60">
                            <CheckCircle2 className="h-3 w-3" /> Rostered
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </AdministrationGlobalPageShell>

      {/* Shift Inspector & Create/Edit Drawer */}
      <SideDrawer
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={
          drawerMode === "view"
            ? selectedShift?.name || "Shift Details"
            : drawerMode === "edit"
            ? `Edit Shift: ${selectedShift?.shiftCode}`
            : "Create Work Shift"
        }
        subtitle={
          drawerMode === "view"
            ? "Shift timing bands, meal break duration, and statutory night allowances."
            : "Configure operating working hours, late mark grace periods, and break rules."
        }
        width="lg"
        footer={
          drawerMode === "view" ? (
            <div className="flex items-center justify-between w-full p-4 border-t border-slate-200 dark:border-slate-800">
              {canManage && selectedShift ? (
                <button
                  type="button"
                  onClick={() => {
                    setIsDrawerOpen(false);
                    openAssignModal(selectedShift.id);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition dark:bg-indigo-950/40 dark:text-indigo-300"
                >
                  <UserCheck className="h-3.5 w-3.5" />
                  Assign Shift to Staff
                </button>
              ) : <div />}

              <div className="flex items-center gap-2">
                {canManage && selectedShift ? (
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(selectedShift)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition"
                  >
                    <Edit className="h-3.5 w-3.5" />
                    Edit Shift
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition dark:bg-slate-800 dark:text-slate-300"
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            <ErpDrawerFooter
              onCancel={() => setIsDrawerOpen(false)}
              onSave={() => void handleSaveShift()}
              saving={savingShift}
              isEdit={drawerMode === "edit"}
              saveLabel={drawerMode === "edit" ? "Save Changes" : "Create Shift"}
            />
          )
        }
      >
        {drawerMode === "view" && selectedShift ? (
          /* View Mode */
          <div className="space-y-6 p-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 space-y-3 dark:border-slate-800 dark:bg-slate-800/40">
              <div className="flex items-center justify-between gap-3">
                <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-800 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white">
                  {selectedShift.shiftCode}
                </span>
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold rounded-full border ${
                    selectedShift.isNightShift
                      ? "bg-slate-800 text-indigo-300 border-slate-700"
                      : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300"
                  }`}
                >
                  {selectedShift.isNightShift ? <Moon className="h-3 w-3" /> : <Sun className="h-3 w-3" />}
                  {selectedShift.shiftType}
                </span>
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">{selectedShift.name}</h3>
                {selectedShift.description ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{selectedShift.description}</p>
                ) : null}
              </div>
            </div>

            {/* Timings Card */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Shift Schedule</p>
                <p className="text-lg font-mono font-bold text-slate-900 mt-1 dark:text-white">
                  {selectedShift.startTime} – {selectedShift.endTime}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">{selectedShift.durationHours} hours workday</p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Break & Grace</p>
                <p className="text-lg font-mono font-bold text-slate-700 mt-1 dark:text-slate-300">
                  {selectedShift.breakDuration}m / {selectedShift.gracePeriodMinutes}m
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">Meal break & late mark grace</p>
              </div>
            </div>

            {/* Allowance */}
            <div className="rounded-xl border border-slate-200 bg-white divide-y divide-slate-100 text-xs dark:border-slate-800 dark:bg-slate-900 dark:divide-slate-800">
              <div className="p-3.5 flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Night Allowance:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  ₹{selectedShift.nightShiftAllowance} per night
                </span>
              </div>

              <div className="p-3.5 flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Operating Status:</span>
                <span
                  className={`font-semibold ${
                    selectedShift.isActive ? "text-emerald-700 dark:text-emerald-400" : "text-slate-500"
                  }`}
                >
                  {selectedShift.isActive ? "Active (Scheduling Enabled)" : "Inactive"}
                </span>
              </div>
            </div>
          </div>
        ) : (
          /* Form Mode */
          <div className="space-y-5 p-4">
            {/* Form Tabs */}
            <div className="flex border-b border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setFormTab("timing")}
                className={`flex-1 py-2.5 text-xs font-semibold border-b-2 transition ${
                  formTab === "timing"
                    ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
                    : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400"
                }`}
              >
                1. Timing & Schedule
              </button>
              <button
                type="button"
                onClick={() => setFormTab("rules")}
                className={`flex-1 py-2.5 text-xs font-semibold border-b-2 transition ${
                  formTab === "rules"
                    ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
                    : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400"
                }`}
              >
                2. Rules & Allowances
              </button>
            </div>

            {formTab === "timing" ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Shift Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.shiftCode}
                    onChange={(e) => setFormData({ ...formData, shiftCode: e.target.value })}
                    placeholder="e.g. SH-DAY-01, SH-NGT-02"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 uppercase font-mono dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Shift Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. General Day Shift, US Support Night Roster"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Shift Classification
                  </label>
                  <select
                    value={formData.shiftType}
                    onChange={(e) => setFormData({ ...formData, shiftType: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    {SHIFT_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t} Shift
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Start Time (HH:mm)
                    </label>
                    <input
                      type="time"
                      value={formData.startTime}
                      onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                      className="w-full px-3 py-2 text-sm font-mono bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      End Time (HH:mm)
                    </label>
                    <input
                      type="time"
                      value={formData.endTime}
                      onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                      className="w-full px-3 py-2 text-sm font-mono bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Duration (Hours)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={formData.durationHours}
                    onChange={(e) =>
                      setFormData({ ...formData, durationHours: parseFloat(e.target.value) || 8 })
                    }
                    className="w-full px-3 py-2 text-sm font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Break Duration (Mins)
                    </label>
                    <input
                      type="number"
                      value={formData.breakDuration}
                      onChange={(e) =>
                        setFormData({ ...formData, breakDuration: parseInt(e.target.value) || 60 })
                      }
                      className="w-full px-3 py-2 text-sm font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Grace Period (Mins)
                    </label>
                    <input
                      type="number"
                      value={formData.gracePeriodMinutes}
                      onChange={(e) =>
                        setFormData({ ...formData, gracePeriodMinutes: parseInt(e.target.value) || 15 })
                      }
                      className="w-full px-3 py-2 text-sm font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Is Night Shift</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Night shifts cross midnight and can qualify for statutory differential allowances.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.isNightShift}
                      onChange={(e) => setFormData({ ...formData, isNightShift: e.target.checked })}
                      className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                  </div>
                </div>

                {formData.isNightShift ? (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Night Shift Allowance (INR per shift)
                    </label>
                    <input
                      type="number"
                      step="1"
                      value={formData.nightShiftAllowance}
                      onChange={(e) =>
                        setFormData({ ...formData, nightShiftAllowance: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full px-3 py-2 text-sm font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                ) : null}

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Shift Active</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Active shifts are available in employee rostering and biometric sync.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </SideDrawer>

      {/* Assign Shift Drawer */}
      <SideDrawer
        open={isAssignDrawerOpen}
        onClose={() => setIsAssignDrawerOpen(false)}
        title="Assign Shift to Staff"
        subtitle="Roster an employee to a scheduled work shift."
        width="md"
        footer={
          <ErpDrawerFooter
            onCancel={() => setIsAssignDrawerOpen(false)}
            onSave={() => void handleSaveAssignment()}
            saving={savingAssign}
            saveLabel="Assign Shift"
          />
        }
      >
        <div className="space-y-4 p-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Select Shift <span className="text-rose-500">*</span>
            </label>
            <select
              value={assignForm.shiftId}
              onChange={(e) => setAssignForm({ ...assignForm, shiftId: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              <option value="">Select shift schedule...</option>
              {shifts.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.shiftCode} — {s.name} ({s.startTime} - {s.endTime})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Select Workforce Employee <span className="text-rose-500">*</span>
            </label>
            <select
              value={assignForm.employeeId}
              onChange={(e) => setAssignForm({ ...assignForm, employeeId: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              <option value="">Select employee...</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.fullName} {emp.employeeCode ? `(${emp.employeeCode})` : ""}
                </option>
              ))}
            </select>
          </div>
        </div>
      </SideDrawer>

      {/* Universal Delete Dialog */}
      <UniversalDeleteDialog
        open={Boolean(deleteShiftRecord)}
        onOpenChange={(open) => {
          if (!open) setDeleteShiftRecord(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Work Shift"
        entityName={deleteShiftRecord ? `${deleteShiftRecord.shiftCode} - ${deleteShiftRecord.name}` : ""}
        loading={deleting}
      />
    </>
  );
}
