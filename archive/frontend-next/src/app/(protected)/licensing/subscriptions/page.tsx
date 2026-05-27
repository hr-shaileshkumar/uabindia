"use client";

import { useEffect, useState } from "react";
import { hrApi } from "@/lib/hrApi";

interface SubscriptionRow {
  moduleKey: string;
  isEnabled: boolean;
}

export default function SubscriptionsPage() {
  const [subs, setSubs] = useState<SubscriptionRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await hrApi.modules.subscriptions();
        setSubs(res.data.subscriptions || []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold">Module Subscriptions</h2>
        <p className="text-sm text-gray-500">Tenant-level module subscriptions.</p>
      </div>

      <div className="rounded-lg border bg-white">
        <div className="p-4 border-b text-sm text-gray-600">{loading ? "Loading..." : `${subs.length} subscriptions`}</div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left">Module Key</th>
                <th className="px-4 py-2 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {subs.map((s) => (
                <tr key={s.moduleKey} className="border-t">
                  <td className="px-4 py-2 text-xs text-gray-600">{s.moduleKey}</td>
                  <td className="px-4 py-2">{s.isEnabled ? "Enabled" : "Disabled"}</td>
                </tr>
              ))}
              {!loading && subs.length === 0 && (
                <tr>
                  <td colSpan={2} className="px-4 py-6 text-center text-gray-500">No subscriptions found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
