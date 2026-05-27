"use client";

import { useEffect, useState } from "react";
import { hrApi } from "@/lib/hrApi";

interface UserRow {
  id: string;
  fullName: string;
  email: string;
  isActive: boolean;
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await hrApi.platform.users();
        setUsers(res.data || []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold">Users</h2>
        <p className="text-sm text-gray-500">Manage application users and access.</p>
      </div>

      <div className="rounded-lg border bg-white">
        <div className="p-4 border-b text-sm text-gray-600">{loading ? "Loading..." : `${users.length} users`}</div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left">Name</th>
                <th className="px-4 py-2 text-left">Email</th>
                <th className="px-4 py-2 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t">
                  <td className="px-4 py-2">{u.fullName}</td>
                  <td className="px-4 py-2">{u.email}</td>
                  <td className="px-4 py-2">{u.isActive ? "Active" : "Inactive"}</td>
                </tr>
              ))}
              {!loading && users.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-gray-500">No users found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
