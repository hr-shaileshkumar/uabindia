"use client";

import React, { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Boxes, Truck, Laptop, ArrowRightLeft } from "lucide-react";
import { FixedAssetLifecycleStudio } from "@/features/assets/components/FixedAssetLifecycleStudio";
import { FleetManagementCockpit } from "@/features/fleet/components/FleetManagementCockpit";
import { cn } from "@/lib/utils";

function UnifiedAssetsHub() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabParam = searchParams.get("tab")?.toLowerCase();

  const [activeTab, setActiveTab] = useState<"fixed" | "custody" | "fleet">(() => {
    if (tabParam === "fleet") return "fleet";
    if (tabParam === "custody" || tabParam === "it") return "custody";
    return "fixed";
  });

  useEffect(() => {
    if (tabParam === "fleet") setActiveTab("fleet");
    else if (tabParam === "custody" || tabParam === "it") setActiveTab("custody");
    else if (tabParam === "fixed") setActiveTab("fixed");
  }, [tabParam]);

  const handleTabChange = (tab: "fixed" | "custody" | "fleet") => {
    setActiveTab(tab);
    router.replace(`/assets?tab=${tab}`, { scroll: false });
  };

  return (
    <div className="space-y-4">
      {/* ── Top-level Unified Asset Hub Navigation ── */}
      <div className="bg-card border border-border/80 rounded-2xl p-2.5 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 bg-muted/60 rounded-xl">
          <button
            type="button"
            onClick={() => handleTabChange("fixed")}
            className={cn(
              "flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all",
              activeTab === "fixed"
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Boxes className="w-3.5 h-3.5 text-blue-500" />
            Fixed Assets &amp; Depreciation
          </button>

          <button
            type="button"
            onClick={() => handleTabChange("custody")}
            className={cn(
              "flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all",
              activeTab === "custody"
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Laptop className="w-3.5 h-3.5 text-indigo-500" />
            Employee Custody &amp; IT Kits
          </button>

          <button
            type="button"
            onClick={() => handleTabChange("fleet")}
            className={cn(
              "flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all",
              activeTab === "fleet"
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Truck className="w-3.5 h-3.5 text-amber-500" />
            Fleet &amp; Logistics Cockpit
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground pr-2 font-medium">
          <ArrowRightLeft className="w-3.5 h-3.5 text-slate-400" />
          <span>Unified Enterprise Asset Ecosystem</span>
        </div>
      </div>

      {/* ── Active Hub Component ── */}
      {activeTab === "fixed" && <FixedAssetLifecycleStudio initialCategory="ALL" />}
      {activeTab === "custody" && <FixedAssetLifecycleStudio initialCategory="IT_EQUIPMENT" />}
      {activeTab === "fleet" && <FleetManagementCockpit />}
    </div>
  );
}

export default function AssetsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-muted-foreground">Loading Unified Asset Ecosystem...</div>}>
      <UnifiedAssetsHub />
    </Suspense>
  );
}
