"use client";

import { DynamicPage } from "@/components/dynamic/DynamicPage";
﻿
import { useCallback, useEffect, useMemo, useState } from "react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { CrudCard, CrudHeaderStats } from "@/components/workspace/crud-workspace";
import { ErpRefreshButton, ErpRowActions, ErpSearchFilter } from "@/components/workspace/page-kit";
import { useErpListView } from "@/components/workspace/list-view";
import { SideDrawer } from "@/components/ui/side-drawer";
import { erpButtonClassName, erpTableRowHoverClassName, erpTableTdClassName } from "@/components/workspace/styles";
import { appApi } from "@/services/modules";
import { getApiErrorMessage } from "@/lib/api-errors";
import { notifyError, notifySuccess } from "@/lib/notifications";

type NotificationRow = {
  id: string;
  title: string;
  message: string;
  channel?: string;
  type?: string;
  isRead: boolean;
  createdAt?: string;
  status?: string;
};

function LegacyNotificationsInboxPage() {
  const [rows, setRows] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [selected, setSelected] = useState<NotificationRow | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await appApi.notifications.listMine({ unreadOnly, take: 100 });
      const list = (Array.isArray(data) ? data : []) as NotificationRow[];
      setRows(list);
      setError(null);
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to load notifications."));
    } finally {
      setLoading(false);
    }
  }, [unreadOnly]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (row) =>
        row.title?.toLowerCase().includes(q) ||
        row.message?.toLowerCase().includes(q) ||
        row.type?.toLowerCase().includes(q)
    );
  }, [rows, search]);

  const unreadCount = rows.filter((r) => !r.isRead).length;

  const markRead = async (row: NotificationRow) => {
    if (row.isRead) {
      setSelected(row);
      return;
    }
    try {
      setBusy(true);
      await appApi.notifications.markRead(row.id);
      setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, isRead: true } : r)));
      setSelected({ ...row, isRead: true });
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Could not mark as read."));
    } finally {
      setBusy(false);
    }
  };

  const markAllRead = async () => {
    try {
      setBusy(true);
      await appApi.notifications.markAllRead();
      notifySuccess("All notifications marked as read.");
      await load();
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Could not mark all as read."));
    } finally {
      setBusy(false);
    }
  };

  const list = useErpListView({
    listKey: "notifications-inbox",
    rows: filtered,
    columns: [
      { key: "title", label: "Notification" },
      { key: "channel", label: "Channel" },
      { key: "isRead", label: "Status", dataType: "boolean" },
      { key: "createdAt", label: "Received", dataType: "date" },
      { key: "actions", label: "Actions", className: "text-right", locked: true },
    ],
    getRowId: (row) => row.id,
    loading,
    emptyMessage: "No notifications yet.",
    onRefresh: () => void load(),
    extraFilters: (
      <>
        <ErpSearchFilter value={search} onChange={setSearch} placeholder="Search title or message…" />
        <label className="flex items-center gap-2 pb-2 text-xs text-slate-600">
          <input
            type="checkbox"
            checked={unreadOnly}
            onChange={(e) => setUnreadOnly(e.target.checked)}
            className="rounded border-slate-300"
          />
          Unread only
        </label>
      </>
    ),
    renderRow: (row) => (
      <tr key={row.id} className={`${erpTableRowHoverClassName} ${row.isRead ? "" : "bg-sky-50/40"}`}>
        <td className={erpTableTdClassName}>
          <div className={`erp-row-title ${row.isRead ? "" : "font-semibold"}`}>{row.title}</div>
          <div className="line-clamp-1 text-xs text-slate-500">{row.message}</div>
        </td>
        <td className={`${erpTableTdClassName} text-xs`}>{row.channel || row.type || "InApp"}</td>
        <td className={erpTableTdClassName}>
          <span className={row.isRead ? "erp-chip" : "erp-chip erp-chip-warning"}>{row.isRead ? "Read" : "Unread"}</span>
        </td>
        <td className={`${erpTableTdClassName} text-xs text-slate-500`}>
          {row.createdAt ? new Date(row.createdAt).toLocaleString("en-IN") : "—"}
        </td>
        <td className={`${erpTableTdClassName} text-right`}>
          <ErpRowActions
            onView={{
              label: "View",
              onClick: () => void markRead(row),
            }}
          />
        </td>
      </tr>
    ),
  });

  return (
    <StandardPageLayout
      title="Notifications"
      subtitle="System alerts, approval updates, reminders, and activity notifications."
      eyebrow="Operations / Inbox"
      icon="bell"
      meta={
        <CrudHeaderStats
          items={[
            { label: "Inbox", value: rows.length, tone: "info" },
            { label: "Unread", value: unreadCount, tone: unreadCount ? "warning" : "positive" },
          ]}
        />
      }
      actions={
        <>
          <ErpRefreshButton onClick={() => void load()} loading={loading} />
          {list.headerTools}
          <button
            type="button"
            disabled={busy || unreadCount === 0}
            onClick={() => void markAllRead()}
            className={erpButtonClassName.secondary}
          >
            Mark all read
          </button>
        </>
      }
      filters={list.filterBar}
    >
      {error ? <div className="erp-alert-error">{error}</div> : null}

      <CrudCard>{list.table}</CrudCard>

      <SideDrawer
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected?.title || "Notification"}
        footer={
          <button type="button" className={erpButtonClassName.secondary} onClick={() => setSelected(null)}>
            Close
          </button>
        }
      >
        {selected ? (
          <div className="space-y-4 text-sm text-slate-700">
            <div className="flex flex-wrap gap-2">
              <span className="erp-chip">{selected.channel || "InApp"}</span>
              <span className={selected.isRead ? "erp-chip" : "erp-chip erp-chip-warning"}>
                {selected.isRead ? "Read" : "Unread"}
              </span>
            </div>
            <p className="whitespace-pre-wrap leading-relaxed">{selected.message}</p>
            <p className="text-xs text-slate-400">
              {selected.createdAt ? new Date(selected.createdAt).toLocaleString("en-IN") : ""}
            </p>
          </div>
        ) : null}
      </SideDrawer>
    </StandardPageLayout>
  );
}

export default function NotificationsInboxPage() {
  return (
    <DynamicPage
      pageKey="notifications.inbox"
      fallback={<LegacyNotificationsInboxPage />}
      renderMode="auto"
    />
  );
}
