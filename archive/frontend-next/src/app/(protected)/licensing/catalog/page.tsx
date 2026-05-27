"use client";

import { useEffect, useState } from "react";
import { hrApi } from "@/lib/hrApi";

interface ModuleRow {
  key: string;
  name: string;
  isEnabled: boolean;
  version: string;
}

export default function ModuleCatalogPage() {
  const [modules, setModules] = useState<ModuleRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await hrApi.modules.catalog();
        setModules(res.data.modules || []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold">Module Catalog</h2>
        <p className="text-sm text-gray-500">All available ERP modules.</p>
      </div>

      <div className="rounded-lg border bg-white">
        <div className="p-4 border-b text-sm text-gray-600">{loading ? "Loading..." : `${modules.length} modules`}</div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left">Key</th>
                <th className="px-4 py-2 text-left">Name</th>
                <th className="px-4 py-2 text-left">Version</th>
                <th className="px-4 py-2 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {modules.map((m) => (
                <tr key={m.key} className="border-t">
                  <td className="px-4 py-2 text-xs text-gray-600">{m.key}</td>
                  <td className="px-4 py-2">{m.name}</td>
                  <td className="px-4 py-2">{m.version}</td>
                  <td className="px-4 py-2">{m.isEnabled ? "Enabled" : "Disabled"}</td>
                </tr>
              ))}
              {!loading && modules.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-gray-500">No modules found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
