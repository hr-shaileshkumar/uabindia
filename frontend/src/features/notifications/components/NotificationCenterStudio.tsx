"use client";

import React, { useState, useMemo } from "react";
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Trash2,
  Check,
  ShoppingBag,
  Ticket,
  DollarSign,
  Cpu,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { notifySuccess, notifyError } from "@/lib/notifications";
import Link from "next/link";

export interface ActivityNotification {
  id: string;
  title: string;
  description: string;
  category: "APPROVALS" | "INCIDENT" | "FINANCE" | "MANUFACTURING";
  timestamp: string;
  isRead: boolean;
  priority: "HIGH" | "NORMAL";
  targetHref: string;
}

export const INITIAL_NOTIFICATIONS: ActivityNotification[] = [
  {
    id: "notif-1",
    title: "Urgent P1 Incident Logged: Servo Motor Thermal Trip",
    description: "Maintenance lead reported overheat alarm on Line 3. Service engineer Ganesh Kulkarni en route.",
    category: "INCIDENT",
    timestamp: "24 mins ago",
    isRead: false,
    priority: "HIGH",
    targetHref: "/helpdesk/tickets",
  },
  {
    id: "notif-2",
    title: "Purchase Order PO-2026-8841 Awaiting Authorization",
    description: "Procurement order of ₹3,45,000 for assembly cell raw materials is pending your approval.",
    category: "APPROVALS",
    timestamp: "1 hour ago",
    isRead: false,
    priority: "HIGH",
    targetHref: "/approvals",
  },
  {
    id: "notif-3",
    title: "Production Work Order WO-2026-0811 Reached 70% Progress",
    description: "35 out of 50 units completed on Mechanical Integration Cell #2. Ready for QA test bay.",
    category: "MANUFACTURING",
    timestamp: "3 hours ago",
    isRead: true,
    priority: "NORMAL",
    targetHref: "/manufacturing/work-orders",
  },
  {
    id: "notif-4",
    title: "GST E-Invoice IRN Generated for SO-2026-9041",
    description: "Electronic invoice signed by NIC portal with QR code appended to letterhead preview.",
    category: "FINANCE",
    timestamp: "Yesterday, 05:40 PM",
    isRead: true,
    priority: "NORMAL",
    targetHref: "/sales/orders",
  },
];

export function NotificationCenterStudio() {
  const [notifications, setNotifications] = useState<ActivityNotification[]>(INITIAL_NOTIFICATIONS);
  const [filter, setFilter] = useState<"ALL" | "UNREAD" | "APPROVALS" | "INCIDENT">("ALL");

  const filtered = useMemo(() => {
    return notifications.filter((n) => {
      if (filter === "UNREAD") return !n.isRead;
      if (filter === "APPROVALS") return n.category === "APPROVALS";
      if (filter === "INCIDENT") return n.category === "INCIDENT";
      return true;
    });
  }, [notifications, filter]);

  const unreadCount = useMemo(() => notifications.filter((n) => !n.isRead).length, [notifications]);

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    notifySuccess("All alerts marked as read.");
  };

  const handleToggleRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: !n.isRead } : n))
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Navigation & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card border border-border/70 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
            <Bell className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-foreground">
                Enterprise Notification & Activity Center
              </h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                {unreadCount} Unread
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Real-time enterprise event telemetry, SLA breach escalations, authorization alerts, and status notifications
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border border-border bg-card hover:bg-muted/70 transition-colors text-foreground"
            >
              <Check className="w-3.5 h-3.5 text-primary" />
              Mark All as Read
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        {(["ALL", "UNREAD", "APPROVALS", "INCIDENT"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              filter === tab
                ? "bg-primary text-primary-foreground shadow-xs"
                : "bg-card border border-border/70 text-muted-foreground hover:bg-muted"
            }`}
          >
            {tab === "ALL" ? "All Activity" : tab === "UNREAD" ? `Unread (${unreadCount})` : tab}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filtered.map((n) => (
          <div
            key={n.id}
            className={`p-4 rounded-2xl border transition-all space-y-2.5 ${
              !n.isRead
                ? "bg-primary/5 border-primary/30 shadow-xs"
                : "bg-card border-border/70 shadow-2xs"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-3">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                    n.priority === "HIGH"
                      ? "bg-rose-500/10 text-rose-600"
                      : "bg-primary/10 text-primary"
                  }`}
                >
                  {n.category === "INCIDENT" ? (
                    <AlertTriangle className="w-4 h-4" />
                  ) : n.category === "APPROVALS" ? (
                    <ShoppingBag className="w-4 h-4" />
                  ) : (
                    <Bell className="w-4 h-4" />
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold text-foreground">{n.title}</h3>
                    {!n.isRead && (
                      <span className="w-2 h-2 rounded-full bg-primary shrink-0"></span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    {n.description}
                  </p>
                </div>
              </div>

              <span className="text-[10px] text-muted-foreground shrink-0">{n.timestamp}</span>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border/40 text-xs">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-sm bg-muted text-muted-foreground">
                {n.category}
              </span>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleToggleRead(n.id)}
                  className="text-[11px] text-muted-foreground hover:text-foreground font-medium"
                >
                  {n.isRead ? "Mark as unread" : "Mark as read"}
                </button>

                <Link
                  href={n.targetHref}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline"
                >
                  Open Workspace <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="p-12 text-center text-xs text-muted-foreground border border-dashed border-border/60 rounded-2xl">
            No notifications in this view.
          </div>
        )}
      </div>
    </div>
  );
}

