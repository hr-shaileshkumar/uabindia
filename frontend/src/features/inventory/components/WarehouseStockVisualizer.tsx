"use client";

import React, { useState, useMemo } from "react";
import {
  Warehouse,
  Boxes,
  ArrowRightLeft,
  ArrowDownToLine,
  ArrowUpFromLine,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Layers,
  MapPin,
  TrendingUp,
  Plus,
  RefreshCw,
  QrCode,
  Tag,
  Maximize2,
} from "lucide-react";
import { notifySuccess, notifyError } from "@/lib/notifications";

export interface WarehouseLocation {
  id: string;
  name: string;
  code: string;
  city: string;
  state: string;
  capacitySqFt: number;
  occupancyPct: number;
  totalBins: number;
  activeSKUs: number;
  manager: string;
  phone: string;
}

export interface BinSlot {
  binCode: string; // e.g. A01-R02-B03
  aisle: string;
  rack: string;
  shelf: string;
  currentSKU: string;
  skuName: string;
  quantity: number;
  maxCapacity: number;
  uom: string;
  status: "NORMAL" | "NEAR_FULL" | "EMPTY" | "QUARANTINE";
}

export interface StockMovementLog {
  id: string;
  timestamp: string;
  movementType: "INWARD_GRN" | "OUTWARD_DISPATCH" | "BIN_TRANSFER" | "CYCLE_ADJUSTMENT";
  skuCode: string;
  skuName: string;
  quantity: number;
  sourceBin: string;
  targetBin: string;
  referenceNo: string;
  operator: string;
}

export const SAMPLE_WAREHOUSES: WarehouseLocation[] = [
  {
    id: "wh-1",
    name: "Bhiwandi Central Fulfillment Depot",
    code: "WH-BHW-01",
    city: "Bhiwandi, Thane",
    state: "Maharashtra",
    capacitySqFt: 85000,
    occupancyPct: 78,
    totalBins: 480,
    activeSKUs: 1420,
    manager: "Rajesh Shinde",
    phone: "+91 98201 12345",
  },
  {
    id: "wh-2",
    name: "Whitefield Regional Hub",
    code: "WH-BLR-02",
    city: "Bengaluru",
    state: "Karnataka",
    capacitySqFt: 52000,
    occupancyPct: 64,
    totalBins: 320,
    activeSKUs: 980,
    manager: "Karthik Venkatesh",
    phone: "+91 98450 67890",
  },
  {
    id: "wh-3",
    name: "Manesar Heavy Industrial Store",
    code: "WH-GUR-03",
    city: "Gurugram / Manesar",
    state: "Haryana",
    capacitySqFt: 64000,
    occupancyPct: 89,
    totalBins: 410,
    activeSKUs: 1150,
    manager: "Amitabh Verma",
    phone: "+91 98110 54321",
  },
];

export const SAMPLE_BINS: BinSlot[] = [
  { binCode: "A01-R01-S1", aisle: "A01", rack: "R01", shelf: "S1", currentSKU: "ITM-IND-01", skuName: "Industrial Servo Motor 15KW", quantity: 38, maxCapacity: 40, uom: "Nos", status: "NEAR_FULL" },
  { binCode: "A01-R01-S2", aisle: "A01", rack: "R01", shelf: "S2", currentSKU: "ITM-IND-02", skuName: "Three-Phase Induction Motor 7.5KW", quantity: 24, maxCapacity: 35, uom: "Nos", status: "NORMAL" },
  { binCode: "A01-R01-S3", aisle: "A01", rack: "R01", shelf: "S3", currentSKU: "—", skuName: "Vacant Storage Slot", quantity: 0, maxCapacity: 40, uom: "Nos", status: "EMPTY" },
  { binCode: "A01-R02-S1", aisle: "A01", rack: "R02", shelf: "S1", currentSKU: "ITM-CAB-04", skuName: "Shielded Copper Control Cable (100m)", quantity: 56, maxCapacity: 60, uom: "Roll", status: "NEAR_FULL" },
  { binCode: "A01-R02-S2", aisle: "A01", rack: "R02", shelf: "S2", currentSKU: "ITM-CAB-08", skuName: "Armored XLPE High Voltage Cable", quantity: 18, maxCapacity: 30, uom: "Roll", status: "NORMAL" },
  { binCode: "A01-R02-S3", aisle: "A01", rack: "R02", shelf: "S3", currentSKU: "ITM-DEF-99", skuName: "Damaged Cable Insulation (QA Hold)", quantity: 4, maxCapacity: 20, uom: "Roll", status: "QUARANTINE" },

  { binCode: "A02-R01-S1", aisle: "A02", rack: "R01", shelf: "S1", currentSKU: "ITM-VFD-10", skuName: "Variable Frequency Inverter Drive 22KW", quantity: 15, maxCapacity: 25, uom: "Units", status: "NORMAL" },
  { binCode: "A02-R01-S2", aisle: "A02", rack: "R01", shelf: "S2", currentSKU: "ITM-PLC-05", skuName: "Compact Modular PLC Controller CPU", quantity: 44, maxCapacity: 50, uom: "Units", status: "NEAR_FULL" },
  { binCode: "A02-R01-S3", aisle: "A02", rack: "R01", shelf: "S3", currentSKU: "—", skuName: "Vacant Storage Slot", quantity: 0, maxCapacity: 30, uom: "Units", status: "EMPTY" },
  { binCode: "A02-R02-S1", aisle: "A02", rack: "R02", shelf: "S1", currentSKU: "ITM-BRG-77", skuName: "High Precision Taper Roller Bearings", quantity: 120, maxCapacity: 150, uom: "Sets", status: "NORMAL" },
  { binCode: "A02-R02-S2", aisle: "A02", rack: "R02", shelf: "S2", currentSKU: "ITM-SEN-12", skuName: "Photoelectric Optical Distance Sensor", quantity: 82, maxCapacity: 100, uom: "Nos", status: "NORMAL" },
  { binCode: "A02-R02-S3", aisle: "A02", rack: "R02", shelf: "S3", currentSKU: "ITM-SEN-14", skuName: "Ultrasonic Proximity Sensor Probe", quantity: 95, maxCapacity: 100, uom: "Nos", status: "NEAR_FULL" },
];

export const INITIAL_MOVEMENTS: StockMovementLog[] = [
  {
    id: "mov-1",
    timestamp: "Today, 11:24 AM",
    movementType: "INWARD_GRN",
    skuCode: "ITM-IND-01",
    skuName: "Industrial Servo Motor 15KW",
    quantity: 10,
    sourceBin: "RECEIVING DOCK #2",
    targetBin: "A01-R01-S1",
    referenceNo: "GRN-2026-8812",
    operator: "Sunil Patil",
  },
  {
    id: "mov-2",
    timestamp: "Today, 10:15 AM",
    movementType: "OUTWARD_DISPATCH",
    skuCode: "ITM-CAB-04",
    skuName: "Shielded Copper Control Cable (100m)",
    quantity: 12,
    sourceBin: "A01-R02-S1",
    targetBin: "DISPATCH DOCK #1",
    referenceNo: "SO-2026-9041",
    operator: "Mahesh Rao",
  },
  {
    id: "mov-3",
    timestamp: "Yesterday, 04:45 PM",
    movementType: "BIN_TRANSFER",
    skuCode: "ITM-PLC-05",
    skuName: "Compact Modular PLC Controller CPU",
    quantity: 8,
    sourceBin: "STAGING-01",
    targetBin: "A02-R01-S2",
    referenceNo: "INT-TRF-003",
    operator: "Sunil Patil",
  },
  {
    id: "mov-4",
    timestamp: "Yesterday, 02:30 PM",
    movementType: "CYCLE_ADJUSTMENT",
    skuCode: "ITM-DEF-99",
    skuName: "Damaged Cable Insulation (QA Hold)",
    quantity: 4,
    sourceBin: "A01-R02-S1",
    targetBin: "A01-R02-S3 (QA HOLD)",
    referenceNo: "QA-INSP-2026",
    operator: "QA Lead Ramesh",
  },
];

export function WarehouseStockVisualizer() {
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>("wh-1");
  const [selectedBin, setSelectedBin] = useState<BinSlot | null>(SAMPLE_BINS[0]);
  const [filterAisle, setFilterAisle] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [transferModalOpen, setTransferModalOpen] = useState(false);

  const currentWarehouse = useMemo(() => {
    return SAMPLE_WAREHOUSES.find((w) => w.id === selectedWarehouseId) || SAMPLE_WAREHOUSES[0];
  }, [selectedWarehouseId]);

  const filteredBins = useMemo(() => {
    return SAMPLE_BINS.filter((b) => {
      const matchAisle = filterAisle === "ALL" || b.aisle === filterAisle;
      const matchSearch =
        b.binCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.currentSKU.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.skuName.toLowerCase().includes(searchQuery.toLowerCase());
      return matchAisle && matchSearch;
    });
  }, [filterAisle, searchQuery]);

  const handleSimulateTransfer = () => {
    notifySuccess(`Stock transfer successfully initiated for Bin ${selectedBin?.binCode}.`);
    setTransferModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Warehouse Selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card border border-border/70 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
            <Warehouse className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-foreground">
                Enterprise Warehouse & Bin Stock Visualizer
              </h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                WMS Live Hub
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              3D Aisle-Rack-Shelf spatial bin locator, real-time SKU occupancy, and stock movement telemetry
            </p>
          </div>
        </div>

        {/* Warehouse Dropdown */}
        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-muted-foreground whitespace-nowrap">
            Active Warehouse:
          </label>
          <select
            value={selectedWarehouseId}
            onChange={(e) => setSelectedWarehouseId(e.target.value)}
            className="text-xs font-semibold px-3 py-2 rounded-xl border border-input bg-background focus:ring-1 focus:ring-primary outline-hidden"
          >
            {SAMPLE_WAREHOUSES.map((wh) => (
              <option key={wh.id} value={wh.id}>
                {wh.name} ({wh.code})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Warehouse Metrics Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-card border border-border/70 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>Spatial Occupancy</span>
            <Boxes className="w-4 h-4 text-primary" />
          </div>
          <div className="text-2xl font-black text-foreground mt-2">
            {currentWarehouse.occupancyPct}%
          </div>
          <div className="w-full bg-muted rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className={`h-full rounded-full ${
                currentWarehouse.occupancyPct > 85 ? "bg-rose-500" : "bg-primary"
              }`}
              style={{ width: `${currentWarehouse.occupancyPct}%` }}
            ></div>
          </div>
          <div className="text-[11px] text-muted-foreground mt-1.5">
            {currentWarehouse.capacitySqFt.toLocaleString()} sq ft usable area
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border/70 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>Configured Bins</span>
            <Layers className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-foreground mt-2">
            {currentWarehouse.totalBins}
          </div>
          <div className="text-[11px] text-muted-foreground mt-1.5 flex items-center gap-1">
            <span className="text-emerald-600 font-semibold">392 Occupied</span> • 88 Empty Slots
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border/70 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>Active SKU Lines</span>
            <Tag className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-foreground mt-2">
            {currentWarehouse.activeSKUs}
          </div>
          <div className="text-[11px] text-muted-foreground mt-1.5">
            Tracked with batch & serial numbers
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border/70 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>Operations Manager</span>
            <MapPin className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-sm font-bold text-foreground mt-2 truncate">
            {currentWarehouse.manager}
          </div>
          <div className="text-[11px] text-muted-foreground mt-1">
            {currentWarehouse.city}, {currentWarehouse.state}
          </div>
        </div>
      </div>

      {/* Main Grid & Bin Details Split Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Interactive Bin Matrix */}
        <div className="lg:col-span-2 bg-card border border-border/70 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-border/80">
            <div>
              <h2 className="text-sm font-bold text-foreground">Spatial Bin Matrix (Aisle / Rack / Shelf)</h2>
              <p className="text-xs text-muted-foreground">
                Click any storage cell to view item telemetry and trigger stock transfer
              </p>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              {/* Filter Aisle */}
              <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl text-xs">
                {(["ALL", "A01", "A02"] as const).map((a) => (
                  <button
                    key={a}
                    onClick={() => setFilterAisle(a)}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                      filterAisle === a
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {a === "ALL" ? "All Aisles" : `Aisle ${a}`}
                  </button>
                ))}
              </div>

              {/* Search */}
              <input
                type="text"
                placeholder="Search Bin or SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="text-xs px-3 py-1.5 rounded-xl border border-input bg-background w-36 outline-hidden focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 text-xs flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-emerald-500/20 border border-emerald-500/40"></span>
              <span className="text-muted-foreground">Normal Capacity</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-amber-500/20 border border-amber-500/40"></span>
              <span className="text-muted-foreground">Near Full (&gt;85%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-muted border border-border"></span>
              <span className="text-muted-foreground">Empty Slot</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-rose-500/20 border border-rose-500/40"></span>
              <span className="text-muted-foreground">Quarantine / QC Hold</span>
            </div>
          </div>

          {/* Grid of Bins */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-2">
            {filteredBins.map((bin) => {
              const isSelected = selectedBin?.binCode === bin.binCode;
              const fillPct = Math.round((bin.quantity / bin.maxCapacity) * 100);

              let statusClasses = "bg-muted/40 border-border/80 hover:border-primary/50";
              if (bin.status === "NEAR_FULL") {
                statusClasses = "bg-amber-500/10 border-amber-500/30 hover:border-amber-500";
              } else if (bin.status === "NORMAL") {
                statusClasses = "bg-emerald-500/10 border-emerald-500/30 hover:border-emerald-500";
              } else if (bin.status === "QUARANTINE") {
                statusClasses = "bg-rose-500/10 border-rose-500/30 hover:border-rose-500";
              }

              return (
                <div
                  key={bin.binCode}
                  onClick={() => setSelectedBin(bin)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${statusClasses} ${
                    isSelected ? "ring-2 ring-primary shadow-sm scale-[1.02]" : ""
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono text-xs font-bold text-foreground">
                      {bin.binCode}
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-sm bg-background border border-border">
                      {fillPct}%
                    </span>
                  </div>

                  <div className="text-[11px] font-medium text-foreground truncate" title={bin.skuName}>
                    {bin.status === "EMPTY" ? "Vacant Slot" : bin.skuName}
                  </div>

                  <div className="text-[10px] text-muted-foreground mt-1 flex justify-between">
                    <span>{bin.currentSKU}</span>
                    <span className="font-semibold text-foreground">
                      {bin.quantity} / {bin.maxCapacity} {bin.uom}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-background rounded-full h-1 mt-2 overflow-hidden border border-border/50">
                    <div
                      className={`h-full rounded-full ${
                        bin.status === "QUARANTINE"
                          ? "bg-rose-500"
                          : bin.status === "NEAR_FULL"
                          ? "bg-amber-500"
                          : "bg-emerald-500"
                      }`}
                      style={{ width: `${fillPct}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Col: Selected Bin Detail Card & Quick Transfer Action */}
        <div className="space-y-4">
          {selectedBin ? (
            <div className="bg-card border border-border/70 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-border/80 pb-3">
                <div className="flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-primary" />
                  <div>
                    <h3 className="text-sm font-bold text-foreground">Bin Telemetry</h3>
                    <div className="font-mono text-xs text-primary font-bold">{selectedBin.binCode}</div>
                  </div>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    selectedBin.status === "NEAR_FULL"
                      ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                      : selectedBin.status === "NORMAL"
                      ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                      : selectedBin.status === "QUARANTINE"
                      ? "bg-rose-500/10 text-rose-600 border-rose-500/20"
                      : "bg-muted text-muted-foreground border-border"
                  }`}
                >
                  {selectedBin.status}
                </span>
              </div>

              <div className="space-y-2.5 text-xs">
                <div>
                  <span className="text-muted-foreground block text-[11px]">Stored SKU:</span>
                  <span className="font-bold text-foreground">{selectedBin.skuName}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border/50">
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Item Code:</span>
                    <span className="font-mono font-semibold text-foreground">{selectedBin.currentSKU}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Physical Qty:</span>
                    <span className="font-bold text-primary">
                      {selectedBin.quantity} {selectedBin.uom}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Rack Coordinates:</span>
                    <span className="font-mono text-foreground">Aisle {selectedBin.aisle} • Shelf {selectedBin.shelf}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Max Capacity:</span>
                    <span className="text-foreground">{selectedBin.maxCapacity} {selectedBin.uom}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 border-t border-border/80 space-y-2">
                <button
                  onClick={() => setTransferModalOpen(true)}
                  disabled={selectedBin.quantity === 0}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-xs"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  Transfer Stock from this Bin
                </button>
                <button
                  onClick={() => notifySuccess(`Barcode label generated for ${selectedBin.binCode}`)}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-border bg-card hover:bg-muted/70 transition-colors"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  Print Bin Barcode Label
                </button>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-muted-foreground bg-card border border-border/70 rounded-2xl">
              Select a bin from the grid to inspect details.
            </div>
          )}

          {/* Quick Transfer Dialog (Inline Preview) */}
          {transferModalOpen && (
            <div className="bg-primary/5 border border-primary/30 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <ArrowRightLeft className="w-3.5 h-3.5 text-primary" />
                  Internal Bin Relocation
                </h4>
                <button
                  onClick={() => setTransferModalOpen(false)}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  ✕
                </button>
              </div>
              <div className="text-[11px] text-muted-foreground">
                Transferring from: <span className="font-mono font-bold text-foreground">{selectedBin?.binCode}</span>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                  Target Destination Bin:
                </label>
                <select className="w-full text-xs font-semibold px-2 py-1.5 rounded-lg border border-input bg-background">
                  <option value="A01-R01-S3">A01-R01-S3 (Vacant Slot)</option>
                  <option value="A02-R01-S3">A02-R01-S3 (Vacant Slot)</option>
                  <option value="DISPATCH-DOCK-1">Dispatch Staging Dock #1</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                  Relocation Quantity:
                </label>
                <input
                  type="number"
                  defaultValue={selectedBin?.quantity}
                  max={selectedBin?.quantity}
                  min={1}
                  className="w-full text-xs px-2 py-1.5 rounded-lg border border-input bg-background"
                />
              </div>
              <button
                onClick={handleSimulateTransfer}
                className="w-full py-2 text-xs font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-xs"
              >
                Confirm Bin Transfer
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Real-Time Stock Movement Audit Trail */}
      <div className="bg-card border border-border/70 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border/80">
          <div>
            <h2 className="text-sm font-bold text-foreground">Real-Time Stock Movement & Audit Telemetry</h2>
            <p className="text-xs text-muted-foreground">
              End-to-end inbound GRN putaways, picklist dispatches, bin relocations, and QA adjustments
            </p>
          </div>
          <span className="text-xs bg-muted text-muted-foreground px-2.5 py-1 rounded-md font-semibold">
            Auto-Sync Live
          </span>
        </div>

        <div className="overflow-x-auto border border-border/80 rounded-xl">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted/60 text-muted-foreground font-semibold border-b border-border">
              <tr>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Movement Type</th>
                <th className="py-2.5 px-3">Item SKU & Name</th>
                <th className="py-2.5 px-3 text-right">Quantity</th>
                <th className="py-2.5 px-3">Source → Destination</th>
                <th className="py-2.5 px-3">Reference #</th>
                <th className="py-2.5 px-3">Operator</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {INITIAL_MOVEMENTS.map((mov) => (
                <tr key={mov.id} className="hover:bg-muted/20 transition-colors">
                  <td className="py-2.5 px-3 text-muted-foreground font-mono">{mov.timestamp}</td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        mov.movementType === "INWARD_GRN"
                          ? "bg-emerald-500/10 text-emerald-600"
                          : mov.movementType === "OUTWARD_DISPATCH"
                          ? "bg-blue-500/10 text-blue-600"
                          : mov.movementType === "BIN_TRANSFER"
                          ? "bg-purple-500/10 text-purple-600"
                          : "bg-rose-500/10 text-rose-600"
                      }`}
                    >
                      {mov.movementType.replace("_", " ")}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="font-semibold text-foreground">{mov.skuName}</div>
                    <div className="text-[11px] text-muted-foreground font-mono">{mov.skuCode}</div>
                  </td>
                  <td className="py-2.5 px-3 text-right font-bold text-foreground">
                    {mov.quantity}
                  </td>
                  <td className="py-2.5 px-3 text-muted-foreground font-mono">
                    <span className="text-foreground">{mov.sourceBin}</span> →{" "}
                    <span className="text-primary font-semibold">{mov.targetBin}</span>
                  </td>
                  <td className="py-2.5 px-3 font-mono text-muted-foreground">{mov.referenceNo}</td>
                  <td className="py-2.5 px-3 text-muted-foreground">{mov.operator}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

