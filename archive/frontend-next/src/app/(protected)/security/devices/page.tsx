"use client";

import { useEffect, useState } from "react";
import { hrApi } from "@/lib/hrApi";

interface SessionRow {
  id: string;
  deviceId: string;
  expiresAt: string;
  isRevoked: boolean;
}

export default function DeviceSessionsPage() {
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await hrApi.security.deviceSessions();
        setSessions(res.data.sessions || []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold">Device Sessions</h2>
        <p className="text-sm text-gray-500">Active devices and sessions per user.</p>
      </div>

      <div className="rounded-lg border bg-white">
        <div className="p-4 border-b text-sm text-gray-600">{loading ? "Loading..." : `${sessions.length} sessions`}</div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left">Device</th>
                <th className="px-4 py-2 text-left">Expires</th>
                <th className="px-4 py-2 text-left">Revoked</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => (
                <tr key={s.id} className="border-t">
                  <td className="px-4 py-2">{s.deviceId}</td>
                  <td className="px-4 py-2 text-xs text-gray-500">{new Date(s.expiresAt).toLocaleString()}</td>
                  <td className="px-4 py-2">{s.isRevoked ? "Yes" : "No"}</td>
                </tr>
              ))}
              {!loading && sessions.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-gray-500">No device sessions found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
