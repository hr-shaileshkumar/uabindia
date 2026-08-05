"use client";

import React, { useState } from "react";
import { Building2, Plus, Eye, MapPin, Warehouse, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlatformGlobalPageShell, KpiMetricItem } from "@/components/platform/PlatformGlobalPageShell";
import { notifySuccess } from "@/lib/notifications";

interface BranchRow {
  id: string;
  code: string;
  name: string;
  city: string;
  state: string;
  gstin?: string;
  isWarehouse: boolean;
  status: "Active" | "Inactive";
}

const SEED_BRANCHES: BranchRow[] = [
  { id: "br_101", code: "BR-MUM-01", name: "Mumbai Corporate Head Office & Hub", city: "Mumbai", state: "Maharashtra", gstin: "27AABCU9603R1ZM", isWarehouse: false, status: "Active" },
  { id: "br_102", code: "BR-BLR-02", name: "Bengaluru Tech Park & R&D Center", city: "Bengaluru", state: "Karnataka", gstin: "29AABCU9603R1ZN", isWarehouse: false, status: "Active" },
  { id: "br_103", code: "WH-BHI-01", name: "Bhiwandi Central Fulfillment Warehouse", city: "Bhiwandi", state: "Maharashtra", gstin: "27AABCU9603R1ZM", isWarehouse: true, status: "Active" },
  { id: "br_104", code: "WH-DEL-02", name: "NCR Primary Distribution Depot", city: "Gurugram", state: "Haryana", gstin: "06AABCU9603R1ZP", isWarehouse: true, status: "Active" },
];

export default function BranchesPage() {
  const [branches, setBranches] = useState<BranchRow[]>(SEED_BRANCHES);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<BranchRow | null>(null);

  // Form State
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [city, setCity] = useState("Mumbai");
  const [state, setState] = useState("Maharashtra");

  const handleCreateBranch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newBr: BranchRow = {
      id: `br_${Date.now()}`,
      code: code.trim().toUpperCase() || `BR-${city.slice(0, 3).toUpperCase()}-0${branches.length + 1}`,
      name: name.trim(),
      city,
      state,
      gstin: "27AABCU9603R1ZM",
      isWarehouse: false,
      status: "Active",
    };

    setBranches((prev) => [newBr, ...prev]);
    setIsDrawerOpen(false);
    setName("");
    setCode("");
    notifySuccess(`Branch "${newBr.name}" registered successfully.`);
  };

  const filteredBranches = branches.filter((b) => {
    const q = search.toLowerCase();
    const matchesSearch = !q || b.name.toLowerCase().includes(q) || b.code.toLowerCase().includes(q) || b.city.toLowerCase().includes(q);
    const matchesType = typeFilter === "all" || (typeFilter === "warehouse" ? b.isWarehouse : !b.isWarehouse);
    return matchesSearch && matchesType;
  });

  const kpis: KpiMetricItem[] = [
    { label: "Branch Offices", value: branches.filter((b) => !b.isWarehouse).length, tone: "info", icon: <Building2 className="h-3.5 w-3.5" />, subtext: "Offices" },
    { label: "Fulfillment Warehouses", value: branches.filter((b) => b.isWarehouse).length, tone: "positive", icon: <Warehouse className="h-3.5 w-3.5" />, subtext: "Storage Hubs" },
    { label: "States Covered", value: new Set(branches.map((b) => b.state)).size, tone: "warning", icon: <MapPin className="h-3.5 w-3.5" />, subtext: "Jurisdictions" },
    { label: "Operational Status", value: "100%", tone: "positive", icon: <CheckCircle2 className="h-3.5 w-3.5" />, subtext: "Active" },
  ];

  return (
    <PlatformGlobalPageShell
      title="Branch Offices & Warehouse Locations"
      subtitle="Register branch office facilities, state GSTIN tax mappings, and fulfillment warehouse hubs."
      categoryTag="Organization Infrastructure"
      kpiMetrics={kpis}
      searchPlaceholder="Filter branch code, name, city, or GSTIN..."
      searchValue={search}
      onSearchChange={setSearch}
      filterOptions={[
        {
          key: "type",
          label: "All Facilities",
          value: typeFilter,
          onChange: setTypeFilter,
          options: [
            { label: "All Facilities", value: "all" },
            { label: "Branch Offices", value: "office" },
            { label: "Warehouses", value: "warehouse" },
          ],
        },
      ]}
      onClearFilters={() => {
        setSearch("");
        setTypeFilter("all");
      }}
      primaryActionLabel="New Branch / Warehouse"
      onPrimaryAction={() => setIsDrawerOpen(true)}
      primaryActionIcon={<Plus className="h-4 w-4 mr-1.5" />}
      isInspectorOpen={isDrawerOpen || !!selectedBranch}
      onInspectorClose={() => {
        setIsDrawerOpen(false);
        setSelectedBranch(null);
      }}
      inspectorTitle={selectedBranch ? `Facility: ${selectedBranch.name}` : "Register Branch / Warehouse"}
      inspectorSubTitle={selectedBranch ? `Code ${selectedBranch.code}` : "Configure city location and GSTIN tax registration."}
      inspectorContent={
        selectedBranch ? (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Branch Code:</span>
                <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{selectedBranch.code}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Facility Name:</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">{selectedBranch.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Location:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedBranch.city}, {selectedBranch.state}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">GSTIN Tax ID:</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400">{selectedBranch.gstin || "-"}</span>
              </div>
            </div>
            <div className="flex justify-end pt-4">
              <Button variant="outline" size="sm" onClick={() => setSelectedBranch(null)}>
                Close Inspector
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleCreateBranch} className="space-y-4 text-xs">
            <div className="space-y-2">
              <Label className="text-xs">Facility Code *</Label>
              <Input placeholder="BR-HYD-01" value={code} onChange={(e) => setCode(e.target.value)} required />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Facility Name *</Label>
              <Input placeholder="Hyderabad HITEC City Regional Office" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs">City</Label>
                <Input value={city} onChange={(e) => setCity(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">State</Label>
                <Input value={state} onChange={(e) => setState(e.target.value)} />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-6">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsDrawerOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                Register Branch
              </Button>
            </div>
          </form>
        )
      }
    >
      <div className="erp-table-wrap rounded-none border-0 shadow-none">
        <table className="erp-table">
          <thead className="erp-thead">
            <tr>
              <th className="erp-th">Facility Code</th>
              <th className="erp-th">Facility Name</th>
              <th className="erp-th">City & State</th>
              <th className="erp-th">GSTIN Tax ID</th>
              <th className="erp-th">Facility Type</th>
              <th className="erp-th text-right">Inspect</th>
            </tr>
          </thead>
          <tbody>
            {filteredBranches.map((b) => (
              <tr key={b.id} className="erp-tr hover:bg-slate-50/80 dark:hover:bg-slate-900/50 transition-colors">
                <td className="erp-td font-mono font-bold text-xs text-indigo-600 dark:text-indigo-400">{b.code}</td>
                <td className="erp-td font-semibold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  {b.isWarehouse ? <Warehouse className="h-4 w-4 text-amber-500" /> : <Building2 className="h-4 w-4 text-indigo-500" />}
                  {b.name}
                </td>
                <td className="erp-td text-xs text-slate-700 dark:text-slate-300">{b.city}, {b.state}</td>
                <td className="erp-td font-mono text-xs text-slate-500">{b.gstin || "-"}</td>
                <td className="erp-td">
                  <Badge variant="outline" className="text-xs font-normal">
                    {b.isWarehouse ? "Warehouse Depot" : "Branch Office"}
                  </Badge>
                </td>
                <td className="erp-td text-right">
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-indigo-600" onClick={() => setSelectedBranch(b)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PlatformGlobalPageShell>
  );
}
