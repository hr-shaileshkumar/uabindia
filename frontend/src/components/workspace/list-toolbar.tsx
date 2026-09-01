"use client";

/**
 * Shared list-toolbar primitives for pages that need Search + filters + Create.
 * Prefer ModuleTablePage / StandardPageLayout for tenant lists; PlatformGlobalPageShell for /platform.
 * use these helpers when wiring custom list layouts to keep UX consistent.
 */
import type { ReactNode } from "react";
import { Search } from "lucide-react";
import { erpFormInputClassName } from "@/components/workspace/styles";

export function ListSearchInput({
  value,
  onChange,
  placeholder = "Search…",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative w-52 sm:w-64">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="erp-input h-8 w-full !pl-9 pr-3 text-xs"
      />
    </div>
  );
}

export function ListStatusFilter({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: { label: string; value: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="erp-select h-8 w-auto min-w-32 max-w-44 text-xs"
      aria-label="Status filter"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

export { ErpCreateButton as ListCreateButton } from "@/components/workspace/page-kit";

export function ListToolbar({
  search,
  filters,
  actions,
}: {
  search?: ReactNode;
  filters?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 flex-wrap items-center gap-2">
        {search}
        {filters}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
