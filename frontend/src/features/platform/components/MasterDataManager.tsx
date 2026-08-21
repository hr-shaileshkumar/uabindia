"use client";

import { useState } from "react";
import { Globe, Plus, Search } from "lucide-react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { CrudCard } from "@/components/erp/crud-workspace";
import { EmptyState } from "@/components/erp/empty-state";
import { erpButtonClassName, erpFormInputClassName } from "@/components/erp/erpStyles";
import { ROUTES } from "@/constants/routes";

export interface CountryMaster {
  id: string;
  name: string;
  code: string;
  phoneCode: string;
  currency: string;
  statesCount: number;
  isActive: boolean;
}

export function MasterDataManager() {
  const [countries] = useState<CountryMaster[]>([]);
  const [search, setSearch] = useState("");

  const filtered = countries.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <StandardPageLayout
      title="Global Master Data Management"
      subtitle="Configure geolocation registries, country and state hierarchies, postal codes, base currencies, and holiday calendars."
      eyebrow="Platform"
      icon="globe"
      actions={
        <button type="button" className={`${erpButtonClassName.primary} gap-1.5`} disabled>
          <Plus className="h-4 w-4" />
          Add Country
        </button>
      }
      filters={
        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search country name or ISO code…"
            className={`${erpFormInputClassName} pl-9`}
          />
        </div>
      }
    >
      <CrudCard title="Country registry" description="Country masters are not a live API in this release. Use organization structure for departments, designations, and branches.">
        {filtered.length === 0 ? (
          <EmptyState
            title="No countries configured"
            description="This page is reserved for a future country/region registry. Use Organization Structure for departments, designations, branches, and cost centers."
            ctaLabel="Open departments"
            ctaHref={ROUTES.PLATFORM_DEPARTMENTS}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {filtered.map((c) => (
              <article key={c.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="flex items-center gap-2 font-mono text-base font-semibold text-slate-900">
                  <Globe className="h-4 w-4 text-slate-500" />
                  {c.name} ({c.code})
                </p>
                <p className="text-xs text-slate-500">Dial code: {c.phoneCode}</p>
              </article>
            ))}
          </div>
        )}
      </CrudCard>
    </StandardPageLayout>
  );
}
