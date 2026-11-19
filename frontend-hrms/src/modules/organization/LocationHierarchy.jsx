import React, { useState } from "react";
import {
  MapPin,
  Building2,
  ChevronRight,
  Plus,
  Compass,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";
import { INITIAL_LOCATIONS_HIERARCHY } from "../../services/mockData";
import { useNotification } from "../../context/NotificationContext";

export const LocationHierarchy = () => {
  const { notifySuccess } = useNotification();
  const [locations, setLocations] = useState(INITIAL_LOCATIONS_HIERARCHY);
  const [selectedTier, setSelectedTier] = useState(7); // default to Duty Station

  const tiers = [
    { tier: 1, name: "Country", desc: "Sovereign jurisdiction" },
    { tier: 2, name: "Zone", desc: "Zonal operational command" },
    { tier: 3, name: "Region", desc: "Provincial regional administration" },
    { tier: 4, name: "State", desc: "Federal state boundary" },
    { tier: 5, name: "Cluster", desc: "Metropolitan commercial cluster" },
    { tier: 6, name: "District", desc: "Revenue district zone" },
    { tier: 7, name: "Duty Station", desc: "Geofenced campus / facility" },
  ];

  const handleAddStation = () => {
    notifySuccess("Geofenced duty station created with 250m radius");
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              Enterprise Master
            </span>
            <span className="text-xs text-slate-400 font-mono">hrms.locations</span>
          </div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">
            Location Hierarchy Master (7 Tiers)
          </h1>
          <p className="text-xs text-slate-500">
            Geofenced operational topology from Country down to campuses for biometric mobile punch enforcement.
          </p>
        </div>

        <button
          onClick={handleAddStation}
          className="inline-flex items-center gap-1 h-8 px-3 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-2xs shadow-blue-500/20 transition-colors shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Duty Station
        </button>
      </div>

      {/* 7-Tier Progress Stepper / Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {tiers.map((t) => (
          <button
            key={t.tier}
            onClick={() => setSelectedTier(t.tier)}
            className={`p-2 rounded-xl border text-left transition-all ${
              selectedTier === t.tier
                ? "bg-blue-600 border-blue-600 text-white shadow-2xs"
                : "bg-white border-slate-200 hover:border-slate-300 text-slate-700 shadow-2xs"
            }`}
          >
            <div className={`text-[9.5px] font-bold uppercase tracking-wider ${selectedTier === t.tier ? "text-blue-100" : "text-slate-400"}`}>
              Tier {t.tier}
            </div>
            <div className="text-[11px] font-bold mt-0.5 truncate">{t.name}</div>
          </button>
        ))}
      </div>

      {/* Tier Visual Breakdown */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div>
            <h3 className="text-xs font-bold text-slate-900">
              Active Tier Topology Tree
            </h3>
            <p className="text-[10.5px] text-slate-400">
              Parent-child relationship linking national headquarters to geofenced biometric zones
            </p>
          </div>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            7 Levels Enforced
          </span>
        </div>

        <div className="space-y-2">
          {locations.map((loc) => (
            <div
              key={loc.id}
              className={`p-2.5 rounded-lg border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
                loc.tier === selectedTier
                  ? "bg-blue-50/40 border-blue-300 shadow-2xs ring-1 ring-blue-500/20"
                  : "bg-slate-50/60 border-slate-200"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-[11px] shrink-0 ${
                    loc.tier === selectedTier
                      ? "bg-blue-600 text-white shadow-2xs"
                      : "bg-white text-slate-600 border border-slate-200"
                  }`}
                >
                  T{loc.tier}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-900">{loc.name}</span>
                    <span className="text-[9.5px] font-mono font-bold px-1 py-0.2 rounded bg-white border border-slate-200 text-slate-600">
                      {loc.code}
                    </span>
                    <span className="text-[9.5px] font-bold px-1.5 py-0.2 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                      {loc.tierName}
                    </span>
                  </div>
                  <div className="text-[10.5px] text-slate-400">
                    {loc.parent ? `Parent: ${loc.parent}` : "Root Level Jurisdiction"}
                  </div>
                </div>
              </div>

              {loc.geofenceRadiusMeters && (
                <div className="flex items-center gap-1 text-[11px] text-blue-700 font-semibold bg-white px-2.5 py-1 rounded-md border border-blue-200/80 shadow-2xs shrink-0">
                  <Compass className="w-3.5 h-3.5 text-blue-600" />
                  <span>Geofence: {loc.geofenceRadiusMeters}m active radius</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LocationHierarchy;
