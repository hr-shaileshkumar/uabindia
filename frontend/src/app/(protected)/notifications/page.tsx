"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { CrudCard, CrudHeaderStats } from "@/components/erp/crud-workspace";
import { ErpRefreshButton, ErpSearchFilter, ErpRowActions } from "@/components/erp/erp-page-kit";
import { SideDrawer } from "@/components/ui/side-drawer";
import { erpButtonClassName } from "@/components/erp/erpStyles";
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

export default function NotificationsInboxPage() {
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

  return (
    <StandardPageLayout
      title="Notifications"
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
      filters={
        <div className="flex flex-wrap items-end gap-3">
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
        </div>
      }
    >
      {error ? <div className="erp-alert-error">{error}</div> : null}

      <CrudCard>
        <div className="erp-table-wrap">
          <table className="erp-table table-auto">
            <thead className="erp-thead">
              <tr>
                <th className="erp-th">Notification</th>
                <th className="erp-th">Channel</th>
                <th className="erp-th">Status</th>
                <th className="erp-th">Received</th>
                <th className="erp-th text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="erp-td py-8 text-center text-xs text-slate-500">
                    Loading…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="erp-td py-8 text-center text-xs text-slate-500">
                    No notifications yet.
                  </td>
                </tr>
              ) : (
                filtered.map((row) => (
                  <tr key={row.id} className={`erp-tr ${row.isRead ? "" : "bg-sky-50/40"}`}>
                    <td className="erp-td">
                      <div className={`erp-row-title ${row.isRead ? "" : "font-semibold"}`}>{row.title}</div>
                      <div className="line-clamp-1 text-xs text-slate-500">{row.message}</div>
                    </td>
                    <td className="erp-td text-xs">{row.channel || row.type || "InApp"}</td>
                    <td className="erp-td">
                      <span className={row.isRead ? "erp-chip" : "erp-chip erp-chip-warning"}>
                        {row.isRead ? "Read" : "Unread"}
                      </span>
                    </td>
                    <td className="erp-td text-xs text-slate-500">
                      {row.createdAt ? new Date(row.createdAt).toLocaleString("en-IN") : "—"}
                    </td>
                    <td className="erp-td">
                      <ErpRowActions
                        onView={{
                          label: "View",
                          onClick: () => void markRead(row),
                        }}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CrudCard>

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
