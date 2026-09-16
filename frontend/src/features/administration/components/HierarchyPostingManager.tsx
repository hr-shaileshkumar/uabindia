"use client";

import React, { useState, useEffect } from "react";
import {
  Globe,
  MapPin,
  Truck,
  Building,
  Layers,
  Plus,
  RefreshCw,
  Search,
  CheckCircle,
  XCircle,
  Radio,
  Compass,
  Navigation,
  Sparkles,
} from "lucide-react";
import { orgApi } from "@/services/modules/org";
import { useOrgContext } from "@/context/OrgContext";
import { notifySuccess, notifyError } from "@/lib/notifications";
import { getApiErrorMessage } from "@/lib/api-errors";

type ActiveTab = "businessGeo" | "facilities" | "postingUnits" | "adminGeo";

export function HierarchyPostingManager() {
  const { companyId } = useOrgContext();
  const [activeTab, setActiveTab] = useState<ActiveTab>("businessGeo");

  // Subtab for Business Geo: 'zones' | 'regions' | 'clusters'
  const [bizSubTab, setBizSubTab] = useState<"zones" | "regions" | "clusters">("zones");

  // Data states
  const [zones, setZones] = useState<any[]>([]);
  const [regions, setRegions] = useState<any[]>([]);
  const [clusters, setClusters] = useState<any[]>([]);
  const [facilities, setFacilities] = useState<any[]>([]);
  const [postingUnits, setPostingUnits] = useState<any[]>([]);

  // Geo states
  const [countries, setCountries] = useState<any[]>([]);
  const [states, setStates] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [selectedCountryId, setSelectedCountryId] = useState<string>("");
  const [selectedStateId, setSelectedStateId] = useState<string>("");
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>("");

  const [loading, setLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Modal / Form state
  const [showModal, setShowModal] = useState<boolean>(false);
  const [modalType, setModalType] = useState<string>("");
  const [formData, setFormData] = useState<any>({});

  const loadData = async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      if (activeTab === "businessGeo") {
        const [zRes, rRes, cRes] = await Promise.all([
          orgApi.orgStructure.zones.list(companyId),
          orgApi.orgStructure.regions.list(companyId),
          orgApi.orgStructure.clusters.list(companyId),
        ]);
        setZones(zRes.data.zones || []);
        setRegions(rRes.data.regions || []);
        setClusters(cRes.data.clusters || []);
      } else if (activeTab === "facilities") {
        const res = await orgApi.orgStructure.operationalLocations.list(companyId);
        setFacilities(res.data.operationalLocations || []);
      } else if (activeTab === "postingUnits") {
        const [uRes, fRes] = await Promise.all([
          orgApi.orgStructure.postingUnits.list(companyId),
          orgApi.orgStructure.operationalLocations.list(companyId),
        ]);
        setPostingUnits(uRes.data.postingUnits || []);
        setFacilities(fRes.data.operationalLocations || []);
      } else if (activeTab === "adminGeo") {
        const cRes = await orgApi.geography.countries();
        const countryList = cRes.data.countries || [];
        setCountries(countryList);
        if (countryList.length > 0 && !selectedCountryId) {
          const defaultInd = countryList.find((c: any) => c.code === "IND") || countryList[0];
          setSelectedCountryId(defaultInd.id);
        }
      }
    } catch (err) {
      notifyError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab, companyId]);

  useEffect(() => {
    if (selectedCountryId && activeTab === "adminGeo") {
      orgApi.geography.states(selectedCountryId).then((res) => {
        const sList = res.data.states || [];
        setStates(sList);
        if (sList.length > 0) {
          setSelectedStateId(sList[0].id);
        } else {
          setStates([]);
          setDistricts([]);
          setCities([]);
        }
      });
    }
  }, [selectedCountryId, activeTab]);

  useEffect(() => {
    if (selectedStateId && activeTab === "adminGeo") {
      orgApi.geography.districts(selectedStateId).then((res) => {
        const dList = res.data.districts || [];
        setDistricts(dList);
        if (dList.length > 0) {
          setSelectedDistrictId(dList[0].id);
        } else {
          setDistricts([]);
          setCities([]);
        }
      });
    }
  }, [selectedStateId, activeTab]);

  useEffect(() => {
    if (selectedDistrictId && activeTab === "adminGeo") {
      orgApi.geography.cities(selectedDistrictId).then((res) => {
        setCities(res.data.cities || []);
      });
    }
  }, [selectedDistrictId, activeTab]);

  const handleSeedIndia = async () => {
    setLoading(true);
    try {
      await orgApi.geography.seedIndia();
      notifySuccess("India geography (States & Districts) seeded successfully!");
      loadData();
    } catch (err) {
      notifyError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateModal = (type: string) => {
    setModalType(type);
    setFormData({
      companyId,
      isActive: true,
      type: 2, // default DistrictCenter
      targetType: 2, // default MobileUnit for posting units (MVU)
      geofenceRadiusMeters: 150,
    });
    setShowModal(true);
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (modalType === "zone") {
        await orgApi.orgStructure.zones.create(formData);
        notifySuccess("Zone created successfully!");
      } else if (modalType === "region") {
        await orgApi.orgStructure.regions.create(formData);
        notifySuccess("Region created successfully!");
      } else if (modalType === "cluster") {
        await orgApi.orgStructure.clusters.create(formData);
        notifySuccess("Cluster created successfully!");
      } else if (modalType === "facility") {
        await orgApi.orgStructure.operationalLocations.create(formData);
        notifySuccess("Operational Facility created successfully!");
      } else if (modalType === "postingUnit") {
        await orgApi.orgStructure.postingUnits.create(formData);
        notifySuccess("Posting Unit / MVU created successfully!");
      }
      setShowModal(false);
      loadData();
    } catch (err) {
      notifyError(getApiErrorMessage(err));
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white shadow-xl border border-indigo-800/40">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                Enterprise Multi-Dimensional
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                Tier-1 ERP Architecture
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
              Geography, Hierarchy & Posting Manager
            </h1>
            <p className="text-slate-300 text-sm mt-1 max-w-2xl">
              Cleanly separated administrative legal geography, operational management zones, physical facilities, and mobile posting units (MVU vans).
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadData}
              disabled={loading}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium border border-slate-700 flex items-center gap-2 transition"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
            {activeTab === "adminGeo" && (
              <button
                onClick={handleSeedIndia}
                disabled={loading}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-sm font-medium shadow-lg flex items-center gap-2 transition"
              >
                <Sparkles className="w-4 h-4" />
                Seed India States & Districts
              </button>
            )}
          </div>
        </div>

        {/* 4 Main Dimensions Tabs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-6 pt-4 border-t border-slate-800">
          <button
            onClick={() => setActiveTab("businessGeo")}
            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition ${
              activeTab === "businessGeo"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30"
                : "bg-slate-800/60 text-slate-300 hover:bg-slate-800"
            }`}
          >
            <Layers className="w-4 h-4" />
            1. Business Hierarchy
          </button>
          <button
            onClick={() => setActiveTab("facilities")}
            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition ${
              activeTab === "facilities"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30"
                : "bg-slate-800/60 text-slate-300 hover:bg-slate-800"
            }`}
          >
            <Building className="w-4 h-4" />
            2. Operational Sites
          </button>
          <button
            onClick={() => setActiveTab("postingUnits")}
            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition ${
              activeTab === "postingUnits"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30"
                : "bg-slate-800/60 text-slate-300 hover:bg-slate-800"
            }`}
          >
            <Truck className="w-4 h-4" />
            3. Posting Units & MVUs
          </button>
          <button
            onClick={() => setActiveTab("adminGeo")}
            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition ${
              activeTab === "adminGeo"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30"
                : "bg-slate-800/60 text-slate-300 hover:bg-slate-800"
            }`}
          >
            <Globe className="w-4 h-4" />
            4. Statutory Geography
          </button>
        </div>
      </div>

      {/* ── TAB 1: Business Hierarchy ─────────────────────────────────────── */}
      {activeTab === "businessGeo" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setBizSubTab("zones")}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${
                  bizSubTab === "zones"
                    ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                Zones ({zones.length})
              </button>
              <button
                onClick={() => setBizSubTab("regions")}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${
                  bizSubTab === "regions"
                    ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                Regions ({regions.length})
              </button>
              <button
                onClick={() => setBizSubTab("clusters")}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${
                  bizSubTab === "clusters"
                    ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                Clusters ({clusters.length})
              </button>
            </div>
            <button
              onClick={() => handleOpenCreateModal(bizSubTab === "zones" ? "zone" : bizSubTab === "regions" ? "region" : "cluster")}
              className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium flex items-center gap-1.5 shadow"
            >
              <Plus className="w-4 h-4" />
              Add {bizSubTab === "zones" ? "Zone" : bizSubTab === "regions" ? "Region" : "Cluster"}
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold">
                <tr>
                  <th className="p-3.5">Code</th>
                  <th className="p-3.5">Name</th>
                  {bizSubTab === "regions" && <th className="p-3.5">Parent Zone</th>}
                  {bizSubTab === "clusters" && <th className="p-3.5">Parent Region</th>}
                  <th className="p-3.5">Head of Unit</th>
                  <th className="p-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {(bizSubTab === "zones" ? zones : bizSubTab === "regions" ? regions : clusters).map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                    <td className="p-3.5 font-mono font-medium text-indigo-600 dark:text-indigo-400">{item.code}</td>
                    <td className="p-3.5 font-semibold text-slate-800 dark:text-slate-200">{item.name}</td>
                    {bizSubTab === "regions" && <td className="p-3.5 text-slate-600 dark:text-slate-300">{item.zoneName || "—"}</td>}
                    {bizSubTab === "clusters" && <td className="p-3.5 text-slate-600 dark:text-slate-300">{item.regionName || "—"}</td>}
                    <td className="p-3.5 text-slate-600 dark:text-slate-300">{item.headEmployeeName || "Unassigned"}</td>
                    <td className="p-3.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                        Active
                      </span>
                    </td>
                  </tr>
                ))}
                {(bizSubTab === "zones" ? zones : bizSubTab === "regions" ? regions : clusters).length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400">
                      No records found. Click &quot;Add&quot; above to create one.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 2: Operational Facilities ─────────────────────────────────── */}
      {activeTab === "facilities" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div>
              <h2 className="text-base font-bold text-slate-800 dark:text-slate-200">Physical Operational Facilities</h2>
              <p className="text-xs text-slate-500">Fixed brick-and-mortar sites with geofenced GPS boundaries for attendance</p>
            </div>
            <button
              onClick={() => handleOpenCreateModal("facility")}
              className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium flex items-center gap-1.5 shadow"
            >
              <Plus className="w-4 h-4" />
              Add Facility Site
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {facilities.map((fac) => (
              <div key={fac.id} className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-indigo-400 transition space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-mono font-medium text-indigo-500 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded">
                      {fac.code}
                    </span>
                    <h3 className="font-bold text-slate-800 dark:text-slate-200 text-base mt-1">{fac.name}</h3>
                  </div>
                  <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {fac.facilityTypeName || "Facility"}
                  </span>
                </div>

                <div className="text-xs text-slate-500 space-y-1">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span>{fac.address || "No address specified"}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Radio className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <span>Geofence Radius: {fac.geofenceRadiusMeters} meters</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                    <span>Cluster: {fac.businessClusterName || "Default"}</span>
                  </div>
                </div>
              </div>
            ))}
            {facilities.length === 0 && (
              <div className="col-span-full p-8 text-center bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-slate-400">
                No facilities registered yet. Add your Head Office or District Centers.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 3: Posting Units & MVUs ───────────────────────────────────── */}
      {activeTab === "postingUnits" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div>
              <h2 className="text-base font-bold text-slate-800 dark:text-slate-200">Posting Units & Mobile Units (MVU Fleet)</h2>
              <p className="text-xs text-slate-500">Mobile vans, field routes, and specialized deployment units mapped to parent base locations</p>
            </div>
            <button
              onClick={() => handleOpenCreateModal("postingUnit")}
              className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium flex items-center gap-1.5 shadow"
            >
              <Plus className="w-4 h-4" />
              Add Posting Unit / MVU
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {postingUnits.map((u) => (
              <div key={u.id} className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-emerald-400 transition space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-mono font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded">
                      {u.code}
                    </span>
                    <h3 className="font-bold text-slate-800 dark:text-slate-200 text-base mt-1">{u.name}</h3>
                  </div>
                  <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                    {u.targetTypeName || "MobileUnit"}
                  </span>
                </div>

                <div className="text-xs text-slate-500 space-y-1">
                  <div className="flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    <span>Base Facility: {u.parentLocationName || "Unassigned"}</span>
                  </div>
                  {u.vehicleRegistrationNumber && (
                    <div className="flex items-center gap-1.5 font-mono text-slate-700 dark:text-slate-300 font-semibold">
                      <Truck className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span>Vehicle: {u.vehicleRegistrationNumber}</span>
                    </div>
                  )}
                  {u.imeiOrGpsDeviceId && (
                    <div className="flex items-center gap-1.5">
                      <Radio className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
                      <span>GPS Device ID: {u.imeiOrGpsDeviceId}</span>
                    </div>
                  )}
                  {u.operationalRoute && (
                    <div className="flex items-center gap-1.5">
                      <Navigation className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>Route: {u.operationalRoute}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {postingUnits.length === 0 && (
              <div className="col-span-full p-8 text-center bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-slate-400">
                No posting units or MVUs configured yet. Add your mobile veterinary vans or field posts.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 4: Statutory Geography Explorer ───────────────────────────── */}
      {activeTab === "adminGeo" && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Countries */}
          <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-indigo-500" />
              Countries ({countries.length})
            </h3>
            <div className="space-y-1 max-h-96 overflow-y-auto pr-1">
              {countries.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCountryId(c.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-between transition ${
                    selectedCountryId === c.id
                      ? "bg-indigo-600 text-white"
                      : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  <span>{c.name}</span>
                  <span className="font-mono opacity-70">{c.code}</span>
                </button>
              ))}
            </div>
          </div>

          {/* States */}
          <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-emerald-500" />
              States ({states.length})
            </h3>
            <div className="space-y-1 max-h-96 overflow-y-auto pr-1">
              {states.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedStateId(s.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-between transition ${
                    selectedStateId === s.id
                      ? "bg-emerald-600 text-white"
                      : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  <span>{s.name}</span>
                  <span className="font-mono opacity-70">{s.stateCode}</span>
                </button>
              ))}
              {states.length === 0 && <p className="text-xs text-slate-400 p-2">No states found.</p>}
            </div>
          </div>

          {/* Districts */}
          <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-amber-500" />
              Districts ({districts.length})
            </h3>
            <div className="space-y-1 max-h-96 overflow-y-auto pr-1">
              {districts.map((d) => (
                <button
                  key={d.id}
                  onClick={() => setSelectedDistrictId(d.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-between transition ${
                    selectedDistrictId === d.id
                      ? "bg-amber-600 text-white"
                      : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  <span>{d.name}</span>
                </button>
              ))}
              {districts.length === 0 && <p className="text-xs text-slate-400 p-2">Select a state above.</p>}
            </div>
          </div>

          {/* Cities / Areas */}
          <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Navigation className="w-4 h-4 text-purple-500" />
              Cities / Municipalities ({cities.length})
            </h3>
            <div className="space-y-1 max-h-96 overflow-y-auto pr-1">
              {cities.map((city) => (
                <div
                  key={city.id}
                  className="px-3 py-2 rounded-lg text-xs font-medium bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 flex items-center justify-between"
                >
                  <span>{city.name}</span>
                  {city.postalCode && <span className="font-mono text-slate-400">{city.postalCode}</span>}
                </div>
              ))}
              {cities.length === 0 && <p className="text-xs text-slate-400 p-2">Select a district to view towns/areas.</p>}
            </div>
          </div>
        </div>
      )}

      {/* ── Create / Edit Modal ───────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white capitalize">
              Create New {modalType}
            </h3>

            <form onSubmit={handleSaveForm} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ZONE-NORTH, MVU-PAT-01"
                  value={formData.code || ""}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. North Zone, Danapur MVU Van 01"
                  value={formData.name || ""}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                />
              </div>

              {modalType === "region" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Parent Zone *</label>
                  <select
                    required
                    value={formData.zoneId || ""}
                    onChange={(e) => setFormData({ ...formData, zoneId: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                  >
                    <option value="">-- Select Zone --</option>
                    {zones.map((z) => (
                      <option key={z.id} value={z.id}>{z.name} ({z.code})</option>
                    ))}
                  </select>
                </div>
              )}

              {modalType === "cluster" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Parent Region *</label>
                  <select
                    required
                    value={formData.regionId || ""}
                    onChange={(e) => setFormData({ ...formData, regionId: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                  >
                    <option value="">-- Select Region --</option>
                    {regions.map((r) => (
                      <option key={r.id} value={r.id}>{r.name} ({r.code})</option>
                    ))}
                  </select>
                </div>
              )}

              {modalType === "facility" && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Facility Type</label>
                      <select
                        value={formData.type || 2}
                        onChange={(e) => setFormData({ ...formData, type: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                      >
                        <option value={1}>Head Office</option>
                        <option value={2}>District Center</option>
                        <option value={3}>Warehouse</option>
                        <option value={4}>Hospital</option>
                        <option value={5}>Satellite Office</option>
                        <option value={6}>Mobile Fleet Base</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Geofence (Meters)</label>
                      <input
                        type="number"
                        value={formData.geofenceRadiusMeters || 150}
                        onChange={(e) => setFormData({ ...formData, geofenceRadiusMeters: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Address</label>
                    <input
                      type="text"
                      placeholder="e.g. Near Veterinary College, Patna"
                      value={formData.address || ""}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                    />
                  </div>
                </>
              )}

              {modalType === "postingUnit" && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Unit Type</label>
                      <select
                        value={formData.targetType || 2}
                        onChange={(e) => setFormData({ ...formData, targetType: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                      >
                        <option value={1}>Fixed Facility Desk</option>
                        <option value={2}>Mobile Unit (MVU Van)</option>
                        <option value={3}>Remote Field Post</option>
                        <option value={4}>Virtual / WFH</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Parent Base Facility</label>
                      <select
                        value={formData.parentLocationId || ""}
                        onChange={(e) => setFormData({ ...formData, parentLocationId: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                      >
                        <option value="">-- None --</option>
                        {facilities.map((f) => (
                          <option key={f.id} value={f.id}>{f.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Vehicle Reg No.</label>
                      <input
                        type="text"
                        placeholder="e.g. BR-01-GA-1234"
                        value={formData.vehicleRegistrationNumber || ""}
                        onChange={(e) => setFormData({ ...formData, vehicleRegistrationNumber: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">GPS Device / IMEI</label>
                      <input
                        type="text"
                        placeholder="e.g. 864201049..."
                        value={formData.imeiOrGpsDeviceId || ""}
                        onChange={(e) => setFormData({ ...formData, imeiOrGpsDeviceId: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow"
                >
                  Save Unit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
