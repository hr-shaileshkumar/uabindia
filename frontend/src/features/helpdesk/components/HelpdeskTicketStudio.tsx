"use client";

import React, { useState, useMemo } from "react";
import {
  LifeBuoy,
  Ticket,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Plus,
  Search,
  Filter,
  User,
  Building2,
  MessageSquare,
  Send,
  ArrowUpRight,
  ShieldAlert,
  Flame,
  Check,
  Tag,
  Phone,
  Mail,
  MoreVertical,
} from "lucide-react";
import { notifySuccess, notifyError } from "@/lib/notifications";

export interface SupportTicket {
  id: string;
  ticketNumber: string;
  subject: string;
  customerName: string;
  requesterName: string;
  requesterEmail: string;
  priority: "P1_CRITICAL" | "P2_HIGH" | "P3_MEDIUM" | "P4_LOW";
  category: "HARDWARE_FAILURE" | "SOFTWARE_BUG" | "INVOICE_BILLING" | "FLEET_TELEMATICS" | "TRAINING";
  status: "OPEN" | "IN_PROGRESS" | "PENDING_CUSTOMER" | "RESOLVED" | "CLOSED";
  slaDueHours: number;
  isBreached: boolean;
  assignedAgent: string;
  createdAt: string;
  description: string;
  replies: {
    id: string;
    sender: string;
    isStaff: boolean;
    timestamp: string;
    message: string;
  }[];
}

export const INITIAL_TICKETS: SupportTicket[] = [
  {
    id: "t-1",
    ticketNumber: "TICK-2026-904",
    subject: "Industrial Servo Motor 15KW Overheating Alarm on Line 3",
    customerName: "Bharat Heavy Electricals Ltd (BHEL)",
    requesterName: "Rajesh Nambiar (Maintenance Lead)",
    requesterEmail: "rnambiar@bhel.co.in",
    priority: "P1_CRITICAL",
    category: "HARDWARE_FAILURE",
    status: "IN_PROGRESS",
    slaDueHours: 1.5,
    isBreached: false,
    assignedAgent: "Ganesh Kulkarni (Senior Field Engineer)",
    createdAt: "Today, 08:30 AM",
    description: "Servo Motor serial #SERVO-9921 triggered a thermal shutoff trip after running for 4 hours at full load. Production on assembly cell 2 is halted.",
    replies: [
      {
        id: "rep-1",
        sender: "Rajesh Nambiar",
        isStaff: false,
        timestamp: "08:30 AM",
        message: "Motor temperature reached 92°C before automatic trip. We have initiated emergency cooling. Need immediate dispatch of service engineer.",
      },
      {
        id: "rep-2",
        sender: "Ganesh Kulkarni",
        isStaff: true,
        timestamp: "09:10 AM",
        message: "Checked telematics data. Stator winding temperature sensor showed sharp spike. I am en route to Pune Plant 1 with replacement encoder and thermal probe.",
      },
    ],
  },
  {
    id: "t-2",
    ticketNumber: "TICK-2026-905",
    subject: "GST E-Invoice IRN Generation Failure for Inter-State Shipment",
    customerName: "Apex Global Infotech Logistics",
    requesterName: "Sneha Kapoor (Accounts Manager)",
    requesterEmail: "sneha.k@apexglobal.com",
    priority: "P2_HIGH",
    category: "INVOICE_BILLING",
    status: "OPEN",
    slaDueHours: 3.2,
    isBreached: false,
    assignedAgent: "Vikram Seth (ERP Financial Specialist)",
    createdAt: "Today, 09:45 AM",
    description: "NIC portal returned Error 2150: Recipient GSTIN state code mismatch with Place of Supply for Maharashtra to Karnataka invoice SO-2026-9041.",
    replies: [
      {
        id: "rep-1",
        sender: "Sneha Kapoor",
        isStaff: false,
        timestamp: "09:45 AM",
        message: "Truck is loaded at warehouse gate awaiting E-Way bill. Please rectify the GST portal mapping.",
      },
    ],
  },
  {
    id: "t-3",
    ticketNumber: "TICK-2026-901",
    subject: "Fleet GPS Gateway Signal Lost on Interstate Route NH-48",
    customerName: "Express Freight Line Systems",
    requesterName: "Sunil Verma (Fleet Dispatcher)",
    requesterEmail: "sunil.v@expressfreight.com",
    priority: "P2_HIGH",
    category: "FLEET_TELEMATICS",
    status: "OPEN",
    slaDueHours: -1.2,
    isBreached: true,
    assignedAgent: "Alok Gupta (Telematics Support)",
    createdAt: "Yesterday, 04:15 PM",
    description: "Vehicle MH-12-QW-9901 carrying cold-chain cargo stopped transmitting telemetry data 60 km south of Vadodara.",
    replies: [
      {
        id: "rep-1",
        sender: "Sunil Verma",
        isStaff: false,
        timestamp: "Yesterday, 04:15 PM",
        message: "Driver phone is reachable. States telematics device LED is blinking red.",
      },
    ],
  },
  {
    id: "t-4",
    ticketNumber: "TICK-2026-898",
    subject: "Request for Annual User License Provisioning & SSO Integration",
    customerName: "Mahindra Heavy Precision Castings",
    requesterName: "Amitabh Roy (IT Director)",
    requesterEmail: "aroy@mahindra.com",
    priority: "P3_MEDIUM",
    category: "SOFTWARE_BUG",
    status: "RESOLVED",
    slaDueHours: 18.0,
    isBreached: false,
    assignedAgent: "Pooja Hegde (Customer Success Lead)",
    createdAt: "Yesterday, 11:00 AM",
    description: "Configuring SAML 2.0 Single Sign-On with Azure AD for 250 factory employees.",
    replies: [
      {
        id: "rep-1",
        sender: "Amitabh Roy",
        isStaff: false,
        timestamp: "Yesterday, 11:00 AM",
        message: "Attached metadata XML from our Azure tenant.",
      },
      {
        id: "rep-2",
        sender: "Pooja Hegde",
        isStaff: true,
        timestamp: "Yesterday, 02:30 PM",
        message: "SSO claim mapping completed and tested successfully on staging. Enabled for production.",
      },
    ],
  },
];

export function HelpdeskTicketStudio({ defaultFilter = "ALL" }: { defaultFilter?: "ALL" | "ESCALATIONS" }) {
  const [tickets, setTickets] = useState<SupportTicket[]>(INITIAL_TICKETS);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(INITIAL_TICKETS[0]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>(defaultFilter === "ESCALATIONS" ? "ESCALATED" : "ALL");
  const [replyText, setReplyText] = useState("");
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Filtered Tickets
  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      let matchStatus = true;
      if (statusFilter === "ESCALATED") {
        matchStatus = t.isBreached || t.priority === "P1_CRITICAL";
      } else if (statusFilter !== "ALL") {
        matchStatus = t.status === statusFilter;
      }

      const matchSearch =
        t.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.requesterName.toLowerCase().includes(searchQuery.toLowerCase());

      return matchStatus && matchSearch;
    });
  }, [tickets, statusFilter, searchQuery]);

  // Reply Submission
  const handleSendReply = () => {
    if (!replyText.trim() || !selectedTicket) return;
    const newReply = {
      id: `rep-${Date.now()}`,
      sender: "Support Specialist (Staff)",
      isStaff: true,
      timestamp: "Just now",
      message: replyText.trim(),
    };

    setTickets((prev) =>
      prev.map((t) =>
        t.id === selectedTicket.id
          ? {
              ...t,
              status: "IN_PROGRESS",
              replies: [...t.replies, newReply],
            }
          : t
      )
    );

    setSelectedTicket((prev) =>
      prev
        ? {
            ...prev,
            status: "IN_PROGRESS",
            replies: [...prev.replies, newReply],
          }
        : null
    );

    setReplyText("");
    notifySuccess("Support response delivered to customer.");
  };

  // Status Change
  const handleUpdateStatus = (ticketId: string, newStatus: SupportTicket["status"]) => {
    setTickets((prev) =>
      prev.map((t) => (t.id === ticketId ? { ...t, status: newStatus } : t))
    );
    if (selectedTicket?.id === ticketId) {
      setSelectedTicket((prev) => (prev ? { ...prev, status: newStatus } : null));
    }
    notifySuccess(`Ticket status updated to ${newStatus.replace("_", " ")}`);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Navigation & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card border border-border/70 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center font-bold">
            <LifeBuoy className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-foreground">
                Help Desk & SLA Incident Studio
              </h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-rose-500/10 text-rose-600 border border-rose-500/20">
                ServiceNow / ITIL Grade
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Multi-channel support tickets, SLA resolution timers, technician dispatch, and customer conversation telemetry
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCreateModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            Create Incident Ticket
          </button>
        </div>
      </div>

      {/* SLA Metrics Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-card border border-border/70 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>Open Tickets</span>
            <Ticket className="w-4 h-4 text-primary" />
          </div>
          <div className="text-2xl font-black text-foreground mt-2">
            {tickets.filter((t) => t.status !== "RESOLVED" && t.status !== "CLOSED").length}
          </div>
          <div className="text-[11px] text-muted-foreground mt-1">
            Active in support triage queue
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border/70 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>Critical P1 Incidents</span>
            <Flame className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-2">
            {tickets.filter((t) => t.priority === "P1_CRITICAL" && t.status !== "CLOSED").length}
          </div>
          <div className="text-[11px] text-muted-foreground mt-1">
            2-hour emergency SLA policy
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border/70 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>SLA Breaches</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-2">
            {tickets.filter((t) => t.isBreached).length}
          </div>
          <div className="text-[11px] text-muted-foreground mt-1">
            Escalated to Engineering Lead
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border/70 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>Avg First Response</span>
            <Clock className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
            24 mins
          </div>
          <div className="text-[11px] text-muted-foreground mt-1">
            98.2% SLA adherence rate
          </div>
        </div>
      </div>

      {/* Main Split Queue & Conversation Studio */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Tickets Queue List (5 cols) */}
        <div className="lg:col-span-5 bg-card border border-border/70 rounded-2xl p-4 shadow-xs space-y-4">
          {/* Search & Status Pills */}
          <div className="space-y-2.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search ticket #, subject or client..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-input bg-background focus:ring-1 focus:ring-primary outline-hidden"
              />
            </div>

            <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs">
              {(["ALL", "ESCALATED", "OPEN", "IN_PROGRESS", "RESOLVED"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setStatusFilter(tab)}
                  className={`px-2.5 py-1 rounded-lg font-semibold whitespace-nowrap transition-colors ${
                    statusFilter === tab
                      ? tab === "ESCALATED"
                        ? "bg-rose-500 text-white shadow-xs"
                        : "bg-primary text-primary-foreground shadow-xs"
                      : "bg-muted/60 text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {tab === "ALL"
                    ? "All Tickets"
                    : tab === "ESCALATED"
                    ? "🔥 Escalations / P1"
                    : tab.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>

          {/* Ticket Items */}
          <div className="space-y-2.5 overflow-y-auto max-h-[640px] pr-1">
            {filteredTickets.map((t) => {
              const isSelected = selectedTicket?.id === t.id;
              return (
                <div
                  key={t.id}
                  onClick={() => setSelectedTicket(t)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer space-y-2 ${
                    isSelected
                      ? "bg-primary/5 border-primary ring-1 ring-primary shadow-xs"
                      : "bg-background border-border/80 hover:border-primary/40"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-foreground">
                        {t.ticketNumber}
                      </span>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded-sm ${
                          t.priority === "P1_CRITICAL"
                            ? "bg-rose-500 text-white"
                            : t.priority === "P2_HIGH"
                            ? "bg-amber-500/10 text-amber-600"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {t.priority.replace("_", " ")}
                      </span>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        t.isBreached
                          ? "bg-rose-500/10 text-rose-600 border border-rose-500/30"
                          : t.status === "RESOLVED"
                          ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/30"
                          : "bg-blue-500/10 text-blue-600 border border-blue-500/30"
                      }`}
                    >
                      {t.isBreached ? "SLA Breached" : t.status.replace("_", " ")}
                    </span>
                  </div>

                  <div className="text-xs font-bold text-foreground line-clamp-1">
                    {t.subject}
                  </div>

                  <div className="text-[11px] text-muted-foreground flex items-center justify-between">
                    <span className="truncate max-w-[180px]">{t.customerName}</span>
                    <span className="font-mono text-[10px] text-foreground">
                      {t.isBreached
                        ? `${Math.abs(t.slaDueHours)}h overdue`
                        : `${t.slaDueHours}h remaining`}
                    </span>
                  </div>
                </div>
              );
            })}

            {filteredTickets.length === 0 && (
              <div className="p-8 text-center text-xs text-muted-foreground/60 border border-dashed border-border/60 rounded-xl">
                No tickets match the selected filter.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Active Ticket Response & Audit Studio (7 cols) */}
        <div className="lg:col-span-7 bg-card border border-border/70 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4">
          {selectedTicket ? (
            <>
              {/* Ticket Header & Status Switcher */}
              <div className="border-b border-border/80 pb-4 space-y-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-base font-black text-foreground">
                      {selectedTicket.ticketNumber}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        selectedTicket.priority === "P1_CRITICAL"
                          ? "bg-rose-500 text-white"
                          : "bg-amber-500/10 text-amber-600"
                      }`}
                    >
                      {selectedTicket.priority.replace("_", " ")}
                    </span>
                  </div>

                  {/* Status Dropdown */}
                  <div className="flex items-center gap-2">
                    <select
                      value={selectedTicket.status}
                      onChange={(e) => handleUpdateStatus(selectedTicket.id, e.target.value as any)}
                      className="text-xs font-bold px-3 py-1.5 rounded-xl border border-input bg-background focus:ring-1 focus:ring-primary outline-hidden"
                    >
                      <option value="OPEN">Status: Open</option>
                      <option value="IN_PROGRESS">Status: In Progress</option>
                      <option value="PENDING_CUSTOMER">Status: Pending Customer</option>
                      <option value="RESOLVED">Status: Resolved</option>
                      <option value="CLOSED">Status: Closed</option>
                    </select>

                    <button
                      onClick={() => {
                        handleUpdateStatus(selectedTicket.id, "RESOLVED");
                        notifySuccess(`Ticket ${selectedTicket.ticketNumber} marked as Resolved!`);
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-xs"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Resolve
                    </button>
                  </div>
                </div>

                <h2 className="text-base font-bold text-foreground">{selectedTicket.subject}</h2>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs pt-1">
                  <div>
                    <span className="text-[11px] text-muted-foreground block">Customer:</span>
                    <span className="font-semibold text-foreground">{selectedTicket.customerName}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-muted-foreground block">Requester:</span>
                    <span className="text-foreground">{selectedTicket.requesterName}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-muted-foreground block">Assigned Engineer:</span>
                    <span className="font-semibold text-primary">{selectedTicket.assignedAgent}</span>
                  </div>
                </div>
              </div>

              {/* Conversation Log & History */}
              <div className="space-y-3 overflow-y-auto max-h-[380px] pr-2">
                {/* Initial Description */}
                <div className="p-3.5 rounded-xl bg-muted/30 border border-border/60 text-xs space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
                    <span>Initial Customer Description</span>
                    <span>{selectedTicket.createdAt}</span>
                  </div>
                  <p className="text-foreground leading-relaxed">{selectedTicket.description}</p>
                </div>

                {/* Replies Thread */}
                {selectedTicket.replies.map((reply) => (
                  <div
                    key={reply.id}
                    className={`p-3.5 rounded-xl text-xs space-y-1.5 border ${
                      reply.isStaff
                        ? "bg-primary/5 border-primary/20 ml-6"
                        : "bg-card border-border/70 mr-6"
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className={`font-bold ${reply.isStaff ? "text-primary" : "text-foreground"}`}>
                        {reply.sender} {reply.isStaff && "(Verified Engineer)"}
                      </span>
                      <span className="text-muted-foreground">{reply.timestamp}</span>
                    </div>
                    <p className="text-foreground leading-relaxed">{reply.message}</p>
                  </div>
                ))}
              </div>

              {/* Response Editor */}
              <div className="pt-3 border-t border-border/80 space-y-2">
                <textarea
                  rows={3}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type official support response or engineer dispatch notes..."
                  className="w-full text-xs p-3 rounded-xl border border-input bg-background focus:ring-1 focus:ring-primary outline-hidden resize-none"
                />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span>Direct email notification dispatched to requester</span>
                  </div>

                  <button
                    onClick={handleSendReply}
                    disabled={!replyText.trim()}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Submit Response
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="p-12 text-center text-xs text-muted-foreground">
              Select a ticket from the queue to review history and respond.
            </div>
          )}
        </div>
      </div>

      {/* New Incident Ticket Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-border/80 pb-3">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Plus className="w-4 h-4 text-primary" />
                Register Support Incident Ticket
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
                <label className="font-semibold text-muted-foreground block mb-1">Subject / Incident Summary:</label>
                <input
                  type="text"
                  placeholder="e.g. Servo Motor vibration alert on Production Line 2"
                  className="w-full px-3 py-2 rounded-xl border border-input bg-background font-semibold"
                />
              </div>

              <div>
                <label className="font-semibold text-muted-foreground block mb-1">Customer Account:</label>
                <input
                  type="text"
                  placeholder="e.g. Bharat Heavy Electricals Ltd (BHEL)"
                  className="w-full px-3 py-2 rounded-xl border border-input bg-background"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-muted-foreground block mb-1">Priority SLA:</label>
                  <select className="w-full px-3 py-2 rounded-xl border border-input bg-background font-medium">
                    <option value="P1_CRITICAL">P1 - Critical (2h Resolution)</option>
                    <option value="P2_HIGH">P2 - High (4h Resolution)</option>
                    <option value="P3_MEDIUM">P3 - Medium (24h Resolution)</option>
                    <option value="P4_LOW">P4 - Low (48h Resolution)</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-muted-foreground block mb-1">Category:</label>
                  <select className="w-full px-3 py-2 rounded-xl border border-input bg-background font-medium">
                    <option value="HARDWARE_FAILURE">Hardware / Machine Failure</option>
                    <option value="SOFTWARE_BUG">Software / Cloud Portal Bug</option>
                    <option value="INVOICE_BILLING">GST / E-Invoice Discrepancy</option>
                    <option value="FLEET_TELEMATICS">Fleet Telematics Device Offline</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-muted-foreground block mb-1">Detailed Description:</label>
                <textarea
                  rows={3}
                  placeholder="Specify machine model, fault codes, line stops or error traces..."
                  className="w-full px-3 py-2 rounded-xl border border-input bg-background resize-none"
                />
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
                  notifySuccess("Incident ticket registered into SLA queue.");
                  setCreateModalOpen(false);
                }}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-xs"
              >
                Create Ticket
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

