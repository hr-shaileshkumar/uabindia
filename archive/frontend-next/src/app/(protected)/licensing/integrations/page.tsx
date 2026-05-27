"use client";

import { useEffect, useState } from "react";
import { hrApi } from "@/lib/hrApi";

interface ApiKeyRow {
  name: string;
  prefix: string;
  isActive: boolean;
  createdAt: string;
}

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKeyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await hrApi.licensing.apiKeys();
        setKeys(res.data.apiKeys || []);
      } catch (err: any) {
        console.error("Failed to load API keys:", err);
        setError(err?.response?.data?.message || "Failed to load API keys");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold">API Keys / Integrations</h2>
        <p className="text-sm text-gray-500">Manage API keys for external integrations.</p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="rounded-lg border bg-white">
        <div className="p-4 border-b text-sm text-gray-600">{loading ? "Loading..." : `${keys.length} keys`}</div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left">Name</th>
                <th className="px-4 py-2 text-left">Prefix</th>
                <th className="px-4 py-2 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {keys.map((k) => (
                <tr key={k.prefix} className="border-t">
                  <td className="px-4 py-2">{k.name}</td>
                  <td className="px-4 py-2 text-xs text-gray-500">{k.prefix}</td>
                  <td className="px-4 py-2">{k.isActive ? "Active" : "Inactive"}</td>
                </tr>
              ))}
              {!loading && keys.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-gray-500">No API keys found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
