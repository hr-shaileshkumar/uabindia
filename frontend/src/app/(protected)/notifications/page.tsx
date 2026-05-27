"use client";

import { useEffect, useMemo, useState } from "react";
import { hrApi } from "@/services/hrApi";
import ProtectedRoute from "@/components/ProtectedRoute";
import { PERMISSIONS } from "@/constants/permissions";

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  type?: string;
  status?: string;
  isRead: boolean;
  createdAt?: string;
};

export default function NotificationsPage() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  const unreadCount = useMemo(() => items.filter((x) => !x.isRead).length, [items]);

  const fetchNotifications = async (unreadOnly: boolean) => {
    try {
      setLoading(true);
      setError(null);
      const res = await hrApi.notifications.listMine({ take: 100, unreadOnly });
      const data = Array.isArray(res.data) ? (res.data as NotificationItem[]) : [];
      setItems(data);
    } catch (err: any) {
      setError(err?.message || "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchNotifications(showUnreadOnly);
  }, [showUnreadOnly]);

  const markAsRead = async (id: string) => {
    try {
      await hrApi.notifications.markRead(id);
      setItems((prev) => prev.map((item) => (item.id === id ? { ...item, isRead: true } : item)));
    } catch {
      // ignore
    }
  };

  return (
    <ProtectedRoute
      permission={[
        PERMISSIONS.NOTIFICATIONS_VIEW,
        "resource:notifications.view",
        "module:erp",
        "erp.view",
      ]}
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
            <p className="mt-1 text-sm text-gray-600">Approval updates, payroll run alerts, and workflow events.</p>
          </div>
          <div className="flex items-center gap-3">
            <label className="inline-flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300"
                checked={showUnreadOnly}
                onChange={(e) => setShowUnreadOnly(e.target.checked)}
              />
              Unread only
            </label>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              Unread: {unreadCount}
            </span>
          </div>
        </div>

        {loading && <div className="rounded-lg border border-gray-200 bg-white p-6 text-sm text-gray-600">Loading notifications...</div>}
        {error && <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

        {/* KPI summary cards */}
        <div className="erp-kpi-grid mb-4">
          <div className="erp-kpi-card"><p className="erp-kpi-label">Total</p><p className="erp-kpi-value">{items.length}</p><p className="erp-kpi-meta">All notifications</p></div>
          <div className="erp-kpi-card erp-kpi-card-warning"><p className="erp-kpi-label">Unread</p><p className="erp-kpi-value">{items.filter(n => !n.isRead).length}</p><p className="erp-kpi-meta">Unread messages</p></div>
          <div className="erp-kpi-card erp-kpi-card-success"><p className="erp-kpi-label">Read</p><p className="erp-kpi-value erp-kpi-value-success">{items.filter(n => n.isRead).length}</p><p className="erp-kpi-meta">Already seen</p></div>
          <div className="erp-kpi-card erp-kpi-card-info"><p className="erp-kpi-label">Types</p><p className="erp-kpi-value">{new Set(items.map(n => n.type).filter(Boolean)).size}</p><p className="erp-kpi-meta">Notification categories</p></div>
        </div>

          {!loading && !error && (
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            {items.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-500">No notifications found.</div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {items.map((item) => (
                  <li key={item.id} className={`p-4 ${item.isRead ? "bg-white" : "bg-blue-50/40"}`}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900">{item.title || "Notification"}</p>
                        <p className="mt-1 text-sm text-slate-600">{item.message}</p>
                        <p className="mt-2 text-xs text-slate-400">
                          {item.createdAt ? new Date(item.createdAt).toLocaleString() : "Just now"}
                        </p>
                      </div>
                      {!item.isRead && (
                        <button
                          type="button"
                          onClick={() => {
                            void markAsRead(item.id);
                          }}
                          className="rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50"
                        >
                          Mark read
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
