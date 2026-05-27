"use client";

import { useEffect, useState } from "react";
import { hrApi } from "@/lib/hrApi";

interface RoleRow {
  id: string;
  name: string;
  description?: string;
}

export default function RolesPage() {
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await hrApi.platform.roles();
        setRoles(res.data.roles || []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold">Roles & Policies</h2>
        <p className="text-sm text-gray-500">RBAC roles and access policies.</p>
      </div>

      <div className="rounded-lg border bg-white">
        <div className="p-4 border-b text-sm text-gray-600">{loading ? "Loading..." : `${roles.length} roles`}</div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left">Role</th>
                <th className="px-4 py-2 text-left">Description</th>
              </tr>
            </thead>
            <tbody>
              {roles.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="px-4 py-2">{r.name}</td>
                  <td className="px-4 py-2 text-gray-500">{r.description || "-"}</td>
                </tr>
              ))}
              {!loading && roles.length === 0 && (
                <tr>
                  <td colSpan={2} className="px-4 py-6 text-center text-gray-500">No roles found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
