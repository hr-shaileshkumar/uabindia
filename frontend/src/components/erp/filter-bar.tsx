"use client";

import { Search } from "lucide-react";
import type { FilterDefinition } from "@/lib/erp/types";

export function FilterBar({ filters }: { filters: FilterDefinition[] }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="grid gap-3 lg:grid-cols-[1.4fr_repeat(3,minmax(0,1fr))]">
        <label className="relative block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Search</span>
          <Search className="pointer-events-none absolute left-3 top-[2.55rem] h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input className="erp-input pl-10" placeholder="Search employees, voucher, ticket, or reference..." />
        </label>

        {filters.slice(0, 3).map((filter) => (
          <label key={filter.key} className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{filter.label}</span>
            <select className="erp-select defaultValue">
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
