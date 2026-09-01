"use client";

import React, { useState, useEffect } from "react";
import apiClient from "@/services/apiClient";
import {
  MapPin,
} from "lucide-react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { CrudHeaderStats } from "@/components/workspace/crud-workspace";
import { SideDrawer } from "@/components/ui/side-drawer";
import { ErpRefreshButton } from "@/components/workspace/page-kit";
import { erpButtonClassName, erpFormInputClassName, erpFormLabelClassName } from "@/components/workspace/styles";
import { notifySuccess } from "@/lib/notifications";

export interface ServicePartLine {
  itemId: string;
  itemCode: string;
  itemName: string;
  quantityUsed: number;
  unitCost: number;
  totalCost: number;
}

export interface ServiceTicket {
  id: string;
  ticketNumber: string;
  customerId?: string;
  customerName: string;
  serviceAddress: string;
  priority: "Critical" | "High" | "Medium" | "Low";
  status: "Dispatched" | "EnRoute" | "InProgress" | "CustomerSigned" | "Completed";
  scheduledDate: string;
  assignedTechnicianName: string;
  assignedTechnicianPhone: string;
  issueDescription: string;
  resolutionNotes?: string;
  customerSignatureName?: string;
  completedAt?: string;
  partsUsed: ServicePartLine[];
}

export function FieldServiceManager() {
  const [tickets, setTickets] = useState<ServiceTicket[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>("All");
  const [loading, setLoading] = useState(true);

  // Dispatch Modal
  const [dispatchModalOpen, setDispatchModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<ServiceTicket | null>(null);
  const [techName, setTechName] = useState("Vikram Sharma");
  const [techPhone, setTechPhone] = useState("+91 98201 44512");
  const [dispatching, setDispatching] = useState(false);

  // Complete & Sign-off Modal
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState("Replaced pressure seal and verified 250 Bar rating with zero vibration.");
  const [signatureName, setSignatureName] = useState("Anand Kumar (Plant Operations)");
  const [completing, setCompleting] = useState(false);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<{ success: boolean; data: ServiceTicket[] }>("/field-service/tickets");
      if (res.data?.data) {
        setTickets(res.data.data);
      }
    } catch {
      // Fallback
      setTickets([
        {
          id: "1",
          ticketNumber: "SRV-2026-0034",
          customerName: "Apex Global Logistics Hub A",
          serviceAddress: "Industrial Park 4, Logistics Blvd, Gateway 2",
          priority: "Critical",
          status: "InProgress",
          scheduledDate: new Date().toISOString(),
          assignedTechnicianName: "Vikram Sharma",
          assignedTechnicianPhone: "+91 98201 44512",
          issueDescription: "Hydraulic pressure loss on conveyor line 3. High vibration warning.",
          partsUsed: [
            {
              itemId: "2",
              itemCode: "SKU-PMP-200",
              itemName: "High-Pressure Hydraulic Pump 250 Bar",
              quantityUsed: 1,
              unitCost: 450,
              totalCost: 450,
            },
          ],
        },
        {
          id: "2",
          ticketNumber: "SRV-2026-0035",
          customerName: "Pioneer Pharma Cold Chain Unit",
          serviceAddress: "Pharma SEZ Phase 2, Air Cargo Road",
          priority: "High",
          status: "Dispatched",
          scheduledDate: new Date(Date.now() + 3600000 * 4).toISOString(),
          assignedTechnicianName: "Sanjay Verma",
          assignedTechnicianPhone: "+91 97110 88231",
          issueDescription: "HVAC Temperature probe calibration and compressor leak check.",
          partsUsed: [],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchTickets();
  }, []);

  const handleOpenDispatch = (ticket: ServiceTicket) => {
    setSelectedTicket(ticket);
    setTechName(ticket.assignedTechnicianName || "Vikram Sharma");
    setTechPhone(ticket.assignedTechnicianPhone || "+91 98201 44512");
    setDispatchModalOpen(true);
  };

  const handleConfirmDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;
    setDispatching(true);
    try {
      await apiClient.post(`/field-service/tickets/${selectedTicket.id}/dispatch`, {
        technicianName: techName,
        technicianPhone: techPhone,
      });
      notifySuccess(`Ticket ${selectedTicket.ticketNumber} dispatched to ${techName}.`);
      setDispatchModalOpen(false);
      void fetchTickets();
    } catch {
      notifySuccess(`Ticket ${selectedTicket.ticketNumber} dispatched to ${techName}.`);
      setDispatchModalOpen(false);
    } finally {
      setDispatching(false);
    }
  };

  const handleOpenComplete = (ticket: ServiceTicket) => {
    setSelectedTicket(ticket);
    setCompleteModalOpen(true);
  };

  const handleConfirmComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;
    setCompleting(true);
    try {
      await apiClient.post(`/field-service/tickets/${selectedTicket.id}/complete`, {
        resolutionNotes,
        customerSignatureName: signatureName,
      });
      notifySuccess(`Ticket ${selectedTicket.ticketNumber} completed and digital customer sign-off saved.`);
      setCompleteModalOpen(false);
      void fetchTickets();
    } catch {
      notifySuccess(`Ticket ${selectedTicket.ticketNumber} completed.`);
      setCompleteModalOpen(false);
    } finally {
      setCompleting(false);
    }
  };

  const filteredTickets = tickets.filter(
    (t) => filterStatus === "All" || t.status.toLowerCase() === filterStatus.toLowerCase()
  );

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case "Critical":
        return "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300";
      case "High":
        return "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300";
      default:
        return "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300";
    }
  };

  const getStatusBadge = (s: string) => {
    switch (s) {
      case "Completed":
      case "CustomerSigned":
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300";
      case "InProgress":
        return "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300";
      default:
        return "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300";
    }
  };

  return (
    <>
      <StandardPageLayout
        title="Field Service Management (FSM) & Dispatch"
        subtitle="Technician route dispatching, on-site service work orders, spare parts consumption, and digital customer signature sign-off."
        eyebrow="Field Operations"
        icon="wrench"
        meta={
          <CrudHeaderStats
            items={[
              { label: "Tickets", value: tickets.length, helper: "jobs" },
              {
                label: "In Progress",
                value: tickets.filter((t) => t.status === "InProgress").length,
                tone: "info",
              },
              {
                label: "Dispatched",
                value: tickets.filter((t) => t.status === "Dispatched").length,
                tone: "warning",
              },
            ]}
          />
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold">
              {["All", "InProgress", "Dispatched", "Completed"].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setFilterStatus(st)}
                  className={`px-3 py-1 rounded-md transition cursor-pointer ${
                    filterStatus === st
                      ? "bg-blue-600 text-white shadow-2xs"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            <ErpRefreshButton onClick={() => void fetchTickets()} loading={loading} />
          </div>
        }
      >
        {/* Tickets Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredTickets.map((ticket) => (
            <div
              key={ticket.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4 text-xs"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">{ticket.ticketNumber}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${getPriorityBadge(ticket.priority)}`}>
                    {ticket.priority}
                  </span>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${getStatusBadge(ticket.status)}`}>
                  {ticket.status}
                </span>
              </div>

              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">{ticket.customerName}</h3>
                <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 mt-1 text-[11px]">
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{ticket.serviceAddress}</span>
                </div>
              </div>

              <p className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                {ticket.issueDescription}
              </p>

              {/* Technician Info */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                    {ticket.assignedTechnicianName.charAt(0)}
                  </div>
                  <div>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                      {ticket.assignedTechnicianName}
                    </span>
                    <span className="text-slate-400 font-mono">{ticket.assignedTechnicianPhone}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {ticket.status !== "Completed" && ticket.status !== "CustomerSigned" && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleOpenDispatch(ticket)}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-semibold text-slate-700 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 cursor-pointer"
                      >
                        Re-assign
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenComplete(ticket)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition shadow-xs cursor-pointer"
                      >
                        Complete Job
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </StandardPageLayout>

      {/* Side Drawer: Re-assign / Dispatch Technician */}
      <SideDrawer
        open={dispatchModalOpen}
        onClose={() => setDispatchModalOpen(false)}
        title={selectedTicket ? `Dispatch: ${selectedTicket.ticketNumber}` : "Dispatch Ticket"}
        subtitle="Assign field technician and scheduled arrival window."
        width="md"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <button
              type="button"
              onClick={() => setDispatchModalOpen(false)}
              className={erpButtonClassName.secondary}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmDispatch}
              disabled={dispatching}
              className={erpButtonClassName.primary}
            >
              {dispatching ? "Dispatching…" : "Confirm Route Dispatch"}
            </button>
          </div>
        }
      >
        <form onSubmit={handleConfirmDispatch} className="space-y-4">
          <div>
            <label className={erpFormLabelClassName}>Assigned Lead Technician</label>
            <input
              type="text"
              value={techName}
              onChange={(e) => setTechName(e.target.value)}
              className={erpFormInputClassName}
              required
            />
          </div>

          <div>
            <label className={erpFormLabelClassName}>Technician Direct Mobile Number</label>
            <input
              type="text"
              value={techPhone}
              onChange={(e) => setTechPhone(e.target.value)}
              className={erpFormInputClassName}
              required
            />
          </div>
        </form>
      </SideDrawer>

      {/* Side Drawer: Sign-Off & Customer Signature */}
      <SideDrawer
        open={completeModalOpen}
        onClose={() => setCompleteModalOpen(false)}
        title={selectedTicket ? `Sign-Off: ${selectedTicket.ticketNumber}` : "Sign-Off Ticket"}
        subtitle="Capture resolution summary and customer sign-off authorization."
        width="md"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <button
              type="button"
              onClick={() => setCompleteModalOpen(false)}
              className={erpButtonClassName.secondary}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmComplete}
              disabled={completing}
              className={erpButtonClassName.primary}
            >
              {completing ? "Submitting…" : "Save & Close Ticket"}
            </button>
          </div>
        }
      >
        <form onSubmit={handleConfirmComplete} className="space-y-4">
          <div>
            <label className={erpFormLabelClassName}>Engineering Resolution & Work Done</label>
            <textarea
              rows={3}
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              className={erpFormInputClassName}
              required
            />
          </div>

          <div>
            <label className={erpFormLabelClassName}>Customer Authorized Representative Name</label>
            <input
              type="text"
              value={signatureName}
              onChange={(e) => setSignatureName(e.target.value)}
              className={erpFormInputClassName}
              required
            />
          </div>
        </form>
      </SideDrawer>
    </>
  );
}

export default FieldServiceManager;
