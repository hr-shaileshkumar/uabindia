"use client";

import { Search } from "lucide-react";
import type { FilterDefinition } from "@/lib/erp/types";

export function FilterBar({ filters }: { filters: FilterDefinition[] }) {
  return (
    <div className="rounded-[var(--erp-radius-panel)] border border-[var(--erp-border)] bg-white p-3 shadow-[var(--erp-shadow-sm)]">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[1.4fr_repeat(3,minmax(0,1fr))]">
        <label className="relative block">
          <span className="mb-1 block text-xs font-semibold text-slate-600">Search</span>
          <Search className="pointer-events-none absolute bottom-3 left-3 h-4 w-4 text-slate-400" />
          <input className="erp-input border-slate-200/90 bg-white/95 pl-10" placeholder="Search employees, voucher, ticket, or reference..." />
        </label>

        {filters.slice(0, 3).map((filter) => (
          <label key={filter.key} className="block">
            <span className="mb-1 block text-xs font-semibold text-slate-600">{filter.label}</span>
            <select className="erp-select border-slate-200/90 bg-white/95">
              {filter.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
    </div>
  );
}
