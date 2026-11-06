"use client";

import React, { useState } from "react";
import {
  Megaphone,
  Mail,
  MessageSquare,
  Send,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Calendar,
  User,
  Building2,
  Sparkles,
  Pin,
  Radio,
} from "lucide-react";
import { notifySuccess, notifyError } from "@/lib/notifications";

export interface BroadcastAnnouncement {
  id: string;
  title: string;
  content: string;
  publishedBy: string;
  publishedAt: string;
  targetAudience: "ALL_EMPLOYEES" | "PLANT_STAFF" | "MANAGERS_ONLY" | "SALES_TEAM";
  channels: ("IN_APP" | "WHATSAPP" | "EMAIL")[];
  isPinned: boolean;
}

export const INITIAL_ANNOUNCEMENTS: BroadcastAnnouncement[] = [
  {
    id: "ann-1",
    title: "Q3 FY 2026-27 Town Hall & Annual Diwali Production Incentive",
    content: "The Executive Leadership team is proud to announce an average 18% bonus milestone achieved across all manufacturing and delivery divisions.",
    publishedBy: "Executive Chairman & Managing Director",
    publishedAt: "Today, 10:00 AM",
    targetAudience: "ALL_EMPLOYEES",
    channels: ["IN_APP", "WHATSAPP", "EMAIL"],
    isPinned: true,
  },
  {
    id: "ann-2",
    title: "Mandatory Safety Gear & Heat Tolerance Guidelines for Plant 1",
    content: "All shop-floor machinists on CNC Milling Line 3 and Dynamometer Testing Bays must inspect high-temperature thermal PPE daily.",
    publishedBy: "Ramanathan Iyer (Plant Safety Officer)",
    publishedAt: "Yesterday, 02:30 PM",
    targetAudience: "PLANT_STAFF",
    channels: ["IN_APP", "WHATSAPP"],
    isPinned: false,
  },
  {
    id: "ann-3",
    title: "Quarterly Performance Review (Appraisal Cycle) Window Open",
    content: "People managers are requested to complete self-evaluations and 1-on-1 performance meetings before 15 November 2026.",
    publishedBy: "Human Resources Operations",
    publishedAt: "28 Oct 2026",
    targetAudience: "MANAGERS_ONLY",
    channels: ["IN_APP", "EMAIL"],
    isPinned: false,
  },
];

export function CommunicationBroadcastStudio() {
  const [announcements, setAnnouncements] = useState<BroadcastAnnouncement[]>(INITIAL_ANNOUNCEMENTS);
  const [composeModalOpen, setComposeModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* Top Banner Navigation & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card border border-border/70 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-orange-500/10 text-orange-600 flex items-center justify-center font-bold">
            <Megaphone className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-foreground">
                Corporate Communications & Announcement Broadcaster
              </h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-orange-500/10 text-orange-600 border border-orange-500/20">
                Omni-Channel
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Company-wide bulletins, WhatsApp broadcast messaging, and targeted workforce segment notifications
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setComposeModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            Publish Announcement
          </button>
        </div>
      </div>

      {/* Announcements Stream */}
      <div className="space-y-4">
        {announcements.map((ann) => (
          <div
            key={ann.id}
            className={`p-5 rounded-2xl border transition-all space-y-3 ${
              ann.isPinned
                ? "bg-primary/5 border-primary/30 shadow-xs"
                : "bg-card border-border/70 shadow-2xs"
            }`}
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-border/70 pb-3">
              <div className="flex items-center gap-2">
                {ann.isPinned && (
                  <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-primary text-primary-foreground">
                    <Pin className="w-3 h-3" /> Pinned
                  </span>
                )}
                <h3 className="text-sm font-bold text-foreground">{ann.title}</h3>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
                  {ann.targetAudience.replace("_", " ")}
                </span>
                <span className="text-[11px] text-muted-foreground">{ann.publishedAt}</span>
              </div>
            </div>

            <p className="text-xs text-foreground leading-relaxed">{ann.content}</p>

            <div className="flex items-center justify-between pt-2 text-xs border-t border-border/50 text-muted-foreground">
              <span className="font-medium text-foreground">Published by: {ann.publishedBy}</span>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px]">Channels:</span>
                {ann.channels.map((ch) => (
                  <span key={ch} className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded-sm bg-muted text-foreground">
                    {ch}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Compose Modal */}
      {composeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-border/80 pb-3">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-primary" />
                Publish Company Bulletin
              </h3>
              <button
                onClick={() => setComposeModalOpen(false)}
                className="text-xs text-muted-foreground hover:text-foreground font-semibold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-muted-foreground block mb-1">Bulletin Title:</label>
                <input
                  type="text"
                  placeholder="e.g. Annual Plant Maintenance Schedule"
                  className="w-full px-3 py-2 rounded-xl border border-input bg-background font-semibold"
                />
              </div>

              <div>
                <label className="font-semibold text-muted-foreground block mb-1">Target Audience:</label>
                <select className="w-full px-3 py-2 rounded-xl border border-input bg-background font-medium">
                  <option value="ALL_EMPLOYEES">All Company Employees</option>
                  <option value="PLANT_STAFF">Manufacturing & Warehouse Staff</option>
                  <option value="MANAGERS_ONLY">People Managers & Team Leads</option>
                  <option value="SALES_TEAM">Sales & Commercial Team</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-muted-foreground block mb-1">Message Content:</label>
                <textarea
                  rows={4}
                  placeholder="Detail the operational notice or policy update..."
                  className="w-full px-3 py-2 rounded-xl border border-input bg-background resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-border/80">
              <button
                onClick={() => setComposeModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-border hover:bg-muted/70 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  notifySuccess("Bulletin published across in-app and WhatsApp channels.");
                  setComposeModalOpen(false);
                }}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-xs"
              >
                Publish Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

