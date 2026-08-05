"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { hrApi } from "@/services/hrApi";
import ProtectedRoute from "@/components/ProtectedRoute";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import ErpHeaderSummary from "@/components/layout/ErpHeaderSummary";
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

export function AdministrationNotificationsPage() {
  const searchParams = useSearchParams();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const focusedId = searchParams.get("focus") || "";

  const unreadCount = useMemo(() => items.filter((x) => !x.isRead).length, [items]);

  const fetchNotifications = async (unreadOnly: boolean) => {
    try {
      setLoading(true);
      setError(null);
      const res = await hrApi.notifications.listMine({ take: 100, unreadOnly });
      const data = Array.isArray(res.data) ? (res.data as NotificationItem[]) : [];
      setItems(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load notifications";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchNotifications(showUnreadOnly);
  }, [showUnreadOnly]);

  useEffect(() => {
    if (!focusedId || loading) {
      return;
    }

    const node = document.getElementById(`notification-${focusedId}`);
    if (node) {
      node.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [focusedId, loading, items.length]);

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
      <StandardPageLayout
        title="Notifications"
        subtitle="Approval updates, payroll run alerts, workflow events, and workspace notices."
        eyebrow="Administration / Notifications"
        meta={
          <ErpHeaderSummary
            items={[
              { label: "Total", value: items.length },
              { label: "Unread", value: items.filter((item) => !item.isRead).length, tone: "warning" },
              { label: "Read", value: items.filter((item) => item.isRead).length, tone: "success" },
              { label: "Types", value: new Set(items.map((item) => item.type).filter(Boolean)).size, tone: "info" },
            ]}
          />
        }
        actions={
          <span className="inline-flex rounded-full bg-sky-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-sky-700">
            Unread: {unreadCount}
          </span>
        }
        filters={
          <label className="inline-flex items-center gap-3 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300"
              checked={showUnreadOnly}
              onChange={(event) => setShowUnreadOnly(event.target.checked)}
            />
            Show unread notifications only
          </label>
        }
      >
        {loading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
            Loading notifications...
          </div>
        ) : null}

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
        ) : null}

        {!loading && !error ? (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            {items.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">No notifications found.</div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {items.map((item) => (
                  <li
                    id={`notification-${item.id}`}
                    key={item.id}
                    className={
                      focusedId === item.id
                        ? "bg-indigo-50/50 p-4 ring-2 ring-indigo-300"
                        : item.isRead
                          ? "bg-white p-4"
                          : "bg-indigo-50/20 p-4"
                    }
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900">{item.title || "Notification"}</p>
                        <p className="mt-1 text-sm text-slate-600">{item.message}</p>
                        <p className="mt-2 text-xs text-slate-400">
                          {item.createdAt ? new Date(item.createdAt).toLocaleString() : "Just now"}
                        </p>
                      </div>
                      {!item.isRead ? (
                        <button
                          type="button"
                          onClick={() => {
                            void markAsRead(item.id);
                          }}
                          className="rounded-xl border border-indigo-200 bg-white px-3 py-2 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-50"
                        >
                          Mark read
                        </button>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : null}
      </StandardPageLayout>
    </ProtectedRoute>
  );
}
