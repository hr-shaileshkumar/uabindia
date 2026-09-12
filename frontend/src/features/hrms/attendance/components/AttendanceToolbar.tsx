"use client";

import { Calendar, Search, Building2, Briefcase } from "lucide-react";
import { GLOBAL_REGIONS, PUNCH_SOURCES } from "../types/attendance.types";

interface AttendanceToolbarProps {
  search: string;
  onSearchChange: (val: string) => void;
  selectedDateRange: string;
  onDateRangeChange: (val: string) => void;
  selectedPunchType: string;
  onPunchTypeChange: (val: string) => void;
  selectedSource: string;
  onSourceChange: (val: string) => void;
  selectedRegion: string;
  onRegionChange: (val: string) => void;
  selectedGpsStatus: string;
  onGpsStatusChange: (val: string) => void;
  companyFilter?: string;
  onCompanyFilterChange?: (val: string) => void;
  projectFilter?: string;
  onProjectFilterChange?: (val: string) => void;
  companiesList?: { id: string; name: string }[];
  projectsList?: { id: string; name: string }[];
  hasActiveFilters: boolean;
  onResetFilters: () => void;
}

export function AttendanceToolbar({
  search,
  onSearchChange,
  selectedDateRange,
  onDateRangeChange,
  selectedPunchType,
  onPunchTypeChange,
  selectedSource,
  onSourceChange,
  selectedRegion,
  onRegionChange,
  selectedGpsStatus,
  onGpsStatusChange,
  companyFilter,
  onCompanyFilterChange,
  projectFilter,
  onProjectFilterChange,
  companiesList,
  projectsList,
  hasActiveFilters,
  onResetFilters,
}: AttendanceToolbarProps) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search staff, employee code, device, location, FRS..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-3.5 py-2 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500"
            />
          </div>

          {/* Company Scope Selector */}
          {companiesList && onCompanyFilterChange && (
            <div className="flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-slate-400" />
              <select
                value={companyFilter || ""}
                onChange={(e) => onCompanyFilterChange(e.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                <option value="">All Companies (Tenant Scope)</option>
                {companiesList.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Project / Site Scope Selector */}
          {projectsList && onProjectFilterChange && (
            <div className="flex items-center gap-1.5">
              <Briefcase className="h-3.5 w-3.5 text-slate-400" />
              <select
                value={projectFilter || ""}
                onChange={(e) => onProjectFilterChange(e.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                <option value="">All Projects / Sites</option>
                {projectsList.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Date Filter */}
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={selectedDateRange}
              onChange={(e) => onDateRangeChange(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <option value="all">All Dates</option>
              <option value="today">Today Only</option>
              <option value="yesterday">Yesterday</option>
              <option value="week">Past 7 Days</option>
              <option value="month">This Month</option>
            </select>
          </div>

          {/* Punch Type Filter */}
          <select
            value={selectedPunchType}
            onChange={(e) => onPunchTypeChange(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <option value="all">All Punch Types</option>
            <option value="IN">IN (Check-Ins)</option>
            <option value="OUT">OUT (Check-Outs)</option>
          </select>

          {/* Punch Mode Filter */}
          <select
            value={selectedSource}
            onChange={(e) => onSourceChange(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            {PUNCH_SOURCES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          {/* Region Filter */}
          <select
            value={selectedRegion}
            onChange={(e) => onRegionChange(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            {GLOBAL_REGIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>

          {/* GPS Geofence Filter */}
          <select
            value={selectedGpsStatus}
            onChange={(e) => onGpsStatusChange(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <option value="all">All GPS Statuses</option>
            <option value="verified">Geofenced Only (✓)</option>
            <option value="unverified">Unverified / Missing GPS</option>
          </select>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={onResetFilters}
              className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300 cursor-pointer"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
