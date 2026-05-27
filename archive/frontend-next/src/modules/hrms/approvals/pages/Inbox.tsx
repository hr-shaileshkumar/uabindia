"use client";
import React, { useEffect, useState } from "react";
import { hrApi } from "@/lib/hrApi";

type Approval = {
  id: string;
  moduleKey: string;
  entityType: string;
  entityId: string;
  status: string;
  requestedAt: string;
  requestedBy: string;
};

export default function Inbox() {
  const [items, setItems] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await hrApi.approvals.list("Pending");
      setItems(res.data ?? res ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const act = async (id: string, action: "approve" | "reject") => {
    try {
      if (action === "approve") await hrApi.approvals.approve(id);
      else await hrApi.approvals.reject(id);
      await load();
    } catch (err) { console.error(err); }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">Approval Inbox</h2>
      {loading && <div>Loading…</div>}
      {!loading && items.length === 0 && <div>No pending approvals.</div>}
      <ul className="space-y-2">
        {items.map(it => (
          <li key={it.id} className="p-3 border rounded flex items-center justify-between">
            <div>
              <div className="font-medium">{it.entityType} — {it.entityId}</div>
              <div className="text-sm text-gray-500">Requested: {new Date(it.requestedAt).toLocaleString()}</div>
            </div>
            <div className="space-x-2">
              <button onClick={() => act(it.id, "approve")} className="px-3 py-1 bg-green-500 text-white rounded">Approve</button>
              <button onClick={() => act(it.id, "reject")} className="px-3 py-1 bg-red-500 text-white rounded">Reject</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
