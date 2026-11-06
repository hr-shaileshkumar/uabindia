"use client";

import React, { useState, useMemo } from "react";
import {
  KanbanSquare,
  TrendingUp,
  Plus,
  Search,
  Filter,
  DollarSign,
  Building2,
  Calendar,
  User,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Phone,
  Mail,
  FileText,
  ShoppingCart,
  ChevronRight,
  MoreVertical,
  Target,
} from "lucide-react";
import { notifySuccess, notifyError } from "@/lib/notifications";
import Link from "next/link";

export type DealStage =
  | "DISCOVERY"
  | "DEMO_EVALUATION"
  | "PROPOSAL_QUOTE"
  | "NEGOTIATION"
  | "CLOSED_WON"
  | "CLOSED_LOST";

export interface DealItem {
  id: string;
  title: string;
  customerName: string;
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
  dealValue: number;
  stage: DealStage;
  winProbabilityPct: number;
  expectedCloseDate: string;
  owner: string;
  industry: string;
  priority: "High" | "Medium" | "Urgent";
  notes: string;
}

export const STAGES_CONFIG: { id: DealStage; label: string; probDefault: number; color: string; border: string }[] = [
  { id: "DISCOVERY", label: "Lead Discovery", probDefault: 10, color: "bg-blue-500/10 text-blue-600", border: "border-blue-500/30" },
  { id: "DEMO_EVALUATION", label: "Product Demo & POC", probDefault: 35, color: "bg-indigo-500/10 text-indigo-600", border: "border-indigo-500/30" },
  { id: "PROPOSAL_QUOTE", label: "Proposal / Quoted", probDefault: 60, color: "bg-purple-500/10 text-purple-600", border: "border-purple-500/30" },
  { id: "NEGOTIATION", label: "Legal & Negotiation", probDefault: 85, color: "bg-amber-500/10 text-amber-600", border: "border-amber-500/30" },
  { id: "CLOSED_WON", label: "Closed Won", probDefault: 100, color: "bg-emerald-500/10 text-emerald-600", border: "border-emerald-500/30" },
  { id: "CLOSED_LOST", label: "Closed Lost", probDefault: 0, color: "bg-rose-500/10 text-rose-600", border: "border-rose-500/30" },
];

export const INITIAL_DEALS: DealItem[] = [
  {
    id: "deal-1",
    title: "Enterprise ERP & HRMS Rollout",
    customerName: "Bharat Heavy Electricals Ltd (BHEL)",
    contactPerson: "Arun K. Sharma (VP Operations)",
    contactEmail: "arun.sharma@bhel.co.in",
    contactPhone: "+91 98201 55432",
    dealValue: 4850000,
    stage: "NEGOTIATION",
    winProbabilityPct: 85,
    expectedCloseDate: "2026-11-15",
    owner: "Rohan Varma",
    industry: "Heavy Engineering & Manufacturing",
    priority: "Urgent",
    notes: "Commercial negotiation in final legal review with CFO. Requested payment terms Net 45.",
  },
  {
    id: "deal-2",
    title: "Autonomous Fleet Telematics & WMS",
    customerName: "Apex Global Infotech Logistics",
    contactPerson: "Siddharth Sen (Director Supply Chain)",
    contactEmail: "ssen@apexglobal.com",
    contactPhone: "+91 98110 99887",
    dealValue: 2400000,
    stage: "PROPOSAL_QUOTE",
    winProbabilityPct: 60,
    expectedCloseDate: "2026-11-22",
    owner: "Pooja Hegde",
    industry: "Logistics & Supply Chain",
    priority: "High",
    notes: "Submitted proposal for 150 fleet tracking units + Bhiwandi warehouse WMS integration.",
  },
  {
    id: "deal-3",
    title: "Smart Factory IoT Sensors & Edge Gateways",
    customerName: "Mahindra Heavy Precision Castings",
    contactPerson: "Rajesh Nambiar (Plant Head Pune)",
    contactEmail: "nambiar.r@mahindra.com",
    contactPhone: "+91 98450 11223",
    dealValue: 3150000,
    stage: "DEMO_EVALUATION",
    winProbabilityPct: 35,
    expectedCloseDate: "2026-12-05",
    owner: "Rohan Varma",
    industry: "Automotive Precision",
    priority: "High",
    notes: "Live hardware demonstration scheduled on shop-floor milling stations next Tuesday.",
  },
  {
    id: "deal-4",
    title: "Corporate Accounting & GST E-Invoicing Cloud",
    customerName: "Zenith Retail & FMCG Distributors",
    contactPerson: "Meera Nair (Finance Controller)",
    contactEmail: "mnair@zenithfmcg.in",
    contactPhone: "+91 98230 44556",
    dealValue: 1250000,
    stage: "DISCOVERY",
    winProbabilityPct: 15,
    expectedCloseDate: "2026-12-20",
    owner: "Ananya Roy",
    industry: "FMCG Distribution",
    priority: "Medium",
    notes: "Initial requirement gathering for 12 branch locations in Western Region.",
  },
  {
    id: "deal-5",
    title: "Turnkey Servo Drive Systems Supply Contract",
    customerName: "Godrej Advanced Automation Division",
    contactPerson: "Vikram Malhotra (GM Procurement)",
    contactEmail: "v.malhotra@godrej.com",
    contactPhone: "+91 98330 77889",
    dealValue: 6200000,
    stage: "CLOSED_WON",
    winProbabilityPct: 100,
    expectedCloseDate: "2026-10-28",
    owner: "Rohan Varma",
    industry: "Industrial Automation",
    priority: "High",
    notes: "Purchase order received! Ready for production dispatch & tax invoice creation.",
  },
];

export function CrmDealPipelineStudio() {
  const [deals, setDeals] = useState<DealItem[]>(INITIAL_DEALS);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOwner, setSelectedOwner] = useState("ALL");
  const [activeDealModal, setActiveDealModal] = useState<DealItem | null>(null);
  const [newDealOpen, setNewDealOpen] = useState(false);

  // Pipeline Metrics
  const totalPipelineValue = useMemo(() => {
    return deals
      .filter((d) => d.stage !== "CLOSED_LOST")
      .reduce((sum, d) => sum + d.dealValue, 0);
  }, [deals]);

  const weightedForecast = useMemo(() => {
    return deals
      .filter((d) => d.stage !== "CLOSED_LOST")
      .reduce((sum, d) => sum + d.dealValue * (d.winProbabilityPct / 100), 0);
  }, [deals]);

  const wonDealsValue = useMemo(() => {
    return deals
      .filter((d) => d.stage === "CLOSED_WON")
      .reduce((sum, d) => sum + d.dealValue, 0);
  }, [deals]);

  // Filtered Deals
  const filteredDeals = useMemo(() => {
    return deals.filter((d) => {
      const matchOwner = selectedOwner === "ALL" || d.owner === selectedOwner;
      const matchSearch =
        d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.contactPerson.toLowerCase().includes(searchQuery.toLowerCase());
      return matchOwner && matchSearch;
    });
  }, [deals, selectedOwner, searchQuery]);

  // Stage Advancement Handler
  const handleMoveStage = (dealId: string, nextStage: DealStage) => {
    setDeals((prev) =>
      prev.map((d) => {
        if (d.id !== dealId) return d;
        const config = STAGES_CONFIG.find((s) => s.id === nextStage);
        return {
          ...d,
          stage: nextStage,
          winProbabilityPct: config ? config.probDefault : d.winProbabilityPct,
        };
      })
    );
    notifySuccess(`Deal moved to ${STAGES_CONFIG.find((s) => s.id === nextStage)?.label}`);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Navigation & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card border border-border/70 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-violet-500/10 text-violet-600 flex items-center justify-center font-bold">
            <KanbanSquare className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-foreground">
                Enterprise Deal Pipeline & Customer 360 Studio
              </h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-violet-500/10 text-violet-600 border border-violet-500/20">
                Sales CRM
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Visual stage-gate opportunity progression, weighted revenue forecasting, and 1-click conversion to Sales Orders
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setNewDealOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            Create Opportunity Deal
          </button>
        </div>
      </div>

      {/* KPI Forecast Header Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-card border border-border/70 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>Total Pipeline Value</span>
            <Target className="w-4 h-4 text-violet-500" />
          </div>
          <div className="text-2xl font-black text-foreground mt-2">
            {formatCurrency(totalPipelineValue)}
          </div>
          <div className="text-[11px] text-muted-foreground mt-1">
            {deals.filter((d) => d.stage !== "CLOSED_LOST").length} active opportunities
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border/70 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>Probability-Weighted Forecast</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
            {formatCurrency(weightedForecast)}
          </div>
          <div className="text-[11px] text-muted-foreground mt-1">
            Expected revenue realization
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border/70 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>Closed Won (MTD)</span>
            <CheckCircle2 className="w-4 h-4 text-primary" />
          </div>
          <div className="text-2xl font-black text-primary mt-2">
            {formatCurrency(wonDealsValue)}
          </div>
          <div className="text-[11px] text-muted-foreground mt-1">
            Converted to active contracts
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border/70 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>Win Conversion Rate</span>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-foreground mt-2">
            42.8%
          </div>
          <div className="text-[11px] text-muted-foreground mt-1">
            +5.4% vs industry baseline
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card border border-border/70 rounded-2xl p-4 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search deal name, client or contact..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-input bg-background focus:ring-1 focus:ring-primary outline-hidden"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <label className="text-xs font-semibold text-muted-foreground">Deal Owner:</label>
          <select
            value={selectedOwner}
            onChange={(e) => setSelectedOwner(e.target.value)}
            className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-input bg-background focus:ring-1 focus:ring-primary outline-hidden"
          >
            <option value="ALL">All Sales Execs</option>
            <option value="Rohan Varma">Rohan Varma</option>
            <option value="Pooja Hegde">Pooja Hegde</option>
            <option value="Ananya Roy">Ananya Roy</option>
          </select>
        </div>
      </div>

      {/* Kanban Board Stage Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-3.5 overflow-x-auto pb-4">
        {STAGES_CONFIG.map((stage) => {
          const stageDeals = filteredDeals.filter((d) => d.stage === stage.id);
          const stageTotalValue = stageDeals.reduce((sum, d) => sum + d.dealValue, 0);

          return (
            <div
              key={stage.id}
              className="bg-card/70 border border-border/70 rounded-2xl p-3.5 flex flex-col min-w-[240px] shadow-2xs"
            >
              {/* Stage Header */}
              <div className="flex items-center justify-between border-b border-border/70 pb-2.5 mb-3">
                <div>
                  <h3 className="text-xs font-bold text-foreground truncate">{stage.label}</h3>
                  <div className="text-[11px] font-semibold text-primary">
                    {formatCurrency(stageTotalValue)}
                  </div>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-muted text-foreground">
                  {stageDeals.length}
                </span>
              </div>

              {/* Deal Cards */}
              <div className="space-y-3 flex-1">
                {stageDeals.map((deal) => (
                  <div
                    key={deal.id}
                    onClick={() => setActiveDealModal(deal)}
                    className="p-3 rounded-xl border border-border/80 bg-background hover:border-primary/50 hover:shadow-xs transition-all cursor-pointer space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-1">
                      <span className="text-xs font-bold text-foreground line-clamp-2">
                        {deal.title}
                      </span>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded-sm shrink-0 ${
                          deal.priority === "Urgent"
                            ? "bg-rose-500/10 text-rose-600"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {deal.priority}
                      </span>
                    </div>

                    <div className="text-[11px] font-medium text-muted-foreground flex items-center gap-1 truncate">
                      <Building2 className="w-3 h-3 shrink-0 text-primary" />
                      <span className="truncate">{deal.customerName}</span>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-border/50 text-[11px]">
                      <span className="font-extrabold text-foreground">
                        {formatCurrency(deal.dealValue)}
                      </span>
                      <span className="font-semibold text-muted-foreground bg-muted px-1.5 py-0.5 rounded-sm text-[10px]">
                        {deal.winProbabilityPct}%
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {deal.expectedCloseDate}
                      </span>
                      <span className="font-medium text-foreground">{deal.owner}</span>
                    </div>

                    {/* Quick Move Step Controls */}
                    <div
                      className="pt-1.5 border-t border-border/40 flex items-center justify-between gap-1 text-[10px]"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {stage.id !== "CLOSED_WON" && (
                        <button
                          onClick={() => {
                            const currentIndex = STAGES_CONFIG.findIndex((s) => s.id === stage.id);
                            if (currentIndex < STAGES_CONFIG.length - 2) {
                              handleMoveStage(deal.id, STAGES_CONFIG[currentIndex + 1].id);
                            } else {
                              handleMoveStage(deal.id, "CLOSED_WON");
                            }
                          }}
                          className="w-full text-center py-1 rounded-md bg-primary/10 text-primary font-semibold hover:bg-primary/20 transition-colors"
                        >
                          Advance Step →
                        </button>
                      )}

                      {stage.id === "CLOSED_WON" && (
                        <Link
                          href="/sales/orders"
                          className="w-full text-center py-1 rounded-md bg-emerald-500/10 text-emerald-600 font-semibold hover:bg-emerald-500/20 transition-colors flex items-center justify-center gap-1"
                        >
                          <ShoppingCart className="w-3 h-3" />
                          Create Sales Order
                        </Link>
                      )}
                    </div>
                  </div>
                ))}

                {stageDeals.length === 0 && (
                  <div className="p-4 text-center text-[11px] text-muted-foreground/60 border border-dashed border-border/60 rounded-xl">
                    No deals in this stage
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Customer 360 Dossier Modal */}
      {activeDealModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-xl w-full space-y-5 shadow-xl">
            <div className="flex items-start justify-between border-b border-border/80 pb-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-primary">
                  Customer 360 Dossier
                </span>
                <h2 className="text-lg font-bold text-foreground mt-0.5">{activeDealModal.title}</h2>
                <div className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                  <Building2 className="w-3.5 h-3.5 text-primary" />
                  <span className="font-semibold text-foreground">{activeDealModal.customerName}</span>
                  <span>•</span>
                  <span>{activeDealModal.industry}</span>
                </div>
              </div>
              <button
                onClick={() => setActiveDealModal(null)}
                className="text-xs font-semibold text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 rounded-xl bg-muted/40 border border-border/60">
                <span className="text-[11px] text-muted-foreground block">Commercial Deal Value:</span>
                <span className="text-base font-extrabold text-foreground">
                  {formatCurrency(activeDealModal.dealValue)}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-muted/40 border border-border/60">
                <span className="text-[11px] text-muted-foreground block">Win Probability:</span>
                <span className="text-base font-extrabold text-primary">
                  {activeDealModal.winProbabilityPct}%
                </span>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <h4 className="font-bold text-foreground">Key Decision Maker & Contact:</h4>
              <div className="p-3 rounded-xl border border-border/70 space-y-1.5 bg-background">
                <div className="font-semibold text-foreground flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-primary" />
                  {activeDealModal.contactPerson}
                </div>
                <div className="flex items-center gap-4 text-muted-foreground text-[11px]">
                  <span className="flex items-center gap-1">
                    <Mail className="w-3 h-3 text-muted-foreground" />
                    {activeDealModal.contactEmail}
                  </span>
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3 text-muted-foreground" />
                    {activeDealModal.contactPhone}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-1.5 text-xs">
              <h4 className="font-bold text-foreground">Account Notes & Strategy:</h4>
              <p className="text-muted-foreground bg-muted/30 p-3 rounded-xl border border-border/50 text-[11px]">
                {activeDealModal.notes}
              </p>
            </div>

            {/* Modal Bottom Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-border/80">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    handleMoveStage(activeDealModal.id, "CLOSED_WON");
                    setActiveDealModal(null);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-xs"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Mark as Won
                </button>
                <button
                  onClick={() => {
                    handleMoveStage(activeDealModal.id, "CLOSED_LOST");
                    setActiveDealModal(null);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-rose-500/30 text-rose-600 hover:bg-rose-500/10 transition-colors"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  Mark Lost
                </button>
              </div>

              <Link
                href="/sales/orders"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-xs"
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                Proceed to Sales Order Studio
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* New Deal Creation Modal */}
      {newDealOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-border/80 pb-3">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Plus className="w-4 h-4 text-primary" />
                Create New Opportunity Deal
              </h3>
              <button
                onClick={() => setNewDealOpen(false)}
                className="text-xs text-muted-foreground hover:text-foreground font-semibold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-muted-foreground block mb-1">Opportunity Title:</label>
                <input
                  type="text"
                  placeholder="e.g. Annual Fleet Maintenance & Telematics Contract"
                  className="w-full px-3 py-2 rounded-xl border border-input bg-background font-semibold"
                />
              </div>

              <div>
                <label className="font-semibold text-muted-foreground block mb-1">Customer Account:</label>
                <input
                  type="text"
                  placeholder="e.g. Larsen & Toubro Construction Ltd"
                  className="w-full px-3 py-2 rounded-xl border border-input bg-background"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-muted-foreground block mb-1">Deal Value (INR):</label>
                  <input
                    type="number"
                    defaultValue={1500000}
                    step="50000"
                    className="w-full px-3 py-2 rounded-xl border border-input bg-background font-semibold"
                  />
                </div>
                <div>
                  <label className="font-semibold text-muted-foreground block mb-1">Target Close Date:</label>
                  <input
                    type="date"
                    defaultValue={new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0]}
                    className="w-full px-3 py-2 rounded-xl border border-input bg-background"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-muted-foreground block mb-1">Initial Stage:</label>
                  <select className="w-full px-3 py-2 rounded-xl border border-input bg-background font-medium">
                    <option value="DISCOVERY">Lead Discovery (10%)</option>
                    <option value="DEMO_EVALUATION">Product Demo & POC (35%)</option>
                    <option value="PROPOSAL_QUOTE">Proposal / Quoted (60%)</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-muted-foreground block mb-1">Assigned Sales Owner:</label>
                  <select className="w-full px-3 py-2 rounded-xl border border-input bg-background font-medium">
                    <option value="Rohan Varma">Rohan Varma</option>
                    <option value="Pooja Hegde">Pooja Hegde</option>
                    <option value="Ananya Roy">Ananya Roy</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-border/80">
              <button
                onClick={() => setNewDealOpen(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-border hover:bg-muted/70 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  notifySuccess("New Deal created and placed into pipeline.");
                  setNewDealOpen(false);
                }}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-xs"
              >
                Save Opportunity
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

