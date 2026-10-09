"use client";

import React, { useState, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getRowFieldValue } from "@/lib/workspace/list-view";
import type { DynamicColumn } from "@/lib/dynamic-schema/types";

export interface DynamicCalendarViewProps {
  rows: any[];
  columns: DynamicColumn[];
  dateFieldKey?: string;
  titleFieldKey?: string;
  statusFieldKey?: string;
  onEdit?: (row: any) => void;
  onCreateOnDate?: (dateString: string) => void;
  idField?: string;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const WEEKDAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function DynamicCalendarView({
  rows,
  columns,
  dateFieldKey,
  titleFieldKey,
  statusFieldKey = "status",
  onEdit,
  onCreateOnDate,
  idField = "id",
}: DynamicCalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(() => new Date());

  // Automatically discover best date field if not explicitly supplied
  const effectiveDateField = useMemo(() => {
    if (dateFieldKey) return dateFieldKey;
    const dateCandidate = columns.find(
      (c) =>
        c.dataType === "date" ||
        c.dataType === "datetime" ||
        /date|due|created|effective|scheduled|start/i.test(c.key)
    );
    return dateCandidate?.key || "createdAt";
  }, [dateFieldKey, columns]);

  // Discover best title field
  const effectiveTitleField = useMemo(() => {
    if (titleFieldKey) return titleFieldKey;
    const titleCandidate = columns.find(
      (c) =>
        !c.hidden &&
        c.key !== "id" &&
        c.key !== effectiveDateField &&
        /name|title|code|subject|number|description/i.test(c.key)
    );
    return titleCandidate?.key || columns[0]?.key || "name";
  }, [titleFieldKey, columns, effectiveDateField]);

  // Navigation handlers
  const handlePrevMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Compute days of the month grid
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(year, month, 1).getDay();
    const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthLastDay = new Date(year, month, 0).getDate();

    const days: Array<{
      date: Date;
      isCurrentMonth: boolean;
      dateString: string;
      dayNumber: number;
    }> = [];

    // Leading days from previous month
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = prevMonthLastDay - i;
      const prevDate = new Date(year, month - 1, d);
      days.push({
        date: prevDate,
        isCurrentMonth: false,
        dateString: prevDate.toISOString().split("T")[0],
        dayNumber: d,
      });
    }

    // Days in current month
    for (let d = 1; d <= lastDayOfMonth; d++) {
      const curDate = new Date(year, month, d);
      days.push({
        date: curDate,
        isCurrentMonth: true,
        dateString: curDate.toISOString().split("T")[0],
        dayNumber: d,
      });
    }

    // Trailing days from next month to complete 35 or 42 grid cells
    const totalSlots = days.length <= 35 ? 35 : 42;
    const remainingSlots = totalSlots - days.length;
    for (let d = 1; d <= remainingSlots; d++) {
      const nextDate = new Date(year, month + 1, d);
      days.push({
        date: nextDate,
        isCurrentMonth: false,
        dateString: nextDate.toISOString().split("T")[0],
        dayNumber: d,
      });
    }

    return days;
  }, [year, month]);

  // Group rows by ISO date string (YYYY-MM-DD)
  const eventsByDate = useMemo(() => {
    const map = new Map<string, any[]>();
    rows.forEach((row) => {
      const rawDateVal = getRowFieldValue(row, effectiveDateField) ?? row[effectiveDateField] ?? row.createdAt;
      if (!rawDateVal) return;

      let dateStr = "";
      if (rawDateVal instanceof Date) {
        dateStr = rawDateVal.toISOString().split("T")[0];
      } else if (typeof rawDateVal === "string") {
        dateStr = rawDateVal.split("T")[0];
      }

      if (dateStr) {
        if (!map.has(dateStr)) {
          map.set(dateStr, []);
        }
        map.get(dateStr)!.push(row);
      }
    });
    return map;
  }, [rows, effectiveDateField]);

  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);

  const getStatusColor = (row: any) => {
    const statusVal = String(getRowFieldValue(row, statusFieldKey) || row.status || "").toLowerCase();
    if (statusVal.includes("approved") || statusVal.includes("active") || statusVal.includes("completed")) {
      return "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300";
    }
    if (statusVal.includes("pending") || statusVal.includes("draft") || statusVal.includes("in progress")) {
      return "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300";
    }
    if (statusVal.includes("rejected") || statusVal.includes("inactive") || statusVal.includes("overdue") || statusVal.includes("cancelled")) {
      return "border-rose-300 bg-rose-50 text-rose-800 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300";
    }
    return "border-indigo-200 bg-indigo-50 text-indigo-800 dark:border-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300";
  };

  return (
    <div className="w-full space-y-3">
      {/* Calendar Header / Navigation Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200/90 bg-white p-3 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">
            {MONTH_NAMES[month]} {year}
          </h2>
          <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            {rows.length} {rows.length === 1 ? "Record" : "Records"}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleToday}
            className="inline-flex h-8 items-center justify-center rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 shadow-2xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 cursor-pointer"
          >
            Today
          </button>
          <div className="inline-flex rounded-lg border border-slate-200 p-0.5 dark:border-slate-700">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
              title="Previous Month"
              aria-label="Previous Month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleNextMonth}
              className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
              title="Next Month"
              aria-label="Next Month"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Weekday Names Header */}
      <div className="grid grid-cols-7 gap-px rounded-t-xl border border-b-0 border-slate-200 bg-slate-100 text-center dark:border-slate-800 dark:bg-slate-800/80">
        {WEEKDAY_NAMES.map((w, idx) => (
          <div
            key={w}
            className={cn(
              "py-2 text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300",
              idx === 0 || idx === 6 ? "text-slate-400 dark:text-slate-500" : ""
            )}
          >
            {w}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-px rounded-b-xl border border-slate-200 bg-slate-200 dark:border-slate-800 dark:bg-slate-800 overflow-hidden shadow-2xs">
        {calendarDays.map((day) => {
          const events = eventsByDate.get(day.dateString) || [];
          const isToday = day.dateString === todayStr;

          return (
            <div
              key={day.dateString}
              className={cn(
                "group relative min-h-[110px] p-1.5 transition-colors flex flex-col justify-between",
                day.isCurrentMonth
                  ? "bg-white dark:bg-slate-900"
                  : "bg-slate-50/70 text-slate-400 dark:bg-slate-950/40 dark:text-slate-600",
                isToday ? "ring-2 ring-inset ring-indigo-500/60 dark:ring-indigo-400/60" : ""
              )}
            >
              {/* Day Cell Top Bar: Date Number and Add Button */}
              <div className="flex items-center justify-between">
                <span
                  className={cn(
                    "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold",
                    isToday
                      ? "bg-indigo-600 font-bold text-white shadow-2xs"
                      : day.isCurrentMonth
                      ? "text-slate-700 dark:text-slate-200"
                      : "text-slate-400 dark:text-slate-500"
                  )}
                >
                  {day.dayNumber}
                </span>

                {onCreateOnDate && day.isCurrentMonth && (
                  <button
                    type="button"
                    onClick={() => onCreateOnDate(day.dateString)}
                    className="opacity-0 group-hover:opacity-100 inline-flex h-5 w-5 items-center justify-center rounded-md bg-slate-100 text-slate-600 hover:bg-indigo-600 hover:text-white transition-opacity cursor-pointer dark:bg-slate-800 dark:text-slate-300"
                    title={`Add record for ${day.dateString}`}
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                )}
              </div>

              {/* Events in Day Cell */}
              <div className="mt-1 space-y-1 flex-1 overflow-y-auto max-h-[85px] scrollbar-none">
                {events.slice(0, 3).map((item, idx) => {
                  const title =
                    String(getRowFieldValue(item, effectiveTitleField) || item[effectiveTitleField] || "Record");
                  const badgeClass = getStatusColor(item);

                  return (
                    <button
                      key={String(item[idField] || idx)}
                      type="button"
                      onClick={() => onEdit?.(item)}
                      className={cn(
                        "w-full text-left truncate rounded-md border px-1.5 py-0.5 text-[11px] font-medium leading-tight shadow-2xs transition-all hover:scale-[1.01] hover:brightness-95 cursor-pointer block",
                        badgeClass
                      )}
                      title={title}
                    >
                      {title}
                    </button>
                  );
                })}

                {events.length > 3 && (
                  <span className="block text-[10px] font-semibold text-slate-500 px-1 dark:text-slate-400">
                    +{events.length - 3} more
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
