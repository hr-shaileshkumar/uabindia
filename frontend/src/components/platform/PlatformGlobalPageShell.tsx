"use client";

import React, { useState } from "react";
import { 
  Search, RefreshCw, Plus, Download, Filter, X, ChevronLeft, ChevronRight, 
  Sparkles, Layers, ShieldCheck, Activity, HelpCircle, ArrowUpRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";

export interface KpiMetricItem {
  label: string;
  value: string | number;
  subtext?: string;
  tone?: "positive" | "negative" | "warning" | "info" | "neutral";
  icon?: React.ReactNode;
}

export interface FilterOption {
  key: string;
  label: string;
  options: { label: string; value: string }[];
  value: string;
  onChange: (val: string) => void;
}

export interface PlatformGlobalPageShellProps {
  title: string;
  subtitle: string;
  categoryTag?: string;
  kpiMetrics?: KpiMetricItem[];
  
  // Search & Filters
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (val: string) => void;
  filterOptions?: FilterOption[];
  onClearFilters?: () => void;
  
  // Actions
  primaryActionLabel?: string;
  onPrimaryAction?: () => void;
  primaryActionIcon?: React.ReactNode;
  
  secondaryActions?: {
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
    disabled?: boolean;
  }[];
  
  onRefresh?: () => void;
  onExportCsv?: () => void;
  isLoading?: boolean;
  
  // Pagination
  currentPage?: number;
  totalPages?: number;
  totalRecords?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;

  // Selected Item Drawer Inspector
  inspectorTitle?: string;
  inspectorSubTitle?: string;
  inspectorContent?: React.ReactNode;
  isInspectorOpen?: boolean;
  onInspectorClose?: () => void;

  children: React.ReactNode;
}

export function PlatformGlobalPageShell({
  title,
  subtitle,
  categoryTag = "Platform Governance",
  kpiMetrics = [],
  searchPlaceholder = "Search records, keys, or details...",
  searchValue = "",
  onSearchChange,
  filterOptions = [],
  onClearFilters,
  primaryActionLabel,
  onPrimaryAction,
  primaryActionIcon,
  secondaryActions = [],
  onRefresh,
  onExportCsv,
  isLoading = false,
  currentPage = 1,
  totalPages = 1,
  totalRecords = 0,
  pageSize = 25,
  onPageChange,
  onPageSizeChange,
  inspectorTitle,
  inspectorSubTitle,
  inspectorContent,
  isInspectorOpen = false,
  onInspectorClose,
  children
}: PlatformGlobalPageShellProps) {
  const [isFilterActive, setIsFilterActive] = useState(false);

  const getToneBadgeStyle = (tone?: KpiMetricItem["tone"]) => {
    switch (tone) {
      case "positive":
        return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
      case "warning":
        return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
      case "negative":
        return "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20";
      case "info":
        return "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20";
      default:
        return "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20";
    }
  };

  const hasActiveFilters = Boolean(
    searchValue.trim() || 
    filterOptions.some(f => f.value && f.value !== "all")
  );

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      {/* 🌟 Premium Hero Header Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 md:p-8 text-white shadow-xl">
        <div className="absolute -right-12 -top-12 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute right-1/3 -bottom-12 h-48 w-48 rounded-full bg-sky-500/10 blur-2xl" />
        
        <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2.5">
              <Badge className="bg-indigo-500/20 text-indigo-200 border-indigo-500/30 font-semibold text-[11px] tracking-wide uppercase px-2.5 py-0.5">
                <Sparkles className="mr-1 h-3 w-3 text-indigo-400 inline" />
                {categoryTag}
              </Badge>
              <span className="text-slate-400 text-xs">•</span>
              <span className="text-slate-300 text-xs flex items-center gap-1 font-mono">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" /> Enterprise Admin Verified
              </span>
            </div>
            
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              {title}
            </h1>
            <p className="text-sm text-slate-300/90 leading-relaxed">
              {subtitle}
            </p>
          </div>

          {/* Centralized Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {onRefresh && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                disabled={isLoading}
                className="bg-slate-800/80 border-slate-700 hover:bg-slate-700 text-slate-200 text-xs h-9 px-3.5"
              >
                <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isLoading ? "animate-spin text-indigo-400" : ""}`} />
                Sync Stream
              </Button>
            )}

            {onExportCsv && (
              <Button
                variant="outline"
                size="sm"
                onClick={onExportCsv}
                className="bg-slate-800/80 border-slate-700 hover:bg-slate-700 text-slate-200 text-xs h-9 px-3.5"
              >
                <Download className="h-3.5 w-3.5 mr-1.5 text-sky-400" />
                Export CSV
              </Button>
            )}

            {secondaryActions.map((action, idx) => (
              <Button
                key={idx}
                variant="outline"
                size="sm"
                onClick={action.onClick}
                disabled={action.disabled}
                className="bg-slate-800/80 border-slate-700 hover:bg-slate-700 text-slate-200 text-xs h-9 px-3.5"
              >
                {action.icon && <span className="mr-1.5">{action.icon}</span>}
                {action.label}
              </Button>
            ))}

            {primaryActionLabel && onPrimaryAction && (
              <Button
                size="sm"
                onClick={onPrimaryAction}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs h-9 px-4 shadow-lg shadow-indigo-600/30 transition-transform active:scale-95"
              >
                {primaryActionIcon || <Plus className="h-4 w-4 mr-1.5" />}
                {primaryActionLabel}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* 📊 KPI Command Matrix (4-Grid Cards) */}
      {kpiMetrics.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {kpiMetrics.map((item, index) => (
            <div
              key={index}
              className="group relative overflow-hidden rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {item.label}
                </span>
                <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-bold ${getToneBadgeStyle(item.tone)}`}>
                  {item.icon || <Activity className="h-3 w-3 mr-1" />}
                  {item.subtext || "Live"}
                </span>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 font-mono">
                  {item.value}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 🔍 Universal Filter & Search Control Surface */}
      <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Global Search Box */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
              className="pl-10 h-10 text-xs bg-slate-50/50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 focus:bg-background transition-colors"
            />
            {searchValue && (
              <button 
                onClick={() => onSearchChange && onSearchChange("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Dynamic Dropdown Filters */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto flex-wrap">
            {filterOptions.map((opt) => (
              <Select key={opt.key} value={opt.value} onValueChange={opt.onChange}>
                <SelectTrigger className="w-[140px] h-10 text-xs bg-slate-50/50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800">
                  <SelectValue placeholder={opt.label} />
                </SelectTrigger>
                <SelectContent>
                  {opt.options.map((o) => (
                    <SelectItem key={o.value} value={o.value} className="text-xs">
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ))}

            {hasActiveFilters && onClearFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearFilters}
                className="h-10 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 px-3"
              >
                <X className="h-3.5 w-3.5 mr-1" />
                Reset
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* 📦 Main Data Grid Content Container */}
      <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        {children}

        {/* 📄 Standardized Centralized Pagination Footer */}
        {totalRecords > 0 && onPageChange && (
          <div className="p-4 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span>Show per page:</span>
              <Select value={String(pageSize)} onValueChange={(val) => onPageSizeChange && onPageSizeChange(Number(val))}>
                <SelectTrigger className="w-[70px] h-8 text-xs bg-background">
                  <SelectValue placeholder="25" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
              <span>
                Showing {Math.min((currentPage - 1) * pageSize + 1, totalRecords)} - {Math.min(currentPage * pageSize, totalRecords)} of {totalRecords} entries
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => onPageChange(currentPage - 1)}
                className="h-8 text-xs px-3"
              >
                <ChevronLeft className="h-3.5 w-3.5 mr-1" />
                Prev
              </Button>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 px-2 font-mono">
                Page {currentPage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages}
                onClick={() => onPageChange(currentPage + 1)}
                className="h-8 text-xs px-3"
              >
                Next
                <ChevronRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* 🔍 Side Drawer Inspector for Details View */}
      {inspectorContent && (
        <Sheet open={isInspectorOpen} onOpenChange={(open) => !open && onInspectorClose && onInspectorClose()}>
          <SheetContent className="sm:max-w-xl overflow-y-auto">
            <SheetHeader>
              <SheetTitle className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Layers className="h-5 w-5 text-indigo-500" />
                {inspectorTitle || "Record Inspector"}
              </SheetTitle>
              {inspectorSubTitle && (
                <SheetDescription className="text-xs text-slate-500">
                  {inspectorSubTitle}
                </SheetDescription>
              )}
            </SheetHeader>
            <div className="pt-6">
              {inspectorContent}
            </div>
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
}
