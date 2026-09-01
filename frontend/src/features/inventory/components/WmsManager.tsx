"use client";

import React, { useState, useEffect } from "react";
import apiClient from "@/services/apiClient";
import {
  Boxes,
  QrCode,
  Scan,
  CheckCircle2,
  Zap,
} from "lucide-react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { CrudHeaderStats } from "@/components/workspace/crud-workspace";
import { ErpRefreshButton } from "@/components/workspace/page-kit";
import { notifySuccess, notifyError } from "@/lib/notifications";

export interface BinStoredItem {
  itemId: string;
  itemCode: string;
  itemName: string;
  batchNumber: string;
  quantity: number;
  weightKg: number;
}

export interface WarehouseBinLocation {
  binId: string;
  warehouseId: string;
  warehouseName: string;
  zoneCode: string;
  aisleNumber: string;
  rackNumber: string;
  shelfLevel: string;
  binCode: string;
  maxWeightCapacityKg: number;
  currentWeightKg: number;
  maxVolumeCapacityCbm: number;
  currentVolumeCbm: number;
  utilizationPercent: number;
  status: "Available" | "PartiallyOccupied" | "Full" | "Blocked";
  storedItems: BinStoredItem[];
}

export interface ScanResult {
  success: boolean;
  itemCode: string;
  itemName: string;
  binCode: string;
  quantityProcessed: number;
  updatedBinUtilizationPercent: number;
  message: string;
}

export function WmsManager() {
  const [bins, setBins] = useState<WarehouseBinLocation[]>([]);
  const [selectedZone, setSelectedZone] = useState<string>("All");
  const [loading, setLoading] = useState(true);

  // Scanner Terminal State
  const [scanMode, setScanMode] = useState<"putaway" | "pickpack">("putaway");
  const [scannedBarcode, setScannedBarcode] = useState<string>("SKU-MOT-100");
  const [targetBin, setTargetBin] = useState<string>("ZA-A01-R01-B01");
  const [scanQuantity, setScanQuantity] = useState<number>(5);
  const [scanning, setScanning] = useState(false);
  const [lastScanResult, setLastScanResult] = useState<ScanResult | null>(null);

  const fetchBins = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<{ success: boolean; data: WarehouseBinLocation[] }>("/inventory/wms/bins");
      if (res.data?.data) {
        setBins(res.data.data);
      }
    } catch {
      // Fallback
      setBins([
        {
          binId: "1",
          warehouseId: "1",
          warehouseName: "Central Logistics Hub",
          zoneCode: "Zone-A (Fast Movers)",
          aisleNumber: "Aisle-01",
          rackNumber: "Rack-01",
          shelfLevel: "Level-1",
          binCode: "ZA-A01-R01-B01",
          maxWeightCapacityKg: 1000,
          currentWeightKg: 375,
          maxVolumeCapacityCbm: 5,
          currentVolumeCbm: 1.8,
          utilizationPercent: 37.5,
          status: "PartiallyOccupied",
          storedItems: [
            {
              itemId: "1",
              itemCode: "SKU-MOT-100",
              itemName: "Industrial Electric Motor (7.5 kW)",
              batchNumber: "B-2026-001",
              quantity: 15,
              weightKg: 375,
            },
          ],
        },
        {
          binId: "2",
          warehouseId: "1",
          warehouseName: "Central Logistics Hub",
          zoneCode: "Zone-A (Fast Movers)",
          aisleNumber: "Aisle-01",
          rackNumber: "Rack-01",
          shelfLevel: "Level-2",
          binCode: "ZA-A01-R01-B02",
          maxWeightCapacityKg: 800,
          currentWeightKg: 0,
          maxVolumeCapacityCbm: 4,
          currentVolumeCbm: 0,
          utilizationPercent: 0,
          status: "Available",
          storedItems: [],
        },
        {
          binId: "3",
          warehouseId: "1",
          warehouseName: "Central Logistics Hub",
          zoneCode: "Zone-B (Heavy Bulk)",
          aisleNumber: "Aisle-03",
          rackNumber: "Rack-04",
          shelfLevel: "Level-1",
          binCode: "ZB-A03-R04-B01",
          maxWeightCapacityKg: 2500,
          currentWeightKg: 2400,
          maxVolumeCapacityCbm: 10,
          currentVolumeCbm: 9.6,
          utilizationPercent: 96.0,
          status: "Full",
          storedItems: [
            {
              itemId: "2",
              itemCode: "SKU-STEEL-BAR",
              itemName: "High-Tensile Steel Bar (12mm x 6m)",
              batchNumber: "B-2026-089",
              quantity: 80,
              weightKg: 2400,
            },
          ],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchBins();
  }, []);

  const handleExecuteScan = async (e: React.FormEvent) => {
    e.preventDefault();
    setScanning(true);
    try {
      if (scanMode === "putaway") {
        const res = await apiClient.post<{ success: boolean; data: ScanResult }>("/inventory/wms/put-away", {
          itemCode: scannedBarcode,
          binCode: targetBin,
          quantity: scanQuantity,
        });
        if (res.data?.data) {
          setLastScanResult(res.data.data);
          notifySuccess(res.data.data.message);
          void fetchBins();
        }
      } else {
        const res = await apiClient.post<{ success: boolean; data: ScanResult }>("/inventory/wms/pick-pack", {
          itemCode: scannedBarcode,
          binCode: targetBin,
          quantity: scanQuantity,
          packNumber: "BOX-01",
        });
        if (res.data?.data) {
          setLastScanResult(res.data.data);
          notifySuccess(res.data.data.message);
          void fetchBins();
        }
      }
    } catch {
      notifyError("Failed to execute barcode scan transaction.");
    } finally {
      setScanning(false);
    }
  };

  const filteredBins = bins.filter(
    (b) => selectedZone === "All" || b.zoneCode.toLowerCase().includes(selectedZone.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Available":
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300";
      case "Full":
        return "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300";
      default:
        return "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300";
    }
  };

  return (
    <StandardPageLayout
      title="Warehouse Management System (WMS) & Bin Locations"
      subtitle="Multi-level storage topology (Zone, Aisle, Rack, Bin), capacity utilization tracking, and barcode put-away / pick-pack terminal."
      eyebrow="Inventory & Supply Chain"
      icon="warehouse"
      meta={
        <CrudHeaderStats
          items={[
            { label: "Active Bins", value: bins.length, helper: "locations" },
            {
              label: "Available",
              value: bins.filter((b) => b.status === "Available").length,
              tone: "positive",
            },
            {
              label: "Full",
              value: bins.filter((b) => b.status === "Full").length,
              tone: "danger",
            },
          ]}
        />
      }
      actions={
        <ErpRefreshButton onClick={() => void fetchBins()} loading={loading} />
      }
    >
      {/* Main Grid: Barcode Scanner Terminal + Bin Hierarchy Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left 1 Col: Handheld Barcode Scanner Terminal */}
        <div className="space-y-4">
          <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                <Scan className="w-4 h-4" />
                <span>Handheld Barcode Terminal</span>
              </div>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
            </div>

            {/* Mode Switcher */}
            <div className="grid grid-cols-2 gap-1 bg-slate-800 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setScanMode("putaway")}
                className={`py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                  scanMode === "putaway" ? "bg-emerald-600 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                Inbound Put-Away
              </button>
              <button
                type="button"
                onClick={() => setScanMode("pickpack")}
                className={`py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                  scanMode === "pickpack" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                Outbound Pick & Pack
              </button>
            </div>

            <form onSubmit={handleExecuteScan} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 text-[11px] font-semibold mb-1">Item Barcode / SKU</label>
                <div className="relative">
                  <input
                    type="text"
                    value={scannedBarcode}
                    onChange={(e) => setScannedBarcode(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 pl-8 font-mono font-bold text-white outline-hidden"
                    placeholder="Scan SKU barcode…"
                  />
                  <QrCode className="w-4 h-4 text-slate-500 absolute left-2.5 top-2.5" />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 text-[11px] font-semibold mb-1">Target Bin Code</label>
                <input
                  type="text"
                  value={targetBin}
                  onChange={(e) => setTargetBin(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 font-mono font-bold text-white outline-hidden"
                  placeholder="e.g. ZA-A01-R01-B01"
                />
              </div>

              <div>
                <label className="block text-slate-400 text-[11px] font-semibold mb-1">Units Quantity</label>
                <input
                  type="number"
                  min={1}
                  value={scanQuantity}
                  onChange={(e) => setScanQuantity(parseInt(e.target.value) || 1)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 font-mono font-bold text-white outline-hidden"
                />
              </div>

              <button
                type="submit"
                disabled={scanning}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl transition shadow-xs flex items-center justify-center gap-2 mt-4 cursor-pointer"
              >
                <Zap className="w-4 h-4" />
                {scanning ? "Processing Scanner…" : "Confirm Scan Transaction"}
              </button>
            </form>

            {lastScanResult && (
              <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/80 space-y-1.5 text-xs">
                <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Transaction Logged</span>
                </div>
                <p className="text-slate-300 font-sans">{lastScanResult.message}</p>
                <div className="text-[11px] text-slate-400 font-mono">
                  Bin: {lastScanResult.binCode} • New Fill: {lastScanResult.updatedBinUtilizationPercent}%
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right 2 Cols: Warehouse Storage Map & Bin Utilization */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3.5">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Warehouse Bin Topology & Live Occupancy</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Volumetric fill rates, weight constraints, and batch stock mapping.</p>
              </div>

              {/* Zone Filter */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg">
                {["All", "Zone-A", "Zone-B"].map((z) => (
                  <button
                    key={z}
                    type="button"
                    onClick={() => setSelectedZone(z)}
                    className={`px-2.5 py-1 text-xs font-bold rounded-md transition cursor-pointer ${
                      selectedZone === z
                        ? "bg-blue-600 text-white shadow-2xs"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                    }`}
                  >
                    {z}
                  </button>
                ))}
              </div>
            </div>

            {/* Grid of Bins */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredBins.map((bin) => (
                <div
                  key={bin.binId}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Boxes className="w-4 h-4 text-blue-600" />
                      <span className="font-mono font-bold text-xs text-slate-900 dark:text-white">{bin.binCode}</span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${getStatusBadge(bin.status)}`}
                    >
                      {bin.status}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono flex items-center justify-between">
                    <span>{bin.zoneCode}</span>
                    <span>
                      {bin.aisleNumber} &gt; {bin.rackNumber}
                    </span>
                  </div>

                  {/* Volumetric Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-400">Volumetric Fill:</span>
                      <span className="font-bold text-slate-700 dark:text-slate-300">{bin.utilizationPercent}%</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          bin.utilizationPercent > 90
                            ? "bg-rose-500"
                            : bin.utilizationPercent > 50
                            ? "bg-blue-500"
                            : "bg-emerald-500"
                        }`}
                        style={{ width: `${bin.utilizationPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Stored Items in Bin */}
                  <div className="border-t border-slate-200 dark:border-slate-800 pt-2 space-y-1 text-xs">
                    {bin.storedItems.length > 0 ? (
                      bin.storedItems.map((it) => (
                        <div key={it.itemId} className="flex justify-between items-center text-[11px]">
                          <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[180px]">
                            {it.itemName}
                          </span>
                          <span className="font-mono font-bold text-blue-600">{it.quantity} Units</span>
                        </div>
                      ))
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">Empty Bin Location</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </StandardPageLayout>
  );
}

export default WmsManager;
