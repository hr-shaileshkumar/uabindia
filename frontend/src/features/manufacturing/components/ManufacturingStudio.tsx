"use client";

import React, { useState, useMemo } from "react";
import {
  Cpu,
  Layers,
  Wrench,
  Play,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Plus,
  Search,
  Filter,
  ArrowRight,
  TrendingUp,
  FileText,
  Printer,
  Boxes,
  Activity,
  Sparkles,
  ShieldAlert,
  ChevronRight,
  CheckCircle,
} from "lucide-react";
import { notifySuccess, notifyError } from "@/lib/notifications";

export interface BomComponent {
  id: string;
  itemCode: string;
  itemName: string;
  category: "RAW_MATERIAL" | "ELECTRICAL" | "MECHANICAL" | "CONSUMABLE";
  quantityPerUnit: number;
  uom: string;
  scrapPct: number;
  unitCost: number;
  sourceBin: string; // Links to Warehouse Bin Matrix
}

export interface BomOperation {
  id: string;
  sequence: number;
  workstation: string;
  operationName: string;
  standardTimeMins: number;
  laborRatePerHour: number;
  machineRatePerHour: number;
}

export interface WorkOrder {
  id: string;
  orderNumber: string;
  productCode: string;
  productName: string;
  batchQuantity: number;
  completedQuantity: number;
  scrapQuantity: number;
  status: "Draft" | "Released" | "In Production" | "QA Testing" | "Completed";
  priority: "High" | "Medium" | "Urgent";
  targetDate: string;
  currentWorkstation: string;
  assignedSupervisor: string;
  plantLocation: string;
}

export const SAMPLE_BOM_COMPONENTS: BomComponent[] = [
  { id: "c1", itemCode: "RAW-ALU-6061", itemName: "Aviation-Grade Billet Aluminum 6061-T6", category: "RAW_MATERIAL", quantityPerUnit: 2.4, uom: "Kg", scrapPct: 3, unitCost: 380, sourceBin: "A01-R01-S1" },
  { id: "c2", itemCode: "MAG-NDFEB-42", itemName: "Neodymium Rare Earth Magnets N42SH", category: "RAW_MATERIAL", quantityPerUnit: 16, uom: "Nos", scrapPct: 1, unitCost: 220, sourceBin: "A01-R01-S2" },
  { id: "c3", itemCode: "ELE-ENC-4096", itemName: "High-Resolution Optical Rotary Encoder (4096 PPR)", category: "ELECTRICAL", quantityPerUnit: 1, uom: "Unit", scrapPct: 0, unitCost: 4500, sourceBin: "A02-R01-S2" },
  { id: "c4", itemCode: "ITM-CAB-04", itemName: "Shielded Copper Control Cable (Heat Resistant)", category: "ELECTRICAL", quantityPerUnit: 3.5, uom: "Mtr", scrapPct: 2, unitCost: 85, sourceBin: "A01-R02-S1" },
  { id: "c5", itemCode: "ITM-BRG-77", itemName: "High Precision Taper Roller Bearings (NSK/SKF)", category: "MECHANICAL", quantityPerUnit: 2, uom: "Sets", scrapPct: 0, unitCost: 1450, sourceBin: "A02-R02-S1" },
  { id: "c6", itemCode: "MEC-FST-M6", itemName: "Grade 10.9 Zinc Coated Hex Fasteners M6x25", category: "CONSUMABLE", quantityPerUnit: 24, uom: "Nos", scrapPct: 5, unitCost: 8, sourceBin: "A02-R02-S2" },
];

export const SAMPLE_BOM_OPERATIONS: BomOperation[] = [
  { id: "op-10", sequence: 10, workstation: "CNC 5-Axis Milling Center #3", operationName: "Stator & Rotor Core Precision Machining", standardTimeMins: 45, laborRatePerHour: 450, machineRatePerHour: 800 },
  { id: "op-20", sequence: 20, workstation: "Automated Winding Station #1", operationName: "Copper Coil Winding & Varnish Impregnation", standardTimeMins: 30, laborRatePerHour: 350, machineRatePerHour: 600 },
  { id: "op-30", sequence: 30, workstation: "Mechanical Integration Cell #2", operationName: "Shaft, Bearings & Encoder Assembly", standardTimeMins: 40, laborRatePerHour: 400, machineRatePerHour: 250 },
  { id: "op-40", sequence: 40, workstation: "QA Dynamometer Testing Bay", operationName: "Full Load Torque, Back-EMF & Insulation QA", standardTimeMins: 25, laborRatePerHour: 500, machineRatePerHour: 750 },
];

export const INITIAL_WORK_ORDERS: WorkOrder[] = [
  {
    id: "wo-1",
    orderNumber: "WO-2026-0811",
    productCode: "FG-IND-SERVO-15K",
    productName: "Heavy-Duty Industrial Servo Motor 15KW",
    batchQuantity: 50,
    completedQuantity: 35,
    scrapQuantity: 1,
    status: "In Production",
    priority: "Urgent",
    targetDate: "2026-11-08",
    currentWorkstation: "Mechanical Integration Cell #2",
    assignedSupervisor: "Ramanathan Iyer",
    plantLocation: "Pune Manufacturing Plant 1",
  },
  {
    id: "wo-2",
    orderNumber: "WO-2026-0812",
    productCode: "FG-PLC-CPU-MOD",
    productName: "Compact Modular PLC Controller CPU 24V",
    batchQuantity: 100,
    completedQuantity: 92,
    scrapQuantity: 2,
    status: "QA Testing",
    priority: "High",
    targetDate: "2026-11-05",
    currentWorkstation: "QA Dynamometer Testing Bay",
    assignedSupervisor: "Sanjay Deshmukh",
    plantLocation: "Pune Manufacturing Plant 1",
  },
  {
    id: "wo-3",
    orderNumber: "WO-2026-0813",
    productCode: "FG-VFD-INV-22K",
    productName: "Variable Frequency Inverter Drive 22KW",
    batchQuantity: 30,
    completedQuantity: 0,
    scrapQuantity: 0,
    status: "Released",
    priority: "Medium",
    targetDate: "2026-11-14",
    currentWorkstation: "CNC 5-Axis Milling Center #3",
    assignedSupervisor: "Vikas Patil",
    plantLocation: "Bengaluru Production Depot",
  },
  {
    id: "wo-4",
    orderNumber: "WO-2026-0814",
    productCode: "FG-IND-SERVO-15K",
    productName: "Heavy-Duty Industrial Servo Motor 15KW",
    batchQuantity: 25,
    completedQuantity: 25,
    scrapQuantity: 0,
    status: "Completed",
    priority: "High",
    targetDate: "2026-10-30",
    currentWorkstation: "Finished Goods Staging",
    assignedSupervisor: "Ramanathan Iyer",
    plantLocation: "Pune Manufacturing Plant 1",
  },
];

export function ManufacturingStudio() {
  const [activeTab, setActiveTab] = useState<"WORK_ORDERS" | "BOM_STUDIO">("WORK_ORDERS");
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>(INITIAL_WORK_ORDERS);
  const [components, setComponents] = useState<BomComponent[]>(SAMPLE_BOM_COMPONENTS);
  const [operations, setOperations] = useState<BomOperation[]>(SAMPLE_BOM_OPERATIONS);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // BOM Costing Calculations
  const totalMaterialCost = useMemo(() => {
    return components.reduce((sum, item) => {
      const grossQty = item.quantityPerUnit * (1 + item.scrapPct / 100);
      return sum + grossQty * item.unitCost;
    }, 0);
  }, [components]);

  const totalOperationCost = useMemo(() => {
    return operations.reduce((sum, op) => {
      const hours = op.standardTimeMins / 60;
      const ratePerHour = op.laborRatePerHour + op.machineRatePerHour;
      return sum + hours * ratePerHour;
    }, 0);
  }, [operations]);

  const unitManufacturingCost = useMemo(() => {
    const overheadSurcharge = 0.12 * (totalMaterialCost + totalOperationCost); // 12% factory overhead
    return totalMaterialCost + totalOperationCost + overheadSurcharge;
  }, [totalMaterialCost, totalOperationCost]);

  // Filtered Work Orders
  const filteredWorkOrders = useMemo(() => {
    return workOrders.filter((wo) => {
      const matchStatus = statusFilter === "ALL" || wo.status === statusFilter;
      const matchSearch =
        wo.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        wo.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        wo.productCode.toLowerCase().includes(searchQuery.toLowerCase());
      return matchStatus && matchSearch;
    });
  }, [workOrders, statusFilter, searchQuery]);

  // Advancement Action
  const handleAdvanceWorkOrder = (id: string) => {
    setWorkOrders((prev) =>
      prev.map((wo) => {
        if (wo.id !== id) return wo;
        if (wo.status === "Released") {
          notifySuccess(`Work Order ${wo.orderNumber} started! Workstation allocated.`);
          return { ...wo, status: "In Production" };
        }
        if (wo.status === "In Production") {
          notifySuccess(`Work Order ${wo.orderNumber} sent to QA Testing Bay.`);
          return { ...wo, status: "QA Testing", completedQuantity: wo.batchQuantity };
        }
        if (wo.status === "QA Testing") {
          notifySuccess(`Work Order ${wo.orderNumber} QA Passed! Stock putaway to Finished Goods.`);
          return { ...wo, status: "Completed", currentWorkstation: "Finished Goods Staging" };
        }
        return wo;
      })
    );
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(val);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card border border-border/70 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center font-bold">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-foreground">
                Manufacturing & Production Execution Cockpit
              </h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-rose-500/10 text-rose-600 border border-rose-500/20">
                Shop Floor MES
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Multi-level Bill of Materials (BOM) explosion, production work orders, machine routing, and finished goods putaway
            </p>
          </div>
        </div>

        {/* Tab Switcher & Create Action */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl text-xs">
            <button
              onClick={() => setActiveTab("WORK_ORDERS")}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                activeTab === "WORK_ORDERS"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Shop Floor Work Orders
            </button>
            <button
              onClick={() => setActiveTab("BOM_STUDIO")}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                activeTab === "BOM_STUDIO"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Bill of Materials (BOM)
            </button>
          </div>

          <button
            onClick={() => setCreateModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            New Work Order
          </button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-card border border-border/70 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>Open Work Orders</span>
            <Cpu className="w-4 h-4 text-primary" />
          </div>
          <div className="text-2xl font-black text-foreground mt-2">
            {workOrders.filter((w) => w.status !== "Completed").length}
          </div>
          <div className="text-[11px] text-muted-foreground mt-1">
            Across 2 manufacturing plants
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border/70 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>In Production Flow</span>
            <Activity className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-2">
            {workOrders.filter((w) => w.status === "In Production" || w.status === "QA Testing").length} Orders
          </div>
          <div className="text-[11px] text-muted-foreground mt-1">
            Active on CNC & Assembly lines
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border/70 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>Overall Equipment Efficiency</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
            88.4% OEE
          </div>
          <div className="text-[11px] text-muted-foreground mt-1">
            +3.2% vs last month target
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border/70 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>BOM Unit Cost Estimate</span>
            <Boxes className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-xl font-bold text-foreground mt-2">
            {formatCurrency(unitManufacturingCost)}
          </div>
          <div className="text-[11px] text-muted-foreground mt-1">
            Base: Servo Motor 15KW (incl. 12% OH)
          </div>
        </div>
      </div>

      {activeTab === "WORK_ORDERS" ? (
        /* Work Orders Execution Tab */
        <div className="space-y-4">
          {/* Filter & Search Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card border border-border/70 rounded-2xl p-4 shadow-xs">
            <div className="relative w-full sm:w-80">
              <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search Work Order #, product or code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-input bg-background focus:ring-1 focus:ring-primary outline-hidden"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
              {(["ALL", "Released", "In Production", "QA Testing", "Completed"] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                    statusFilter === st
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/70 text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {st === "ALL" ? "All Orders" : st}
                </button>
              ))}
            </div>
          </div>

          {/* Work Orders List */}
          <div className="grid grid-cols-1 gap-4">
            {filteredWorkOrders.map((wo) => {
              const progressPct = Math.round((wo.completedQuantity / wo.batchQuantity) * 100);
              return (
                <div
                  key={wo.id}
                  className="bg-card border border-border/70 rounded-2xl p-5 shadow-xs hover:border-primary/50 transition-all space-y-4"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-border/70 pb-3">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm font-extrabold text-foreground">
                        {wo.orderNumber}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                          wo.status === "In Production"
                            ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                            : wo.status === "QA Testing"
                            ? "bg-purple-500/10 text-purple-600 border-purple-500/20"
                            : wo.status === "Completed"
                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                            : "bg-muted text-muted-foreground border-border"
                        }`}
                      >
                        {wo.status}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          wo.priority === "Urgent"
                            ? "bg-rose-500/10 text-rose-600"
                            : wo.priority === "High"
                            ? "bg-amber-500/10 text-amber-600"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {wo.priority} Priority
                      </span>
                    </div>

                    <div className="flex items-center gap-2 self-stretch sm:self-auto">
                      <span className="text-xs text-muted-foreground">
                        Target Due: <span className="font-semibold text-foreground">{wo.targetDate}</span>
                      </span>

                      {wo.status !== "Completed" && (
                        <button
                          onClick={() => handleAdvanceWorkOrder(wo.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-xs"
                        >
                          <Play className="w-3 h-3" />
                          {wo.status === "Released"
                            ? "Start Job"
                            : wo.status === "In Production"
                            ? "Send to QA"
                            : "Pass & Putaway"}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                    <div className="md:col-span-2">
                      <div className="text-[11px] text-muted-foreground">Finished Product:</div>
                      <div className="text-sm font-bold text-foreground">{wo.productName}</div>
                      <div className="text-xs font-mono text-primary font-semibold">{wo.productCode}</div>
                    </div>

                    <div>
                      <div className="text-[11px] text-muted-foreground">Active Workstation:</div>
                      <div className="font-semibold text-foreground flex items-center gap-1.5 mt-0.5">
                        <Wrench className="w-3.5 h-3.5 text-primary" />
                        {wo.currentWorkstation}
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">
                        Supervisor: {wo.assignedSupervisor}
                      </div>
                    </div>

                    <div>
                      <div className="text-[11px] text-muted-foreground">Batch Progress:</div>
                      <div className="flex items-center justify-between text-xs font-bold text-foreground mt-0.5">
                        <span>
                          {wo.completedQuantity} / {wo.batchQuantity} Units
                        </span>
                        <span className="text-primary">{progressPct}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2 mt-1 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            wo.status === "Completed" ? "bg-emerald-500" : "bg-primary"
                          }`}
                          style={{ width: `${progressPct}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Bill of Materials (BOM) Tab */
        <div className="space-y-6">
          <div className="bg-card border border-border/70 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-border/80 pb-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-primary">Master BOM Specification</span>
                <h2 className="text-lg font-bold text-foreground">
                  Heavy-Duty Industrial Servo Motor 15KW (FG-IND-SERVO-15K)
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Multi-level component hierarchy with warehouse source bin mapping and machine workstation routing
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => notifySuccess("BOM Production Spec printed.")}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-border bg-card hover:bg-muted/70 transition-colors text-foreground"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print BOM Sheet
                </button>
              </div>
            </div>

            {/* Components Explosion Table */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  1. Component Materials & Hardware Breakdown
                </h3>
                <span className="text-xs font-bold text-foreground">
                  Sub-Total Materials: {formatCurrency(totalMaterialCost)}
                </span>
              </div>

              <div className="overflow-x-auto border border-border/80 rounded-xl">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted/60 text-muted-foreground font-semibold border-b border-border">
                    <tr>
                      <th className="py-2.5 px-3 w-10">#</th>
                      <th className="py-2.5 px-3 min-w-[200px]">Item Code & Description</th>
                      <th className="py-2.5 px-3">Classification</th>
                      <th className="py-2.5 px-3 text-right">Qty / Unit</th>
                      <th className="py-2.5 px-3 text-right">Scrap %</th>
                      <th className="py-2.5 px-3">Warehouse Bin</th>
                      <th className="py-2.5 px-3 text-right">Unit Rate (₹)</th>
                      <th className="py-2.5 px-3 text-right">Extended Cost (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {components.map((c, idx) => {
                      const grossQty = c.quantityPerUnit * (1 + c.scrapPct / 100);
                      const extCost = grossQty * c.unitCost;
                      return (
                        <tr key={c.id} className="hover:bg-muted/20 transition-colors">
                          <td className="py-2.5 px-3 text-muted-foreground">{idx + 1}</td>
                          <td className="py-2.5 px-3">
                            <div className="font-semibold text-foreground">{c.itemName}</div>
                            <div className="font-mono text-[11px] text-muted-foreground">{c.itemCode}</div>
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-muted text-foreground">
                              {c.category}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-semibold text-foreground">
                            {c.quantityPerUnit} {c.uom}
                          </td>
                          <td className="py-2.5 px-3 text-right text-muted-foreground">
                            {c.scrapPct}%
                          </td>
                          <td className="py-2.5 px-3 font-mono text-primary font-semibold">
                            {c.sourceBin}
                          </td>
                          <td className="py-2.5 px-3 text-right font-medium text-foreground">
                            {formatCurrency(c.unitCost)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-foreground">
                            {formatCurrency(extCost)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Workstation Operations Routing Table */}
            <div className="space-y-3 pt-4 border-t border-border/80">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  2. Shop-Floor Operations Routing & Labor Costs
                </h3>
                <span className="text-xs font-bold text-foreground">
                  Sub-Total Operations: {formatCurrency(totalOperationCost)}
                </span>
              </div>

              <div className="overflow-x-auto border border-border/80 rounded-xl">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted/60 text-muted-foreground font-semibold border-b border-border">
                    <tr>
                      <th className="py-2.5 px-3 w-16">Seq</th>
                      <th className="py-2.5 px-3 min-w-[220px]">Workstation Facility</th>
                      <th className="py-2.5 px-3 min-w-[240px]">Process / Operation Name</th>
                      <th className="py-2.5 px-3 text-right">Cycle Time</th>
                      <th className="py-2.5 px-3 text-right">Labor Rate/Hr</th>
                      <th className="py-2.5 px-3 text-right">Machine Rate/Hr</th>
                      <th className="py-2.5 px-3 text-right">Operation Cost (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {operations.map((op) => {
                      const hours = op.standardTimeMins / 60;
                      const opCost = hours * (op.laborRatePerHour + op.machineRatePerHour);
                      return (
                        <tr key={op.id} className="hover:bg-muted/20 transition-colors">
                          <td className="py-2.5 px-3 font-mono font-bold text-primary">{op.sequence}</td>
                          <td className="py-2.5 px-3 font-semibold text-foreground">{op.workstation}</td>
                          <td className="py-2.5 px-3 text-muted-foreground">{op.operationName}</td>
                          <td className="py-2.5 px-3 text-right font-semibold text-foreground">
                            {op.standardTimeMins} mins
                          </td>
                          <td className="py-2.5 px-3 text-right text-muted-foreground">
                            ₹{op.laborRatePerHour}/hr
                          </td>
                          <td className="py-2.5 px-3 text-right text-muted-foreground">
                            ₹{op.machineRatePerHour}/hr
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-foreground">
                            {formatCurrency(opCost)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Total Cost Summary Card */}
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="text-xs font-bold text-primary uppercase tracking-wider">
                  Total Finished Product Unit Costing
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  Calculated as: Raw Materials ({formatCurrency(totalMaterialCost)}) + Operations ({formatCurrency(totalOperationCost)}) + 12% Factory Overhead
                </div>
              </div>

              <div className="text-right self-stretch sm:self-auto">
                <div className="text-2xl font-black text-foreground">
                  {formatCurrency(unitManufacturingCost)}
                </div>
                <div className="text-[11px] text-muted-foreground">Standard Cost per Finished Unit</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Work Order Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-border/80 pb-3">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Plus className="w-4 h-4 text-primary" />
                Create Production Work Order
              </h3>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="text-xs text-muted-foreground hover:text-foreground font-semibold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-muted-foreground block mb-1">Target Product BOM:</label>
                <select className="w-full px-3 py-2 rounded-xl border border-input bg-background font-medium">
                  <option value="FG-IND-SERVO-15K">Heavy-Duty Industrial Servo Motor 15KW (BOM Rev 4)</option>
                  <option value="FG-PLC-CPU-MOD">Compact Modular PLC Controller CPU 24V (BOM Rev 2)</option>
                  <option value="FG-VFD-INV-22K">Variable Frequency Inverter Drive 22KW (BOM Rev 1)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-muted-foreground block mb-1">Batch Quantity:</label>
                  <input
                    type="number"
                    defaultValue={50}
                    min={1}
                    className="w-full px-3 py-2 rounded-xl border border-input bg-background font-semibold"
                  />
                </div>
                <div>
                  <label className="font-semibold text-muted-foreground block mb-1">Target Completion Date:</label>
                  <input
                    type="date"
                    defaultValue={new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0]}
                    className="w-full px-3 py-2 rounded-xl border border-input bg-background"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-muted-foreground block mb-1">Manufacturing Plant:</label>
                <select className="w-full px-3 py-2 rounded-xl border border-input bg-background">
                  <option value="Pune Manufacturing Plant 1">Pune Manufacturing Plant 1 (Cell A)</option>
                  <option value="Bengaluru Production Depot">Bengaluru Production Depot (Cell B)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-border/80">
              <button
                onClick={() => setCreateModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-border hover:bg-muted/70 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  notifySuccess("Work order released to shop floor successfully.");
                  setCreateModalOpen(false);
                }}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-xs"
              >
                Release Work Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

