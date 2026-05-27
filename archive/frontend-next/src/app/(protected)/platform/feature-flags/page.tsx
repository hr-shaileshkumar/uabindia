"use client";

import { useEffect, useState } from "react";
import { hrApi } from "@/lib/hrApi";

interface FlagRow {
  id: string;
  featureKey: string;
  isEnabled: boolean;
}

export default function FeatureFlagsPage() {
  const [flags, setFlags] = useState<FlagRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await hrApi.platform.featureFlags();
        setFlags(res.data || []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold">Feature Flags</h2>
        <p className="text-sm text-gray-500">Toggle feature availability per tenant.</p>
      </div>

      <div className="rounded-lg border bg-white">
        <div className="p-4 border-b text-sm text-gray-600">{loading ? "Loading..." : `${flags.length} flags`}</div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left">Key</th>
                <th className="px-4 py-2 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {flags.map((f) => (
                <tr key={f.id} className="border-t">
                  <td className="px-4 py-2">{f.featureKey}</td>
                  <td className="px-4 py-2">{f.isEnabled ? "Enabled" : "Disabled"}</td>
                </tr>
              ))}
              {!loading && flags.length === 0 && (
                <tr>
                  <td colSpan={2} className="px-4 py-6 text-center text-gray-500">No feature flags found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
