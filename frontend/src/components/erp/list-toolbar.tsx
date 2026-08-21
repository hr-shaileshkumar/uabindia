"use client";

/**
 * Shared list-toolbar primitives for pages that need Search + filters + Create.
 * Prefer ModuleTablePage / StandardPageLayout for tenant lists; PlatformGlobalPageShell for /platform.
 * use these helpers when wiring custom list layouts to keep UX consistent.
 */
import type { ReactNode } from "react";
import { Search } from "lucide-react";
import { erpFormInputClassName } from "@/components/erp/erpStyles";

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
    <div className="relative max-w-md">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`${erpFormInputClassName} pl-9`}
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
      className={erpFormInputClassName}
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

export { ErpCreateButton as ListCreateButton } from "@/components/erp/erp-page-kit";

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
