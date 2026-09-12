"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Truck,
  Wrench,
  Fuel,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Calendar,
  Gauge,
  User,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Clock,
  MoreVertical,
  X,
  FileText,
  MapPin,
  Trash2,
} from "lucide-react";
import {
  fleetApi,
  FleetVehicle,
  FleetMaintenance,
  FleetFuelLog,
  FleetKpis,
} from "@/services/modules/fleet";
import { formatCurrency } from "@/lib/formatters";
import { notifySuccess, notifyError } from "@/lib/notifications";
import { SideDrawer } from "@/components/ui/side-drawer";

export default function FleetManager() {
  const [activeTab, setActiveTab] = useState<"vehicles" | "maintenance" | "fuel">("vehicles");
  const [vehicles, setVehicles] = useState<FleetVehicle[]>([]);
  const [maintenances, setMaintenances] = useState<FleetMaintenance[]>([]);
  const [fuelLogs, setFuelLogs] = useState<FleetFuelLog[]>([]);
  const [kpis, setKpis] = useState<FleetKpis | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Drawers state
  const [vehicleDrawerOpen, setVehicleDrawerOpen] = useState(false);
  const [maintenanceDrawerOpen, setMaintenanceDrawerOpen] = useState(false);
  const [fuelDrawerOpen, setFuelDrawerOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Forms state
  const [vehicleForm, setVehicleForm] = useState({
    vehicleNumber: "",
    make: "",
    model: "",
    year: 2026,
    vin: "",
    fuelType: "Diesel",
    currentOdometer: 0,
    assignedDriverName: "",
    status: "Active",
  });

  const [maintenanceForm, setMaintenanceForm] = useState({
    vehicleId: "",
    serviceType: "Routine",
    odometer: 0,
    cost: 0,
    vendorName: "",
    notes: "",
    status: "Completed",
  });

  const [fuelForm, setFuelForm] = useState({
    vehicleId: "",
    odometer: 0,
    liters: 0,
    totalCost: 0,
    fuelStation: "",
    receiptNumber: "",
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [vRes, kRes, mRes, fRes] = await Promise.all([
        fleetApi.getVehicles(),
        fleetApi.getKpis(),
        fleetApi.getMaintenances(),
        fleetApi.getFuelLogs(),
      ]);

      if (vRes.data?.data) setVehicles(vRes.data.data);
      if (kRes.data?.data) setKpis(kRes.data.data);
      if (mRes.data?.data) setMaintenances(mRes.data.data);
      if (fRes.data?.data) setFuelLogs(fRes.data.data);
    } catch {
      notifyError("Failed to load fleet data. Please refresh.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredVehicles = useMemo(() => {
    return vehicles.filter((v) => {
      const matchesSearch =
        v.vehicleNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.make.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (v.assignedDriverName && v.assignedDriverName.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus = statusFilter === "ALL" || v.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [vehicles, searchQuery, statusFilter]);

  const handleCreateVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleForm.vehicleNumber.trim()) {
      notifyError("Vehicle number is required");
      return;
    }
    try {
      setSaving(true);
      const res = await fleetApi.createVehicle(vehicleForm as Partial<FleetVehicle>);
      if (res.data?.success) {
        notifySuccess(`Vehicle ${res.data.data.vehicleNumber} registered successfully`);
        setVehicleDrawerOpen(false);
        setVehicleForm({
          vehicleNumber: "",
          make: "",
          model: "",
          year: 2026,
          vin: "",
          fuelType: "Diesel",
          currentOdometer: 0,
          assignedDriverName: "",
          status: "Active",
        });
        loadData();
      }
    } catch {
      notifyError("Error saving vehicle");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!maintenanceForm.vehicleId) {
      notifyError("Please select a vehicle");
      return;
    }
    try {
      setSaving(true);
      const res = await fleetApi.createMaintenance(maintenanceForm as Partial<FleetMaintenance>);
      if (res.data?.success) {
        notifySuccess("Service record created successfully");
        setMaintenanceDrawerOpen(false);
        loadData();
      }
    } catch {
      notifyError("Error saving maintenance record");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateFuelLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fuelForm.vehicleId) {
      notifyError("Please select a vehicle");
      return;
    }
    try {
      setSaving(true);
      const res = await fleetApi.createFuelLog(fuelForm as Partial<FleetFuelLog>);
      if (res.data?.success) {
        notifySuccess("Fuel purchase recorded successfully");
        setFuelDrawerOpen(false);
        loadData();
      }
    } catch {
      notifyError("Error saving fuel entry");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteVehicle = async (id: string, number: string) => {
    if (!confirm(`Are you sure you want to decommission / delete vehicle ${number}?`)) return;
    try {
      await fleetApi.deleteVehicle(id);
      notifySuccess(`Vehicle ${number} removed`);
      loadData();
    } catch {
      notifyError("Failed to delete vehicle");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20";
      case "InMaintenance":
        return "bg-amber-500/10 text-amber-600 border border-amber-500/20";
      case "Decommissioned":
        return "bg-rose-500/10 text-rose-600 border border-rose-500/20";
      default:
        return "bg-sky-500/10 text-sky-600 border border-sky-500/20";
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600/10 text-indigo-600 rounded-xl">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                Fleet Management & Dispatch
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Track vehicles, driver assignments, periodic maintenance schedules, and fuel burn.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
            title="Refresh Fleet Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={() => setFuelDrawerOpen(true)}
            className="px-3.5 py-2 text-sm font-medium bg-amber-600 hover:bg-amber-700 text-white rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
          >
            <Fuel className="w-4 h-4" />
            Log Fuel
          </button>
          <button
            onClick={() => setMaintenanceDrawerOpen(true)}
            className="px-3.5 py-2 text-sm font-medium bg-slate-800 hover:bg-slate-900 text-white rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
          >
            <Wrench className="w-4 h-4" />
            Schedule Service
          </button>
          <button
            onClick={() => setVehicleDrawerOpen(true)}
            className="px-4 py-2 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm flex items-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Vehicle
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Fleet Size</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
              {kpis?.totalVehicles ?? vehicles.length}
            </h3>
            <p className="text-xs text-emerald-600 flex items-center gap-1 mt-1 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" /> Registered Assets
            </p>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-xl">
            <Truck className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active in Service</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
              {kpis?.activeVehicles ?? vehicles.filter((v) => v.status === "Active").length}
            </h3>
            <p className="text-xs text-emerald-600 flex items-center gap-1 mt-1 font-medium">
              Ready for Route Dispatch
            </p>
          </div>
          <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 rounded-xl">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Under Maintenance</p>
            <h3 className="text-2xl font-bold text-amber-600 mt-1">
              {kpis?.inMaintenance ?? vehicles.filter((v) => v.status === "InMaintenance").length}
            </h3>
            <p className="text-xs text-amber-600 flex items-center gap-1 mt-1 font-medium">
              <AlertTriangle className="w-3.5 h-3.5" /> Bay Inspection
            </p>
          </div>
          <div className="p-3 bg-amber-50 dark:bg-amber-900/30 text-amber-600 rounded-xl">
            <Wrench className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Fuel Cost (Month)</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
              {formatCurrency(kpis?.totalFuelCostMonth ?? 0)}
            </h3>
            <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
              Diesel / CNG Consumption
            </p>
          </div>
          <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-xl">
            <Fuel className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Tabs & Filters */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("vehicles")}
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                activeTab === "vehicles"
                  ? "bg-indigo-600 text-white shadow"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              Vehicles ({vehicles.length})
            </button>
            <button
              onClick={() => setActiveTab("maintenance")}
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                activeTab === "maintenance"
                  ? "bg-indigo-600 text-white shadow"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              Maintenance History ({maintenances.length})
            </button>
            <button
              onClick={() => setActiveTab("fuel")}
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                activeTab === "fuel"
                  ? "bg-indigo-600 text-white shadow"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              Fuel Log ({fuelLogs.length})
            </button>
          </div>

          {activeTab === "vehicles" && (
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search vehicle, driver..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="py-1.5 px-3 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ALL">All Statuses</option>
                <option value="Active">Active</option>
                <option value="InMaintenance">In Maintenance</option>
                <option value="Decommissioned">Decommissioned</option>
              </select>
            </div>
          )}
        </div>

        {/* Tab 1: Vehicles Table */}
        {activeTab === "vehicles" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Vehicle Number</th>
                  <th className="py-3 px-4">Make / Model</th>
                  <th className="py-3 px-4">Driver</th>
                  <th className="py-3 px-4">Fuel & Odometer</th>
                  <th className="py-3 px-4">Next Service</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredVehicles.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No vehicles found matching criteria.
                    </td>
                  </tr>
                ) : (
                  filteredVehicles.map((v) => (
                    <tr key={v.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">
                        {v.vehicleNumber}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800 dark:text-slate-200">{v.make}</div>
                        <div className="text-xs text-slate-400">{v.model} ({v.year})</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span>{v.assignedDriverName || "Unassigned"}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1 text-slate-700 dark:text-slate-300">
                          <Gauge className="w-3.5 h-3.5 text-slate-400" />
                          <span>{v.currentOdometer.toLocaleString()} km</span>
                        </div>
                        <div className="text-xs text-slate-400">{v.fuelType}</div>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-500">
                        {v.nextServiceDate ? new Date(v.nextServiceDate).toLocaleDateString() : "Not Scheduled"}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${getStatusBadge(v.status)}`}>
                          {v.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleDeleteVehicle(v.id, v.vehicleNumber)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
                          title="Delete vehicle"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 2: Maintenance Log */}
        {activeTab === "maintenance" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Service Date</th>
                  <th className="py-3 px-4">Vehicle</th>
                  <th className="py-3 px-4">Service Type</th>
                  <th className="py-3 px-4">Odometer</th>
                  <th className="py-3 px-4">Cost</th>
                  <th className="py-3 px-4">Vendor & Notes</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {maintenances.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No maintenance entries recorded.
                    </td>
                  </tr>
                ) : (
                  maintenances.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-4 font-medium text-slate-900 dark:text-slate-100">
                        {new Date(m.serviceDate).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 font-semibold text-indigo-600">{m.vehicleNumber}</td>
                      <td className="py-3 px-4">{m.serviceType}</td>
                      <td className="py-3 px-4">{m.odometer.toLocaleString()} km</td>
                      <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                        {formatCurrency(m.cost)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-slate-700 dark:text-slate-300">{m.vendorName || "In-House Garage"}</div>
                        <div className="text-xs text-slate-400">{m.notes}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${getStatusBadge(m.status)}`}>
                          {m.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 3: Fuel Log */}
        {activeTab === "fuel" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Vehicle</th>
                  <th className="py-3 px-4">Odometer</th>
                  <th className="py-3 px-4">Liters Dispensed</th>
                  <th className="py-3 px-4">Total Amount</th>
                  <th className="py-3 px-4">Station / Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {fuelLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No fuel entries logged yet.
                    </td>
                  </tr>
                ) : (
                  fuelLogs.map((f) => (
                    <tr key={f.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-4 font-medium text-slate-900 dark:text-slate-100">
                        {new Date(f.logDate).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 font-semibold text-indigo-600">{f.vehicleNumber}</td>
                      <td className="py-3 px-4">{f.odometer.toLocaleString()} km</td>
                      <td className="py-3 px-4">{f.liters} L</td>
                      <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                        {formatCurrency(f.totalCost)}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-500">
                        <div>{f.fuelStation || "Highway Station"}</div>
                        <div className="text-slate-400">Rcpt: {f.receiptNumber || "N/A"}</div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Drawer: Add Vehicle */}
      <SideDrawer
        open={vehicleDrawerOpen}
        onClose={() => setVehicleDrawerOpen(false)}
        title="Register New Vehicle"
      >
        <form onSubmit={handleCreateVehicle} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase mb-1">
              Vehicle Registration Number *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. DL-01-AX-9942"
              value={vehicleForm.vehicleNumber}
              onChange={(e) => setVehicleForm({ ...vehicleForm, vehicleNumber: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase mb-1">
                Make *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Tata Motors"
                value={vehicleForm.make}
                onChange={(e) => setVehicleForm({ ...vehicleForm, make: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase mb-1">
                Model *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Prima 4928"
                value={vehicleForm.model}
                onChange={(e) => setVehicleForm({ ...vehicleForm, model: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase mb-1">
                Manufacturing Year
              </label>
              <input
                type="number"
                value={vehicleForm.year}
                onChange={(e) => setVehicleForm({ ...vehicleForm, year: parseInt(e.target.value) || 2026 })}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase mb-1">
                Fuel Type
              </label>
              <select
                value={vehicleForm.fuelType}
                onChange={(e) => setVehicleForm({ ...vehicleForm, fuelType: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Diesel">Diesel</option>
                <option value="Petrol">Petrol</option>
                <option value="Electric">Electric</option>
                <option value="CNG">CNG</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase mb-1">
              Current Odometer (km)
            </label>
            <input
              type="number"
              value={vehicleForm.currentOdometer}
              onChange={(e) => setVehicleForm({ ...vehicleForm, currentOdometer: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase mb-1">
              Assigned Driver Name
            </label>
            <input
              type="text"
              placeholder="e.g. Ramesh Kumar"
              value={vehicleForm.assignedDriverName}
              onChange={(e) => setVehicleForm({ ...vehicleForm, assignedDriverName: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setVehicleDrawerOpen(false)}
              className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-50"
            >
              {saving ? "Registering..." : "Save Vehicle"}
            </button>
          </div>
        </form>
      </SideDrawer>

      {/* Drawer: Schedule Service */}
      <SideDrawer
        open={maintenanceDrawerOpen}
        onClose={() => setMaintenanceDrawerOpen(false)}
        title="Record Vehicle Service / Maintenance"
      >
        <form onSubmit={handleCreateMaintenance} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase mb-1">
              Select Vehicle *
            </label>
            <select
              required
              value={maintenanceForm.vehicleId}
              onChange={(e) => setMaintenanceForm({ ...maintenanceForm, vehicleId: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">-- Choose Vehicle --</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.vehicleNumber} - {v.make} {v.model}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase mb-1">
                Service Type
              </label>
              <select
                value={maintenanceForm.serviceType}
                onChange={(e) => setMaintenanceForm({ ...maintenanceForm, serviceType: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Routine">Routine Service</option>
                <option value="Major">Major Overhaul</option>
                <option value="Breakdown">Breakdown Repair</option>
                <option value="Tire">Tire Replacement</option>
                <option value="Brake">Brake Inspection</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase mb-1">
                Total Cost (INR) *
              </label>
              <input
                type="number"
                required
                value={maintenanceForm.cost}
                onChange={(e) => setMaintenanceForm({ ...maintenanceForm, cost: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase mb-1">
              Vendor / Workshop Name
            </label>
            <input
              type="text"
              placeholder="e.g. Authorized Tata Commercial Hub"
              value={maintenanceForm.vendorName}
              onChange={(e) => setMaintenanceForm({ ...maintenanceForm, vendorName: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase mb-1">
              Service Notes & Replaced Parts
            </label>
            <textarea
              rows={3}
              placeholder="Oil change, filters replaced, brake alignment check."
              value={maintenanceForm.notes}
              onChange={(e) => setMaintenanceForm({ ...maintenanceForm, notes: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setMaintenanceDrawerOpen(false)}
              className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-sm font-semibold bg-slate-900 text-white rounded-lg disabled:opacity-50"
            >
              {saving ? "Saving..." : "Record Service"}
            </button>
          </div>
        </form>
      </SideDrawer>

      {/* Drawer: Fuel Log */}
      <SideDrawer
        open={fuelDrawerOpen}
        onClose={() => setFuelDrawerOpen(false)}
        title="Log Fuel Purchase"
      >
        <form onSubmit={handleCreateFuelLog} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase mb-1">
              Select Vehicle *
            </label>
            <select
              required
              value={fuelForm.vehicleId}
              onChange={(e) => setFuelForm({ ...fuelForm, vehicleId: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">-- Choose Vehicle --</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.vehicleNumber} - {v.make} {v.model}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase mb-1">
                Liters Dispensed *
              </label>
              <input
                type="number"
                step="0.1"
                required
                value={fuelForm.liters}
                onChange={(e) => setFuelForm({ ...fuelForm, liters: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase mb-1">
                Total Cost (INR) *
              </label>
              <input
                type="number"
                required
                value={fuelForm.totalCost}
                onChange={(e) => setFuelForm({ ...fuelForm, totalCost: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase mb-1">
                Odometer Reading (km)
              </label>
              <input
                type="number"
                value={fuelForm.odometer}
                onChange={(e) => setFuelForm({ ...fuelForm, odometer: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase mb-1">
                Receipt Number
              </label>
              <input
                type="text"
                placeholder="e.g. IOC-9182"
                value={fuelForm.receiptNumber}
                onChange={(e) => setFuelForm({ ...fuelForm, receiptNumber: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase mb-1">
              Fuel Station / Outlet
            </label>
            <input
              type="text"
              placeholder="e.g. Indian Oil Highway Plaza"
              value={fuelForm.fuelStation}
              onChange={(e) => setFuelForm({ ...fuelForm, fuelStation: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setFuelDrawerOpen(false)}
              className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-sm font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-lg disabled:opacity-50"
            >
              {saving ? "Saving..." : "Record Fuel Entry"}
            </button>
          </div>
        </form>
      </SideDrawer>
    </div>
  );
}
